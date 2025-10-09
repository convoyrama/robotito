const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Comprueba si el bot está respondiendo.'),
    async execute(interaction) {
        await interaction.reply({ content: 'Pong!', flags: 64 });
    },
};
