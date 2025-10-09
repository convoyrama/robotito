require('dotenv').config();

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
    SPAM_TEXTS: [
        'LAG\'S SPEED en la zona. Si vamos despacio no es por la carga, es que el ping no nos deja correr.',
        'LAG\'S SPEED recomienda 500 metros de distancia de seguridad. No por el freno, por el ping. ¿O por los dos? ¡Buena ruta!',
        'Ojo con el lag que andamos cerca... ¡Es broma! O no... ¡Un saludo de LAG\'S SPEED y buena ruta!',
        '¿Tu ping subió de repente? No, no fuimos nosotros... ¿O sí? ¡Saludos de LAG\'S SPEED!',
        'Prometemos no usar el lag como arma táctica... a menos que sea estrictamente necesario. ¡Saludos de LAG\'S SPEED!',
        'Nuestra especialidad no es carga pesada, es el ping pesado. Buena Ruta!',
    ],
    BASE_IMAGE_URL: 'https://convoyrama.github.io/robotito/img/',
    POSITIVE_STATES: ['admirando.png', 'alegre.png', 'enlaluna.png', 'fiesta.png', 'sorprendido.png', 'volando.png'],
    NEGATIVE_STATES: ['desesperado.png', 'durmiendo.png', 'enojado.png', 'impaciente.png', 'pensando.png'],
    FAREWELL_MESSAGE_OWN: "LAG\'S SPEED les agradece sinceramente su participación. Ha sido una ruta excelente gracias a la compañía de cada uno de ustedes, y un placer compartir este gran momento. ¡Esperamos seguir contando con su presencia en futuras aventuras! Saludos y muy buena ruta a todos.",
    FAREWELL_MESSAGE_EXTERNAL: "LAG\'S SPEED agradece la invitación a este convoy. Ha sido un placer compartir la ruta con todos. ¡Esperamos coincidir de nuevo en el camino! Saludos y muy buena ruta.",

    // API and external service constants
    TRUCKERSMP_API_BASE_URL: 'https://api.truckersmp.com/v2',

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
    }
};
