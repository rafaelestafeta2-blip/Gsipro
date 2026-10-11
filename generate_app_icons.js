import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const iconSvg = fs.readFileSync('instachat_icon.svg');
const foregroundSvg = fs.readFileSync('instachat_foreground.svg');

const densities = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 }
];

async function generate() {
  console.log('Generating INSTA CHAT Android Launcher Icons with sharp...');

  for (const { dir, size } of densities) {
    const targetDir = path.join('android', 'app', 'src', 'main', 'res', dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const iconPath = path.join(targetDir, 'ic_launcher.png');
    const roundPath = path.join(targetDir, 'ic_launcher_round.png');
    const fgPath = path.join(targetDir, 'ic_launcher_foreground.png');

    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(iconPath);

    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(roundPath);

    await sharp(foregroundSvg)
      .resize(size, size)
      .png()
      .toFile(fgPath);

    console.log(`✓ Generated ${size}x${size} in ${dir}`);
  }

  console.log('All Android Launcher Icons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
