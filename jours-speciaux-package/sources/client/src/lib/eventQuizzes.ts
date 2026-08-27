/**
 * Quiz de connaissances sur les événements islamiques (« Que sais-tu sur l'Aïd al-Adha ? »).
 * Consolide l'apprentissage après la lecture des explications (eventExplanations.ts).
 * Clés au format « mois-jour » (hégirien), alignées sur ISLAMIC_EVENTS et EVENT_EXPLANATIONS.
 * La bonne réponse reste côté client (quiz pédagogique, sans enjeu de points).
 */

export interface EventQuizQuestion {
  q: string;
  options: string[];
  /** Index de la bonne réponse. */
  answer: number;
  /** Courte explication affichée après la réponse. */
  explain: string;
}

export const EVENT_QUIZZES: Record<string, EventQuizQuestion[]> = {
  // Nouvel an hégirien
  '1-1': [
    {
      q: 'Quel événement fondateur marque le début du calendrier islamique ?',
      options: [
        'L\u2019Hégire du Prophète ﷺ de La Mecque vers Médine',
        'La conquête de La Mecque',
        'La première révélation dans la grotte de Hira',
      ],
      answer: 0,
      explain: 'En 622, l\u2019exode vers Médine fonda la communauté musulmane organisée — le calendrier débute à cette date.',
    },
    {
      q: 'Qui accompagnait le Prophète ﷺ pendant l\u2019Hégire ?',
      options: ['Abu Bakr (ra)', 'Umar (ra)', 'Ali (ra)'],
      answer: 0,
      explain: 'Son compagnon de la grotte : « Ne t\u2019attriste pas, Allah est avec nous » (9:40).',
    },
    {
      q: 'Quel est le sens spirituel du nouvel an hégirien ?',
      options: [
        'Un bilan et un renouvellement d\u2019intentions',
        'Une fête avec échanges de cadeaux obligatoires',
        'Un mois de jeûne obligatoire',
      ],
      answer: 0,
      explain: 'Comme l\u2019Hégire fut un nouveau départ, chaque année invite à migrer vers ce qui rapproche d\u2019Allah.',
    },
  ],
  // Jours de Tashriq
  '12-11': [
    {
      q: 'D\u2019où vient le nom « jours de Tashriq » ?',
      options: [
        'On faisait sécher (tashriq) la viande du sacrifice au soleil',
        'Du lever du soleil (chourouq) sur Arafah',
        'Du nom d\u2019une vallée près de Mina',
      ],
      answer: 0,
      explain: 'Autrefois, on conservait la viande du sacrifice en la faisant sécher après l\u2019Aïd al-Adha.',
    },
    {
      q: 'Comment le Prophète ﷺ définissait-il ces jours ?',
      options: [
        '« Des jours de manger, de boire et d\u2019invoquer Allah »',
        '« Des jours de jeûne strict »',
        '« Des jours de silence et de retraite »',
      ],
      answer: 0,
      explain: 'Rapporté par Bukhari : la joie licite fait partie de la religion — le jeûne y est même interdit.',
    },
    {
      q: 'Jusqu\u2019à quand continue-t-on le takbir après chaque prière ?',
      options: [
        'Jusqu\u2019au \u2018Asr du 13 Dhoul-Hijja',
        'Jusqu\u2019au coucher du soleil du jour de l\u2019Aïd',
        'Pendant tout le mois de Dhoul-Hijja',
      ],
      answer: 0,
      explain: 'Du Fajr du jour de Arafah au \u2018Asr du dernier jour de Tashriq : les jours connus pour le takbir.',
    },
  ],
  // Aïd al-Adha
  '12-10': [
    {
      q: 'Quel événement commémore l\u2019Aïd al-Adha ?',
      options: [
        'La soumission d\u2019Ibrahim (as) prêt à sacrifier son fils',
        'La fuite de Moussa (as) devant Pharaon',
        'La première révélation du Coran',
      ],
      answer: 0,
      explain: 'Le Coran dit : « Voilà l\u2019épreuve évidente » — Ibrahim (as) fut rédimé par une grande bête envoyée par Allah.',
    },
    {
      q: 'Comment partage-t-on traditionnellement la viande du sacrifice (udhiya) ?',
      options: [
        'En trois : famille, proches, pauvres',
        'Uniquement pour sa propre famille',
        'On la vend entièrement au marché',
      ],
      answer: 0,
      explain: 'Le partage en trois parts incarne le lien social et la solidarité avec les nécessiteux.',
    },
    {
      q: 'Peut-on jeûner le jour de l\u2019Aïd al-Adha ?',
      options: [
        'Non, le jeûne est interdit ce jour de fête',
        'Oui, c\u2019est très recommandé',
        'Seulement jusqu\u2019à midi',
      ],
      answer: 0,
      explain: 'Les deux jours de l\u2019Aïd sont des jours de manger, boire et invoquer Allah.',
    },
  ],
  // Jour de Arafah (9)
  '12-9': [
    {
      q: 'Quelle est la vertu du jeûne du jour de Arafah pour celui qui n\u2019est pas en pèlerinage ?',
      options: [
        'Il expie les péchés de deux années',
        'Il remplace un mois de Ramadan',
        'Il garantit le Hajj l\u2019année suivante',
      ],
      answer: 0,
      explain: 'Hadith rapporté par Muslim : il expie les péchés de l\u2019année passée et de l\u2019année à venir.',
    },
    {
      q: 'Où le Prophète ﷺ prononça-t-il son sermon d\u2019adieu ?',
      options: [
        'À Arafah, devant plus de cent mille compagnons',
        'Dans la mosquée de Médine',
        'Sur le mont Uhud',
      ],
      answer: 0,
      explain: 'L\u2019an 10 de l\u2019Hégire, lors de son pèlerinage d\u2019adieu : sacralité de la vie et égalité des êtres humains.',
    },
    {
      q: 'Que dit le Prophète ﷺ au sujet d\u2019Arafah dans le Hajj ?',
      options: [
        '« Le Hajj, c\u2019est Arafah »',
        '« Le Hajj, c\u2019est Mina »',
        '« Le Hajj est facultatif »',
      ],
      answer: 0,
      explain: 'Qui manque le jour d\u2019Arafah a manqué le Hajj : c\u2019est le cœur même du pèlerinage.',
    },
  ],
  // Début du Ramadan
  '9-1': [
    {
      q: 'Quel livre saint a commencé à être révélé durant Ramadan ?',
      options: ['Le Coran', 'La Torah', 'L\u2019Évangile'],
      answer: 0,
      explain: '« Le mois de Ramadan durant lequel le Coran a été descendu comme guide pour les gens » (2:185).',
    },
    {
      q: 'Que fait Allah avec les portes du Paradis pendant Ramadan ?',
      options: [
        'Elles sont ouvertes (et celles de l\u2019Enfer fermées)',
        'Elles restent comme le reste de l\u2019année',
        'Elles sont fermées',
      ],
      answer: 0,
      explain: 'Hadith rapporté par Bukhari et Muslim : les portes du Paradis s\u2019ouvrent, celles du Feu se ferment et les diables sont enchaînés.',
    },
    {
      q: 'Quelle est la finalité du jeûne selon le Coran ?',
      options: [
        'Atteindre la piété (taqwa)',
        'Perdre du poids',
        'Économiser de la nourriture',
      ],
      answer: 0,
      explain: '« Ô vous qui avez cru, le jeûne vous est prescrit… afin que vous atteigniez la piété » (2:183).',
    },
  ],
  // Laylat al-Qadr
  '9-27': [
    {
      q: 'Que vaut Laylat al-Qadr selon le Coran ?',
      options: [
        'Meilleure que mille mois',
        'Égale à un mois d\u2019adoration',
        'Uniquement bon pour les pèlerins',
      ],
      answer: 0,
      explain: 'Sourate 97 : « La nuit du Destin est meilleure que mille mois », soit plus de 83 années.',
    },
    {
      q: 'Quelle invocation le Prophète ﷺ enseigna-t-il pour cette nuit ?',
      options: [
        '« Allahumma innaka \u2018afuwwun tuhibbul-\u2018afwa fa\u2018fu \u2018anni »',
        '« Subhan Allah wa bihamdihi » uniquement',
        'Aucune invocation n\u2019est mentionnée',
      ],
      answer: 0,
      explain: 'Rapportée par Tirmidhi : « Ô Allah, Tu es Pardonneur, Tu aimes pardonner, pardonne-moi. »',
    },
    {
      q: 'Dans quelles nuits cherche-t-on Laylat al-Qadr ?',
      options: [
        'Les nuits impaires des dix dernières nuits de Ramadan',
        'Les quinze premières nuits de Cha\u2019ban',
        'N\u2019importe quelle nuit de l\u2019année',
      ],
      answer: 0,
      explain: 'Le Prophète ﷺ ordonna de la chercher dans les nuits impaires des sept dernières nuits, notamment la 27e.',
    },
  ],
  // Aïd al-Fitr
  '10-1': [
    {
      q: 'Quelle aumône doit être acquittée avant la prière de l\u2019Aïd al-Fitr ?',
      options: ['La zakat al-fitr', 'La zakat al-mal', 'La sadaqa du vendredi'],
      answer: 0,
      explain: 'Elle purifie le jeûneur des paroles vaines et nourrit les pauvres le jour de la fête.',
    },
    {
      q: 'Pourquoi l\u2019Aïd al-Fitr a-t-il été institué à Médine ?',
      options: [
        'Pour remplacer les fêtes préislamiques par deux fêtes meilleures',
        'Pour célébrer une victoire militaire',
        'Pour marquer le début du calendrier hégirien',
      ],
      answer: 0,
      explain: 'Le Prophète ﷺ dit : « Allah vous a donné deux jours meilleurs à leur place : l\u2019Aïd al-Fitr et l\u2019Aïd al-Adha. »',
    },
    {
      q: 'Que recommande le Prophète ﷺ de faire avant de partir à la prière de l\u2019Aïd al-Fitr ?',
      options: [
        'Manger quelques dates (impair)',
        'Rester à jeun toute la journée',
        'Ne rien manger ni boire',
      ],
      answer: 0,
      explain: 'Contrairement à l\u2019Aïd al-Adha, on mange avant de sortir : un nombre impair de dates, selon la sunna.',
    },
  ],
  // Achoura
  '1-10': [
    {
      q: 'Quel prophète Allah sauva-t-il le jour d\u2019Achoura ?',
      options: ['Moussa (as)', 'Younus (as)', 'Issa (as)'],
      answer: 0,
      explain: 'Allah fendit la mer et sauva les enfants d\u2019Israël de Pharaon — jour de gratitude.',
    },
    {
      q: 'Que procure le jeûne d\u2019Achoura selon le hadith ?',
      options: [
        'L\u2019expiation des péchés mineurs de l\u2019année précédente',
        'La garantie du Paradis sans jugement',
        'Rien de particulier',
      ],
      answer: 0,
      explain: 'Muslim : « J\u2019espère qu\u2019Allah l\u2019acceptera en expiation pour l\u2019année précédente. »',
    },
    {
      q: 'Avec quel autre jour est-il recommandé de combiner le jeûne d\u2019Achoura ?',
      options: [
        'Le 9 Mouharram (tasu\u2018a\u2019)',
        'Le 15 Cha\u2019ban',
        'Le premier vendredi du mois',
      ],
      answer: 0,
      explain: 'Le Prophète ﷺ avait l\u2019intention de jeûner le 9 pour se distinguer des autres communautés.',
    },
  ],
  // Al-Isra wal-Mi'raj
  '7-27': [
    {
      q: 'Quel pilier de l\u2019islam fut prescrit lors du Mi\u2019raj ?',
      options: [
        'Les cinq prières quotidiennes',
        'Le jeûne de Ramadan',
        'La zakat',
      ],
      answer: 0,
      explain: 'Cinquante prières accordées puis allégées en cinq — même récompense, par miséricorde.',
    },
    {
      q: 'Vers quelle ville le Prophète ﷺ fut-il d\u2019abord transporté lors de l\u2019Isra ?',
      options: ['Jérusalem (Al-Aqsa)', 'Médine', 'Taif'],
      answer: 0,
      explain: 'Il y dirigea tous les prophètes en prière : lien sacré entre l\u2019islam et Al-Aqsa.',
    },
  ],
  // Mawlid
  '3-12': [
    {
      q: 'Quel est le meilleur moyen d\u2019honorer le Prophète ﷺ ?',
      options: [
        'Suivre sa sunna et multiplier les salawat',
        'Organiser de grandes processions',
        'Décorer les maisons',
      ],
      answer: 0,
      explain: '« Celui qui obéit au Messager obéit à Allah » — suivre son exemple est le véritable amour.',
    },
    {
      q: 'Comment appelait-on l\u2019année de sa naissance ﷺ ?',
      options: [
        'L\u2019année de l\u2019Éléphant',
        'L\u2019année de la tristesse',
        'L\u2019année de la paix',
      ],
      answer: 0,
      explain: 'Allah sauva la Kaaba de l\u2019armée d\u2019Abraha montée sur des éléphants (Sourate 105).',
    },
  ],
  // Laylat al-Bara'ah
  '8-15': [
    {
      q: 'Pourquoi Allah ne pardonne-t-Il pas certains serviteurs cette nuit, selon le hadith ?',
      options: [
        'L\u2019associant et celui qui nourrit de la rancune',
        'Le voyageur et le malade',
        'Celui qui dort tôt',
      ],
      answer: 0,
      explain: 'Pardonner aux autres ouvre la porte du pardon divin : purifier son cœur est la clé.',
    },
    {
      q: 'Quel mois précède immédiatement Ramadan ?',
      options: ['Cha\u2019ban', 'Rajab', 'Chawwal'],
      answer: 0,
      explain: 'Cha\u2019ban est le mois où le Prophète ﷺ jeûnait le plus après Ramadan lui-même.',
    },
  ],
};

/** Questions de quiz pour un événement (null si aucun). */
export function getEventQuiz(month: number, day: number): EventQuizQuestion[] | null {
  return EVENT_QUIZZES[`${month}-${day}`] ?? null;
}
