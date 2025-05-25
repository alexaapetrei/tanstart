/**
 * @file Manages IndexedDB operations for storing and retrieving photos.
 */

/**
 * Represents a photo stored in the database.
 */
export interface Photo {
  /**
   * Auto-generated unique identifier for the photo.
   */
  id: string;
  /**
   * Original file name of the photo.
   */
  name: string;
  /**
   * File MIME type of the photo (e.g., image/jpeg).
   */
  type: string;
  /**
   * Base64 encoded image data.
   */
  data: string;
}

/**
 * Name of the IndexedDB database.
 */
const DB_NAME = 'photoAppDB';

/**
 * Name of the object store for photos.
 */
const STORE_NAME = 'photos';

/**
 * Opens (or creates) the IndexedDB database.
 * @returns A Promise that resolves with the IDBDatabase instance.
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject('Error opening database: ' + (event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Adds a new photo to the database.
 * @param photoData - The photo data to add (excluding the id).
 * @returns A Promise that resolves with the id of the newly added photo.
 */
export async function addPhoto(photoData: Omit<Photo, 'id'>): Promise<string> {
  const db = await openDB();
  const id = crypto.randomUUID();
  const photo: Photo = { ...photoData, id };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(photo);

    request.onsuccess = () => {
      resolve(id);
    };

    request.onerror = (event) => {
      reject('Error adding photo: ' + (event.target as IDBRequest).error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Retrieves all photos from the database.
 * @returns A Promise that resolves with an array of Photo objects.
 */
export async function getAllPhotos(): Promise<Photo[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const photos: Photo[] = [];
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        photos.push(cursor.value);
        cursor.continue();
      } else {
        resolve(photos);
      }
    };

    request.onerror = (event) => {
      reject('Error retrieving photos: ' + (event.target as IDBRequest).error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}
