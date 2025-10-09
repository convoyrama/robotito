const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { SPAM_TEXTS } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Envía un mensaje aleatorio de la lista de textos predefinidos.'),
    async execute(interaction) {
        await interaction.deferReply();
        if (SPAM_TEXTS.length === 0) {
            await interaction.editReply('No hay textos de spam configurados.');
            return;
        }
        const randomIndex = Math.floor(Math.random() * SPAM_TEXTS.length);
        const randomSpamText = SPAM_TEXTS[randomIndex];
        const embed = new EmbedBuilder().setColor(0xFF0000).setTitle('🚨 Mensaje Aleatorio (SPAM)').setDescription(randomSpamText).setFooter({ text: '¡Copia y pega con responsabilidad!' });
        await interaction.editReply({ embeds: [embed] });
    },
};
