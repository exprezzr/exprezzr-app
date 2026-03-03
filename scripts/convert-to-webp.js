const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, '../public/images');

async function convertFile(file) {
  const input = path.join(imageDir, file);
  const ext = path.extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;

  const output = path.join(imageDir, `${path.basename(file, ext)}.webp`);
  try {
    await sharp(input)
      .webp({ quality: 80 })
      .toFile(output);
    console.log(`Converted ${file} -> ${path.basename(output)}`);
  } catch (err) {
    console.error(`Error converting ${file}:`, err);
  }
}

fs.readdir(imageDir, (err, files) => {
  if (err) {
    console.error('Could not list the directory.', err);
    process.exit(1);
  }

  Promise.all(files.map(convertFile))
    .then(() => console.log('All conversions complete'))
    .catch((err) => console.error('Error during conversion', err));
});
