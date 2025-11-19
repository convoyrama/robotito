const { SlashCommandBuilder } = require('discord.js');
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');
const { jokeApi } = require('../utils/apiClients');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.tito.name'))
        .setDescription(t('commands.tito.description')),
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
                title: t('commands.tito.embed_title'),
                description: jokeText
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error al obtener chiste:', error);
            await interaction.editReply(t('common.tito_inspiration_error'));
        }
    },
};
