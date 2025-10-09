const { EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const axios = require('axios');
const { TRUCKERSMP_API_BASE_URL } = require('../config');

function getDetailedDayNightIcon(hours) {
    if (hours >= 6 && hours < 8) return '🌅';
    if (hours >= 8 && hours < 19) return '☀️';
    if (hours >= 19 && hours < 21) return '🌇';
    return '🌙';
}

async function getUpcomingEvents(guild, daysLimit = 0) {
    if (!guild) return [];

    const scheduledEvents = await guild.scheduledEvents.fetch();
    const now = Date.now();
    let timeLimit = 0;

    if (daysLimit > 0) {
        timeLimit = now + daysLimit * 24 * 60 * 60 * 1000;
    }

    const upcomingEvents = scheduledEvents.filter(event => {
        const startTime = event.scheduledStartTimestamp;
        if (daysLimit > 0) {
            return startTime > now && startTime < timeLimit;
        }
        return startTime > now;
    }).sort((a, b) => a.scheduledStartTimestamp - b.scheduledStartTimestamp);

    return upcomingEvents;
}

async function handlePlayerInfo(interaction, userId, profileUrl) {
    try {
        const response = await axios.get(`${TRUCKERSMP_API_BASE_URL}/player/${userId}`);
        const playerData = response.data.response;
        if (!playerData) {
            await interaction.editReply('No se encontró información para ese usuario de TruckersMP.');
            return;
        }
        const embed = new EmbedBuilder()
            .setColor(0x0077B6)
            .setTitle(`👤 Perfil de TruckersMP: ${playerData.name}`)
            .setURL(profileUrl)
            .setThumbnail(playerData.avatar || null)
            .addFields(
                { name: 'ID de TruckersMP', value: `${playerData.id}`, inline: true },
                { name: 'Registrado', value: playerData.joinDate ? DateTime.fromISO(playerData.joinDate.replace(' ', 'T')).toFormat('dd/MM/yyyy') : 'N/A', inline: true },
                { name: 'Última Conexión', value: playerData.lastGameTime ? DateTime.fromISO(playerData.lastGameTime.replace(' ', 'T')).toRelative() : 'N/A', inline: true },
                { name: 'Baneado', value: playerData.banned ? `Sí, hasta ${DateTime.fromISO(playerData.bannedUntil.replace(' ', 'T')).toFormat('dd/MM/yyyy HH:mm')}` : 'No', inline: true },
                { name: 'Número de Baneos', value: `${playerData.bansCount}`, inline: true },
                { name: 'En VTC', value: playerData.vtc && playerData.vtc.id ? `[${playerData.vtc.name} ${playerData.vtc.tag ? `[${playerData.vtc.tag}]` : ''}](https://truckersmp.com/vtc/${playerData.vtc.id})` : 'No', inline: true },
                { name: 'Grupo', value: playerData.groupName || 'N/A', inline: true },
                { name: 'Patreon', value: playerData.patreon.isPatron ? 'Sí' : 'No', inline: true },
                { name: 'Staff', value: playerData.permissions.isStaff ? 'Sí' : 'No', inline: true },
                { name: 'Game Admin', value: playerData.permissions.isGameAdmin ? 'Sí' : 'No', inline: true },
                { name: 'Management', value: playerData.permissions.isManagement ? 'Sí' : 'No', inline: true }
            )
            .setFooter({ text: 'Datos obtenidos de la API de TruckersMP.' });
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error al obtener datos de TruckersMP API:', error);
        if (error.response) {
            await interaction.editReply(`Error al consultar la API de TruckersMP: ${error.response.status} ${error.response.statusText}`);
        } else {
            await interaction.editReply('Lo siento, hubo un error al consultar la API de TruckersMP.');
        }
    }
}

module.exports = { getDetailedDayNightIcon, getUpcomingEvents, handlePlayerInfo };
