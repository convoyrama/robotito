const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { DIESELDUEL_SERVER_URL } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('desafiar')
        .setDescription('Desafía a otro jugador a un 1/4 de milla en Diesel Duel')
        .addUserOption(option =>
            option.setName('oponente')
                .setDescription('El camionero al que quieres retar')
                .setRequired(true)),
    async execute(interaction) {
        const oponente = interaction.options.getUser('oponente');
        const retador = interaction.user;

        if (oponente.bot) {
            return interaction.reply({ content: 'No puedes desafiar a un bot (todavía).', ephemeral: true });
        }

        // Permitimos auto-reto para pruebas (puedes comentarlo luego)
        // if (oponente.id === retador.id) { ... }

        await interaction.deferReply({ ephemeral: false }); // Público para que se vea el "beef"

        try {
            // Solicitamos la creación de la sala al servidor del juego
            const response = await axios.post(`${DIESELDUEL_SERVER_URL}/api/create-race`, {
                challengerId: retador.id,
                challengedId: oponente.id,
                channelId: interaction.channel.id
            });

            const { challengerUrl, challengedUrl } = response.data;

            // Anuncio público
            await interaction.editReply({
                content: `🔥 **DIESEL DUEL** 🔥\n¡${retador} ha desafiado a ${oponente} a quemar llanta!`,
            });

            // Envío de llaves (Links) por DM
            let dmsSent = 0;
            try {
                await retador.send(`🔑 Tu llave de encendido contra ${oponente.username}: \n${challengerUrl}`);
                dmsSent++;
            } catch (e) {
                console.warn(`No se pudo enviar DM a ${retador.username}`);
            }

            try {
                await oponente.send(`🔑 ¡Has sido desafiado por ${retador.username}! Tu llave: \n${challengedUrl}`);
                dmsSent++;
            } catch (e) {
                console.warn(`No se pudo enviar DM a ${oponente.username}`);
            }

            // Confirmación discreta
            if (dmsSent < 2) {
                await interaction.followUp({ content: '⚠️ No pude enviar el DM a uno de los dos. Verificad que tenéis los DMs abiertos.', ephemeral: true });
            }

        } catch (error) {
            console.error('Error al conectar con Diesel Duel Server:', error.message);
            await interaction.editReply({
                content: `❌ El motor no arranca. No pude conectar con el servidor de carreras.`,
            });
        }
    },
};