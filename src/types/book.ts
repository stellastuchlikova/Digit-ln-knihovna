export interface Book {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  categories: string[];
  publishedDate?: string;
  publisher?: string;
  description?: string;
  coverUrl?: string;
  pageCount?: number;
  language?: string;

  // Status tracking
  isAvailable: boolean;
  borrowedTo?: string;
  borrowedAt?: string; // ISO string date
  dueDate?: string; // ISO string date
  notes?: string;

  // Metadata
  addedAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type ViewMode = 'grid' | 'table';

export type ActiveTab = 'scanner' | 'database' | 'import-export';

export interface BookFilter {
  searchQuery: string;
  selectedCategory: string;
  selectedAuthor: string;
  statusFilter: 'all' | 'available' | 'borrowed';
}
