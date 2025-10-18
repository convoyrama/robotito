const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('murphy')
        .setDescription('Muestra una de las leyes de Murphy.'),
    async execute(interaction) {
        try {
            const filePath = path.join(__dirname, '..', 'murphy.json');
            const murphyLaws = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const randomLaw = murphyLaws[Math.floor(Math.random() * murphyLaws.length)];

            const embed = new EmbedBuilder()
                .setColor(0xE74C3C) // Un color rojo/anaranjado
                .setTitle('Ley de Murphy')
                .setDescription(randomLaw)
                .setFooter({ text: '- Murphy' });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error al leer o procesar el archivo de las leyes de Murphy:', error);
            await interaction.reply({ content: 'No se pudo obtener una ley de Murphy en este momento.', ephemeral: true });
        }
    },
};