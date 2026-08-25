from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq


QUOTA_MARKERS = (
    "429",
    "quota",
    "resource_exhausted",
    "resourceexhausted",
    "rate limit",
    "rate_limit",
    "ratelimit",
    "too many requests",
)

TPM_MARKERS = (
    "tokens per minute",
    "tpm",
    "413",
    "request too large",
)

GROQ_TOKEN_BUDGET = 7900


def _estimate_tokens(messages) -> int:
    total = 0
    for m in messages:
        content = m.get("content") if isinstance(m, dict) else getattr(m, "content", "")
        total += len(str(content or ""))
    return total // 4


class QuotaFailoverLLM:
    """Routes LLM calls through Gemini keys, failing over to Groq on quota exhaustion.

    Failover chain: Gemini Key 1 → Gemini Key 2 → Groq.
    Once a Gemini key exhausts its quota, the router sticks to the next key for
    the rest of this run. When all Gemini keys are exhausted, Groq becomes the
    provider. Groq calls get a dynamic max_tokens so prompt + completion stays
    under the free-tier TPM cap.
    """

    def __init__(self, gemini_api_keys: list[str] | None = None, groq_api_key: str = "", groq_model: str = ""):
        if gemini_api_keys is None:
            gemini_api_keys = []

        self._gemini_providers: list[ChatGoogleGenerativeAI] = []
        for key in gemini_api_keys:
            if not key:
                continue
            try:
                self._gemini_providers.append(
                    ChatGoogleGenerativeAI(
                        model="gemini-3.5-flash-lite",
                        google_api_key=key,
                        temperature=0.3,
                        max_tokens=8192,
                        max_retries=1,
                    )
                )
            except Exception:
                continue

        self._groq_provider = None
        if groq_api_key:
            try:
                self._groq_provider = ChatGroq(
                    model=groq_model or "openai/gpt-oss-120b",
                    api_key=groq_api_key,
                    temperature=0.3,
                    max_tokens=6500,
                    reasoning_effort="low",
                )
            except TypeError:
                self._groq_provider = ChatGroq(
                    model=groq_model or "openai/gpt-oss-120b",
                    api_key=groq_api_key,
                    temperature=0.3,
                    max_tokens=6500,
                )

        self._current_gemini_index = 0
        self._use_gemini = bool(self._gemini_providers)
        self.compact_mode = False
        self.active_provider = "gemini" if self._gemini_providers else "none"

    @property
    def failover_available(self) -> bool:
        return self._groq_provider is not None

    @staticmethod
    def _contains(error: Exception, markers) -> bool:
        text = str(error).lower()
        return any(marker in text for marker in markers)

    def _invoke_groq_with_retry(self, messages):
        """Groq free tier enforces a rolling 8k tokens-per-minute window shared by
        prompt+completion; back off and retry when we trip it."""
        last_error = None
        for attempt in range(4):
            est = _estimate_tokens(messages)
            budget = max(1200, min(7000, GROQ_TOKEN_BUDGET - est))
            try:
                return self._groq_provider.invoke(messages, max_tokens=budget)
            except Exception as e:
                recoverable = self._contains(e, TPM_MARKERS) or self._contains(e, QUOTA_MARKERS)
                if not recoverable:
                    raise
                last_error = e
                wait = 25 * (attempt + 1)
                print(f"[LLM FAILOVER] Groq token limit hit ({type(e).__name__}), waiting {wait}s before retry {attempt + 2}/4")
                import time
                time.sleep(wait)
        raise last_error

    def _try_gemini_keys(self, messages, **kwargs):
        """Attempt Gemini keys in order. Returns response on success or
        raises the last quota error when all keys are exhausted."""
        last_quota_error = None

        while self._current_gemini_index < len(self._gemini_providers):
            provider = self._gemini_providers[self._current_gemini_index]
            key_label = f"Gemini Key {self._current_gemini_index + 1}"
            try:
                response = provider.invoke(messages, **kwargs)
                self.active_provider = "gemini"
                self.compact_mode = False
                print(f"[LLM] Served by {key_label}")
                return response
            except Exception as e:
                if not self._is_quota_error(e):
                    raise
                print(f"[LLM FAILOVER] {key_label} quota/rate-limit hit ({type(e).__name__})")
                last_quota_error = e
                self._current_gemini_index += 1

        raise last_quota_error

    def invoke(self, messages, **kwargs):
        if self._use_gemini and self._current_gemini_index < len(self._gemini_providers):
            try:
                return self._try_gemini_keys(messages, **kwargs)
            except Exception:
                if not self.failover_available:
                    print("[LLM FAILOVER] All Gemini keys exhausted and no GROQ_API_KEY configured")
                    raise
                print(f"[LLM FAILOVER] All Gemini keys exhausted, switching to Groq for the rest of this run")
                self._use_gemini = False

        if self.failover_available:
            response = self._invoke_groq_with_retry(messages)
            self.active_provider = "groq"
            self.compact_mode = True
            return response

        if not self._gemini_providers:
            raise RuntimeError("No LLM providers configured — set at least one GEMINI_API_KEY or GROQ_API_KEY")
        raise RuntimeError("All LLM providers exhausted for this request")

    def _is_quota_error(self, error: Exception) -> bool:
        return self._contains(error, QUOTA_MARKERS)


def build_failover_llm(
    gemini_api_keys: list[str] | None = None,
    groq_api_key: str = "",
    groq_model: str = "",
) -> QuotaFailoverLLM:
    return QuotaFailoverLLM(
        gemini_api_keys=gemini_api_keys or [],
        groq_api_key=groq_api_key,
        groq_model=groq_model,
    )
