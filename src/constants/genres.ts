export interface GenreOption {
  id: string;
  name: string;
  emoji: string;
  label: string;
  description: string;
  gradient: string;
}

/**
 * Predefined genre categories based on databazeknih.cz taxonomy,
 * organized into modern, playful categories with emojis and gradients.
 */
export const PREDEFINED_GENRES: GenreOption[] = [
  {
    id: 'romany-beletrie',
    name: 'Romány & Beletrie',
    emoji: '📖',
    label: '📖 Romány & Beletrie',
    description: 'Romány, novely, povídky, světová a česká beletrie',
    gradient: 'from-rose-500 to-pink-700'
  },
  {
    id: 'scifi-fantasy',
    name: 'Sci-fi & Fantasy',
    emoji: '🚀',
    label: '🚀 Sci-fi & Fantasy',
    description: 'Vědecká fantastika, sci-fi, fantasy, kyberpunk a dystopie',
    gradient: 'from-purple-600 to-indigo-800'
  },
  {
    id: 'detektivky-thrillery',
    name: 'Detektivky & Thrillery',
    emoji: '🔍',
    label: '🔍 Detektivky & Thrillery',
    description: 'Detektivky, krimi romány, thrillery, napětí a záhady',
    gradient: 'from-slate-700 to-zinc-900'
  },
  {
    id: 'horory-napeti',
    name: 'Horory & Temné příběhy',
    emoji: '👻',
    label: '👻 Horory & Temné příběhy',
    description: 'Horory, strašidelné a mysteriózní příběhy',
    gradient: 'from-stone-800 to-neutral-950'
  },
  {
    id: 'pro-zeny-divky',
    name: 'Pro ženy & Romantika',
    emoji: '💖',
    label: '💖 Pro ženy & Romantika',
    description: 'Romantika, milostné a dívčí romány, erotika, harlekýnky',
    gradient: 'from-pink-500 to-rose-600'
  },
  {
    id: 'pro-deti-mladez',
    name: 'Pro děti & Mládež',
    emoji: '🧸',
    label: '🧸 Pro děti & Mládež',
    description: 'Pohádky, knížky pro nejmenší, mládež, Young Adult a komiksy pro děti',
    gradient: 'from-emerald-500 to-teal-700'
  },
  {
    id: 'komiksy-manga',
    name: 'Komiksy & Manga',
    emoji: '💥',
    label: '💥 Komiksy & Manga',
    description: 'Komiksy, grafické romány, manga a ilustrované příběhy',
    gradient: 'from-amber-500 to-red-600'
  },
  {
    id: 'historie-biografie',
    name: 'Historie & Biografie',
    emoji: '📜',
    label: '📜 Historie & Biografie',
    description: 'Historické romány, dějiny, memoáry, biografie a válečná literatura',
    gradient: 'from-amber-700 to-stone-900'
  },
  {
    id: 'naucna-odborna',
    name: 'Naučná & Odborná literatura',
    emoji: '💡',
    label: '💡 Naučná & Odborná literatura',
    description: 'Literatura faktu, věda, technika, IT, ekonomie, politika a právo',
    gradient: 'from-amber-600 to-orange-700'
  },
  {
    id: 'edukacni-ucebni',
    name: 'Učebnice & Vzdělávání',
    emoji: '🎓',
    label: '🎓 Učebnice & Vzdělávání',
    description: 'Učebnice, slovníky, jazyky, lingvistika a školní literatura',
    gradient: 'from-blue-600 to-cyan-700'
  },
  {
    id: 'osobni-rozvoj',
    name: 'Osobní rozvoj & Psychologie',
    emoji: '🧘',
    label: '🧘 Osobní rozvoj & Psychologie',
    description: 'Motivace, seberozvoj, psychologie, zdraví, rodina a partnerské vztahy',
    gradient: 'from-[#800020] to-rose-900'
  },
  {
    id: 'kucharky-gastronomie',
    name: 'Kuchařky & Gastronomie',
    emoji: '🍳',
    label: '🍳 Kuchařky & Gastronomie',
    description: 'Kuchařky, recepty, zdravá výživa a nápoje',
    gradient: 'from-orange-500 to-amber-700'
  },
  {
    id: 'cestopisy-geografie',
    name: 'Cestopisy & Průvodce',
    emoji: '🧭',
    label: '🧭 Cestopisy & Průvodce',
    description: 'Cestopisy, místopisy, turistické průvodce, mapy a atlasy',
    gradient: 'from-teal-600 to-emerald-800'
  },
  {
    id: 'umeni-kultura',
    name: 'Umění & Kultura',
    emoji: '🎨',
    label: '🎨 Umění & Kultura',
    description: 'Výtvarné umění, hudba, divadlo, film, architektura a design',
    gradient: 'from-fuchsia-600 to-pink-800'
  },
  {
    id: 'poezie-divadlo',
    name: 'Poezie & Divadelní hry',
    emoji: '🎭',
    label: '🎭 Poezie & Divadelní hry',
    description: 'Básnické sbírky, poezie, divadelní a rozhlasové hry',
    gradient: 'from-violet-600 to-purple-800'
  },
  {
    id: 'filozofie-duchovno',
    name: 'Filozofie & Duchovno',
    emoji: '✨',
    label: '✨ Filozofie & Duchovno',
    description: 'Filozofie, náboženství, duchovní literatura, mytologie a esoterika',
    gradient: 'from-indigo-600 to-sky-800'
  },
  {
    id: 'priroda-zvirata',
    name: 'Příroda & Zvířata',
    emoji: '🌿',
    label: '🌿 Příroda & Zvířata',
    description: 'Ekologie, zvířata, zoologie, botanika, zahrada a chovatelství',
    gradient: 'from-green-600 to-emerald-900'
  },
  {
    id: 'ostatni',
    name: 'Ostatní / Nezařazeno',
    emoji: '❓',
    label: '❓ Ostatní / Nezařazeno',
    description: 'Knihy nezařazené do žádné z výše uvedených kategorií',
    gradient: 'from-gray-600 to-gray-800'
  }
];

