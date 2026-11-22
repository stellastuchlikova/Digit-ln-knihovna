import React, { useState, useEffect } from 'react';
import type { Book, ActiveTab } from './types/book';
import { getStoredBooks, saveBooks, enrichStoredBooksOnline } from './services/storage';
import {
  cloudSyncConfigured, getCloudSession, signInToCloud, signUpToCloud, signOutFromCloud,
  fetchCloudBooks, saveCloudBooks, saveCloudDeletions, mergeCloudBooks,
  markBookDeleted, restoreBook, type CloudSession
} from './services/cloudSync';
import { BookScanner } from './components/BookScanner';
import { BookDatabase } from './components/BookDatabase';
import { ImportExport } from './components/ImportExport';
import {
  BookOpen, ScanBarcode, Database, HardDriveDownload,
  Menu, X, Sparkles, Compass
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>(getStoredBooks);
  const [activeTab, setActiveTab] = useState<ActiveTab>('database');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [cloudSession, setCloudSession] = useState<CloudSession | null>(() => getCloudSession());
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('Pouze toto zařízení');

  // Background enrichment of stored books missing descriptions from Knihovny.cz / online
  useEffect(() => {
    enrichStoredBooksOnline((updatedBooks) => {
      setBooks(updatedBooks);
    });
  }, []);

  useEffect(() => {
    if (!cloudSession) {
      setCloudReady(false);
      setCloudStatus(cloudSyncConfigured() ? 'Synchronizace vypnutá' : 'Pouze toto zařízení');
      return;
    }

    let cancelled = false;
    setCloudReady(false);
    setCloudStatus('Připojuji knihovnu…');
    const loadCloudLibrary = async () => {
      try {
        const rows = await fetchCloudBooks();
        if (cancelled) return;
        const merged = mergeCloudBooks(getStoredBooks(), rows);
        saveBooks(merged);
        setBooks(merged);
        await saveCloudBooks(merged);
        await saveCloudDeletions();
        if (!cancelled) {
          setCloudReady(true);
          setCloudStatus('Synchronizováno');
        }
      } catch (error) {
        if (!cancelled) {
          setCloudReady(false);
          setCloudStatus(error instanceof Error ? error.message : 'Synchronizace se nezdařila');
        }
      }
    };
    void loadCloudLibrary();
    return () => { cancelled = true; };
  }, [cloudSession?.userId]);

  useEffect(() => {
    if (!cloudSession || !cloudReady) return;
    let cancelled = false;
    const sync = async () => {
      try {
        await saveCloudBooks(books);
        await saveCloudDeletions();
        if (!cancelled) setCloudStatus('Synchronizováno');
      } catch {
        if (!cancelled) setCloudStatus('Offline – změny se uloží po připojení');
      }
    };
    void sync();

    const refreshFromCloud = async () => {
      try {
        const rows = await fetchCloudBooks();
        if (cancelled) return;
        const current = getStoredBooks();
        const merged = mergeCloudBooks(current, rows);
        if (JSON.stringify(merged) !== JSON.stringify(current)) {
          saveBooks(merged);
          setBooks(merged);
        }
        await saveCloudBooks(merged);
        await saveCloudDeletions();
        if (!cancelled) setCloudStatus('Synchronizováno');
      } catch {
        if (!cancelled) setCloudStatus('Offline – změny se uloží po připojení');
      }
    };
    const timer = window.setInterval(() => { void refreshFromCloud(); }, 20000);
    const onOnline = () => { void refreshFromCloud(); };
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('online', onOnline);
    };
  }, [cloudSession?.userId, cloudReady, books]);

  const availableBooksCount = books.filter(b => b.isAvailable).length;
  const borrowedBooksCount = books.filter(b => !b.isAvailable).length;

  const handleBookAdded = (newBook: Book) => {
    restoreBook(newBook.id);
    const updated = [newBook, ...books.filter(b => b.id !== newBook.id)];
    setBooks(updated);
    saveBooks(updated);
  };

  const handleBookUpdated = (updatedBook: Book) => {
    restoreBook(updatedBook.id);
    const updated = books.map(b => (b.id === updatedBook.id ? updatedBook : b));
    setBooks(updated);
    saveBooks(updated);
  };

  const handleBookDeleted = (id: string) => {
    markBookDeleted(id);
    const updated = books.filter(b => b.id !== id);
    setBooks(updated);
    saveBooks(updated);
  };

  const handleBooksImported = (importedBooks: Book[]) => {
    importedBooks.forEach(book => restoreBook(book.id));
    setBooks(importedBooks);
    saveBooks(importedBooks);
  };

  const handleCloudAuth = async (email: string, password: string, mode: 'login' | 'register') => {
    setCloudStatus('Přihlašuji…');
    const session = mode === 'login'
      ? await signInToCloud(email, password)
      : await signUpToCloud(email, password);
    if (session) {
      setCloudSession(session);
      setCloudStatus('Připojuji knihovnu…');
      return 'Účet je připraven. Knihovna se právě synchronizuje.';
    }
    return 'Účet byl vytvořen. Potvrď e-mail a potom se přihlas.';
  };

  const handleCloudLogout = async () => {
    await signOutFromCloud();
    setCloudSession(null);
    setCloudStatus('Pouze toto zařízení');
  };

  const handleCloudSyncNow = async () => {
    if (!cloudSession) return;
    setCloudStatus('Synchronizuji…');
    try {
      const rows = await fetchCloudBooks();
      const merged = mergeCloudBooks(getStoredBooks(), rows);
      saveBooks(merged);
      setBooks(merged);
      await saveCloudBooks(merged);
      await saveCloudDeletions();
      setCloudReady(true);
      setCloudStatus('Synchronizováno');
    } catch (error) {
      setCloudStatus(error instanceof Error ? error.message : 'Synchronizace se nezdařila');
    }
  };

  const menuItems = [
    {
      id: 'database' as ActiveTab,
      label: 'Databáze knih',
      description: 'Kompletní přehled, vyhledávání a filtrování všech knih',
      icon: Database,
      badge: books.length,
      emoji: '📚'
    },
    {
      id: 'scanner' as ActiveTab,
      label: 'Načítání & Skener',
      description: 'Skenování čárového kódu fotoaparátem nebo zadání ISBN',
      icon: ScanBarcode,
      emoji: '📸'
    },
    {
      id: 'import-export' as ActiveTab,
      label: 'Záloha & Import',
      description: 'Export databáze do JSON nebo nahrání zálohy',
      icon: HardDriveDownload,
      emoji: '💾'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans flex flex-col selection:bg-[#800020]/20 selection:text-[#800020]">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left section: Clickable Drawer Menu Button + Logo */}
            <div className="flex items-center space-x-3">
              {/* Menu Toggle Button in top-left */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-[#800020]/10 hover:text-[#800020] text-gray-700 transition duration-200 cursor-pointer flex items-center space-x-1.5 focus:outline-hidden focus:ring-2 focus:ring-[#800020]/30"
                title="Otevřít nabídku funkcí"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-[#800020]" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider pl-1">
                  Menu
                </span>
              </button>

              <div className="h-6 w-px bg-gray-200 hidden sm:block" />

              {/* Logo and Brand */}
              <div
                onClick={() => setActiveTab('database')}
                className="flex items-center space-x-2.5 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#800020] to-rose-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition duration-200">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h1 className="text-lg font-extrabold tracking-tight text-gray-900 leading-tight">
                      Knihovna
                    </h1>
                    <span className="inline-block px-1.5 py-0.2 text-[9px] font-black rounded-full bg-rose-100 text-[#800020]">
                      v1.2
                    </span>
                  </div>
                  <p className="text-[10px] text-[#800020] font-bold tracking-wider uppercase flex items-center space-x-1">
                    <span>Správa & Čtení</span>
                    <Sparkles className="w-2.5 h-2.5 inline text-amber-500" />
                  </p>
                </div>
              </div>
            </div>

            {/* Right section: Quick Navigation Pills */}
            <nav className="flex items-center space-x-1.5">
              <button
                onClick={() => setActiveTab('database')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'database'
                    ? 'bg-[#800020] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Database className="w-4 h-4" />
                <span className="hidden md:inline">Databáze</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${activeTab === 'database' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {books.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('scanner')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'scanner'
                    ? 'bg-[#800020] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ScanBarcode className="w-4 h-4" />
                <span className="hidden md:inline">Načíst knihu</span>
              </button>

              <button
                onClick={() => setActiveTab('import-export')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'import-export'
                    ? 'bg-[#800020] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <HardDriveDownload className="w-4 h-4" />
                <span className="hidden md:inline">Záloha</span>
              </button>
            </nav>

          </div>
        </div>
      </header>

      {/* Slide-over Drawer Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative w-80 max-w-full bg-white shadow-2xl h-full flex flex-col z-10 border-r border-gray-200">
            {/* Drawer Header */}
            <div className="p-5 bg-gradient-to-br from-[#800020] to-rose-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Compass className="w-6 h-6 text-rose-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Nabídka aplikací</h3>
                  <p className="text-[11px] text-rose-200 font-medium">Výběr funkcí & statistik</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Banner */}
            <div className="p-4 bg-rose-50/60 border-b border-rose-100 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-rose-100 shadow-2xs">
                <span className="block text-lg font-black text-gray-900">{books.length}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Celkem</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-rose-100 shadow-2xs">
                <span className="block text-lg font-black text-emerald-600">{availableBooksCount}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Volné</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-rose-100 shadow-2xs">
                <span className="block text-lg font-black text-[#800020]">{borrowedBooksCount}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Půjčené</span>
              </div>
            </div>

            {/* Menu Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Hlavní funkce
              </div>

              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full p-3.5 rounded-2xl transition duration-200 text-left flex items-start space-x-3 cursor-pointer group border ${
                      isActive
                        ? 'bg-[#800020] text-white border-[#800020] shadow-md'
                        : 'bg-white hover:bg-rose-50/50 text-gray-800 border-gray-100 hover:border-rose-200'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-900 group-hover:text-[#800020]'}`}>
                          {item.label}
                        </span>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-white text-[#800020]' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 line-clamp-2 ${isActive ? 'text-rose-100' : 'text-gray-500'}`}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}

              <div className="pt-4 border-t border-gray-100 px-2">
                <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Hravá knihovna v1.2</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Skenujte čárové kódy, spravujte výpůjčky přátelům a zálohujte si knihovnu do JSON souboru kdykoliv!
                  </p>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500">
              <p className="font-semibold text-gray-700">Knihovna & Čtenářský deník</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Všechna data jsou v bezpečí vašeho prohlížeče.</p>
            </div>
          </div>
        </div>
      )}

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
          <BookScanner
            books={books}
            onBookAdded={handleBookAdded}
            onBookUpdated={handleBookUpdated}
          />
        )}

        {activeTab === 'import-export' && (
          <ImportExport
            books={books}
            onBooksImported={handleBooksImported}
            cloudEnabled={cloudSyncConfigured()}
            cloudEmail={cloudSession?.email ?? null}
            cloudStatus={cloudStatus}
            onCloudAuth={handleCloudAuth}
            onCloudLogout={handleCloudLogout}
            onCloudSyncNow={handleCloudSyncNow}
          />
        )}
      </main>

      {/* Bottom Navigation Bar for Mobile Devices */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('database')}
          className={`flex flex-col items-center space-y-0.5 cursor-pointer py-1 px-3 rounded-xl transition ${
            activeTab === 'database' ? 'text-[#800020] font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Database className="w-5 h-5" />
          <span className="text-[10px]">Databáze ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex flex-col items-center space-y-0.5 cursor-pointer py-1 px-3 rounded-xl transition ${
            activeTab === 'scanner' ? 'text-[#800020] font-bold scale-105' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className={`p-2 rounded-full ${activeTab === 'scanner' ? 'bg-[#800020] text-white shadow-md' : 'bg-gray-100 text-gray-700'}`}>
            <ScanBarcode className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Fotoaparát</span>
        </button>

        <button
          onClick={() => setActiveTab('import-export')}
          className={`flex flex-col items-center space-y-0.5 cursor-pointer py-1 px-3 rounded-xl transition ${
            activeTab === 'import-export' ? 'text-[#800020] font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <HardDriveDownload className="w-5 h-5" />
          <span className="text-[10px]">Záloha</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mb-16 md:mb-0 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© {CURRENT_YEAR} Aplikace na čtení a evidenci knih v knihovně</p>
          <div className="flex items-center space-x-4">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{cloudStatus}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
