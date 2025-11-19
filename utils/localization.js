const fs = require('fs');
const path = require('path');

// For now, we'll hardcode Spanish. In the future, this could be dynamic.
const lang = 'es'; 
const translations = loadTranslations(lang);

/**
 * Loads the translation file for a given language.
 * @param {string} lang The language code (e.g., 'es', 'en').
 * @returns {object} The translations object.
 */
function loadTranslations(lang) {
    const filePath = path.join(__dirname, '..', 'locales', `${lang}.json`);
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    }
    // Fallback to English or a default if the file doesn't exist.
    // For now, we'll just return an empty object if Spanish isn't found.
    console.error(`Translation file for '${lang}' not found at ${filePath}`);
    return {};
}

/**
 * Gets a translation string by key.
 * @param {string} key The key for the translation string (e.g., 'commands.clima.description').
 * @param {object} [replacements={}] An object with values to replace in the string (e.g., { cityName: 'Montevideo' }).
 * @returns {string} The translated string.
 */
function t(key, replacements = {}) {
    const keys = key.split('.');
    let result = translations;
    for (const k of keys) {
        result = result[k];
        if (result === undefined) {
            // If the key doesn't exist, return the key itself as a fallback.
            return key;
        }
    }

    if (typeof result === 'string') {
        let finalString = result;
        for (const placeholder in replacements) {
            finalString = finalString.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
        }
        return finalString;
    }

    // If it's not a string (i.e., an object or array), return it directly.
    // The caller will be responsible for handling it.
    // Note: this means replacements will be ignored for non-string values.
    return result;
}

module.exports = { t };
