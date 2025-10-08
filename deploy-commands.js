require('dotenv').config();
const { REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const commands = [
    {
        name: 'ping',
        description: 'Comprueba si el bot está respondiendo.',
    },
    {
        name: 'ayuda',
        description: 'Muestra la lista de comandos de Robotito.',
    },
    {
        name: 'tito',
        description: 'Tito te cuenta un dato inútil y absurdo.',
    },
    {
        name: 'estado',
        description: 'Muestra el estado de ánimo diario de Robotito.',
    },
    {
        name: 'logo',
        description: 'Muestra el logo oficial de la comunidad.',
    },
    {
        name: 'link',
        description: 'Muestra enlaces útiles de Convoyrama y el Discord.',
    },
    {
        name: 'ingame',
        description: 'Calcula la hora in-game para una hora y zona horaria específicas.',
        options: [
            {
                name: 'tiempo',
                description: 'Hora en formato HH:MM, HHMM o Ham/pm (ej: 22:00, 2200 o 5pm).',
                type: 3, // STRING
                required: false,
            },
            {
                name: 'ciudad',
                description: 'Ciudad/País para la zona horaria de referencia (ej: Montevideo).',
                type: 3, // STRING
                required: false,
            },
        ],
    },
    {
        name: 'hora',
        description: 'Muestra la hora actual en varias zonas horarias o calcula esas horas.',
        options: [
            {
                name: 'tiempo',
                description: 'Hora en formato HH:MM o Ham/pm (ej: 20:00 o 8pm).',
                type: 3, // STRING
                required: false,
            },
            {
                name: 'ciudad',
                description: 'Ciudad de referencia (ej: Montevideo).',
                type: 3, // STRING
                required: false,
            },
        ],
    },
    {
        name: 'despedida',
        description: 'Envía un mensaje de despedida de convoy (propio o ajeno).',
        options: [
            {
                name: 'tipo',
                description: 'Tipo de despedida (propia o ajena).',
                type: 3, // STRING
                required: false,
                choices: [
                    { name: 'propia', value: 'propia' },
                    { name: 'ajena', value: 'ajena' },
                ],
            },
        ],
    },
    {
        name: 'spam',
        description: 'Envía un mensaje aleatorio de la lista de textos predefinidos.',
    },
    {
        name: 'evento',
        description: 'Muestra los próximos eventos programados.',
        options: [
            {
                name: 'periodo',
                description: 'El periodo de tiempo para mostrar los eventos.',
                type: 3, // STRING
                required: false,
                choices: [
                    { name: 'próximo', value: 'proximo' },
                    { name: 'semana', value: 'semana' },
                    { name: 'mes', value: 'mes' },
                ],
            },
        ],
    },
    {
        name: 'vtc',
        description: 'Muestra la lista de VTCs de la comunidad.',
    },
    {
        name: 'servers',
        description: 'Muestra el estado de los servidores de TruckersMP.',
    },
    {
        name: 'info',
        description: 'Muestra información de un usuario o VTC de TruckersMP por URL o alias.',
        options: [
            {
                name: 'enlace_o_alias',
                description: 'Enlace de perfil de TruckersMP (usuario o VTC) o alias de VTC.',
                type: 3, // STRING
                required: true,
            },
        ],
    },
    {
        name: 'verificar',
        description: 'Genera un código para verificar tu cuenta, y opcionalmente, tu VTC.',
        options: [
            {
                name: 'url',
                description: 'La URL completa de tu perfil de TruckersMP.',
                type: 3, // STRING
                required: true,
            },
            {
                name: 'url_vtc',
                description: 'Opcional: La URL de tu VTC para verificar propiedad y logo.',
                type: 3, // STRING
                required: false,
            },
        ],
    },
    {
        name: 'tira',
        description: 'Muestra una tira cómica donde aparece Robotito.',
    },
    {
        name: 'tirainfo',
        description: 'Muestra información sobre las tiras cómicas de ECOL y sus autores.',
    },
    {
        name: 'clima',
        description: 'Muestra el clima actual de una ciudad.',
        options: [
            {
                name: 'ciudad',
                description: 'La ciudad para la que quieres saber el clima.',
                type: 3, // STRING
                required: true,
            },
        ],
    },
];

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Iniciando el registro de ${commands.length} comandos para el servidor: ${guildId}.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`Se cargaron exitosamente ${data.length} comandos de aplicación.`);
    } catch (error) {
        console.error(error);
    }
})();
