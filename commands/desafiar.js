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

            const { gameId, challengerUrl, challengedUrl } = response.data;

            // 4. Set Cooldown on Success
            cooldowns.set(userId, now);
            setTimeout(() => cooldowns.delete(userId), COOLDOWN_DURATION);

            let dmStatus = '✅ Enlaces enviados por DM.';
            
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