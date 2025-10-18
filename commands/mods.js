const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

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
        try {
            const filePath = path.join(__dirname, '..', 'mods.json');
            const modsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const subcommand = interaction.options.getSubcommand();

            const embed = new EmbedBuilder()
                .setColor(0x1ABC9C);

            const formatEntries = (entries) => entries.map(e => `[**${e.nombre}**](${e.url})\n*${e.descripcion}*`).join('\n\n');
            const formatPlatforms = (entries) => entries.map(e => {
                const ets2Link = e.url_ets2 ? `[ETS2](${e.url_ets2})` : '';
                const atsLink = e.url_ats ? `[ATS](${e.url_ats})` : '';
                return `**${e.nombre}**: ${ets2Link} | ${atsLink}\n*${e.descripcion}*`;
            }).join('\n\n');

            if (subcommand === 'ets2') {
                embed.setTitle('🗺️ Lista de Mapas para ETS2');
                const ets2Maps = modsData.mapas.ets2;
                let ets2FieldValue = '';
                let ets2Part = 1;
                const fields = [];

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
                embed.addFields(fields);

            } else if (subcommand === 'ats') {
                embed.setTitle('🗺️ Lista de Mapas para ATS');
                embed.addFields(
                    { name: 'Mapas Principales', value: formatEntries(modsData.mapas.ats) || 'No disponible' },
                    { name: 'Otras Plataformas', value: formatPlatforms(modsData.mapas.plataformas) || 'No disponible' }
                );

            } else if (subcommand === 'vehiculos') {
                embed.setTitle('🚚 Sitios de Mods de Vehículos y Portales');
                embed.addFields(
                    { name: 'Tiendas de Creadores', value: formatEntries(modsData.vehiculos.tiendas) || 'No disponible' },
                    { name: 'Portales Generales', value: formatEntries(modsData.vehiculos.portales) || 'No disponible' }
                );
            }

            await interaction.reply({ embeds: [embed], flags: 64 });

        } catch (error) {
            console.error(`Error al procesar el comando /mods ${subcommand}:`, error);
            await interaction.reply({ content: 'No se pudo obtener la lista de mods en este momento.', flags: 64 });
        }
    },
};