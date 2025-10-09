const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BASE_IMAGE_URL } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logo')
        .setDescription('Muestra el logo oficial de la comunidad.')
        .addStringOption(option =>
            option.setName('opcion')
                .setDescription('Elige una de las 3 variantes del logo.')
                .setRequired(false)
                .addChoices(
                    { name: 'Logo 1 (Default)', value: '1' },
                    { name: 'Logo 2 (White)', value: '2' },
                    { name: 'Logo 3 (Black)', value: '3' },
                )),
    async execute(interaction) {
        await interaction.deferReply();
        const opcion = interaction.options.getString('opcion') || '1';
        let logoFile = 'logotLS.png'; // Default logo
        switch (opcion) {
            case '2':
                logoFile = 'logowLS.png';
                break;
            case '3':
                logoFile = 'logoLS.png';
                break;
        }
        const embed = new EmbedBuilder().setColor(0xF1C40F).setTitle("Logo Oficial de LAG'S SPEED").setImage(`${BASE_IMAGE_URL}LS/${logoFile}`);
        await interaction.editReply({ embeds: [embed] });
    },
};
