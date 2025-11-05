const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const http = require('http');
const crypto = require('crypto');
const { token } = require('./config.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
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

const { handleMessage } = require('./utils/messageHandlers.js');

client.on('interactionCreate', async interaction => {\n    if (!interaction.isChatInputCommand()) return;\n\n    const command = interaction.client.commands.get(interaction.commandName);\n\n    if (!command) {\n        console.error(`No se encontró ningún comando que coincida con ${interaction.commandName}.`);\n        return;\n    }\n\n    try {\n        await command.execute(interaction);\n    } catch (error) {\n        const errorId = crypto.randomBytes(8).toString('hex');\n        console.error(`Error ID: ${errorId} | Comando: '${interaction.commandName}' | Error:`, error);\n\n        const errorMessage = {\n            content: `❌ Ocurrió un error inesperado. Si el problema persiste, por favor reporta el siguiente ID de error: \`${errorId}\``,\n            flags: 64 // Ephemeral\n        };\n\n        if (interaction.replied || interaction.deferred) {\n            await interaction.followUp(errorMessage);\n        } else {\n            await interaction.reply(errorMessage);\n        }\n    }\n});

client.on('messageCreate', message => {
    handleMessage(message, client);
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