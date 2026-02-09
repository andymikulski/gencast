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
// Run the codegen
(0, codegen_1.generateCodegen)();
