const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tito')
        .setDescription('Tito te cuenta un dato inútil y absurdo.'),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const response = await axios.get('https://v2.jokeapi.dev/joke/Any?lang=es&blacklistFlags=nsfw,religious,political,racist,sexist,explicit');
            const jokeData = response.data;
            let jokeText;
            if (jokeData.type === 'single') {
                jokeText = jokeData.joke;
            } else {
                jokeText = `${jokeData.setup}\n*${jokeData.delivery}*`;
            }
            const embed = new EmbedBuilder().setColor(0x9B59B6).setTitle('Tito cuenta un chiste...').setDescription(jokeText);
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error al obtener chiste:', error);
            await interaction.editReply('Lo siento, Tito no está inspirado ahora mismo. Inténtalo de nuevo más tarde.');
        }
    },
};

