const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vtc')
        .setDescription('Muestra la lista de VTCs de la comunidad.'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const embed = new EmbedBuilder().setColor(0x008000).setTitle('🚚 Comunidad');
            const vtcFileContent = await fs.promises.readFile('./vtcs.json', 'utf8');
            const vtcData = JSON.parse(vtcFileContent);
            vtcData.forEach(countryData => {
                const vtcList = countryData.vtcs.map(vtc => vtc.discord ? `[${vtc.name}](${vtc.discord})` : vtc.name).join('\n');
                if (vtcList) embed.addFields({ name: countryData.country, value: vtcList, inline: true });
            });
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error reading or parsing vtcs.json:', error);
            await interaction.editReply('Hubo un error al cargar la lista de VTCs.');
        }
    },
};
