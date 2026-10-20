import type { Book } from '../types/book';
import { mapCategoriesToPredefinedGenres } from '../constants/genres';

export async function fetchBookByIsbn(isbn: string): Promise<Partial<Book> | null> {
  // Strip non-alphanumeric except X/x for ISBN-10
  const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '').trim();
  if (!cleanIsbn) return null;

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
    // 1. Try Google Books API with exact isbn:
    const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
    if (googleRes.ok) {
      const data = await googleRes.json();
      if (data.totalItems > 0 && data.items && data.items.length > 0) {
        return parseGoogleBook(data.items[0]);
      }
    }

    // 1b. Fallback Google Books search without isbn: prefix (e.g. general search for raw string)
    const googleResGeneral = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${cleanIsbn}`);
    if (googleResGeneral.ok) {
      const data = await googleResGeneral.json();
      if (data.totalItems > 0 && data.items && data.items.length > 0) {
        return parseGoogleBook(data.items[0]);
      }
    }

    // 2. Fallback to Open Library API if Google Books didn't return a result
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
