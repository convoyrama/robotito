const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { TRUCKERSMP_API_BASE_URL } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servidores')
        .setDescription('Muestra el estado de los servidores de TruckersMP.'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const response = await axios.get(`${TRUCKERSMP_API_BASE_URL}/servers`);
            const servers = response.data.response;
            const embed = new EmbedBuilder().setColor(0x00FF00).setTitle('Estado de los Servidores de TruckersMP');
            servers.forEach(server => {
                embed.addFields({ name: `${server.name} (${server.shortname})`, value: `**Jugadores:** ${server.players} / ${server.maxplayers}\n**En cola:** ${server.queue}\n**Estado:** ${server.online ? 'Online' : 'Offline'}`, inline: true });
            });
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error al obtener datos de los servidores de TruckersMP:', error);
            if (error.response) {
                await interaction.editReply(`Error al consultar la API de TruckersMP: ${error.response.status} ${error.response.statusText}`);
            } else {
                await interaction.editReply('Lo siento, hubo un error al consultar la API de TruckersMP.');
            }
        }
    },
};
