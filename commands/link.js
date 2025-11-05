const { SlashCommandBuilder } = require('discord.js');
const { createStyledEmbed } = require('../utils/helpers');
const { colors, usefulLinks } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Muestra enlaces útiles de Convoyrama y el Discord.'),
    async execute(interaction) {
        await interaction.deferReply();

        const embed = createStyledEmbed({
            color: colors.primary,
            title: '🔗 Enlaces Útiles de Convoyrama',
            description: 'Aquí tienes algunos enlaces importantes:',
            fields: usefulLinks,
            footer: { text: '¡Explora y únete a la diversión!' }
        });

        await interaction.editReply({ embeds: [embed] });
    },
};
