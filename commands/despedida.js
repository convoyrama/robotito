const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { FAREWELL_MESSAGE_OWN, FAREWELL_MESSAGE_EXTERNAL } = require('../config');

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
        if (type && type.toLowerCase() === 'propia') {
            farewellMessage = FAREWELL_MESSAGE_OWN;
            title = '👋 ¡Hasta la Próxima Ruta!';
        }
        const embed = new EmbedBuilder().setColor(0x800080).setTitle(title).setDescription(farewellMessage).setFooter({ text: '¡Nos vemos en el camino!' });
        await interaction.editReply({ embeds: [embed] });
    },
};
