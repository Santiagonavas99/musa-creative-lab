const fs = require('node:fs');
const path = require('node:path');

// Vite builds the React island into dist. Keep the existing MUSA PWA and
// public legal routes at their original URLs without migrating the vanilla app.
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
for (const name of [
  'favicon.svg',
  'manifest.webmanifest',
  'legal.css',
  'robots.txt',
  'politica-de-privacidad',
  'terminos-de-uso'
]) {
  const from = path.join(root, name);
  if (!fs.existsSync(from)) continue;
  const to = path.join(dist, name);
  fs.cpSync(from, to, { recursive: true, force: true });
}
console.log('✓ MUSA static assets and legal pages copied to dist');
