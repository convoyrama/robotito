const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const http = require('http');
const { token } = require('./config.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[ADVERTENCIA] Al comando en ${filePath} le falta una propiedad "data" o "execute" requerida.`);
    }
}

client.once('clientReady', () => {
    console.log('Evento clientReady disparado.');
    console.log(`¡Bot Robotito conectado como ${client.user.tag}!`);
    client.user.setActivity('Convoyrama', { type: ActivityType.Watching });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No se encontró ningún comando que coincida con ${interaction.commandName}.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error ejecutando el comando '${interaction.commandName}':`, error);
        const replyOptions = { content: '¡Hubo un error al ejecutar este comando!', flags: 64 };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyOptions);
        } else {
            await interaction.reply(replyOptions);
        }
    }
});

// --- Lógica de respuesta a menciones y días especiales ---
const specialDays = {
    '01-01': ["¡Feliz Año Nuevo! ¡Que este nuevo año te traiga nuevas rutas y kilómetros de alegría!", "¡Bip-bop! Año nuevo, motor nuevo. ¡A rodar!"],
    '01-06': ["¡Felices Reyes! Espero que te dejen muchos accesorios nuevos para tu camión.", "Yo le pedí a los Reyes Magos un GPS que nunca se equivoque. ¿Y tú?"],
    '02-02': ["¡Feliz aniversario, American Truck Simulator! Gracias por tantas millas de desiertos y ciudades.", "¡Hoy se celebra al hermano americano! ¡Larga vida a ATS!"],
    '02-14': ["¡Feliz San Valentín! ¿Hay algo más hermoso que el amor entre un camionero y su motor?", "Hoy el único cargamento que importa es el amor... y quizás ese tráiler con doble remolque."],
    '05-01': ["¡Feliz día del trabajador, especialmente a los que mueven el mundo, kilómetro a kilómetro!", "Hoy mis circuitos descansan en honor a todos los trabajadores. ¡Buen día!"],
    '07-20': ["¡Feliz día del amigo! Gracias por ser parte de esta increíble comunidad de rutas virtuales.", "Un amigo es el que te espera en el convoy aunque te hayas quedado sin gasolina. ¡Feliz día!"],
    '08-24': ["¡Bip-bop! Subiendo el volumen de los clásicos. ¡Feliz Noche de la Nostalgia para todos en Uruguay!", "Esta noche, las rutas se llenan de recuerdos. ¡A disfrutar la Noche de la Nostalgia!"],
    '08-25': ["¡Feliz Día de la Independencia, Uruguay! ¡A celebrar con la celeste y blanca en el corazón!", "¡Arriba la República Oriental del Uruguay! ¡Feliz día de la independencia!"],
    '10-19': ["¡Feliz cumpleaños, Euro Truck Simulator 2! El juego que lo empezó todo. ¡Por muchas entregas más!", "¡Hoy celebramos al rey de las carreteras europeas! ¡Feliz aniversario, ETS2!"],
    '10-31': ["¡Feliz Halloween! Cuidado con los cargamentos fantasma y las rutas embrujadas esta noche... 🎃", "¿Truco o trato? Yo prefiero... ¿un tráiler? ¡Feliz Halloween!"],
    '12-24': ["¡Feliz Nochebuena! Dejando el camión bien aparcado para preparar todo para mañana.", "Que la paz y la alegría estén en sus cabinas esta Nochebuena."],
    '12-25': ["¡Feliz Navidad! Que la alegría y los buenos momentos llenen tu ruta.", "¡Bip-bop! ¡Navidad detectada! Iniciando protocolo de felicidad."],
    '12-28': ["Última noticia: SCS ha confirmado que el próximo DLC será en la Luna. ¡Inocente palomita! 😉 ¡Feliz Día de los Inocentes!", "Me han programado para decir solo la verdad, pero por hoy haré una excepción. ¡Feliz Día de los Inocentes!"],
    '12-31': ["¡Última entrega del año! ¡Feliz Nochevieja! ¿Listos para el siguiente viaje alrededor del sol?", "Gracias por todos los kilómetros recorridos este año. ¡Que termines bien el año!"]
};

client.on('messageCreate', message => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user)) {
        const messageContent = message.content.toLowerCase();
        const greetingKeywords = ['hola', 'buenas', 'qué tal', 'saludos', 'tal', 'buen día', 'buenos días'];
        const isGreeting = greetingKeywords.some(keyword => messageContent.includes(keyword));

        if (isGreeting) {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const dateKey = `${month}-${day}`;

            if (specialDays[dateKey]) {
                const specialGreetings = specialDays[dateKey];
                const randomSpecialGreeting = specialGreetings[Math.floor(Math.random() * specialGreetings.length)];
                message.reply(randomSpecialGreeting);
                return; // Importante para no enviar un saludo genérico también
            }

            const genericGreetings = [
                "¡Hola, hola! ✨",
                "¡Buenas! ¿Todo en orden por aquí?",
                "¡Qué tal! Aquí Robotito, listo para la acción (o para contarte un dato inútil con `/tito`).",
                "¡Bip-burup! ¡Hola!",
                "¡Hola! ¿Qué tal el día? Si quieres saber el tiempo que hace, siempre puedes usar `/clima [ciudad]`.",
                "¡Buenas! Hoy me siento... bueno, mejor usa `/estado` para averiguarlo. 😉",
                "¡Qué tal! ¿Buscando cosas nuevas? Tengo una lista de sitios de mods que puedes ver con `/mods`.",
                "¡Hola! Espero que tu día vaya bien. Y si no, siempre nos quedará la ley de Murphy... `/murphy`.",
                "¡Saludos! ¿Necesitas saber la hora en algún lugar del mundo? Pregúntame con `/hora`.",
                "¡Hola! ¿Buscas los enlaces de la comunidad? Los tengo a mano con el comando `/link`.",
                "¡Buenas! ¿Verificando si los servidores de TruckersMP están online? Puedes usar `/servidores` para eso.",
                "¡Qué tal! ¿Con ganas de un convoy? Mira los próximos eventos con `/evento`.",
                "01001000 01101111 01101100 01100001... ¡Ah, perdona! A veces pienso en binario. ¡Hola!",
                "¡Hola! ¿Calculando la hora para el próximo convoy? Recuerda que puedes usar `/ingame` para saber la hora dentro del juego."
            ];
            const randomGenericGreeting = genericGreetings[Math.floor(Math.random() * genericGreetings.length)];
            message.reply(randomGenericGreeting);
        } else {
            message.reply("¡Bip-bop! Me has llamado. Si necesitas algo, usa `/ayuda` para ver mi lista de comandos.");
        }
    }
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

if (!token) {
    console.error('❌ Error: El token no está configurado en config.js');
    process.exit(1);
}

client.login(token)
    .then(() => {
        console.log('¡Inicio de sesión exitoso!');
    })
    .catch(error => {
        console.error('❌ Error al conectar con Discord:', error.message);
        process.exit(1);
    });

// Keep-alive server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive!\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Keep-alive server running on port ${PORT}`);
});