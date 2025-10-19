const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const extract = require('png-chunks-extract');
const text = require('png-chunk-text');
const { DateTime } = require('luxon');

// Tabla de rangos para buscar la imagen
const ranks = [
    { id: 1, image: 'https://convoyrama.github.io/license_generator/rank/1.png' },
    { id: 2, image: 'https://convoyrama.github.io/license_generator/rank/2.png' },
    { id: 3, image: 'https://convoyrama.github.io/license_generator/rank/3.png' },
    { id: 4, image: 'https://convoyrama.github.io/license_generator/rank/4.png' },
    { id: 5, image: 'https://convoyrama.github.io/license_generator/rank/5.png' },
    { id: 6, image: 'https://convoyrama.github.io/license_generator/rank/6.png' },
    { id: 7, image: 'https://convoyrama.github.io/license_generator/rank/7.png' },
    { id: 8, image: 'https://convoyrama.github.io/license_generator/rank/8.png' },
    { id: 9, image: 'https://convoyrama.github.io/license_generator/rank/9.png' },
    { id: 10, image: 'https://convoyrama.github.io/license_generator/rank/10.png' },
    { id: 11, image: 'https://convoyrama.github.io/license_generator/rank/11.png' },
    { id: 12, image: 'https://convoyrama.github.io/license_generator/rank/12.png' }
];

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

            const rankInfo = ranks.find(r => r.id === licenseData.rank);

            const embed = new EmbedBuilder()
                .setColor(licenseData.is_verified ? 0x57F287 : 0xED4245)
                .setTitle(`Licencia de Conducir: ${licenseData.name}`)
                .setURL(licenseData.truckersmp_link)
                .setImage(attachment.url)
                .setFooter({ text: `Licencia generada el ${DateTime.fromISO(licenseData.generated_at).toFormat('dd/MM/yyyy HH:mm')}` });

            if (rankInfo) {
                embed.setThumbnail(rankInfo.image);
            }

            // Construcción de campos
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
                fields.push({ name: socialName, value: `[Ver Perfil](${licenseData.social_link})`, inline: false });
            }
            
            if (licenseData.is_verified && licenseData.tmp_join_date) {
                fields.push({ name: 'Miembro desde', value: DateTime.fromISO(licenseData.tmp_join_date.replace(' ', 'T')).toFormat('dd/MM/yyyy'), inline: false });
            }

            embed.addFields(fields);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error processing license image:', error);
            await interaction.editReply('Ocurrió un error al procesar la imagen de la licencia.');
        }
    },
};