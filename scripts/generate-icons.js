/**
 * Run with: node scripts/generate-icons.js
 * Requires: @resvg/resvg-js (already in devDependencies)
 *
 * Generates PNG icons from public/icon.svg.
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const svg = readFileSync(join(root, 'public', 'icon.svg'), 'utf-8')

const icons = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
]

for (const { size, name } of icons) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  writeFileSync(join(root, 'public', name), png)
  console.log(`✓ Generated ${name} (${size}x${size})`)
}