export const DEFAULT_GENRE = '❓ Ostatní / Nezařazeno';

/**
 * Direct mapping dictionary from official Databazeknih.cz genres/tags to predefined genres.
 * Sourced from https://www.databazeknih.cz/zanry-a-kategorie-knih
 */
export const DATABAZE_KNIH_GENRE_MAP: Record<string, string> = {
  // Beletrie & próza
  'romány': '📖 Romány & Beletrie',
  'roman': '📖 Romány & Beletrie',
  'novely': '📖 Romány & Beletrie',
  'novela': '📖 Romány & Beletrie',
  'povídky': '📖 Romány & Beletrie',
  'povidky': '📖 Romány & Beletrie',
  'literatura česká': '📖 Romány & Beletrie',
  'literatura slovenská': '📖 Romány & Beletrie',
  'literatura světová': '📖 Romány & Beletrie',
  'příběhy': '📖 Romány & Beletrie',
  'humor': '📖 Romány & Beletrie',
  'fejetony, eseje': '📖 Romány & Beletrie',
  'citáty a přísloví': '📖 Romány & Beletrie',
  'dobrodružné': '📖 Romány & Beletrie',

  // Sci-fi & Fantasy
  'sci-fi': '🚀 Sci-fi & Fantasy',
  'fantasy': '🚀 Sci-fi & Fantasy',
  'gamebooky': '🚀 Sci-fi & Fantasy',
  'dystopie': '🚀 Sci-fi & Fantasy',
  'antiutopie, dystopie, kakotopie': '🚀 Sci-fi & Fantasy',

  // Detektivky, Krimi, Thrillery
  'detektivky, krimi': '🔍 Detektivky & Thrillery',
  'detektivky': '🔍 Detektivky & Thrillery',
  'krimi': '🔍 Detektivky & Thrillery',
  'thrillery': '🔍 Detektivky & Thrillery',
  'detektivní a krimi romány': '🔍 Detektivky & Thrillery',
  'záhady': '🔍 Detektivky & Thrillery',

  // Horory
  'horory': '👻 Horory & Temné příběhy',
  'horor': '👻 Horory & Temné příběhy',

  // Pro ženy & romantika
  'pro ženy': '💖 Pro ženy & Romantika',
  'dívčí romány': '💖 Pro ženy & Romantika',
  'erotika': '💖 Pro ženy & Romantika',
  'romantika': '💖 Pro ženy & Romantika',
  'romány pro ženy': '💖 Pro ženy & Romantika',
  'harlekýnky': '💖 Pro ženy & Romantika',
  'láska': '💖 Pro ženy & Romantika',

  // Pro děti & mládež
  'pro děti a mládež': '🧸 Pro děti & Mládež',
  'pro děti': '🧸 Pro děti & Mládež',
  'pro nejmenší': '🧸 Pro děti & Mládež',
  'pohádky a bajky': '🧸 Pro děti & Mládež',
  'pohádky': '🧸 Pro děti & Mládež',
  'pověsti': '🧸 Pro děti & Mládež',
  'šikovné děti - tvoření, hry, styl': '🧸 Pro děti & Mládež',
  'pro dospívající mládež (young adult)': '🧸 Pro děti & Mládež',
  'young adult': '🧸 Pro děti & Mládež',
  'omalovánky': '🧸 Pro děti & Mládež',

  // Komiksy & manga
  'komiksy': '💥 Komiksy & Manga',
  'komiks': '💥 Komiksy & Manga',
  'komiks, komiksy': '💥 Komiksy & Manga',
  'manga': '💥 Komiksy & Manga',

  // Historie, biografie, válka
  'historické romány': '📜 Historie & Biografie',
  'historie': '📜 Historie & Biografie',
  'biografie a memoáry': '📜 Historie & Biografie',
  'životopis': '📜 Historie & Biografie',
  'válečné': '📜 Historie & Biografie',
  'vojenství': '📜 Historie & Biografie',

  // Naučná a odborná literatura
  'literatura naučná': '💡 Naučná & Odborná literatura',
  'literatura faktu': '💡 Naučná & Odborná literatura',
  'věda': '💡 Naučná & Odborná literatura',
  'přírodní vědy': '💡 Naučná & Odborná literatura',
  'vesmír': '💡 Naučná & Odborná literatura',
  'matematika a logika': '💡 Naučná & Odborná literatura',
  'technika a elektro': '💡 Naučná & Odborná literatura',
  'pc literatura': '💡 Naučná & Odborná literatura',
  'ekonomie a obchod': '💡 Naučná & Odborná literatura',
  'průmysl': '💡 Naučná & Odborná literatura',
  'doprava': '💡 Naučná & Odborná literatura',
  'právo': '💡 Naučná & Odborná literatura',
  'sociologie': '💡 Naučná & Odborná literatura',
  'společnost': '💡 Naučná & Odborná literatura',
  'politologie, mezinárodní vztahy': '💡 Naučná & Odborná literatura',
  'žurnalistika, publicistika': '💡 Naučná & Odborná literatura',
  'encyklopedie': '💡 Naučná & Odborná literatura',

  // Učebnice & vzdělávání
  'učebnice a slovníky': '🎓 Učebnice & Vzdělávání',
  'učebnice': '🎓 Učebnice & Vzdělávání',
  'slovníky': '🎓 Učebnice & Vzdělávání',
  'vzdělávání, školství': '🎓 Učebnice & Vzdělávání',
  'jazyky, lingvistika': '🎓 Učebnice & Vzdělávání',

  // Osobní rozvoj, zdraví, rodina
  'osobní rozvoj a styl': '🧘 Osobní rozvoj & Psychologie',
  'osobní rozvoj': '🧘 Osobní rozvoj & Psychologie',
  'psychologie a pedagogika': '🧘 Osobní rozvoj & Psychologie',
  'psychologie': '🧘 Osobní rozvoj & Psychologie',
  'zdraví': '🧘 Osobní rozvoj & Psychologie',
  'zdravotnictví': '🧘 Osobní rozvoj & Psychologie',
  'rodina': '🧘 Osobní rozvoj & Psychologie',
  'dům a byt': '🧘 Osobní rozvoj & Psychologie',
  'hobby': '🧘 Osobní rozvoj & Psychologie',
  'sport': '🧘 Osobní rozvoj & Psychologie',

  // Kuchařky
  'kuchařky': '🍳 Kuchařky & Gastronomie',
  'kuchařka': '🍳 Kuchařky & Gastronomie',

  // Cestopisy & místopisy
  'cestopisy a místopisy': '🧭 Cestopisy & Průvodce',
  'cestopisy': '🧭 Cestopisy & Průvodce',
  'turistické průvodce': '🧭 Cestopisy & Průvodce',
  'mapy a atlasy': '🧭 Cestopisy & Průvodce',
  'pragensia': '🧭 Cestopisy & Průvodce',

  // Umění a kultura
  'umění': '🎨 Umění & Kultura',
  'architektura': '🎨 Umění & Kultura',
  'hudba a zpěv': '🎨 Umění & Kultura',
  'obrazové publikace': '🎨 Umění & Kultura',
  'o literatuře': '🎨 Umění & Kultura',

  // Poezie & divadlo
  'poezie': '🎭 Poezie & Divadelní hry',
  'divadelní hry': '🎭 Poezie & Divadelní hry',

  // Filozofie & duchovno
  'filozofie': '✨ Filozofie & Duchovno',
  'náboženství': '✨ Filozofie & Duchovno',
  'duchovní literatura': '✨ Filozofie & Duchovno',
  'mytologie': '✨ Filozofie & Duchovno',
  'esoterika, astrologie, okultismus': '✨ Filozofie & Duchovno',
  'new age': '✨ Filozofie & Duchovno',

  // Příroda & zvířata
  'příroda, zvířata': '🌿 Příroda & Zvířata',
  'ekologie, životní prostředí': '🌿 Příroda & Zvířata',
  'zahrada': '🌿 Příroda & Zvířata',
  'zemědělství': '🌿 Příroda & Zvířata'
};

