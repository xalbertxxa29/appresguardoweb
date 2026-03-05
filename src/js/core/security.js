/**
 * Core Security Module
 * Proporciona funciones de sanitización y validación para prevenir XSS y asegurar la integridad de los datos.
 */

export const Security = {
    /**
     * Sanitiza una cadena de texto para prevenir XSS.
     * @param {string} str - El texto a sanitizar.
     * @returns {string} - El texto sanitizado.
     */
    sanitize(str) {
        if (typeof str !== 'string') return str;
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    /**
     * Valida si un objeto cumple con un esquema básico.
     * @param {Object} data - Los datos a validar.
     * @param {Array<string>} requiredFields - Lista de campos obligatorios.
     * @returns {boolean} - True si es válido.
     */
    validateSchema(data, requiredFields) {
        if (!data || typeof data !== 'object') return false;
        return requiredFields.every(field => field in data && data[field] !== undefined && data[field] !== null);
    },

    /**
     * Escapa caracteres especiales de HTML.
     * @param {string} unsafe - Texto potencialmente peligroso.
     * @returns {string} - Texto escapado.
     */
    escapeHTML(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};
