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
        // 1. Resolve User (Robust Method)
        const now = Date.now();
        const userId = interaction.user.id;
        
        let opponent = interaction.options.getUser('usuario');
        
        // Si falla getUser, intentamos obtener el ID crudo y hacer fetch
        if (!opponent) {
            const opponentId = interaction.options.get('usuario')?.value;
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

        const isSelfChallenge = opponent.id === userId;

        // 2. Check Cooldown (Only if NOT self-challenging)
        if (!isSelfChallenge && cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + COOLDOWN_DURATION;
            if (now < expirationTime) {
                const timeLeft = Math.round((expirationTime - now) / 1000);
                return interaction.reply({ 
                    content: `⏳ Debes esperar ${timeLeft} segundos antes de iniciar otro desafío.`, 
                    flags: 64 
                });
            }
        }

        if (opponent.bot) {
            return interaction.reply({ content: 'No puedes desafiar a un bot.', flags: 64 });
        }

        await interaction.deferReply();

        try {
            // 3. Request Game Creation
            const response = await axios.post(`${DIESELDUEL_SERVER_URL}/api/create-race`, {
                challengerId: userId,
                challengedId: opponent.id,
                channelId: interaction.channelId
            });

            const { gameId, challengerUrl, challengedUrl } = response.data;

            // 4. Set Cooldown on Success (If not self)
            if (!isSelfChallenge) {
                cooldowns.set(userId, now);
                setTimeout(() => cooldowns.delete(userId), COOLDOWN_DURATION);
            }

            let dmStatus = '✅ Enlaces enviados por DM.';
            
            if (isSelfChallenge) {
                try {
                    await interaction.user.send(
                        `🏁 **MODO PRUEBA: Auto-Desafío**\n\n` +
                        `👤 **Como Retador (P1):**\n${challengerUrl}\n\n` +
                        `👤 **Como Retado (P2):**\n${challengedUrl}\n\n` +
                        `⚠️ Tienes **3 minutos** para completar ambas carreras.`
                    );
                } catch (e) {
                    dmStatus = '⚠️ No pude enviarte DM.';
                }
            } else {
                try {
                    await interaction.user.send(
                        `🏁 **Tu enlace de carrera:**\n${challengerUrl}\n\n` +
                        `⚠️ **¡Atención!** Tienes **3 minutos** para completar la carrera.`
                    );
                } catch (e) {
                    dmStatus = '⚠️ No pude enviarte DM.';
                }

                try {
                    await opponent.send(
                        `🏁 **¡Has sido desafiado por ${interaction.user.username}!**\n` +
                        `Tu enlace de carrera:\n${challengedUrl}\n\n` +
                        `⚠️ **¡Atención!** Tienes **3 minutos** para completar la carrera.`
                    );
                } catch (e) {
                    dmStatus += `\n⚠️ No pude enviar DM a ${opponent.username}.`;
                }
            }

            const embed = new EmbedBuilder()
                .setColor(isSelfChallenge ? colors.info : colors.warning)
                .setTitle(isSelfChallenge ? '🛠️ Prueba de Carrera (Auto-Duelo)' : '🔥 ¡Desafío de Drag Racing Iniciado! 🔥')
                .setDescription(isSelfChallenge ? 
                    `**${interaction.user.username}** está probando los motores solo.` : 
                    `${interaction.user} ha retado a ${opponent} a un duelo de velocidad.`)
                .addFields(
                    { name: 'Estado', value: 'Esperando corredores...', inline: true },
                    { name: 'Info', value: 'Revisen sus Mensajes Directos (DM) para entrar a la pista.', inline: false }
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