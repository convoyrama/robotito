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
        let logoFile = '';
        let logoTitle = '';

        switch (opcion) {
            case 'LS1':
                logoFile = 'logotLS.png';
                logoTitle = "Logo Oficial de LAG'S SPEED (Transparente)";
                break;
            case 'LS2':
                logoFile = 'logowLS.png';
                logoTitle = "Logo Oficial de LAG'S SPEED (Blanco)";
                break;
            case 'LS3':
                logoFile = 'logoLS.png';
                logoTitle = "Logo Oficial de LAG'S SPEED (Negro)";
                break;
            case 'CR1':
                logoFile = 'crt.png';
                logoTitle = "Logo Oficial de Convoyrama (Transparente)";
                break;
            case 'CR2':
                logoFile = 'crb.png';
                logoTitle = "Logo Oficial de Convoyrama (Oscuro)";
                break;
            case 'CNDRP':
                logoFile = 'cndrp.png';
                logoTitle = "Logo Oficial de Convoy Nocturno DRP";
                break;
            case 'CN':
                logoFile = 'logoCN.png';
                logoTitle = "Logo Oficial de Convoy Nocturno";
                break;
            case 'CDS1':
                logoFile = 'cdsw.png';
                logoTitle = "Logo Oficial de Canteras del Sur (Blanco)";
                break;
            case 'CDS2':
                logoFile = 'cdsb.png';
                logoTitle = "Logo Oficial de Canteras del Sur (Negro)";
                break;
            default:
                logoFile = 'logotLS.png';
                logoTitle = "Logo Oficial de LAG'S SPEED (Transparente)";
                break;
        }
        const embed = new EmbedBuilder().setColor(0xF1C40F).setTitle(logoTitle).setImage(`${BASE_IMAGE_URL}LS/${logoFile}`);
        await interaction.editReply({ embeds: [embed] });
    },
};
