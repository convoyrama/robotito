const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { t } = require('../utils/localization');

module.exports = {
    data: new SlashCommandBuilder()
        .setName(t('commands.moderacion.name'))
        .setDescription(t('commands.moderacion.description'))
        .addUserOption(option =>
            option.setName(t('commands.moderacion.options.usuario.name'))
                .setDescription(t('commands.moderacion.options.usuario.description'))
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName(t('commands.moderacion.options.nivel.name'))
                .setDescription(t('commands.moderacion.options.nivel.description'))
                .setRequired(true)
                .addChoices(
                    { name: t('commands.moderacion.options.nivel.choices.nivel_1'), value: 1 },
                    { name: t('commands.moderacion.options.nivel.choices.nivel_2'), value: 2 },
                    { name: t('commands.moderacion.options.nivel.choices.nivel_3'), value: 3 }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers), // Solo admins/mods con permiso de ban
    async execute(interaction) {
        const targetUser = interaction.options.getUser(t('commands.moderacion.options.usuario.name'));
        const level = interaction.options.getInteger(t('commands.moderacion.options.nivel.name'));
        const member = interaction.guild.members.cache.get(targetUser.id);

        // Seleccionar la lista de mensajes basada en el nivel
        let messagesKey = '';
        switch (level) {
            case 1: messagesKey = 'commands.moderacion.messages.level1'; break;
            case 2: messagesKey = 'commands.moderacion.messages.level2'; break;
            case 3: messagesKey = 'commands.moderacion.messages.level3'; break;
        }

        const messages = t(messagesKey);
        
        // Elegir mensaje aleatorio
        let randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Reemplazar el placeholder {user} con la mención real
        const finalMessage = randomMessage.replace('{user}', `<@${targetUser.id}>`);

        // Ejecutar acción
        try {
            if (level === 3) {
                // Verificar si el bot puede banear al usuario (jerarquía de roles)
                if (member && !member.bannable) {
                    return interaction.reply({ 
                        content: t('commands.moderacion.ban_error', { user: targetUser.username }), 
                        flags: 64 // Ephemeral
                    });
                }

                // Enviar mensaje público ANTES de banear (para que quede constancia)
                await interaction.reply({ content: finalMessage });

                // Proceder con el ban
                // Nota: Si el usuario no está en el servidor (member es null), usamos la API de ban directo con el ID.
                await interaction.guild.members.ban(targetUser.id, { reason: `Protocolo Nivel 3 ejecutado por ${interaction.user.tag}` });
                
            } else {
                // Niveles 1 y 2 son solo advertencias públicas
                await interaction.reply({ content: finalMessage });
            }
        } catch (error) {
            console.error('Error en comando moderacion:', error);
            // Si ya respondimos (ej. nivel 3 falló después del reply), mandamos un followup
            if (interaction.replied) {
                await interaction.followUp({ content: t('commands.moderacion.ban_error', { user: targetUser.username }), flags: 64 });
            } else {
                await interaction.reply({ content: t('commands.moderacion.ban_error', { user: targetUser.username }), flags: 64 });
            }
        }
    },
};
