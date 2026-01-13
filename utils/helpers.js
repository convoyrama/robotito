const { EmbedBuilder } = require('discord.js');
const { colors } = require('../config');

/**
 * Returns a day/night icon based on the hour.
 * @param {number} hours The hour (0-23).
 * @returns {string} An emoji representing the time of day.
 */
function getDetailedDayNightIcon(hours) {
    if (hours >= 6 && hours < 8) return '🌅';
    if (hours >= 8 && hours < 19) return '☀️';
    if (hours >= 19 && hours < 21) return '🌇';
    return '🌙';
}

/**
 * Fetches upcoming scheduled events from a guild.
 * @param {import('discord.js').Guild} guild The guild to fetch events from.
 * @param {number} [daysLimit=0] The number of days to look ahead for events. If 0, fetches all upcoming.
 * @returns {Promise<import('discord.js').Collection<string, import('discord.js').GuildScheduledEvent>>} A collection of upcoming events.
 */
async function getUpcomingEvents(guild, daysLimit = 0) {
    if (!guild) return [];

    const scheduledEvents = await guild.scheduledEvents.fetch();
    const now = Date.now();
    let timeLimit = 0;

    if (daysLimit > 0) {
        timeLimit = now + daysLimit * 24 * 60 * 60 * 1000;
    }

    const upcomingEvents = scheduledEvents.filter(event => {
        const startTime = event.scheduledStartTimestamp;
        if (daysLimit > 0) {
            return startTime > now && startTime < timeLimit;
        }
        return startTime > now;
    }).sort((a, b) => a.scheduledStartTimestamp - b.scheduledStartTimestamp);

    return upcomingEvents;
}

/**
 * Creates a standardized, styled embed.
 * @param {object} options The options for the embed.
 * @param {string} [options.color] The color of the embed.
 * @param {string} options.title The title of the embed.
 * @param {string} [options.url] The URL of the embed title.
 * @param {string} [options.description] The description of the embed.
 * @param {Array<import('discord.js').EmbedField>} [options.fields] The fields of the embed.
 * @param {string} [options.thumbnail] The thumbnail URL of the embed.
 * @param {string} [options.image] The image URL of the embed.
 * @param {object} [options.author] The author of the embed.
 * @param {object} [options.footer] The footer of the embed.
 * @returns {import('discord.js').EmbedBuilder} The created embed.
 */
function createStyledEmbed(options) {
    const embed = new EmbedBuilder()
        .setColor(options.color || colors.primary)
        .setTimestamp();

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.fields) embed.addFields(options.fields);
    if (options.url) embed.setURL(options.url);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.author) embed.setAuthor(options.author);

    // Use provided footer text or default
    const footerText = options.footer?.text ? `Robotito | ${options.footer.text}` : 'Robotito | Convoyrama';
    const footerIcon = options.footer?.iconURL;
    embed.setFooter({ text: footerText, iconURL: footerIcon });


    return embed;
}

module.exports = { getDetailedDayNightIcon, getUpcomingEvents, createStyledEmbed };