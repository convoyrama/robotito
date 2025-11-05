const { SlashCommandBuilder } = require('discord.js');
const { colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');
const { openWeather } = require('../utils/apiClients');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clima')
        .setDescription('Muestra el clima actual de una ciudad.')
        .addStringOption(option =>
            option.setName('ciudad')
                .setDescription('La ciudad para la que quieres saber el clima.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const ciudad = interaction.options.getString('ciudad');

        try {
            const response = await openWeather.get('/weather', { params: { q: ciudad } });
            const weather = response.data;

            const fields = [
                { name: 'Temperatura', value: `${weather.main.temp}°C`, inline: true },
                { name: 'Sensación térmica', value: `${weather.main.feels_like}°C`, inline: true },
                { name: 'Humedad', value: `${weather.main.humidity}%`, inline: true },
                { name: 'Viento', value: `${weather.wind.speed} m/s`, inline: true },
                { name: 'Descripción', value: weather.weather[0].description, inline: true },
            ];

            const embed = createStyledEmbed({
                color: colors.info,
                title: `🌦️ Clima en ${weather.name}`,
                thumbnail: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`,
                fields: fields,
                footer: { text: 'Datos proporcionados por OpenWeatherMap' }
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            if (error.response && error.response.status === 404) {
                await interaction.editReply(`No se pudo encontrar la ciudad "${ciudad}".`);
            } else {
                console.error('Error al obtener datos de OpenWeatherMap:', error);
                // Re-throw the error to be handled by the global error handler
                throw error;
            }
        }
    },
};
