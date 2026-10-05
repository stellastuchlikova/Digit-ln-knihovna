import React, { useState, useEffect } from 'react';
import type { Book, ActiveTab } from './types/book';
import { getStoredBooks, saveBooks } from './services/storage';
import { BookScanner } from './components/BookScanner';
import { BookDatabase } from './components/BookDatabase';
import { ImportExport } from './components/ImportExport';
import { BookOpen, ScanBarcode, Database, HardDriveDownload } from 'lucide-react';

export const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('database');

  useEffect(() => {
    const loaded = getStoredBooks();
    setBooks(loaded);
  }, []);

  const handleBookAdded = (newBook: Book) => {
    const updated = [newBook, ...books.filter(b => b.id !== newBook.id)];
    setBooks(updated);
    saveBooks(updated);
  };

  const handleBookUpdated = (updatedBook: Book) => {
    const updated = books.map(b => (b.id === updatedBook.id ? updatedBook : b));
    setBooks(updated);
    saveBooks(updated);
  };

  const handleBookDeleted = (id: string) => {
    const updated = books.filter(b => b.id !== id);
    setBooks(updated);
    saveBooks(updated);
  };

  const handleBooksImported = (importedBooks: Book[]) => {
    setBooks(importedBooks);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-gray-900 font-sans flex flex-col">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#800020] text-white flex items-center justify-center shadow-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">Knihovna</h1>
                <p className="text-[10px] text-[#800020] font-semibold tracking-wider uppercase">Správa & Čtení knih</p>
              </div>
            </div>

            {/* Menu Navigation Tabs */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveTab('database')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition duration-150 flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'database'
                    ? 'bg-[#800020] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Databáze knih</span>
                <span className="sm:hidden">Databáze</span>
                <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'database' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {books.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('scanner')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition duration-150 flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'scanner'
                    ? 'bg-[#800020] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ScanBarcode className="w-4 h-4" />
                <span>Načítání knih</span>
              </button>

              <button
                onClick={() => setActiveTab('import-export')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition duration-150 flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'import-export'
                    ? 'bg-[#800020] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <HardDriveDownload className="w-4 h-4" />
                <span className="hidden sm:inline">Záloha / Import</span>
                <span className="sm:hidden">Záloha</span>
              </button>
            </nav>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'database' && (
          <BookDatabase
            books={books}
            onUpdateBook={handleBookUpdated}
            onDeleteBook={handleBookDeleted}
            onSelectScannerTab={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'scanner' && (
          <BookScanner onBookAdded={handleBookAdded} />
        )}

        {activeTab === 'import-export' && (
          <ImportExport books={books} onBooksImported={handleBooksImported} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© {new Date().getFullYear()} Aplikace na čtení a evidenci knih v knihovně</p>
          <div className="flex items-center space-x-4">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Systém připraven</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
