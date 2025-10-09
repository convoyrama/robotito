const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { TRUCKERSMP_API_BASE_URL, vtcAliases } = require('../config');
const { handlePlayerInfo } = require('../utils/helpers');
const { DateTime } = require('luxon');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Muestra información de un usuario o VTC de TruckersMP por URL o alias.')
        .addStringOption(option =>
            option.setName('enlace_o_alias')
                .setDescription('Enlace de perfil de TruckersMP (usuario o VTC) o alias de VTC.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        const input = interaction.options.getString('enlace_o_alias');
        if (!input) {
            await interaction.editReply({ content: 'Por favor, proporciona un enlace de perfil de TruckersMP (usuario o VTC) o un alias de VTC.', flags: 64 });
            return;
        }
        const userUrlMatch = input.match(/truckersmp\.com\/(?:user|profile)\/(\d+)/);
        const vtcUrlMatch = input.match(/truckersmp\.com\/vtc\/(\d+)/);
        const vtcAlias = vtcAliases[input.toLowerCase()];
        if (userUrlMatch) {
            const userId = userUrlMatch[1];
            await handlePlayerInfo(interaction, userId, input);
        } else if (vtcUrlMatch || vtcAlias) {
            const vtcId = vtcUrlMatch ? vtcUrlMatch[1] : vtcAlias;
            const vtcUrl = vtcUrlMatch ? input : `https://truckersmp.com/vtc/${vtcId}`;
            try {
                const vtcResponse = await axios.get(`${TRUCKERSMP_API_BASE_URL}/vtc/${vtcId}`);
                const vtcData = vtcResponse.data.response;
                if (!vtcData) {
                    await interaction.editReply('No se encontró información para esa VTC de TruckersMP.');
                    return;
                }

                let newsData = null;
                try {
                    const newsResponse = await axios.get(`${TRUCKERSMP_API_BASE_URL}/vtc/${vtcId}/news`);
                    newsData = newsResponse.data.response;
                } catch (newsError) {
                    console.error(`[${new Date().toISOString()}] Error fetching VTC news for VTC ID ${vtcId}:`, newsError.message);
                }
                const embed = new EmbedBuilder()
                    .setColor(0x0077B6)
                    .setTitle(`🚚 Perfil de VTC: ${vtcData.name}`)
                    .setURL(vtcUrl)
                    .setThumbnail(vtcData.avatar || null)
                    .addFields(
                        { name: 'ID de VTC', value: vtcData.id ? `${vtcData.id}` : 'N/A', inline: true },
                        { name: 'Tag', value: vtcData.tag || 'N/A', inline: true },
                        { name: 'Miembros', value: vtcData.members_count ? `${vtcData.members_count}` : 'N/A', inline: true },
                        { name: 'Creada', value: vtcData.creation_date ? DateTime.fromISO(vtcData.creation_date.replace(' ', 'T')).toFormat('dd/MM/yyyy') : 'N/A', inline: true },
                        { name: 'Reclutamiento', value: vtcData.recruitment_status || 'N/A', inline: true },
                        { name: 'Verificada', value: vtcData.verified ? 'Sí' : 'No', inline: true }
                    )
                    .setFooter({ text: 'Datos obtenidos de la API de TruckersMP.' });
                if (vtcData.slogan) embed.setDescription(vtcData.slogan);

                if (newsData && newsData.news && newsData.news.length > 0) {
                    const latestNews = newsData.news[0];
                    embed.addFields({ name: 'Última Noticia', value: `[${latestNews.title}](https://truckersmp.com/vtc/${vtcId}/news/${latestNews.id})` });
                }
                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Error al obtener datos de TruckersMP API:', error);
                if (error.response) {
                    await interaction.editReply(`Error al consultar la API de TruckersMP: ${error.response.status} ${error.response.statusText}`);
                } else {
                    await interaction.editReply('Lo siento, hubo un error al consultar la API de TruckersMP.');
                }
            }
        } else {
            await interaction.editReply({ content: 'El formato del enlace o alias no es válido. Por favor, usa un enlace de perfil de usuario, de VTC o un alias de VTC válido.', flags: 64 });
        }
    },
};
