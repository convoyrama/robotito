const { SlashCommandBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const timezones = require('../timezones.json');
const { parseInputTime, getGameTime } = require('../utils/time');
const { getDetailedDayNightIcon, createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ingame')
        .setDescription('Calcula la hora in-game para una hora y zona horaria específicas.')
        .addStringOption(option =>
            option.setName('tiempo')
                .setDescription('Hora en formato HH:MM, HHMM o Ham/pm (ej: 22:00, 2200 o 5pm).')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('ciudad')
                .setDescription('Ciudad/País para la zona horaria de referencia (ej: Montevideo).')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        const timeString = interaction.options.getString('tiempo');
        const cityName = interaction.options.getString('ciudad');
        let referenceDate = DateTime.local();
        let responseDescription = 'Ahora mismo';
        let inputTime;
        let foundCity = null;

        if (cityName) {
            foundCity = timezones.find(tz => tz.name.toLowerCase().includes(cityName.toLowerCase()));
            if (!foundCity) {
                await interaction.editReply('Ciudad no encontrada. Por favor, usa una de las capitales de la lista o un nombre reconocible.');
                return;
            }
            referenceDate = DateTime.local().setZone(foundCity.zone);
        }

        if (timeString) {
            inputTime = parseInputTime(timeString, referenceDate);
            if (!inputTime) {
                await interaction.editReply('Formato de tiempo inválido. Intenta con `HH:MM`, `HHMM` (ej: 2200) o `Ham/pm` (ej: 8pm).');
                return;
            }
            responseDescription = cityName && foundCity ? `Si en ${foundCity.name} son las **${inputTime.toFormat('HH:mm')}**` : `Si en la zona horaria del bot son las **${inputTime.toFormat('HH:mm')}**`;
        } else {
            inputTime = referenceDate;
            responseDescription = cityName && foundCity ? `Ahora mismo en ${foundCity.name}` : 'Ahora mismo';
        }
        const ingameTime = getGameTime(inputTime);
        const ingameEmoji = getDetailedDayNightIcon(ingameTime.hour);

        const embed = createStyledEmbed({
            color: colors.primary,
            title: '⏰ Hora In-Game',
            description: `${responseDescription}, la hora in-game es: **${ingameTime.toFormat('HH:mm:ss')} ${ingameEmoji}**`
        });

        await interaction.editReply({ embeds: [embed] });
    },
};
