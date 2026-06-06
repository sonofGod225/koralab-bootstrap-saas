/**
 * __PROJECT_NAME__ — landing placeholder Worker.
 *
 * Sert une page « Bientôt disponible » sur __PROJECT_SLUG__.com (+ www) en attendant
 * le projet landing définitif. L'app reste sur app.__PROJECT_SLUG__.com.
 */

interface Env {
  ENVIRONMENT: string;
}

const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>__PROJECT_NAME__ — Bientôt disponible</title>
  <meta name="description" content="__PROJECT_NAME__ — la suite SaaS des entreprises africaines. Notre site arrive très bientôt." />
  <meta name="theme-color" content="#2A1A0F" />
  <meta name="robots" content="noindex" />
  <link rel="canonical" href="https://__PROJECT_SLUG__.com/" />
  <meta property="og:title" content="__PROJECT_NAME__ — Bientôt disponible" />
  <meta property="og:description" content="La suite SaaS des entreprises africaines. Notre site arrive très bientôt." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://__PROJECT_SLUG__.com/" />
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      background: radial-gradient(1200px 600px at 50% -10%, #3a2415 0%, #2A1A0F 45%, #1a0f08 100%);
      color: #f5ede4;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
    }
    main { max-width: 34rem; }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #e0b878;
      border: 1px solid rgba(224, 184, 120, 0.35);
      border-radius: 999px;
      padding: 0.4rem 0.9rem;
      margin-bottom: 1.75rem;
    }
    h1 {
      font-size: clamp(2.25rem, 6vw, 3.5rem);
      line-height: 1.05;
      margin: 0 0 1rem;
      font-weight: 600;
    }
    h1 .accent { color: #e0b878; }
    p { font-size: 1.05rem; line-height: 1.6; color: #cdbfae; margin: 0 auto 2rem; }
    .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
    a.btn {
      display: inline-block;
      text-decoration: none;
      font-weight: 500;
      padding: 0.75rem 1.4rem;
      border-radius: 0.6rem;
      transition: opacity 0.2s ease;
    }
    a.btn:hover { opacity: 0.85; }
    a.primary { background: #e0b878; color: #2A1A0F; }
    a.secondary { border: 1px solid rgba(245, 237, 228, 0.25); color: #f5ede4; }
    footer { margin-top: 3rem; font-size: 0.8rem; color: #8a7d6e; }
  </style>
</head>
<body>
  <main>
    <span class="badge">Bientôt disponible</span>
    <h1>Budi<span class="accent">Suite</span></h1>
    <p>La suite SaaS des entreprises africaines. Notre nouveau site arrive très bientôt — l'application reste pleinement accessible.</p>
    <div class="actions">
      <a class="btn primary" href="https://app.__PROJECT_SLUG__.com">Accéder à l'application</a>
      <a class="btn secondary" href="mailto:contact@__PROJECT_SLUG__.com">Nous contacter</a>
    </div>
    <footer>© __PROJECT_NAME__</footer>
  </main>
</body>
</html>`;

export default {
  fetch(request: Request, _env: Env): Response {
    const url = new URL(request.url);

    // Sonde de santé pour les smoke-tests CI / monitoring.
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', page: 'coming-soon' }), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    return new Response(HTML, {
      // Toujours la page placeholder, quel que soit le chemin demandé.
      status: url.pathname === '/' ? 200 : 404,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // Cache court : la page sera remplacée dès que la landing définitive arrive.
        'cache-control': 'public, max-age=300',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
      },
    });
  },
} satisfies ExportedHandler<Env>;
