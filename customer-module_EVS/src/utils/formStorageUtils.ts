export interface StorageData<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

const EXPIRATION_TIME = 30 * 60 * 1000;

export const formStorageUtils = {
  save<T>(key: string, data: T, expirationMs: number = EXPIRATION_TIME): void {
    try {
      const storageData: StorageData<T> = {
        data,
        timestamp: Date.now(),
        expiresIn: expirationMs,
      };
      localStorage.setItem(key, JSON.stringify(storageData));
    } catch (err: unknown) {
      console.error(`Error saving to localStorage key "${key}":`, err);
    }
  },

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const storageData: StorageData<T> = JSON.parse(item) as StorageData<T>;
      const now = Date.now();
      const age = now - storageData.timestamp;

      if (age > storageData.expiresIn) {
        localStorage.removeItem(key);
        return null;
      }

      return storageData.data;
    } catch (err: unknown) {
      console.error(`Error reading from localStorage key "${key}":`, err);
      return null;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (err: unknown) {
      console.error(`Error removing localStorage key "${key}":`, err);
    }
  },

  getFormDataKey(formId: string): string {
    return `form_data_${formId}`;
  },

  getRecoveredDataKey(formId: string): string {
    return `form_recovered_${formId}`;
  },
};
