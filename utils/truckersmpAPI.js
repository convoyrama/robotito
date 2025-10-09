const fetch = require('node-fetch');

const TRUCKERSMP_API_BASE_URL = 'https://api.truckersmp.com/v2';

async function getTruckersMPGameTime() {
    try {
        const response = await fetch(`${TRUCKERSMP_API_BASE_URL}/game_time`);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(`TruckersMP API error: ${data.descriptor || 'Unknown error'}`);
        }
        return data.game_time;
    } catch (error) {
        console.error('Error fetching TruckersMP game time:', error);
        return null; // Return null on error
    }
}

module.exports = {
    getTruckersMPGameTime,
};