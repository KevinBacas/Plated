import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const serviceWorker = `
if ('serviceWorker' in navigator) {
  window.__PLATED_UPDATE_READY__ = false;

  window.addEventListener('load', async () => {
    let hadController = Boolean(navigator.serviceWorker.controller);

    const announceUpdate = () => {
      if (!hadController || window.__PLATED_UPDATE_READY__) return;

      window.__PLATED_UPDATE_READY__ = true;
      window.dispatchEvent(new CustomEvent('plated:update-ready'));
    };

    navigator.serviceWorker.addEventListener('controllerchange', announceUpdate);

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none',
      });

      const checkForUpdate = () => registration.update().catch(() => undefined);

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
      window.addEventListener('pageshow', checkForUpdate);

      await checkForUpdate();
      hadController = true;
    } catch {
      // Offline startup still works with the already-installed service worker.
    }
  });
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#0d6e63" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <script dangerouslySetInnerHTML={{ __html: serviceWorker }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
