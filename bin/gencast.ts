#!/usr/bin/env node

/**
 * GenCast CLI Entry Point
 *
 * This script generates type-safe runtime casting functions for TypeScript interfaces.
 * It scans your TypeScript project and creates .gen.ts files with CastTo* functions.
 */

import { generateCodegen, loadConfig, initConfig } from '../src/codegen';

const args = process.argv.slice(2);
const command = args[0];

// Handle commands
if (command === 'init') {
  // Generate a gencast.config.js file
  initConfig();
} else if (command === '--help' || command === '-h') {
  // Display help
  console.log(`
GenCast - Runtime type casting for TypeScript interfaces

Usage:
  gencast           Generate casting functions for your interfaces
  gencast init      Create a gencast.config.js configuration file
  gencast --help    Show this help message
`);
} else if (command) {
  console.error(`Unknown command: ${command}`);
  console.log('Run "gencast --help" for usage information.');
  process.exit(1);
} else {
  // Default behavior: run the codegen
  const config = loadConfig();
  generateCodegen(config);
}
