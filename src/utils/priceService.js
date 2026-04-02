/**
 * Fetch ingredient prices from Turkish grocery sites via CORS proxy.
 *
 * Browser → api.allorigins.win (CORS proxy) → target site → response back
 *
 * Current approach: search by ingredient name → pick first result.
 * This is a best-effort guess and can be inaccurate.
 *
 * TODO (see TODOS.md → "Product Picker"):
 *   Replace name-based guessing with a two-step flow:
 *   1. fetchProductSearch(query, storeId) → return top N results for the user to pick from
 *   2. fetchProductPrice(productUrl, storeId) → fetch price from a saved product URL directly
 *   The ingredient stores a `linkedProducts` map so future auto-updates go straight
 *   to the exact product page — much faster and more accurate.
 *
 * Supported stores: migros, altinogullari
 * Limitations:
 *  - allorigins.win can be slow or occasionally down
 *  - Migros: parses Next.js __NEXT_DATA__ JSON (reliable as long as Migros keeps SSR)
 *  - Altınogulları: JSON-LD → HTML regex fallback (may need updates if site changes)
 */

const PROXY = 'https://api.allorigins.win/get?url='

async function proxiedFetch(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 14000)
  try {
    const res = await fetch(PROXY + encodeURIComponent(url), { signal: controller.signal })
    if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`)
    const data = await res.json()
    if (!data.contents) throw new Error('Boş yanıt')
    return data.contents
  } finally {
    clearTimeout(timeout)
  }
}

// ─── Migros ───────────────────────────────────────────────────────────────────
// migros.com.tr is a Next.js app — SSR injects __NEXT_DATA__ script tag with
// full product data, so we don't need to scrape visual HTML.

async function fetchMigrosPrice(query) {
  const html = await proxiedFetch(
    `https://www.migros.com.tr/arama?q=${encodeURIComponent(query)}`
  )

  // Extract the embedded JSON bundle
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/
  )
  if (!match) throw new Error('Migros: sayfa yapısı değişmiş olabilir')

  let nextData
  try { nextData = JSON.parse(match[1]) } catch { throw new Error('Migros: JSON ayrıştırılamadı') }

  // Migros has restructured their state several times — try all known paths
  const state = nextData?.props?.pageProps?.initialState
  const items =
    state?.search?.productList?.items ||
    state?.search?.storeProductInfos ||
    nextData?.props?.pageProps?.searchResult?.products ||
    nextData?.props?.pageProps?.products ||
    []

  if (items.length === 0) return null

  const p = items[0]
  // Price field names have varied across Migros deployments
  const rawPrice =
    p?.salePrice ?? p?.price ?? p?.regularPrice ?? p?.listPrice ?? p?.unitPrice
  if (rawPrice == null) return null

  const price = parseFloat(String(rawPrice).replace(',', '.'))
  if (isNaN(price)) return null

  return {
    price,
    productName: p?.name || p?.displayName || query,
    unit: p?.unitText || p?.unitOfMeasure || '',
  }
}

// ─── Altınogulları ─────────────────────────────────────────────────────────────
// Traditional server-rendered site — we scrape price from HTML.

async function fetchAltinogullariPrice(query) {
  const html = await proxiedFetch(
    `https://www.altinogullari.com/arama?kelime=${encodeURIComponent(query)}`
  )

  // Try JSON-LD structured data first (most reliable)
  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
  if (ldMatch) {
    for (const block of ldMatch) {
      try {
        const inner = block.replace(/<\/?script[^>]*>/gi, '')
        const json = JSON.parse(inner)
        const items = Array.isArray(json) ? json : [json]
        for (const item of items) {
          const price =
            item?.offers?.price ??
            item?.offers?.[0]?.price ??
            item?.price
          if (price != null) {
            const parsed = parseFloat(String(price).replace(',', '.'))
            if (!isNaN(parsed) && parsed > 0)
              return { price: parsed, productName: item?.name || query, unit: '' }
          }
        }
      } catch {}
    }
  }

  // Fallback: common HTML price patterns used by Turkish e-commerce
  const patterns = [
    /data-price="([\d.,]+)"/,
    /itemprop="price"[^>]*content="([\d.,]+)"/,
    /class="[^"]*(?:fiyat|price|amount)[^"]*"[^>]*>\s*(?:₺\s*)?([\d.]+(?:,\d+)?)/i,
    /"price"\s*:\s*"?([\d.,]+)"?/,
    /"fiyat"\s*:\s*"?([\d.,]+)"?/,
  ]

  for (const re of patterns) {
    const m = html.match(re)
    if (m) {
      const price = parseFloat(m[1].replace(',', '.'))
      if (!isNaN(price) && price > 0) return { price, productName: query, unit: '' }
    }
  }

  return null
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const STORE_OPTIONS = [
  { id: 'migros', label: 'Migros', baseUrl: 'https://www.migros.com.tr' },
  { id: 'altinogullari', label: 'Altınogulları', baseUrl: 'https://www.altinogullari.com' },
]

/**
 * Fetch the best-matching price for `ingredientName` from the given store.
 * Returns { price: number, productName: string, unit: string } or null if not found.
 * Throws on network / parse errors.
 */
export async function fetchIngredientPrice(ingredientName, storeId) {
  switch (storeId) {
    case 'migros':        return fetchMigrosPrice(ingredientName)
    case 'altinogullari': return fetchAltinogullariPrice(ingredientName)
    default: throw new Error('Bilinmeyen mağaza')
  }
}
