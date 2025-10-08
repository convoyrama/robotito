require('dotenv').config();

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const axios = require('axios');
const crypto = require('crypto');
const http = require('http');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildScheduledEvents,
    ],
});

// --- CONFIGURACIÓN PERSONALIZABLE ---
const HMAC_SECRET_KEY = process.env.HMAC_SECRET_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

const GAME_TIME_ANCHOR_UTC_MINUTES = 20 * 60 + 40;
const TIME_SCALE = 6;

const LATAM_TIMEZONES = [
    { name: 'Argentina (Buenos Aires)', zone: 'America/Argentina/Buenos_Aires' },
    { name: 'México (Ciudad de México)', zone: 'America/Mexico_City' },
    { name: 'Chile (Santiago)', zone: 'America/Santiago' },
    { name: 'Colombia (Bogotá)', zone: 'America/Bogota' },
    { name: 'Perú (Lima)', zone: 'America/Lima' },
    { name: 'Venezuela (Caracas)', zone: 'America/Caracas' },
    { name: 'Panamá (Ciudad de Panamá)', zone: 'America/Panama' },
    { name: 'Costa Rica (San José)', zone: 'America/Costa_Rica' },
    { name: 'Paraguay (Asunción)', zone: 'America/Asuncion' },
    { name: 'Ecuador (Guayaquil)', zone: 'America/Guayaquil' },
    { name: 'Uruguay (Montevideo)', zone: 'America/Montevideo' },
    { name: 'Brasil (Brasilia)', zone: 'America/Sao_Paulo' },
    { name: 'España (Madrid)', zone: 'Europe/Madrid' },
    { name: 'Portugal (Lisboa)', zone: 'Europe/Lisbon' },
];



const SPAM_TEXTS = [
    'LAG\'S SPEED en la zona. Si vamos despacio no es por la carga, es que el ping no nos deja correr.',
    'LAG\'S SPEED recomienda 500 metros de distancia de seguridad. No por el freno, por el ping. ¿O por los dos? ¡Buena ruta!',
    'Ojo con el lag que andamos cerca... ¡Es broma! O no... ¡Un saludo de LAG\'S SPEED y buena ruta!',
    '¿Tu ping subió de repente? No, no fuimos nosotros... ¿O sí? ¡Saludos de LAG\'S SPEED!',
    'Prometemos no usar el lag como arma táctica... a menos que sea estrictamente necesario. ¡Saludos de LAG\'S SPEED!',
    'Nuestra especialidad no es carga pesada, es el ping pesado. Buena Ruta!',
];

const BASE_IMAGE_URL = 'https://convoyrama.github.io/robotito/img/';
const POSITIVE_STATES = ['admirando.png', 'alegre.png', 'enlaluna.png', 'fiesta.png', 'sorprendido.png', 'volando.png'];
const NEGATIVE_STATES = ['desesperado.png', 'durmiendo.png', 'enojado.png', 'impaciente.png', 'pensando.png'];

const FAREWELL_MESSAGE_OWN = "LAG\'S SPEED les agradece sinceramente su participación. Ha sido una ruta excelente gracias a la compañía de cada uno de ustedes, y un placer compartir este gran momento. ¡Esperamos seguir contando con su presencia en futuras aventuras! Saludos y muy buena ruta a todos.";
const FAREWELL_MESSAGE_EXTERNAL = "LAG\'S SPEED agradece la invitación a este convoy. Ha sido un placer compartir la ruta con todos. ¡Esperamos coincidir de nuevo en el camino! Saludos y muy buena ruta.";

const TRUCKERSMP_API_BASE_URL = 'https://api.truckersmp.com/v2';

const vtcAliases = {
    'ls': 78865,
    'tcs': 76978,
    'ln': 79357,
    'nova': 34966,
    'andes': 55250,
    'rutiando': 62448,
    'cn': 81233,
    'lc': 63758,
    'titanes': 76975
};

// --- FIN CONFIGURACIÓN PERSONALIZABLE ---

client.once('clientReady', () => {
    console.log('Evento clientReady disparado.');
    console.log(`¡Bot Robotito conectado como ${client.user.tag}!`);
    client.user.setActivity('Convoyrama', { type: 3 });
});

function parseInputTime(timeString, referenceDate) {
    let parsedTime = null;

    const timeMatch24 = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch24) {
        parsedTime = referenceDate.set({ hour: parseInt(timeMatch24[1]), minute: parseInt(timeMatch24[2]), second: 0, millisecond: 0 });
        return parsedTime && parsedTime.isValid ? parsedTime : null;
    }

    const timeMatchAMPM = timeString.match(/^(\d{1,2})(am|pm)$/i);
    if (timeMatchAMPM) {
        let hour = parseInt(timeMatchAMPM[1]);
        const ampm = timeMatchAMPM[2].toLowerCase();
        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;
        parsedTime = referenceDate.set({ hour: hour, minute: 0, second: 0, millisecond: 0 });
        return parsedTime && parsedTime.isValid ? parsedTime : null;
    }

    const timeMatchHHMM = timeString.match(/^(\d{2})(\d{2})$/);
    if (timeMatchHHMM) {
        parsedTime = referenceDate.set({ hour: parseInt(timeMatchHHMM[1]), minute: parseInt(timeMatchHHMM[2]), second: 0, millisecond: 0 });
        return parsedTime && parsedTime.isValid ? parsedTime : null;
    }

    return null;
}

