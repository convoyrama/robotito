const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { openWeatherApiKey } = require('../config');

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
        if (!interaction.channel.permissionsFor(interaction.client.user).has('EmbedLinks')) {
            await interaction.editReply('No tengo permiso para enviar mensajes incrustados (Embeds) en este canal. Por favor, contacta a un administrador.');
            return;
        }
        const ciudad = interaction.options.getString('ciudad');
        if (!openWeatherApiKey) {
            await interaction.editReply('La clave de la API de OpenWeatherMap no está configurada.');
            return;
        }
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${openWeatherApiKey}&units=metric&lang=es`;

        try {
            const response = await axios.get(url);
            const weather = response.data;

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Clima en ${weather.name}`)
                .setThumbnail(`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`)
                .addFields(
                    { name: 'Temperatura', value: `${weather.main.temp}°C`, inline: true },
                    { name: 'Sensación térmica', value: `${weather.main.feels_like}°C`, inline: true },
                    { name: 'Humedad', value: `${weather.main.humidity}%`, inline: true },
                    { name: 'Viento', value: `${weather.wind.speed} m/s`, inline: true },
                    { name: 'Descripción', value: weather.weather[0].description, inline: true },
                )
                .setFooter({ text: 'Datos proporcionados por OpenWeatherMap' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            if (error.response && error.response.status === 404) {
                await interaction.editReply(`No se pudo encontrar la ciudad "${ciudad}".`);
            } else {
                console.error('Error al obtener datos de OpenWeatherMap:', error);
                await interaction.editReply('Hubo un error al consultar el clima.');
            }
        }
    },
};
