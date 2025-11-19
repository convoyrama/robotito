const axios = require('axios');
const { TRUCKERSMP_API_BASE_URL, openWeatherApiKey } = require('../config');

/**
 * Pre-configured Axios instance for making requests to the official TruckersMP API.
 * @see https://truckersmp.com/developers/api
 */
const truckersMP = axios.create({
    baseURL: TRUCKERSMP_API_BASE_URL,
    timeout: 5000, // 5 second timeout
});

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
