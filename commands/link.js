const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Muestra enlaces útiles de Convoyrama y el Discord.'),
    async execute(interaction) {
        await interaction.deferReply();
        const embed = new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle('🔗 Enlaces Útiles de Convoyrama')
            .setDescription('Aquí tienes algunos enlaces importantes:')
            .addFields(
                { name: 'Generador de Eventos', value: '[Convoyrama Eventos](https://convoyrama.github.io/event.html)' },
                { name: 'Creador de ID', value: '[Convoyrama ID](https://convoyrama.github.io/id.html)' },
                { name: 'Generador de Imagen de Perfil', value: '[Convoyrama Perfil](https://convoyrama.github.io/pc.html)' },
                { name: 'Invitación a nuestro Discord', value: '> https://discord.gg/hjJcyREthH' },
                { name: 'TruckersMP', value: '[Sitio Oficial](https://truckersmp.com/)' },
                { name: 'LAG\'S SPEED en TruckersMP', value: '[Perfil VTC](https://truckersmp.com/vtc/78865)' },
                { name: 'LAG\'S SPEED en TrucksBook', value: '[Perfil de Empresa](https://trucksbook.eu/company/212761)' },
                { name: 'LAG\'S SPEED en PickupVTM', value: '[Perfil de Empresa](https://pickupvtm.com/company/8203)' }
            )
            .setFooter({ text: '¡Explora y únete a la diversión!' });
        await interaction.editReply({ embeds: [embed] });
    },
};
