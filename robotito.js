require('dotenv').config();

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const axios = require('axios');
const crypto = require('crypto');
const http = require('http');

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

const TIRA_ECOL_FILES = [
    'tiraecol-001.jpg', 'tiraecol-002.png', 'tiraecol-003.jpg', 'tiraecol-004.jpg', 'tiraecol-005.jpg', 'tiraecol-006.jpg', 'tiraecol-007.jpg', 'tiraecol-008.gif', 'tiraecol-009.gif', 'tiraecol-010.gif',
    'tiraecol-011.png', 'tiraecol-012.png', 'tiraecol-013.png', 'tiraecol-014.png', 'tiraecol-015.png', 'tiraecol-016.png', 'tiraecol-017.png', 'tiraecol-018.png', 'tiraecol-019.png', 'tiraecol-020.png',
    'tiraecol-021.png', 'tiraecol-022.png', 'tiraecol-023.png', 'tiraecol-024.png', 'tiraecol-025.png', 'tiraecol-026.png', 'tiraecol-027.png', 'tiraecol-028.png', 'tiraecol-029.png', 'tiraecol-030.png',
    'tiraecol-031.png', 'tiraecol-032.png', 'tiraecol-033.png', 'tiraecol-034.png', 'tiraecol-035.png', 'tiraecol-036.png', 'tiraecol-037.png', 'tiraecol-038.png', 'tiraecol-039.png', 'tiraecol-040.png',
    'tiraecol-041.png', 'tiraecol-042.png', 'tiraecol-043.png', 'tiraecol-044.png', 'tiraecol-045.png', 'tiraecol-046.png', 'tiraecol-047.png', 'tiraecol-048.png', 'tiraecol-049.png', 'tiraecol-050.png',
    'tiraecol-051.png', 'tiraecol-052.png', 'tiraecol-053.png', 'tiraecol-054.png', 'tiraecol-055.png', 'tiraecol-056.png', 'tiraecol-057.png', 'tiraecol-058.png', 'tiraecol-059.png', 'tiraecol-060.png',
    'tiraecol-061.png', 'tiraecol-062.png', 'tiraecol-063.png', 'tiraecol-064.png', 'tiraecol-065.png', 'tiraecol-066.png', 'tiraecol-067.png', 'tiraecol-068.png', 'tiraecol-069.png', 'tiraecol-070.png',
    'tiraecol-071.png', 'tiraecol-072.png', 'tiraecol-073.png', 'tiraecol-074.png', 'tiraecol-075.png', 'tiraecol-076.png', 'tiraecol-077.png', 'tiraecol-078.png', 'tiraecol-079.png', 'tiraecol-080.png',
    'tiraecol-081.png', 'tiraecol-082.png', 'tiraecol-083.png', 'tiraecol-084.png', 'tiraecol-085.png', 'tiraecol-086.png', 'tiraecol-087.png', 'tiraecol-088.png', 'tiraecol-089.png', 'tiraecol-090.png',
    'tiraecol-091.png', 'tiraecol-092.png', 'tiraecol-093.png', 'tiraecol-094.png', 'tiraecol-095.png', 'tiraecol-096.png', 'tiraecol-097.png', 'tiraecol-098.png', 'tiraecol-099.png', 'tiraecol-100.png',
    'tiraecol-101.png', 'tiraecol-102.png', 'tiraecol-103.png', 'tiraecol-104.png', 'tiraecol-105.png', 'tiraecol-106.png', 'tiraecol-107.png', 'tiraecol-108.png', 'tiraecol-109.png', 'tiraecol-110.png',
    'tiraecol-111.png', 'tiraecol-112.png', 'tiraecol-113.png', 'tiraecol-114.png', 'tiraecol-115.png', 'tiraecol-116.png', 'tiraecol-117.png', 'tiraecol-118.png', 'tiraecol-119.png', 'tiraecol-120.png',
    'tiraecol-121.png', 'tiraecol-122.png', 'tiraecol-123.png', 'tiraecol-124.png', 'tiraecol-125.png', 'tiraecol-126.png', 'tiraecol-127.png', 'tiraecol-128.png', 'tiraecol-129.png', 'tiraecol-130.png',
    'tiraecol-131.png', 'tiraecol-132.png', 'tiraecol-133.png', 'tiraecol-134.png', 'tiraecol-135.png', 'tiraecol-136.png', 'tiraecol-137.png', 'tiraecol-138.png', 'tiraecol-139.png', 'tiraecol-140.png',
    'tiraecol-141.png', 'tiraecol-142.png', 'tiraecol-143.png', 'tiraecol-144.png', 'tiraecol-145.png', 'tiraecol-146.png', 'tiraecol-147.png', 'tiraecol-148.png', 'tiraecol-149.png', 'tiraecol-150.png',
    'tiraecol-151.png', 'tiraecol-152.png', 'tiraecol-153.png', 'tiraecol-154.png', 'tiraecol-155.png', 'tiraecol-156.png', 'tiraecol-157.png', 'tiraecol-158.png', 'tiraecol-159.png', 'tiraecol-160.png',
    'tiraecol-161.png', 'tiraecol-162.png', 'tiraecol-163.png', 'tiraecol-164.png', 'tiraecol-165.png', 'tiraecol-166.png', 'tiraecol-167.png', 'tiraecol-168.png', 'tiraecol-169.png', 'tiraecol-170.png',
    'tiraecol-171.png', 'tiraecol-172.png', 'tiraecol-173.png', 'tiraecol-174.png', 'tiraecol-175.png', 'tiraecol-176.png', 'tiraecol-177.png', 'tiraecol-178.png', 'tiraecol-179.png', 'tiraecol-180.png',
    'tiraecol-181.png', 'tiraecol-182.png', 'tiraecol-183.png', 'tiraecol-184.png', 'tiraecol-185.png', 'tiraecol-186.png', 'tiraecol-187.png', 'tiraecol-188.png', 'tiraecol-189.png', 'tiraecol-190.png',
    'tiraecol-191.png', 'tiraecol-192.png', 'tiraecol-193.png', 'tiraecol-194.png', 'tiraecol-195.png', 'tiraecol-196.png', 'tiraecol-197.png', 'tiraecol-198.png', 'tiraecol-199.png', 'tiraecol-2.jpg',
    'tiraecol-200.png', 'tiraecol-201.png', 'tiraecol-202.png', 'tiraecol-203.png', 'tiraecol-204.png', 'tiraecol-205.png', 'tiraecol-206.png', 'tiraecol-207.png', 'tiraecol-208.png', 'tiraecol-209.png',
    'tiraecol-210.png', 'tiraecol-211.png', 'tiraecol-212.png', 'tiraecol-213.png', 'tiraecol-214.png', 'tiraecol-215.png', 'tiraecol-216.png', 'tiraecol-217.png', 'tiraecol-218.png', 'tiraecol-219.png',
    'tiraecol-220.png', 'tiraecol-221.png', 'tiraecol-222.png', 'tiraecol-223.png', 'tiraecol-224.png', 'tiraecol-225.png', 'tiraecol-226.png', 'tiraecol-227.png', 'tiraecol-228.png', 'tiraecol-229.png',
    'tiraecol-230.png', 'tiraecol-231.png', 'tiraecol-232.png', 'tiraecol-233.png', 'tiraecol-234.png', 'tiraecol-235.png', 'tiraecol-236.png', 'tiraecol-237.png', 'tiraecol-238.png', 'tiraecol-239.png',
    'tiraecol-240.png', 'tiraecol-241.png', 'tiraecol-242.png', 'tiraecol-243.png', 'tiraecol-244.png', 'tiraecol-245.png', 'tiraecol-246.png', 'tiraecol-247.png', 'tiraecol-248.png', 'tiraecol-249.png',
    'tiraecol-250.png', 'tiraecol-251.png', 'tiraecol-252.png', 'tiraecol-253.png', 'tiraecol-254.png', 'tiraecol-255.png', 'tiraecol-256.png', 'tiraecol-257.png', 'tiraecol-258.png', 'tiraecol-259.png',
    'tiraecol-260.png', 'tiraecol-261.png', 'tiraecol-262.png', 'tiraecol-263.png', 'tiraecol-264.png', 'tiraecol-265.png', 'tiraecol-266.png', 'tiraecol-267.png', 'tiraecol-268.png', 'tiraecol-269.png',
    'tiraecol-270.png', 'tiraecol-271.png', 'tiraecol-272.png', 'tiraecol-273.png', 'tiraecol-274.png', 'tiraecol-275.png', 'tiraecol-276.png', 'tiraecol-277.png', 'tiraecol-278.png', 'tiraecol-279.png',
    'tiraecol-280.png', 'tiraecol-281.png', 'tiraecol-282.png', 'tiraecol-283.png', 'tiraecol-284.png', 'tiraecol-285.png', 'tiraecol-286.png', 'tiraecol-287.png', 'tiraecol-288.png', 'tiraecol-289.png',
    'tiraecol-290.png', 'tiraecol-291.png', 'tiraecol-292.png', 'tiraecol-293.png', 'tiraecol-294.png', 'tiraecol-295.png', 'tiraecol-296.png', 'tiraecol-297.png', 'tiraecol-298.png', 'tiraecol-299.png',
    'tiraecol-300.png', 'tiraecol-301.png', 'tiraecol-302.png', 'tiraecol-303.png', 'tiraecol-304.png', 'tiraecol-305.png', 'tiraecol-306.png', 'tiraecol-307.png', 'tiraecol-308.png', 'tiraecol-309.png',
    'tiraecol-310.png', 'tiraecol-311.png', 'tiraecol-312.png', 'tiraecol-313.png', 'tiraecol-314.png', 'tiraecol-315.png', 'tiraecol-316.png', 'tiraecol-317.png', 'tiraecol-318.png', 'tiraecol-319.png',
    'tiraecol-320.png', 'tiraecol-321.png', 'tiraecol-322.png', 'tiraecol-323.png', 'tiraecol-324.png', 'tiraecol-325.png', 'tiraecol-326.png', 'tiraecol-327.png', 'tiraecol-328.png', 'tiraecol-329.png',
    'tiraecol-330.png', 'tiraecol-331.png', 'tiraecol-332.jpg', 'tiraecol-332.png', 'tiraecol-333.png', 'tiraecol-334.jpg', 'tiraecol-334.png', 'tiraecol-335.png', 'tiraecol-336.png', 'tiraecol-337.png',
    'tiraecol-338.png', 'tiraecol-339.png', 'tiraecol-340.png', 'tiraecol-341.jpg', 'tiraecol-341.png', 'tiraecol-342.png', 'tiraecol-343.png', 'tiraecol-344.png', 'tiraecol-345.png', 'tiraecol-346.png',
    'tiraecol-347.png', 'tiraecol-348.png', 'tiraecol-349.png', 'tiraecol-350.png', 'tiraecol-351.png', 'tiraecol-352.png', 'tiraecol-353.png', 'tiraecol-354.png', 'tiraecol-355.png', 'tiraecol-356.png',
    'tiraecol-357.png', 'tiraecol-358.png', 'tiraecol-359.png', 'tiraecol-360.png', 'tiraecol-361.png', 'tiraecol-362.png', 'tiraecol-363.png', 'tiraecol-364.png', 'tiraecol-365.png', 'tiraecol-366.png',
    'tiraecol-367.jpg', 'tiraecol-368.png', 'tiraecol-369.png', 'tiraecol-370.png', 'tiraecol-371.png', 'tiraecol-372.png', 'tiraecol-373.png', 'tiraecol-374.png', 'tiraecol-375.png', 'tiraecol-376.png',
    'tiraecol-377.png', 'tiraecol-378.png', 'tiraecol-379.png', 'tiraecol-380.png', 'tiraecol-381.png', 'tiraecol-382.png', 'tiraecol-383.png', 'tiraecol-384.png', 'tiraecol-385.png', 'tiraecol-386.png',
    'tiraecol-387.png', 'tiraecol-388.png', 'tiraecol-389.png', 'tiraecol-390.png', 'tiraecol-391.png', 'tiraecol-392.png', 'tiraecol-393.png', 'tiraecol-394.png', 'tiraecol-395.png', 'tiraecol-396.png',
    'tiraecol-397.png', 'tiraecol-398.png', 'tiraecol-399.png', 'tiraecol-400.png'
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

const FAREWELL_MESSAGE_OWN = "LAG'S SPEED les agradece sinceramente su participación. Ha sido una ruta excelente gracias a la compañía de cada uno de ustedes, y un placer compartir este gran momento. ¡Esperamos seguir contando con su presencia en futuras aventuras! Saludos y muy buena ruta a todos.";
const FAREWELL_MESSAGE_EXTERNAL = "LAG'S SPEED agradece la invitación a este convoy. Ha sido un placer compartir la ruta con todos. ¡Esperamos coincidir de nuevo en el camino! Saludos y muy buena ruta.";

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

async function handlePlayerInfo(interaction, userId, profileUrl) {
    try {
        await interaction.deferReply({ flags: 64 });
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
    const { commandName } = interaction;
    switch (commandName) {
        case 'ayuda':
            {
                const embed = new EmbedBuilder()
                    .setColor(0x3498DB)
                    .setTitle('🤖 Comandos de Robotito')
                    .setDescription('Aquí tienes una lista de lo que puedo hacer:')
                    .addFields(
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
        case 'tira':
            {
                await interaction.deferReply();
                const randomImage = TIRA_ECOL_FILES[Math.floor(Math.random() * TIRA_ECOL_FILES.length)];
                const imageUrl = `https://convoyrama.github.io/robotito/img/tira-ecol-master/tira/${randomImage}`;
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('Tira Cómica de ECOL')
                    .setURL('https://biloynano.com/')
                    .setImage(imageUrl)
                    .setFooter({ text: 'Tira por Javier Malonda (Bilo y Nano) | Usa /tirainfo para más detalles.' });
                await interaction.editReply({ embeds: [embed] });
                break;
            }
        case 'tirainfo':
            {
                const readmeDescription = 'Esta es una recopilación de la *Tira Ecol* publicada entre diciembre de 2001 y el 18 de octubre de 2010 (tiraecol.net).';
                const interviewSnippet = '1.  *¿Quien eres tu? (informacion personal que quieras dar)*\n\n    Nací hace unos 28 años en Valencia, y desde entonces vengo haciendo cosas sin\n    parar. Por lo visto soy una persona inquieta. Demasiado. Fui al colegio hasta\n    que hubo que salir de allí y luego, por algún extraño motivo que aún estoy\n    ponderando, acabé estudiando ingeniería industrial. Cuando digo que lo mejor\n    que me sucedió allí fue escribir y dibujar en la revista de la escuela, te\n    puedes hacer una idea de lo que fue mi paso por aquella santa institución.\n';
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
                                console.error('Error fetching VTC data:', vtcError.message);
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
                            { name: 'Usuario de TruckersMP', value: playerData.name, inline: true },
                            { name: 'Fecha de Registro Verificada', value: DateTime.fromISO(playerData.joinDate.replace(' ', 'T')).toFormat('dd/MM/yyyy'), inline: true }
                        )
                        .setFooter({ text: 'Este código vincula tu licencia a tu fecha de registro real.' });
                    if (vtcDataForEmbed) {
                        embed.addFields({ name: 'VTC Procesada', value: `${vtcDataForEmbed.name}`, inline: true });
                    }
                    embed.addFields({ name: 'Tu Código de Verificación', value: `
${verificationCode}
` });
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
                        jokeText = `${jokeData.setup}\n*${jokeData.delivery}*`;
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

                if (cityName) {
                    const foundCity = LATAM_TIMEZONES.find(tz => tz.name.toLowerCase().includes(cityName.toLowerCase()));
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
                    responseDescription = cityName ? `Si en ${foundCity.name} son las **${inputTime.toFormat('HH:mm')}**` : `Si en la zona horaria del bot son las **${inputTime.toFormat('HH:mm')}**`;
                } else {
                    inputTime = referenceDate;
                    responseDescription = cityName ? `Ahora mismo en ${foundCity.name}` : 'Ahora mismo';
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
                    description = `**Si en ${referenceCity} son las ${referenceTime.toFormat('HH:mm')}, entonces:**\n`;
                } else if (!timeString && !cityName) {
                    referenceTime = userLocalTime;
                    description = `**Horas actuales en Zonas Latinas:**\n`;
                } else {
                    await interaction.editReply('Uso incorrecto. Intenta `/hora` para horas actuales, o `/hora tiempo:HH:MM ciudad:[Ciudad]`');
                    return;
                }
                LATAM_TIMEZONES.forEach(tz => {
                    const timeInZone = referenceTime.setZone(tz.zone);
                    description += `• **${tz.name}:** ${timeInZone.toFormat('HH:mm:ss')}\n`;
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
                const scheduledEvents = await interaction.guild.scheduledEvents.fetch();
                const now = Date.now();
                const upcomingEvents = scheduledEvents.filter(event => event.scheduledStartTimestamp > now).sort((a, b) => a.scheduledStartTimestamp - b.scheduledStartTimestamp);
                if (upcomingEvents.size === 0) {
                    await interaction.editReply('Lo siento, no hay eventos programados próximos en este servidor.');
                    return;
                }
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
                break;
            }
        case 'evento7':
            {
                await interaction.deferReply();
                if (!interaction.guild) {
                    await interaction.editReply('Este comando solo funciona en un servidor.');
                    return;
                }
                const scheduledEvents = await interaction.guild.scheduledEvents.fetch();
                const now = Date.now();
                const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
                const upcomingWeekEvents = scheduledEvents.filter(event => event.scheduledStartTimestamp > now && event.scheduledStartTimestamp < sevenDaysFromNow).sort((a, b) => a.scheduledStartTimestamp - b.scheduledStartTimestamp);
                if (upcomingWeekEvents.size === 0) {
                    await interaction.editReply('No hay eventos programados para esta semana.');
                    return;
                }
                const embed = new EmbedBuilder().setColor(0x8A2BE2).setTitle('📅 Próximos Eventos de la Semana');
                let description = '';
                upcomingWeekEvents.forEach(event => {
                    description += `**[${event.name}](${event.url})**\n` + `Inicia: <t:${Math.floor(event.scheduledStartTimestamp / 1000)}:F> (<t:${Math.floor(event.scheduledStartTimestamp / 1000)}:R>)\n\n`;
                });
                embed.setDescription(description);
                await interaction.editReply({ embeds: [embed] });
                break;
            }
        case 'vtc':
            {
                await interaction.deferReply();
                const embed = new EmbedBuilder().setColor(0x008000).setTitle('🚚 Comunidad');
                const VTCS_DATA = []; 
                VTCS_DATA.forEach(countryData => {
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
                        embed.addFields({ name: `${server.name} (${server.shortname})`, value: `**Jugadores:** ${server.players} / ${server.maxplayers}\n**En cola:** ${server.queue}\n**Estado:** ${server.online ? 'Online' : 'Offline'}`, inline: true });
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
                        const membersResponse = await axios.get(`${TRUCKERSMP_API_BASE_URL}/vtc/${vtcId}/members`);
                        const membersData = membersResponse.data.response.members;
                        const bannedMembers = membersData.filter(member => member.banned);
                        const newsResponse = await axios.get(`${TRUCKERSMP_API_BASE_URL}/vtc/${vtcId}/news`);
                        const newsData = newsResponse.data.response;
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
                        if (bannedMembers.length > 0) {
                            const bannedMembersList = bannedMembers.map(member => member.username).join(', ');
                            embed.addFields({ name: 'Miembros Baneados', value: bannedMembersList });
                        }
                        if (newsData.news && newsData.news.length > 0) {
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
});

if (!process.env.DISCORD_TOKEN) {
    console.error('❌ Error: DISCORD_TOKEN no está configurado en las variables de entorno');
    console.error('Por favor, configura tu token de Discord en los Secrets de Replit o en tu entorno de hosting.');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN)
    .catch(error => {
        console.error('❌ Error al conectar con Discord:', error.message);
        process.exit(1);
    });

// Keep-alive server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive!\n');
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`Keep-alive server running on port ${process.env.PORT || 3000}`);
});