/**
 * Keyword rules for intelligently inferring genre from book title, author, or description
 * when API categories are empty or generic.
 */
const INFERENCE_RULES: Array<{ keywords: string[]; genreLabel: string }> = [
  // Sci-fi & Fantasy
  {
    keywords: [
      'sci-fi', 'fantasy', 'vědeckofantastický', 'vesmír', 'robot', 'galaxi',
      'drak', 'kouzl', 'čaroděj', 'magie', 'elf', 'trpaslík', 'dystop', 'zaklínač',
      'hvězdn', 'mimozemšťan', 'kyber', 'apokalyps', 'steampunk'
    ],
    genreLabel: '🚀 Sci-fi & Fantasy'
  },
  // Detektivky & Krimi
  {
    keywords: [
      'detektiv', 'krimi', 'vražda', 'vyšetřovatel', 'inspektor', 'pachatel',
      'thriller', 'záhada', 'zločin', 'špion', 'napětí', 'komisař', 'sherlock',
      'agatha christie', 'mord', 'policie', 'podezřel'
    ],
    genreLabel: '🔍 Detektivky & Thrillery'
  },
  // Horory
  {
    keywords: [
      'horor', 'strašidel', 'děsiv', 'upír', 'vlkodlak', 'přízrak', 'duchov',
      'monstrum', 'hřbitov', 'zombie', 'temnota', 'hrůz', 'stephen king'
    ],
    genreLabel: '👻 Horory & Temné příběhy'
  },
  // Pro děti & Mládež
  {
    keywords: [
      'pohádk', 'pro děti', 'pro nejmenší', 'ilustrované pro děti', 'večerníček',
      'broučci', 'krteček', 'rychlé šípy', 'pohádka', 'bajky', 'dětský', 'školák',
      'děti od', 'pro předškoláky', 'young adult', 'mládež'
    ],
    genreLabel: '🧸 Pro děti & Mládež'
  },
  // Komiksy
  {
    keywords: ['komiks', 'comic', 'manga', 'grafický román', 'bubliny', 'marvel', 'dc comics'],
    genreLabel: '💥 Komiksy & Manga'
  },
  // Kuchařky
  {
    keywords: [
      'kuchařk', 'recept', 'vaření', 'pečení', 'gastronom', 'babiččiny recepty',
      'polévk', 'koláč', 'chléb', 'kuchyně', 'jídlo', 'dezert', 'cukroví'
    ],
    genreLabel: '🍳 Kuchařky & Gastronomie'
  },
  // Cestopisy
  {
    keywords: [
      'cestopis', 'průvodce', 'putování', 'napříč', 'expedice', 'stopem',
      'turistický', 'památky', 'kolem světa', 'mapa', 'atlas'
    ],
    genreLabel: '🧭 Cestopisy & Průvodce'
  },
  // Poezie & Divadlo
  {
    keywords: [
      'básn', 'poezie', 'sbírka básní', 'verše', 'divadelní hra', 'tragédie',
      'komedie o', 'činohra', 'lyrika', 'sonet'
    ],
    genreLabel: '🎭 Poezie & Divadelní hry'
  },
  // Historie & Biografie
  {
    keywords: [
      'historie', 'dějiny', 'středověk', 'druhá světová', 'válka', 'válce',
      'starověk', 'biografie', 'životopis', 'paměti', 'vzpomínky', 'memoáry',
      'panovník', 'císař', 'král', 'kronika', 'archeolog'
    ],
    genreLabel: '📜 Historie & Biografie'
  },
  // Osobní rozvoj & Psychologie
  {
    keywords: [
      'osobní rozvoj', 'seberozvoj', 'psycholog', 'motivace', 'úspěch', 'štěstí',
      'jak myslet', 'návyky', 'mindfulness', 'meditace', 'zvládání', 'trauma',
      'emoce', 'výchova', 'rodičovství', 'partnerství', 'sebedůvěra'
    ],
    genreLabel: '🧘 Osobní rozvoj & Psychologie'
  },
  // Filozofie & Duchovno
  {
    keywords: [
      'filozof', 'náboženství', 'bible', 'buddhism', 'křesťan', 'mytologie',
      'bůh', 'duchov', 'spiritualita', 'teologie', 'evangelium', 'meditace'
    ],
    genreLabel: '✨ Filozofie & Duchovno'
  },
  // Příroda & Zvířata
  {
    keywords: [
      'příroda', 'zvířat', 'pes', 'kočka', 'ptáci', 'fauna', 'flóra',
      'ekologie', 'les', 'stromy', 'zahrada', 'chov', 'botanika', 'zoologie'
    ],
    genreLabel: '🌿 Příroda & Zvířata'
  },
  // Učebnice & Vzdělávání
  {
    keywords: [
      'učebnice', 'cvičebnice', 'slovník', 'gramatika', 'pro základní školy',
      'pro střední školy', 'skripta', 'příprava k maturitě', 'přijímačk'
    ],
    genreLabel: '🎓 Učebnice & Vzdělávání'
  },
  // Romány & Beletrie
  {
    keywords: ['román', 'novela', 'povídky', 'příběh', 'beletrie', 'balada', 'kronika rodu'],
    genreLabel: '📖 Romány & Beletrie'
  }
];

