const { SlashCommandBuilder } = require('discord.js');
const { BASE_IMAGE_URL, colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');

const logoMap = {
    LS1: { file: 'logotLS.png', title: "Logo Oficial de LAG'S SPEED (Transparente)" },
    LS2: { file: 'logowLS.png', title: "Logo Oficial de LAG'S SPEED (Blanco)" },
    LS3: { file: 'logoLS.png', title: "Logo Oficial de LAG'S SPEED (Negro)" },
    CR1: { file: 'crt.png', title: "Logo Oficial de Convoyrama (Transparente)" },
    CR2: { file: 'crb.png', title: "Logo Oficial de Convoyrama (Oscuro)" },
    CNDRP: { file: 'cndrp.png', title: "Logo Oficial de Convoy Nocturno DRP" },
    CN: { file: 'logoCN.png', title: "Logo Oficial de Convoy Nocturno" },
    CDS1: { file: 'cdsw.png', title: "Logo Oficial de Canteras del Sur (Blanco)" },
    CDS2: { file: 'cdsb.png', title: "Logo Oficial de Canteras del Sur (Negro)" },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logo')
        .setDescription('Muestra el logo oficial de la comunidad.')
        .addStringOption(option =>
            option.setName('opcion')
                .setDescription('Elige una de las variantes del logo.')
                .setRequired(false)
                .addChoices(
                    { name: "LAG'S SPEED (Transparente)", value: 'LS1' },
                    { name: "LAG'S SPEED (Blanco)", value: 'LS2' },
                    { name: "LAG'S SPEED (Negro)", value: 'LS3' },
                    { name: "Convoyrama (Transparente)", value: 'CR1' },
                    { name: "Convoyrama (Oscuro)", value: 'CR2' },
                    { name: "Convoy Nocturno DRP", value: 'CNDRP' },
                    { name: "Convoy Nocturno", value: 'CN' },
                    { name: "Canteras del Sur (Blanco)", value: 'CDS1' },
                    { name: "Canteras del Sur (Negro)", value: 'CDS2' },
                )),
    async execute(interaction) {
        await interaction.deferReply();
        const opcion = interaction.options.getString('opcion') || 'LS1';
        const logoInfo = logoMap[opcion] || logoMap.LS1;

        const embed = createStyledEmbed({
            color: colors.warning,
            title: logoInfo.title,
            image: `${BASE_IMAGE_URL}LS/${logoInfo.file}`
        });

        await interaction.editReply({ embeds: [embed] });
    },
};
