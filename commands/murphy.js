const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('murphy')
        .setDescription('Muestra una de las leyes de Murphy.'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const filePath = path.join(__dirname, '..', 'murphy.json');
            const murphyFileContent = await fs.readFile(filePath, 'utf8');
            const murphyLaws = JSON.parse(murphyFileContent);
            const randomLaw = murphyLaws[Math.floor(Math.random() * murphyLaws.length)];

            const embed = createStyledEmbed({
                color: colors.warning,
                title: '📜 Ley de Murphy',
                description: randomLaw,
                footer: { text: '- Murphy' }
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error al leer o procesar el archivo de las leyes de Murphy:', error);
            throw error;
        }
    },
};