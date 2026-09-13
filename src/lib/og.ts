const fontCache = new Map<string, Promise<ArrayBuffer>>();

/**
 * Fetches a static TTF instance of a Google Font for next/og. The legacy
 * user agent makes the CSS API serve TTF, which is what Satori can parse.
 */
function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const key = `${family}:${weight}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0",
        },
      },
    ).then((response) => response.text());
    const match = css.match(
      /src: url\((.+?)\) format\('(?:opentype|truetype|woff)'\)/,
    );
    if (!match) throw new Error(`No TTF source found for ${key}`);
    return fetch(match[1]).then((response) => response.arrayBuffer());
  })();

  fontCache.set(key, promise);
  return promise;
}

export const ogSize = { width: 1200, height: 630 };

export async function ogFonts() {
  const [bold, medium] = await Promise.all([
    loadGoogleFont("Inter", 800),
    loadGoogleFont("Inter", 500),
  ]);
  return [
    {
      name: "Inter",
      data: bold,
      weight: 800 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: medium,
      weight: 500 as const,
      style: "normal" as const,
    },
  ];
}

export const ogColors = {
  blue: "#006ad6",
  ink: "#0f172a",
  paper: "#ffffff",
  muted: "rgba(255,255,255,0.78)",
};
