const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const extract = require('png-chunks-extract');
const text = require('png-chunk-text');
const { DateTime } = require('luxon');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leer')
        .setDescription('Lee los datos de una licencia de Convoyrama a partir de una imagen PNG.')
        .addAttachmentOption(option =>
            option.setName('licencia')
                .setDescription('El archivo de imagen PNG de la licencia.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const attachment = interaction.options.getAttachment('licencia');

        if (!attachment || !attachment.contentType.startsWith('image/png')) {
            await interaction.editReply('Por favor, adjunta un archivo de imagen PNG válido.');
            return;
        }

        try {
            const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            
            const chunks = extract(buffer);
            const textChunks = chunks.filter(chunk => chunk.name === 'tEXt').map(chunk => text.decode(chunk.data));

            const licenseChunk = textChunks.find(chunk => chunk.keyword === 'convoyrama-data');

            if (!licenseChunk) {
                await interaction.editReply('No se encontraron datos de licencia en la imagen. Asegúrate de que la imagen fue generada por Convoyrama.');
                return;
            }

            let licenseData;
            try {
                licenseData = JSON.parse(licenseChunk.text);
            } catch (error) {
                await interaction.editReply('Hubo un error al interpretar los datos de la licencia. El formato es inválido.');
                console.error('Error parsing license JSON:', error);
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(licenseData.is_verified ? 0x57F287 : 0xED4245)
                .setTitle(`Licencia de Conducir: ${licenseData.name}`)
                .setURL(licenseData.truckersmp_link)
                .addFields(
                    { name: 'Nº de Licencia', value: licenseData.license_number, inline: true },
                    { name: 'País', value: `:flag_${licenseData.country.toLowerCase()}:`, inline: true },
                    { name: 'Estado', value: licenseData.is_verified ? '✅ Verificada' : '❌ No Verificada', inline: true },
                    { name: 'Perfil de TruckersMP', value: `[Ver Perfil](${licenseData.truckersmp_link})`, inline: false },
                )
                .setImage(attachment.url)
                .setFooter({ text: `Licencia generada el ${DateTime.fromISO(licenseData.generated_at).toFormat('dd/MM/yyyy HH:mm')}` });

            if (licenseData.vtc_link) {
                embed.addFields({ name: 'VTC', value: `[Ver VTC](${licenseData.vtc_link})`, inline: false });
            }
            
            if (licenseData.is_verified && licenseData.tmp_join_date) {
                embed.addFields({ name: 'Miembro desde', value: DateTime.fromISO(licenseData.tmp_join_date.replace(' ', 'T')).toFormat('dd/MM/yyyy'), inline: false });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error processing license image:', error);
            await interaction.editReply('Ocurrió un error al procesar la imagen de la licencia.');
        }
    },
};