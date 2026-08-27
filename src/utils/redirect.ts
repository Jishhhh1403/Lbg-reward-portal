export interface RedirectContext {
  name: string
  phone?: string
}

const ALPHAMEDICOL_BRAND_ID = 'brd_alphamedicol'
const ALPHAMEDICOL_BASE = 'http://localhost:5174'

/**
 * Build the URL used when leaving the portal for a partner brand.
 *
 * AlphaMedicol is a local micro-app (port 5174) that deep-links straight into
 * its dashboard using the current customer identity. Every other brand uses its
 * configured `redirectUrl` (or falls back to the brand's own website).
 *
 * Returns `null` when the brand has no usable destination, so callers can avoid
 * navigating to a fabricated URL (which would produce a "not found" page).
 */
export function buildBrandRedirectUrl(
  brandId: string,
  brandName: string,
  redirectUrl: string | undefined,
  ctx: RedirectContext,
): string | null {
  if (brandId === ALPHAMEDICOL_BRAND_ID) {
    const params = new URLSearchParams()
    if (ctx.name) params.set('customerName', ctx.name)
    if (ctx.phone) params.set('customerPhone', ctx.phone)
    const qs = params.toString()
    return qs ? `${ALPHAMEDICOL_BASE}/?${qs}` : ALPHAMEDICOL_BASE
  }

  if (redirectUrl) return redirectUrl

  const slug = brandName.toLowerCase().replace(/[^a-z0-9]/g, '')
  return slug ? `https://www.${slug}.com` : null
}