function getGameTime(realDateTime) {
    const utcDateTime = realDateTime.toUTC();
    const totalMinutesUTC = utcDateTime.hour * 60 + utcDateTime.minute;
    let realMinutesSinceAnchor = totalMinutesUTC - GAME_TIME_ANCHOR_UTC_MINUTES;
    if (realMinutesSinceAnchor < 0) { realMinutesSinceAnchor += 24 * 60; }
    let gameMinutes = realMinutesSinceAnchor * TIME_SCALE;
    gameMinutes = gameMinutes % 1440;
    const gameHours = Math.floor(gameMinutes / 60);
    const remainingMinutes = Math.floor(gameMinutes % 60);
    const gameSeconds = Math.floor((utcDateTime.second * TIME_SCALE) % 60);
    return utcDateTime.set({ hour: gameHours, minute: remainingMinutes, second: gameSeconds, millisecond: 0 });
}

function getDetailedDayNightIcon(hours) {
    if (hours >= 6 && hours < 8) return '🌅';
    if (hours >= 8 && hours < 19) return '☀️';
    if (hours >= 19 && hours < 21) return '🌇';
    return '🌙';
}

async function getUpcomingEvents(guild, daysLimit = 0) {
    if (!guild) return [];

    const scheduledEvents = await guild.scheduledEvents.fetch();
    const now = Date.now();
    let timeLimit = 0;

    if (daysLimit > 0) {
        timeLimit = now + daysLimit * 24 * 60 * 60 * 1000;
    }

    const upcomingEvents = scheduledEvents.filter(event => {
        const startTime = event.scheduledStartTimestamp;
        if (daysLimit > 0) {
            return startTime > now && startTime < timeLimit;
        }
        return startTime > now;
    }).sort((a, b) => a.scheduledStartTimestamp - b.scheduledStartTimestamp);

    return upcomingEvents;
}

