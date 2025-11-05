const { SlashCommandBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const timezones = require('../timezones.json');
const { parseInputTime } = require('../utils/time');
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hora')
        .setDescription('Muestra la hora actual en varias zonas horarias o calcula esas horas.')
        .addStringOption(option =>
            option.setName('tiempo')
                .setDescription('Hora en formato HH:MM o Ham/pm (ej: 20:00 o 8pm).')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('ciudad')
                .setDescription('Ciudad de referencia (ej: Montevideo).')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        const timeString = interaction.options.getString('tiempo');
        const cityName = interaction.options.getString('ciudad');
        let referenceTime, referenceCity, description = '';
        const userLocalTime = DateTime.local();
        if (timeString && cityName) {
            const foundCity = timezones.find(tz => tz.name.toLowerCase().includes(cityName.toLowerCase()));
            if (!foundCity) {
                await interaction.editReply('Ciudad no encontrada en la lista de capitales latinas. Intenta con `/hora` para ver las horas actuales o `/hora tiempo:HH:MM ciudad:[Ciudad]` con una ciudad válida.');
                return;
            }
            referenceTime = parseInputTime(timeString, userLocalTime.setZone(foundCity.zone));
            if (!referenceTime) {
                await interaction.editReply('Formato de tiempo inválido. Intenta `/hora tiempo:HH:MM ciudad:[Ciudad]` o `/hora tiempo:Ham/pm ciudad:[Ciudad]`');
                return;
            }
            referenceCity = foundCity.name;
            description = `**Si en ${referenceCity} son las ${referenceTime.toFormat('HH:mm')}, entonces:**\n`;
        } else if (!timeString && !cityName) {
            referenceTime = userLocalTime;
            description = `**Horas actuales en Zonas Latinas:**\n`;
        } else {
            await interaction.editReply('Uso incorrecto. Intenta `/hora` para horas actuales, o `/hora tiempo:HH:MM ciudad:[Ciudad]`');
            return;
        }
        timezones.forEach(tz => {
            const timeInZone = referenceTime.setZone(tz.zone);
            description += `• **${tz.name}:** ${timeInZone.toFormat('HH:mm:ss')}\n`;
        });

        const embed = createStyledEmbed({
            color: colors.info,
            title: '🌎 Horas en Zonas Latinas',
            description: description,
            footer: { text: 'Horas basadas en la zona horaria del bot.' }
        });

        await interaction.editReply({ embeds: [embed] });
    },
};
