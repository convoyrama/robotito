const { SlashCommandBuilder } = require('discord.js');
const { colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');
const { openWeather } = require('../utils/apiClients');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.clima.name'))
        .setDescription(t('commands.clima.description'))
        .addStringOption(option =>
            option.setName(t('commands.clima.options.ciudad.name'))
                .setDescription(t('commands.clima.options.ciudad.description'))
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const ciudad = interaction.options.getString(t('commands.clima.options.ciudad.name'));

        try {
            const response = await openWeather.get('/weather', { params: { q: ciudad } });
            const weather = response.data;

            const fields = [
                { name: t('commands.clima.weather_fields.temperature'), value: `${weather.main.temp}°C`, inline: true },
                { name: t('commands.clima.weather_fields.feels_like'), value: `${weather.main.feels_like}°C`, inline: true },
                { name: t('commands.clima.weather_fields.humidity'), value: `${weather.main.humidity}%`, inline: true },
                { name: t('commands.clima.weather_fields.wind'), value: `${weather.wind.speed} m/s`, inline: true },
                { name: t('commands.clima.weather_fields.description'), value: weather.weather[0].description, inline: true },
            ];

            const embed = createStyledEmbed({
                color: colors.info,
                title: t('commands.clima.embed_title', { weatherName: weather.name }),
                thumbnail: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`,
                fields: fields,
                footer: { text: t('commands.clima.footer') }
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            if (error.response && error.response.status === 404) {
                await interaction.editReply(t('common.city_not_found', { ciudad }));
            } else {
                console.error('Error al obtener datos de OpenWeatherMap:', error);
                // Re-throw the error to be handled by the global error handler
                throw error;
            }
        }
    },
};
