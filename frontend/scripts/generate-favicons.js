/**
 * Generate favicon PNG files from SVG
 * 
 * This script requires sharp to be installed:
 * npm install --save-dev sharp
 * 
 * Usage: node scripts/generate-favicons.js
 */

const fs = require('fs')
const path = require('path')

// Check if sharp is available
let sharp
try {
  sharp = require('sharp')
} catch (e) {
  console.error('Error: sharp is not installed. Run: npm install --save-dev sharp')
  process.exit(1)
}

const publicDir = path.join(__dirname, '..', 'public')
const svgPath = path.join(publicDir, 'icon.svg')

// Sizes to generate
const sizes = [
  { name: 'icon-light-32x32.png', size: 32 },
  { name: 'icon-dark-32x32.png', size: 32 },
  { name: 'apple-icon.png', size: 180 },
]

async function generateFavicons() {
  if (!fs.existsSync(svgPath)) {
    console.error(`Error: ${svgPath} not found`)
    process.exit(1)
  }

  const svgBuffer = fs.readFileSync(svgPath)

  for (const { name, size } of sizes) {
    try {
      // For dark icon, we'll use a dark background variant
      const isDark = name.includes('dark')
      
      let image = sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: isDark ? { r: 0, g: 0, b: 0, alpha: 1 } : { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()

      // For dark variant, we need to modify the SVG to have dark background
      if (isDark) {
        // Create a modified SVG with dark background
        const svgContent = svgBuffer.toString()
        const darkSvg = svgContent.replace('fill="#10b981"', 'fill="#10b981"').replace('fill="white"', 'fill="white"')
        // Add dark background rect
        const darkSvgWithBg = svgContent.replace(
          '<rect width="180" height="180" rx="24" fill="#10b981"/>',
          '<rect width="180" height="180" rx="24" fill="#18181b"/><rect x="20" y="20" width="140" height="140" rx="16" fill="#10b981"/>'
        )
        image = sharp(Buffer.from(darkSvgWithBg))
          .resize(size, size)
          .png()
      }

      const outputPath = path.join(publicDir, name)
      await image.toFile(outputPath)
      console.log(`✓ Generated ${name} (${size}x${size})`)
    } catch (error) {
      console.error(`Error generating ${name}:`, error)
    }
  }

  console.log('\n✓ All favicons generated successfully!')
}

generateFavicons().catch(console.error)

