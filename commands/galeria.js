const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const TruckyServicesClient = require('@dowmeister/trucky-services-client');
const trucky = new TruckyServicesClient();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('galeria')
        .setDescription('Muestra una imagen de la galería de World of Trucks.')
        .addStringOption(option =>
            option.setName('categoria')
                .setDescription('La categoría de imágenes a mostrar.')
                .setRequired(true)
                .addChoices(
                    { name: 'Aleatoria', value: 'random' },
                    { name: 'Elección del Editor', value: 'editorspick' },
                    { name: 'Mejor Valorada', value: 'bestrated' },
                    { name: 'Más Vista', value: 'mostviewed' },
                )),
    async execute(interaction) {
        await interaction.deferReply();
        const category = interaction.options.getString('categoria');

        try {
            let response;
            switch (category) {
                case 'random':
                    response = await trucky.worldOfTrucks.getRandomImage();
                    break;
                case 'editorspick':
                    response = await trucky.worldOfTrucks.getEditorsPick();
                    break;
                case 'bestrated':
                    response = await trucky.worldOfTrucks.getBestRated();
                    break;
                case 'mostviewed':
                    response = await trucky.worldOfTrucks.getMostViewed();
                    break;
            }

            if (!response || response.length === 0) {
                await interaction.editReply('No se encontraron imágenes en la categoría seleccionada.');
                return;
            }

            const image = response[0];

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(image.title || 'Imagen de World of Trucks')
                .setURL(image.url)
                .setImage(image.image_url)
                .setFooter({ text: `Autor: ${image.author}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al obtener imagen de la galería:', error);
            await interaction.editReply('Hubo un error al consultar la API de Trucky.');
        }
    },
};
