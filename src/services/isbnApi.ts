import type { Book } from '../types/book';

export async function fetchBookByIsbn(isbn: string): Promise<Partial<Book> | null> {
  const cleanIsbn = isbn.replace(/[- ]/g, '').trim();
  if (!cleanIsbn) return null;

  try {
    // 1. Try Google Books API
    const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
    if (googleRes.ok) {
      const data = await googleRes.json();
      if (data.totalItems > 0 && data.items && data.items.length > 0) {
        const volumeInfo = data.items[0].volumeInfo;
        const coverUrl = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail;
        // Upgrade http to https for images
        const secureCoverUrl = coverUrl ? coverUrl.replace(/^http:/, 'https:') : undefined;

        return {
          isbn: cleanIsbn,
          title: volumeInfo.title || '',
          authors: volumeInfo.authors || ['Neznámý autor'],
          categories: volumeInfo.categories || ['Všeobecné'],
          publishedDate: volumeInfo.publishedDate || '',
          publisher: volumeInfo.publisher || '',
          description: volumeInfo.description || '',
          coverUrl: secureCoverUrl,
          pageCount: volumeInfo.pageCount,
          language: volumeInfo.language || 'cs'
        };
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
        const categories = item.subjects ? item.subjects.map((s: { name: string }) => s.name).slice(0, 3) : ['Všeobecné'];
        const coverUrl = item.cover?.medium || item.cover?.large || item.cover?.small;

        return {
          isbn: cleanIsbn,
          title: item.title || '',
          authors,
          categories,
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
