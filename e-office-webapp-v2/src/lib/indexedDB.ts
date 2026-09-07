import { DynamicFormField } from '@/components/ui/CardUpload';

// Type for attachments with File objects (used during upload process)
export interface AttachmentData {
  mandatory: DynamicFormField[];
  optional: DynamicFormField[];
}

// Type for uploaded attachments with URLs (stored in IndexedDB)
export interface UploadedAttachment {
  url: string;
  filename: string;
  originalName: string;
  mimeType?: string;
  size?: number;
  label: string; // e.g., 'KTM', 'TRANSKIP'
}

export interface UploadedAttachmentData {
  mandatory: UploadedAttachment[];
  optional: UploadedAttachment[];
}

export const openDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('EOfficeDB', 2); // Increment version for schema change

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('attachments')) {
        db.createObjectStore('attachments');
      }
      if (!db.objectStoreNames.contains('uploaded_attachments')) {
        db.createObjectStore('uploaded_attachments');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Save draft attachments (File objects - use during editing)
export const saveAttachments = async (data: AttachmentData) => {
  console.log('indexedDB.ts: saving draft attachments', data);
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('attachments', 'readwrite');
    const store = transaction.objectStore('attachments');

    const request = store.put(data, 'draft_files');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Get draft attachments
export const getAttachments = async (): Promise<AttachmentData | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('attachments', 'readonly');
    const store = transaction.objectStore('attachments');
    const request = store.get('draft_files');

    request.onsuccess = () => {
      console.log('indexedDB.ts: retrieved draft attachments', request.result);
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Save uploaded attachments (URLs - for submission)
export const saveUploadedAttachments = async (data: UploadedAttachmentData) => {
  console.log('indexedDB.ts: saving uploaded attachments', data);
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('uploaded_attachments', 'readwrite');
    const store = transaction.objectStore('uploaded_attachments');

    const request = store.put(data, 'uploaded_files');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Get uploaded attachments
export const getUploadedAttachments = async (): Promise<UploadedAttachmentData | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('uploaded_attachments', 'readonly');
    const store = transaction.objectStore('uploaded_attachments');
    const request = store.get('uploaded_files');

    request.onsuccess = () => {
      console.log('indexedDB.ts: retrieved uploaded attachments', request.result);
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Clear uploaded attachments (after successful submission)
export const clearUploadedAttachments = async () => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('uploaded_attachments', 'readwrite');
    const store = transaction.objectStore('uploaded_attachments');

    const request = store.delete('uploaded_files');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Clear draft attachments (when starting new application)
export const clearAttachments = async () => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('attachments', 'readwrite');
    const store = transaction.objectStore('attachments');

    const request = store.delete('draft_files');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
