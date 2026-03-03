const sharp = require('sharp');
const path = require('path');

const imageDir = path.join(__dirname, '../public/images');
const placeholders = [
  { name: 'package-delivery', text: 'Package Delivery' },
  { name: 'document-transfer', text: 'Document Transfer' }
];

async function createPlaceholder({ name, text }) {
  const output = path.join(imageDir, `${name}.webp`);
  const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f0f0" />
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#333" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;
  try {
    await sharp(Buffer.from(svg))
      .webp({ quality: 80 })
      .toFile(output);
    console.log(`Generated placeholder ${output}`);
  } catch (err) {
    console.error(`Error generating placeholder for ${name}:`, err);
  }
}

(async () => {
  for (const placeholder of placeholders) {
    await createPlaceholder(placeholder);
  }
  console.log('Placeholder generation complete');
})();
