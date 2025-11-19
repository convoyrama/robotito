const { SlashCommandBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const timezones = require('../timezones.json');
const { parseInputTime } = require('../utils/time');
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.hora.name'))
        .setDescription(t('commands.hora.description'))
        .addStringOption(option =>
            option.setName(t('commands.hora.options.tiempo.name'))
                .setDescription(t('commands.hora.options.tiempo.description'))
                .setRequired(false))
        .addStringOption(option =>
            option.setName(t('commands.hora.options.ciudad.name'))
                .setDescription(t('commands.hora.options.ciudad.description'))
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName(t('commands.hora.options.listar-ciudades.name'))
                .setDescription(t('commands.hora.options.listar-ciudades.description'))
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();

        if (interaction.options.getBoolean(t('commands.hora.options.listar-ciudades.name'))) {
            const cityList = timezones.map(tz => tz.name).join('\n');
            const embed = createStyledEmbed({
                color: colors.info,
                title: t('commands.hora.cities_list_embed_title'),
                description: '```\n' + cityList + '\n```'
            });
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const timeString = interaction.options.getString(t('commands.hora.options.tiempo.name'));
        const cityNameOrOffset = interaction.options.getString(t('commands.hora.options.ciudad.name'));
        let referenceTime, referenceCity, description = '';
        const userLocalTime = DateTime.local();

        if (timeString && cityNameOrOffset) {
            const utcOffsetMatch = cityNameOrOffset.match(/^[+-]?\d{1,2}$/);
            if (utcOffsetMatch) {
                const offset = parseInt(cityNameOrOffset, 10);
                if (offset >= -12 && offset <= 14) {
                    referenceTime = parseInputTime(timeString, userLocalTime.setZone(`UTC${offset}`));
                    referenceCity = `UTC${offset}`;
                } else {
                    await interaction.editReply(t('commands.hora.city_not_found'));
                    return;
                }
            } else {
                const foundCity = timezones.find(tz => tz.name.toLowerCase().includes(cityNameOrOffset.toLowerCase()));
                if (!foundCity) {
                    await interaction.editReply(t('commands.hora.city_not_found'));
                    return;
                }
                referenceTime = parseInputTime(timeString, userLocalTime.setZone(foundCity.zone));
                referenceCity = foundCity.name;
            }

            if (!referenceTime) {
                await interaction.editReply(t('commands.hora.invalid_time'));
                return;
            }
            description = t('commands.hora.description_referenced', { referenceCity, referenceTime: referenceTime.toFormat('HH:mm') });
        } else if (!timeString && !cityNameOrOffset) {
            referenceTime = userLocalTime;
            description = t('commands.hora.description_current');
        } else {
            await interaction.editReply(t('commands.hora.incorrect_usage'));
            return;
        }
        timezones.forEach(tz => {
            const timeInZone = referenceTime.setZone(tz.zone);
            description += `• **${tz.name}:** ${timeInZone.toFormat('HH:mm:ss')}\n`;
        });

        const embed = createStyledEmbed({
            color: colors.info,
            title: t('commands.hora.embed_title'),
            description: description,
            footer: { text: t('commands.hora.footer') }
        });

        await interaction.editReply({ embeds: [embed] });
    },
};
