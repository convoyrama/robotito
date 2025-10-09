const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const crypto = require('crypto');
const { TRUCKERSMP_API_BASE_URL, hmacSecret } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verificar')
        .setDescription('Genera un código para verificar tu cuenta, y opcionalmente, tu VTC.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('La URL completa de tu perfil de TruckersMP.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('url_vtc')
                .setDescription('Opcional: La URL de tu VTC para verificar propiedad y logo.')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        const userUrl = interaction.options.getString('url');
        const vtcUrl = interaction.options.getString('url_vtc');
        const userUrlMatch = userUrl.match(/truckersmp\.com\/(?:user|profile)\/(\d+)/);
        if (!userUrlMatch || !userUrlMatch[1]) {
            await interaction.editReply({ content: 'La URL de perfil de usuario proporcionada no es válida. Asegúrate de que sea la URL completa.', flags: 64 });
            return;
        }
        const userId = userUrlMatch[1];
        try {
            const playerResponse = await axios.get(`${TRUCKERSMP_API_BASE_URL}/player/${userId}`);
            const playerData = playerResponse.data.response;
            if (!playerData || !playerData.joinDate) {
                await interaction.editReply('No se pudo encontrar la fecha de registro para este usuario. El perfil podría ser privado o el ID incorrecto.');
                return;
            }
            let payload = `${userId}|${playerData.joinDate}|${playerData.name}`;
            let vtcDataForEmbed = null;
            if (vtcUrl) {
                const vtcUrlMatch = vtcUrl.match(/truckersmp\.com\/vtc\/(\d+)/);
                if (vtcUrlMatch && vtcUrlMatch[1]) {
                    const vtcId = vtcUrlMatch[1];
                    try {
                        const vtcResponse = await axios.get(`${TRUCKERSMP_API_BASE_URL}/vtc/${vtcId}`);
                        const vtcData = vtcResponse.data.response;
                        if (vtcData) {
                            payload += `|${vtcData.id}|${vtcData.owner_id}`;
                            vtcDataForEmbed = vtcData;
                        }
                    } catch (vtcError) {
                        console.error(`[${new Date().toISOString()}] Error fetching VTC data for VTC ID ${vtcId}:`, vtcError.message);
                    }
                }
            }

            const signature = crypto.createHmac('sha256', hmacSecret).update(payload).digest('hex');
            const verificationCode = `${Buffer.from(payload).toString('base64')}.${signature}`;
            const embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('✅ Código de Verificación Generado')
                .setDescription('¡Tu código está listo! Cópialo y pégalo en el campo correspondiente del generador de licencias.')
                .addFields(
                    { name: 'Tu Código de Verificación', value: '```\n' + verificationCode + '\n```' },
                    { name: '¿Dónde usar este código?', value: '[Haz clic aquí para ir al Generador de ID](https://convoyrama.github.io/id.html)' }
                )
                .setFooter({ text: 'Este código vincula tu licencia a tu fecha de registro real.' });
            if (vtcDataForEmbed) {
                embed.addFields({ name: 'VTC Procesada', value: `${vtcDataForEmbed.name}`, inline: true });
            }
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error durante la verificación:', error);
            await interaction.editReply('Hubo un error al contactar la API de TruckersMP. Inténtalo de nuevo más tarde.');
        }
    },
};
