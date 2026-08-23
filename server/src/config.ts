const siteUrl = (process.env.SITE_URL ?? '').trim().replace(/\/+$/, '');

export const config = {
  openRouterModel: process.env.OPENROUTER_MODEL ?? 'openrouter/free',
  port: Number(process.env.PORT) || 3001,
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  siteUrl,
  isVercel: Boolean(process.env.VERCEL),
};
