require('dotenv').config();
const { REST, Routes } = require('discord.js');

// SOLUCIÓN TEMPORAL: CLIENT_ID hardcodeado para el registro de comandos.
// Esto NO es una buena práctica para el código principal del bot.
const CLIENT_ID = '1423340697913917521'; 

const commands = [
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
        description: 'Muestra la hora actual in-game, o calcula la hora in-game para un tiempo específico.',
        options: [
            {
                name: 'tiempo',
                description: 'Hora en formato HH:MM o Ham/pm (ej: 22:00 o 5pm).',
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
        description: 'Muestra el próximo evento programado en este servidor.',
    },
    {
        name: 'evento7',
        description: 'Muestra los eventos programados para los próximos 7 días.',
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
        name: 'infou',
        description: 'Muestra información de un usuario de TruckersMP por ID.',
        options: [
            {
                name: 'id_usuario',
                description: 'ID del usuario de TruckersMP.',
                type: 3, // STRING
                required: true,
            },
        ],
    },
    {
        name: 'infov',
        description: 'Muestra información de una VTC de TruckersMP por ID.',
        options: [
            {
                name: 'id_vtc',
                description: 'ID de la VTC de TruckersMP.',
                type: 3, // STRING
                required: true,
            },
        ],
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
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Iniciando el registro de ${commands.length} comandos de aplicación.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationCommands(CLIENT_ID), // Usamos la constante CLIENT_ID hardcodeada
            // Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID), // Para comandos específicos de un servidor (más rápido para pruebas)
            { body: commands },
        );

        console.log(`Se cargaron exitosamente ${data.length} comandos de aplicación.`);
    } catch (error) {
        console.error(error);
    }
})();