const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const TruckyServicesClient = require('@dowmeister/trucky-services-client');
const trucky = new TruckyServicesClient();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trafico')
        .setDescription('Muestra el estado del tráfico de un servidor de TruckersMP.')
        .addStringOption(option =>
            option.setName('servidor')
                .setDescription('El nombre o shortname del servidor (ej: Simulation 1, sim1).')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const serverName = interaction.options.getString('servidor');

        try {
            const servers = await trucky.truckersMP.getServers();
            const server = servers.find(s => s.name.toLowerCase() === serverName.toLowerCase() || s.shortname.toLowerCase() === serverName.toLowerCase());

            if (!server) {
                await interaction.editReply(`No se encontró el servidor "${serverName}".`);
                return;
            }

            const traffic = await trucky.truckersMP.getTraffic({ server: server.name, game: server.game });

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Tráfico en ${server.name}`)
                .setImage(traffic.mapUrl)
                .addFields(
                    { name: 'Jugadores', value: `${server.players}`, inline: true },
                    { name: 'En cola', value: `${server.queue}`, inline: true },
                )
                .setFooter({ text: 'Datos proporcionados por Trucky App' });

            if (traffic.roads && traffic.roads.length > 0) {
                const topRoads = traffic.roads.slice(0, 5);
                const roadsString = topRoads.map(r => `${r.name} (${r.players} jugadores)`).join('\n');
                embed.addFields({ name: 'Rutas más concurridas', value: roadsString });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al obtener datos de tráfico:', error);
            await interaction.editReply('Hubo un error al consultar la API de Trucky.');
        }
    },
};
