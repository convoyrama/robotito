const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mods')
        .setDescription('Muestra listas de sitios recomendados para buscar mods.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ets2')
                .setDescription('Muestra la lista de mapas para Euro Truck Simulator 2.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ats')
                .setDescription('Muestra la lista de mapas para American Truck Simulator.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('vehiculos')
                .setDescription('Muestra sitios de mods de vehículos y portales generales.')),

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

            if (subcommand === 'ets2') {
                embedOptions.title = '🗺️ Lista de Mapas para ETS2';
                const ets2Maps = modsData.mapas.ets2;
                const fields = [];
                let ets2FieldValue = '';
                let ets2Part = 1;

                for (const map of ets2Maps) {
                    const entryString = `[**${map.nombre}**](${map.url})\n*${map.descripcion}*\n\n`;
                    if (ets2FieldValue.length + entryString.length > 1024) {
                        fields.push({ name: `Parte ${ets2Part}`, value: ets2FieldValue });
                        ets2FieldValue = '';
                        ets2Part++;
                    }
                    ets2FieldValue += entryString;
                }
                if (ets2FieldValue) {
                    fields.push({ name: `Parte ${ets2Part}`, value: ets2FieldValue });
                }
                embedOptions.fields = fields;

            } else if (subcommand === 'ats') {
                embedOptions.title = '🗺️ Lista de Mapas para ATS';
                embedOptions.fields = [
                    { name: 'Mapas Principales', value: formatEntries(modsData.mapas.ats) || 'No disponible' },
                    { name: 'Otras Plataformas', value: formatPlatforms(modsData.mapas.plataformas) || 'No disponible' }
                ];

            } else if (subcommand === 'vehiculos') {
                embedOptions.title = '🚚 Sitios de Mods de Vehículos y Portales';
                embedOptions.fields = [
                    { name: 'Tiendas de Creadores', value: formatEntries(modsData.vehiculos.tiendas) || 'No disponible' },
                    { name: 'Portales Generales', value: formatEntries(modsData.vehiculos.portales) || 'No disponible' }
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