const { SlashCommandBuilder } = require('discord.js');
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');
const { jokeApi } = require('../utils/apiClients');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tito')
        .setDescription('Tito te cuenta un dato inútil y absurdo.'),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const response = await jokeApi.get('/joke/Any?lang=es&blacklistFlags=nsfw,religious,political,racist,sexist,explicit');
            const jokeData = response.data;
            let jokeText;
            if (jokeData.type === 'single') {
                jokeText = jokeData.joke;
            } else {
                jokeText = `${jokeData.setup}\n*${jokeData.delivery}*`;
            }

            const embed = createStyledEmbed({
                color: colors.info,
                title: '😂 Tito cuenta un chiste...',
                description: jokeText
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error al obtener chiste:', error);
            await interaction.editReply('Lo siento, Tito no está inspirado ahora mismo. Inténtalo de nuevo más tarde.');
        }
    },
};
