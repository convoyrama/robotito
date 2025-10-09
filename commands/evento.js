const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUpcomingEvents } = require('../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('evento')
        .setDescription('Muestra los próximos eventos programados.')
        .addStringOption(option =>
            option.setName('periodo')
                .setDescription('El periodo de tiempo para mostrar los eventos.')
                .setRequired(false)
                .addChoices(
                    { name: 'próximo', value: 'proximo' },
                    { name: 'semana', value: 'semana' },
                    { name: 'mes', value: 'mes' },
                )),
    async execute(interaction) {
        await interaction.deferReply();
        if (!interaction.guild) {
            await interaction.editReply('Este comando solo funciona en un servidor.');
            return;
        }

        const periodo = interaction.options.getString('periodo') || 'proximo';
        let daysLimit = 0;
        let title = '';

        switch (periodo) {
            case 'semana':
                daysLimit = 7;
                title = '📅 Próximos Eventos de la Semana';
                break;
            case 'mes':
                daysLimit = 30;
                title = '📅 Próximos Eventos del Mes';
                break;
            default: // proximo
                daysLimit = 0;
                break;
        }

        const upcomingEvents = await getUpcomingEvents(interaction.guild, daysLimit);

        if (upcomingEvents.size === 0) {
            let message = 'Lo siento, no hay eventos programados próximos en este servidor.';
            if (periodo === 'semana') {
                message = 'No hay eventos programados para esta semana.';
            } else if (periodo === 'mes') {
                message = 'No hay eventos programados para este mes.';
            }
            await interaction.editReply(message);
            return;
        }

        if (periodo === 'proximo') {
            const nextEvent = upcomingEvents.first();
            const embed = new EmbedBuilder()
                .setColor(0x8A2BE2)
                .setTitle(`📅 Próximo Evento: ${nextEvent.name}`)
                .setURL(nextEvent.url)
                .setDescription(
                    `**Descripción:** ${nextEvent.description || 'Sin descripción.'}\n` +
                    `**Inicio:** <t:${Math.floor(nextEvent.scheduledStartTimestamp / 1000)}:F> (<t:${Math.floor(nextEvent.scheduledStartTimestamp / 1000)}:R>)\n` +
                    `**Ubicación:** ${nextEvent.entityMetadata?.location || nextEvent.channel?.name || 'N/A'}\n` +
                    `**Creador:** ${nextEvent.creator?.tag || 'Desconocido'}`
                )
                .setFooter({ text: '¡No te lo pierdas!' });
            const coverImage = nextEvent.coverImageURL();
            if (coverImage) embed.setThumbnail(coverImage);
            await interaction.editReply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder().setColor(0x8A2BE2).setTitle(title);
            let description = '';
            upcomingEvents.forEach(event => {
                description += `**[${event.name}](${event.url})**\n` + `Inicia: <t:${Math.floor(event.scheduledStartTimestamp / 1000)}:F> (<t:${Math.floor(event.scheduledStartTimestamp / 1000)}:R>)\n\n`;
            });
            embed.setDescription(description);
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
