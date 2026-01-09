const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');
const { hmacSecret, colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');
const { truckersMP } = require('../utils/apiClients');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.verificar.name'))
        .setDescription(t('commands.verificar.description'))
        .addStringOption(option =>
            option.setName(t('commands.verificar.options.url.name'))
                .setDescription(t('commands.verificar.options.url.description'))
                .setRequired(true))
        .addStringOption(option =>
            option.setName(t('commands.verificar.options.url_vtc.name'))
                .setDescription(t('commands.verificar.options.url_vtc.description'))
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        if (!interaction.channel.permissionsFor(interaction.client.user).has('EmbedLinks')) {
            await interaction.editReply({ content: t('common.no_embed_permission'), flags: 64 });
            return;
        }
        const userUrl = interaction.options.getString(t('commands.verificar.options.url.name'));
        const vtcUrl = interaction.options.getString(t('commands.verificar.options.url_vtc.name'));
        const userUrlMatch = userUrl.match(/truckersmp\.com\/(?:user|profile)\/(\d+)/);
        if (!userUrlMatch || !userUrlMatch[1]) {
            await interaction.editReply({ content: t('common.invalid_user_url'), flags: 64 });
            return;
        }
        const userId = userUrlMatch[1];
        try {
            const playerResponse = await truckersMP.get(`/player/${userId}`);
            const playerData = playerResponse.data.response;
            if (!playerData || !playerData.joinDate) {
                await interaction.editReply(t('common.user_data_not_found'));
                return;
            }
            let payload = `${userId}|${playerData.joinDate}|${playerData.name}`;
            let vtcDataForEmbed = null;
            if (vtcUrl) {
                const vtcUrlMatch = vtcUrl.match(/truckersmp\.com\/vtc\/(\d+)/);
                if (vtcUrlMatch && vtcUrlMatch[1]) {
                    const vtcId = vtcUrlMatch[1];
                    try {
                        const vtcResponse = await truckersMP.get(`/vtc/${vtcId}`);
                        const vtcData = vtcResponse.data.response;
                        if (vtcData) {
                            payload += `|${vtcData.id}|${vtcData.owner_id}`;
                            vtcDataForEmbed = vtcData;
                        }
                    } catch (vtcError) {
                        console.error(`[${new Date().toISOString()}] Error fetching VTC data for VTC ID ${vtcId}:`, vtcError.message);
                        await interaction.followUp({
                            content: t('common.vtc_url_error'),
                            flags: 64 // Ephemeral
                        });
                    }
                }
            }

            const signature = crypto.createHmac('sha256', hmacSecret).update(payload).digest('hex');
            const verificationCode = `${Buffer.from(payload).toString('base64')}.${signature}`;

            const fields = [
                { name: t('commands.verificar.fields.code'), value: '```\n' + verificationCode + '\n```' },
                { name: t('commands.verificar.fields.where_to_use'), value: t('commands.verificar.fields.where_to_use_value') }
            ];

            if (vtcDataForEmbed) {
                fields.push({ name: t('commands.verificar.fields.vtc_processed'), value: `${vtcDataForEmbed.name}`, inline: true });
            }

            const embed = createStyledEmbed({
                color: colors.success,
                title: t('commands.verificar.embed_title'),
                description: t('commands.verificar.embed_description'),
                fields: fields,
                footer: { text: t('commands.verificar.footer') }
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            if (error.response && error.response.status === 404) {
                await interaction.editReply(t('common.user_profile_not_found'));
            } else {
                // For other errors, re-throw to be caught by the global error handler
                throw error;
            }
        }
    },
};