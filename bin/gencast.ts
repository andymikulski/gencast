#!/usr/bin/env node

/**
 * GenCast CLI Entry Point
 *
 * This script generates type-safe runtime casting functions for TypeScript interfaces.
 * It scans your TypeScript project and creates .gen.ts files with CastTo* functions.
 */

import { generateCodegen } from '../src/codegen';

// Run the codegen
generateCodegen();
