const { SlashCommandBuilder } = require('discord.js');
const { getUpcomingEvents, createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');

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
        if (!interaction.channel.permissionsFor(interaction.client.user).has('EmbedLinks')) {
            await interaction.editReply('No tengo permiso para enviar mensajes incrustados (Embeds) en este canal. Por favor, contacta a un administrador.');
            return;
        }
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
            const description = 
                `**Descripción:** ${nextEvent.description || 'Sin descripción.'}\n` +
                `**Inicio:** <t:${Math.floor(nextEvent.scheduledStartTimestamp / 1000)}:F> (<t:${Math.floor(nextEvent.scheduledStartTimestamp / 1000)}:R>)\n` +
                `**Ubicación:** ${nextEvent.entityMetadata?.location || nextEvent.channel?.name || 'N/A'}\n` +
                `**Creador:** ${nextEvent.creator?.tag || 'Desconocido'}`;

            const embed = createStyledEmbed({
                color: colors.info,
                title: `📅 Próximo Evento: ${nextEvent.name}`,
                url: nextEvent.url,
                description: description,
                thumbnail: nextEvent.coverImageURL() || null,
                footer: { text: '¡No te lo pierdas!' }
            });

            await interaction.editReply({ embeds: [embed] });
        } else {
            let description = '';
            upcomingEvents.forEach(event => {
                description += `**[${event.name}](${event.url})**\n` + `Inicia: <t:${Math.floor(event.scheduledStartTimestamp / 1000)}:F> (<t:${Math.floor(event.scheduledStartTimestamp / 1000)}:R>)\n\n`;
            });

            const embed = createStyledEmbed({
                color: colors.info,
                title: title,
                description: description
            });

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
