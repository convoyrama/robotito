const { SlashCommandBuilder } = require('discord.js');
const { createStyledEmbed } = require('../utils/helpers');
const { t } = require('../utils/localization');
const { colors } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.manifiesto.name'))
        .setDescription(t('commands.manifiesto.description')),
    async execute(interaction) {
        const embed = createStyledEmbed({
            color: colors.primary,
            title: t('commands.manifiesto.embed_title'),
            description: t('commands.manifiesto.description'),
            fields: [
                { 
                    name: '📣 Lema', 
                    value: `*${t('commands.manifiesto.motto')}*`, 
                    inline: false 
                },
                { 
                    name: t('commands.manifiesto.fields.about_title'), 
                    value: t('commands.manifiesto.fields.about_content'), 
                    inline: false 
                },
                { 
                    name: t('commands.manifiesto.fields.rules_title'), 
                    value: t('commands.manifiesto.fields.rules_content'), 
                    inline: false 
                },
                { 
                    name: t('commands.manifiesto.fields.req_title'), 
                    value: t('commands.manifiesto.fields.req_content'), 
                    inline: false 
                }
            ],
            footer: { text: t('commands.manifiesto.footer') }
        });

        // Intentar usar la imagen del servidor como thumbnail si está disponible
        if (interaction.guild && interaction.guild.iconURL()) {
            embed.setThumbnail(interaction.guild.iconURL());
        }

        await interaction.reply({ embeds: [embed] });
    },
};
