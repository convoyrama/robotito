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

// Endpoint for Diesel Duel Results (Time Attack)
app.post('/api/diesel-result', async (req, res) => {
    const { playerId, time, speed, channelId, gameId } = req.body;

    if (!playerId || !time || !channelId) {
        return res.status(400).send('Missing parameters.');
    }

    try {
        const user = await client.users.fetch(playerId);
        const channel = await client.channels.fetch(channelId);
        
        // 1. Load Records
        const fs = require('fs');
        const path = require('path');
        const recordsPath = path.join(__dirname, 'diesel_records.json');
        
        let records = [];
        if (fs.existsSync(recordsPath)) {
            records = JSON.parse(fs.readFileSync(recordsPath));
        }

        // 2. Check for New Record
        const newRecord = {
            username: user.username,
            userId: user.id,
            time: Number(time),
            speed: Number(speed),
            date: new Date().toISOString()
        };

        // Add to list, Sort by Time (Ascending), Take Top 3
        const previousBest = records[0] ? records[0].time : Infinity;
        
        records.push(newRecord);
        records.sort((a, b) => a.time - b.time); // Lower time is better
        records = records.slice(0, 3);
        
        // Update Ranks
        records = records.map((r, i) => ({ ...r, position: i + 1 }));

        fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2));

        // 3. Announce
        const isWorldRecord = newRecord.time < previousBest;
        const rankIndex = records.findIndex(r => r.time === newRecord.time && r.userId === newRecord.userId);
        const madeItToTop = rankIndex !== -1;

        const embed = new EmbedBuilder()
            .setColor(isWorldRecord ? '#FFD700' : colors.primary)
            .setTitle(isWorldRecord ? '🚨 NUEVO RÉCORD MUNDIAL 🚨' : '🏁 Carrera Finalizada')
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .addFields(
                { name: 'Tiempo', value: `⏱️ ${(time / 1000).toFixed(3)}s`, inline: true },
                { name: 'Velocidad', value: `💨 ${speed} km/h`, inline: true }
            );

        if (madeItToTop) {
            embed.setDescription(`¡<@${user.id}> ha entrado al **Top ${rankIndex + 1}**!`);
        } else {
            embed.setDescription(`<@${user.id}> ha cruzado la meta.`);
        }
        
        embed.setFooter({ text: `ID Carrera: ${gameId.substring(0, 8)}...` });

        if (channel) await channel.send({ embeds: [embed] });

        res.status(200).send('Result processed.');
    } catch (error) {
        console.error('Error processing Diesel Duel result:', error);
        res.status(500).send(error.message);
    }
});

const PORT = process.env.PORT || 3000; // Use port 3000 as defined in the config memory
app.listen(PORT, () => {
    console.log(`Express server for game results running on port ${PORT}`);
});