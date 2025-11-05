const { SlashCommandBuilder } = require('discord.js');
const { FAREWELL_MESSAGE_OWN, FAREWELL_MESSAGE_EXTERNAL, colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('despedida')
        .setDescription('Envía un mensaje de despedida de convoy (propio o ajeno).')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo de despedida (propia o ajena).')
                .setRequired(false)
                .addChoices(
                    { name: 'propia', value: 'propia' },
                    { name: 'ajena', value: 'ajena' },
                )),
    async execute(interaction) {
        await interaction.deferReply();
        const type = interaction.options.getString('tipo');
        let farewellMessage = FAREWELL_MESSAGE_EXTERNAL;
        let title = '👋 ¡Despedida de Convoy Externo!';
        if (type && type.toLowerCase() === \'propia\') {\n            farewellMessage = FAREWELL_MESSAGE_OWN;\n            title = \'👋 ¡Hasta la Próxima Ruta!\';\n        }\n\n        const codeBlockMessage = `\`\`\`\\n${farewellMessage}\\n\`\`\``;\n\n        const embed = createStyledEmbed({\n            color: colors.primary,\n            title: title,\n            description: codeBlockMessage,\n            footer: { text: \'¡Nos vemos en el camino!\' }\n        });

        await interaction.editReply({ embeds: [embed] });
    },
};
