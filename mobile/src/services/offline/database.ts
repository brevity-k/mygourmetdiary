import * as SQLite from 'expo-sqlite';

const DB_NAME = 'mygourmatdiary_offline.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await runMigrations(db);
  }
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      authorId TEXT NOT NULL,
      binderId TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      rating INTEGER NOT NULL,
      freeText TEXT,
      visibility TEXT NOT NULL,
      tagIds TEXT NOT NULL DEFAULT '[]',
      extension TEXT NOT NULL DEFAULT '{}',
      venueId TEXT,
      experiencedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      noteId TEXT,
      publicUrl TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      localPath TEXT
    );

    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      placeId TEXT NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      lat REAL,
      lng REAL,
      phone TEXT,
      website TEXT,
      googleRating REAL,
      priceLevel INTEGER,
      types TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS binders (
      id TEXT PRIMARY KEY,
      ownerId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      visibility TEXT NOT NULL,
      coverUrl TEXT,
      isDefault INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_mutations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      payload TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notes_binderId ON notes(binderId);
    CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
    CREATE INDEX IF NOT EXISTS idx_photos_noteId ON photos(noteId);
  `);
}

export async function clearDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM notes;
    DELETE FROM photos;
    DELETE FROM venues;
    DELETE FROM binders;
    DELETE FROM pending_mutations;
    DELETE FROM sync_meta;
  `);
}

export async function getSyncMeta(key: string): Promise<string | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_meta WHERE key = ?',
    [key],
  );
  return result?.value ?? null;
}

export async function setSyncMeta(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
    [key, value],
  );
}

export async function getOfflineNotes(binderId?: string, type?: string) {
  const database = await getDatabase();
  let query = 'SELECT * FROM notes';
  const params: string[] = [];
  const conditions: string[] = [];

  if (binderId) {
    conditions.push('binderId = ?');
    params.push(binderId);
  }
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY createdAt DESC';

  const rows = await database.getAllAsync<any>(query, params);

  return rows.map((row) => ({
    ...row,
    tagIds: JSON.parse(row.tagIds),
    extension: JSON.parse(row.extension),
  }));
}

export async function getOfflineNoteById(id: string) {
  const database = await getDatabase();
  const note = await database.getFirstAsync<any>(
    'SELECT * FROM notes WHERE id = ?',
    [id],
  );
  if (!note) return null;

  const photos = await database.getAllAsync<any>(
    'SELECT * FROM photos WHERE noteId = ? ORDER BY sortOrder ASC',
    [id],
  );

  let venue = null;
  if (note.venueId) {
    venue = await database.getFirstAsync<any>(
      'SELECT * FROM venues WHERE id = ?',
      [note.venueId],
    );
    if (venue) {
      venue.types = JSON.parse(venue.types);
    }
  }

  return {
    ...note,
    tagIds: JSON.parse(note.tagIds),
    extension: JSON.parse(note.extension),
    photos,
    venue,
  };
}

export async function upsertNote(note: any): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO notes (id, authorId, binderId, type, title, rating, freeText, visibility, tagIds, extension, venueId, experiencedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      note.id,
      note.authorId,
      note.binderId,
      note.type,
      note.title,
      note.rating,
      note.freeText,
      note.visibility,
      JSON.stringify(note.tagIds || []),
      JSON.stringify(note.extension || {}),
      note.venueId,
      note.experiencedAt,
      note.createdAt,
      note.updatedAt,
    ],
  );
}

export async function upsertPhoto(photo: any): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO photos (id, noteId, publicUrl, mimeType, sortOrder, localPath)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      photo.id,
      photo.noteId,
      photo.publicUrl,
      photo.mimeType,
      photo.sortOrder || 0,
      photo.localPath || null,
    ],
  );
}

export async function upsertVenue(venue: any): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO venues (id, placeId, name, address, lat, lng, phone, website, googleRating, priceLevel, types)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      venue.id,
      venue.placeId,
      venue.name,
      venue.address,
      venue.lat,
      venue.lng,
      venue.phone,
      venue.website,
      venue.googleRating,
      venue.priceLevel,
      JSON.stringify(venue.types || []),
    ],
  );
}

export async function upsertBinder(binder: any): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO binders (id, ownerId, name, description, category, visibility, coverUrl, isDefault, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      binder.id,
      binder.ownerId,
      binder.name,
      binder.description,
      binder.category,
      binder.visibility,
      binder.coverUrl,
      binder.isDefault ? 1 : 0,
      binder.createdAt,
      binder.updatedAt,
    ],
  );
}

export async function addPendingMutation(
  type: string,
  endpoint: string,
  payload: any,
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO pending_mutations (type, endpoint, payload) VALUES (?, ?, ?)',
    [type, endpoint, JSON.stringify(payload)],
  );
}

export async function getPendingMutations() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM pending_mutations ORDER BY id ASC',
  );
  return rows.map((row) => ({
    ...row,
    payload: JSON.parse(row.payload),
  }));
}

export async function removePendingMutation(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM pending_mutations WHERE id = ?', [id]);
}
