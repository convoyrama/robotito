const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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
            const readmeDescription = 'Esta es una recopilación de la *Tira Ecol* publicada entre diciembre de 2001 y el 18 de octubre de 2010 (tiraecol.net).';
            const interviewSnippet = `1.  *¿Quien eres tu? (informacion personal que quieras dar)*\n\n    Nací hace unos 28 años en Valencia, y desde entonces vengo haciendo cosas sin\n    parar. Por lo visto soy una persona inquieta. Demasiado. Fui al colegio hasta\n    que hubo que salir de allí y luego, por algún extraño motivo que aún estoy\n    ponderando, acabé estudiando ingeniería industrial. Cuando digo que lo mejor\n    que me sucedió allí fue escribir y dibujar en la revista de la escuela, te\n    puedes hacer una idea de lo que fue mi paso por aquella santa institución.`;
            const embed = new EmbedBuilder()
                .setColor(0x4E5D94)
                .setTitle('Información sobre Tira Ecol')
                .setURL('https://biloynano.com/')
                .setDescription(readmeDescription)
                .addFields(
                    { name: 'Autor', value: 'Javier Malonda' },
                    { name: 'Licencia', value: '[Creative Commons BY-NC-ND 4.0](http://creativecommons.org/licenses/by-nc-nd/4.0/)' },
                    { name: 'Extracto de la Entrevista (2004)', value: interviewSnippet + '...' },
                    { name: 'Leer más', value: '[Entrevista Completa](https://convoyrama.github.io/robotito/img/tira-ecol-master/Entrevista-Javier-Malonda.txt) | [Sitio Web](https://biloynano.com/)' }
                )
                .setFooter({ text: 'Todo el crédito para Javier Malonda.' });
            await interaction.reply({ embeds: [embed] });
        } else {
            try {
                await interaction.deferReply();
                const randomNumber = Math.floor(Math.random() * 400) + 1;
                const formattedNumber = String(randomNumber).padStart(3, '0');
                const randomImage = `tiraecol-${formattedNumber}.png`;
                const imageUrl = `https://convoyrama.github.io/robotito/img/tira-ecol-master/tira/${randomImage}`;
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('Tira Cómica de ECOL')
                    .setURL('https://biloynano.com/')
                    .setImage(imageUrl)
                    .setFooter({ text: 'Tira por Javier Malonda (Bilo y Nano) | Usa /tira info para más detalles.' });
                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error(`[${new Date().toISOString()}] Error en el comando /tira:`, error);
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp({ content: 'Hubo un error al mostrar la tira cómica.', flags: 64 });
                } else {
                    await interaction.reply({ content: 'Hubo un error al mostrar la tira cómica.', flags: 64 });
                }
            }
        }
    },
};
