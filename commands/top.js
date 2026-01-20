const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { colors } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('Muestra los mejores tiempos de Diesel Duel'),
    async execute(interaction) {
        const recordsPath = path.join(__dirname, '..', 'diesel_records.json');
        
        let records = [];
        try {
            if (fs.existsSync(recordsPath)) {
                const data = fs.readFileSync(recordsPath, 'utf8');
                records = JSON.parse(data);
            }
        } catch (error) {
            console.error('Error leyendo récords:', error);
            return interaction.reply({ content: 'Error al leer la base de datos de récords.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(colors.warning) // Orange/Warning color fits Diesel theme
            .setTitle('🏆 Diesel Duel - Hall of Fame 🏆')
            .setThumbnail('https://convoyrama.github.io/robotito/img/event/cup.png') // Placeholder or existing trophy icon
            .setDescription('Los camioneros más rápidos del asfalto.')
            .setTimestamp();

        if (records.length === 0) {
            embed.addFields({ name: 'Sin registros', value: 'Aún nadie ha quemado llanta.' });
        } else {
            // Top 3 Detailed
            records.slice(0, 3).forEach((rec, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                embed.addFields({
                    name: `${medal} #${index + 1} - ${rec.username}`,
                    value: `⏱️ **${(rec.time / 1000).toFixed(3)}s** | 💨 ${Number(rec.speed).toFixed(1)} km/h`,
                    inline: false
                });
            });

            // 4-10 Compact List
            const rest = records.slice(3, 10);
            if (rest.length > 0) {
                const list = rest.map(r => 
                    `**${r.position}.** ${r.username} — **${(r.time/1000).toFixed(3)}s**`
                ).join('\n');
                
                embed.addFields({ name: 'Top 10', value: list, inline: false });
            }
        }

        await interaction.reply({ embeds: [embed] });
    },
};
