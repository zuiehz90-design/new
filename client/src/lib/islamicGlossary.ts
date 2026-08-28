/**
 * Lexique des termes islamiques : dictionnaire français-arabe-translittération.
 * Couvre les termes les plus courants rencontrés dans l'app (prières, Coran, fiqh, spiritualité).
 */

export type GlossaryCategory =
  | 'prayer'
  | 'quran'
  | 'fiqh'
  | 'spirituality'
  | 'pillars'
  | 'people'
  | 'places'
  | 'times'
  | 'concepts';

export interface GlossaryTerm {
  term: string;
  termAr: string;
  termFr: string;
  definition: string;
  category: GlossaryCategory;
}

export const CATEGORY_LABELS: Record<GlossaryCategory, { fr: string; en: string; ar: string; icon: string }> = {
  prayer: { fr: 'Prière', en: 'Prayer', ar: 'الصلاة', icon: '🕌' },
  quran: { fr: 'Coran', en: 'Quran', ar: 'القرآن', icon: '📖' },
  fiqh: { fr: 'Fiqh', en: 'Jurisprudence', ar: 'الفقه', icon: '⚖️' },
  spirituality: { fr: 'Spiritualité', en: 'Spirituality', ar: 'الروحانية', icon: '🤲' },
  pillars: { fr: 'Piliers', en: 'Pillars', ar: 'الأركان', icon: '🏛️' },
  people: { fr: 'Personnes', en: 'People', ar: 'الشخصيات', icon: '👤' },
  places: { fr: 'Lieux', en: 'Places', ar: 'الأماكن', icon: '📍' },
  times: { fr: 'Temps', en: 'Times', ar: 'الأوقات', icon: '🕐' },
  concepts: { fr: 'Concepts', en: 'Concepts', ar: 'المفاهيم', icon: '💡' },
};

