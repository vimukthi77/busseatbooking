// scripts/generate-font.js
const fs = require('fs');
const path = require('path');

// Download Noto Sans Sinhala Regular font from Google Fonts
// https://fonts.google.com/noto/specimen/Noto+Sans+Sinhala
// Or use: https://github.com/googlefonts/noto-fonts/tree/main/hinted/ttf/NotoSansSinhala

const fontPath = path.join(__dirname, 'NotoSansSinhala-Regular.ttf');

if (fs.existsSync(fontPath)) {
  const fontData = fs.readFileSync(fontPath);
  const base64Font = fontData.toString('base64');
  
  // Save to a separate file
  const outputPath = path.join(__dirname, 'sinhala-font-base64.txt');
  fs.writeFileSync(outputPath, base64Font);
  
  console.log('✅ Font converted to base64 successfully!');
  console.log(`📁 Saved to: ${outputPath}`);
  console.log(`📊 Size: ${(base64Font.length / 1024 / 1024).toFixed(2)} MB`);
} else {
  console.error('❌ Font file not found!');
  console.log('Please download NotoSansSinhala-Regular.ttf and place it in the scripts folder');
  console.log('Download from: https://fonts.google.com/noto/specimen/Noto+Sans+Sinhala');
}