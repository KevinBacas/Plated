module.exports = {
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,json,png,svg,ico,ttf}'],
  // Expo exports icon fonts/images under assets/node_modules. Workbox's default
  // ignore would omit them, even though they are application assets.
  globIgnores: ['**/sw.js', '**/workbox-*.js'],
  // The app bundle includes the offline department map and must be precached.
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
  swDest: 'dist/sw.js',
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  navigateFallback: '/index.html',
};
