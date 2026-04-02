/**
 * Calculate total cost of a recipe based on current ingredient prices.
 * @param {Array} recipeIngredients - [{ingredientId, quantity}]
 * @param {Object} ingredientMap - {id: ingredient}
 */
export function calcRecipeCost(recipeIngredients, ingredientMap) {
  if (!recipeIngredients?.length) return 0
  return recipeIngredients.reduce((total, item) => {
    const ing = ingredientMap[item.ingredientId]
    if (!ing) return total
    return total + ing.pricePerUnit * item.quantity
  }, 0)
}

/**
 * Calculate suggested selling price using markup.
 * selling price = cost × (1 + markup/100)
 */
export function calcSuggestedPrice(cost, marginPercent) {
  return cost * (1 + marginPercent / 100)
}

/**
 * Calculate profit for a set of sold orders.
 */
export function calcProfitStats(soldOrders) {
  const revenue = soldOrders.reduce((s, o) => s + (o.totalPrice || 0), 0)
  const cost = soldOrders.reduce((s, o) => s + (o.totalCost || 0), 0)
  const profit = revenue - cost
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0
  return { revenue, cost, profit, margin }
}

/**
 * Format a number as currency.
 */
export function fmtCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

/**
 * Format a date string to a readable format.
 */
export function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function fmtDateShort(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('tr-TR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr))
}

/** Supported units */
export const UNITS = [
  { value: 'g', label: 'g (gram)' },
  { value: 'kg', label: 'kg (kilogram)' },
  { value: 'ml', label: 'ml (mililitre)' },
  { value: 'L', label: 'L (litre)' },
  { value: 'oz', label: 'oz (ons)' },
  { value: 'lb', label: 'lb (libre)' },
  { value: 'cup', label: 'su bardağı' },
  { value: 'tbsp', label: 'yemek kaşığı' },
  { value: 'tsp', label: 'çay kaşığı' },
  { value: 'piece', label: 'adet' },
  { value: 'dozen', label: 'düzine' },
  { value: 'pack', label: 'paket' },
]

export const CURRENCIES = [
  { value: 'TRY', label: 'TRY – Türk Lirası' },
  { value: 'USD', label: 'USD – Amerikan Doları' },
  { value: 'EUR', label: 'EUR – Euro' },
  { value: 'GBP', label: 'GBP – İngiliz Sterlini' },
  { value: 'SAR', label: 'SAR – Suudi Riyali' },
  { value: 'AED', label: 'AED – BAE Dirhemi' },
]
