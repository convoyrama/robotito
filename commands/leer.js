const { SlashCommandBuilder, GuildScheduledEventPrivacyLevel } = require('discord.js');
const extract = require('png-chunks-extract');
const text = require('png-chunk-text');
const { DateTime } = require('luxon');
const { createStyledEmbed, getDetailedDayNightIcon } = require('../utils/helpers');
const { colors, ranks } = require('../config');
const { fetchUrl } = require('../utils/apiClients');
const { t } = require('../utils/localization');

function isValidHttpUrl(string) {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.leer.name'))
        .setDescription(t('commands.leer.description'))
        .addAttachmentOption(option =>
            option.setName(t('commands.leer.options.imagen.name'))
                .setDescription(t('commands.leer.options.imagen.description'))
                .setRequired(true))
        .addStringOption(option =>
            option.setName(t('commands.leer.options.accion.name'))
                .setDescription(t('commands.leer.options.accion.description'))
                .setRequired(false)
                .addChoices(
                    { name: t('commands.leer.options.accion.choices.mostrar'), value: 'mostrar' },
                    { name: t('commands.leer.options.accion.choices.crear'), value: 'crear' }
                )),
    async execute(interaction) {
        await interaction.deferReply();

        const attachment = interaction.options.getAttachment(t('commands.leer.options.imagen.name'));

        if (!attachment || !attachment.contentType.startsWith('image/png')) {
            await interaction.editReply(t('commands.leer.invalid_png'));
            return;
        }

        try {
            const response = await fetchUrl(attachment.url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');

            const chunks = extract(buffer);
            const textChunks = chunks.filter(chunk => chunk.name === 'tEXt').map(chunk => text.decode(chunk.data));

            const licenseChunk = textChunks.find(chunk => chunk.keyword === 'convoyrama-data');
            const eventChunk = textChunks.find(chunk => chunk.keyword === 'convoyrama-event-data');

            if (licenseChunk) {
                let licenseData;
                try {
                    licenseData = JSON.parse(licenseChunk.text);
                } catch (error) {
                    await interaction.editReply(t('commands.leer.error_parsing_license'));
                    console.error('Error parsing license JSON:', error);
                    return;
                }

                const rankInfo = ranks.find(r => r.id === licenseData.rank);

                const fields = [
                    { name: t('commands.leer.license_fields.license_number'), value: licenseData.license_number, inline: true },
                    { name: t('commands.leer.license_fields.country'), value: `:flag_${licenseData.country.toLowerCase()}:`, inline: true },
                ];

                if (licenseData.rank) {
                    fields.push({ name: t('commands.leer.license_fields.rank'), value: String(licenseData.rank), inline: true });
                }

                fields.push({ name: t('commands.leer.license_fields.status'), value: licenseData.is_verified ? t('commands.leer.license_fields.verified') : t('commands.leer.license_fields.not_verified'), inline: false });
                fields.push({ name: t('commands.leer.license_fields.tmp_profile'), value: `[${t('commands.leer.license_fields.view_profile')}](${licenseData.truckersmp_link})`, inline: false });

                if (licenseData.vtc_link) {
                    fields.push({ name: t('commands.leer.license_fields.vtc'), value: `[${t('commands.leer.license_fields.view_vtc')}](${licenseData.vtc_link})`, inline: false });
                }

                if (licenseData.social_network && licenseData.social_link) {
                    const socialName = licenseData.social_network.charAt(0).toUpperCase() + licenseData.social_network.slice(1);
                    fields.push({ name: socialName, value: `[${t('commands.leer.license_fields.social_link')}](${licenseData.social_link})`, inline: false });
                }

                if (licenseData.is_verified && licenseData.tmp_join_date) {
                    let joinDate = DateTime.fromISO(licenseData.tmp_join_date);
                    if (!joinDate.isValid) {
                        joinDate = DateTime.fromSQL(licenseData.tmp_join_date);
                    }
                    if (joinDate.isValid) {
                        fields.push({ name: t('commands.leer.license_fields.member_since'), value: joinDate.toFormat('dd/MM/yyyy'), inline: false });
                    }
                }

                fields.push({ name: t('commands.leer.license_fields.additional_info'), value: t('commands.leer.license_fields.additional_info_value'), inline: false });

                const embed = createStyledEmbed({
                    color: licenseData.is_verified ? colors.success : colors.error,
                    title: t('commands.leer.license_title', { name: licenseData.name }),
                    url: licenseData.truckersmp_link,
                    thumbnail: rankInfo ? rankInfo.image : null,
                    image: attachment.url,
                    fields: fields,
                    footer: { text: t('commands.leer.license_footer', { generated_at: DateTime.fromISO(licenseData.generated_at).toFormat('dd/MM/yyyy HH:mm') }) }
                });

                await interaction.editReply({ embeds: [embed] });

            } else if (eventChunk) {
                let eventData;
                try {
                    eventData = JSON.parse(eventChunk.text);
                } catch (error) {
                    await interaction.editReply(t('commands.leer.error_parsing_event'));
                    console.error('Error parsing event JSON:', error);
                    return;
                }

                const accion = interaction.options.getString(t('commands.leer.options.accion.name')) || 'mostrar'; // Default to 'mostrar'

                if (accion === 'crear') {
                    const eventName = eventData.eventName;
                    const eventLink = isValidHttpUrl(eventData.eventLink) ? eventData.eventLink : 'https://truckersmp.com/';
                    const eventLocation = eventData.startPlace || t('commands.evento.field_no_description');
                    const eventServer = eventData.server || t('commands.evento.field_no_description');
                    const eventDestination = eventData.destination || t('commands.evento.field_no_description');

                    const meetingGameTimeEmoji = getDetailedDayNightIcon(eventData.meetingGameTime.hours);
                    const arrivalGameTimeEmoji = getDetailedDayNightIcon(eventData.arrivalGameTime.hours);

                    let eventDescription = eventData.description || t('commands.leer.event_autogen_desc');
                    eventDescription += `\n\n**${t('commands.leer.event_fields.link')}:** [${t('commands.leer.event_fields.view_event')}](${eventLink})`;
                    eventDescription += `\n**${t('commands.leer.event_fields.server')}:** ${eventServer}`;
                    eventDescription += `\n**${t('commands.leer.event_fields.start_place')}:** ${eventLocation}`;
                    eventDescription += `\n**${t('commands.leer.event_fields.destination')}:** ${eventDestination}`;
                    eventDescription += `\n**${t('commands.leer.event_fields.meeting')}:** <t:${eventData.meetingTimestamp}:F> (<t:${eventData.meetingTimestamp}:R>)`;
                    eventDescription += `\n**${t('commands.leer.event_fields.departure')}:** <t:${eventData.departureTimestamp}:F> (<t:${eventData.departureTimestamp}:R>)`;
                    eventDescription += `\n**${t('commands.leer.event_fields.meeting_ingame')}:** ${meetingGameTimeEmoji} ${eventData.meetingGameTime.hours.toString().padStart(2, '0')}:${eventData.meetingGameTime.minutes.toString().padStart(2, '0')}`;
                    eventDescription += `\n**${t('commands.leer.event_fields.arrival_ingame')}:** ${arrivalGameTimeEmoji} ${eventData.arrivalGameTime.hours.toString().padStart(2, '0')}:${eventData.arrivalGameTime.minutes.toString().padStart(2, '0')}`;


                    if (!eventName || !eventData.meetingTimestamp || !eventData.arrivalTimestamp) {
                        await interaction.editReply(t('commands.leer.incomplete_event_data'));
                        return;
                    }

                    const scheduledStartTime = DateTime.fromSeconds(eventData.meetingTimestamp).toJSDate();
                    const scheduledEndTime = DateTime.fromSeconds(eventData.arrivalTimestamp).toJSDate();

                    if (scheduledEndTime <= scheduledStartTime) {
                        await interaction.editReply(t('commands.leer.invalid_event_times'));
                        return;
                    }

                    const imageBuffer = buffer;

                    try {
                        const scheduledEvent = await interaction.guild.scheduledEvents.create({
                            name: eventName,
                            description: eventDescription,
                            scheduledStartTime: scheduledStartTime,
                            scheduledEndTime: scheduledEndTime,
                            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                            entityType: 3, // EXTERNAL
                            entityMetadata: { location: eventLocation },
                            image: imageBuffer,
                        });

                        const embed = createStyledEmbed({
                            color: colors.success,
                            title: t('commands.leer.event_created_title'),
                            description: t('commands.leer.event_created_desc', { eventName, eventUrl: scheduledEvent.url }),
                            fields: [
                                { name: t('commands.leer.event_created_fields.name'), value: eventName, inline: true },
                                { name: t('commands.leer.event_created_fields.meeting'), value: `<t:${eventData.meetingTimestamp}:F> (<t:${eventData.meetingTimestamp}:R>)`, inline: false },
                                { name: t('commands.leer.event_created_fields.link'), value: `[${t('commands.leer.event_fields.view_event')}](${scheduledEvent.url})`, inline: false },
                            ],
                            thumbnail: attachment.url,
                            footer: { text: t('commands.leer.event_created_footer', { eventId: scheduledEvent.id }) }
                        });

                        await interaction.editReply({ embeds: [embed] });

                    } catch (discordError) {
                        console.error('Error creating Discord Scheduled Event:', discordError);
                        await interaction.editReply(t('commands.leer.error_creating_event', { errorMessage: discordError.message }));
                    }
                } else { // accion === 'mostrar'
                    const fields = [];

                    fields.push({ name: t('commands.leer.event_fields.name'), value: eventData.eventName || 'N/A', inline: false });
                    fields.push({ name: t('commands.leer.event_fields.link'), value: isValidHttpUrl(eventData.eventLink) ? `[${t('commands.leer.event_fields.view_event')}](${eventData.eventLink})` : `[${t('commands.leer.event_fields.view_event')}](https://truckersmp.com/)`, inline: false });
                    fields.push({ name: t('commands.leer.event_fields.start_place'), value: eventData.startPlace || 'N/A', inline: true });
                    fields.push({ name: t('commands.leer.event_fields.destination'), value: eventData.destination || 'N/A', inline: true });
                    fields.push({ name: t('commands.leer.event_fields.server'), value: eventData.server || 'N/A', inline: true });
                    fields.push({ name: t('commands.leer.event_fields.description'), value: eventData.description || 'N/A', inline: false });

                    if (eventData.meetingTimestamp) {
                        fields.push({ name: t('commands.leer.event_fields.meeting'), value: `<t:${eventData.meetingTimestamp}:F> (<t:${eventData.meetingTimestamp}:R>)`, inline: false });
                    }
                    if (eventData.departureTimestamp) {
                        fields.push({ name: t('commands.leer.event_fields.departure'), value: `<t:${eventData.departureTimestamp}:t> (<t:${eventData.departureTimestamp}:R>)`, inline: true });
                    }
                    if (eventData.arrivalTimestamp) {
                        fields.push({ name: t('commands.leer.event_fields.arrival'), value: `<t:${eventData.arrivalTimestamp}:t> (<t:${eventData.arrivalTimestamp}:R>)`, inline: true });
                    }

                    if (eventData.meetingGameTime) {
                        const meetingEmoji = getDetailedDayNightIcon(eventData.meetingGameTime.hours);
                        fields.push({ name: t('commands.leer.event_fields.meeting_ingame'), value: `${meetingEmoji} ${eventData.meetingGameTime.hours.toString().padStart(2, '0')}:${eventData.meetingGameTime.minutes.toString().padStart(2, '0')}`, inline: true });
                    }
                    if (eventData.arrivalGameTime) {
                        const arrivalEmoji = getDetailedDayNightIcon(eventData.arrivalGameTime.hours);
                        fields.push({ name: t('commands.leer.event_fields.arrival_ingame'), value: `${arrivalEmoji} ${eventData.arrivalGameTime.hours.toString().padStart(2, '0')}:${eventData.arrivalGameTime.minutes.toString().padStart(2, '0')}`, inline: true });
                    }

                    const embed = createStyledEmbed({
                        color: colors.primary,
                        title: t('commands.leer.event_details_title', { eventName: eventData.eventName || 'Evento Personalizado' }),
                        url: isValidHttpUrl(eventData.eventLink) ? eventData.eventLink : null,
                        image: attachment.url,
                        fields: fields,
                        footer: { text: t('commands.leer.event_details_footer', { generatedAt: DateTime.fromISO(eventData.generatedAt).toFormat('dd/MM/yyyy HH:mm') }) }
                    });

                    await interaction.editReply({ embeds: [embed] });
                }
            } else {
                await interaction.editReply(t('commands.leer.no_data_found'));
            }

        } catch (error) {
            console.error('Error processing image:', error);
            await interaction.editReply(t('commands.leer.error_processing_image'));
        }
    },
};