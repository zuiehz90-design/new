import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { chatRouter } from './routes/chat.js';
import { modelsRouter } from './routes/models.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { prayersRouter } from './routes/prayers.js';
import { profileRouter } from './routes/profile.js';
import { questsRouter } from './routes/quests.js';
import { challengesRouter } from './routes/challenges.js';
import { quizRouter } from './routes/quiz.js';
import { setupRouter } from './routes/setup.js';
import { achievementsRouter } from './routes/achievements.js';
import { conversationsRouter } from './routes/conversations.js';
import { mawaqitRouter } from './routes/mawaqit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = config.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json({ limit: '200kb' }));

app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  }
  next();
});

app.get('/api', (_req, res) => {
  res.json({ name: 'Nour - Chat Islamique API', version: '1.0.0' });
});
app.use('/api/chat', chatRouter);
app.use('/api/models', modelsRouter);
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/prayers', prayersRouter);
app.use('/api/profile', profileRouter);
app.use('/api/quests', questsRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/setup', setupRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/mawaqit', mawaqitRouter);

function publicSiteUrl(req: express.Request): string {
  if (config.siteUrl) return config.siteUrl;
  const forwarded = req.get('x-forwarded-proto');
  const protocol = forwarded?.split(',')[0]?.trim() || req.protocol;
  return `${protocol}://${req.get('host')}`;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[char] ?? char);
}

function escapeHtml(value: string): string {
  return escapeXml(value);
}

app.get('/robots.txt', (req, res) => {
  const site = publicSiteUrl(req);
  res.type('text/plain').set('Cache-Control', 'no-store').send(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /profile\nDisallow: /chat\nDisallow: /quests\nSitemap: ${site}/sitemap.xml\n`,
  );
});

app.get('/sitemap.xml', (req, res) => {
  const site = publicSiteUrl(req);
  const urls = ['/', '/quran', '/prayer'];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `<url><loc>${escapeXml(site + url)}</loc><changefreq>weekly</changefreq></url>`),
    '</urlset>',
  ].join('');
  res.type('application/xml').set('Cache-Control', 'no-store').send(xml);
});

const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  const indexPath = path.join(clientDist, 'index.html');
  const indexTemplate = fs.readFileSync(indexPath, 'utf8');

  function pageMeta(pathname: string): { title: string; description: string } {
    if (pathname === '/quran' || pathname.startsWith('/quran/')) {
      return {
        title: 'Coran en ligne — Nour',
        description: 'Lisez le Saint Coran en arabe avec traduction, recherche, audio et tafsir.',
      };
    }
    if (pathname === '/prayer' || pathname.startsWith('/prayer/')) {
      return {
        title: 'Horaires de prière — Nour',
        description: 'Consultez les horaires de prière selon votre ville ou votre position, gratuitement.',
      };
    }
    return {
      title: 'Nour — Chat islamique avec IA',
      description: "Coran, horaires de prière et chat islamique avec réponses sourcées. Une application gratuite et accessible.",
    };
  }

  function sendIndex(req: express.Request, res: express.Response): void {
    const site = publicSiteUrl(req);
    const pathname = req.path === '/index.html' ? '/' : req.path;
    const meta = pageMeta(pathname);
    const canonicalPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    const canonical = site + canonicalPath;
    const title = escapeHtml(meta.title);
    const description = escapeHtml(meta.description);
    const html = indexTemplate
      .replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(" \/>)/i, `$1${description}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(" \/>)/i, `$1${title}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(" \/>)/i, `$1${description}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(" \/>)/i, `$1${escapeHtml(canonical)}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(" \/>)/i, `$1${title}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(" \/>)/i, `$1${description}$2`)
      .replace(/(<link rel="canonical" href=")[^"]*(" \/>)/i, `$1${escapeHtml(canonical)}$2`);
    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(html);
  }

  app.get('/index.html', sendIndex);
  app.use(express.static(clientDist, {
    index: false,
    setHeaders(res, filePath) {
      const name = path.basename(filePath);
      if (name === 'index.html' || name === 'sw.js' || name === 'robots.txt' || name === 'sitemap.xml') {
        res.setHeader('Cache-Control', 'no-store');
      } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  }));

  // Redirection vers les GitHub Releases (l'exe n'est pas déployé sur Render)
  app.get('/download/nour-setup.exe', (_req, res) => {
    res.redirect(301, 'https://github.com/zuiehz90-design/new/releases');
  });

  app.get(/^\/(?!api\/|robots\.txt$|sitemap\.xml$|download\/).*/, sendIndex);
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = (err instanceof Error ? err.message : String(err ?? '')).slice(0, 500);
  console.error('[ERROR]', message);
  res.status(500).json({ error: message || 'Erreur interne du serveur.' });
});
