const { SlashCommandBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const timezones = require('../timezones.json');
const { parseInputTime, getGameTime } = require('../utils/time');
const { getDetailedDayNightIcon, createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.ingame.name'))
        .setDescription(t('commands.ingame.description'))
        .addStringOption(option =>
            option.setName(t('commands.ingame.options.tiempo.name'))
                .setDescription(t('commands.ingame.options.tiempo.description'))
                .setRequired(false))
        .addStringOption(option =>
            option.setName(t('commands.ingame.options.ciudad.name'))
                .setDescription(t('commands.ingame.options.ciudad.description'))
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName(t('commands.ingame.options.listar-ciudades.name'))
                .setDescription(t('commands.ingame.options.listar-ciudades.description'))
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();

        if (interaction.options.getBoolean(t('commands.ingame.options.listar-ciudades.name'))) {
            const cityList = timezones.map(tz => tz.name).join('\n');
            const embed = createStyledEmbed({
                color: colors.info,
                title: t('commands.ingame.cities_list_embed_title'),
                description: '```\n' + cityList + '\n```'
            });
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const timeString = interaction.options.getString(t('commands.ingame.options.tiempo.name'));
        const cityNameOrOffset = interaction.options.getString(t('commands.ingame.options.ciudad.name'));
        let referenceDate = DateTime.local();
        let responseDescription = t('commands.ingame.description_now');
        let inputTime;
        let foundCity = null;

        if (cityNameOrOffset) {
            const utcOffsetMatch = cityNameOrOffset.match(/^[+-]?\d{1,2}$/);
            if (utcOffsetMatch) {
                const offset = parseInt(cityNameOrOffset, 10);
                if (offset >= -12 && offset <= 14) {
                    referenceDate = DateTime.local().setZone(`UTC${offset}`);
                    foundCity = { name: `UTC${offset}` };
                } else {
                    await interaction.editReply(t('commands.ingame.city_not_found'));
                    return;
                }
            } else {
                foundCity = timezones.find(tz => tz.name.toLowerCase().includes(cityNameOrOffset.toLowerCase()));
                if (!foundCity) {
                    await interaction.editReply(t('commands.ingame.city_not_found'));
                    return;
                }
                referenceDate = DateTime.local().setZone(foundCity.zone);
            }
        }

        if (timeString) {
            inputTime = parseInputTime(timeString, referenceDate);
            if (!inputTime) {
                await interaction.editReply(t('commands.ingame.invalid_time'));
                return;
            }
            responseDescription = cityNameOrOffset && foundCity ? t('commands.ingame.description_referenced', { foundCity: foundCity.name, inputTime: inputTime.toFormat('HH:mm') }) : t('commands.ingame.description_referenced_no_city', { inputTime: inputTime.toFormat('HH:mm') });
        } else {
            inputTime = referenceDate;
            responseDescription = cityNameOrOffset && foundCity ? t('commands.ingame.description_now_city', { foundCity: foundCity.name }) : t('commands.ingame.description_now');
        }
        const ingameTime = getGameTime(inputTime);
        const ingameEmoji = getDetailedDayNightIcon(ingameTime.hour);

        const embed = createStyledEmbed({
            color: colors.primary,
            title: t('commands.ingame.embed_title'),
            description: t('commands.ingame.result', { responseDescription, ingameTime: ingameTime.toFormat('HH:mm:ss'), ingameEmoji })
        });

        await interaction.editReply({ embeds: [embed] });
    },
};
