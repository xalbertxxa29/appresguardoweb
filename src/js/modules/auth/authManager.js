import { auth } from '../../firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

/**
 * Auth Module
 * Gestiona el estado de autenticación y las operaciones de sesión.
 */

export const AuthManager = {
    /**
     * Inicia sesión de forma segura.
     */
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error("Error en login:", error.code);
            throw error;
        }
    },

    /**
     * Cierra la sesión.
     */
    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error en logout:", error);
            throw error;
        }
    },

    /**
     * Escucha cambios en el estado de autenticación.
     */
    watchAuthState(callback) {
        return onAuthStateChanged(auth, callback);
    }
};
