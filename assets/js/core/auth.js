import { Storage } from "./storage.js";
import { CONFIG } from "./config.js";

const PIN_KEY = "admin_pin";
const SESSION_KEY = "session";

function normalizePin(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  // jika object / number / lainnya
  return String(value);
}

function isBase64(str) {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

export const Auth = {
  login(pin) {
    if (!pin || pin.length < 4) return false;

    let savedPin = normalizePin(Storage.get(PIN_KEY));

    // ===== FIRST LOGIN =====
    if (!savedPin) {
      Storage.set(PIN_KEY, btoa(pin));
      this.startSession();
      return true;
    }

    // ===== MIGRATION (PLAIN → BASE64) =====
    if (!isBase64(savedPin)) {
      if (savedPin === pin) {
        Storage.set(PIN_KEY, btoa(pin));
        this.startSession();
        return true;
      }
      return false;
    }

    // ===== NORMAL LOGIN =====
    if (atob(savedPin) === pin) {
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