export const GLOSSARY: GlossaryTerm[] = [
  // --- Piliers ---
  { term: 'Shahada', termAr: 'الشهادة', termFr: 'Profession de foi', definition: 'Le premier pilier de l\'Islam : témoigner qu\'il n\'y a de divinité qu\'Allah et que Muhammad est Son messager.', category: 'pillars' },
  { term: 'Salat', termAr: 'الصلاة', termFr: 'Prière', definition: 'Le deuxième pilier : les cinq prières quotidiennes obligatoires (Fajr, Dhuhr, Asr, Maghrib, Isha).', category: 'pillars' },
  { term: 'Zakat', termAr: 'الزكاة', termFr: 'Aumône légale', definition: 'Le troisième pilier : l\'aumône obligatoire, purificatrice des richesses (2,5% de l\'épargne annuelle).', category: 'pillars' },
  { term: 'Sawm', termAr: 'الصوم', termFr: 'Jeûne', definition: 'Le quatrième pilier : le jeûne du mois de Ramadan de l\'aube au coucher du soleil.', category: 'pillars' },
  { term: 'Hajj', termAr: 'الحج', termFr: 'Pèlerinage', definition: 'Le cinquième pilier : le pèlerinage à La Mecque, obligatoire une fois dans la vie pour ceux qui en ont les moyens.', category: 'pillars' },

  // --- Prières ---
  { term: 'Fajr', termAr: 'الفجر', termFr: 'Aube', definition: 'Prière de l\'aube, accomplie avant le lever du soleil (2 rak\'a).', category: 'prayer' },
  { term: 'Dhuhr', termAr: 'الظهر', termFr: 'Midi', definition: 'Prière du midi, accomplie après le zénith du soleil (4 rak\'a).', category: 'prayer' },
  { term: 'Asr', termAr: 'العصر', termFr: 'Après-midi', definition: 'Prière de l\'après-midi (4 rak\'a).', category: 'prayer' },
  { term: 'Maghrib', termAr: 'المغرب', termFr: 'Coucher du soleil', definition: 'Prière du coucher du soleil (3 rak\'a).', category: 'prayer' },
  { term: 'Isha', termAr: 'العشاء', termFr: 'Nuit', definition: 'Prière de la nuit (4 rak\'a).', category: 'prayer' },
  { term: 'Rak\'a', termAr: 'ركعة', termFr: 'Unité de prière', definition: 'Unité de prière comprenant la station debout, l\'inclinaison (ruku\') et les prosternations (sujud).', category: 'prayer' },
  { term: 'Du\'a', termAr: 'الدعاء', termFr: 'Invocation', definition: 'Supplication adressée à Allah, en dehors de la prière rituelle. Peut être faite en toute langue.', category: 'prayer' },
  { term: 'Witr', termAr: 'الوتر', termFr: 'Prière impaire', definition: 'Prière surérogatoire de la nuit (nombre impair de rak\'a), fortement recommandée.', category: 'prayer' },
  { term: 'Tahajjud', termAr: 'التهجد', termFr: 'Prière de nuit', definition: 'Prière volontaire accomplie la nuit après le sommeil, très méritoire.', category: 'prayer' },
  { term: 'Jumu\'a', termAr: 'الجمعة', termFr: 'Vendredi', definition: 'Prière du vendredi accomplie en communauté à midi, avec un sermon (khutba). Obligatoire pour les hommes.', category: 'prayer' },
  { term: 'Khushu\'', termAr: 'الخشوع', termFr: 'Recueillement', definition: 'Humilité et concentration du cœur pendant la prière.', category: 'prayer' },
  { term: 'Adhan', termAr: 'الأذان', termFr: 'Appel à la prière', definition: 'L\'appel public à la prière lancé depuis le minaret.', category: 'prayer' },
  { term: 'Iqama', termAr: 'الإقامة', termFr: 'Deuxième appel', definition: 'Le second appel immédiatement avant le début de la prière en groupe.', category: 'prayer' },
  { term: 'Qibla', termAr: 'القبلة', termFr: 'Direction', definition: 'La direction de la Ka\'ba à La Mecque, vers laquelle les musulmans prient.', category: 'prayer' },
  { term: 'Sujud', termAr: 'السجود', termFr: 'Prosternation', definition: 'Prosternation totale face au sol pendant la prière, position de la plus grande humilité.', category: 'prayer' },
  { term: 'Ruku\'', termAr: 'الركوع', termFr: 'Inclinaison', definition: 'Inclinaison du buste pendant la prière, mains sur les genoux.', category: 'prayer' },

  // --- Coran ---
  { term: 'Ayah', termAr: 'الآية', termFr: 'Verset', definition: 'Un verset du Coran (pluriel : Ayat). Le Coran compte 6 236 versets.', category: 'quran' },
  { term: 'Surah', termAr: 'السورة', termFr: 'Chapitre', definition: 'Un chapitre du Coran. Il y a 114 sourates de longueurs variables.', category: 'quran' },
  { term: 'Tafsir', termAr: 'التفسير', termFr: 'Exégèse', definition: 'Science de l\'interprétation et du commentaire des versets coraniques.', category: 'quran' },
  { term: 'Tajwid', termAr: 'التجويد', termFr: 'Récitation', definition: 'L\'art de la récitation correcte du Coran selon les règles de prononciation.', category: 'quran' },
  { term: 'Hifz', termAr: 'الحفظ', termFr: 'Mémorisation', definition: 'Mémorisation complète du Coran. Celui qui l\'accomplit est appelé Hafiz.', category: 'quran' },
  { term: 'Hafiz', termAr: 'الحافظ', termFr: 'Mémorisateur', definition: 'Personne qui a mémorisé le Coran en entier (fém. : Hafiza).', category: 'quran' },
  { term: 'Qari', termAr: 'القارئ', termFr: 'Récitateur', definition: 'Celui qui récite le Coran avec maîtrise du Tajwid.', category: 'quran' },
  { term: 'Wahy', termAr: 'الوحي', termFr: 'Révélation', definition: 'La révélation divine, transmise aux prophètes par l\'ange Jibril.', category: 'quran' },
  { term: 'Mushaf', termAr: 'المصحف', termFr: 'Volume du Coran', definition: 'Le livre physique contenant le texte du Coran.', category: 'quran' },

  // --- Fiqh ---
  { term: 'Halal', termAr: 'الحلال', termFr: 'Licite', definition: 'Ce qui est permis en Islam (nourriture, actions, transactions).', category: 'fiqh' },
  { term: 'Haram', termAr: 'الحرام', termFr: 'Illicite', definition: 'Ce qui est interdit en Islam (porc, alcool, usure, etc.).', category: 'fiqh' },
  { term: 'Makruh', termAr: 'المكروه', termFr: 'Déconseillé', definition: 'Action déconseillée sans être strictement interdite. Son délaissement est préférable.', category: 'fiqh' },
  { term: 'Mustahabb', termAr: 'المستحب', termFr: 'Recommandé', definition: 'Action recommandée pour laquelle il y a une récompense mais pas de punition si on la délaisse.', category: 'fiqh' },
  { term: 'Fard', termAr: 'الفرض', termFr: 'Obligatoire', definition: 'Action obligatoire prescrite de manière catégorique (ex: les 5 prières).', category: 'fiqh' },
  { term: 'Wajib', termAr: 'الواجب', termFr: 'Requis', definition: 'Action requise à un degré légèrement inférieur au Fard mais qui engage à responsabilité.', category: 'fiqh' },
  { term: 'Sunnah', termAr: 'السنة', termFr: 'Tradition prophétique', definition: 'Les actes, paroles et approbations du Prophète ﷺ, seconde source de législation après le Coran.', category: 'fiqh' },
  { term: 'Niyya', termAr: 'النية', termFr: 'Intention', definition: 'L\'intention sincère du cœur, condition de validité de tout acte cultuel.', category: 'fiqh' },
  { term: 'Wudu', termAr: 'الوضوء', termFr: 'Ablution mineure', definition: 'Ablutions mineures obligatoires avant la prière : lavage des mains, du visage, des avant-bras, passage des mains sur la tête et lavage des pieds.', category: 'fiqh' },
  { term: 'Ghusl', termAr: 'الغسل', termFr: 'Ablution majeure', definition: 'Ablution majeure du corps entier, nécessaire après un rapport conjugal, l\'éjaculation ou la menstruation.', category: 'fiqh' },
  { term: 'Tayammum', termAr: 'التيمم', termFr: 'Ablution sèche', definition: 'Ablution à la terre/poussière en l\'absence d\'eau ou incapacité d\'en utiliser.', category: 'fiqh' },
  { term: 'Tahara', termAr: 'الطهارة', termFr: 'Purification', definition: 'État de pureté rituelle obtenu par les ablutions.', category: 'fiqh' },
  { term: 'Madhhab', termAr: 'المذهب', termFr: 'École juridique', definition: 'École de jurisprudence islamique. Les 4 principales sunnites : Hanafi, Maliki, Shafi\'i, Hanbali.', category: 'fiqh' },
  { term: 'Fatwa', termAr: 'الفتوى', termFr: 'Avis juridique', definition: 'Avis juridique religieux émis par un savant (mufti) sur une question précise.', category: 'fiqh' },
  { term: 'Riba', termAr: 'الربا', termFr: 'Usure', definition: 'L\'usure, strictement interdite en Islam. Inclut les intérêts bancaires.', category: 'fiqh' },

  // --- Spiritualité ---
  { term: 'Tawhid', termAr: 'التوحيد', termFr: 'Unicité', definition: 'L\'unicité d\'Allah, le fondement de la foi islamique : Allah est Un, sans associé.', category: 'spirituality' },
  { term: 'Tawakkul', termAr: 'التوكل', termFr: 'Confiance', definition: 'La confiance absolue en Allah, après avoir fait les efforts nécessaires.', category: 'spirituality' },
  { term: 'Sabr', termAr: 'الصبر', termFr: 'Patience', definition: 'La patience et la persévérance face aux épreuves, avec foi en Allah.', category: 'spirituality' },
  { term: 'Shukr', termAr: 'الشكر', termFr: 'Gratitude', definition: 'La reconnaissance envers Allah pour Ses bienfaits.', category: 'spirituality' },
  { term: 'Dhikr', termAr: 'الذكر', termFr: 'Évocation', definition: 'L\'évocation d\'Allah par la répétition de formules (ex: Subhan Allah, Alhamdulillah, Allahu Akbar).', category: 'spirituality' },
  { term: 'Tasbih', termAr: 'التسبيح', termFr: 'Glorification', definition: 'Glorification d\'Allah, souvent accompli sur un chapelet (Misbaha) de 33 ou 99 perles.', category: 'spirituality' },
  { term: 'Istighfar', termAr: 'الاستغفار', termFr: 'Demande de pardon', definition: 'Le fait de demander pardon à Allah (ex: « Astaghfiru Allah »).', category: 'spirituality' },
  { term: 'Ihsan', termAr: 'الإحسان', termFr: 'Excellence', definition: 'Adorer Allah comme si on Le voyait, car si on ne Le voit pas, Lui nous voit.', category: 'spirituality' },
  { term: 'Taqwa', termAr: 'التقوى', termFr: 'Piété', definition: 'La crainte pieuse d\'Allah, se préserver du péché par conscience divine.', category: 'spirituality' },
  { term: 'Rida', termAr: 'الرضا', termFr: 'Agrément', definition: 'L\'agrément et la satisfaction des décrets divins, stade spirituel élevé.', category: 'spirituality' },
  { term: 'Baraka', termAr: 'البركة', termFr: 'Bénédiction', definition: 'La bénédiction divine qui multiplie le bien dans une chose, un temps ou un lieu.', category: 'spirituality' },
  { term: 'Nafs', termAr: 'النفس', termFr: 'Âme', definition: 'L\'âme, le soi intérieur. Sa purification est un devoir (Tazkiyat an-Nafs).', category: 'spirituality' },

  // --- Personnes ---
  { term: 'Nabi', termAr: 'النبي', termFr: 'Prophète', definition: 'Un prophète envoyé par Allah pour guider les hommes.', category: 'people' },
  { term: 'Rasul', termAr: 'الرسول', termFr: 'Messager', definition: 'Un messager prophète à qui fut révélée une nouvelle loi (ex: Musa, \'Isa, Muhammad ﷺ).', category: 'people' },
  { term: 'Sahaba', termAr: 'الصحابة', termFr: 'Compagnons', definition: 'Les compagnons du Prophète ﷺ (sing. Sahabi), qui le virent et moururent dans la foi.', category: 'people' },
  { term: 'Tabi\'un', termAr: 'التابعون', termFr: 'Successeurs', definition: 'La génération après les Compagnons, qui suivit leurs enseignements.', category: 'people' },
  { term: 'Ulama', termAr: 'العلماء', termFr: 'Savants', definition: 'Les savants religieux qui maîtrisent les sciences islamiques.', category: 'people' },
  { term: 'Imam', termAr: 'الإمام', termFr: 'Guide', definition: 'Celui qui dirige la prière en commun. Désigne aussi un grand savant (ex: les 4 imams des madhhabs).', category: 'people' },
  { term: 'Mufti', termAr: 'المفتي', termFr: 'Jurisconsulte', definition: 'Savant habilité à émettre des fatwas.', category: 'people' },

  // --- Lieux ---
  { term: 'Ka\'ba', termAr: 'الكعبة', termFr: 'Ka\'ba', definition: 'Le monument cubique au centre de la Mosquée sacrée à La Mecque, première maison bâtie pour Allah.', category: 'places' },
  { term: 'Masjid', termAr: 'المسجد', termFr: 'Mosquée', definition: 'Lieu de prosternation, la mosquée.', category: 'places' },
  { term: 'Masjid al-Haram', termAr: 'المسجد الحرام', termFr: 'Mosquée sacrée', definition: 'La Grande Mosquée de La Mecque qui entoure la Ka\'ba, plus grande mosquée du monde.', category: 'places' },
  { term: 'Masjid an-Nabawi', termAr: 'المسجد النبوي', termFr: 'Mosquée du Prophète', definition: 'La mosquée du Prophète ﷺ à Médine, second lieu saint de l\'Islam.', category: 'places' },
  { term: 'Makkah', termAr: 'مكة', termFr: 'La Mecque', definition: 'Ville sainte d\'Arabie, lieu de naissance du Prophète ﷺ et de la Ka\'ba.', category: 'places' },
  { term: 'Madinah', termAr: 'المدينة', termFr: 'Médine', definition: 'Ville où le Prophète ﷺ émigra en 622 (Hégire), siège de la première communauté musulmane.', category: 'places' },
  { term: 'Bayt al-Maqdis', termAr: 'بيت المقدس', termFr: 'Jérusalem', definition: 'Jérusalem, troisième lieu saint. Du sommet du rocher s\'éleva le Prophète ﷺ lors du Mi\'raj.', category: 'places' },
  { term: 'Mina', termAr: 'منى', termFr: 'Mina', definition: 'Site près de La Mecque où les pèlerins lancent les jamarat (stèles) durant le Hajj.', category: 'places' },
  { term: 'Arafat', termAr: 'عرفات', termFr: 'Arafat', definition: 'Plaine près de La Mecque, lieu du wukuf (station) le 9 Dhou al-Hijja, rite essentiel du Hajj.', category: 'places' },

  // --- Temps ---
  { term: 'Laylat al-Qadr', termAr: 'ليلة القدر', termFr: 'Nuit du Destin', definition: 'Nuit de la révélation du Coran, dans les 10 dernières nuits de Ramadan. « Mieux que mille mois » (Sourate 97).', category: 'times' },
  { term: 'Ramadan', termAr: 'رمضان', termFr: 'Ramadan', definition: '9e mois hégirien, mois du jeûne obligatoire, de la révélation coranique et de la piété.', category: 'times' },
  { term: 'Laylat al-Bara\'ah', termAr: 'ليلة البراءة', termFr: 'Nuit du milieu', definition: 'Nuit du 15 Cha\'ban, nuit de pardon et de miséricorde.', category: 'times' },
  { term: 'Ashura', termAr: 'عاشوراء', termFr: 'Achoura', definition: 'Le 10 Mouharram, jour de jeûne recommandé.', category: 'times' },
  { term: 'Eid al-Fitr', termAr: 'عيد الفطر', termFr: 'Aïd al-Fitr', definition: 'Fête marquant la fin du jeûne de Ramadan, le 1er Chawwal.', category: 'times' },
  { term: 'Eid al-Adha', termAr: 'عيد الأضحى', termFr: 'Aïd al-Adha', definition: 'Fête du Sacrifice, le 10 Dhou al-Hijja, pendant le Hajj.', category: 'times' },

  // --- Concepts ---
  { term: 'Din', termAr: 'الدين', termFr: 'Religion', definition: 'La religion, le mode de vie soumis à Allah.', category: 'concepts' },
  { term: 'Dunya', termAr: 'الدنيا', termFr: 'Monde d\'ici-bas', definition: 'La vie terrestre, par opposition à Akhira (l\'au-delà).', category: 'concepts' },
  { term: 'Akhira', termAr: 'الآخرة', termFr: 'Au-delà', definition: 'La vie future : Paradis (Jannah) ou Enfer (Jahannam) après le Jugement.', category: 'concepts' },
  { term: 'Jannah', termAr: 'الجنة', termFr: 'Paradis', definition: 'Le Paradis, demeure finale des croyants.', category: 'concepts' },
  { term: 'Jahannam', termAr: 'جهنم', termFr: 'Enfer', definition: 'L\'Enfer, demeure des injustes.', category: 'concepts' },
  { term: 'Jinn', termAr: 'الجن', termFr: 'Djinn', definition: 'Créatures de feu invisibles, dotées de libre arbitre comme les humains.', category: 'concepts' },
  { term: 'Shaytan', termAr: 'الشيطان', termFr: 'Satan', definition: 'Iblis, le diable, qui refusa de se prosterner devant Adam et tente les humains vers le mal.', category: 'concepts' },
  { term: 'Fitna', termAr: 'الفتنة', termFr: 'Épreuve', definition: 'Épreuve, tentation ou trouble qui met la foi à l\'épreuve.', category: 'concepts' },
  { term: 'Hikma', termAr: 'الحكمة', termFr: 'Sagesse', definition: 'La sagesse, la bonne parole et le bon comportement.', category: 'concepts' },
  { term: 'Ummah', termAr: 'الأمة', termFr: 'Communauté', definition: 'La communauté musulmane mondiale, unie par la foi.', category: 'concepts' },
  { term: 'Sadaqa', termAr: 'الصدقة', termFr: 'Charité', definition: 'Aumône volontaire (par opposition à la Zakat obligatoire).', category: 'concepts' },
  { term: 'Kafir', termAr: 'الكافر', termFr: 'Mécréant', definition: 'Celui qui rejette la foi et la vérité divine.', category: 'concepts' },
  { term: 'Mumin', termAr: 'المؤمن', termFr: 'Croyant', definition: 'Celui qui a la foi sincère en Allah et en Ses messagers.', category: 'concepts' },
  { term: 'Tawbah', termAr: 'التوبة', termFr: 'Repentir', definition: 'Le repentir sincère : regret, abandon du péché, ferme intention de ne plus y revenir.', category: 'concepts' },
  { term: 'Hijab', termAr: 'الحجاب', termFr: 'Voile', definition: 'Le voile couvrant les cheveux et le cou des femmes musulmanes, prescrit par le Coran.', category: 'concepts' },
  { term: 'Niqab', termAr: 'النقاب', termFr: 'Niqab', definition: 'Voile facial ne laissant visible que les yeux, porté par certaines musulmanes.', category: 'concepts' },
  { term: 'Kufr', termAr: 'الكفر', termFr: 'Mécréance', definition: 'Le rejet ou l\'ingratitude envers Allah et Sa révélation.', category: 'concepts' },
  { term: 'Iman', termAr: 'الإيمان', termFr: 'Foi', definition: 'La foi islamique : croire en Allah, Ses anges, Ses livres, Ses messagers, le Jour Dernier et le Destin.', category: 'concepts' },
  { term: 'Islam', termAr: 'الإسلام', termFr: 'Soumission', definition: 'La soumission volontaire à Allah. Religion révélée au Prophète Muhammad ﷺ.', category: 'concepts' },
  { term: 'Ihsan', termAr: 'الإحسان', termFr: 'Bienfaisance', definition: 'L\'excellence dans l\'adoration et le comportement, comme si l\'on voyait Allah.', category: 'concepts' },
  { term: 'Wali', termAr: 'الولي', termFr: 'Allié', definition: 'Allié (de Allah) : pieux croyant rapproché d\'Allah. Désigne aussi le tuteur légal.', category: 'concepts' },
  { term: 'Qadar', termAr: 'القدر', termFr: 'Destin', definition: 'Le Destin divin : Allah a tout prédestiné avec Sa science, Sa sagesse et Sa volonté.', category: 'concepts' },
  { term: 'Bid\'a', termAr: 'البدعة', termFr: 'Innovation', definition: 'Innovation religieuse non attestée dans le Coran et la Sunnah, blâmable sauf exception.', category: 'concepts' },
  { term: 'Tasawwuf', termAr: 'التصوف', termFr: 'Soufisme', definition: 'La voie spirituelle de l\'introspection et du rapprochement d\'Allah par la piété et l\'ascèse.', category: 'concepts' },
  { term: 'Zuhd', termAr: 'الزهد', termFr: 'Ascèse', definition: 'Le détachement volontaire des biens et vanités du monde pour se tourner vers l\'au-delà.', category: 'concepts' },
  { term: 'Adab', termAr: 'الأدب', termFr: 'Bonnes manières', definition: 'Les bonnes manières et la bienséance islamique, savoir-vivre du musulman.', category: 'concepts' },
  { term: 'Sadaqah Jariyah', termAr: 'صدقة جارية', termFr: 'Charité continue', definition: 'Aumône pérenne dont les mérites continuent après la mort (ex: puits, mosquée, savoir).', category: 'concepts' },
  { term: 'Istikhara', termAr: 'الاستخارة', termFr: 'Demande de choix', definition: 'Prière de consultation demandant à Allah de guider vers le meilleur choix dans une hésitation.', category: 'prayer' },
  { term: 'Khutba', termAr: 'الخطبة', termFr: 'Sermon', definition: 'Le sermon du vendredi et des deux Aïd, prononcé par l\'imam debout sur la chaire (minbar).', category: 'prayer' },
  { term: 'Minbar', termAr: 'المنبر', termFr: 'Chaire', definition: 'La chaire de la mosquée, placée à droite du mihrab, d\'où l\'imam délivre la khutba.', category: 'places' },
  { term: 'Mihrab', termAr: 'المحراب', termFr: 'Niche', definition: 'Niche indiquant la Qibla dans la mosquée, où se tient l\'imam pour diriger la prière.', category: 'places' },
  { term: 'Misbaha', termAr: 'المسبحة', termFr: 'Chapelet', definition: 'Chapelet de 33 ou 99 perles utilisé pour compter le dhikr.', category: 'spirituality' },
  { term: 'Janaza', termAr: 'الجنازة', termFr: 'Funérailles', definition: 'Prière funéraire en commun sur le défunt, debout sans ruku\' ni sujud.', category: 'prayer' },
  { term: 'Ghusl al-Janazah', termAr: 'غسل الجنازة', termFr: 'Lavage du défunt', definition: 'Lavage rituel du corps du défunt avant l\'enterrement.', category: 'fiqh' },
  { term: 'Kafan', termAr: 'الكفن', termFr: 'Linceul', definition: 'Tissus blancs enveloppant le défunt, identiques pour tous quelle que soit sa richesse.', category: 'fiqh' },
  { term: 'Sadaqat al-Fitr', termAr: 'صدقة الفطر', termFr: 'Aumône de rupture', definition: 'Aumône obligatoire versée avant la prière de l\'Aïd al-Fitr, pour purifier le jeûneur et nourrir le pauvre.', category: 'fiqh' },
  { term: 'I\'tikaf', termAr: 'الاعتكاف', termFr: 'Retraite spirituelle', definition: 'Retraite pieuse dans la mosquée, surtout durant les 10 derniers jours de Ramadan.', category: 'spirituality' },
  { term: 'Tarawih', termAr: 'التراويح', termFr: 'Prières de repos', definition: 'Prière nocturne surérogatoire accomplie en groupe pendant le Ramadan, après Isha.', category: 'prayer' },
  { term: 'Sahur', termAr: 'السحور', termFr: 'Repas de l\'aube', definition: 'Repas pris avant l\'aube pour débuter le jeûne de la journée de Ramadan, recommandé.', category: 'times' },
  { term: 'Iftar', termAr: 'الإفطار', termFr: 'Rupture', definition: 'Repas rompant le jeûne au coucher du soleil.', category: 'times' },
];

