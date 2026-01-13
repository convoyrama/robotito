require('dotenv').config();
const { t } = require('./utils/localization');

// Note: The fallback to config.json has been removed for stricter debugging.
// The bot will now ONLY use variables from the .env file.

module.exports = {
    // Secrets from .env
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    hmacSecret: process.env.HMAC_SECRET_KEY,
    openWeatherApiKey: process.env.OPENWEATHER_API_KEY,

    // Time constants
    GAME_TIME_ANCHOR_UTC_MINUTES: 20 * 60 + 40,
    TIME_SCALE: 6,

    // Bot constants
    BASE_IMAGE_URL: 'https://convoyrama.github.io/robotito/img/',
    POSITIVE_STATES: ['admirando.png', 'alegre.png', 'enlaluna.png', 'fiesta.png', 'sorprendido.png', 'volando.png'],
    NEGATIVE_STATES: ['desesperado.png', 'durmiendo.png', 'enojado.png', 'impaciente.png', 'pensando.png'],

    // VTC Aliases
    vtcAliases: {
        'ls': 78865,
        'tcs': 76978,
        'ln': 79357,
        'nova': 34966,
        'andes': 55250,
        'rutiando': 62448,
        'cn': 81233,
        'lc': 63758,
        'titanes': 76975
    },

    // Embed Colors
    colors: {
        primary: '#5AA519',
        success: '#5AA519',
        error: '#E74C3C',
        warning: '#FFA500',
        info: '#00A5A5'
    },

    // License reader ranks
    ranks: [
        { id: 1, image: 'https://convoyrama.github.io/license_generator/rank/1.png' },
        { id: 2, image: 'https://convoyrama.github.io/license_generator/rank/2.png' },
        { id: 3, image: 'https://convoyrama.github.io/license_generator/rank/3.png' },
        { id: 4, image: 'https://convoyrama.github.io/license_generator/rank/4.png' },
        { id: 5, image: 'https://convoyrama.github.io/license_generator/rank/5.png' },
        { id: 6, image: 'https://convoyrama.github.io/license_generator/rank/6.png' },
        { id: 7, image: 'https://convoyrama.github.io/license_generator/rank/7.png' },
        { id: 8, image: 'https://convoyrama.github.io/license_generator/rank/8.png' },
        { id: 9, image: 'https://convoyrama.github.io/license_generator/rank/9.png' },
        { id: 10, image: 'https://convoyrama.github.io/license_generator/rank/10.png' },
        { id: 11, image: 'https://convoyrama.github.io/license_generator/rank/11.png' },
        { id: 12, image: 'https://convoyrama.github.io/license_generator/rank/12.png' }
    ],

    // Useful Links for /link command
    SPAM_TEXTS: t('commands.spam.texts'),
    FAREWELL_MESSAGE_OWN: t('commands.despedida.own_message'),
    FAREWELL_MESSAGE_EXTERNAL: t('commands.despedida.external_message'),
    usefulLinks: t('commands.link.useful_links'),

    // Game Integration Settings
    TRUCKGIOH_SERVER_URL: process.env.TRUCKGIOH_SERVER_URL || 'http://localhost:3001',
    ROBOTITO_RESULTS_URL: process.env.ROBOTITO_RESULTS_URL || 'http://localhost:3000/game-result'
};
