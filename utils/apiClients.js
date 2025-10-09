const TruckyServicesClient = require('@dowmeister/trucky-services-client');

const trucky = new TruckyServicesClient();
console.log('Inspeccionando objeto trucky:', trucky);

module.exports = {
    trucky,
};