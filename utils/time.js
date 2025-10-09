const { GAME_TIME_ANCHOR_UTC_MINUTES, TIME_SCALE } = require('../config');

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

function getGameTime(realDateTime) {
    const utcDateTime = realDateTime.toUTC();
    const totalMinutesUTC = utcDateTime.hour * 60 + utcDateTime.minute;
    let realMinutesSinceAnchor = totalMinutesUTC - GAME_TIME_ANCHOR_UTC_MINUTES;
    if (realMinutesSinceAnchor < 0) { realMinutesSinceAnchor += 24 * 60; }
    let gameMinutes = realMinutesSinceAnchor * TIME_SCALE;
    gameMinutes = gameMinutes % 1440;
    const gameHours = Math.floor(gameMinutes / 60);
    const remainingMinutes = Math.floor(gameMinutes % 60);
    const gameSeconds = Math.floor((utcDateTime.second * TIME_SCALE) % 60);
    return utcDateTime.set({ hour: gameHours, minute: remainingMinutes, second: gameSeconds, millisecond: 0 });
}

module.exports = { parseInputTime, getGameTime };
