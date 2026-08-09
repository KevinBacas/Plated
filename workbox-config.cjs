module.exports = {
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,json,png,svg,ico,ttf}'],
  swDest: 'dist/sw.js',
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  navigateFallback: '/index.html',
};
