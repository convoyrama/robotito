const { SlashCommandBuilder } = require('discord.js');
const { colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');
const { truckersMP } = require('../utils/apiClients');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.servidores.name'))
        .setDescription(t('commands.servidores.description')),
    async execute(interaction) {
        await interaction.reply({ content: t('common.command_unavailable'), ephemeral: true });
        return;
        await interaction.deferReply();
        try {
            const response = await truckersMP.get('/servers');
            const servers = response.data.response;
            
            const fields = servers.map(server => ({
                name: t('commands.servidores.server_status_name', {
                    status_icon: server.online ? '🟢' : '🔴',
                    server_name: server.name,
                    server_shortname: server.shortname
                }),
                value: t('commands.servidores.server_status_value', {
                    players: server.players,
                    maxplayers: server.maxplayers,
                    queue: server.queue
                }),
                inline: true
            }));

            const embed = createStyledEmbed({
                color: colors.success,
                title: t('commands.servidores.embed_title'),
                fields: fields,
                footer: { text: t('commands.servidores.footer') }
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error al obtener datos de los servidores de TruckersMP:', error);
            throw error;
        }
    },
};