/** Recherche dans le glossaire par terme, nom français ou arabe. */
export function searchGlossary(query: string, category?: GlossaryCategory | 'all'): GlossaryTerm[] {
  const q = query.trim().toLowerCase();
  let results = GLOSSARY;

  if (category && category !== 'all') {
    results = results.filter((t) => t.category === category);
  }

  if (!q) {
    return [...results].sort((a, b) => a.term.localeCompare(b.term));
  }

  return results
    .filter((t) =>
      t.term.toLowerCase().includes(q) ||
      t.termFr.toLowerCase().includes(q) ||
      t.termAr.includes(query.trim()) ||
      t.definition.toLowerCase().includes(q)
    )
    .sort((a, b) => {
      // Priorité: terme qui commence par la requête
      const aStarts = a.term.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.term.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts;
    });
}

/** Toutes les catégories existantes. */
export const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as GlossaryCategory[];

/** Termes groupés par lettre alphabétique. */
export function getAlphabeticalIndex(category?: GlossaryCategory | 'all'): Record<string, GlossaryTerm[]> {
  const terms = category && category !== 'all' ? GLOSSARY.filter((t) => t.category === category) : GLOSSARY;
  const index: Record<string, GlossaryTerm[]> = {};
  for (const t of terms) {
    const letter = t.term[0].toUpperCase();
    if (!index[letter]) index[letter] = [];
    index[letter].push(t);
  }
  for (const k of Object.keys(index)) {
    index[k].sort((a, b) => a.term.localeCompare(b.term));
  }
  return index;
}
