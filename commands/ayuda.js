const { SlashCommandBuilder } = require('discord.js');
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.ayuda.name'))
        .setDescription(t('commands.ayuda.description')),
    async execute(interaction) {
        const fields = Object.entries(t('commands.ayuda.fields')).map(([key, value]) => ({
            name: `/${key}`,
            value: value
        }));

        const embed = createStyledEmbed({
            color: colors.primary,
            title: t('commands.ayuda.embed_title'),
            description: t('commands.ayuda.embed_description'),
            fields: fields,
            footer: { text: t('commands.ayuda.footer') }
        });

        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};