async function handlePlayerInfo(interaction, userId, profileUrl) {
    try {
        const response = await axios.get(`${TRUCKERSMP_API_BASE_URL}/player/${userId}`);
        const playerData = response.data.response;
        if (!playerData) {
            await interaction.editReply('No se encontró información para ese usuario de TruckersMP.');
            return;
        }
        const embed = new EmbedBuilder()
            .setColor(0x0077B6)
            .setTitle(`👤 Perfil de TruckersMP: ${playerData.name}`)
            .setURL(profileUrl)
            .setThumbnail(playerData.avatar || null)
            .addFields(
                { name: 'ID de TruckersMP', value: `${playerData.id}`, inline: true },
                { name: 'Registrado', value: playerData.joinDate ? DateTime.fromISO(playerData.joinDate.replace(' ', 'T')).toFormat('dd/MM/yyyy') : 'N/A', inline: true },
                { name: 'Última Conexión', value: playerData.lastGameTime ? DateTime.fromISO(playerData.lastGameTime.replace(' ', 'T')).toRelative() : 'N/A', inline: true },
                { name: 'Baneado', value: playerData.banned ? `Sí, hasta ${DateTime.fromISO(playerData.bannedUntil.replace(' ', 'T')).toFormat('dd/MM/yyyy HH:mm')}` : 'No', inline: true },
                { name: 'Número de Baneos', value: `${playerData.bansCount}`, inline: true },
                { name: 'En VTC', value: playerData.vtc && playerData.vtc.id ? `[${playerData.vtc.name} ${playerData.vtc.tag ? `[${playerData.vtc.tag}]` : ''}](https://truckersmp.com/vtc/${playerData.vtc.id})` : 'No', inline: true },
                { name: 'Grupo', value: playerData.groupName || 'N/A', inline: true },
                { name: 'Patreon', value: playerData.patreon.isPatron ? 'Sí' : 'No', inline: true },
                { name: 'Staff', value: playerData.permissions.isStaff ? 'Sí' : 'No', inline: true },
                { name: 'Game Admin', value: playerData.permissions.isGameAdmin ? 'Sí' : 'No', inline: true },
                { name: 'Management', value: playerData.permissions.isManagement ? 'Sí' : 'No', inline: true }
            )
            .setFooter({ text: 'Datos obtenidos de la API de TruckersMP.' });
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error al obtener datos de TruckersMP API:', error);
        if (error.response) {
            await interaction.editReply(`Error al consultar la API de TruckersMP: ${error.response.status} ${error.response.statusText}`);
        } else {
            await interaction.editReply('Lo siento, hubo un error al consultar la API de TruckersMP.');
        }
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    console.log(`[${new Date().toISOString()}] Interaction received: ${interaction.commandName}`);

    const { commandName, user, guild } = interaction;

    console.log(`[${new Date().toISOString()}] Comando '/${commandName}' ejecutado por '${user.tag}' en el servidor '${guild.name}'`);

    try {
        switch (commandName) {
            case 'ping':
                {
                    await interaction.reply({ content: 'Pong!', flags: 64 });
                    break;
                }
            case 'ayuda':
                {
                    const embed = new EmbedBuilder()
                        .setColor(0x3498DB)
                        .setTitle('🤖 Comandos de Robotito')
                        .setDescription('Aquí tienes una lista de lo que puedo hacer:')
                        .addFields(
                            { name: '/ping', value: 'Comprueba si el bot está respondiendo.' },
                            { name: '/ayuda', value: 'Muestra esta lista de comandos.' },
                            { name: '/tira', value: 'Muestra una tira cómica aleatoria de ECOL.' },
                            { name: '/tirainfo', value: 'Muestra información sobre las tiras cómicas de ECOL.' },
                            { name: '/tito', value: 'Tito te cuenta un dato inútil y absurdo.' },
                            { name: '/estado', value: 'Muestra el estado de ánimo diario de Robotito.' },
                            { name: '/logo', value: 'Muestra el logo oficial de la comunidad.' },
                            { name: '/link', value: 'Muestra enlaces útiles de Convoyrama y el Discord.' },
                            { name: '/ingame [tiempo] [ciudad]', value: 'Calcula la hora in-game para una hora y zona horaria específicas.' },
                            { name: '/hora [tiempo] [ciudad]', value: 'Muestra la hora actual en varias zonas horarias o calcula esas horas.' },
                            { name: '/despedida [tipo]', value: 'Envía un mensaje de despedida de convoy (propio o ajeno).' },
                            { name: '/spam', value: 'Envía un mensaje aleatorio de la lista de textos predefinidos.' },
                            { name: '/evento', value: 'Muestra el próximo evento programado en este servidor.' },
                            { name: '/evento7', value: 'Muestra los eventos programados para los próximos 7 días.' },
                            { name: '/vtc', value: 'Muestra la lista de VTCs de la comunidad.' },
                            { name: '/servers', value: 'Muestra el estado de los servidores de TruckersMP.' },
                            { name: '/info [enlace_o_alias]', value: 'Muestra información de un usuario o VTC de TruckersMP.' },
                            { name: '/verificar', value: 'Genera un código para verificar tu cuenta y, opcionalmente, tu VTC.' }
                        )
                        .setFooter({ text: '¡Usa los comandos con el prefijo /' });
                    await interaction.reply({ embeds: [embed], flags: 64 });
                    break;
                }
            case 'clima':
                {
                    await interaction.deferReply();
                    const ciudad = interaction.options.getString('ciudad');
                    const apiKey = process.env.OPENWEATHER_API_KEY;
                    if (!apiKey) {
                        await interaction.editReply('La clave de la API de OpenWeatherMap no está configurada.');
                        return;
                    }
                    const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}&units=metric&lang=es`;

                    try {
                        const response = await axios.get(url);
                        const weather = response.data;

                        const embed = new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle(`Clima en ${weather.name}`)
                            .setThumbnail(`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`)
                            .addFields(
                                { name: 'Temperatura', value: `${weather.main.temp}°C`, inline: true },
                                { name: 'Sensación térmica', value: `${weather.main.feels_like}°C`, inline: true },
                                { name: 'Humedad', value: `${weather.main.humidity}%`, inline: true },
                                { name: 'Viento', value: `${weather.wind.speed} m/s`, inline: true },
                                { name: 'Descripción', value: weather.weather[0].description, inline: true },
                            )
                            .setFooter({ text: 'Datos proporcionados por OpenWeatherMap' });

                        await interaction.editReply({ embeds: [embed] });

                    } catch (error) {
                        if (error.response && error.response.status === 404) {
                            await interaction.editReply(`No se pudo encontrar la ciudad "${ciudad}".`);
                        } else {
                            console.error('Error al obtener datos de OpenWeatherMap:', error);
                            await interaction.editReply('Hubo un error al consultar el clima.');
                        }
                    }
                    break;
                }
                    case 'tira':
                        {
                            try {
                                await interaction.deferReply();
                                const randomNumber = Math.floor(Math.random() * 400) + 1;
                                const formattedNumber = String(randomNumber).padStart(3, '0');
                                const randomImage = `tiraecol-${formattedNumber}.png`;
                                const imageUrl = `https://convoyrama.github.io/robotito/img/tira-ecol-master/tira/${randomImage}`;
                                const embed = new EmbedBuilder()
                                    .setColor(0x5865F2)
                                    .setTitle('Tira Cómica de ECOL')
                                    .setURL('https://biloynano.com/')
                                    .setImage(imageUrl)
                                    .setFooter({ text: 'Tira por Javier Malonda (Bilo y Nano) | Usa /tirainfo para más detalles.' });
                                await interaction.editReply({ embeds: [embed] });
                            } catch (error) {
                                console.error(`[${new Date().toISOString()}] Error en el comando /tira:`, error);
                                if (interaction.deferred || interaction.replied) {
                                    await interaction.followUp({ content: 'Hubo un error al mostrar la tira cómica.', flags: 64 });
                                } else {
                                    await interaction.reply({ content: 'Hubo un error al mostrar la tira cómica.', flags: 64 });
                                }
                            }
                            break;
                        }            case 'tirainfo':
                {
                    const readmeDescription = 'Esta es una recopilación de la *Tira Ecol* publicada entre diciembre de 2001 y el 18 de octubre de 2010 (tiraecol.net).';
                    const interviewSnippet = `1.  *¿Quien eres tu? (informacion personal que quieras dar)*

    Nací hace unos 28 años en Valencia, y desde entonces vengo haciendo cosas sin
    parar. Por lo visto soy una persona inquieta. Demasiado. Fui al colegio hasta
    que hubo que salir de allí y luego, por algún extraño motivo que aún estoy
    ponderando, acabé estudiando ingeniería industrial. Cuando digo que lo mejor
    que me sucedió allí fue escribir y dibujar en la revista de la escuela, te
    puedes hacer una idea de lo que fue mi paso por aquella santa institución.`;
                    const embed = new EmbedBuilder()
                        .setColor(0x4E5D94)
                        .setTitle('Información sobre Tira Ecol')
                        .setURL('https://biloynano.com/')
                        .setDescription(readmeDescription)
                        .addFields(
                            { name: 'Autor', value: 'Javier Malonda' },
                            { name: 'Licencia', value: '[Creative Commons BY-NC-ND 4.0](http://creativecommons.org/licenses/by-nc-nd/4.0/)' },
                            { name: 'Extracto de la Entrevista (2004)', value: interviewSnippet + '...' },
                            { name: 'Leer más', value: '[Entrevista Completa](https://convoyrama.github.io/robotito/img/tira-ecol-master/Entrevista-Javier-Malonda.org) | [Sitio Web](https://biloynano.com/)' }
                        )
                        .setFooter({ text: 'Todo el crédito para Javier Malonda.' });
                    await interaction.reply({ embeds: [embed] });
                    break;
                }
            case 'verificar':
                {
                    await interaction.deferReply({ flags: 64 });
                    const userUrl = interaction.options.getString('url');
                    const vtcUrl = interaction.options.getString('url_vtc');
                    const userUrlMatch = userUrl.match(/truckersmp\.com\/(?:user|profile)\/(\d+)/);
                    if (!userUrlMatch || !userUrlMatch[1]) {
                        await interaction.editReply({ content: 'La URL de perfil de usuario proporcionada no es válida. Asegúrate de que sea la URL completa.', flags: 64 });
                        return;
                    }
                    const userId = userUrlMatch[1];
                    try {
                        const playerResponse = await axios.get(`${TRUCKERSMP_API_BASE_URL}/player/${userId}`);
                        const playerData = playerResponse.data.response;
                        if (!playerData || !playerData.joinDate) {
                            await interaction.editReply('No se pudo encontrar la fecha de registro para este usuario. El perfil podría ser privado o el ID incorrecto.');
                            return;
                        }
                        let payload = `${userId}|${playerData.joinDate}|${playerData.name}`;
                        let vtcDataForEmbed = null;
                        if (vtcUrl) {
                            const vtcUrlMatch = vtcUrl.match(/truckersmp\.com\/vtc\/(\d+)/);
                            if (vtcUrlMatch && vtcUrlMatch[1]) {
                                const vtcId = vtcUrlMatch[1];
                                try {
                                    const vtcResponse = await axios.get(`${TRUCKERSMP_API_BASE_URL}/vtc/${vtcId}`);
                                    const vtcData = vtcResponse.data.response;
                                    if (vtcData) {
                                        payload += `|${vtcData.id}|${vtcData.owner_id}`;
                                        vtcDataForEmbed = vtcData;
                                    }
                                } catch (vtcError) {
                                    console.error(`[${new Date().toISOString()}] Error fetching VTC data for VTC ID ${vtcId}:`, vtcError.message);
                                }
                            }
                        }

                        const signature = crypto.createHmac('sha256', HMAC_SECRET_KEY).update(payload).digest('hex');
                        const verificationCode = `${Buffer.from(payload).toString('base64')}.${signature}`;
                        const embed = new EmbedBuilder()
                            .setColor(0x2ECC71)
                            .setTitle('✅ Código de Verificación Generado')
                            .setDescription('¡Tu código está listo! Cópialo y pégalo en el campo correspondiente del generador de licencias.')
                            .addFields(
                                { name: 'Tu Código de Verificación', value: '```\n' + verificationCode + '\n```' },
                                { name: '¿Dónde usar este código?', value: '[Haz clic aquí para ir al Generador de ID](https://convoyrama.github.io/id.html)' }
                            )
                            .setFooter({ text: 'Este código vincula tu licencia a tu fecha de registro real.' });
                        if (vtcDataForEmbed) {
                            embed.addFields({ name: 'VTC Procesada', value: `${vtcDataForEmbed.name}`, inline: true });
                        }
                        await interaction.editReply({ embeds: [embed] });
                    } catch (error) {
                        console.error('Error durante la verificación:', error);
                        await interaction.editReply('Hubo un error al contactar la API de TruckersMP. Inténtalo de nuevo más tarde.');
                    }
                    break;
                }
            case 'tito':
                {
                    try {
                        await interaction.deferReply();
                        const response = await axios.get('https://v2.jokeapi.dev/joke/Any?lang=es&blacklistFlags=nsfw,religious,political,racist,sexist,explicit');
                        const jokeData = response.data;
                        let jokeText;
                        if (jokeData.type === 'single') {
                            jokeText = jokeData.joke;
                        } else {
                            jokeText = `${jokeData.setup}
*${jokeData.delivery}*`;
                        }
                        const embed = new EmbedBuilder().setColor(0x9B59B6).setTitle('Tito cuenta un chiste...').setDescription(jokeText);
                        await interaction.editReply({ embeds: [embed] });
                    } catch (error) {
                        console.error('Error al obtener chiste:', error);
                        await interaction.editReply('Lo siento, Tito no está inspirado ahora mismo. Inténtalo de nuevo más tarde.');
                    }
                    break;
                }
            case 'estado':
                {
                    await interaction.deferReply();
                    const now = DateTime.local();
                    let imageUrl, embedTitle, embedDescription = null, embedColor = 0x2ECC71;
                    if (now.month === 2 && now.day === 14) {
                        imageUrl = `${BASE_IMAGE_URL}event/enamorado.png`;
                        embedTitle = '¡Feliz Día de San Valentín!';
                        embedDescription = 'Que su ruta esté llena de amor y amistad. ¡Robotito les desea un feliz San Valentín a toda la comunidad!';
                        embedColor = 0xE91E63;
                    } else if (now.month === 10 && now.day === 31) {
                        imageUrl = `${BASE_IMAGE_URL}event/halloween.png`;
                        embedTitle = '¡Feliz Halloween!';
                        embedDescription = '¡Feliz Halloween! Que los únicos sustos de hoy sean en las películas y no en la carretera. ¡Cuidado ahí fuera!';
                        embedColor = 0xE67E22;
                    } else if (now.month === 12 && now.day === 25) {
                        imageUrl = `${BASE_IMAGE_URL}event/navidad.png`;
                        embedTitle = '¡Feliz Navidad!';
                        embedDescription = '¡Jo, jo, jo! Robotito les desea una muy Feliz Navidad a toda la comunidad. ¡Que sus hogares se llenen de paz y alegría!';
                        embedColor = 0xE74C3C;
                    } else {
                        const isPositiveDay = now.day % 2 === 0;
                        let stateImage;
                        if (isPositiveDay) {
                            const index = now.day % POSITIVE_STATES.length;
                            stateImage = POSITIVE_STATES[index];
                            embedTitle = 'Hoy Robotito se siente... ¡Positivo!';
                            embedColor = 0x2ECC71;
                        } else {
                            const index = now.day % NEGATIVE_STATES.length;
                            stateImage = NEGATIVE_STATES[index];
                            embedTitle = 'Hoy Robotito se siente... ¡Un poco negativo!';
                            embedColor = 0x3498DB;
                        }
                        imageUrl = `${BASE_IMAGE_URL}estado/${stateImage}`;
                    }
                    const embed = new EmbedBuilder().setColor(embedColor).setTitle(embedTitle).setImage(imageUrl).setFooter({ text: `Estado del día ${now.toFormat('dd/MM/yyyy')}` });
                    if (embedDescription) embed.setDescription(embedDescription);
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            case 'logo':
                {
                    await interaction.deferReply();
                    const embed = new EmbedBuilder().setColor(0xF1C40F).setTitle('Logo Oficial de LAG\'S SPEED').setImage(`${BASE_IMAGE_URL}LS/logotLS.png`);
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            case 'link':
                {
                    await interaction.deferReply();
                    const embed = new EmbedBuilder()
                        .setColor(0x00FFFF)
                        .setTitle('🔗 Enlaces Útiles de Convoyrama')
                        .setDescription('Aquí tienes algunos enlaces importantes:')
                        .addFields(
                            { name: 'Generador de Eventos', value: '[Convoyrama Eventos](https://convoyrama.github.io/event.html)' },
                            { name: 'Creador de ID', value: '[Convoyrama ID](https://convoyrama.github.io/id.html)' },
                            { name: 'Generador de Imagen de Perfil', value: '[Convoyrama Perfil](https://convoyrama.github.io/pc.html)' },
                            { name: 'Invitación a nuestro Discord', value: '[Únete a la Comunidad](https://discord.gg/hjJcyREthH)' },
                            { name: 'TruckersMP', value: '[Sitio Oficial](https://truckersmp.com/)' },
                            { name: 'LAG\'S SPEED en TruckersMP', value: '[Perfil VTC](https://truckersmp.com/vtc/78865)' },
                            { name: 'LAG\'S SPEED en TrucksBook', value: '[Perfil de Empresa](https://trucksbook.eu/company/212761)' },
                            { name: 'LAG\'S SPEED en PickupVTM', value: '[Perfil de Empresa](https://pickupvtm.com/company/8203)' }
                        )
                        .setFooter({ text: '¡Explora y únete a la diversión!' });
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            case 'ingame':
                {
                    await interaction.deferReply();
                    const timeString = interaction.options.getString('tiempo');
                    const cityName = interaction.options.getString('ciudad');
                    let referenceDate = DateTime.local();
                    let responseDescription = 'Ahora mismo';
                    let inputTime;
                    let foundCity = null;

                                    if (cityName) {
                                        foundCity = LATAM_TIMEZONES.find(tz => tz.name.toLowerCase().includes(cityName.toLowerCase()));
                                        if (!foundCity) {
                                            await interaction.editReply('Ciudad no encontrada. Por favor, usa una de las capitales de la lista o un nombre reconocible.');
                                            return;
                                        }
                                        referenceDate = DateTime.local().setZone(foundCity.zone);
                                    }
                    
                                    if (timeString) {
                                        inputTime = parseInputTime(timeString, referenceDate);
                                        if (!inputTime) {
                                            await interaction.editReply('Formato de tiempo inválido. Intenta con `HH:MM`, `HHMM` (ej: 2200) o `Ham/pm` (ej: 8pm).');
                                            return;
                                        }
                                        responseDescription = cityName && foundCity ? `Si en ${foundCity.name} son las **${inputTime.toFormat('HH:mm')}**` : `Si en la zona horaria del bot son las **${inputTime.toFormat('HH:mm')}**`;
                                    } else {
                                        inputTime = referenceDate;
                                        responseDescription = cityName && foundCity ? `Ahora mismo en ${foundCity.name}` : 'Ahora mismo';
                                    }
                    const ingameTime = getGameTime(inputTime);
                    const ingameEmoji = getDetailedDayNightIcon(ingameTime.hour);
                    const embed = new EmbedBuilder().setColor(0x0099FF).setTitle('⏰ Hora In-Game').setDescription(`${responseDescription}, la hora in-game es: **${ingameTime.toFormat('HH:mm:ss')} ${ingameEmoji}**`);
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            case 'hora':
                {
                    await interaction.deferReply();
                    const timeString = interaction.options.getString('tiempo');
                    const cityName = interaction.options.getString('ciudad');
                    let referenceTime, referenceCity, description = '';
                    const userLocalTime = DateTime.local();
                    if (timeString && cityName) {
                        const foundCity = LATAM_TIMEZONES.find(tz => tz.name.toLowerCase().includes(cityName.toLowerCase()));
                        if (!foundCity) {
                            await interaction.editReply('Ciudad no encontrada en la lista de capitales latinas. Intenta con `/hora` para ver las horas actuales o `/hora tiempo:HH:MM ciudad:[Ciudad]` con una ciudad válida.');
                            return;
                        }
                        referenceTime = parseInputTime(timeString, userLocalTime.setZone(foundCity.zone));
                        if (!referenceTime) {
                            await interaction.editReply('Formato de tiempo inválido. Intenta `/hora tiempo:HH:MM ciudad:[Ciudad]` o `/hora tiempo:Ham/pm ciudad:[Ciudad]`');
                            return;
                        }
                        referenceCity = foundCity.name;
                        description = `**Si en ${referenceCity} son las ${referenceTime.toFormat('HH:mm')}, entonces:**
`;
                    } else if (!timeString && !cityName) {
                        referenceTime = userLocalTime;
                        description = `**Horas actuales en Zonas Latinas:**
`;
                    } else {
                        await interaction.editReply('Uso incorrecto. Intenta `/hora` para horas actuales, o `/hora tiempo:HH:MM ciudad:[Ciudad]`');
                        return;
                    }
                    LATAM_TIMEZONES.forEach(tz => {
                        const timeInZone = referenceTime.setZone(tz.zone);
                        description += `• **${tz.name}:** ${timeInZone.toFormat('HH:mm:ss')}
`;
                    });
                    const embed = new EmbedBuilder().setColor(0x00FF00).setTitle('🌎 Horas en Zonas Latinas').setDescription(description).setFooter({ text: 'Horas basadas en la zona horaria del bot.' });
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            case 'despedida':
                {
                    await interaction.deferReply();
                    const type = interaction.options.getString('tipo');
                    let farewellMessage = FAREWELL_MESSAGE_EXTERNAL;
                    let title = '👋 ¡Despedida de Convoy Externo!';
                    if (type && type.toLowerCase() === 'propia') {
                        farewellMessage = FAREWELL_MESSAGE_OWN;
                        title = '👋 ¡Hasta la Próxima Ruta!';
                    }
                    const embed = new EmbedBuilder().setColor(0x800080).setTitle(title).setDescription(farewellMessage).setFooter({ text: '¡Nos vemos en el camino!' });
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            case 'spam':
                {
                    await interaction.deferReply();
                    if (SPAM_TEXTS.length === 0) {
                        await interaction.editReply('No hay textos de spam configurados.');
                        return;
                    }
                    const randomIndex = Math.floor(Math.random() * SPAM_TEXTS.length);
                    const randomSpamText = SPAM_TEXTS[randomIndex];
                    const embed = new EmbedBuilder().setColor(0xFF0000).setTitle('🚨 Mensaje Aleatorio (SPAM)').setDescription(randomSpamText).setFooter({ text: '¡Copia y pega con responsabilidad!' });
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            case 'evento':
                {
                    await interaction.deferReply();
                    if (!interaction.guild) {
                        await interaction.editReply('Este comando solo funciona en un servidor.');
                        return;
                    }

                    const periodo = interaction.options.getString('periodo') || 'proximo';
                    let daysLimit = 0;
                    let title = '';

                    switch (periodo) {
                        case 'semana':
                            daysLimit = 7;
                            title = '📅 Próximos Eventos de la Semana';
                            break;
                        case 'mes':
                            daysLimit = 30;
                            title = '📅 Próximos Eventos del Mes';
                            break;
                        default: // proximo
                            daysLimit = 0;
                            break;
                    }

                    const upcomingEvents = await getUpcomingEvents(interaction.guild, daysLimit);

                    if (upcomingEvents.size === 0) {
                        let message = 'Lo siento, no hay eventos programados próximos en este servidor.';
                        if (periodo === 'semana') {
                            message = 'No hay eventos programados para esta semana.';
                        } else if (periodo === 'mes') {
                            message = 'No hay eventos programados para este mes.';
                        }
                        await interaction.editReply(message);
                        return;
                    }

                    if (periodo === 'proximo') {
                        const nextEvent = upcomingEvents.first();
                        const embed = new EmbedBuilder()
                            .setColor(0x8A2BE2)
                            .setTitle(`📅 Próximo Evento: ${nextEvent.name}`)
                            .setURL(nextEvent.url)
                            .setDescription(
                                `**Descripción:** ${nextEvent.description || 'Sin descripción.'}\n` +
                                `**Inicio:** <t:${Math.floor(nextEvent.scheduledStartTimestamp / 1000)}:F> (<t:${Math.floor(nextEvent.scheduledStartTimestamp / 1000)}:R>)\n` +
                                `**Ubicación:** ${nextEvent.entityMetadata?.location || nextEvent.channel?.name || 'N/A'}\n` +
                                `**Creador:** ${nextEvent.creator?.tag || 'Desconocido'}`
                            )
                            .setFooter({ text: '¡No te lo pierdas!' });
                        const coverImage = nextEvent.coverImageURL();
                        if (coverImage) embed.setThumbnail(coverImage);
                        await interaction.editReply({ embeds: [embed] });
                    } else {
                        const embed = new EmbedBuilder().setColor(0x8A2BE2).setTitle(title);
                        let description = '';
                        upcomingEvents.forEach(event => {
                            description += `**[${event.name}](${event.url})**\n` + `Inicia: <t:${Math.floor(event.scheduledStartTimestamp / 1000)}:F> (<t:${Math.floor(event.scheduledStartTimestamp / 1000)}:R>)\n\n`;
                        });
                        embed.setDescription(description);
                        await interaction.editReply({ embeds: [embed] });
                    }
                    break;
                }
            case 'vtc':
                {
                    await interaction.deferReply();
                    const embed = new EmbedBuilder().setColor(0x008000).setTitle('🚚 Comunidad');
                    const vtcData = JSON.parse(fs.readFileSync('./vtcs.json', 'utf8'));
                    vtcData.forEach(countryData => {
                        const vtcList = countryData.vtcs.map(vtc => vtc.discord ? `[${vtc.name}](${vtc.discord})` : vtc.name).join('\n');
                        if (vtcList) embed.addFields({ name: countryData.country, value: vtcList, inline: true });
                    });
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            case 'servers':
                {
                    await interaction.deferReply();
                    try {
                        const response = await axios.get(`${TRUCKERSMP_API_BASE_URL}/servers`);
                        const servers = response.data.response;
                        const embed = new EmbedBuilder().setColor(0x00FF00).setTitle('Estado de los Servidores de TruckersMP');
                        servers.forEach(server => {
                            embed.addFields({ name: `${server.name} (${server.shortname})`, value: `**Jugadores:** ${server.players} / ${server.maxplayers}
**En cola:** ${server.queue}
**Estado:** ${server.online ? 'Online' : 'Offline'}`, inline: true });
                        });
                        await interaction.editReply({ embeds: [embed] });
                    } catch (error) {
                        console.error('Error al obtener datos de los servidores de TruckersMP:', error);
                        if (error.response) {
                            await interaction.editReply(`Error al consultar la API de TruckersMP: ${error.response.status} ${error.response.statusText}`);
                        } else {
                            await interaction.editReply('Lo siento, hubo un error al consultar la API de TruckersMP.');
                        }
                    }
                    break;
                }
            case 'info':
                {
                    await interaction.deferReply({ flags: 64 });
                    const input = interaction.options.getString('enlace_o_alias');
                    if (!input) {
                        await interaction.editReply({ content: 'Por favor, proporciona un enlace de perfil de TruckersMP (usuario o VTC) o un alias de VTC.', flags: 64 });
                        return;
                    }
                    const userUrlMatch = input.match(/truckersmp\.com\/(?:user|profile)\/(\d+)/);
                    const vtcUrlMatch = input.match(/truckersmp\.com\/vtc\/(\d+)/);
                    const vtcAlias = vtcAliases[input.toLowerCase()];
                    if (userUrlMatch) {
                        const userId = userUrlMatch[1];
                        await handlePlayerInfo(interaction, userId, input);
                    } else if (vtcUrlMatch || vtcAlias) {
                        const vtcId = vtcUrlMatch ? vtcUrlMatch[1] : vtcAlias;
                        const vtcUrl = vtcUrlMatch ? input : `https://truckersmp.com/vtc/${vtcId}`;
                        try {
                            const vtcResponse = await axios.get(`${TRUCKERSMP_API_BASE_URL}/vtc/${vtcId}`);
                            const vtcData = vtcResponse.data.response;
                            if (!vtcData) {
                                await interaction.editReply('No se encontró información para esa VTC de TruckersMP.');
                                return;
                            }

                            let membersData = [];
                            try {
                                const membersResponse = await axios.get(`${TRUCKERSMP_API_BASE_URL}/vtc/${vtcId}/members`);
                                membersData = membersResponse.data.response?.members || [];
                            } catch (membersError) {
                                console.error(`[${new Date().toISOString()}] Error fetching VTC members for VTC ID ${vtcId}:`, membersError.message);
                            }

                            let newsData = null;
                            try {
                                const newsResponse = await axios.get(`${TRUCKERSMP_API_BASE_URL}/vtc/${vtcId}/news`);
                                newsData = newsResponse.data.response;
                            } catch (newsError) {
                                console.error(`[${new Date().toISOString()}] Error fetching VTC news for VTC ID ${vtcId}:`, newsError.message);
                            }
                                                    const embed = new EmbedBuilder()
                                .setColor(0x0077B6)
                                .setTitle(`🚚 Perfil de VTC: ${vtcData.name}`)
                                .setURL(vtcUrl)
                                .setThumbnail(vtcData.avatar || null)
                                .addFields(
                                    { name: 'ID de VTC', value: vtcData.id ? `${vtcData.id}` : 'N/A', inline: true },
                                    { name: 'Tag', value: vtcData.tag || 'N/A', inline: true },
                                    { name: 'Miembros', value: vtcData.members_count ? `${vtcData.members_count}` : 'N/A', inline: true },
                                    { name: 'Creada', value: vtcData.creation_date ? DateTime.fromISO(vtcData.creation_date.replace(' ', 'T')).toFormat('dd/MM/yyyy') : 'N/A', inline: true },
                                    { name: 'Reclutamiento', value: vtcData.recruitment_status || 'N/A', inline: true },
                                    { name: 'Verificada', value: vtcData.verified ? 'Sí' : 'No', inline: true }
                                )
                                .setFooter({ text: 'Datos obtenidos de la API de TruckersMP.' });
                            if (vtcData.slogan) embed.setDescription(vtcData.slogan);

                            if (newsData && newsData.news && newsData.news.length > 0) {
                                const latestNews = newsData.news[0];
                                embed.addFields({ name: 'Última Noticia', value: `[${latestNews.title}](https://truckersmp.com/vtc/${vtcId}/news/${latestNews.id})` });
                            }
                            await interaction.editReply({ embeds: [embed] });
                        } catch (error) {
                            console.error('Error al obtener datos de TruckersMP API:', error);
                            if (error.response) {
                                await interaction.editReply(`Error al consultar la API de TruckersMP: ${error.response.status} ${error.response.statusText}`);
                            } else {
                                await interaction.editReply('Lo siento, hubo un error al consultar la API de TruckersMP.');
                            }
                        }
                    } else {
                        await interaction.editReply({ content: 'El formato del enlace o alias no es válido. Por favor, usa un enlace de perfil de usuario, de VTC o un alias de VTC válido.', flags: 64 });
                    }
                    break;
                }
            default:
                await interaction.reply('Comando desconocido.');
                break;
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error al ejecutar el comando '/${commandName}':`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Hubo un error al ejecutar este comando.', flags: 64 });
        } else {
            await interaction.reply({ content: 'Hubo un error al ejecutar este comando.', flags: 64 });
        }
    }
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

if (!process.env.DISCORD_TOKEN) {
    console.error('❌ Error: DISCORD_TOKEN no está configurado en las variables de entorno');
    console.error('Por favor, configura tu token de Discord en los Secrets de Replit o en tu entorno de hosting.');
    process.exit(1);
}

const token = process.env.DISCORD_TOKEN;
console.log(`Verificando token. Comienza con: "${token.substring(0, 5)}", termina con: "${token.slice(-5)}"`);

console.log('Iniciando sesión con el token...');
client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log('¡Inicio de sesión exitoso!');
    })
    .catch(error => {
        console.error('❌ Error al conectar con Discord:', error.message);
        process.exit(1);
    });

// Keep-alive server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive!\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Keep-alive server running on port ${PORT}`);
});
