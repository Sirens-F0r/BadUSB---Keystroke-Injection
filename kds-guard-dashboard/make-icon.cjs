const fs = require('fs');
const path = require('path');

// Create a shield icon PNG using pure Buffer data (16x16 RGBA)
// Shield SVG: teal shield shape
const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#A9DFD8">
  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
</svg>`;

fs.writeFileSync(
  path.join(__dirname, 'public', 'electron-icon.svg'),
  svgData
);
console.log('Created: public/electron-icon.svg');

// Create a minimal 256x256 PNG for ICO conversion
// PNG header + IHDR + IDAT + IEND for a 256x256 teal shield
const size = 256;
const { createCanvas } = require('canvas');