const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.murphy.name'))
        .setDescription(t('commands.murphy.description')),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const filePath = path.join(__dirname, '..', 'murphy.json');
            const murphyFileContent = await fs.readFile(filePath, 'utf8');
            const murphyLaws = JSON.parse(murphyFileContent);
            const randomLaw = murphyLaws[Math.floor(Math.random() * murphyLaws.length)];

            const embed = createStyledEmbed({
                color: colors.warning,
                title: t('commands.murphy.embed_title'),
                description: randomLaw,
                footer: { text: t('commands.murphy.footer') }
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error reading or parsing murphy.json:', error);
            throw error;
        }
    },
};