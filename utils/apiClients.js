const axios = require('axios');
const { TRUCKERSMP_API_BASE_URL, openWeatherApiKey } = require('../config');

// --- Caching & Rate Limiting System for TruckersMP ---

const requestQueue = [];
let isProcessingQueue = false;
const cache = new Map();

// Cache TTL configuration (in milliseconds)
const CACHE_TTL = {
    '/servers': 60 * 1000, // 1 minute
    'default': 5 * 60 * 1000 // 5 minutes for players, VTCs, etc.
};

const getTTL = (url) => {
    if (url === '/servers') return CACHE_TTL['/servers'];
    return CACHE_TTL['default'];
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const processQueue = async () => {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (requestQueue.length > 0) {
        const { url, config, resolve, reject } = requestQueue.shift();

        try {
            // Check cache one last time before making the request (in case concurrent requests populated it)
            const cachedItem = cache.get(url);
            if (cachedItem && Date.now() < cachedItem.expires) {
                resolve(cachedItem.data);
            } else {
                console.log(`[API] Making fresh request to: ${url}`);
                const response = await axios.get(TRUCKERSMP_API_BASE_URL + url, {
                    ...config,
                    timeout: 5000,
                    headers: { 'User-Agent': 'Robotito-Discord-Bot/1.0 (+https://github.com/convoyrama/robotito)' }
                });

                // Save to cache
                cache.set(url, {
                    data: response,
                    expires: Date.now() + getTTL(url)
                });

                resolve(response);
                // Wait 2 seconds before the next request to be safe
                await delay(5000); 
            }
        } catch (error) {
            reject(error);
            // Even on error, wait a bit to avoid hammering
            await delay(5000); 
        }
    }

    isProcessingQueue = false;
};

/**
 * Custom wrapper for TruckersMP API requests with Caching and Rate Limiting.
 * Replaces the direct Axios instance.
 */
const truckersMP = {
    get: (url, config = {}) => {
        return new Promise((resolve, reject) => {
            // Check cache immediately
            const cachedItem = cache.get(url);
            if (cachedItem && Date.now() < cachedItem.expires) {
                // console.log(`[Cache] Serving from cache: ${url}`);
                return resolve(cachedItem.data);
            }

            // If not in cache, add to queue
            requestQueue.push({ url, config, resolve, reject });
            processQueue();
        });
    }
};

/**
 * Pre-configured Axios instance for making requests to the OpenWeatherMap API.
 * It includes an interceptor to automatically add the API key, language, and units to every request.
 * @see https://openweathermap.org/api
 */
const openWeather = axios.create({
    baseURL: 'https://api.openweathermap.org/data/2.5',
    timeout: 5000,
});

// Add the API key to every OpenWeatherMap request
openWeather.interceptors.request.use(config => {
    config.params = config.params || {};
    config.params.appid = openWeatherApiKey;
    config.params.units = 'metric';
    config.params.lang = 'es';
    return config;
});

/**
 * Pre-configured Axios instance for making requests to the JokeAPI.
 * @see https://sv443.net/jokeapi/v2/
 */
const jokeApi = axios.create({
    baseURL: 'https://v2.jokeapi.dev',
    timeout: 5000,
});

/**
 * Fetches data from a generic URL.
 * Useful for downloading images or other content.
 * @param {string} url The URL to fetch.
 * @param {import('axios').AxiosRequestConfig} config The axios config.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const fetchUrl = (url, config = {}) => {
    return axios.get(url, config);
};

module.exports = {
    truckersMP,
    openWeather,
    jokeApi,
    fetchUrl,
};
