const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const http = require('http');
const crypto = require('crypto');
const { token } = require('./config.js');
const { t } = require('./utils/localization');

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

if (!fs.existsSync(commandsPath)) {
    console.error(t('common.commands_dir_not_found'));
    process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(t('common.module_missing_properties', { filePath }));
        }
    } catch (error) {
        console.error(`Error loading command at ${filePath}:`, error);
    }
}

client.once('clientReady', () => {
    console.log('clientReady event fired.');
    console.log(`Robotito bot connected as ${client.user.tag}!`);
    client.user.setActivity('Convoyrama', { type: ActivityType.Watching });
});

const { handleMessage } = require('./utils/messageHandlers.js');

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(t('common.command_not_found', { commandName: interaction.commandName }));
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        const errorId = crypto.randomBytes(8).toString('hex');
        console.error(`Error ID: ${errorId} | Command: '${interaction.commandName}' | Error:`, error);

        const errorMessage = {
            content: t('common.error_generic', { errorId }),
            flags: 64 // Ephemeral
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

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
    console.error('❌ Error: Token is not configured in config.js');
    process.exit(1);
}

(async () => {
    try {
        await client.login(token);
        console.log('Login successful!');
    } catch (error) {
        console.error('❌ Error connecting to Discord:', error.message);
        process.exit(1);
    }
})();

// Keep-alive server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive!\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Keep-alive server running on port ${PORT}`);
});