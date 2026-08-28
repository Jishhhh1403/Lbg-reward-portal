import time
import threading


class SDUICache:
    """In-memory per-customer SDUI cache with TTL auto-expiry."""

    def __init__(self, ttl_seconds: int = 3600):
        self._store: dict[str, tuple[float, dict]] = {}
        self._ttl = ttl_seconds
        self._lock = threading.Lock()

    def get(self, customer_id: str) -> dict | None:
        with self._lock:
            entry = self._store.get(customer_id)
            if entry is None:
                return None
            timestamp, data = entry
            if time.time() - timestamp > self._ttl:
                del self._store[customer_id]
                return None
            return data

    def set(self, customer_id: str, data: dict) -> None:
        with self._lock:
            self._store[customer_id] = (time.time(), data)

    def invalidate(self, customer_id: str) -> bool:
        with self._lock:
            return self._store.pop(customer_id, None) is not None

    def invalidate_all(self) -> int:
        with self._lock:
            count = len(self._store)
            self._store.clear()
            return count

    def stats(self) -> dict:
        with self._lock:
            now = time.time()
            active = sum(
                1 for ts, _ in self._store.values()
                if now - ts <= self._ttl
            )
            return {
                "total_entries": len(self._store),
                "active_entries": active,
                "expired_pending_cleanup": len(self._store) - active,
                "ttl_seconds": self._ttl,
            }
