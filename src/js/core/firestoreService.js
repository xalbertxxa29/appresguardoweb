import { db } from '../firebase.js';
import { collection, doc, getDoc, getDocs, orderBy, limit, query, getCountFromServer } from "firebase/firestore";
import { Security } from './security.js';

/**
 * Firestore Service Layer
 * Centraliza el acceso a datos y aplica capas de seguridad y sanitización.
 */

export const FirestoreService = {
    /**
     * Obtiene el conteo de documentos de una colección de manera segura.
     * @param {string} collectionName - Nombre de la colección.
     */
    async getCount(collectionName) {
        try {
            const snap = await getCountFromServer(collection(db, collectionName));
            return snap.data().count;
        } catch (error) {
            console.error(`Error en getCount(${collectionName}):`, error);
            throw error;
        }
    },

    /**
     * Obtiene documentos de una colección con filtros y ordenamiento.
     * @param {string} collectionName - Nombre de la colección.
     * @param {Object} options - Opciones de filtrado (limit, orderBy).
     */
    async getCollection(collectionName, options = {}) {
        const { limitCount = 50, orderByField = 'timestamp', orderDir = 'desc' } = options;

        try {
            const q = query(
                collection(db, collectionName),
                orderBy(orderByField, orderDir),
                limit(limitCount)
            );
            const snapshot = await getDocs(q);
            // Sanitización de datos al vuelo
            return snapshot.docs.map(doc => {
                const data = doc.data();
                const sanitizedData = {};
                for (let key in data) {
                    sanitizedData[key] = typeof data[key] === 'string' ? Security.sanitize(data[key]) : data[key];
                }
                return { id: doc.id, ...sanitizedData };
            });
        } catch (error) {
            console.error(`Error en getCollection(${collectionName}):`, error);
            throw error;
        }
    },

    /**
     * Obtiene un documento específico por ID.
     */
    async getDocument(collectionName, docId) {
        try {
            const docSnap = await getDoc(doc(db, collectionName, docId));
            if (docSnap.exists()) {
                const data = docSnap.data();
                const sanitizedData = {};
                for (let key in data) {
                    sanitizedData[key] = typeof data[key] === 'string' ? Security.sanitize(data[key]) : data[key];
                }
                return sanitizedData;
            }
            return null;
        } catch (error) {
            console.error(`Error en getDocument(${collectionName}, ${docId}):`, error);
            throw error;
        }
    }
};
