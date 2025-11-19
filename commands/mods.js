const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.mods.name'))
        .setDescription(t('commands.mods.description'))
        .addSubcommand(subcommand =>
            subcommand
                .setName(t('commands.mods.subcommands.ets2.name'))
                .setDescription(t('commands.mods.subcommands.ets2.description')))
        .addSubcommand(subcommand =>
            subcommand
                .setName(t('commands.mods.subcommands.ats.name'))
                .setDescription(t('commands.mods.subcommands.ats.description')))
        .addSubcommand(subcommand =>
            subcommand
                .setName(t('commands.mods.subcommands.vehiculos.name'))
                .setDescription(t('commands.mods.subcommands.vehiculos.description'))),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        try {
            const filePath = path.join(__dirname, '..', 'mods.json');
            const modsFileContent = await fs.readFile(filePath, 'utf8');
            const modsData = JSON.parse(modsFileContent);
            const subcommand = interaction.options.getSubcommand();

            const embedOptions = {
                color: colors.info,
            };

            const formatEntries = (entries) => entries.map(e => `[**${e.nombre}**](${e.url})\n*${e.descripcion}*`).join('\n\n');
            const formatPlatforms = (entries) => entries.map(e => {
                const ets2Link = e.url_ets2 ? `[ETS2](${e.url_ets2})` : '';
                const atsLink = e.url_ats ? `[ATS](${e.url_ats})` : '';
                return `**${e.nombre}**: ${ets2Link} | ${atsLink}\n*${e.descripcion}*`;
            }).join('\n\n');

            if (subcommand === t('commands.mods.subcommands.ets2.name')) {
                embedOptions.title = t('commands.mods.ets2_embed_title');
                const ets2Maps = modsData.mapas.ets2;
                const fields = [];
                let ets2FieldValue = '';
                let ets2Part = 1;

                for (const map of ets2Maps) {
                    const entryString = `[**${map.nombre}**](${map.url})\n*${map.descripcion}*\n\n`;
                    if (ets2FieldValue.length + entryString.length > 1024) {
                        fields.push({ name: t('commands.mods.part', { part: ets2Part }), value: ets2FieldValue });
                        ets2FieldValue = '';
                        ets2Part++;
                    }
                    ets2FieldValue += entryString;
                }
                if (ets2FieldValue) {
                    fields.push({ name: t('commands.mods.part', { part: ets2Part }), value: ets2FieldValue });
                }
                embedOptions.fields = fields;

            } else if (subcommand === t('commands.mods.subcommands.ats.name')) {
                embedOptions.title = t('commands.mods.ats_embed_title');
                embedOptions.fields = [
                    { name: t('commands.mods.main_maps'), value: formatEntries(modsData.mapas.ats) || t('commands.mods.not_available') },
                    { name: t('commands.mods.other_platforms'), value: formatPlatforms(modsData.mapas.plataformas) || t('commands.mods.not_available') }
                ];

            } else if (subcommand === t('commands.mods.subcommands.vehiculos.name')) {
                embedOptions.title = t('commands.mods.vehicles_embed_title');
                embedOptions.fields = [
                    { name: t('commands.mods.creator_stores'), value: formatEntries(modsData.vehiculos.tiendas) || t('commands.mods.not_available') },
                    { name: t('commands.mods.general_portals'), value: formatEntries(modsData.vehiculos.portales) || t('commands.mods.not_available') }
                ];
            }

            const embed = createStyledEmbed(embedOptions);
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(`Error al procesar el comando /mods:`, error);
            // Re-throw to be handled by the global error handler
            throw error;
        }
    },
};