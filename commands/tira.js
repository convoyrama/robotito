const { SlashCommandBuilder } = require('discord.js');
const { createStyledEmbed } = require('../utils/helpers');
const { colors } = require('../config');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tira')
        .setDescription('Muestra una tira cómica o información sobre ellas.')
        .addStringOption(option =>
            option.setName('accion')
                .setDescription('Elige una acción.')
                .setRequired(false)
                .addChoices(
                    { name: 'info', value: 'info' },
                )),
    async execute(interaction) {
        const accion = interaction.options.getString('accion');
        if (accion === 'info') {
            try {
                await interaction.deferReply();
                const dataPath = path.join(__dirname, '..', 'tira-data.json');
                const tiraDataFile = await fs.readFile(dataPath, 'utf8');
                const tiraData = JSON.parse(tiraDataFile);

                const fields = [
                    { name: 'Autor', value: 'Javier Malonda' },
                    { name: 'Licencia', value: '[Creative Commons BY-NC-ND 4.0](http://creativecommons.org/licenses/by-nc-nd/4.0/)' },
                    { name: 'Extracto de la Entrevista (2004)', value: tiraData.interviewSnippet + '...' },
                    { name: 'Leer más', value: '[Entrevista Completa](https://convoyrama.github.io/robotito/img/tira-ecol-master/Entrevista-Javier-Malonda.txt) | [Sitio Web](https://biloynano.com/)' }
                ];

                const embed = createStyledEmbed({
                    color: colors.info,
                    title: 'ℹ️ Información sobre Tira Ecol',
                    url: 'https://biloynano.com/',
                    description: tiraData.readmeDescription,
                    fields: fields,
                    footer: { text: 'Todo el crédito para Javier Malonda.' }
                });

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error(`[${new Date().toISOString()}] Error en el comando /tira info:`, error);
                throw error;
            }
        } else {
            try {
                await interaction.deferReply();
                const randomNumber = Math.floor(Math.random() * 400) + 1;
                const formattedNumber = String(randomNumber).padStart(3, '0');
                const randomImage = `tiraecol-${formattedNumber}.png`;
                const imageUrl = `https://convoyrama.github.io/robotito/img/tira-ecol-master/tira/${randomImage}`;
                
                const embed = createStyledEmbed({
                    color: colors.primary,
                    title: '🎨 Tira Cómica de ECOL',
                    url: 'https://biloynano.com/',
                    image: imageUrl,
                    footer: { text: 'Tira por Javier Malonda (Bilo y Nano) | Usa /tira info para más detalles.' }
                });

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error(`[${new Date().toISOString()}] Error en el comando /tira:`, error);
                throw error;
            }
        }
    },
};
