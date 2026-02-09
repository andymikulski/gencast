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
// Load configuration from gencast.config.js if it exists
const config = (0, codegen_1.loadConfig)();
// Run the codegen with the loaded configuration
(0, codegen_1.generateCodegen)(config);
