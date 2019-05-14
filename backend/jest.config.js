module.exports = {
	globalSetup: './test/globals/setup',
	globalTeardown: './test/globals/teardown',
	globals: {
		'ts-jest': {
			tsConfig: 'tsconfig.json'
		}
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
	preset: 'ts-jest',
	testEnvironment: 'node',
	// testEnvironment: '<rootDir>/test/setup',
	testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|js)?(x)'],
	transform: { '^.+\\.(ts|tsx)$': 'ts-jest' }
};
