const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const extract = require('png-chunks-extract');
const text = require('png-chunk-text');
const { DateTime } = require('luxon');
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');
const { fetchUrl } = require('../utils/apiClients');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crear-evento')
        .setDescription('Crea un evento programado de Discord a partir de una imagen PNG con datos de evento.')
        .addAttachmentOption(option =>
            option.setName('imagen')
                .setDescription('El archivo de imagen PNG del evento.')
                .setRequired(true)),
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

            const eventChunk = textChunks.find(chunk => chunk.keyword === 'convoyrama-event-data');

            if (!eventChunk) {
                await interaction.editReply('No se encontraron datos de evento en la imagen. Asegúrate de que la imagen fue generada por Convoyrama.');
                return;
            }

            let eventData;
            try {
                eventData = JSON.parse(eventChunk.text);
            } catch (error) {
                await interaction.editReply('Hubo un error al interpretar los datos del evento. El formato es inválido.');
                console.error('Error parsing event JSON:', error);
                return;
            }

            // --- Event Data Validation and Discord Event Creation --- 

            const eventName = eventData.eventName;
            const eventDescription = eventData.description || 'Evento generado automáticamente por Robotito.';
            const eventLocation = eventData.startPlace || 'Lugar no especificado';
            const eventLink = eventData.eventLink;

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
                    privacyLevel: 1, // GUILD_ONLY
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
                        { name: 'Lugar', value: eventLocation, inline: true },
                        { name: 'Inicio', value: `<t:${eventData.meetingTimestamp}:F> (<t:${eventData.meetingTimestamp}:R>)`, inline: false },
                        { name: 'Fin', value: `<t:${eventData.arrivalTimestamp}:F> (<t:${eventData.arrivalTimestamp}:R>)`, inline: false },
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

        } catch (error) {
            console.error('Error processing event image:', error);
            await interaction.editReply('Hubo un error al procesar la imagen del evento.');
        }
    },
};