const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { DIESELDUEL_SERVER_URL, colors } = require('../config.js');
const axios = require('axios');

// Cooldown Map: userId -> timestamp
const cooldowns = new Map();
const COOLDOWN_DURATION = 2 * 60 * 1000; // 2 Minutes

module.exports = {
    data: new SlashCommandBuilder()
        .setName('desafiar')
        .setDescription('Desafía a otro usuario a una carrera de Drag Racing.')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('El usuario al que quieres desafiar')
                .setRequired(true)),
    
    async execute(interaction) {
        // 1. Resolve User
        const now = Date.now();
        const userId = interaction.user.id;
        
        // Intentamos obtener el usuario buscando por ambos nombres posibles
        let opponent = interaction.options.getUser('usuario') || interaction.options.getUser('oponente');
        
        // Si falla getUser, intentamos obtener el ID crudo y hacer fetch
        if (!opponent) {
            const rawOption = interaction.options.get('usuario') || interaction.options.get('oponente');
            const opponentId = rawOption?.value;
            if (opponentId) {
                try {
                    opponent = await interaction.client.users.fetch(opponentId);
                } catch (e) {
                    console.error('Error fetching user:', e);
                }
            }
        }

        if (!opponent) {
            return interaction.reply({ content: '❌ No pude encontrar al usuario. Intenta usar su ID si la mención falla.', flags: 64 });
        }

        if (opponent.id === userId) {
            return interaction.reply({ content: '❌ No puedes desafiarte a ti mismo. Para probar el juego, usa tu entorno local.', flags: 64 });
        }

        if (opponent.bot) {
            // Permitir desafiar a Robotito (self challenge)
            if (opponent.id === interaction.client.user.id) {
                // Es un desafío contra el bot (Modo Robotito Tramposo)
            } else {
                return interaction.reply({ content: 'No puedes desafiar a un bot.', flags: 64 });
            }
        }

        // 2. Check Cooldown
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + COOLDOWN_DURATION;
            if (now < expirationTime) {
                const timeLeft = Math.round((expirationTime - now) / 1000);
                return interaction.reply({ 
                    content: `⏳ Debes esperar ${timeLeft} segundos antes de iniciar otro desafío.`, 
                    flags: 64 
                });
            }
        }

        await interaction.deferReply();

        try {
            const isBotChallenge = opponent.id === interaction.client.user.id;

            // 3. Request Game Creation
            const response = await axios.post(`${DIESELDUEL_SERVER_URL}/api/create-race`, {
                challengerId: userId,
                challengedId: opponent.id,
                channelId: interaction.channelId,
                isBotChallenge: isBotChallenge
            });

            const { gameId, challengerUrl, challengedUrl, challengerAppUrl, challengedAppUrl } = response.data;

            // 4. Set Cooldown on Success
            cooldowns.set(userId, now);
            setTimeout(() => cooldowns.delete(userId), COOLDOWN_DURATION);

            let dmStatus = isBotChallenge ? '✅ Enlace enviado por DM.' : '✅ Enlaces enviados por DM.';
            
            // Helper function to send DM with buttons
            const sendGameDM = async (user, webUrl, appUrl, isOpponent = false) => {
                const title = isOpponent 
                    ? `🏁 **¡Has sido desafiado por ${interaction.user.username}!**` 
                    : `🏁 **Tu enlace de carrera:**`;

                // 1. Text Message (Raw links for maximum compatibility)
                const textMessage = `${title}\n\n` +
                    `🌐 **Web:** ${webUrl}\n` +
                    `📱 **App Link:** ${appUrl}\n\n` +
                    `⚠️ Tienes 3 minutos.`;

                // 2. Embed with Buttons
                const embed = new EmbedBuilder()
                    .setColor(colors.warning)
                    .setTitle('🏎️ Diesel Duel - Acceso')
                    .setDescription('Elige cómo quieres jugar:')
                    .addFields(
                        { name: '🌐 Desde PC/Navegador', value: 'Usa el botón "Web" o el primer enlace.' },
                        { name: '📱 Desde Android', value: 'Si tienes la App instalada, usa el botón "App" o el enlace dieselduel://' }
                    );

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Jugar en Web')
                            .setStyle(ButtonStyle.Link)
                            .setURL(webUrl),
                        
                        // APP BUTTON (Using Web Bridge)
                        // This links to the website with ?launchApp=true
                        // The website will then redirect to dieselduel://
                        new ButtonBuilder()
                            .setLabel('Abrir App')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`${webUrl}&launchApp=true`) 
                    );

                try {
                    // Send message with both buttons
                    await user.send({ content: textMessage, embeds: [embed], components: [row] });
                } catch (e) {
                    console.log("Error sending buttons, falling back to text", e);
                    await user.send({ content: textMessage, embeds: [embed] });
                }
            };

            try {
                await sendGameDM(interaction.user, challengerUrl, challengerAppUrl);
            } catch (e) {
                console.error("Error sending DM to challenger:", e);
                dmStatus = '⚠️ No pude enviarte DM.';
            }

            if (isBotChallenge) {
                dmStatus += '\n🤖 Robotito ya está en la grilla esperando para humillarte.';
            } else {
                try {
                    await sendGameDM(opponent, challengedUrl, challengedAppUrl, true);
                } catch (e) {
                    console.error("Error sending DM to opponent:", e);
                    dmStatus += `\n⚠️ No pude enviar DM a ${opponent.username}.`;
                }
            }

            const embed = new EmbedBuilder()
                .setColor(colors.warning)
                .setTitle('🔥 ¡Desafío de Drag Racing Iniciado! 🔥')
                .setDescription(`${interaction.user} ha retado a ${opponent} a un duelo de velocidad.`)
                .addFields(
                    { name: 'Estado', value: isBotChallenge ? '🚩 Robotito ya está en la pista.' : 'Esperando corredores...', inline: true },
                    { name: 'Info', value: isBotChallenge ? 'Revisá tus DM y preparate para perder.' : 'Revisen sus Mensajes Directos (DM) para entrar a la pista.', inline: false }
                )
                .setFooter({ text: dmStatus });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error creating race:', error);
            
            if (error.response && error.response.status === 503) {
                return interaction.editReply('⛔ **Las pistas están llenas.**\nActualmente hay 3 carreras en curso. Por favor espera unos minutos e inténtalo de nuevo.');
            }

            await interaction.editReply('Hubo un error al conectar con el servidor de carreras.');
        }
    },
};