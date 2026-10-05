import React, { useState } from 'react';
import type { Book } from '../types/book';
import { fetchBookByIsbn } from '../services/isbnApi';
import { BarcodeScanner } from './BarcodeScanner';
import { Search, Plus, CheckCircle, AlertCircle, Loader2, BookOpen } from 'lucide-react';

interface BookScannerProps {
  onBookAdded: (book: Book) => void;
}

export const BookScanner: React.FC<BookScannerProps> = ({ onBookAdded }) => {
  const [isbnInput, setIsbnInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state for draft book
  const [formData, setFormData] = useState<Partial<Book>>({
    isbn: '',
    title: '',
    authors: [''],
    categories: [''],
    publishedDate: '',
    publisher: '',
    description: '',
    coverUrl: '',
    pageCount: undefined,
    isAvailable: true,
    borrowedTo: '',
    notes: ''
  });

  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSearchByIsbn = async (isbnToSearch: string) => {
    const cleanIsbn = isbnToSearch.replace(/[- ]/g, '').trim();
    if (!cleanIsbn) {
      setError('Zadejte prosím platný kód ISBN.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const fetchedBook = await fetchBookByIsbn(cleanIsbn);
      if (fetchedBook) {
        setFormData({
          isbn: cleanIsbn,
          title: fetchedBook.title || '',
          authors: fetchedBook.authors && fetchedBook.authors.length > 0 ? fetchedBook.authors : [''],
          categories: fetchedBook.categories && fetchedBook.categories.length > 0 ? fetchedBook.categories : [''],
          publishedDate: fetchedBook.publishedDate || '',
          publisher: fetchedBook.publisher || '',
          description: fetchedBook.description || '',
          coverUrl: fetchedBook.coverUrl || '',
          pageCount: fetchedBook.pageCount,
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
          categories: [''],
          publishedDate: '',
          publisher: '',
          description: '',
          coverUrl: '',
          pageCount: undefined,
          isAvailable: true,
          borrowedTo: '',
          notes: ''
        });
        setError('Kniha nebyla nalezena v databázi Google/OpenLibrary. Můžete její údaje vyplnit ručně.');
        setIsFormOpen(true);
      }
    } catch (err) {
      setError('Chyba při komunikaci s online databází knih.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsbnInput(decodedText);
    handleSearchByIsbn(decodedText);
  };

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
      categories: formData.categories?.map(c => c.trim()).filter(Boolean) || ['Nezařazeno'],
      publishedDate: formData.publishedDate || '',
      publisher: formData.publisher?.trim() || '',
      description: formData.description?.trim() || '',
      coverUrl: formData.coverUrl?.trim() || '',
      pageCount: formData.pageCount ? Number(formData.pageCount) : undefined,
      isAvailable: formData.isAvailable ?? true,
      borrowedTo: formData.isAvailable ? '' : (formData.borrowedTo?.trim() || ''),
      borrowedAt: formData.isAvailable ? '' : new Date().toISOString(),
      notes: formData.notes?.trim() || '',
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onBookAdded(newBook);
    setSuccessMessage(`Kniha "${newBook.title}" byla úspěšně přidána do databáze!`);
    setIsFormOpen(false);
    setIsbnInput('');
    setFormData({
      isbn: '',
      title: '',
      authors: [''],
      categories: [''],
      publishedDate: '',
      publisher: '',
      description: '',
      coverUrl: '',
      pageCount: undefined,
      isAvailable: true,
      borrowedTo: '',
      notes: ''
    });
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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Banner / Section Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Načtení a vložení nové knihy</h2>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Naskenujte čárový kód pomocí fotoaparátu, zadejte ISBN ručně nebo přímo vyplňte formulář pro vložení knihy do databáze.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-3 shadow-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-medium text-sm">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Main scanner & manual ISBN input section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Camera Scanner */}
        <BarcodeScanner onScanSuccess={handleScanSuccess} />

        {/* Manual ISBN Input Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 text-gray-900 border-b border-gray-100 pb-3">
            <Search className="w-5 h-5 text-[#800020]" />
            <h3 className="font-semibold text-base">Ruční zadání podle ISBN</h3>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchByIsbn(isbnInput);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="isbn" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Číslo ISBN / Čárový kód
              </label>
              <input
                id="isbn"
                type="text"
                value={isbnInput}
                onChange={(e) => setIsbnInput(e.target.value)}
                placeholder="např. 9788020719808 nebo 978-80-257-2232-9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#800020] focus:border-[#800020] text-sm text-gray-900 placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !isbnInput.trim()}
              className="w-full px-4 py-2.5 bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition duration-150 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Vyhledávání v katalogu...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Vyhledat a načíst knihu</span>
                </>
              )}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400 font-medium">nebo</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setFormData({
                isbn: '',
                title: '',
                authors: [''],
                categories: [''],
                publishedDate: '',
                publisher: '',
                description: '',
                coverUrl: '',
                pageCount: undefined,
                isAvailable: true,
                borrowedTo: '',
                notes: ''
              });
              setIsFormOpen(true);
            }}
            className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#800020]" />
            <span>Ruční vložení bez ISBN</span>
          </button>
        </div>
      </div>

      {/* Book details draft form modal / expanded section */}
      {isFormOpen && (
        <div className="bg-white border-2 border-[#800020] rounded-xl p-6 shadow-md transition-all">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
            <div className="flex items-center space-x-2 text-[#800020]">
              <BookOpen className="w-6 h-6" />
              <h3 className="text-xl font-bold text-gray-900">
                {formData.title ? 'Zkontrolovat a uložit knihu' : 'Nová kniha (Ruční zadání)'}
              </h3>
            </div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-sm font-medium text-gray-500 hover:text-gray-800"
            >
              Zavřít
            </button>
          </div>

          <form onSubmit={handleSubmitBook} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Cover Image Preview */}
              <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                {formData.coverUrl ? (
                  <img
                    src={formData.coverUrl}
                    alt="Obálka knihy"
                    className="max-h-56 object-contain rounded shadow-sm mb-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-32 h-44 bg-gray-200 rounded flex flex-col items-center justify-center text-gray-400 mb-3">
                    <BookOpen className="w-10 h-10 mb-1" />
                    <span className="text-xs">Bez obálky</span>
                  </div>
                )}
                <div className="w-full">
                  <label htmlFor="coverUrl" className="block text-xs font-semibold text-gray-600 mb-1">
                    URL adresa obálky
                  </label>
                  <input
                    id="coverUrl"
                    type="url"
                    value={formData.coverUrl || ''}
                    onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full text-xs p-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Form Fields Column 1 */}
              <div className="space-y-4 md:col-span-2">
                <div>
                  <label htmlFor="title" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Název knihy *
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Zadejte název knihy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#800020] focus:border-[#800020]"
                  />
                </div>

                {/* Authors */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Autor / Autoři
                  </label>
                  {(formData.authors || ['']).map((author, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => handleAuthorChange(idx, e.target.value)}
                        placeholder="Jméno autora"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
                      />
                      {(formData.authors?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAuthor(idx)}
                          className="text-red-500 hover:text-red-700 text-sm font-bold px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddAuthor}
                    className="text-xs font-medium text-[#800020] hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Přidat dalšího autora</span>
                  </button>
                </div>

                {/* Categories / Genres */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Žánry / Kategorie
                  </label>
                  {(formData.categories || ['']).map((cat, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={cat}
                        onChange={(e) => handleCategoryChange(idx, e.target.value)}
                        placeholder="např. Sci-fi, Román, Detektivka"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
                      />
                      {(formData.categories?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(idx)}
                          className="text-red-500 hover:text-red-700 text-sm font-bold px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="text-xs font-medium text-[#800020] hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Přidat další kategorii</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="isbnForm" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      ISBN
                    </label>
                    <input
                      id="isbnForm"
                      type="text"
                      value={formData.isbn || ''}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="ISBN kód"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="publishedDate" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Rok / Datum vydání
                    </label>
                    <input
                      id="publishedDate"
                      type="text"
                      value={formData.publishedDate || ''}
                      onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                      placeholder="např. 2021"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="publisher" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Nakladatelství
                    </label>
                    <input
                      id="publisher"
                      type="text"
                      value={formData.publisher || ''}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      placeholder="Název nakladatele"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="pageCount" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Počet stran
                    </label>
                    <input
                      id="pageCount"
                      type="number"
                      value={formData.pageCount || ''}
                      onChange={(e) => setFormData({ ...formData, pageCount: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="počet"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                  <span className="block text-xs font-semibold text-gray-700 uppercase">Stav knihy při vložení</span>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="isAvailable"
                        checked={formData.isAvailable === true}
                        onChange={() => setFormData({ ...formData, isAvailable: true, borrowedTo: '' })}
                        className="text-[#800020] focus:ring-[#800020]"
                      />
                      <span className="text-sm font-medium text-emerald-700">Dostupná v knihovně</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="isAvailable"
                        checked={formData.isAvailable === false}
                        onChange={() => setFormData({ ...formData, isAvailable: false })}
                        className="text-[#800020] focus:ring-[#800020]"
                      />
                      <span className="text-sm font-medium text-[#800020]">Vypůjčená</span>
                    </label>
                  </div>

                  {!formData.isAvailable && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <label htmlFor="borrowedTo" className="block text-xs font-semibold text-gray-700 mb-1">
                        Komu je vypůjčena (Jméno / Kontakt)
                      </label>
                      <input
                        id="borrowedTo"
                        type="text"
                        value={formData.borrowedTo || ''}
                        onChange={(e) => setFormData({ ...formData, borrowedTo: e.target.value })}
                        placeholder="Jméno vypůjčitele..."
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Popis / Anotace
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Popis děje nebo informace o knize..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#800020] hover:bg-[#660019] text-white font-medium rounded-lg text-sm shadow transition duration-150 flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Uložit knihu do databáze</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
