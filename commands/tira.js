const { SlashCommandBuilder } = require('discord.js');
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');
const fs = require('fs').promises;
const path = require('path');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.tira.name'))
        .setDescription(t('commands.tira.description'))
        .addStringOption(option =>
            option.setName(t('commands.tira.options.accion.name'))
                .setDescription(t('commands.tira.options.accion.description'))
                .setRequired(false)
                .addChoices(
                    { name: t('commands.tira.options.accion.choices.info'), value: 'info' },
                )),
    async execute(interaction) {
        const accion = interaction.options.getString(t('commands.tira.options.accion.name'));
        if (accion === 'info') {
            try {
                await interaction.deferReply();
                const dataPath = path.join(__dirname, '..', 'tira-data.json');
                const tiraDataFile = await fs.readFile(dataPath, 'utf8');
                const tiraData = JSON.parse(tiraDataFile);

                const fields = [
                    { name: t('commands.tira.info_fields.author'), value: t('commands.tira.info_fields.author_name') },
                    { name: t('commands.tira.info_fields.license'), value: t('commands.tira.info_fields.license_value') },
                    { name: t('commands.tira.info_fields.interview_snippet'), value: tiraData.interviewSnippet + '...' },
                    { name: t('commands.tira.info_fields.read_more'), value: t('commands.tira.info_fields.read_more_value') }
                ];

                const embed = createStyledEmbed({
                    color: colors.info,
                    title: t('commands.tira.info_embed_title'),
                    url: 'https://biloynano.com/',
                    description: tiraData.readmeDescription,
                    fields: fields,
                    footer: { text: t('commands.tira.info_footer') }
                });

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error(`[${new Date().toISOString()}] Error en el comando /tira info:`, error);
                throw error;
            }
        } else {
            try {
                await interaction.deferReply();
                const randomNumber = Math.floor(Math.random() * 400) + 1;
                const formattedNumber = String(randomNumber).padStart(3, '0');
                const randomImage = `tiraecol-${formattedNumber}.png`;
                const imageUrl = `https://convoyrama.github.io/robotito/img/tira-ecol-master/tira/${randomImage}`;
                
                const embed = createStyledEmbed({
                    color: colors.primary,
                    title: t('commands.tira.comic_embed_title'),
                    url: 'https://biloynano.com/',
                    image: imageUrl,
                    footer: { text: t('commands.tira.comic_footer') }
                });

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error(`[${new Date().toISOString()}] Error en el comando /tira:`, error);
                throw error;
            }
        }
    },
};
