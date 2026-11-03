import { mapCategoriesToPredefinedGenres, inferGenresFromText, DEFAULT_GENRE } from '../constants/genres';

/**
 * Extracts Databazeknih.cz genre names from HTML string.
 * Example in HTML:
 *   <a href='/zanry/literatura-svetova-1'>Literatura světová</a>
 *   <a href='/zanry/romany-12'>Romány</a>
 */
export function extractGenresFromDatabazeKnihHtml(html: string): string[] {
  if (!html) return [];

  // Match /zanry/ links
  const regex = /<a\s+[^>]*href=['"](?:\/zanry\/|https?:\/\/(?:www\.)?databazeknih\.cz\/zanry\/)[^'"]+['"][^>]*>([^<]+)<\/a>/gi;
  const genres: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const rawName = match[1].trim();
    if (rawName && !rawName.toLowerCase().includes('všechny žánry')) {
      genres.push(rawName);
    }
  }

  // Also check if any genre badges exist in plain text or tags
  return Array.from(new Set(genres));
}

/**
 * Queries Databazeknih.cz (using ISBN or query string) via CORS-safe proxy fallback options,
 * and extracts the genres directly from the book page or search results.
 */
export async function fetchGenresFromDatabazeKnih(query: string): Promise<string[] | null> {
  const clean = query.trim();
  if (!clean) return null;

  const targetUrl = `https://www.databazeknih.cz/search?q=${encodeURIComponent(clean)}`;

  // Public CORS proxy endpoints with short timeouts to keep UI responsive
  const proxyEndpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`
  ];

  for (const proxyUrl of proxyEndpoints) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch(proxyUrl, {
        signal: controller.signal
      });

      if (response.ok) {
        const html = await response.text();
        const extractedRawGenres = extractGenresFromDatabazeKnihHtml(html);

        if (extractedRawGenres.length > 0) {
          const mapped = mapCategoriesToPredefinedGenres(extractedRawGenres);
          if (mapped.length > 0 && !(mapped.length === 1 && mapped[0] === DEFAULT_GENRE)) {
            return mapped;
          }
        }
      }
    } catch {
      // Ignore proxy or timeout error and try next proxy
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

/**
 * Enhanced categorization helper:
 * Combines online Databazeknih fetching, existing raw category mapping,
 * and text inference heuristics to ensure every book is accurately categorized.
 */
export async function autoClassifyBookGenres(book: {
  isbn?: string;
  title?: string;
  authors?: string[];
  description?: string;
  categories?: string[];
}): Promise<string[]> {
  // 1. If book already has non-default valid categories, map them through Databazeknih taxonomy
  const existingCategories = (book.categories || []).filter(c => c && c !== DEFAULT_GENRE);
  if (existingCategories.length > 0) {
    const mapped = mapCategoriesToPredefinedGenres(existingCategories);
    if (mapped.length > 0 && !(mapped.length === 1 && mapped[0] === DEFAULT_GENRE)) {
      return mapped;
    }
  }

  // 2. Try online lookup on Databazeknih.cz (prefer ISBN, fallback to title)
  const query = book.isbn?.trim() || book.title?.trim();
  if (query) {
    try {
      const onlineGenres = await fetchGenresFromDatabazeKnih(query);
      if (onlineGenres && onlineGenres.length > 0) {
        return onlineGenres;
      }
    } catch {
      // Non-fatal, proceed to inference
    }
  }

  // 3. Fallback to smart text inference based on Czech book taxonomy & keywords
  const inferred = inferGenresFromText({
    title: book.title,
    authors: book.authors,
    description: book.description
  });

  if (inferred.length > 0 && !(inferred.length === 1 && inferred[0] === DEFAULT_GENRE)) {
    return inferred;
  }

  return [DEFAULT_GENRE];
}
