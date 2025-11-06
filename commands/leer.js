const { SlashCommandBuilder, GuildScheduledEventPrivacyLevel } = require('discord.js');
const extract = require('png-chunks-extract');
const text = require('png-chunk-text');
const { DateTime } = require('luxon');
const { createStyledEmbed, getDetailedDayNightIcon } = require('../utils/helpers');
const { colors, ranks } = require('../config');
const { fetchUrl } = require('../utils/apiClients');

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
        .setName('leer')
        .setDescription('Lee los datos de una licencia o evento de Convoyrama a partir de una imagen PNG.')
        .addAttachmentOption(option =>
            option.setName('imagen')
                .setDescription('El archivo de imagen PNG de la licencia o evento.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('accion')
                .setDescription('¿Qué acción deseas realizar con los datos del evento?')
                .setRequired(false) // Make it optional, default to 'mostrar'
                .addChoices(
                    { name: 'Mostrar Detalles', value: 'mostrar' },
                    { name: 'Crear Evento Programado', value: 'crear' }
                )),
    async execute(interaction) {
        await interaction.deferReply();

        const attachment = interaction.options.getAttachment('imagen');

        if (!attachment || !attachment.contentType.startsWith('image/png')) {
            await interaction.editReply('Por favor, adjunta un archivo de imagen PNG válido.');
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
                    await interaction.editReply('Hubo un error al interpretar los datos de la licencia. El formato es inválido.');
                    console.error('Error parsing license JSON:', error);
                    return;
                }

                const rankInfo = ranks.find(r => r.id === licenseData.rank);

                const fields = [
                    { name: 'Nº de Licencia', value: licenseData.license_number, inline: true },
                    { name: 'País', value: `:flag_${licenseData.country.toLowerCase()}:`, inline: true },
                ];

                if (licenseData.rank) {
                    fields.push({ name: 'Rango:', value: String(licenseData.rank), inline: true });
                }

                fields.push({ name: 'Estado', value: licenseData.is_verified ? '✅ Verificada' : '❌ No Verificada', inline: false });
                fields.push({ name: 'Perfil de TruckersMP', value: `[Ver Perfil](${licenseData.truckersmp_link})`, inline: false });

                if (licenseData.vtc_link) {
                    fields.push({ name: 'VTC', value: `[Ver VTC](${licenseData.vtc_link})`, inline: false });
                }

                if (licenseData.social_network && licenseData.social_link) {
                    const socialName = licenseData.social_network.charAt(0).toUpperCase() + licenseData.social_network.slice(1);
                    fields.push({ name: socialName, value: `[Ver Enlace](${licenseData.social_link})`, inline: false });
                }
                
                if (licenseData.is_verified && licenseData.tmp_join_date) {
                    fields.push({ name: 'Miembro desde', value: DateTime.fromISO(licenseData.tmp_join_date.replace(' ', 'T')).toFormat('dd/MM/yyyy'), inline: false });
                }

                fields.push({ name: 'Información Adicional', value: 'Genera tu licencia en [Convoyrama](https://convoyrama.github.io/).\nPara ser incluido en la [lista de ID](https://convoyrama.github.io/idlist.html), solicítalo por ticket en Discord.', inline: false });

                const embed = createStyledEmbed({
                    color: licenseData.is_verified ? colors.success : colors.error,
                    title: `Licencia de Conducir: ${licenseData.name}`,
                    url: licenseData.truckersmp_link,
                    thumbnail: rankInfo ? rankInfo.image : null,
                    image: attachment.url,
                    fields: fields,
                    footer: { text: `Licencia generada el ${DateTime.fromISO(licenseData.generated_at).toFormat('dd/MM/yyyy HH:mm')}` }
                });

                await interaction.editReply({ embeds: [embed] });

            } else if (eventChunk) {
                let eventData;
                try {
                    eventData = JSON.parse(eventChunk.text);
                } catch (error) {
                    await interaction.editReply('Hubo un error al interpretar los datos del evento. El formato es inválido.');
                    console.error('Error parsing event JSON:', error);
                    return;
                }

                const accion = interaction.options.getString('accion') || 'mostrar'; // Default to 'mostrar'

                if (accion === 'crear') {
                    // --- Event Data Validation and Discord Event Creation --- 

                    const eventName = eventData.eventName;
                    const eventLink = isValidHttpUrl(eventData.eventLink) ? eventData.eventLink : 'https://truckersmp.com/';
                    const eventLocation = eventData.startPlace || 'Lugar no especificado';
                    const eventServer = eventData.server || 'Servidor no especificado';
                    const eventDestination = eventData.destination || 'Destino no especificado';

                    const meetingGameTimeEmoji = getDetailedDayNightIcon(eventData.meetingGameTime.hours);
                    const arrivalGameTimeEmoji = getDetailedDayNightIcon(eventData.arrivalGameTime.hours);

                    let eventDescription = eventData.description || 'Evento generado automáticamente por Robotito.';
                    eventDescription += `\n\n**Enlace del Evento:** [Ver Evento](${eventLink})`;
                    eventDescription += `\n**Servidor:** ${eventServer}`;
                    eventDescription += `\n**Lugar de Partida:** ${eventLocation}`;
                    eventDescription += `\n**Destino:** ${eventDestination}`;
                    eventDescription += `\n**Hora In-Game (Reunión):** ${meetingGameTimeEmoji} ${eventData.meetingGameTime.hours.toString().padStart(2, '0')}:${eventData.meetingGameTime.minutes.toString().padStart(2, '0')}`;
                    eventDescription += `\n**Hora In-Game (Llegada Aprox.):** ${arrivalGameTimeEmoji} ${eventData.arrivalGameTime.hours.toString().padStart(2, '0')}:${eventData.arrivalGameTime.minutes.toString().padStart(2, '0')}`;


                    if (!eventName || !eventData.meetingTimestamp || !eventData.arrivalTimestamp) {
                        await interaction.editReply('Los datos del evento están incompletos (falta nombre, hora de reunión o hora de llegada).');
                        return;
                    }

                    const scheduledStartTime = DateTime.fromSeconds(eventData.meetingTimestamp).toJSDate();
                    const scheduledEndTime = DateTime.fromSeconds(eventData.arrivalTimestamp).toJSDate();

                    if (scheduledEndTime <= scheduledStartTime) {
                        await interaction.editReply('La hora de llegada debe ser posterior a la hora de reunión.');
                        return;
                    }

                    // Discord Scheduled Event requires a cover image as a base64 string or Buffer
                    const imageBuffer = buffer; // The original image buffer

                    try {
                        const scheduledEvent = await interaction.guild.scheduledEvents.create({
                            name: eventName,
                            description: eventDescription,
                            scheduledStartTime: scheduledStartTime,
                            scheduledEndTime: scheduledEndTime,
                            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly, // Corrected privacy level
                            entityType: 3, // EXTERNAL
                            entityMetadata: { location: eventLocation },
                            image: imageBuffer,
                        });

                        const embed = createStyledEmbed({
                            color: colors.success,
                            title: 'Evento Programado Creado',
                            description: `Se ha creado el evento **[${eventName}](${scheduledEvent.url})** exitosamente.`, 
                            fields: [
                                { name: 'Nombre', value: eventName, inline: true },
                                { name: 'Descripción', value: eventDescription, inline: false },
                                { name: 'Reunión', value: `<t:${eventData.meetingTimestamp}:F> (<t:${eventData.meetingTimestamp}:R>)`, inline: false },
                                { name: 'Salida', value: `<t:${eventData.departureTimestamp}:F> (<t:${eventData.departureTimestamp}:R>)`, inline: false },
                                { name: 'Enlace del Evento', value: eventLink ? `[Ver Evento](${eventLink})` : 'N/A', inline: false },
                            ],
                            thumbnail: attachment.url,
                            footer: { text: `ID del Evento: ${scheduledEvent.id}` }
                        });

                        await interaction.editReply({ embeds: [embed] });

                    } catch (discordError) {
                        console.error('Error creating Discord Scheduled Event:', discordError);
                        await interaction.editReply(`Hubo un error al crear el evento programado de Discord: ${discordError.message}`);
                    }
                } else { // accion === 'mostrar'
                    const fields = [];

                    fields.push({ name: 'Nombre del Evento', value: eventData.eventName || 'N/A', inline: false });
                    fields.push({ name: 'Enlace del Evento', value: isValidHttpUrl(eventData.eventLink) ? `[Ver Evento](${eventData.eventLink})` : `[Ver Evento](https://truckersmp.com/)`, inline: false });
                    fields.push({ name: 'Lugar de Partida', value: eventData.startPlace || 'N/A', inline: true });
                    fields.push({ name: 'Destino', value: eventData.destination || 'N/A', inline: true });
                    fields.push({ name: 'Servidor', value: eventData.server || 'N/A', inline: true });
                    fields.push({ name: 'Descripción', value: eventData.description || 'N/A', inline: false });

                    if (eventData.meetingTimestamp) {
                        fields.push({ name: 'Reunión', value: `<t:${eventData.meetingTimestamp}:F> (<t:${eventData.meetingTimestamp}:R>)`, inline: false });
                    }
                    if (eventData.departureTimestamp) {
                        fields.push({ name: 'Salida', value: `<t:${eventData.departureTimestamp}:t> (<t:${eventData.departureTimestamp}:R>)`, inline: true });
                    }
                    if (eventData.arrivalTimestamp) {
                        fields.push({ name: 'Llegada Aprox.', value: `<t:${eventData.arrivalTimestamp}:t> (<t:${eventData.arrivalTimestamp}:R>)`, inline: true });
                    }

                    if (eventData.meetingGameTime) {
                        const meetingEmoji = getDetailedDayNightIcon(eventData.meetingGameTime.hours);
                        fields.push({ name: 'Hora In-Game (Reunión)', value: `${meetingEmoji} ${eventData.meetingGameTime.hours.toString().padStart(2, '0')}:${eventData.meetingGameTime.minutes.toString().padStart(2, '0')}`, inline: true });
                    }
                    if (eventData.arrivalGameTime) {
                        const arrivalEmoji = getDetailedDayNightIcon(eventData.arrivalGameTime.hours);
                        fields.push({ name: 'Hora In-Game (Llegada Aprox.)', value: `${arrivalEmoji} ${eventData.arrivalGameTime.hours.toString().padStart(2, '0')}:${eventData.arrivalGameTime.minutes.toString().padStart(2, '0')}`, inline: true });
                    }

                    const embed = createStyledEmbed({
                        color: colors.primary,
                        title: `Detalles del Evento: ${eventData.eventName || 'Evento Personalizado'}`, 
                        url: isValidHttpUrl(eventData.eventLink) ? eventData.eventLink : null,
                        image: attachment.url,
                        fields: fields,
                        footer: { text: `Generado el ${DateTime.fromISO(eventData.generatedAt).toFormat('dd/MM/yyyy HH:mm')}` }
                    });

                    await interaction.editReply({ embeds: [embed] });
                }
            } else {
                await interaction.editReply('No se encontraron datos de licencia ni de evento en la imagen. Asegúrate de que la imagen fue generada por Convoyrama.');
            }

        } catch (error) {
            console.error('Error processing image:', error);
            await interaction.editReply('Hubo un error al procesar la imagen.');
        }
    },
};