require('ts-node/register');
const { teardown } = require('./mongo');

module.exports = async function() {
	await teardown();
};
