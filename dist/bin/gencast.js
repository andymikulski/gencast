#!/usr/bin/env node
"use strict";
/**
 * GenCast CLI Entry Point
 *
 * This script generates type-safe runtime casting functions for TypeScript interfaces.
 * It scans your TypeScript project and creates .gen.ts files with CastTo* functions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const codegen_1 = require("../src/codegen");
const args = process.argv.slice(2);
const command = args[0];
// Handle commands
if (command === 'init') {
    // Generate a gencast.config.js file
    (0, codegen_1.initConfig)();
}
else if (command === 'utils') {
    // Write the shared utility casts file (CastToClass, CastToArray, etc.)
    // An optional second argument overrides the output path.
    const outputPath = args[1];
    const config = (0, codegen_1.loadConfig)();
    (0, codegen_1.generateUtilityCastsFile)(outputPath, config);
}
else if (command === 'vscode') {
    // Update VS Code workspace settings
    (0, codegen_1.updateVSCodeSettings)();
}
else if (command === '--help' || command === '-h') {
    // Display help
    console.log(`
GenCast - Runtime type casting for TypeScript interfaces

Usage:
  gencast                       Generate casting functions for your interfaces
  gencast init                  Create a gencast.config.js configuration file
  gencast utils [output-file]   Write the shared utility helpers file (CastToClass, CastToArray, etc.)
                                Defaults to ./gencast-utils.gen.ts (or .js).
                                Pass an optional path to change the output location.
  gencast vscode                Update VS Code settings to exclude generated files
  gencast --help                Show this help message
`);
}
else if (command) {
    console.error(`Unknown command: ${command}`);
    console.log('Run "gencast --help" for usage information.');
    process.exit(1);
}
else {
    // Default behavior: run the codegen
    const config = (0, codegen_1.loadConfig)();
    (0, codegen_1.generateCodegen)(config);
}
