const { SlashCommandBuilder } = require('discord.js');
const { FAREWELL_MESSAGE_OWN, FAREWELL_MESSAGE_EXTERNAL, colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.despedida.name'))
        .setDescription(t('commands.despedida.description'))
        .addStringOption(option =>
            option.setName(t('commands.despedida.options.tipo.name'))
                .setDescription(t('commands.despedida.options.tipo.description'))
                .setRequired(false)
                .addChoices(
                    { name: t('commands.despedida.options.tipo.choices.propia'), value: 'propia' },
                    { name: t('commands.despedida.options.tipo.choices.ajena'), value: 'ajena' },
                )),
    async execute(interaction) {
        await interaction.deferReply();
        const type = interaction.options.getString(t('commands.despedida.options.tipo.name'));
        let farewellMessage = FAREWELL_MESSAGE_EXTERNAL;
        let title = t('commands.despedida.embed_title_external');
        if (type && type.toLowerCase() === 'propia') {
            farewellMessage = FAREWELL_MESSAGE_OWN;
            title = t('commands.despedida.embed_title_own');
        }

        const codeBlockMessage = "```\n" + farewellMessage + "\n```";

        const embed = createStyledEmbed({
            color: colors.primary,
            title: title,
            description: codeBlockMessage,
            footer: { text: t('commands.despedida.footer') }
        });

        await interaction.editReply({ embeds: [embed] });
    },
};