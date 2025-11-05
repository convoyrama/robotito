const { SlashCommandBuilder } = require('discord.js');
const { SPAM_TEXTS, colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Envía un mensaje aleatorio de la lista de textos predefinidos.'),
    async execute(interaction) {
        await interaction.deferReply();
        if (!interaction.channel.permissionsFor(interaction.client.user).has('EmbedLinks')) {
            await interaction.editReply('No tengo permiso para enviar mensajes incrustados (Embeds) en este canal. Por favor, contacta a un administrador.');
            return;
        }
        if (SPAM_TEXTS.length === 0) {
            await interaction.editReply('No hay textos de spam configurados.');
            return;
        }
        const randomIndex = Math.floor(Math.random() * SPAM_TEXTS.length);
        const randomSpamText = SPAM_TEXTS[randomIndex];

        const embed = createStyledEmbed({
            color: colors.error,
            title: '🚨 Mensaje Aleatorio (SPAM)',
            description: `> ${randomSpamText}`,
            footer: { text: '¡Copia y pega con responsabilidad!' }
        });

        await interaction.editReply({ embeds: [embed] });
    },
};
