import type { Book } from '../types/book';

const STORAGE_KEY = 'library_app_books_v1';

export const getStoredBooks = (): Book[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Book[];
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
          return {
            id: item.id || `imported-${Date.now()}-${index}`,
            isbn: item.isbn || '',
            title: item.title || 'Bez názvu',
            authors: Array.isArray(item.authors) ? item.authors : (item.authors ? [item.authors] : ['Neznámý autor']),
            categories: Array.isArray(item.categories) ? item.categories : (item.categories ? [item.categories] : ['Nezařazeno']),
            publishedDate: item.publishedDate || '',
            publisher: item.publisher || '',
            description: item.description || '',
            coverUrl: item.coverUrl || '',
            pageCount: item.pageCount || undefined,
            language: item.language || 'cs',
            isAvailable: typeof item.isAvailable === 'boolean' ? item.isAvailable : true,
            borrowedTo: item.borrowedTo || '',
            borrowedAt: item.borrowedAt || '',
            dueDate: item.dueDate || '',
            notes: item.notes || '',
            addedAt: item.addedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });

        // Merge with existing books or overwrite? Let's merge without duplicates
        const existingBooks = getStoredBooks();
        const existingMap = new Map(existingBooks.map(b => [b.id, b]));

        validBooks.forEach(book => {
          existingMap.set(book.id, book);
        });

        const mergedBooks = Array.from(existingMap.values());
        saveBooks(mergedBooks);
        resolve(mergedBooks);
      } catch (err) {
        reject(new Error('Došlo k chybě při zpracování JSON souboru.'));
      }
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsText(file);
  });
};
