import React from "react";

export function ThemeScript() {
  const code = `
    (function() {
      try {
        var theme = null;
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
          var parts = cookies[i].split('=');
          if (parts[0].trim() === 'theme') {
            theme = parts[1].trim();
            break;
          }
        }
        if (!theme) {
          theme = localStorage.getItem('mfc:theme') || 'system';
        }
        var resolved = theme;
        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        if (resolved === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
