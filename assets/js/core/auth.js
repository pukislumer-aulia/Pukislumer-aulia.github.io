import { Storage } from "./storage.js";
import { CONFIG } from "./config.js";

const PIN_KEY = "admin_pin";
const SESSION_KEY = "session";

function isBase64(str) {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}

export const Auth = {
  /**
   * Login admin
   * - Support PIN lama (plain)
   * - Support PIN baru (base64)
   */
  login(pin) {
    if (!pin || pin.length < 4) return false;

    let savedPin = Storage.get(PIN_KEY);

    // ===== FIRST TIME SETUP =====
    if (!savedPin) {
      Storage.set(PIN_KEY, btoa(pin));
      this.startSession();
      return true;
    }

    // ===== MIGRATION SUPPORT =====
    // Jika PIN lama masih plain text
    if (!isBase64(savedPin)) {
      if (savedPin === pin) {
        // migrate ke base64
        Storage.set(PIN_KEY, btoa(pin));
        this.startSession();
        return true;
      }
      return false;
    }

    // ===== NORMAL VALIDATION =====
    if (atob(savedPin) === pin) {
      this.startSession();
      return true;
    }

    return false;
  },

  /**
   * Simpan session login
   */
  startSession() {
    Storage.set(SESSION_KEY, {
      loginAt: Date.now()
    });
  },

  /**
   * Cek status login + timeout
   */
  isLoggedIn() {
    const session = Storage.get(SESSION_KEY);
    if (!session || !session.loginAt) return false;

    const expired =
      Date.now() - session.loginAt > CONFIG.SESSION_TIMEOUT;

    if (expired) {
      this.logout();
      return false;
    }

    return true;
  },

  /**
   * Logout bersih
   */
  logout() {
    Storage.remove(SESSION_KEY);
  }
};
