const { SlashCommandBuilder } = require('discord.js');
const { createStyledEmbed } = require('../utils/helpers');
const { t } = require('../utils/localization');
const { colors } = require('../config');

// Mapeo de IDs de roles a las claves de traducción en locales/es.json
// El orden en este array define la JERARQUÍA (el primero que encuentre gana)
const ROLE_HIERARCHY = [
    { id: '1223005159815385210', key: 'owner' },           // Lagmin (Dueño)
    { id: '1409936678172360784', key: 'admin' },           // Lagmin (Admin/Gerencia)
    { id: '1344452677089755156', key: 'supervisor' },      // Lagvisor (Moderador)
    { id: '1409935945163341935', key: 'leader' },          // Líder de Comunidad
    { id: '1409938244686184608', key: 'content_creator' }, // Creador de Contenido
    { id: '1376993991475724478', key: 'member' },          // Lagger (Miembro VTC)
    { id: '1376994402857254962', key: 'honorary' }         // Honorario
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.yo.name'))
        .setDescription(t('commands.yo.description')),
    async execute(interaction) {
        const member = interaction.member;
        
        // Buscar el rol más alto que tenga el usuario según nuestra jerarquía
        let foundRoleKey = 'visitor'; // Valor por defecto
        
        for (const roleDef of ROLE_HIERARCHY) {
            if (member.roles.cache.has(roleDef.id)) {
                foundRoleKey = roleDef.key;
                break; // Encontramos el más alto, paramos de buscar
            }
        }

        // Obtener los textos traducidos para ese rol
        const roleData = t(`commands.yo.roles.${foundRoleKey}`);
        
        // Construir el embed
        const embed = createStyledEmbed({
            color: colors.primary,
            title: t('commands.yo.embed_title', { user: member.displayName }),
            thumbnail: member.user.displayAvatarURL(),
            description: `**${roleData.title}**\n\n${roleData.text}`,
            footer: { text: t('commands.yo.footer') }
        });

        await interaction.reply({ 
            content: t('commands.yo.thanks_message'),
            embeds: [embed], 
            flags: 64 // Ephemeral (solo lo ve el usuario)
        });
    },
};
