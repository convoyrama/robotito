const { SlashCommandBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { BASE_IMAGE_URL, POSITIVE_STATES, NEGATIVE_STATES, colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('estado')
        .setDescription('Muestra el estado de ánimo diario de Robotito.'),
    async execute(interaction) {
        await interaction.deferReply();
        const now = DateTime.local();

        const embedOptions = {
            footer: { text: `Estado del día ${now.toFormat('dd/MM/yyyy')}` }
        };

        if (now.month === 2 && now.day === 14) {
            embedOptions.image = `${BASE_IMAGE_URL}event/enamorado.png`;
            embedOptions.title = '❤️ ¡Feliz Día de San Valentín!';
            embedOptions.description = 'Que su ruta esté llena de amor y amistad. ¡Robotito les desea un feliz San Valentín a toda la comunidad!';
            embedOptions.color = colors.info; // Pinkish/Purple
        } else if (now.month === 10 && now.day === 31) {
            embedOptions.image = `${BASE_IMAGE_URL}event/halloween.png`;
            embedOptions.title = '🎃 ¡Feliz Halloween!';
            embedOptions.description = '¡Feliz Halloween! Que los únicos sustos de hoy sean en las películas y no en la carretera. ¡Cuidado ahí fuera!';
            embedOptions.color = colors.warning; // Orange
        } else if (now.month === 12 && now.day === 25) {
            embedOptions.image = `${BASE_IMAGE_URL}event/navidad.png`;
            embedOptions.title = '🎄 ¡Feliz Navidad!';
            embedOptions.description = '¡Jo, jo, jo! Robotito les desea una muy Feliz Navidad a toda la comunidad. ¡Que sus hogares se llenen de paz y alegría!';
            embedOptions.color = colors.error; // Red
        } else {
            const isPositiveDay = now.day % 2 === 0;
            let stateImage;
            if (isPositiveDay) {
                const index = now.day % POSITIVE_STATES.length;
                stateImage = POSITIVE_STATES[index];
                embedOptions.title = '😊 Hoy Robotito se siente... ¡Positivo!';
                embedOptions.color = colors.success;
            } else {
                const index = now.day % NEGATIVE_STATES.length;
                stateImage = NEGATIVE_STATES[index];
                embedOptions.title = '😕 Hoy Robotito se siente... ¡Un poco negativo!';
                embedOptions.color = colors.primary;
            }
            embedOptions.image = `${BASE_IMAGE_URL}estado/${stateImage}`;
        }

        const embed = createStyledEmbed(embedOptions);
        await interaction.editReply({ embeds: [embed] });
    },
};
