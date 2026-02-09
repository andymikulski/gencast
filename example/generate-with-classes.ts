#!/usr/bin/env node

/**
 * Test script to generate casts with class support enabled
 */

const { generateCodegen } = require('../dist/index');

// Run the codegen with class casts enabled
generateCodegen({
  tsconfigPath: './example/tsconfig.json',
  generateClassCasts: true,
});
