import type { Book } from '../types/book';
import { KNOWN_BOOK_DESCRIPTIONS } from './bookDescriptions';

const STORAGE_KEY = 'library_app_books_v1';

/**
 * Enriches existing books if their description is missing or empty,
 * using known descriptions (e.g. from Databazeknih.cz).
 */
export const enrichMissingBookDescriptions = (books: Book[]): { books: Book[]; updated: boolean } => {
  let updated = false;
  const enriched = books.map(book => {
    if (book.description && book.description.trim().length > 0) {
      return book;
    }

    const cleanIsbn = (book.isbn || '').replace(/[^0-9Xx]/g, '').trim();
    if (cleanIsbn && KNOWN_BOOK_DESCRIPTIONS[cleanIsbn]) {
      updated = true;
      return {
        ...book,
        description: KNOWN_BOOK_DESCRIPTIONS[cleanIsbn],
        updatedAt: new Date().toISOString()
      };
    }

    // Check title fallback
    const titleLower = (book.title || '').toLowerCase();
    for (const [isbn, desc] of Object.entries(KNOWN_BOOK_DESCRIPTIONS)) {
      if (
        (titleLower.includes('gladys') && isbn === '9781576580196') ||
        (titleLower.includes('rozvod') && isbn === '9788072551637') ||
        (titleLower.includes('ameri') && isbn === '9788073350406') ||
        (titleLower.includes('candide') && isbn === '9788073881641') ||
        (titleLower.includes('stres') && isbn === '9788072552764') ||
        (titleLower.includes('francouzsk') && isbn === '9788025117286') ||
        (titleLower.includes('copywriting') && isbn === '9788025145890') ||
        (titleLower.includes('chyba') && isbn === '9788072551835') ||
        (titleLower.includes('jazyk') && isbn === '9788072552597')
      ) {
        updated = true;
        return {
          ...book,
          description: desc,
          updatedAt: new Date().toISOString()
        };
      }
    }

    return book;
  });

  return { books: enriched, updated };
};

export const getStoredBooks = (): Book[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const books = JSON.parse(data) as Book[];

    // Auto-enrich existing loaded books that are missing descriptions
    const { books: enrichedBooks, updated } = enrichMissingBookDescriptions(books);
    if (updated) {
      saveBooks(enrichedBooks);
    }

    return enrichedBooks;
  } catch (error) {
    console.error('Chyba při načítání knih z LocalStorage:', error);
    return [];
  }
};

export const saveBooks = (books: Book[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (error) {
    console.error('Chyba při ukládání knih do LocalStorage:', error);
  }
};

export const addStoredBook = (book: Book): Book[] => {
  const books = getStoredBooks();
  // Check if book with same ID or same non-empty ISBN already exists
  const existingIndex = books.findIndex(
    b => b.id === book.id || (book.isbn && b.isbn === book.isbn && book.isbn.trim() !== '')
  );

  let updatedBooks: Book[];
  if (existingIndex >= 0) {
    updatedBooks = [...books];
    updatedBooks[existingIndex] = {
      ...book,
      updatedAt: new Date().toISOString()
    };
  } else {
    updatedBooks = [book, ...books];
  }

  saveBooks(updatedBooks);
  return updatedBooks;
};

export const updateStoredBook = (updatedBook: Book): Book[] => {
  const books = getStoredBooks();
  const updatedBooks = books.map(b => (b.id === updatedBook.id ? { ...updatedBook, updatedAt: new Date().toISOString() } : b));
  saveBooks(updatedBooks);
  return updatedBooks;
};

export const deleteStoredBook = (id: string): Book[] => {
  const books = getStoredBooks();
  const updatedBooks = books.filter(b => b.id !== id);
  saveBooks(updatedBooks);
  return updatedBooks;
};

export const exportBooksToJson = (books: Book[]): void => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(books, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute("download", `knihovna_databaze_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const importBooksFromJson = async (file: File): Promise<Book[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content);
        if (!Array.isArray(imported)) {
          reject(new Error('Neplatný formát souboru: soubor musí obsahovat pole knih.'));
          return;
        }

        // Validate basic fields
        const validBooks: Book[] = imported.map((item: Partial<Book>, index: number) => {
          const rawDescription = item.description || '';
          return {
            id: item.id || `imported-${Date.now()}-${index}`,
            isbn: item.isbn || '',
            title: item.title || 'Bez názvu',
            authors: Array.isArray(item.authors) ? item.authors : (item.authors ? [item.authors] : ['Neznámý autor']),
            categories: Array.isArray(item.categories) ? item.categories : (item.categories ? [item.categories] : ['Nezařazeno']),
            publishedDate: item.publishedDate || '',
            publisher: item.publisher || '',
            description: rawDescription,
            coverUrl: item.coverUrl || '',
            pageCount: item.pageCount || undefined,
            language: item.language || 'cs',
            rating: typeof item.rating === 'number' ? item.rating : 0,
            isAvailable: typeof item.isAvailable === 'boolean' ? item.isAvailable : true,
            borrowedTo: item.borrowedTo || '',
            borrowedAt: item.borrowedAt || '',
            dueDate: item.dueDate || '',
            notes: item.notes || '',
            addedAt: item.addedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });

        // Auto-enrich any imported books missing descriptions
        const { books: enrichedValidBooks } = enrichMissingBookDescriptions(validBooks);

        // Merge with existing books or overwrite? Let's merge without duplicates
        const existingBooks = getStoredBooks();
        const existingMap = new Map(existingBooks.map(b => [b.id, b]));

        enrichedValidBooks.forEach(book => {
          existingMap.set(book.id, book);
        });

        const mergedBooks = Array.from(existingMap.values());
        saveBooks(mergedBooks);
        resolve(mergedBooks);
      } catch {
        reject(new Error('Došlo k chybě při zpracování JSON souboru.'));
      }
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsText(file);
  });
};
