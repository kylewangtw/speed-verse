const fs = require('fs');
const path = require('path');

// Create a simple PNG icon using Node.js
// Since we don't have canvas in Node by default, we'll create a data URL approach

const createSVGIcon = (size) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#1a1a2e"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="#0f0f1a" stroke="#00d4ff" stroke-width="${size * 0.025}"/>
  <text x="${size/2}" y="${size/2 + size * 0.1}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${size * 0.3}" font-weight="800" fill="#00d4ff">SV</text>
</svg>`;
};

// Save SVG files that can be used as icons
const sizes = [192, 512];
const iconsDir = path.join(__dirname, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = `icon-${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Created ${filename}`);
});

console.log('\nNote: For Android PWA support, you need actual PNG files.');
console.log('Please use an online converter or the generate-icons.html page to create PNGs.');

