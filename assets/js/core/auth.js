// assets/js/core/auth.js

import { Storage } from "./storage.js";
import { CONFIG } from "./config.js";

const PIN_KEY = "admin_pin";
const SESSION_KEY = "session";

function normalize(value) {
  if (value === null || value === undefined) return null;
  return String(value).replace(/^"+|"+$/g, "").trim();
}

function encode(pin) {
  return btoa(pin);
}

function decode(pin) {
  try {
    return atob(pin);
  } catch {
    return null;
  }
}

export const Auth = {
  login(inputPin) {
    const pin = normalize(inputPin);
    if (!pin || pin.length < 4) return false;

    let saved = normalize(Storage.get(PIN_KEY));

    // === FIRST LOGIN ===
    if (!saved) {
      Storage.set(PIN_KEY, encode(pin));
      this.startSession();
      return true;
    }

    // === TRY BASE64 ===
    const decoded = decode(saved);
    if (decoded && decoded === pin) {
      this.startSession();
      return true;
    }

    // === TRY LEGACY PLAIN ===
    if (saved === pin) {
      Storage.set(PIN_KEY, encode(pin)); // migrate
      this.startSession();
      return true;
    }

    return false;
  },

  startSession() {
    Storage.set(SESSION_KEY, {
      loginAt: Date.now()
    });
  },

  isLoggedIn() {
    const session = Storage.get(SESSION_KEY);
    if (!session || !session.loginAt) return false;

    if (Date.now() - session.loginAt > CONFIG.SESSION_TIMEOUT) {
      this.logout();
      return false;
    }

    return true;
  },

  logout() {
    Storage.remove(SESSION_KEY);
  }
};
