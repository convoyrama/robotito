const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs').promises;
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vtc')
        .setDescription('Muestra la lista de VTCs de la comunidad.'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const vtcFileContent = await fs.readFile('./vtcs.json', 'utf8');
            const vtcData = JSON.parse(vtcFileContent);
            
            const fields = vtcData.map(countryData => {
                const vtcList = countryData.vtcs.map(vtc => vtc.discord ? `[${vtc.name}](${vtc.discord})` : vtc.name).join('\n');
                return { name: countryData.country, value: vtcList || 'N/A', inline: true };
            }).filter(field => field.value !== 'N/A');

            const embed = createStyledEmbed({
                color: colors.primary,
                title: '🚚 VTCs de la Comunidad',
                fields: fields
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error reading or parsing vtcs.json:', error);
            throw error;
        }
    },
};
