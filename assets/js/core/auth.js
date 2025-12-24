// assets/js/core/auth.js

import { Storage } from "./storage.js";
import { CONFIG } from "./config.js";

export const Auth = {
  /**
   * Login admin
   * - Jika PIN belum ada → buat PIN pertama
   * - Jika sudah ada → validasi
   */
  login(pin) {
    if (!pin || pin.length < 4) return false;

    const savedPin = Storage.get("admin_pin");

    // First time setup
    if (!savedPin) {
      Storage.set("admin_pin", btoa(pin));
      this.startSession();
      return true;
    }

    // Validate
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
    Storage.set("session", {
      loginAt: Date.now()
    });
  },

  /**
   * Cek status login + timeout
   */
  isLoggedIn() {
    const session = Storage.get("session");
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
    Storage.remove("session");
  }
};
