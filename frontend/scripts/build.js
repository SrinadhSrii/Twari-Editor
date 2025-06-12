const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building production version...');

// Clean dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}

// Run TypeScript compilation
console.log('📝 Compiling TypeScript...');
execSync('tsc', { stdio: 'inherit' });

// Run Vite build
console.log('📦 Building with Vite...');
execSync('vite build', { stdio: 'inherit' });

// Copy additional files
console.log('📋 Copying additional files...');
const filesToCopy = [
  'README.md',
  '.env.example'
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
  }
});

console.log('✅ Build completed successfully!');
console.log('📁 Output directory: dist/');