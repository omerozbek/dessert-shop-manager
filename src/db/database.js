import Dexie from 'dexie'

export const db = new Dexie('DulciDB')

db.version(1).stores({
  // ingredients: id, name, unit, pricePerUnit, priceHistory (JSON array)
  ingredients: '++id, name, unit',
  // recipes: id, name, ingredients (JSON array of {ingredientId, quantity}), notes
  recipes: '++id, name',
  // orders: id, createdAt, status, items (JSON array of snapshots), totalPrice, totalCost, notes
  orders: '++id, status, createdAt',
  // settings: key-value store
  settings: 'key',
})

// Seed default settings on first run
db.on('ready', async () => {
  const count = await db.settings.count()
  if (count === 0) {
    await db.settings.bulkPut([
      { key: 'profitMargin', value: 30 },
      { key: 'autoFetchPrices', value: false },
      { key: 'selectedStores', value: [] },
      { key: 'currency', value: 'TRY' },
      { key: 'lastPriceFetch', value: null },
    ])
  }
})

// ─── Settings Helpers ───────────────────────────────────────────────────────

export async function getSetting(key) {
  const row = await db.settings.get(key)
  return row ? row.value : null
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

// ─── Ingredient Helpers ──────────────────────────────────────────────────────

export async function addIngredient({ name, unit, pricePerUnit }) {
  const now = new Date().toISOString()
  return db.ingredients.add({
    name: name.trim(),
    unit,
    pricePerUnit: Number(pricePerUnit),
    priceHistory: [{ price: Number(pricePerUnit), date: now }],
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateIngredient(id, { name, unit, pricePerUnit }) {
  const existing = await db.ingredients.get(id)
  if (!existing) return
  const now = new Date().toISOString()
  const newPrice = Number(pricePerUnit)
  const history = existing.priceHistory || []

  const updatedHistory =
    history.length === 0 || history[history.length - 1].price !== newPrice
      ? [...history, { price: newPrice, date: now }]
      : history

  return db.ingredients.update(id, {
    name: name.trim(),
    unit,
    pricePerUnit: newPrice,
    priceHistory: updatedHistory,
    updatedAt: now,
  })
}

export async function deleteIngredient(id) {
  return db.ingredients.delete(id)
}

// ─── Recipe Helpers ───────────────────────────────────────────────────────────

export async function addRecipe({ name, ingredients, notes }) {
  const now = new Date().toISOString()
  return db.recipes.add({
    name: name.trim(),
    ingredients: ingredients || [],
    notes: notes || '',
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateRecipe(id, { name, ingredients, notes }) {
  return db.recipes.update(id, {
    name: name.trim(),
    ingredients: ingredients || [],
    notes: notes || '',
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteRecipe(id) {
  return db.recipes.delete(id)
}

// ─── Order Helpers ─────────────────────────────────────────────────────────────

/**
 * Create an order with price/cost snapshots locked at creation time.
 * items: [{recipeId, recipeName, quantity, pricePerUnit, costPerUnit}]
 */
export async function addOrder({ items, notes }) {
  const now = new Date().toISOString()
  const totalPrice = items.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0)
  const totalCost = items.reduce((s, i) => s + i.costPerUnit * i.quantity, 0)

  return db.orders.add({
    items,
    totalPrice,
    totalCost,
    notes: notes || '',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateOrderStatus(id, status) {
  return db.orders.update(id, {
    status,
    updatedAt: new Date().toISOString(),
    ...(status === 'sold' ? { soldAt: new Date().toISOString() } : {}),
  })
}

export async function deleteOrder(id) {
  return db.orders.delete(id)
}
