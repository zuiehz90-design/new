/**
 * Explications détaillées des événements islamiques : histoire, signification,
 * pratiques recommandées. Éduque et enrichit la foi autour de chaque date importante.
 * Clés au format « mois-jour » (hégirien), alignées sur ISLAMIC_EVENTS (hijriCalendar.ts).
 */

export interface EventExplanation {
  /** D'où vient cet événement, ce qui s'est passé. */
  history: string;
  /** Ce que cela signifie spirituellement. */
  meaning: string;
  /** Comment le vivre concrètement. */
  practices: string[];
}

export const EVENT_EXPLANATIONS: Record<string, EventExplanation> = {
  '1-1': {
    history:
      "Commémore l'Hégire du Prophète ﷺ de La Mecque vers Médine en 622, accompagné d'Abu Bakr. Cet exode fondateur marqua la naissance de la communauté musulmane organisée, et le calendrier islamique débute à cette date.",
    meaning:
      "Un temps de bilan spirituel : comme l'Hégire fut un nouveau départ, chaque nouvelle année est l'occasion de renouveler ses intentions et de migrer vers ce qui rapproche d'Allah.",
    practices: [
      "Faire le bilan sincère de l'année écoulée",
      'Renouveler ses bonnes résolutions et intentions',
      'Invoquer Allah pour l\u2019année à venir',
      'Multiplier les bonnes actions en début d\u2019année',
    ],
  },
  '1-10': {
    history:
      "Jour où Allah sauva Moussa (as) et les enfants d'Israël de Pharaon en fendissant la mer. Le Prophète ﷺ, arrivé à Médine, trouva les Juifs jeûnant ce jour en gratitude et déclara : « Nous sommes plus dignes de Moussa que eux », et il le jeûna.",
    meaning:
      "Un jour de libération et de gratitude : le jeûne d'Achoura expie les péchés mineurs de l'année précédente — une miséricorde immense pour un seul jour.",
    practices: [
      'Jeûner le 10 Mouharram (et idéalement le 9 avec)',
      'Se rappeler la délivrance de Moussa (as) et la victoire des faibles sur l\u2019orgueilleux',
      'Multiplier la sadaqa et le dhikr',
      'Prendre soin de sa famille ce jour-là',
    ],
  },
  '3-12': {
    history:
      "Date traditionnellement associée à la naissance du Prophète Muhammad ﷺ à La Mecque, l'« année de l'Éléphant ». Orphelin avant sa naissance, il devint l'homme le plus influent de l'histoire et le sceau des prophètes.",
    meaning:
      "L'essentiel n'est pas la célébration d'une date mais l'amour du Prophète ﷺ : « Nul d'entre vous ne croit tant qu'il ne m'aime pas plus que son père, son enfant et toute l'humanité. »",
    practices: [
      'Lire et étudier la sira (biographie) du Prophète ﷺ',
      'Multiplier les salawat (salutations sur le Prophète ﷺ)',
      'Suivre concrètement sa sunna : caractère, prières, bienfaisance',
    ],
  },
  '7-1': {
    history:
      "Rajab est l'un des quatre mois sacrés mentionnés dans le Coran (9:36), avec Dhoul-Qi'da, Dhoul-Hijja et Mouharram — les mois où l'injustice est plus grave et les bonnes actions multipliées.",
    meaning:
      "Une porte d'entrée de la saison spirituelle : Rajab prépare Cha'ban, qui prépare Ramadan. Les pieux ancêtres y recommençaient à veiller et jeûner après une longue pause.",
    practices: [
      'Multiplier les bonnes actions (elles comptent double dans les mois sacrés)',
      'Demander pardon sincèrement (istighfar)',
      'Se préparer dès maintenant au mois de Ramadan',
    ],
  },
  '7-27': {
    history:
      "Voyage nocturne extraordinaire : le Prophète ﷺ fut transporté de La Mecque à Jérusalem (al-Isra') où il dirigea tous les prophètes en prière, puis élevé vers les cieux (al-Mi'raj). C'est là que furent prescrites les cinq prières quotidiennes, don direct sans intermédiaire.",
    meaning:
      "Le lien sacré entre l'islam et Jérusalem (première qibla), et la valeur inestimable de la salat : cinquante prières accordées puis allégées en cinq — même récompense.",
    practices: [
      'Veiller en prières nocturnes si possible',
      'Réfléchir à la place de la prière dans sa journée',
      'Étudier l\u2019histoire d\u2019Al-Aqsa et prier pour ses habitants',
      'Se rappeler les bienfaits d\u2019Allah et Lui en être reconnaissant',
    ],
  },
  '8-15': {
    history:
      "Nuit du milieu de Cha'ban. Le Prophète ﷺ disait : « Allah regarde Sa création cette nuit et pardonne à tous Ses serviteurs, hormis l'associant et celui qui nourrit de la rancune. » Il jeûnait abondamment tout le mois de Cha'ban.",
    meaning:
      "La nuit du pardon : une fenêtre de miséricorde avant Ramadan, conditionnée par un cœur pur de toute haine envers les autres.",
    practices: [
      "Veillée d'invocations et d'istighfar",
      'Pardonner sincèrement à ceux qui nous ont offensés',
      'Reprendre le jeûne volontaire comme en Cha\u2019ban',
      'Préparer son programme spirituel pour Ramadan',
    ],
  },
  '9-1': {
    history:
      "C'est durant Ramadan que le Coran commença à descendre sur le Prophète ﷺ dans la grotte de Hira : « Le mois de Ramadan durant lequel le Coran a été descendu comme guide pour les gens » (2:185). Les portes du Paradis s'ouvrent, celles de l'Enfer se ferment, les diables sont enchaînés.",
    meaning:
      "Le mois du jeûne obligatoire, quatrième pilier de l'islam : un entraînement complet à la piété (taqwa), à la maîtrise de soi et à la solidarité avec ceux qui ont faim toute l'année.",
    practices: [
      'Jeûner de l\u2019aube au coucher avec foi et espoir de récompense',
      'Prières nocturnes (tarawih, qiyam)',
      'Lire quotidiennement le Coran (le compléter idéalement)',
      'Sadaqa et invitation des jeûneurs à rompre le jeûne',
      'Garder langue, yeux et cœur du jeûne : pas de colère ni de disputes',
    ],
  },
  '9-27': {
    history:
      "Nuit de la première révélation coranique (« Iqra ! »), située dans les dix dernières nuits de Ramadan : « Meilleure que mille mois » (Sourate 97) — soit plus de 83 années d'adoration. Le Prophète ﷺ cherchait cette nuit jusqu'à ses derniers jours.",
    meaning:
      "La nuit la plus bénie de l'année. Celui qui y prie avec foi et espoir obtient le pardon de ses péchés passés. Sa date exacte est volontairement cachée pour nous faire rechercher la miséricorde.",
    practices: [
      'Chercher la nuit dans les nuits impaires des dix derniers jours',
      'Invoquer : « Allahumma innaka \u2018afuwwun tuhibbul-\u2018afwa fa\u2018fu \u2018anni »',
      'Prier la nuit (qiyam) et réciter le Coran',
      'Faire l\u2019i\u2019tikaf à la mosquée si possible',
    ],
  },
  '10-1': {
    history:
      "Fête instituée dès l'arrivée du Prophète ﷺ à Médine, quand il apprit que Médinois avaient deux jours de fête : « Allah vous a donné deux jours meilleurs : l'Aïd al-Fitr et l'Aïd al-Adha. » Elle marque la fin du jeûne de Ramadan.",
    meaning:
      "Le jour de la reconnaissance : récompense manifeste du jeûneur (« comme si sa bouche embaumait ») et joie licite rendue possible par la solidarité avec les pauvres grâce à la zakat al-fitr.",
    practices: [
      'Acquitter la zakat al-fitr avant la prière de l\u2019Aïd',
      'Grand bain, beau vêtement, manger quelques dates avant de sortir',
      'Prière de l\u2019Aïd en congrégation, puis écouter la khutba',
      'Réciter le takbir sur le chemin de la prière',
      'Visiter parents et proches, pardonner, réconcilier',
      'Pas de jeûne aujourd\u2019hui : c\u2019est un jour de fête',
    ],
  },
  '12-8': {
    history:
      "Premier jour des rites du Hajj : les pèlerins revêtent l'ihram et se rendent à Mina, où ils passent la veille du grand jour en prières — on l'appelle yaum at-tarwiyah (jour de l'abreuvage).",
    meaning:
      "Le début du grand rassemblement : des millions de cœurs unis, vêtus de blanc, égaux devant Allah, entonnant la talbiyah.",
    practices: [
      'Jeûner ce jour reste recommandé pour les non-pèlerins',
      'Réciter la talbiyah : « Labbayka Allahumma labbayk »',
      'Préparer son cœur aux dix jours bénis qui culminent à Arafah',
    ],
  },
  '12-9': {
    history:
      "C'est à Arafah, l'an 10 de l'Hégire, que le Prophète ﷺ prononça son sermon d'adieu devant plus de cent mille compagnons, proclamant la sacralité de la vie et l'égalité des êtres humains. « Le Hajj, c'est Arafah. »",
    meaning:
      "La plus grande journée d'invocation de l'année : Allah se glorifie auprès des anges de ceux qui sont réunis à Arafah. Le jeûne de ce jour expie les péchés de deux années.",
    practices: [
      'Jeûner le 9 Dhoul-Hijja (fortement recommandé hors pèlerinage)',
      'Multiplier invocations et istighfar, surtout entre \u2018Asr et le coucher',
      'Réciter takbir, tahlil et tahmid en abondance',
      'Renouveler sa foi en écoutant ou relisant le sermon d\u2019adieu',
    ],
  },
  '12-10': {
    history:
      "Commémore l'obéissance sublime d'Ibrahim (as), prêt à sacrifier son fils par pur amour d'Allah, remplacé au dernier moment par une grande bête envoyée du ciel : « Voilà l'épreuve évidente ». C'est aussi le jour du grand rassemblement du Hajj.",
    meaning:
      "Le plus grand jour de fête de l'islam : le sacrifice enseigne que la vraie foi se prouve dans l'action — « Ce ne sont pas leurs fourrures ni leur sang qui atteignent Allah, mais votre piété » (22:37).",
    practices: [
      'Prière de l\u2019Aïd, puis écouter la khutba',
      'Sacrifier (udhiya) et partager : un tiers pour soi, un tiers en cadeau, un tiers pour les pauvres',
      'Takbir depuis le Fajr d\u2019Arafah jusqu\u2019au \u2018Asr du 13',
      'Pas de jeûne aujourd\u2019hui : jour de manger et de fête',
      'Inviter, partager le repas, rendre visite aux proches',
    ],
  },
  '12-11': {
    history:
      "Les trois jours qui suivent l'Aïd al-Adha, appelés ayyam at-tashriq car l'on faisait autrefois sécher (tashriq) au soleil la viande du sacrifice pour la conserver.",
    meaning:
      "Des jours de fête prolongée : le Prophète ﷺ les a définis comme « des jours de manger, de boire et d'invoquer Allah » — la joie licite fait partie de la religion.",
    practices: [
      'Continuer le takbir après chaque prière prescrite jusqu\u2019au 13',
      'Manger et boire : le jeûne est interdit ces jours-là',
      'Recevoir parents, amis et pauvres',
      'Multiplier la sadaqa avec le reste du sacrifice',
    ],
  },
};

/** Explication d'un événement (null si absente). */
export function getEventExplanation(month: number, day: number): EventExplanation | null {
  return EVENT_EXPLANATIONS[`${month}-${day}`] ?? null;
}
