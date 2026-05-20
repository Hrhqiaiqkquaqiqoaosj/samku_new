const fs = require('fs');
const path = require('path');

// Create basic directories
const dirs = [
  'logs',
  'uploads',
  'temp'
];

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

console.log('Project directories created successfully!');
