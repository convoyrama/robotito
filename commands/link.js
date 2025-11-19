const { SlashCommandBuilder } = require('discord.js');
const { createStyledEmbed } = require('../utils/helpers');
const { colors, usefulLinks } = require('../config');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.link.name'))
        .setDescription(t('commands.link.description')),
    async execute(interaction) {
        await interaction.deferReply();

        const embed = createStyledEmbed({
            color: colors.primary,
            title: t('commands.link.embed_title'),
            description: t('commands.link.embed_description'),
            fields: usefulLinks,
            footer: { text: t('commands.link.footer') }
        });

        await interaction.editReply({ embeds: [embed] });
    },
};
