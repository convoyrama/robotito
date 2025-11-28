const { SlashCommandBuilder, User } = require('discord.js');
const axios = require('axios'); // Import axios
const { TRUCKGIOH_SERVER_URL } = require('../config'); // Import TRUCKGIOH_SERVER_URL from config
const { t } = require('../utils/localization'); // Changed to relative path.

module.exports = {
    data: new SlashCommandBuilder()
        .setName('desafiar')
        .setDescription('Desafía a otro jugador a una partida de Truckgioh')
        .addUserOption(option =>
            option.setName('oponente')
                .setDescription('El jugador al que quieres desafiar')
                .setRequired(true)),
    async execute(interaction) {
        const oponente = interaction.options.getUser('oponente');
        const retador = interaction.user;

        if (oponente.bot) {
            return interaction.reply({ content: 'No puedes desafiar a un bot.', ephemeral: true });
        }

        /*
        if (oponente.id === retador.id) {
            return interaction.reply({ content: 'No puedes desafiarte a ti mismo.', ephemeral: true });
        }
        */

        await interaction.deferReply({ ephemeral: true }); // Defer the reply as game creation might take time

        try {
            const response = await axios.post(`${TRUCKGIOH_SERVER_URL}/api/create-game`, {
                challengerId: retador.id,
                challengedId: oponente.id,
                channelId: interaction.channel.id // Pass the channel ID for results
            });

            const { challengerUrl, challengedUrl } = response.data;

            await interaction.editReply({
                content: `¡${retador.username} ha desafiado a ${oponente.username} a una partida de Truckgioh!`,
                ephemeral: false // Make initial challenge public
            });

            // Send DMs to players
            await retador.send(`Tu enlace para la partida contra ${oponente.username} es: ${challengerUrl}`);
            await oponente.send(`Has sido desafiado por ${retador.username}. Tu enlace para la partida es: ${challengedUrl}`);

            // Also send ephemeral messages in the channel as a fallback or additional info
            await interaction.followUp({ content: `¡${retador.username} y ${oponente.username}! Les he enviado los enlaces de la partida por mensaje directo. ¡Revisen sus DMs!`, ephemeral: true });

        } catch (error) {
            console.error('Error al crear la partida de Truckgioh:', error.response ? error.response.data : error.message);
            await interaction.editReply({
                content: `Hubo un error al intentar iniciar la partida con ${oponente.username}. Por favor, inténtalo de nuevo más tarde.`,
                ephemeral: true
            });
        }
    },
};
