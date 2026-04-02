/**
 * Run with: node scripts/generate-icons.js
 * Requires: npm install canvas (optional - only needed to generate PNG icons)
 *
 * This script generates PNG icons from the SVG source.
 * If you don't have the `canvas` package, copy icon.svg manually
 * and convert to PNG using any image editor or online tool.
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

async function generate() {
  try {
    const { createCanvas, loadImage } = await import('canvas')

    const svgPath = join(root, 'public', 'icon.svg')
    const svgContent = readFileSync(svgPath)
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)

    for (const size of [192, 512]) {
      const canvas = createCanvas(size, size)
      const ctx = canvas.getContext('2d')
      const img = await loadImage(svgPath)
      ctx.drawImage(img, 0, 0, size, size)
      const out = canvas.toBuffer('image/png')
      writeFileSync(join(root, 'public', `icon-${size}.png`), out)
      console.log(`✓ Generated icon-${size}.png`)
    }
  } catch (e) {
    console.log('canvas package not available. Generating placeholder icons.')
    console.log('To generate proper icons, install canvas: npm install canvas')
    console.log('Or convert public/icon.svg to PNG manually.')

    // Create minimal valid 1x1 placeholder PNGs so the build doesn't fail
    // These are actual valid PNG files (1px transparent)
    const placeholder = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000020001e221bc330000000049454e44ae426082',
      'hex'
    )
    writeFileSync(join(root, 'public', 'icon-192.png'), placeholder)
    writeFileSync(join(root, 'public', 'icon-512.png'), placeholder)
    writeFileSync(join(root, 'public', 'apple-touch-icon.png'), placeholder)
    console.log('Created placeholder PNG files. Replace with real icons for production.')
  }
}

generate()
