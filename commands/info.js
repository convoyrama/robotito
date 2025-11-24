const { SlashCommandBuilder } = require('discord.js');
const { vtcAliases, colors } = require('../config');
const { handlePlayerInfo, createStyledEmbed } = require('../utils/helpers');
const { truckersMP } = require('../utils/apiClients');
const { DateTime } = require('luxon');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.info.name'))
        .setDescription(t('commands.info.description'))
        .addStringOption(option =>
            option.setName(t('commands.info.options.enlace_o_alias.name'))
                .setDescription(t('commands.info.options.enlace_o_alias.description'))
                .setRequired(true)),
    async execute(interaction) {
        await interaction.reply({ content: t('common.command_unavailable'), ephemeral: true });
        return;
        await interaction.deferReply({ flags: 64 });
        const input = interaction.options.getString(t('commands.info.options.enlace_o_alias.name'));
        if (!input) {
            await interaction.editReply({ content: t('common.provide_data'), flags: 64 });
            return;
        }

        const userUrlMatch = input.match(/truckersmp\.com\/(?:user|profile)\/(\d+)/);
        const vtcUrlMatch = input.match(/truckersmp\.com\/vtc\/(\d+)/);
        const vtcAlias = vtcAliases[input.toLowerCase()];
        const isNumericId = /^\d+$/.test(input);

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
                    await interaction.editReply(t('common.vtc_not_found'));
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
                    { name: t('commands.info.vtc_id'), value: vtcData.id ? `${vtcData.id}` : 'N/A', inline: true },
                    { name: t('commands.info.vtc_tag'), value: vtcData.tag || 'N/A', inline: true },
                    { name: t('commands.info.vtc_members'), value: vtcData.members_count ? `${vtcData.members_count}` : 'N/A', inline: true },
                    { name: t('commands.info.vtc_created'), value: vtcData.creation_date ? DateTime.fromISO(vtcData.creation_date.replace(' ', 'T')).toFormat('dd/MM/yyyy') : 'N/A', inline: true },
                    { name: t('commands.info.vtc_recruitment'), value: vtcData.recruitment_status || 'N/A', inline: true },
                    { name: t('commands.info.vtc_verified'), value: vtcData.verified ? t('commands.info.player_is_patron') : t('commands.info.player_not_banned'), inline: true }
                ];

                if (newsData && newsData.news && newsData.news.length > 0) {
                    const latestNews = newsData.news[0];
                    fields.push({ name: t('commands.info.vtc_last_news'), value: `[${latestNews.title}](https://truckersmp.com/vtc/${vtcId}/news/${latestNews.id})` });
                }

                const embed = createStyledEmbed({
                    color: colors.primary,
                    title: t('commands.info.vtc_embed_title', { vtcName: vtcData.name }),
                    url: vtcUrl,
                    description: vtcData.slogan || null,
                    thumbnail: vtcData.avatar || null,
                    fields: fields,
                    footer: { text: t('commands.info.footer') }
                });

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    await interaction.editReply(t('common.vtc_id_not_found'));
                } else {
                    // For other errors, re-throw to be caught by the global error handler
                    throw error;
                }
            }
        } else if (isNumericId) {
            const profileUrl = `https://truckersmp.com/user/${input}`;
            await handlePlayerInfo(interaction, input, profileUrl);
        } else {
            await interaction.editReply({ content: t('common.invalid_format'), flags: 64 });
        }
    },
};