/**
 * Maps raw input categories (from Databazeknih.cz, Google Books API, Knihovny.cz, OpenLibrary, etc.)
 * to predefined Czech genre labels with emojis.
 */
export function mapCategoriesToPredefinedGenres(rawCategories: string[]): string[] {
  if (!rawCategories || rawCategories.length === 0) {
    return [DEFAULT_GENRE];
  }

  const result = new Set<string>();

  for (const rawCat of rawCategories) {
    if (!rawCat) continue;
    const cleanCat = rawCat.replace(/^Category:\s*/i, '').trim();

    // Check full string first (e.g. "Příroda, zvířata", "Detektivky, krimi")
    const fullLower = cleanCat.toLowerCase();
    if (DATABAZE_KNIH_GENRE_MAP[fullLower]) {
      result.add(DATABAZE_KNIH_GENRE_MAP[fullLower]);
      continue;
    }

    const fullExistingMatch = PREDEFINED_GENRES.find(
      g => g.label.toLowerCase() === fullLower || g.name.toLowerCase() === fullLower
    );
    if (fullExistingMatch) {
      result.add(fullExistingMatch.label);
      continue;
    }

    // Split sub-categories by slash, or semicolon, or " / " (e.g. "Juvenile Fiction / Fantasy")
    const segments = cleanCat.split(/\s*[/;]\s*/).map(s => s.trim()).filter(Boolean);
    const subCats = segments.length > 1 ? segments : [cleanCat];

    for (const segment of subCats) {
      const lower = segment.toLowerCase();

      // 1. Direct match with PREDEFINED_GENRES label or name
      const existingMatch = PREDEFINED_GENRES.find(
        g => g.label.toLowerCase() === lower || g.name.toLowerCase() === lower
      );
      if (existingMatch) {
        result.add(existingMatch.label);
        continue;
      }

      // 2. Direct match with DATABAZE_KNIH_GENRE_MAP
      if (DATABAZE_KNIH_GENRE_MAP[lower]) {
        result.add(DATABAZE_KNIH_GENRE_MAP[lower]);
        continue;
      }

      // 3. Partial match against DATABAZE_KNIH_GENRE_MAP keys
      let foundDkMatch = false;
      for (const [dkKey, mappedGenre] of Object.entries(DATABAZE_KNIH_GENRE_MAP)) {
        if (lower === dkKey || lower.includes(dkKey)) {
          result.add(mappedGenre);
          foundDkMatch = true;
          break;
        }
      }
      if (foundDkMatch) continue;

      // 4. English / international fallbacks (e.g. Google Books & Open Library categories)
    // Check multiple independent matches within category string (e.g. "Juvenile Fiction / Fantasy")
    if (
      lower.includes('science fiction') ||
      lower.includes('sci-fi') ||
      lower.includes('fantasy') ||
      lower.includes('dystopian') ||
      lower.includes('magic') ||
      lower.includes('space')
    ) {
      result.add('🚀 Sci-fi & Fantasy');
    }
    if (
      lower.includes('comic') ||
      lower.includes('manga') ||
      lower.includes('graphic novel')
    ) {
      result.add('💥 Komiksy & Manga');
    }
    if (
      lower.includes('horror') ||
      lower.includes('ghost')
    ) {
      result.add('👻 Horory & Temné příběhy');
    }
    if (
      lower.includes('romance') ||
      lower.includes('love') ||
      lower.includes('erotic')
    ) {
      result.add('💖 Pro ženy & Romantika');
    }
    if (
      lower.includes('thriller') ||
      lower.includes('mystery') ||
      lower.includes('detective') ||
      lower.includes('crime') ||
      lower.includes('suspense') ||
      lower.includes('detektivk') ||
      lower.includes('krimi')
    ) {
      result.add('🔍 Detektivky & Thrillery');
    }
    if (
      lower.includes('juvenile') ||
      lower.includes('children') ||
      lower.includes('young adult') ||
      lower.includes('pohádk') ||
      lower.includes('mládež') ||
      lower.includes('děti')
    ) {
      result.add('🧸 Pro děti & Mládež');
    }
    if (
      lower.includes('education') ||
      lower.includes('study') ||
      lower.includes('textbook') ||
      lower.includes('učebnic') ||
      lower.includes('skripta') ||
      lower.includes('language') ||
      lower.includes('dictionary')
    ) {
      result.add('🎓 Učebnice & Vzdělávání');
    }
    if (
      lower.includes('cooking') ||
      lower.includes('cookery') ||
      lower.includes('food') ||
      lower.includes('recipe') ||
      lower.includes('gastronom')
    ) {
      result.add('🍳 Kuchařky & Gastronomie');
    }
    if (
      lower.includes('travel') ||
      lower.includes('geography') ||
      lower.includes('guidebook') ||
      lower.includes('voyage')
    ) {
      result.add('🧭 Cestopisy & Průvodce');
    }
    if (
      lower.includes('poetry') ||
      lower.includes('poem') ||
      lower.includes('drama') ||
      lower.includes('play') ||
      lower.includes('theatre')
    ) {
      result.add('🎭 Poezie & Divadelní hry');
    }
    if (
      lower.includes('philosophy') ||
      lower.includes('religion') ||
      lower.includes('theology') ||
      lower.includes('mythology')
    ) {
      result.add('✨ Filozofie & Duchovno');
    }
    if (
      lower.includes('nature') ||
      lower.includes('animal') ||
      lower.includes('ecology') ||
      lower.includes('environment') ||
      lower.includes('garden')
    ) {
      result.add('🌿 Příroda & Zvířata');
    }
    if (
      lower.includes('history') ||
      lower.includes('biography') ||
      lower.includes('autobiography') ||
      lower.includes('memoir') ||
      lower.includes('war') ||
      lower.includes('military')
    ) {
      result.add('📜 Historie & Biografie');
    }
    if (
      lower.includes('self-help') ||
      lower.includes('psychology') ||
      lower.includes('health') ||
      lower.includes('body') ||
      lower.includes('mind') ||
      lower.includes('fitness') ||
      lower.includes('family') ||
      lower.includes('relationship')
    ) {
      result.add('🧘 Osobní rozvoj & Psychologie');
    }
    if (
      lower.includes('art') ||
      lower.includes('music') ||
      lower.includes('performing') ||
      lower.includes('architecture') ||
      lower.includes('design') ||
      lower.includes('film') ||
      lower.includes('photography')
    ) {
      result.add('🎨 Umění & Kultura');
    }
    if (
      (!lower.includes('science fiction') && lower.includes('science')) ||
      lower.includes('technology') ||
      lower.includes('computer') ||
      lower.includes('business') ||
      lower.includes('economics') ||
      lower.includes('politics') ||
      lower.includes('law') ||
      lower.includes('sociology')
    ) {
      result.add('💡 Naučná & Odborná literatura');
    }
      if (
        result.size === 0 &&
        (lower.includes('fiction') ||
          lower.includes('novel') ||
          lower.includes('story') ||
          lower.includes('literature'))
      ) {
        result.add('📖 Romány & Beletrie');
      }
    }
  }

  // Filter out any default genre if we have real matches
  const validGenres = Array.from(result).filter(g => g !== DEFAULT_GENRE);
  if (validGenres.length > 0) {
    return validGenres;
  }

  return [DEFAULT_GENRE];
}

/**
 * Infers genre based on book title, author, and description keywords.
 * Especially useful when online catalogs return no category/subject metadata.
 */
export function inferGenresFromText(book: { title?: string; authors?: string[]; description?: string }): string[] {
  const combined = [
    book.title || '',
    (book.authors || []).join(' '),
    book.description || ''
  ].join(' ').toLowerCase();

  const matched = new Set<string>();

  for (const rule of INFERENCE_RULES) {
    for (const kw of rule.keywords) {
      if (combined.includes(kw.toLowerCase())) {
        matched.add(rule.genreLabel);
        break; // Match rule once
      }
    }
  }

  if (matched.size > 0) {
    return Array.from(matched);
  }

  return [DEFAULT_GENRE];
}

/**
 * Helper to get the GenreOption object from a genre string (label or name).
 */
export function getGenreInfo(genreLabel: string): GenreOption {
  const clean = (genreLabel || '').trim();
  const match = PREDEFINED_GENRES.find(
    g => g.label === clean || g.name === clean || clean.includes(g.name)
  );
  return match || PREDEFINED_GENRES[PREDEFINED_GENRES.length - 1]; // fallback to Ostatní
}
