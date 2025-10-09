const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { BASE_IMAGE_URL, POSITIVE_STATES, NEGATIVE_STATES } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('estado')
        .setDescription('Muestra el estado de ánimo diario de Robotito.'),
    async execute(interaction) {
        await interaction.deferReply();
        const now = DateTime.local();
        let imageUrl, embedTitle, embedDescription = null, embedColor = 0x2ECC71;
        if (now.month === 2 && now.day === 14) {
            imageUrl = `${BASE_IMAGE_URL}event/enamorado.png`;
            embedTitle = '¡Feliz Día de San Valentín!';
            embedDescription = 'Que su ruta esté llena de amor y amistad. ¡Robotito les desea un feliz San Valentín a toda la comunidad!';
            embedColor = 0xE91E63;
        } else if (now.month === 10 && now.day === 31) {
            imageUrl = `${BASE_IMAGE_URL}event/halloween.png`;
            embedTitle = '¡Feliz Halloween!';
            embedDescription = '¡Feliz Halloween! Que los únicos sustos de hoy sean en las películas y no en la carretera. ¡Cuidado ahí fuera!';
            embedColor = 0xE67E22;
        } else if (now.month === 12 && now.day === 25) {
            imageUrl = `${BASE_IMAGE_URL}event/navidad.png`;
            embedTitle = '¡Feliz Navidad!';
            embedDescription = '¡Jo, jo, jo! Robotito les desea una muy Feliz Navidad a toda la comunidad. ¡Que sus hogares se llenen de paz y alegría!';
            embedColor = 0xE74C3C;
        } else {
            const isPositiveDay = now.day % 2 === 0;
            let stateImage;
            if (isPositiveDay) {
                const index = now.day % POSITIVE_STATES.length;
                stateImage = POSITIVE_STATES[index];
                embedTitle = 'Hoy Robotito se siente... ¡Positivo!';
                embedColor = 0x2ECC71;
            } else {
                const index = now.day % NEGATIVE_STATES.length;
                stateImage = NEGATIVE_STATES[index];
                embedTitle = 'Hoy Robotito se siente... ¡Un poco negativo!';
                embedColor = 0x3498DB;
            }
            imageUrl = `${BASE_IMAGE_URL}estado/${stateImage}`;
        }
        const embed = new EmbedBuilder().setColor(embedColor).setTitle(embedTitle).setImage(imageUrl).setFooter({ text: `Estado del día ${now.toFormat('dd/MM/yyyy')}` });
        if (embedDescription) embed.setDescription(embedDescription);
        await interaction.editReply({ embeds: [embed] });
    },
};
