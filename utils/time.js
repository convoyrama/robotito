const { getTruckersMPGameTime } = require('./truckersmpAPI');
const { DateTime } = require('luxon'); // Added this import as parseInputTime uses DateTime

function parseInputTime(timeString, referenceDate) {
    let parsedTime = null;

    const timeMatch24 = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch24) {
        parsedTime = referenceDate.set({ hour: parseInt(timeMatch24[1]), minute: parseInt(timeMatch24[2]), second: 0, millisecond: 0 });
        return parsedTime && parsedTime.isValid ? parsedTime : null;
    }

    const timeMatchAMPM = timeString.match(/^(\d{1,2})(am|pm)$/i);
    if (timeMatchAMPM) {
        let hour = parseInt(timeMatchAMPM[1]);
        const ampm = timeMatchAMPM[2].toLowerCase();
        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;
        parsedTime = referenceDate.set({ hour: hour, minute: 0, second: 0, millisecond: 0 });
        return parsedTime && parsedTime.isValid ? parsedTime : null;
    }

    const timeMatchHHMM = timeString.match(/^(\d{2})(\d{2})$/);
    if (timeMatchHHMM) {
        parsedTime = referenceDate.set({ hour: parseInt(timeMatchHHMM[1]), minute: parseInt(timeMatchHHMM[2]), second: 0, millisecond: 0 });
        return parsedTime && parsedTime.isValid ? parsedTime : null;
    }

    return null;
}

async function getGameTime(realDateTime) {
    const apiGameTimeMinutes = await getTruckersMPGameTime();

    if (apiGameTimeMinutes === null) {
        console.warn('Could not fetch game time from API, returning null.');
        return null;
    }

    const gameHours = Math.floor(apiGameTimeMinutes / 60);
    const gameMinutes = Math.floor(apiGameTimeMinutes % 60);
    const gameSeconds = 0; // API only provides minutes

    // Create a DateTime object for the game time. We can use the realDateTime's date part
    // and set the game time hours/minutes/seconds.
    return realDateTime.set({ hour: gameHours, minute: gameMinutes, second: gameSeconds, millisecond: 0 });
}

module.exports = { parseInputTime, getGameTime };