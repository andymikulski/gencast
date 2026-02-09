/** @type {import('gencast').GenCastConfig} */
module.exports = {
  tsconfigPath: './tsconfig.json',
  genFileExt: '.gen.ts',
  funcPrefix: 'CastTo',
  preferReuseCastFunctions: true,
  outputEmptyInterfaces: true,
  generateClassCasts: false,
  requireIPrefix: false,
  removeIPrefix: true,
};
