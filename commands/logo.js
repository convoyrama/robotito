const { SlashCommandBuilder } = require('discord.js');
const { BASE_IMAGE_URL, colors } = require('../config');
const { createStyledEmbed } = require('../utils/helpers');
const { t } = require('../utils/localization');

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
        .setName(t('commands.logo.name'))
        .setDescription(t('commands.logo.description'))
        .addStringOption(option =>
            option.setName(t('commands.logo.options.opcion.name'))
                .setDescription(t('commands.logo.options.opcion.description'))
                .setRequired(false)
                .addChoices(
                    ...Object.entries(t('commands.logo.options.opcion.choices')).map(([key, value]) => ({ name: value, value: key }))
                )),
    async execute(interaction) {
        await interaction.deferReply();
        const opcion = interaction.options.getString(t('commands.logo.options.opcion.name')) || 'LS1';
        const logoInfo = logoMap[opcion] || logoMap.LS1;
        
        const embed = createStyledEmbed({
            color: colors.warning,
            title: t(`commands.logo.logo_titles.${opcion}`),
            image: `${BASE_IMAGE_URL}LS/${logoInfo.file}`
        });

        await interaction.editReply({ embeds: [embed] });
    },
};
