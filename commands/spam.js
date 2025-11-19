const { SlashCommandBuilder } = require('discord.js');
const { SPAM_TEXTS, colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.spam.name'))
        .setDescription(t('commands.spam.description')),
    async execute(interaction) {
        await interaction.deferReply();
        if (!interaction.channel.permissionsFor(interaction.client.user).has('EmbedLinks')) {
            await interaction.editReply(t('common.no_embed_permission'));
            return;
        }
        if (SPAM_TEXTS.length === 0) {
            await interaction.editReply(t('common.no_spam_texts'));
            return;
        }
        const randomIndex = Math.floor(Math.random() * SPAM_TEXTS.length);
        const randomSpamText = SPAM_TEXTS[randomIndex];

        const codeBlockMessage = "```\n" + randomSpamText + "\n```";

        const embed = createStyledEmbed({
            color: colors.error,
            title: t('commands.spam.embed_title'),
            description: codeBlockMessage,
            footer: { text: t('commands.spam.footer') }
        });

        await interaction.editReply({ embeds: [embed] });
    },
};