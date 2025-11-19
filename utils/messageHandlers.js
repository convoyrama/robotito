const { t } = require('./localization');

/**
 * Handles incoming messages to the bot, checking for mentions and responding with greetings.
 * @param {import('discord.js').Message} message The message object from the event.
 * @param {import('discord.js').Client} client The Discord client instance.
 */
function handleMessage(message, client) {
    if (message.author.bot) return;

    if (message.mentions.has(client.user)) {
        const messageContent = message.content.toLowerCase();
        const greetingKeywords = t('messages.handle_message.greeting_keywords');
        const isGreeting = greetingKeywords.some(keyword => messageContent.includes(keyword));

        if (isGreeting) {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const dateKey = `${month}-${day}`;

            const specialDays = t('messages.handle_message.special_days');
            if (specialDays[dateKey]) {
                const specialGreetings = specialDays[dateKey];
                const randomSpecialGreeting = specialGreetings[Math.floor(Math.random() * specialGreetings.length)];
                message.reply(randomSpecialGreeting);
                return; // Importante para no enviar un saludo genérico también
            }

            const genericGreetings = t('messages.handle_message.generic_greetings');
            const randomGenericGreeting = genericGreetings[Math.floor(Math.random() * genericGreetings.length)];
            message.reply(randomGenericGreeting);
        } else {
            message.reply(t('messages.handle_message.default_response'));
        }
    }
}

module.exports = { handleMessage };

