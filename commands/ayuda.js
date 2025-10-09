const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ayuda')
        .setDescription('Muestra la lista de comandos de Robotito.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🤖 Comandos de Robotito')
            .setDescription('Aquí tienes una lista de lo que puedo hacer:')
            .addFields(
                { name: '/ayuda', value: 'Muestra esta lista de comandos.' },
                { name: '/clima [ciudad]', value: 'Muestra el clima actual de una ciudad.' },
                { name: '/tira [accion]', value: 'Muestra una tira cómica o información sobre ellas.' },
                { name: '/tito', value: 'Tito te cuenta un dato inútil y absurdo.' },
                { name: '/estado', value: 'Muestra el estado de ánimo diario de Robotito.' },
                { name: '/logo [opcion]', value: 'Muestra una de las 3 variantes del logo de la comunidad.' },
                { name: '/link', value: 'Muestra enlaces útiles de Convoyrama y el Discord.' },
                { name: '/ingame [tiempo] [ciudad]', value: 'Calcula la hora in-game para una hora y zona horaria específicas.' },
                { name: '/hora [tiempo] [ciudad]', value: 'Muestra la hora actual en varias zonas horarias o calcula esas horas.' },
                { name: '/despedida [tipo]', value: 'Envía un mensaje de despedida de convoy (propio o ajeno).' },
                { name: '/spam', value: 'Envía un mensaje aleatorio de la lista de textos predefinidos.' },
                { name: '/evento [periodo]', value: 'Muestra los eventos (próximo, semana, mes).' },
                { name: '/vtc', value: 'Muestra la lista de VTCs de la comunidad.' },
                { name: '/servidores', value: 'Muestra el estado de los servidores de TruckersMP.' },
                { name: '/info [enlace_o_alias]', value: 'Muestra información de un usuario o VTC de TruckersMP.' },
                { name: '/verificar', value: 'Genera un código para verificar tu cuenta y, opcionalmente, tu VTC.' }
            )
            .setFooter({ text: '¡Usa los comandos con el prefijo /' });
        await interaction.reply({ embeds: [embed], flags: 64 });
    },
};
