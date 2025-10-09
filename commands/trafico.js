const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { trucky } = require('../utils/apiClients');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trafico')
        .setDescription('Muestra el estado del tráfico de un servidor de TruckersMP.')
        .addStringOption(option =>
            option.setName('servidor')
                .setDescription('El nombre o shortname del servidor (ej: Simulation 1, sim1).')
                .setRequired(true)
                .setAutocomplete(true)),
    async execute(interaction) {
        await interaction.deferReply();
        if (!interaction.channel.permissionsFor(interaction.client.user).has('EmbedLinks')) {
            await interaction.editReply('No tengo permiso para enviar mensajes incrustados (Embeds) en este canal. Por favor, contacta a un administrador.');
            return;
        }
                        const serverName = interaction.options.getString('servidor');
        
                        try {
                            const servers = await trucky.servers();
                            const server = servers.find(s => s.name.toLowerCase() === serverName.toLowerCase() || s.shortname.toLowerCase() === serverName.toLowerCase());
            if (!server) {
                await interaction.editReply(`No se encontró el servidor "${serverName}".`);
                return;
            }

            const traffic = await trucky.traffic({ server: server.name, game: server.game });

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
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        try {
            const servers = await trucky.servers();
            const choices = servers.map(s => ({ name: s.name, value: s.name }));
            const filtered = choices.filter(choice => choice.name.toLowerCase().startsWith(focusedValue.toLowerCase())).slice(0, 25);
            await interaction.respond(filtered);
        } catch (error) {
            console.error('Error en el autocompletado de servidores de tráfico:', error);
            await interaction.respond([]); // Responder con una lista vacía en caso de error
        }
    },
};
