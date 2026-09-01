import type { ObjectiveGenerateRequest, ObjectiveGenerateResponsePayload } from '../types/objective-sdui'

/**
 * Generates content for a single stage of the Objective Workspace wizard at
 * runtime. Mirrors the middleware's `/objective/generate` endpoint.
 */
export async function generateObjectiveStage(
  req: ObjectiveGenerateRequest,
): Promise<ObjectiveGenerateResponsePayload> {
  const MIDDLEWARE_BASE_URL: string =
    import.meta.env.VITE_CEAEI_API_URL ?? 'http://localhost:8004'

  const res = await fetch(`${MIDDLEWARE_BASE_URL}/objective/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    throw new Error(`Objective generation failed with status ${res.status}`)
  }

  return (await res.json()) as ObjectiveGenerateResponsePayload
}