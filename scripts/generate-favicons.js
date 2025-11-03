const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImage = path.join(__dirname, '../public/images/preview-image.png');
const outputDir = path.join(__dirname, '../public');

// Favicon sizes to generate
const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' }
];

async function generateFavicons() {
  console.log('Generating favicons...');
  
  for (const { size, name } of sizes) {
    await sharp(inputImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, name));
    console.log(`✓ Generated ${name}`);
  }
  
  // Generate favicon.ico (16x16 and 32x32 combined)
  console.log('✓ Generated all favicons!');
  console.log('\nNote: For favicon.ico, you can use an online tool like:');
  console.log('https://www.favicon-generator.org/');
  console.log('Upload the favicon-32x32.png file to generate favicon.ico');
}

generateFavicons().catch(console.error);
