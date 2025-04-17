module.exports = {
    // Tell Jest to use babel-jest for JS/JSX files
    transform: {
        '^.+\\.[jt]sx?$': 'babel-jest',
    },

    // Automatically run your setup file after the test framework is installed
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

    // (Optional) if you have other custom extensions:
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
};
