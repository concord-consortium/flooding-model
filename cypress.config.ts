import { defineConfig } from 'cypress'
const { installLogsPrinter } = require("cypress-terminal-report/src/installLogsPrinter");
const { addMatchImageSnapshotPlugin } = require("cypress-image-snapshot/plugin");

export default defineConfig({
  video: false,
  fixturesFolder: false,
  defaultCommandTimeout: 8000,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      require('cypress-terminal-report/src/installLogsPrinter')(on);
      addMatchImageSnapshotPlugin(on, config);
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'http://localhost:8080',
    supportFile: false,
  },
})
