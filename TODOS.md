# Dulci — Development TODOs

---

## 🔴 High Priority

### [TODO] Product Picker — Link Ingredients to Real Store Products

**Problem with current approach:**
The current "Fiyatları Güncelle" button searches by ingredient name (e.g. "un") and picks the first result. This is unreliable — name matching is fuzzy, and the wrong product can be selected (e.g. "un" might match a cleaning product instead of wheat flour).

**Proposed solution:**
Instead of auto-picking from a name search, open an **in-app product browser** for each ingredient. The user browses real search results, selects the exact matching product once, and that selection is saved. Future auto-updates fetch from the saved product directly — no guessing.

---

**User flow:**

1. User opens Settings → "Fiyatları Güncelle"
2. Next to each ingredient, there is a "Bağla" (Link) button
3. Clicking "Bağla" opens a **Product Picker Modal** that:
   - Shows a search input (pre-filled with the ingredient name)
   - Displays real product cards fetched from the selected store (Migros / Altınogulları)
   - Each card shows: product image, name, price, unit size
   - User taps the correct product → it gets linked to the ingredient
4. The ingredient now stores: `linkedProducts.migros = { productId, productUrl, productName, lastPrice, lastFetched }`
5. On future "Fiyatları Güncelle" → auto-fetches from the saved product URL, no picker needed

---

**Implementation plan:**

**Step 1 — Database change (`src/db/database.js`):**
Add `linkedProducts` field to ingredients:
```js
// ingredient.linkedProducts shape:
{
  migros: {
    productId: string,       // e.g. Migros internal product ID
    productUrl: string,      // direct product page URL
    productName: string,     // e.g. "Migros Un 1 kg"
    lastPrice: number,
    lastFetched: ISO string,
  },
  altinogullari: { ... }
}
```

**Step 2 — Price service (`src/utils/priceService.js`):**
Add two new functions:
```js
// Search and return multiple products (for the picker UI)
fetchProductSearch(query, storeId) → [{ productId, productUrl, name, price, imageUrl, unit }]

// Fetch current price from a saved product URL (for auto-update)
fetchProductPrice(productUrl, storeId) → { price, name }
```

For Migros:
- Search: parse `__NEXT_DATA__` products array (already done) — return top 8 results instead of just first
- Direct fetch: fetch the product detail page URL and parse price

For Altınogulları:
- Search: scrape product listing HTML, extract product cards
- Direct fetch: fetch saved product URL, parse current price

**Step 3 — Product Picker Modal (new component `src/components/ProductPickerModal.jsx`):**
```
┌─────────────────────────────────────┐
│  "Un" için ürün seç — Migros        │
│  ┌──────────────────────────────┐   │
│  │ 🔍  un                       │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌─────┬──────────────────────────┐ │
│  │ img │ Migros Un 1 kg          │ │
│  │     │ ₺ 34,90  · 1 kg         │ │
│  │     │            [Seç]        │ │
│  ├─────┼──────────────────────────┤ │
│  │ img │ Gözde Un 5 kg           │ │
│  │     │ ₺ 145,00  · 5 kg        │ │
│  │     │            [Seç]        │ │
│  └─────┴──────────────────────────┘ │
│                                     │
│  [İptal]                            │
└─────────────────────────────────────┘
```

**Step 4 — Update BulkPriceModal (`src/views/Settings.jsx`):**
- If ingredient has a linked product → show green "linked" badge + product name
- "Tümünü Güncelle" button re-fetches price from all saved product URLs (fast, accurate)
- "Bağla / Değiştir" button opens ProductPickerModal for that ingredient
- If not linked → show "Bağla" button, falls back to name search

**Step 5 — Auto-update logic:**
```js
async function fetchPriceForIngredient(ingredient, storeId) {
  const linked = ingredient.linkedProducts?.[storeId]
  if (linked?.productUrl) {
    // Fast path: direct URL fetch
    return fetchProductPrice(linked.productUrl, storeId)
  } else {
    // Slow path: name search + guess
    return fetchIngredientPrice(ingredient.name, storeId)
  }
}
```

---

**Notes:**
- Product picker needs pagination or "Daha fazla yükle" if first page doesn't have the right product
- Consider caching search results in memory for the duration of the modal session
- The picker should work per-store — user might link ingredient A to Migros and ingredient B to Altınogulları
- Migros product images are available via their CDN if the product data includes an image URL

---

## 🟡 Medium Priority

### [TODO] PWA Icons — Replace Placeholder PNGs
The `public/icon-192.png` and `public/icon-512.png` are 1px placeholder files.
To generate proper icons from `public/icon.svg`:
```bash
npm install canvas
node scripts/generate-icons.js
```
Or convert `public/icon.svg` to PNG using any image editor.

---

### [TODO] Export Data
Allow the user to export all data (ingredients, recipes, orders) as a JSON file for backup.
Also allow importing from a previously exported JSON file.
Add to Settings → "Veriler" section.

---

### [TODO] Order Customer Name
Add an optional `customerName` field to orders so the shop owner can track which customer ordered what.
Small change: add a "Müşteri adı" input to the New Order form in `src/views/Orders.jsx`.

---

## 🟢 Nice to Have

### [TODO] Recipe Scaling
In the recipe detail modal, add a "Ölçek" (scale) multiplier input (e.g. ×2, ×0.5) that recalculates ingredient quantities and total cost without modifying the saved recipe.

### [TODO] Low Stock Alerts
Track ingredient stock quantities alongside prices. Warn the user when an ingredient is running low based on recent order consumption.

### [TODO] Sales Chart
Add a simple bar or line chart on the Dashboard showing daily/weekly revenue over the last 30 days. Use a lightweight charting library (e.g. `recharts` or plain SVG).
