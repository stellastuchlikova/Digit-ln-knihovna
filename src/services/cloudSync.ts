import type { Book } from '../types/book';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SESSION_KEY = 'knihovna_supabase_session_v1';
const DELETIONS_KEY = 'knihovna_deleted_books_v1';

export interface CloudSession {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface CloudBookRow {
  id: string;
  book_data: Book | null;
  deleted_at: string | null;
  updated_at: string;
}

export const cloudSyncConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const getCloudSession = (): CloudSession | null => {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as CloudSession | null;
    return session && session.expiresAt > Date.now() + 30000 ? session : null;
  } catch {
    return null;
  }
};

const setCloudSession = (session: CloudSession | null) => {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
};

const responseMessage = async (response: Response) => {
  const body = await response.json().catch(() => ({}));
  const message = body.msg || body.message || body.error_description || body.error;
  if (typeof message === 'string' && /invalid login credentials/i.test(message)) return 'E-mail nebo heslo není správné.';
  if (typeof message === 'string' && /email not confirmed/i.test(message)) return 'Nejdřív potvrď e-mail z registrační zprávy.';
  return typeof message === 'string' ? message : 'Požadavek se nezdařil. Zkus to prosím znovu.';
};

const authRequest = async (path: string, payload: Record<string, unknown>) => {
  if (!cloudSyncConfigured()) throw new Error('Synchronizace ještě není nastavena.');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await responseMessage(response));
  return response.json();
};

const sessionFromAuth = (data: any): CloudSession | null => {
  if (!data?.access_token || !data?.user?.id) return null;
  const session: CloudSession = {
    userId: data.user.id,
    email: data.user.email || '',
    accessToken: data.access_token,
    refreshToken: data.refresh_token || '',
    expiresAt: data.expires_at ? data.expires_at * 1000 : Date.now() + (data.expires_in || 3600) * 1000
  };
  setCloudSession(session);
  return session;
};

export const signInToCloud = async (email: string, password: string) => {
  const data = await authRequest('token?grant_type=password', { email: email.trim(), password });
  const session = sessionFromAuth(data);
  if (!session) throw new Error('Účet nemá aktivní relaci. Potvrď e-mail a potom se přihlas znovu.');
  return session;
};

export const signUpToCloud = async (email: string, password: string) => {
  const data = await authRequest('signup', { email: email.trim(), password });
  return sessionFromAuth(data);
};

export const signOutFromCloud = async () => {
  const session = getCloudSession();
  if (session && cloudSyncConfigured()) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.accessToken}` }
    }).catch(() => undefined);
  }
  setCloudSession(null);
};

const validSession = async (): Promise<CloudSession> => {
  let session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as CloudSession | null;
  if (!session) throw new Error('Přihlas se ke svému účtu pro synchronizaci.');
  if (session.expiresAt <= Date.now() + 60000) {
    if (!session.refreshToken) {
      setCloudSession(null);
      throw new Error('Přihlášení vypršelo. Přihlas se prosím znovu.');
    }
    const data = await authRequest('token?grant_type=refresh_token', { refresh_token: session.refreshToken });
    session = sessionFromAuth(data);
    if (!session) throw new Error('Přihlášení vypršelo. Přihlas se prosím znovu.');
  }
  return session;
};

const dbRequest = async (query: string, init: RequestInit = {}) => {
  if (!cloudSyncConfigured()) throw new Error('Synchronizace ještě není nastavena.');
  const session = await validSession();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/books${query}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  if (!response.ok) throw new Error(await responseMessage(response));
  return response.status === 204 ? null : response.json();
};

export const fetchCloudBooks = async (): Promise<CloudBookRow[]> => {
  const session = await validSession();
  return dbRequest(`?select=id,book_data,deleted_at,updated_at&user_id=eq.${encodeURIComponent(session.userId)}`);
};

export const saveCloudBooks = async (books: Book[]) => {
  if (!books.length) return;
  const session = await validSession();
  const records = books.map(book => ({
    user_id: session.userId,
    id: book.id,
    book_data: book,
    deleted_at: null,
    updated_at: book.updatedAt || new Date().toISOString()
  }));
  await dbRequest('?on_conflict=user_id,id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(records)
  });
};

export const saveCloudDeletions = async () => {
  const session = await validSession();
  const deletions = getLocalDeletions();
  if (!deletions.length) return;
  const records = deletions.map(({ id, deletedAt }) => ({
    user_id: session.userId,
    id,
    book_data: null,
    deleted_at: deletedAt,
    updated_at: deletedAt
  }));
  await dbRequest('?on_conflict=user_id,id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(records)
  });
};

export const markBookDeleted = (id: string) => {
  const deletions = getLocalDeletions().filter(item => item.id !== id);
  deletions.push({ id, deletedAt: new Date().toISOString() });
  localStorage.setItem(DELETIONS_KEY, JSON.stringify(deletions));
};

export const restoreBook = (id: string) => {
  const deletions = getLocalDeletions().filter(item => item.id !== id);
  localStorage.setItem(DELETIONS_KEY, JSON.stringify(deletions));
};

const getLocalDeletions = (): Array<{ id: string; deletedAt: string }> => {
  try {
    const value = JSON.parse(localStorage.getItem(DELETIONS_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const mergeCloudBooks = (localBooks: Book[], rows: CloudBookRow[]): Book[] => {
  const candidates = new Map<string, Book>();
  const deletedAt = new Map<string, string>();

  getLocalDeletions().forEach(item => deletedAt.set(item.id, item.deletedAt));
  rows.forEach(row => {
    if (row.deleted_at) {
      const previous = deletedAt.get(row.id) || '';
      if (row.deleted_at > previous) deletedAt.set(row.id, row.deleted_at);
    } else if (row.book_data) {
      const deletion = deletedAt.get(row.id);
      if (!deletion || row.updated_at > deletion) candidates.set(row.id, row.book_data);
    }
  });

  localBooks.forEach(book => {
    const deletion = deletedAt.get(book.id);
    if (deletion && deletion >= book.updatedAt) return;
    const cloud = candidates.get(book.id);
    if (!cloud || (book.updatedAt || '') > (cloud.updatedAt || '')) candidates.set(book.id, book);
  });

  for (const [id, book] of candidates) {
    const deletion = deletedAt.get(id);
    if (deletion && deletion >= (book.updatedAt || '')) candidates.delete(id);
  }

  return Array.from(candidates.values()).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
};
