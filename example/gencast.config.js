/** @type {import('gencast').GenCastConfig} */
module.exports = {
  tsconfigPath: './tsconfig.json',
  genFileExt: '.gen.ts',
  funcPrefix: 'CastTo',
  preferReuseCastFunctions: true,
  outputEmptyInterfaces: true,
  generateClassCasts: false,
  generateTypeCasts: true,
  generatePrimitiveTypeCasts: true,
  generateStringLiteralTypeCasts: true,
  requireIPrefix: false,
  removeIPrefix: true,
  failureReturnValue: 'null',
  strictNullCheck: true,
  includeTupleArrayMethods: false,
  generateUtilityCasts: false,
  utilityCastsPath: './gencast-utils.gen.ts',
};
