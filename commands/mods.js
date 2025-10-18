const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mods')
        .setDescription('Muestra una lista de sitios recomendados para buscar mods.'),
    async execute(interaction) {
        try {
            const filePath = path.join(__dirname, '..', 'mods.json');
            const modsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            const embed = new EmbedBuilder()
                .setColor(0x1ABC9C)
                .setTitle('Lista de Sitios de Mods para ETS2 y ATS');

            // Función para formatear las entradas
            const formatEntries = (entries) => {
                return entries.map(e => `[**${e.nombre}**](${e.url})\n*${e.descripcion}*`).join('\n\n');
            };
            
            // Función para plataformas (caso especial)
            const formatPlatforms = (entries) => {
                return entries.map(e => {
                    const ets2Link = e.url_ets2 ? `[ETS2](${e.url_ets2})` : '';
                    const atsLink = e.url_ats ? `[ATS](${e.url_ats})` : '';
                    return `**${e.nombre}**: ${ets2Link} | ${atsLink}\n*${e.descripcion}*`;
                }).join('\n\n');
            };

            // Añadir campos al embed
            embed.addFields(
                { name: '🗺️ Mapas para ETS2', value: formatEntries(modsData.mapas.ets2) || 'No disponible' },
                { name: '🗺️ Mapas para ATS', value: formatEntries(modsData.mapas.ats) || 'No disponible' },
                { name: '🚚 Tiendas de Vehículos', value: formatEntries(modsData.vehiculos.tiendas) || 'No disponible' },
                { name: '🌐 Portales Generales de Mods', value: formatEntries(modsData.vehiculos.portales) || 'No disponible' },
                { name: '📦 Otras Plataformas', value: formatPlatforms(modsData.mapas.plataformas) || 'No disponible' }
            );

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error al procesar el comando /mods:', error);
            await interaction.reply({ content: 'No se pudo obtener la lista de mods en este momento.', ephemeral: true });
        }
    },
};
