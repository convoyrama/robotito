const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');
const { hmacSecret, colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');
const { truckersMP } = require('../utils/apiClients');

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
        if (!interaction.channel.permissionsFor(interaction.client.user).has('EmbedLinks')) {
            await interaction.editReply({ content: 'No tengo permiso para enviar mensajes incrustados (Embeds) en este canal. Por favor, contacta a un administrador.', flags: 64 });
            return;
        }
        const userUrl = interaction.options.getString('url');
        const vtcUrl = interaction.options.getString('url_vtc');
        const userUrlMatch = userUrl.match(/truckersmp\.com\/(?:user|profile)\/(\d+)/);
        if (!userUrlMatch || !userUrlMatch[1]) {
            await interaction.editReply({ content: 'La URL de perfil de usuario proporcionada no es válida. Asegúrate de que sea la URL completa.', flags: 64 });
            return;
        }
        const userId = userUrlMatch[1];
        try {
            const playerResponse = await truckersMP.get(`/player/${userId}`);
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
                        const vtcResponse = await truckersMP.get(`/vtc/${vtcId}`);
                        const vtcData = vtcResponse.data.response;
                        if (vtcData) {
                            payload += `|${vtcData.id}|${vtcData.owner_id}`;
                            vtcDataForEmbed = vtcData;
                        }
                    } catch (vtcError) {
                        console.error(`[${new Date().toISOString()}] Error fetching VTC data for VTC ID ${vtcId}:`, vtcError.message);
                        await interaction.followUp({ 
                            content: '⚠️ No se pudo procesar la URL de la VTC. Se generará el código solo con tu perfil de usuario. Verifica que la URL de la VTC sea correcta.',
                            flags: 64 // Ephemeral
                        });
                    }
                }
            }

            const signature = crypto.createHmac('sha256', hmacSecret).update(payload).digest('hex');
            const verificationCode = `${Buffer.from(payload).toString('base64')}.${signature}`;

            const fields = [
                { name: 'Tu Código de Verificación', value: '```\n' + verificationCode + '\n```' },
                { name: '¿Dónde usar este código?', value: '[Haz clic aquí para ir al Generador de ID](https://convoyrama.github.io/id.html)' }
            ];

            if (vtcDataForEmbed) {
                fields.push({ name: 'VTC Procesada', value: `${vtcDataForEmbed.name}`, inline: true });
            }

            const embed = createStyledEmbed({
                color: colors.success,
                title: '✅ Código de Verificación Generado',
                description: '¡Tu código está listo! Cópialo y pégalo en el campo correspondiente del generador de licencias.',
                fields: fields,
                footer: { text: 'Este código vincula tu licencia a tu fecha de registro real.' }
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            if (error.response && error.response.status === 404) {
                await interaction.editReply('No se pudo encontrar el perfil de TruckersMP. Verifica que la URL sea correcta y que el perfil no sea privado.');
            } else {
                // For other errors, re-throw to be caught by the global error handler
                throw error;
            }
        }
    },
};
