import type { Book } from '../types/book';
import { mapCategoriesToPredefinedGenres, DEFAULT_GENRE } from '../constants/genres';

export const KNIHOVNY_CZ_FIELDS = [
  'id',
  'title',
  'authors',
  'publishers',
  'placesOfPublication',
  'publicationDates',
  'physicalDescriptions',
  'isbns',
  'issns',
  'cnb',
  'formats'
];

/**
 * Converts ISBN-10 to ISBN-13 (978 prefix + calculated check digit).
 * If already ISBN-13 or invalid length, returns cleaned digits.
 */
export function toIsbn13(isbn: string): string {
  const clean = isbn.replace(/[^0-9Xx]/g, '').trim();
  if (clean.length === 13) {
    return clean;
  }
  if (clean.length === 10) {
    const base = '978' + clean.slice(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(base[i], 10);
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return base + checkDigit;
  }
  return clean;
}

/**
 * Removes cataloguing punctuation trailing from strings (e.g. "Argo,", "Praha :", "[Praha] :")
 */
export function cleanCatalogText(text?: string): string {
  if (!text) return '';
  return text.trim().replace(/[/:,;\s]+$/, '').trim();
}

/**
 * Removes year / date suffixes from author name strings.
 * Examples:
 * "Jean de Nostredame, asi 1507-1577" -> "Jean de Nostredame"
 * "Josef Prokop, 1971-" -> "Josef Prokop"
 * "Vojtěch Domlátil, 1979-" -> "Vojtěch Domlátil"
 */
export function cleanAuthorName(rawAuthor: string): string {
  if (!rawAuthor) return '';
  // Remove trailing comma, dates like ", asi 1507-1577", ", 1971-", ", 1980-2020", etc.
  const cleaned = rawAuthor.replace(/,\s*(?:asi\s*)?\d{4}(?:\s*[-–—]\s*\d{0,4})?\s*$/i, '');
  return cleaned.trim();
}

/**
 * Extracts 4-digit year from publication date string array.
 */
export function parseYearFromPublicationDates(publicationDates?: string[]): string {
  if (!publicationDates || publicationDates.length === 0) return '';
  for (const dateStr of publicationDates) {
    const match = dateStr.match(/\d{4}/);
    if (match) {
      return match[0];
    }
  }
  return '';
}

/**
 * Extracts page count from physical descriptions array (e.g. "218 s. : il. ; 22 cm" or "260 stran").
 */
export function parsePageCountFromPhysicalDescriptions(physicalDescriptions?: string[]): number | undefined {
  if (!physicalDescriptions || physicalDescriptions.length === 0) return undefined;
  for (const desc of physicalDescriptions) {
    const match = desc.match(/(\d+)\s*(?:s\.|stran|strana|s\b|p\.)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return undefined;
}

/**
 * Parses raw Knihovny.cz API JSON response record into a Partial<Book>.
 */
export function parseKnihovnyCzRecord(record: any, targetIsbn13: string): Partial<Book> {
  const title = cleanCatalogText(record.title || '');

  const primaryAuthors = Object.keys(record.authors?.primary ?? {}).map(cleanAuthorName).filter(Boolean);
  const secondaryAuthors = Object.keys(record.authors?.secondary ?? {}).map(cleanAuthorName).filter(Boolean);
  const allAuthors = [...primaryAuthors, ...secondaryAuthors];
  const authors = allAuthors.length > 0 ? allAuthors : ['Neznámý autor'];

  const publishers = record.publishers ?? [];
  const rawPublisher = publishers.length > 0 ? publishers[0] : '';
  const publisher = cleanCatalogText(rawPublisher);

  const publishedDate = parseYearFromPublicationDates(record.publicationDates);
  const pageCount = parsePageCountFromPhysicalDescriptions(record.physicalDescriptions);

  return {
    isbn: targetIsbn13,
    title,
    authors,
    categories: [DEFAULT_GENRE],
    publishedDate,
    publisher,
    description: '',
    coverUrl: undefined,
    pageCount,
    language: 'cs'
  };
}

/**
 * Fetches book details from Knihovny.cz API.
 */
export async function fetchFromKnihovnyCz(isbn: string): Promise<Partial<Book> | null> {
  const isbn13 = toIsbn13(isbn);
  if (!isbn13) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const params = new URLSearchParams({
      lookfor: isbn13,
      type: 'ISN',
      limit: '10'
    });

    for (const field of KNIHOVNY_CZ_FIELDS) {
      params.append('field[]', field);
    }

    const response = await fetch(`https://www.knihovny.cz/api/v1/search?${params.toString()}`, {
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const records = data.records ?? [];

    if (records.length === 0) {
      return null;
    }

    // Filter records: find record whose `isbns` array actually contains `isbn13`
    const matchingRecord = records.find((rec: any) => {
      const recIsbns = rec.isbns ?? [];
      return recIsbns.some((rawIsbn: string) => {
        const cleanIsbn = rawIsbn.replace(/\([^)]*\)/g, '').replace(/[^0-9Xx]/g, '');
        return toIsbn13(cleanIsbn) === isbn13;
      });
    });

    if (!matchingRecord) {
      return null;
    }

    return parseKnihovnyCzRecord(matchingRecord, isbn13);
  } catch {
    // AbortError or network error
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Searches Knihovny.cz and Google Books by query (title or author)
 * for books that do not have an ISBN.
 */
export async function searchBooksByTitleOrAuthor(query: string): Promise<Partial<Book>[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const results: Partial<Book>[] = [];

  // 1. Try Knihovny.cz search by Title
  try {
    const params = new URLSearchParams({
      lookfor: cleanQuery,
      type: 'AllFields',
      limit: '5'
    });
    for (const field of KNIHOVNY_CZ_FIELDS) {
      params.append('field[]', field);
    }
    const res = await fetch(`https://www.knihovny.cz/api/v1/search?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.records && Array.isArray(data.records)) {
        for (const record of data.records) {
          const isbns = record.isbns || [];
          const firstIsbn = isbns[0] ? isbns[0].replace(/\([^)]*\)/g, '').replace(/[^0-9Xx]/g, '') : '';
          const targetIsbn13 = firstIsbn ? toIsbn13(firstIsbn) : '';
          const parsed = parseKnihovnyCzRecord(record, targetIsbn13);
          results.push(parsed);
        }
      }
    }
  } catch (err) {
    console.warn('Chyba při vyhledávání v Knihovny.cz:', err);
  }

  // 2. Try Google Books API by query if fewer than 3 results found
  if (results.length < 3) {
    try {
      const gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=5&langRestrict=cs`);
      if (gRes.ok) {
        const data = await gRes.json();
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items) {
            const volumeInfo = item.volumeInfo || {};
            const industryIdentifiers = volumeInfo.industryIdentifiers || [];
            const isbnId = industryIdentifiers.find((i: any) => i.type === 'ISBN_13' || i.type === 'ISBN_10');
            const foundIsbn = isbnId ? toIsbn13(isbnId.identifier) : '';

            const coverUrl = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail;
            const secureCoverUrl = coverUrl ? coverUrl.replace(/^http:/, 'https:') : undefined;
            const rawCategories = volumeInfo.categories || [];
            const mappedCategories = mapCategoriesToPredefinedGenres(rawCategories);

            results.push({
              isbn: foundIsbn,
              title: volumeInfo.title || '',
              authors: volumeInfo.authors || ['Neznámý autor'],
              categories: mappedCategories,
              publishedDate: volumeInfo.publishedDate || '',
              publisher: volumeInfo.publisher || '',
              description: volumeInfo.description || '',
              coverUrl: secureCoverUrl,
              pageCount: volumeInfo.pageCount,
              language: volumeInfo.language || 'cs'
            });
          }
        }
      }
    } catch (err) {
      console.warn('Chyba při vyhledávání v Google Books:', err);
    }
  }

  // Deduplicate results by title + author
  const seen = new Set<string>();
  return results.filter(b => {
    const key = `${(b.title || '').toLowerCase()}|${(b.authors || []).join(',').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchBookByIsbn(isbn: string): Promise<Partial<Book> | null> {
  const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '').trim();
  if (!cleanIsbn) return null;

  // 1. Primary source: Knihovny.cz API
  const knihovnyCzResult = await fetchFromKnihovnyCz(cleanIsbn);
  if (knihovnyCzResult) {
    return knihovnyCzResult;
  }

  // Fallback parsers for Google Books / Open Library
  const parseGoogleBook = (item: any): Partial<Book> => {
    const volumeInfo = item.volumeInfo || {};
    const coverUrl = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail;
    const secureCoverUrl = coverUrl ? coverUrl.replace(/^http:/, 'https:') : undefined;
    const rawCategories = volumeInfo.categories || [];
    const mappedCategories = mapCategoriesToPredefinedGenres(rawCategories);

    return {
      isbn: cleanIsbn,
      title: volumeInfo.title || '',
      authors: volumeInfo.authors || ['Neznámý autor'],
      categories: mappedCategories,
      publishedDate: volumeInfo.publishedDate || '',
      publisher: volumeInfo.publisher || '',
      description: volumeInfo.description || '',
      coverUrl: secureCoverUrl,
      pageCount: volumeInfo.pageCount,
      language: volumeInfo.language || 'cs'
    };
  };

  try {
    // 2. Fallback: Google Books API with exact isbn:
    const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
    if (googleRes.ok) {
      const data = await googleRes.json();
      if (data.totalItems > 0 && data.items && data.items.length > 0) {
        return parseGoogleBook(data.items[0]);
      }
    }

    // 2b. Fallback Google Books search without isbn: prefix
    const googleResGeneral = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${cleanIsbn}`);
    if (googleResGeneral.ok) {
      const data = await googleResGeneral.json();
      if (data.totalItems > 0 && data.items && data.items.length > 0) {
        return parseGoogleBook(data.items[0]);
      }
    }

    // 3. Fallback to Open Library API
    const openLibRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
    if (openLibRes.ok) {
      const openLibData = await openLibRes.json();
      const bookKey = `ISBN:${cleanIsbn}`;
      if (openLibData[bookKey]) {
        const item = openLibData[bookKey];
        const authors = item.authors ? item.authors.map((a: { name: string }) => a.name) : ['Neznámý autor'];
        const rawCategories = item.subjects ? item.subjects.map((s: { name: string }) => s.name) : [];
        const mappedCategories = mapCategoriesToPredefinedGenres(rawCategories);
        const coverUrl = item.cover?.medium || item.cover?.large || item.cover?.small;

        return {
          isbn: cleanIsbn,
          title: item.title || '',
          authors,
          categories: mappedCategories,
          publishedDate: item.publish_date || '',
          publisher: item.publishers ? item.publishers.map((p: { name: string }) => p.name).join(', ') : '',
          description: typeof item.notes === 'string' ? item.notes : '',
          coverUrl,
          pageCount: item.number_of_pages,
          language: 'cs'
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Chyba při stahování informací o knize podle ISBN:', error);
    return null;
  }
}
