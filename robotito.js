const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const crypto = require('crypto');
const express = require('express'); // Import express
const bodyParser = require('body-parser'); // Import body-parser
const { token, ROBOTITO_RESULTS_URL, guildId, colors } = require('./config.js'); // Import ROBOTITO_RESULTS_URL, guildId and colors
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

    // SECURITY CHECK: Guild Lock
    if (guildId && interaction.guildId !== guildId) {
        console.warn(`Unauthorized command attempt from guild ${interaction.guildId} (User: ${interaction.user.tag})`);
        await interaction.reply({ content: '⛔ This bot is private and only works in its home server.', flags: 64 });
        return;
    }

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

// Express server for game results
const app = express();
app.use(bodyParser.json());

// Extract the path from ROBOTITO_RESULTS_URL for the endpoint
const resultsPath = new URL(ROBOTITO_RESULTS_URL).pathname;

app.post(resultsPath, async (req, res) => {
    const { gameId, winnerId, loserId, channelId } = req.body;

    if (!gameId || !winnerId || !loserId || !channelId) {
        return res.status(400).send('Missing required game result parameters.');
    }

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            console.error(`Channel with ID ${channelId} not found.`);
            return res.status(404).send('Channel not found.');
        }

        const winner = await client.users.fetch(winnerId);
        const loser = await client.users.fetch(loserId);

        const embed = new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle(t('commands.game_results.title')) // Assuming you'll add localization for this
            .setDescription(t('commands.game_results.description', { winner: winner.username, loser: loser.username }))
            .addFields(
                { name: t('commands.game_results.winner_field'), value: `<@${winner.id}>`, inline: true },
                { name: t('commands.game_results.loser_field'), value: `<@${loser.id}>`, inline: true }
            )
            .setThumbnail(winner.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: t('commands.game_results.footer', { gameId: gameId }) });

        await channel.send({ embeds: [embed] });

        console.log(`Game Result Announced: Game ID: ${gameId}, Winner: ${winner.username}, Loser: ${loser.username}, Channel: ${channel.name}`);
        res.status(200).send('Game result received and announced successfully.');

    } catch (error) {
        console.error(`Error processing game result for Game ID ${gameId}:`, error);
        res.status(500).send('Error processing game result.');
    }
});

const PORT = process.env.PORT || 3000; // Use port 3000 as defined in the config memory
app.listen(PORT, () => {
    console.log(`Express server for game results running on port ${PORT}`);
});