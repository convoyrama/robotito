const { SlashCommandBuilder } = require('discord.js');
const { colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');
const { truckersMP } = require('../utils/apiClients');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servidores')
        .setDescription('Muestra el estado de los servidores de TruckersMP.'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const response = await truckersMP.get('/servers');
            const servers = response.data.response;
            
            const fields = servers.map(server => ({
                name: `${server.online ? '🟢' : '🔴'} ${server.name} (${server.shortname})`,
                value: `**Jugadores:** ${server.players} / ${server.maxplayers}\n**En cola:** ${server.queue}`,
                inline: true
            }));

            const embed = createStyledEmbed({
                color: colors.success,
                title: '📡 Estado de los Servidores de TruckersMP',
                fields: fields,
                footer: { text: 'Datos obtenidos de la API de TruckersMP' }
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error al obtener datos de los servidores de TruckersMP:', error);
            throw error;
        }
    },
};
