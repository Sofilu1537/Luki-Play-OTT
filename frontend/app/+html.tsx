import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          #luki-splash-overlay {
            position: fixed;
            inset: 0;
            background: #0A0014;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          @keyframes lukiSplashIn {
            0%   { opacity: 0; transform: scale(0.55); }
            40%  { opacity: 1; transform: scale(1);    }
            80%  { opacity: 1; transform: scale(1);    }
            100% { opacity: 0; transform: scale(1.15); }
          }
          #luki-splash-logo {
            width: min(42vw, 190px);
            height: min(42vw, 190px);
            animation: lukiSplashIn 2.2s ease forwards;
            object-fit: contain;
          }
        `}} />
      </head>
      <body>
        <div id="luki-splash-overlay">
          <img id="luki-splash-logo" src="/logo.png" alt="LUKI Play" />
        </div>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var el = document.getElementById('luki-splash-overlay');
            if (!el) return;
            setTimeout(function() {
              el.style.transition = 'opacity 0.6s ease';
              el.style.opacity = '0';
              setTimeout(function() {
                if (el.parentNode) el.parentNode.removeChild(el);
              }, 700);
            }, 2300);
          })();
        `}} />
      </body>
    </html>
  );
}
