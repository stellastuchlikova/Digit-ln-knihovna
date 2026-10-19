export interface GenreOption {
  id: string;
  name: string;
  emoji: string;
  label: string;
  description: string;
  gradient: string;
}

export const PREDEFINED_GENRES: GenreOption[] = [
  {
    id: 'roman-beletrie',
    name: 'Romány & Beletrie',
    emoji: '📖',
    label: '📖 Romány & Beletrie',
    description: 'Beletrie, romány, společenská a klasická literatura',
    gradient: 'from-rose-500 to-pink-700'
  },
  {
    id: 'scifi-fantasy',
    name: 'Sci-fi & Fantasy',
    emoji: '🚀',
    label: '🚀 Sci-fi & Fantasy',
    description: 'Vědecká fantastika, sci-fi, fantasy a dystopie',
    gradient: 'from-purple-600 to-indigo-800'
  },
  {
    id: 'detektivky-thrillery',
    name: 'Detektivky & Thrillery',
    emoji: '🔍',
    label: '🔍 Detektivky & Thrillery',
    description: 'Detektivní příběhy, krimi, thrillery a napětí',
    gradient: 'from-slate-700 to-zinc-900'
  },
  {
    id: 'edukacni-ucebni',
    name: 'Edukační & Učební literatura',
    emoji: '🎓',
    label: '🎓 Edukační & Učební literatura',
    description: 'Učebnice, skripta, výukové a vzdelávací příručky',
    gradient: 'from-blue-600 to-cyan-700'
  },
  {
    id: 'naucna-odborna',
    name: 'Naučná & Odborná literatura',
    emoji: '💡',
    label: '💡 Naučná & Odborná literatura',
    description: 'Populárně-naučné knihy, věda, technologie, IT, filozofie',
    gradient: 'from-amber-500 to-orange-700'
  },
  {
    id: 'historie-biografie',
    name: 'Historie & Biografie',
    emoji: '📜',
    label: '📜 Historie & Biografie',
    description: 'Dějiny, životopisy, paměti a historické události',
    gradient: 'from-amber-700 to-stone-900'
  },
  {
    id: 'pro-deti-mladez',
    name: 'Pro děti & Mládež',
    emoji: '🧸',
    label: '🧸 Pro děti & Mládež',
    description: 'Pohádky, knížky pro nejmenší, mládež a Young Adult',
    gradient: 'from-emerald-500 to-teal-700'
  },
  {
    id: 'osobni-rozvoj',
    name: 'Osobní rozvoj & Životní styl',
    emoji: '🧘',
    label: '🧘 Osobní rozvoj & Životní styl',
    description: 'Motivace, zdraví, psychologie, rodina a vaření',
    gradient: 'from-[#800020] to-rose-900'
  },
  {
    id: 'umeni-kultura',
    name: 'Umění & Kultura',
    emoji: '🎨',
    label: '🎨 Umění & Kultura',
    description: 'Výtvarné umění, hudba, divadlo, film, architektura',
    gradient: 'from-fuchsia-600 to-pink-800'
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
 * Maps raw input categories (e.g., from Google Books API or OpenLibrary) to predefined Czech genre labels with emojis.
 */
export function mapCategoriesToPredefinedGenres(rawCategories: string[]): string[] {
  if (!rawCategories || rawCategories.length === 0) {
    return [DEFAULT_GENRE];
  }

  const result = new Set<string>();

  for (const rawCat of rawCategories) {
    const lower = rawCat.toLowerCase().trim();

    // Already a predefined genre or starts with emoji?
    const existingMatch = PREDEFINED_GENRES.find(
      g => g.label.toLowerCase() === lower || g.name.toLowerCase() === lower
    );
    if (existingMatch) {
      result.add(existingMatch.label);
      continue;
    }

    // Mapping logic
    if (
      lower.includes('science fiction') ||
      lower.includes('sci-fi') ||
      lower.includes('fantasy') ||
      lower.includes('dystopian') ||
      lower.includes('magic') ||
      lower.includes('space')
    ) {
      result.add('🚀 Sci-fi & Fantasy');
    } else if (
      lower.includes('thriller') ||
      lower.includes('mystery') ||
      lower.includes('detective') ||
      lower.includes('crime') ||
      lower.includes('suspense') ||
      lower.includes('detektivk') ||
      lower.includes('krimi')
    ) {
      result.add('🔍 Detektivky & Thrillery');
    } else if (
      lower.includes('juvenile') ||
      lower.includes('children') ||
      lower.includes('young adult') ||
      lower.includes('pohádk') ||
      lower.includes('mládež') ||
      lower.includes('děti')
    ) {
      result.add('🧸 Pro děti & Mládež');
    } else if (
      lower.includes('education') ||
      lower.includes('study') ||
      lower.includes('textbook') ||
      lower.includes(' učebnic') ||
      lower.includes('skripta')
    ) {
      result.add('🎓 Edukační & Učební literatura');
    } else if (
      lower.includes('history') ||
      lower.includes('biography') ||
      lower.includes('autobiography') ||
      lower.includes('memoir') ||
      lower.includes('histor') ||
      lower.includes('životopis')
    ) {
      result.add('📜 Historie & Biografie');
    } else if (
      lower.includes('self-help') ||
      lower.includes('psychology') ||
      lower.includes('health') ||
      lower.includes('cooking') ||
      lower.includes('body') ||
      lower.includes('mind') ||
      lower.includes('rozvoj') ||
      lower.includes('zdraví') ||
      lower.includes('kuchař')
    ) {
      result.add('🧘 Osobní rozvoj & Životní styl');
    } else if (
      lower.includes('art') ||
      lower.includes('music') ||
      lower.includes('performing') ||
      lower.includes('architecture') ||
      lower.includes('design') ||
      lower.includes('umění') ||
      lower.includes('hudba')
    ) {
      result.add('🎨 Umění & Kultura');
    } else if (
      lower.includes('science') ||
      lower.includes('technology') ||
      lower.includes('computers') ||
      lower.includes('business') ||
      lower.includes('economics') ||
      lower.includes('philosophy') ||
      lower.includes('nature') ||
      lower.includes('nauč') ||
      lower.includes('věda')
    ) {
      result.add('💡 Naučná & Odborná literatura');
    } else if (
      lower.includes('fiction') ||
      lower.includes('novel') ||
      lower.includes('román') ||
      lower.includes('beletrie') ||
      lower.includes('literatura')
    ) {
      result.add('📖 Romány & Beletrie');
    }
  }

  if (result.size === 0) {
    result.add(DEFAULT_GENRE);
  }

  return Array.from(result);
}

/**
 * Helper to get the GenreOption object from a genre string (label or name).
 */
export function getGenreInfo(genreLabel: string): GenreOption {
  const clean = genreLabel.trim();
  const match = PREDEFINED_GENRES.find(
    g => g.label === clean || g.name === clean || clean.includes(g.name)
  );
  return match || PREDEFINED_GENRES[PREDEFINED_GENRES.length - 1]; // fallback to Ostatní
}
