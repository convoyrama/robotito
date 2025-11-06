const { SlashCommandBuilder } = require('discord.js');
const extract = require('png-chunks-extract');
const text = require('png-chunk-text');
const { DateTime } = require('luxon');
const { createStyledEmbed } = require('../utils/helpers');
const { colors, ranks } = require('../config');
const { fetchUrl } = require('../utils/apiClients');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leer')
        .setDescription('Lee los datos de un evento de Convoyrama a partir de una imagen PNG.')
        .addAttachmentOption(option =>
            option.setName('imagen')
                .setDescription('El archivo de imagen PNG de la licencia o evento.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const attachment = interaction.options.getAttachment('licencia');

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

                const fields = [];

                fields.push({ name: 'Nombre del Evento', value: eventData.eventName || 'N/A', inline: false });
                fields.push({ name: 'Enlace del Evento', value: eventData.eventLink ? `[Ver Evento](${eventData.eventLink})` : 'N/A', inline: false });
                fields.push({ name: 'Lugar de Partida', value: eventData.startPlace || 'N/A', inline: true });
                fields.push({ name: 'Destino', value: eventData.destination || 'N/A', inline: true });
                fields.push({ name: 'Servidor', value: eventData.server || 'N/A', inline: true });
                fields.push({ name: 'Descripción', value: eventData.description || 'N/A', inline: false });

                if (eventData.meetingTimestamp) {
                    fields.push({ name: 'Reunión (UTC)', value: `<t:${eventData.meetingTimestamp}:F> (<t:${eventData.meetingTimestamp}:R>)`, inline: false });
                }
                if (eventData.departureTimestamp) {
                    fields.push({ name: 'Salida (UTC)', value: `<t:${eventData.departureTimestamp}:t> (<t:${eventData.departureTimestamp}:R>)`, inline: true });
                }
                if (eventData.arrivalTimestamp) {
                    fields.push({ name: 'Llegada Aprox. (UTC)', value: `<t:${eventData.arrivalTimestamp}:t> (<t:${eventData.arrivalTimestamp}:R>)`, inline: true });
                }

                if (eventData.meetingGameTime) {
                    fields.push({ name: 'Hora In-Game (Reunión)', value: `${eventData.meetingGameTime.hours.toString().padStart(2, '0')}:${eventData.meetingGameTime.minutes.toString().padStart(2, '0')}`, inline: true });
                }
                if (eventData.arrivalGameTime) {
                    fields.push({ name: 'Hora In-Game (Llegada Aprox.)', value: `${eventData.arrivalGameTime.hours.toString().padStart(2, '0')}:${eventData.arrivalGameTime.minutes.toString().padStart(2, '0')}`, inline: true });
                }

                fields.push({ name: 'Zona Horaria', value: eventData.ianaTimeZone || 'N/A', inline: true });
                fields.push({ name: 'Offset UTC', value: `UTC${eventData.utcOffsetMinutes / 60}`, inline: true });

                const embed = createStyledEmbed({
                    color: colors.primary,
                    title: `Detalles del Evento: ${eventData.eventName || 'Evento Personalizado'}`, 
                    url: eventData.eventLink || null,
                    image: attachment.url,
                    fields: fields,
                    footer: { text: `Generado el ${DateTime.fromISO(eventData.generatedAt).toFormat('dd/MM/yyyy HH:mm')}` }
                });

                await interaction.editReply({ embeds: [embed] });

            } else {
                await interaction.editReply('No se encontraron datos de licencia ni de evento en la imagen. Asegúrate de que la imagen fue generada por Convoyrama.');
            }

        } catch (error) {
            console.error('Error processing image:', error);
            await interaction.editReply('Hubo un error al procesar la imagen.');
        }
    },
};