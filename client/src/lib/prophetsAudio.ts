/**
 * Podcasts audio réels (streaming) pour chaque prophète.
 *
 * Source : « Histoires des prophètes » — podcast public de L'islam simplement.
 * Les URLs sont les encodages officiels du flux RSS (Spotify for Podcasters).
 * Crédit complet : auteur + lien vers l'épisode original (affiché dans le lecteur).
 */
export interface ProphetAudio {
  /** Titre de l'épisode. */
  title: string;
  /** URL de streaming MP3 (enclosure du flux RSS officiel). */
  url: string;
  /** Nom d'affichage du podcast. */
  source: string;
  /** Auteur / propriétaire du podcast. */
  author: string;
  /** Page publique de l'épisode original. */
  episodeUrl: string;
  /** Page publique du podcast. */
  podcastUrl: string;
}

const BASE = 'https://anchor.fm/s/102ae22cc/podcast/play/';
const EP = 'https://podcasters.spotify.com/pod/show/lislam-simplement/episodes/';
const PODCAST_URL = 'https://lislam-simplement.com/';
const AUTHOR = 'L’islam simplement';
const SOURCE = 'Histoires des prophètes — L’islam simplement';

export const PROPHET_AUDIO: Record<string, ProphetAudio> = {
  Adam: {
    title: 'Adam, le premier Prophète (1/2)',
    url: BASE + '100141574/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-20%2F19027e67-6e2e-0bd9-0cdc-723aaeacaff7.mp3',
    source: SOURCE, author: AUTHOR, podcastUrl: PODCAST_URL,
    episodeUrl: EP + 'Histoires-des-prophtes-Adam-le-premier-Prophte---12-e30ej26',
  },
  Nuh: {
    title: 'Nouh (Noé) et l’arche',
    url: BASE + '100190841/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-21%2F6a8bee73-c83d-ef98-4bdd-778b266391f2.mp3',
    source: SOURCE, author: AUTHOR, podcastUrl: PODCAST_URL,
    episodeUrl: EP + 'Histoires-des-prophtes-Nouh-No-e30g35p',
  },
  Ibrahim: {
    title: 'Ibrahim (Abraham) — 1/3',
    url: BASE + '100191727/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-21%2F9b705af3-d5a9-e3e4-4566-eba585ef80b9.mp3',
    source: SOURCE, author: AUTHOR, podcastUrl: PODCAST_URL,
    episodeUrl: EP + 'Histoires-des-prophtes-Ibrahim-Abraham---13-e30g41f',
  },
  Yusuf: {
    title: 'Youssouf (Joseph) — 1/4',
    url: BASE + '100192389/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-21%2F3508d964-0a36-fb3e-8542-afc42eb449c0.mp3',
    source: SOURCE, author: AUTHOR, podcastUrl: PODCAST_URL,
    episodeUrl: EP + 'Histoires-des-prophtes-Le-Prophte-Youssouf-Joseph---14-e30g4m5',
  },
  Moussa: {
    title: 'Moussa (Moïse) — 1/11',
    url: BASE + '100193517/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-21%2Fdd95e95e-342f-ad84-3502-0b404d3a453d.mp3',
    source: SOURCE, author: AUTHOR, podcastUrl: PODCAST_URL,
    episodeUrl: EP + 'Histoires-des-prophtes-Moussa-Mose---111-e30g5pd',
  },
  Isa: {
    title: '`Issa (Jésus) — 1/5',
    url: BASE + '100219779/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-22%2Fd6afd8aa-1a86-666d-2da5-882ad71dd43f.mp3',
    source: SOURCE, author: AUTHOR, podcastUrl: PODCAST_URL,
    episodeUrl: EP + 'Histoires-des-prophtes-Issa-Jsus---15-e30gve3',
  },
  Yunus: {
    title: 'Younous (Jonas) et la baleine',
    url: BASE + '100193454/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-21%2F6133dd8f-fea3-4e9a-42bd-d31819da9ee0.mp3',
    source: SOURCE, author: AUTHOR, podcastUrl: PODCAST_URL,
    episodeUrl: EP + 'Histoires-des-prophtes-Younous-Jonas-et-la-baleine-e30g5ne',
  },
  Dawud: {
    title: 'Le prophète Dawoud (David) — 1/2',
    url: BASE + '100218994/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-22%2F24bcb021-89d7-9d08-0b57-a1f7c3aa3bee.mp3',
    source: SOURCE, author: AUTHOR, podcastUrl: PODCAST_URL,
    episodeUrl: EP + 'Histoires-des-prophtes-Le-prophte-Dawoud-David---12-e30guli',
  },
  Ayyub: {
    title: 'Le Prophète Ayyoub (Job) et sa grande épreuve',
    url: BASE + '100193395/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-21%2Fa4a1a16e-0297-f883-55a0-5ddca0931115.mp3',
    source: SOURCE, author: AUTHOR, podcastUrl: PODCAST_URL,
    episodeUrl: EP + 'Histoires-des-prophtes-Le-Prophte-Ayyoub-Job-et-sa-grande-preuve-e30g5lj',
  },
  Sulayman: {
    title: 'Le prophète Soulayman (Salomon) — 1/4',
    url: BASE + '100219097/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-22%2Fb68c5a67-555b-1172-3abf-ed126f09bd28.mp3',
    source: SOURCE, author: AUTHOR, podcastUrl: PODCAST_URL,
    episodeUrl: EP + 'Histoires-des-prophtes-Le-prophte-Soulayman-Salomon---14-e30guop',
  },
  Hud: {
    title: 'Hoûd, le premier prophète arabe',
    url: BASE + '100191416/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-21%2F3449f581-0170-abd5-081f-3037f1f7ec7e.mp3',
    source: SOURCE, author: AUTHOR, podcastUrl: PODCAST_URL,
    episodeUrl: EP + 'Histoires-des-prophtes-Hod--le-premier-prophte-arabe-e30g3no',
  },
  Lut: {
    title: 'Le Prophète LoûT (Loth), neveu d’Abraham',
    url: BASE + '100192171/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2025-2-21%2F04efb8d8-ff1d-d7fe-b646-b06b68a6ebd8.mp3',
    source: SOURCE, author: AUTHOR, podcastUrl: PODCAST_URL,
    episodeUrl: EP + 'Histoires-des-prophtes-Le-Prophte-LoT-Loth--neveu-dAbraham-e30g4fb',
  },
};

/** Épisode associé à un prophète (par son nom technique). */
export function getProphetAudio(name: string): ProphetAudio | null {
  return PROPHET_AUDIO[name] ?? null;
}
