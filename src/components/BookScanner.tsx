import React, { useState } from 'react';
import type { Book } from '../types/book';
import { PREDEFINED_GENRES, DEFAULT_GENRE } from '../constants/genres';
import { fetchBookByIsbn, searchBooksByTitleOrAuthor } from '../services/isbnApi';
import { checkForDuplicates, type DuplicateCheckResult } from '../services/duplicateDetection';
import { BarcodeScanner } from './BarcodeScanner';
import { BookCover } from './BookCover';
import { StarRating } from './StarRating';
import {
  Search, Plus, CheckCircle, AlertCircle, Loader2, BookOpen,
  Copy, Layers, AlertTriangle, ArrowRight, X
} from 'lucide-react';

interface BookScannerProps {
  books: Book[];
  onBookAdded: (book: Book) => void;
  onBookUpdated?: (book: Book) => void;
}

export const BookScanner: React.FC<BookScannerProps> = ({ books, onBookAdded, onBookUpdated }) => {
  const [isbnInput, setIsbnInput] = useState('');
  const [titleSearchInput, setTitleSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTitleSearching, setIsTitleSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Partial<Book>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Duplicate resolution modal state
  const [duplicateModal, setDuplicateModal] = useState<{
    isOpen: boolean;
    result?: DuplicateCheckResult;
    pendingBook?: Book;
  }>({ isOpen: false });

  // Form state for draft book
  const [formData, setFormData] = useState<Partial<Book>>({
    isbn: '',
    title: '',
    authors: [''],
    categories: [DEFAULT_GENRE],
    publishedDate: '',
    publisher: '',
    edition: '',
    description: '',
    coverUrl: '',
    pageCount: undefined,
    rating: 0,
    isAvailable: true,
    borrowedTo: '',
    notes: ''
  });

  const [isFormOpen, setIsFormOpen] = useState(false);

  // 1. Search by ISBN handler
  const handleSearchByIsbn = async (isbnToSearch: string) => {
    const cleanIsbn = isbnToSearch.replace(/[- ]/g, '').trim();
    if (!cleanIsbn) {
      setError('Zadejte prosím platný kód ISBN.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setSearchResults([]);

    try {
      const fetchedBook = await fetchBookByIsbn(cleanIsbn);
      if (fetchedBook) {
        setFormData({
          isbn: cleanIsbn,
          title: fetchedBook.title || '',
          authors: fetchedBook.authors && fetchedBook.authors.length > 0 ? fetchedBook.authors : [''],
          categories: fetchedBook.categories && fetchedBook.categories.length > 0 ? fetchedBook.categories : [DEFAULT_GENRE],
          publishedDate: fetchedBook.publishedDate || '',
          publisher: fetchedBook.publisher || '',
          edition: fetchedBook.edition || '',
          description: fetchedBook.description || '',
          coverUrl: fetchedBook.coverUrl || '',
          pageCount: fetchedBook.pageCount,
          rating: 0,
          isAvailable: true,
          borrowedTo: '',
          notes: ''
        });
        setIsFormOpen(true);
      } else {
        // Book not found in online API, prepare manual entry with this ISBN
        setFormData({
          isbn: cleanIsbn,
          title: '',
          authors: [''],
          categories: [DEFAULT_GENRE],
          publishedDate: '',
          publisher: '',
          edition: '',
          description: '',
          coverUrl: '',
          pageCount: undefined,
          rating: 0,
          isAvailable: true,
          borrowedTo: '',
          notes: ''
        });
        setError('Kniha nebyla nalezena v online katalozích. Můžete její údaje vyplnit ručně.');
        setIsFormOpen(true);
      }
    } catch {
      setError('Chyba při komunikaci s online databází knih.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Search online by title/author (for books without ISBN or when searching manually)
  const handleSearchByTitleOrAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleSearchInput.trim()) return;

    setIsTitleSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const results = await searchBooksByTitleOrAuthor(titleSearchInput);
      if (results.length > 0) {
        setSearchResults(results);
      } else {
        setError(`Pro dotaz "${titleSearchInput}" nebyly nalezeny žádné online výsledky. Můžete knihu vložit ručně.`);
      }
    } catch {
      setError('Chyba při online vyhledávání knih.');
    } finally {
      setIsTitleSearching(false);
    }
  };

  const handleSelectSearchResult = (bookDraft: Partial<Book>) => {
    setFormData({
      isbn: bookDraft.isbn || '',
      title: bookDraft.title || '',
      authors: bookDraft.authors && bookDraft.authors.length > 0 ? bookDraft.authors : [''],
      categories: bookDraft.categories && bookDraft.categories.length > 0 ? bookDraft.categories : [DEFAULT_GENRE],
      publishedDate: bookDraft.publishedDate || '',
      publisher: bookDraft.publisher || '',
      edition: bookDraft.edition || '',
      description: bookDraft.description || '',
      coverUrl: bookDraft.coverUrl || '',
      pageCount: bookDraft.pageCount,
      rating: 0,
      isAvailable: true,
      borrowedTo: '',
      notes: ''
    });
    setSearchResults([]);
    setIsFormOpen(true);
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsbnInput(decodedText);
    handleSearchByIsbn(decodedText);
  };

  // Open empty manual form (without requiring ISBN)
  const handleOpenManualEntry = () => {
    setError(null);
    setSuccessMessage(null);
    setFormData({
      isbn: '',
      title: '',
      authors: [''],
      categories: [DEFAULT_GENRE],
      publishedDate: '',
      publisher: '',
      edition: '',
      description: '',
      coverUrl: '',
      pageCount: undefined,
      rating: 0,
      isAvailable: true,
      borrowedTo: '',
      notes: ''
    });
    setIsFormOpen(true);
  };

  // Submitting book with duplicate & different edition detection
  const handleSubmitBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setError('Název knihy je povinný údaj.');
      return;
    }

    const newBook: Book = {
      id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isbn: formData.isbn?.trim() || '',
      title: formData.title.trim(),
      authors: formData.authors?.map(a => a.trim()).filter(Boolean) || ['Neznámý autor'],
      categories: formData.categories?.map(c => c.trim()).filter(Boolean) || [DEFAULT_GENRE],
      publishedDate: formData.publishedDate?.trim() || '',
      publisher: formData.publisher?.trim() || '',
      edition: formData.edition?.trim() || '',
      description: formData.description?.trim() || '',
      coverUrl: formData.coverUrl?.trim() || '',
      pageCount: formData.pageCount ? Number(formData.pageCount) : undefined,
      rating: formData.rating || 0,
      isAvailable: formData.isAvailable ?? true,
      borrowedTo: formData.isAvailable ? '' : (formData.borrowedTo?.trim() || ''),
      borrowedAt: formData.isAvailable ? '' : new Date().toISOString(),
      notes: formData.notes?.trim() || '',
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Check for duplicates or different editions in existing books
    const dupCheck = checkForDuplicates(newBook, books);

    if (dupCheck.status !== 'none' && dupCheck.existingBook) {
      // Trigger confirmation modal with choices
      setDuplicateModal({
        isOpen: true,
        result: dupCheck,
        pendingBook: newBook
      });
      return;
    }

    // No duplicate detected, save directly
    saveNewBookDirectly(newBook);
  };

  const saveNewBookDirectly = (bookToSave: Book) => {
    onBookAdded(bookToSave);
    setSuccessMessage(`Kniha "${bookToSave.title}" byla úspěšně přidána do databáze!`);
    setIsFormOpen(false);
    setIsbnInput('');
    setDuplicateModal({ isOpen: false });
  };

  // Duplicate resolution options:
  // Option A: Save as new copy / new edition
  const handleAddAsNewCopyOrEdition = () => {
    if (duplicateModal.pendingBook) {
      saveNewBookDirectly(duplicateModal.pendingBook);
    }
  };

  // Option B: Update existing book with new data
  const handleUpdateExisting = () => {
    if (duplicateModal.pendingBook && duplicateModal.result?.existingBook && onBookUpdated) {
      const merged: Book = {
        ...duplicateModal.result.existingBook,
        isbn: duplicateModal.pendingBook.isbn || duplicateModal.result.existingBook.isbn,
        edition: duplicateModal.pendingBook.edition || duplicateModal.result.existingBook.edition,
        publishedDate: duplicateModal.pendingBook.publishedDate || duplicateModal.result.existingBook.publishedDate,
        publisher: duplicateModal.pendingBook.publisher || duplicateModal.result.existingBook.publisher,
        coverUrl: duplicateModal.pendingBook.coverUrl || duplicateModal.result.existingBook.coverUrl,
        pageCount: duplicateModal.pendingBook.pageCount || duplicateModal.result.existingBook.pageCount,
        description: duplicateModal.pendingBook.description || duplicateModal.result.existingBook.description,
        rating: duplicateModal.pendingBook.rating || duplicateModal.result.existingBook.rating,
        updatedAt: new Date().toISOString()
      };
      onBookUpdated(merged);
      setSuccessMessage(`Kniha "${merged.title}" byla aktualizována novými údaji!`);
      setIsFormOpen(false);
      setDuplicateModal({ isOpen: false });
    } else {
      handleAddAsNewCopyOrEdition();
    }
  };

  const handleAddAuthor = () => {
    setFormData(prev => ({
      ...prev,
      authors: [...(prev.authors || []), '']
    }));
  };

  const handleAuthorChange = (index: number, value: string) => {
    const updatedAuthors = [...(formData.authors || [''])];
    updatedAuthors[index] = value;
    setFormData(prev => ({ ...prev, authors: updatedAuthors }));
  };

  const handleRemoveAuthor = (index: number) => {
    const updatedAuthors = (formData.authors || ['']).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, authors: updatedAuthors.length ? updatedAuthors : [''] }));
  };

  const handleAddCategory = () => {
    setFormData(prev => ({
      ...prev,
      categories: [...(prev.categories || []), '']
    }));
  };

  const handleCategoryChange = (index: number, value: string) => {
    const updatedCategories = [...(formData.categories || [''])];
    updatedCategories[index] = value;
    setFormData(prev => ({ ...prev, categories: updatedCategories }));
  };

  const handleRemoveCategory = (index: number) => {
    const updatedCategories = (formData.categories || ['']).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, categories: updatedCategories.length ? updatedCategories : [''] }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner / Section Header */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-black tracking-tight text-gray-900">
          Načtení a vložení nové knihy
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm max-w-lg mx-auto">
          Naskenujte čárový kód nebo tištěný text ISBN fotoaparátem, vyhledejte knihu podle názvu, nebo ji vložte ručně bez ISBN.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold text-xs sm:text-sm">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Main scanner & manual ISBN / Title input section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Camera Scanner (Barcode & OCR Text) */}
        <BarcodeScanner onScanSuccess={handleScanSuccess} />

        {/* Manual inputs & Online Search Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 text-gray-900 border-b border-gray-100 pb-3">
            <Search className="w-4 h-4 text-[#800020]" />
            <h3 className="font-bold text-sm">Ruční vyhledání nebo zadání</h3>
          </div>

          {/* Form 1: Search by ISBN */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchByIsbn(isbnInput);
            }}
            className="space-y-2"
          >
            <label htmlFor="isbn" className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
              1. Zadat číslo ISBN ručně
            </label>
            <div className="flex space-x-2">
              <input
                id="isbn"
                type="text"
                value={isbnInput}
                onChange={(e) => setIsbnInput(e.target.value)}
                placeholder="např. 9788020719808..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#800020]"
              />
              <button
                type="submit"
                disabled={isLoading || !isbnInput.trim()}
                className="px-3.5 py-2 bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition duration-150 flex items-center space-x-1.5 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Načíst</span>
              </button>
            </div>
          </form>

          {/* Form 2: Search online by Title or Author */}
          <form onSubmit={handleSearchByTitleOrAuthor} className="space-y-2 pt-1 border-t border-gray-100">
            <label htmlFor="titleSearch" className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
              2. Vyhledat knihu online podle názvu / autora
            </label>
            <div className="flex space-x-2">
              <input
                id="titleSearch"
                type="text"
                value={titleSearchInput}
                onChange={(e) => setTitleSearchInput(e.target.value)}
                placeholder="např. Malý princ, Karel Čapek..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#800020]"
              />
              <button
                type="submit"
                disabled={isTitleSearching || !titleSearchInput.trim()}
                className="px-3.5 py-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition duration-150 flex items-center space-x-1.5 cursor-pointer"
              >
                {isTitleSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Hledat</span>
              </button>
            </div>
          </form>

          {/* Search Results list if multiple found */}
          {searchResults.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                <span>Nalezené výsledky ({searchResults.length})</span>
                <button
                  type="button"
                  onClick={() => setSearchResults([])}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSearchResult(item)}
                    className="p-2 bg-white hover:bg-rose-50 border border-gray-200 rounded-lg text-left cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold text-gray-900 truncate group-hover:text-[#800020]">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {item.authors?.join(', ')} {item.publishedDate ? `(${item.publishedDate})` : ''}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#800020] flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form 3: Direct Manual Entry Button (No ISBN required) */}
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleOpenManualEntry}
              className="w-full py-2.5 px-4 border-2 border-dashed border-[#800020]/40 rounded-xl text-xs font-bold text-[#800020] bg-rose-50/50 hover:bg-rose-50 transition duration-150 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Ruční zápis knihy bez ISBN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Book details draft form modal / expanded section */}
      {isFormOpen && (
        <div className="bg-white border-2 border-[#800020] rounded-3xl p-6 shadow-xl transition-all">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
            <div className="flex items-center space-x-2 text-[#800020]">
              <BookOpen className="w-5 h-5" />
              <h3 className="text-lg font-bold text-gray-900">
                {formData.title ? 'Zkontrolovat a uložit knihu' : 'Ruční zápis knihy do knihovny'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-bold text-gray-400 hover:text-gray-700 p-1 rounded-lg"
            >
              ✕ Zavřít
            </button>
          </div>

          <form onSubmit={handleSubmitBook} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Cover Image Preview */}
              <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-2xl p-4 bg-gray-50">
                <BookCover
                  coverUrl={formData.coverUrl}
                  title={formData.title || 'Název knihy'}
                  authors={formData.authors?.filter(Boolean)}
                  categories={formData.categories?.filter(Boolean)}
                  className="w-32 h-48 mb-3 shadow-xs"
                />
                <div className="w-full">
                  <label htmlFor="coverUrl" className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                    URL adresa obálky (volitelné)
                  </label>
                  <input
                    id="coverUrl"
                    type="url"
                    value={formData.coverUrl || ''}
                    onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3.5 md:col-span-2">
                <div>
                  <label htmlFor="title" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Název knihy *
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="např. R.U.R., Válka s Mloky..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#800020]"
                  />
                </div>

                {/* Rating selection */}
                <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Vaše hodnocení (volitelné):
                  </label>
                  <StarRating
                    rating={formData.rating || 0}
                    onRatingChange={(r) => setFormData({ ...formData, rating: r })}
                    size="md"
                    showNumber
                  />
                </div>

                {/* Authors */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Autor / Autoři
                  </label>
                  {(formData.authors || ['']).map((author, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => handleAuthorChange(idx, e.target.value)}
                        placeholder="Jméno autora"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400"
                      />
                      {(formData.authors?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAuthor(idx)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddAuthor}
                    className="text-xs font-semibold text-[#800020] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Přidat dalšího autora</span>
                  </button>
                </div>

                {/* Predefined Categories / Genres Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Žánr / Kategorie
                  </label>
                  {(formData.categories || [DEFAULT_GENRE]).map((cat, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mb-2">
                      <select
                        value={cat}
                        onChange={(e) => handleCategoryChange(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white"
                      >
                        {PREDEFINED_GENRES.map(genre => (
                          <option key={genre.id} value={genre.label}>
                            {genre.label}
                          </option>
                        ))}
                      </select>
                      {(formData.categories?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(idx)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-2 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="text-xs font-semibold text-[#800020] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Přidat další žánr</span>
                  </button>
                </div>

                {/* ISBN and Edition */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="isbnForm" className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                      ISBN (volitelné)
                    </label>
                    <input
                      id="isbnForm"
                      type="text"
                      value={formData.isbn || ''}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="bez ISBN ponechte prázdné"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="editionForm" className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                      Vydání (volitelné)
                    </label>
                    <input
                      id="editionForm"
                      type="text"
                      value={formData.edition || ''}
                      onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                      placeholder="např. 1. vydání, ilustrované..."
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="publishedDate" className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                      Rok vydání
                    </label>
                    <input
                      id="publishedDate"
                      type="text"
                      value={formData.publishedDate || ''}
                      onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                      placeholder="např. 2021"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="publisher" className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                      Nakladatelství
                    </label>
                    <input
                      id="publisher"
                      type="text"
                      value={formData.publisher || ''}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      placeholder="např. Albatros"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="pageCount" className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                      Počet stran
                    </label>
                    <input
                      id="pageCount"
                      type="number"
                      value={formData.pageCount || ''}
                      onChange={(e) => setFormData({ ...formData, pageCount: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="počet"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <span className="block text-[10px] font-bold text-gray-700 uppercase">Stav knihy</span>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="isAvailable"
                        checked={formData.isAvailable === true}
                        onChange={() => setFormData({ ...formData, isAvailable: true, borrowedTo: '' })}
                        className="text-[#800020] focus:ring-[#800020]"
                      />
                      <span className="text-xs font-bold text-emerald-700">Dostupná v knihovně</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="isAvailable"
                        checked={formData.isAvailable === false}
                        onChange={() => setFormData({ ...formData, isAvailable: false })}
                        className="text-[#800020] focus:ring-[#800020]"
                      />
                      <span className="text-xs font-bold text-[#800020]">Vypůjčená</span>
                    </label>
                  </div>

                  {!formData.isAvailable && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <label htmlFor="borrowedTo" className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
                        Komu je vypůjčena (Jméno / Kontakt)
                      </label>
                      <input
                        id="borrowedTo"
                        type="text"
                        value={formData.borrowedTo || ''}
                        onChange={(e) => setFormData({ ...formData, borrowedTo: e.target.value })}
                        placeholder="Jméno vypůjčitele..."
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                    Popis / Anotace
                  </label>
                  <textarea
                    id="description"
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Popis děje nebo poznámky..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#800020] hover:bg-[#660019] text-white font-bold rounded-xl text-xs shadow transition duration-150 flex items-center space-x-2 cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Uložit knihu do databáze</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Duplicate / Different Edition Resolution Modal */}
      {duplicateModal.isOpen && duplicateModal.result && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className={`p-4 text-white flex items-center space-x-2 ${
              duplicateModal.result.status === 'exact_duplicate' ? 'bg-amber-600' : 'bg-[#800020]'
            }`}>
              {duplicateModal.result.status === 'exact_duplicate' ? (
                <AlertTriangle className="w-5 h-5 text-amber-200" />
              ) : (
                <Layers className="w-5 h-5 text-rose-200" />
              )}
              <h3 className="font-extrabold text-sm sm:text-base">
                {duplicateModal.result.status === 'exact_duplicate'
                  ? 'Kniha již v knihovně existuje'
                  : 'Nalezeno odlišné vydání této knihy'}
              </h3>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                {duplicateModal.result.message}
              </p>

              {duplicateModal.result.existingBook && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center space-x-3">
                  <BookCover
                    coverUrl={duplicateModal.result.existingBook.coverUrl}
                    title={duplicateModal.result.existingBook.title}
                    authors={duplicateModal.result.existingBook.authors}
                    categories={duplicateModal.result.existingBook.categories}
                    className="w-12 h-16 rounded shadow-2xs flex-shrink-0"
                    size="sm"
                  />
                  <div className="text-xs min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {duplicateModal.result.existingBook.title}
                    </p>
                    <p className="text-gray-500 truncate">
                      {duplicateModal.result.existingBook.authors.join(', ')}
                    </p>
                    <p className="text-[11px] text-[#800020] font-semibold mt-0.5">
                      {duplicateModal.result.existingBook.edition ? `Vydání: ${duplicateModal.result.existingBook.edition} | ` : ''}
                      Rok: {duplicateModal.result.existingBook.publishedDate || 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="block text-[11px] font-bold text-gray-500 uppercase">
                  Zvolte jak postupovat:
                </span>

                {duplicateModal.result.status === 'different_edition' ? (
                  <button
                    type="button"
                    onClick={handleAddAsNewCopyOrEdition}
                    className="w-full p-2.5 bg-[#800020] hover:bg-[#660019] text-white text-xs font-bold rounded-xl shadow flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Uložit jako nové samostatné vydání knihy</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddAsNewCopyOrEdition}
                    className="w-full p-2.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Přidat jako další výtisk (kopii)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleUpdateExisting}
                  className="w-full p-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Aktualizovat stávající záznam v knihovně</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDuplicateModal({ isOpen: false })}
                  className="w-full p-2 text-gray-500 hover:text-gray-700 text-xs font-medium cursor-pointer"
                >
                  Zrušit vložení
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
