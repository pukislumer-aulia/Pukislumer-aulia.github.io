// assets/js/core/storage.js

import { CONFIG } from "./config.js";

function keyName(key) {
  return CONFIG.STORAGE_PREFIX + key;
}

export const Storage = {
  get(key) {
    try {
      const data = localStorage.getItem(keyName(key));
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("Storage.get error:", err);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(
        keyName(key),
        JSON.stringify(value)
      );
    } catch (err) {
      console.error("Storage.set error:", err);
    }
  },

  remove(key) {
    localStorage.removeItem(keyName(key));
  },

  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CONFIG.STORAGE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
};
