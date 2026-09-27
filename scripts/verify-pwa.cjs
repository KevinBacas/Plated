const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const worker = readFileSync('dist/sw.js', 'utf8');
const bundles = files('dist/_expo').filter((path) => path.endsWith('.js'));
const assets = files('dist/assets').filter((path) => /\.(ttf|png|svg|ico)$/.test(path));
if (bundles.length === 0) throw new Error('No application bundle was exported.');
const missing = [...bundles, ...assets].filter((path) => !worker.includes(JSON.stringify(path.replace(/^dist\//, ''))));
if (missing.length) throw new Error(`PWA assets missing from precache:\n${missing.join('\n')}`);
console.log(`PWA precache verified: ${bundles.length} application bundle(s), ${assets.length} bundled assets.`);
