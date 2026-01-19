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
        // 1. Check Cooldown
        const now = Date.now();
        const userId = interaction.user.id;
        
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

        const opponent = interaction.options.getUser('usuario');

        if (!opponent) {
            return interaction.reply({ content: 'No pude encontrar a ese usuario. ¿Estás seguro de que está en este servidor?', flags: 64 });
        }

        if (opponent.bot) {
            return interaction.reply({ content: 'No puedes desafiar a un bot.', flags: 64 });
        }

        await interaction.deferReply();

        try {
            // 2. Request Game Creation
            const response = await axios.post(`${DIESELDUEL_SERVER_URL}/api/create-race`, {
                challengerId: interaction.user.id,
                challengedId: opponent.id,
                channelId: interaction.channelId
            });

            const { gameId, challengerUrl, challengedUrl } = response.data;

            // 3. Set Cooldown on Success
            cooldowns.set(userId, now);
            setTimeout(() => cooldowns.delete(userId), COOLDOWN_DURATION);

            // 4. Send Links (Ephemeral to avoid leaks, or DM logic could be used)
            // Strategy: Send a public embed announcing the duel, and buttons with links (Ephemeral)
            // Since we can't send different ephemeral msgs to different users easily in one command,
            // we will send the links via ephemeral FollowUp to the Challenger, 
            // and tell the Opponent to click a button to get their link (which triggers a separate interaction handler or just DM).
            
            // SIMPLIFICATION FOR V1: Send links in the reply but hidden behind "Spoilers" or just direct DM?
            // Sending public links allows stream sniping. 
            // Better Approach: Send a generic "Challenge Started" embed publicly.
            // Then send the links via interaction.followUp (only visible to challenger).
            // But how does the opponent get it?
            
            // Revised Approach (Simple & Direct):
            // Robotito sends the public embed.
            // Robotito DMs the links to both users.
            
            let dmStatus = '✅ Enlaces enviados por DM.';
            
            try {
                await interaction.user.send(
                    `🏁 **Tu enlace de carrera:**\n${challengerUrl}\n\n` +
                    `⚠️ **¡Atención!** Tienes **3 minutos** para completar la carrera.\n` +
                    `Los resultados se publicarán cuando ambos terminen o se agote el tiempo.`
                );
            } catch (e) {
                dmStatus = '⚠️ No pude enviarte DM. ¿Tienes los privados abiertos?';
            }

            try {
                await opponent.send(
                    `🏁 **¡Has sido desafiado por ${interaction.user.username}!**\n` +
                    `Tu enlace de carrera:\n${challengedUrl}\n\n` +
                    `⚠️ **¡Atención!** Tienes **3 minutos** para completar la carrera.\n` +
                    `Los resultados se publicarán cuando ambos terminen o se agote el tiempo.`
                );
            } catch (e) {
                dmStatus += `\n⚠️ No pude enviar DM a ${opponent.username}.`;
            }

            const embed = new EmbedBuilder()
                .setColor(colors.warning)
                .setTitle('🔥 ¡Desafío de Drag Racing Iniciado! 🔥')
                .setDescription(`${interaction.user} ha retado a ${opponent} a un duelo de velocidad.`)
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