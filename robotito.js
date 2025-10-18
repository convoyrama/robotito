const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const http = require('http');
const { token } = require('./config.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildMessages,      // Para leer mensajes
        GatewayIntentBits.MessageContent      // Para leer el contenido del mensaje
    ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[ADVERTENCIA] Al comando en ${filePath} le falta una propiedad "data" o "execute" requerida.`);
    }
}

client.once('clientReady', () => {
    console.log('Evento clientReady disparado.');
    console.log(`¡Bot Robotito conectado como ${client.user.tag}!`);
    client.user.setActivity('Convoyrama', { type: ActivityType.Watching });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No se encontró ningún comando que coincida con ${interaction.commandName}.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error ejecutando el comando '${interaction.commandName}':`, error);
        const replyOptions = { content: '¡Hubo un error al ejecutar este comando!', flags: 64 };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyOptions);
        } else {
            await interaction.reply(replyOptions);
        }
    }
});

// Lógica de respuesta a menciones
client.on('messageCreate', message => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user)) {
        const messageContent = message.content.toLowerCase();
        const greetingKeywords = ['hola', 'buenas', 'qué tal', 'saludos', 'tal', 'buen día', 'buenos días'];
        const isGreeting = greetingKeywords.some(keyword => messageContent.includes(keyword));

        if (isGreeting) {
            const greetings = [
                "¡Hola, hola! ✨",
                "¡Buenas! ¿Todo en orden por aquí?",
                "¡Qué tal! Aquí Robotito, listo para la acción (o para contarte un dato inútil con `/tito`).",
                "¡Bip-burup! ¡Hola!",
                "¡Hola! ¿Qué tal el día? Si quieres saber el tiempo que hace, siempre puedes usar `/clima [ciudad]`.",
                "¡Buenas! Hoy me siento... bueno, mejor usa `/estado` para averiguarlo. 😉",
                "¡Qué tal! ¿Buscando cosas nuevas? Tengo una lista de sitios de mods que puedes ver con `/mods`.",
                "¡Hola! Espero que tu día vaya bien. Y si no, siempre nos quedará la ley de Murphy... `/murphy`.",
                "¡Saludos! ¿Necesitas saber la hora en algún lugar del mundo? Pregúntame con `/hora`.",
                "¡Hola! ¿Buscas los enlaces de la comunidad? Los tengo a mano con el comando `/link`.",
                "¡Buenas! ¿Verificando si los servidores de TruckersMP están online? Puedes usar `/servidores` para eso.",
                "¡Qué tal! ¿Con ganas de un convoy? Mira los próximos eventos con `/evento`.",
                "01001000 01101111 01101100 01100001... ¡Ah, perdona! A veces pienso en binario. ¡Hola!",
                "¡Hola! ¿Calculando la hora para el próximo convoy? Recuerda que puedes usar `/ingame` para saber la hora dentro del juego."
            ];
            const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
            message.reply(randomGreeting);
        } else {
            message.reply("¡Bip-bop! Me has llamado. Si necesitas algo, usa `/ayuda` para ver mi lista de comandos.");
        }
    }
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

if (!token) {
    console.error('❌ Error: El token no está configurado en config.js');
    process.exit(1);
}

client.login(token)
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
