const { SlashCommandBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { BASE_IMAGE_URL, POSITIVE_STATES, NEGATIVE_STATES, colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.estado.name'))
        .setDescription(t('commands.estado.description')),
    async execute(interaction) {
        await interaction.deferReply();
        const now = DateTime.local();

        const embedOptions = {
            footer: { text: t('commands.estado.footer', { date: now.toFormat('dd/MM/yyyy') }) }
        };

        if (now.month === 2 && now.day === 14) {
            embedOptions.image = `${BASE_IMAGE_URL}event/enamorado.png`;
            embedOptions.title = t('commands.estado.valentine_title');
            embedOptions.description = t('commands.estado.valentine_desc');
            embedOptions.color = colors.info; // Pinkish/Purple
        } else if (now.month === 10 && now.day === 31) {
            embedOptions.image = `${BASE_IMAGE_URL}event/halloween.png`;
            embedOptions.title = t('commands.estado.halloween_title');
            embedOptions.description = t('commands.estado.halloween_desc');
            embedOptions.color = colors.warning; // Orange
        } else if (now.month === 12 && now.day === 25) {
            embedOptions.image = `${BASE_IMAGE_URL}event/navidad.png`;
            embedOptions.title = t('commands.estado.christmas_title');
            embedOptions.description = t('commands.estado.christmas_desc');
            embedOptions.color = colors.error; // Red
        } else {
            const isPositiveDay = now.day % 2 === 0;
            let stateImage;
            if (isPositiveDay) {
                const index = now.day % POSITIVE_STATES.length;
                stateImage = POSITIVE_STATES[index];
                embedOptions.title = t('commands.estado.positive_title');
                embedOptions.color = colors.success;
            } else {
                const index = now.day % NEGATIVE_STATES.length;
                stateImage = NEGATIVE_STATES[index];
                embedOptions.title = t('commands.estado.negative_title');
                embedOptions.color = colors.primary;
            }
            embedOptions.image = `${BASE_IMAGE_URL}estado/${stateImage}`;
        }

        const embed = createStyledEmbed(embedOptions);
        await interaction.editReply({ embeds: [embed] });
    },
};
