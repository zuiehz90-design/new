// Réponses préchargées pour le mode hors ligne / IA non configurée.
// L'objectif est de couvrir les questions courantes sans aucun appel réseau.

export interface OfflineEntry {
  keywords: string[];
  answer: string;
}

export const OFFLINE_ENTRIES: OfflineEntry[] = [
  {
    keywords: ['homme', 'hommes', 'l’homme', "l'homme", 'humanité', 'humanite'],
    answer:
      "En islam, l’être humain est une créature honorée par Allah et responsable de ses choix. Il est appelé à reconnaître son Créateur, à agir avec justice et miséricorde, à préserver la vie et à respecter les autres. Les hommes et les femmes ont la même dignité spirituelle ; chacun est jugé selon sa foi et ses œuvres. *Coran 17:70 ; Coran 49:13.*",
  },
  {
    keywords: ['piliers', 'cinq piliers', '5 piliers'],
    answer:
      "Les cinq piliers de l'islam sont :\n\n- **La Chahada** : l'attestation de foi (« Il n'y a de dieu qu'Allah et Muhammad est Son messager »).\n- **La Salat** : les cinq prières quotidiennes.\n- **La Zakat** : l'aumône obligatoire due par les personnes qui en ont les moyens.\n- **Le Sawm** : le jeûne du mois de Ramadan.\n- **Le Hajj** : le pèlerinage à La Mecque, une fois dans la vie, pour qui en a les moyens.\n\n*Sourate Al-Baqara (2:177) et hadith du Prophète (paix sur lui) rapporté par Boukhari et Muslim.*",
  },
  {
    keywords: ['priere', 'prières', 'salat', 'salah', '5 prieres'],
    answer:
      "Les cinq prières obligatoires (Salat) sont :\n\n- **Fajr** : à l'aube (2 rak'at)\n- **Dhuhr** : à midi (4 rak'at)\n- **Asr** : dans l'après-midi (4 rak'at)\n- **Maghrib** : au coucher du soleil (3 rak'at)\n- **Isha** : à la nuit tombée (4 rak'at)\n\nLa prière est le deuxième pilier de l'islam. Ses horaires exacts dépendent de la position du soleil : utilisez l'onglet « Prières » de cette application, qui les calcule selon votre localisation. *Coran 17:78 ; hadith rapporté par Boukhari.*",
  },
  {
    keywords: ['jeune', 'jeûne', 'ramadan', 'sawm'],
    answer:
      "Le jeûne du mois de Ramadan (Sawm) est le quatrième pilier de l'islam. Il consiste à s'abstenir de manger, de boire et des relations conjugales de l'aube au coucher du soleil. Il est obligatoire pour tout musulman pubère, sain et capable ; les voyageurs, malades, femmes enceintes ou allaitantes peuvent le reporter ou le compenser. *Sourate Al-Baqara (2:183-185) ; hadith rapporté par Boukhari et Muslim.*",
  },
  {
    keywords: ['zakat', 'aumone', 'aumône'],
    answer:
      "La Zakat est le troisième pilier de l'islam : une aumône obligatoire (2,5 % des biens excédentaires détenus depuis une année lunaire pour l'or, l'argent et les biens commerciaux) versée aux personnes qui en ont besoin. Elle purifie la richesse et renforce la solidarité. *Sourate At-Tawbah (9:60) ; hadith rapporté par Boukhari et Muslim.*",
  },
  {
    keywords: ['hajj', 'pelerinage', 'pèlerinage', 'omra'],
    answer:
      "Le Hajj est le cinquième pilier de l'islam : le pèlerinage à La Mecque, obligatoire une fois dans la vie pour celui qui en a la capacité physique et financière. Il se déroule au mois de Dhul-Hijjah. L'Omra est un pèlerinage mineur, non obligatoire mais fortement recommandé. *Sourate Al-Imran (3:97).*",
  },
  {
    keywords: ['foi', 'iman', 'croyance', 'croyances'],
    answer:
      "La foi (Iman) en islam repose sur six articles : la croyance en Allah, en Ses anges, en Ses livres, en Ses messagers, au Jour Dernier et au destin (bon ou mauvais). Le hadith de Gabriel (rapporté par Muslim) en donne la définition complète.",
  },
  {
    keywords: ['coran', 'quran', 'qouran', 'verset', 'sourate'],
    answer:
      "Le Coran est la parole d'Allah révélée au Prophète Muhammad (paix sur lui) par l'ange Gabriel, sur environ 23 ans. Il comprend 114 sourates et 6236 versets. Pour explorer le texte arabe avec sa traduction française, ouvrez l'onglet « Coran » de cette application. Le Coran est préservé et disponible hors ligne ici après le premier chargement.",
  },
  {
    keywords: ['hadith', 'hadiths', 'sounna', 'sunna'],
    answer:
      "Les hadiths sont les paroles, actes et approbations du Prophète Muhammad (paix sur lui), transmis par une chaîne de narrateurs. Les recueils les plus authentiques sont ceux de Boukhari et Muslim (les « Deux Sahih »), suivis de Abou Dawoud, Tirmidhi, An-Nasa'i et Ibn Majah. Un hadith authentique est dit « sahih ». *Pour vérifier une citation précise, consultez un savant ou les recueils originaux.*",
  },
  {
    keywords: ['prophet', 'prophete', 'prophète', 'muhammad', 'mohammed', 'messager'],
    answer:
      "Muhammad (paix sur lui) est le dernier prophète et messager d'Allah, envoyé à toute l'humanité. Né à La Mecque vers 570, il a reçu la première révélation à 40 ans dans la grotte de Hira. Il est le modèle (Sounna) des musulmans. *Coran 33:40 ; hadith rapporté par Muslim.*",
  },
  {
    keywords: ['allah', 'dieu', 'tawhid', 'unicite', 'unicité'],
    answer:
      "Le Tawhid, l'unicité d'Allah, est le fondement de la foi islamique : Allah est unique, sans associé, sans égal. C'est le sens de la Chahada et le premier des commandements coraniques. *Sourate Al-Ikhlas (112:1-4) ; Sourate Al-Baqara (2:163).*",
  },
];

export function getOfflineAnswer(question: string): string | null {
  const q = question.toLowerCase();
  for (const entry of OFFLINE_ENTRIES) {
    if (entry.keywords.some((k) => q.includes(k))) return entry.answer;
  }
  return null;
}

export const OFFLINE_FALLBACK =
  "Je suis en mode hors ligne : je ne peux pas consulter l'IA pour le moment et aucune réponse préchargée ne correspond à votre question. Dès que vous serez connecté, posez-moi à nouveau votre question pour obtenir une réponse complète avec ses sources. Vous pouvez aussi explorer l'onglet **Coran**, qui reste disponible hors ligne après le premier chargement.";
