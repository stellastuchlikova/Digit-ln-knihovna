import React, { useMemo, useState } from 'react';
import type { Book, ViewMode, BookFilter } from '../types/book';
import { BookDetailModal } from './BookDetailModal';
import {
  Search, Filter, LayoutGrid, List, CheckCircle2, XCircle,
  Trash2, Eye, User, Tag, BookOpen, ArrowUpDown
} from 'lucide-react';

interface BookDatabaseProps {
  books: Book[];
  onUpdateBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onSelectScannerTab: () => void;
}

export const BookDatabase: React.FC<BookDatabaseProps> = ({
  books,
  onUpdateBook,
  onDeleteBook,
  onSelectScannerTab
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Filters state
  const [filters, setFilters] = useState<BookFilter>({
    searchQuery: '',
    selectedCategory: '',
    selectedAuthor: '',
    statusFilter: 'all'
  });

  const [sortBy, setSortBy] = useState<'title' | 'author' | 'addedAt'>('addedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Derive unique categories and authors
  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => {
      b.categories.forEach(c => {
        if (c.trim()) set.add(c.trim());
      });
    });
    return Array.from(set).sort();
  }, [books]);

  const authors = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => {
      b.authors.forEach(a => {
        if (a.trim()) set.add(a.trim());
      });
    });
    return Array.from(set).sort();
  }, [books]);

  // Filtered & Sorted books
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      // Search text (matches title, author, or isbn)
      const query = filters.searchQuery.toLowerCase().trim();
      const matchesQuery = !query ||
        book.title.toLowerCase().includes(query) ||
        book.authors.some(a => a.toLowerCase().includes(query)) ||
        book.isbn.toLowerCase().includes(query);

      // Category filter
      const matchesCategory = !filters.selectedCategory ||
        book.categories.includes(filters.selectedCategory);

      // Author filter
      const matchesAuthor = !filters.selectedAuthor ||
        book.authors.includes(filters.selectedAuthor);

      // Status filter
      const matchesStatus =
        filters.statusFilter === 'all' ||
        (filters.statusFilter === 'available' && book.isAvailable) ||
        (filters.statusFilter === 'borrowed' && !book.isAvailable);

      return matchesQuery && matchesCategory && matchesAuthor && matchesStatus;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title, 'cs');
      } else if (sortBy === 'author') {
        const authorA = a.authors[0] || '';
        const authorB = b.authors[0] || '';
        comparison = authorA.localeCompare(authorB, 'cs');
      } else if (sortBy === 'addedAt') {
        comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [books, filters, sortBy, sortOrder]);

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      selectedCategory: '',
      selectedAuthor: '',
      statusFilter: 'all'
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <span>Knihovní databáze</span>
            <span className="text-xs bg-[#800020] text-white px-2.5 py-0.5 rounded-full font-semibold">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'kniha' : filteredBooks.length >= 2 && filteredBooks.length <= 4 ? 'knihy' : 'knih'}
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Kompletní seznam knih s možností vyhledávání, filtrace a správy vypůjčení.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition duration-150 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#800020] shadow-xs font-medium'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Mřížka"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition duration-150 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#800020] shadow-xs font-medium'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Tabulka"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onSelectScannerTab}
            className="px-4 py-2 bg-[#800020] hover:bg-[#660019] text-white text-xs font-semibold rounded-lg shadow transition cursor-pointer flex items-center space-x-1.5"
          >
            <span>+ Přidat knihu</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            placeholder="Vyhledat podle názvu knihy, jména autora nebo ISBN kódu..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#800020] focus:border-[#800020]"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Žánr / Kategorie
            </label>
            <select
              value={filters.selectedCategory}
              onChange={(e) => setFilters({ ...filters, selectedCategory: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white"
            >
              <option value="">Všechny žánry ({categories.length})</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Author Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Autor
            </label>
            <select
              value={filters.selectedAuthor}
              onChange={(e) => setFilters({ ...filters, selectedAuthor: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white"
            >
              <option value="">Všichni autoři ({authors.length})</option>
              {authors.map((auth, idx) => (
                <option key={idx} value={auth}>
                  {auth}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Dostupnost
            </label>
            <select
              value={filters.statusFilter}
              onChange={(e) => setFilters({ ...filters, statusFilter: e.target.value as BookFilter['statusFilter'] })}
              className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white"
            >
              <option value="all">Všechny knihy</option>
              <option value="available">Pouze dostupné v knihovně</option>
              <option value="borrowed">Pouze vypůjčené knihy</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Řazení
            </label>
            <div className="flex space-x-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white"
              >
                <option value="addedAt">Nejnověji přidané</option>
                <option value="title">Název (A-Z)</option>
                <option value="author">Autor (A-Z)</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 cursor-pointer"
                title={sortOrder === 'asc' ? 'Vzestupně' : 'Sestupně'}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters / Reset */}
        {(filters.searchQuery || filters.selectedCategory || filters.selectedAuthor || filters.statusFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-[#800020]" />
              <span>Aktivní filtr – zobrazeno <strong>{filteredBooks.length}</strong> ze {books.length} knih</span>
            </span>
            <button
              onClick={handleResetFilters}
              className="text-[#800020] hover:underline font-semibold cursor-pointer"
            >
              Vymazat filtry
            </button>
          </div>
        )}
      </div>

      {/* Main Content List / Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Žádné knihy neodpovídají zadaným kritériím</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {books.length === 0
                ? 'Vaše databáze je momentálně prázdná. Přidejte první knihu naskenováním čárového kódu nebo zadáním ISBN.'
                : 'Zkuste upravit nebo resetovat vyhledávací filtry pro zobrazení knih.'}
            </p>
          </div>
          {books.length === 0 ? (
            <button
              onClick={onSelectScannerTab}
              className="px-5 py-2.5 bg-[#800020] text-white text-xs font-semibold rounded-xl shadow hover:bg-[#660019] cursor-pointer inline-flex items-center space-x-2"
            >
              <span>Načíst první knihu</span>
            </button>
          ) : (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Resetovat vyhledávání
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredBooks.map(book => (
            <div
              key={book.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
            >
              {/* Cover & Status */}
              <div
                className="relative bg-gray-50 border-b border-gray-100 flex items-center justify-center p-4 cursor-pointer min-h-[220px]"
                onClick={() => setSelectedBook(book)}
              >
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="max-h-48 object-contain rounded shadow-xs group-hover:scale-105 transition duration-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-28 h-40 bg-gray-200 rounded flex flex-col items-center justify-center text-gray-400">
                    <BookOpen className="w-10 h-10 mb-1" />
                    <span className="text-[10px]">Bez obálky</span>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {book.isAvailable ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Dostupná
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-[#800020] border border-rose-300">
                      <XCircle className="w-3 h-3 mr-1" />
                      Vypůjčená
                    </span>
                  )}
                </div>
              </div>

              {/* Book Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div
                  className="cursor-pointer"
                  onClick={() => setSelectedBook(book)}
                >
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-2 hover:text-[#800020] transition">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 flex items-center line-clamp-1">
                    <User className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                    <span>{book.authors.join(', ') || 'Neznámý autor'}</span>
                  </p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {book.categories.slice(0, 2).map((cat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600"
                    >
                      <Tag className="w-2.5 h-2.5 mr-1 text-[#800020]" />
                      {cat}
                    </span>
                  ))}
                  {book.categories.length > 2 && (
                    <span className="text-[10px] text-gray-400 self-center">
                      +{book.categories.length - 2}
                    </span>
                  )}
                </div>

                {/* Borrow Info if borrowed */}
                {!book.isAvailable && book.borrowedTo && (
                  <div className="text-[11px] bg-rose-50 p-2 rounded text-[#800020] border border-rose-100">
                    Vypůjčil/a: <strong>{book.borrowedTo}</strong>
                  </div>
                )}

                {/* Bottom Card Actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedBook(book)}
                    className="text-xs font-semibold text-gray-700 hover:text-[#800020] flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Opravdu chcete smazat knihu "${book.title}"?`)) {
                        onDeleteBook(book.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                    title="Smazat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Kniha / Název</th>
                  <th className="py-3 px-4">Autor</th>
                  <th className="py-3 px-4">Žánr</th>
                  <th className="py-3 px-4">ISBN</th>
                  <th className="py-3 px-4">Stav dostupnosti</th>
                  <th className="py-3 px-4 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBooks.map(book => (
                  <tr key={book.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      <div className="flex items-center space-x-3">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt=""
                            className="w-8 h-11 object-contain rounded bg-gray-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-11 bg-gray-100 rounded flex items-center justify-center text-gray-400 flex-shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span
                            onClick={() => setSelectedBook(book)}
                            className="hover:text-[#800020] cursor-pointer block line-clamp-1"
                          >
                            {book.title}
                          </span>
                          {book.publisher && (
                            <span className="text-[10px] text-gray-400 font-normal">
                              {book.publisher} ({book.publishedDate || 'N/A'})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-gray-800">
                      {book.authors.join(', ') || 'Neznámý'}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {book.categories.map((c, i) => (
                          <span key={i} className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-gray-500">
                      {book.isbn || '—'}
                    </td>

                    <td className="py-3 px-4">
                      {book.isAvailable ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Dostupná
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-[#800020] border border-rose-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Vypůjčená
                          </span>
                          {book.borrowedTo && (
                            <span className="block text-[10px] text-gray-500 mt-0.5">
                              {book.borrowedTo}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedBook(book)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-semibold cursor-pointer"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Opravdu chcete smazat knihu "${book.title}"?`)) {
                              onDeleteBook(book.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition cursor-pointer"
                          title="Smazat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail & Edit Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onUpdate={(updated) => {
            onUpdateBook(updated);
            setSelectedBook(updated);
          }}
          onDelete={(id) => {
            onDeleteBook(id);
            setSelectedBook(null);
          }}
        />
      )}
    </div>
  );
};
