/** @type {import('gencast').GenCastConfig} */
module.exports = {
  tsconfigPath: './tsconfig.json',
  genFileName: '[filename].gen.[ext]',
  outputLanguage: 'ts',
  funcPrefix: 'CastTo',
  preferReuseCastFunctions: true,
  outputEmptyInterfaces: true,
  generateClassCasts: false,
  requireIPrefix: false,
  removeIPrefix: true,
  failureReturnValue: 'undefined',
};
