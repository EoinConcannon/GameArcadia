module.exports = {
    transform: {
        '^.+\\.[jt]sx?$': 'babel-jest',
    },

    // Automatically run your setup file after the test framework is installed
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],

    // Allow Jest to transform the `axios` module
    transformIgnorePatterns: ['/node_modules/(?!axios)/'],
};
