const { SlashCommandBuilder } = require('discord.js');
const { getUpcomingEvents, createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.evento.name'))
        .setDescription(t('commands.evento.description'))
        .addStringOption(option =>
            option.setName(t('commands.evento.options.periodo.name'))
                .setDescription(t('commands.evento.options.periodo.description'))
                .setRequired(false)
                .addChoices(
                    { name: t('commands.evento.options.periodo.choices.proximo'), value: 'proximo' },
                    { name: t('commands.evento.options.periodo.choices.semana'), value: 'semana' },
                    { name: t('commands.evento.options.periodo.choices.mes'), value: 'mes' },
                )),
    async execute(interaction) {
        await interaction.deferReply();
        if (!interaction.channel.permissionsFor(interaction.client.user).has('EmbedLinks')) {
            await interaction.editReply(t('common.no_embed_permission'));
            return;
        }
        if (!interaction.guild) {
            await interaction.editReply(t('common.guild_only'));
            return;
        }

        const periodo = interaction.options.getString(t('commands.evento.options.periodo.name')) || 'proximo';
        let daysLimit = 0;
        let title = '';

        switch (periodo) {
            case 'semana':
                daysLimit = 7;
                title = t('commands.evento.title_week');
                break;
            case 'mes':
                daysLimit = 30;
                title = t('commands.evento.title_month');
                break;
            default: // proximo
                daysLimit = 0;
                break;
        }

        const upcomingEvents = await getUpcomingEvents(interaction.guild, daysLimit);

        if (upcomingEvents.size === 0) {
            let message = t('commands.evento.no_events');
            if (periodo === 'semana') {
                message = t('commands.evento.no_events_week');
            } else if (periodo === 'mes') {
                message = t('commands.evento.no_events_month');
            }
            await interaction.editReply(message);
            return;
        }

        if (periodo === 'proximo') {
            const nextEvent = upcomingEvents.first();
            const description =
                `**${t('commands.evento.field_description')}:** ${nextEvent.description || t('commands.evento.field_no_description')}\n` +
                `**${t('commands.evento.field_start')}:** <t:${Math.floor(nextEvent.scheduledStartTimestamp / 1000)}:F> (<t:${Math.floor(nextEvent.scheduledStartTimestamp / 1000)}:R>)\n` +
                `**${t('commands.evento.field_location')}:** ${nextEvent.entityMetadata?.location || nextEvent.channel?.name || 'N/A'}\n` +
                `**${t('commands.evento.field_creator')}:** ${nextEvent.creator?.tag || t('commands.evento.field_unknown_creator')}`;

            const embed = createStyledEmbed({
                color: colors.info,
                title: t('commands.evento.next_event_title', { eventName: nextEvent.name }),
                url: nextEvent.url,
                description: description,
                thumbnail: nextEvent.coverImageURL() || null,
                footer: { text: t('commands.evento.next_event_footer') }
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

