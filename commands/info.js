const { SlashCommandBuilder } = require('discord.js');
const { vtcAliases, colors } = require('../config');
const { handlePlayerInfo, createStyledEmbed } = require('../utils/helpers');
const { truckersMP } = require('../utils/apiClients');
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
                const vtcResponse = await truckersMP.get(`/vtc/${vtcId}`);
                const vtcData = vtcResponse.data.response;
                if (!vtcData) {
                    await interaction.editReply('No se encontró información para esa VTC de TruckersMP.');
                    return;
                }

                let newsData = null;
                try {
                    const newsResponse = await truckersMP.get(`/vtc/${vtcId}/news`);
                    newsData = newsResponse.data.response;
                } catch (newsError) {
                    console.error(`[${new Date().toISOString()}] Error fetching VTC news for VTC ID ${vtcId}:`, newsError.message);
                }
                const fields = [
                    { name: 'ID de VTC', value: vtcData.id ? `${vtcData.id}` : 'N/A', inline: true },
                    { name: 'Tag', value: vtcData.tag || 'N/A', inline: true },
                    { name: 'Miembros', value: vtcData.members_count ? `${vtcData.members_count}` : 'N/A', inline: true },
                    { name: 'Creada', value: vtcData.creation_date ? DateTime.fromISO(vtcData.creation_date.replace(' ', 'T')).toFormat('dd/MM/yyyy') : 'N/A', inline: true },
                    { name: 'Reclutamiento', value: vtcData.recruitment_status || 'N/A', inline: true },
                    { name: 'Verificada', value: vtcData.verified ? 'Sí' : 'No', inline: true }
                ];

                if (newsData && newsData.news && newsData.news.length > 0) {
                    const latestNews = newsData.news[0];
                    fields.push({ name: 'Última Noticia', value: `[${latestNews.title}](https://truckersmp.com/vtc/${vtcId}/news/${latestNews.id})` });
                }

                const embed = createStyledEmbed({
                    color: colors.primary,
                    title: `🚚 Perfil de VTC: ${vtcData.name}`,
                    url: vtcUrl,
                    description: vtcData.slogan || null,
                    thumbnail: vtcData.avatar || null,
                    fields: fields,
                    footer: { text: 'Datos obtenidos de la API de TruckersMP.' }
                });

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    await interaction.editReply('La VTC con el ID o alias proporcionado no fue encontrada en TruckersMP.');
                } else {
                    // For other errors, re-throw to be caught by the global error handler
                    throw error;
                }
            }
        } else {
            await interaction.editReply({ content: 'El formato del enlace o alias no es válido. Por favor, usa un enlace de perfil de usuario, de VTC o un alias de VTC válido.', flags: 64 });
        }
    },
};
