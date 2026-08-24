/** Données des prophètes : histoires courtes et quiz. */
export interface QuizQuestion {
  question: string;
  options: [string, string, string];
  correct: number;
}

export interface ProphetStory {
  name: string; nameAr: string; nameFr: string;
  title: string; story: string; reference: string;
  lessons: string[]; quiz: QuizQuestion[];
}

export const PROPHETS: ProphetStory[] = [
  {
    name: "Adam",
    nameAr: "\u0622\u062f\u0645",
    nameFr: "Adam",
    title: "Le premier humain",
    story: "Adam fut le premier humain cr\u00e9\u00e9 par Allah, model\u00e9 d'argile. Les anges lui ordonn\u00e8rent de se prosterner, mais Iblis refusa. Allah lui apprit les noms de toutes choses.",
    reference: "Coran 2:30-39",
    lessons: ["Humilit\u00e9", "Repentir", "Enseignement"],
    quiz: [
      {question:"De quoi a-t-il \u00e9t\u00e9 cr\u00e9\u00e9 ?",options:["D'eau","D'argile","De feu"],correct:1},
      {question:"Qui refusa de se prosterner ?",options:["Les anges","Iblis","Les djinns"],correct:1},
      {question:"Que fit-il dans le Paradis ?",options:["Construisit","Fut tent\u00e9 par Iblis","Gouverna"],correct:1},
    ],
  },
  {
    name: "Nuh",
    nameAr: "\u0646\u0648\u062d",
    nameFr: "No\u00e9",
    title: "Le proph\u00e8te de l'arche",
    story: "No\u00e9 pr\u00eacha 950 ans. Son peuple refusa. Il construisit une arche par ordre d'Allah. Le d\u00e9luge ne sauva que les croyants.",
    reference: "Coran 11:25-49",
    lessons: ["Patience", "Pers\u00e9v\u00e9rance"],
    quiz: [
      {question:"Combien de temps pr\u00eacha-t-il ?",options:["100 ans","950 ans","500 ans"],correct:1},
      {question:"Qu'ordonna Allah ?",options:["Fuir","Construire une arche","Combattre"],correct:1},
      {question:"Qui fut sauv\u00e9 ?",options:["Tout le monde","Les croyants","Les anges"],correct:1},
    ],
  },
  {
    name: "Ibrahim",
    nameAr: "\u0625\u0628\u0631\u0627\u0647\u064a\u0645",
    nameFr: "Abraham",
    title: "Le p\u00e8re des monoth\u00e9istes",
    story: "Abraham brisa les idoles. Jet\u00e9 dans le feu, Allah le sauva. Il construisit la Kaaba avec Isma\u00ebl.",
    reference: "Coran 21:51-73",
    lessons: ["Monoth\u00e9isme", "Courage", "Pri\u00e8re"],
    quiz: [
      {question:"Que fit-il aux idoles ?",options:["Les adora","Les brisa","Les cacha"],correct:1},
      {question:"Dans quoi fut-il jet\u00e9 ?",options:["L'eau","Le feu","Un puits"],correct:1},
      {question:"Que construisit-il ?",options:["Un palais","La Kaaba","Un temple"],correct:1},
    ],
  },
  {
    name: "Yusuf",
    nameAr: "\u064a\u0648\u0633\u0641",
    nameFr: "Joseph",
    title: "Le proph\u00e8te des r\u00eaves",
    story: "Joseph fut jet\u00e9 dans un puits par ses fr\u00e8res. Vendu en \u00c9gypte, emprisonn\u00e9, puis \u00e9lev\u00e9 gr\u00e2ce \u00e0 l'interpr\u00e9tation des r\u00eaves. Il pardonna ses fr\u00e8res.",
    reference: "Coran 12",
    lessons: ["Pardon", "Chastet\u00e9"],
    quiz: [
      {question:"O\u00f9 le jet\u00e8rent ses fr\u00e8res ?",options:["Puits","D\u00e9sert","Lac"],correct:0},
      {question:"Quel talent eut-il ?",options:["Interpr\u00e9tation des r\u00eaves","Guerre","Musique"],correct:0},
      {question:"Que fit-il \u00e0 ses fr\u00e8res ?",options:["Les punit","Les pardonna","Les chassa"],correct:1},
    ],
  },
  {
    name: "Moussa",
    nameAr: "\u0645\u0648\u0633\u0649",
    nameFr: "Mo\u00efse",
    title: "Le proph\u00e8te lib\u00e9rateur",
    story: "Sauv\u00e9 du Nil, \u00e9lev\u00e9 chez Pharaon. Allah lui parla dans le buisson ardent. Il lib\u00e9ra les Isra\u00e9lites et Pharaon se noya.",
    reference: "Coran 28:1-42",
    lessons: ["Courage", "Justice"],
    quiz: [
      {question:"O\u00f9 grandit Mo\u00efse ?",options:["Chez Pharaon","D\u00e9sert","Chez son p\u00e8re"],correct:0},
      {question:"Le b\u00e2ton devint ?",options:["Serpent","Eau","Feu"],correct:0},
      {question:"Pharaon ?",options:["Cru","Noy\u00e9","Fui"],correct:1},
    ],
  },
  {
    name: "Isa",
    nameAr: "\u0639\u064a\u0633\u0649",
    nameFr: "J\u00e9sus",
    title: "Le proph\u00e8te gu\u00e9risseur",
    story: "N\u00e9 de Marie sans p\u00e8re. Il parla d\u00e8s le berceau. Gu\u00e9rissait les malades. Pour les musulmans, proph\u00e8te honor\u00e9.",
    reference: "Coran 3:45-50",
    lessons: ["Miracles", "Humilit\u00e9"],
    quiz: [
      {question:"Comment naquit-il ?",options:["Sans p\u00e8re","Avec Joseph","Adopt\u00e9"],correct:0},
      {question:"Que pouvait-il faire ?",options:["Gu\u00e9rir","Voler","Contr\u00f4ler"],correct:0},
      {question:"Annon\u00e7a qui ?",options:["Mo\u00efse","Muhammad","Personne"],correct:1},
    ],
  },
  {
    name: "Yunus",
    nameAr: "\u064a\u0648\u0646\u0633",
    nameFr: "Jonas",
    title: "Le proph\u00e8te de la baleine",
    story: "Fuyant son peuple, jet\u00e9 \u00e0 la mer. Aval\u00e9 par une baleine 3 jours. Se tourna vers Allah et fut sauv\u00e9.",
    reference: "Coran 37:139-148",
    lessons: ["Repentir", "Espoir"],
    quiz: [
      {question:"Comment fut-il sauv\u00e9 ?",options:["Ange","Baleine","Navire"],correct:1},
      {question:"Dur\u00e9e ?",options:["1 nuit","3 jours","7 jours"],correct:1},
      {question:"Cause temp\u00eate ?",options:["Punition","Fuite","Naturel"],correct:1},
    ],
  },
  {
    name: "Dawud",
    nameAr: "\u062f\u0627\u0648\u062f",
    nameFr: "David",
    title: "Le roi-proph\u00e8te",
    story: "Proph\u00e8te et roi, psalmiste. Combattit Goliath avec une fronde.",
    reference: "Coran 38:17-27",
    lessons: ["Justice", "Musique"],
    quiz: [
      {question:"Instrument ?",options:["Fl\u00fbte","Oud","Tambour"],correct:1},
      {question:"Contre qui ?",options:["Goliath","Pharaon","Iblis"],correct:0},
      {question:"\u00c9criture re\u00e7ue ?",options:["Tor\u00e2h","Zabur","Injil"],correct:1},
    ],
  },
  {
    name: "Ayyub",
    nameAr: "\u0623\u064a\u0648\u0628",
    nameFr: "Job",
    title: "Le proph\u00e8te patient",
    story: "Perdit enfants, biens, sant\u00e9. Ne maudit jamais Allah. Gu\u00e9ri par Sa mis\u00e9ricorde.",
    reference: "Coran 21:83-84",
    lessons: ["Patience", "Confiance"],
    quiz: [
      {question:"Que perdit-il ?",options:["Foi","Enfants, sant\u00e9, biens","Peuple"],correct:1},
      {question:"R\u00e9action ?",options:["Col\u00e8re","Patience","Fuite"],correct:1},
      {question:"Fin ?",options:["Malheureux","Gu\u00e9ri","Pa\u00efen"],correct:1},
    ],
  },
  {
    name: "Sulayman",
    nameAr: "\u0633\u0644\u064a\u0645\u0627\u0646",
    nameFr: "Salomon",
    title: "Le roi sage",
    story: "Parlait aux animaux. H\u00e9rita sagesse et pouvoir de David.",
    reference: "Coran 27",
    lessons: ["Sagesse", "Humilit\u00e9"],
    quiz: [
      {question:"Parlait \u00e0 ?",options:["Anges","Animaux","Esprits"],correct:1},
      {question:"Animal conseiller ?",options:["Lion","Fourmi","Oiseau"],correct:1},
      {question:"Construisit ?",options:["Kaaba","Temple","Palais"],correct:1},
    ],
  },
  {
    name: "Hud",
    nameAr: "\u0647\u0648\u062f",
    nameFr: "Hud",
    title: "Contre l'orgueil",
    story: "Envoy\u00e9 au peuple d'Aad, orgueilleux. Un vent terrible les d\u00e9truisit.",
    reference: "Coran 46:21-26",
    lessons: ["Humilit\u00e9", "Transience"],
    quiz: [
      {question:"P\u00e9ch\u00e9 d'Aad ?",options:["Jalousie","Orgueil","Mensonge"],correct:1},
      {question:"Destruction ?",options:["Feu","Vent","Eau"],correct:1},
      {question:"Constructions ?",options:["Pyramides","Palais","Bateaux"],correct:1},
    ],
  },
  {
    name: "Lut",
    nameAr: "\u0644\u0648\u0637",
    nameFr: "Lot",
    title: "La justice",
    story: "Neveu d'Abraham. Son peuple pratiqua l'immoralit\u00e9. La femme de Lot p\u00e9rit.",
    reference: "Coran 11:77-83",
    lessons: ["R\u00e9sistance", "V\u00e9rit\u00e9"],
    quiz: [
      {question:"Neveu de ?",options:["No\u00e9","Abraham","Ishmael"],correct:1},
      {question:"Peuple ?",options:["\u00c9couta","Attaqua les anges","Convertit"],correct:1},
      {question:"Morte ?",options:["Lot","Femme de Lot","Abraham"],correct:1},
    ],
  },
];
