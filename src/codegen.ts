/**
 * GenCast - Runtime type casting for TypeScript interfaces
 *
 * This module generates type-safe runtime casting functions based on your TypeScript interfaces.
 * It uses duck typing to validate objects at runtime.
 */

import fs from 'fs';
import path from 'path';
import {
  InterfaceDeclaration,
  Project,
  PropertySignature,
  SourceFile,
  Type,
  TypeAliasDeclaration,
  TypeLiteralNode,
  ts,
} from 'ts-morph';

/**
 * Configuration options for GenCast code generation
 */
export interface GenCastConfig {
  /**
   * The path to the tsconfig.json file for this project.
   * Defaults to './tsconfig.json' in the current working directory.
   */
  tsconfigPath?: string;

  /**
   * A filename template for generated files, using `[filename]` and `[ext]` placeholders.
   *
   * - `[filename]` is replaced with the source file's base name (without extension).
   * - `[ext]` is replaced with `ts` or `js` based on `outputLanguage`.
   *
   * For example, `'[filename].gen.[ext]'` produces `MyInterface.gen.ts` (or `.gen.js`).
   *
   * @default '[filename].gen.[ext]'
   */
  genFileName?: string;

  /**
   * Controls whether the generated output is TypeScript (`.ts`) or plain JavaScript (`.js`).
   *
   * - `'ts'` - generates typed TypeScript with full type annotations, generics, and `import type` statements.
   * - `'js'` - generates plain JavaScript with no type annotations. Type imports are omitted; only
   *   value imports required for `instanceof` checks (class casts) are kept.
   *
   * @default 'ts'
   */
  outputLanguage?: 'ts' | 'js';

  /**
   * The prefix for all generated functions.
   * For instance, if the prefix is `CastTo`, then the generated function for
   * `ISomeInterface` will be `CastToSomeInterface`.
   * @default 'CastTo'
   */
  funcPrefix?: string;

  /**
   * If `true`, will try to inline cast functions for interfaces which extend other interfaces.
   * I.e., if `IChild extends IParent`, then the cast function for `IChild` will simply call the
   * cast function for `IParent` instead of checking each property again.
   *
   * If `false`, the cast functions are "inlined" and checks each individual property.
   *
   * Enabling this function can create circular dependencies in your code, depending on your setup.
   * @default false
   */
  preferReuseCastFunctions?: boolean;

  /**
   * Must interfaces be prefixed with an `I`?
   *
   * This is primarily useful for having some control over what interfaces are generated.
   * DOM element interfaces, for instance, do _NOT_ have the I-prefix but you often don't want
   * to generate those.
   * @default false
   */
  requireIPrefix?: boolean;

  /**
   * Controls whether or not an interface without any fields/properties can still be casted to.
   * For example: `type IEmpty = { };`
   *
   * `true` will generate all cast functions for all interfaces, even if they have no properties.
   * `false` will skip interfaces with no properties, and the casting functions will not be generated.
   * @default true
   */
  outputEmptyInterfaces?: boolean;

  /**
   * If `true`, will generate cast functions for classes using instanceof checks.
   * This provides a simpler runtime check compared to property-based validation used for interfaces.
   * If you want a general catch-all instead of per-class functions, consider enabling `generateUtilityCasts`.
   *
   * @default false
   */
  generateClassCasts?: boolean;

  /**
   * If `true`, will generate cast functions for exported type aliases of all kinds:
   * - Object types: `type Point = { x: number; y: number }` - property-by-property check
   * - Primitive aliases: `type ID = number` - `typeof` check
   * - String literal unions: `type Status = 'active' | 'inactive'` - equality check on each member
   *
   * @default false
   */
  generateTypeCasts?: boolean;

  /**
   * If `true`, will remove the 'I' prefix from interface names when generating function names.
   * For example, `IUser` will generate `CastToUser` instead of `CastToIUser`.
   *
   * @default true
   */
  removeIPrefix?: boolean;

  /**
   * The value returned when a cast fails.
   * Can be 'null' or 'undefined'.
   *
   * @default 'null'
   */
  failureReturnValue?: 'null' | 'undefined';

  /**
   * If `true`, uses strict equality checks for null/undefined (obj !== null && obj !== undefined).
   * If `false`, uses loose equality check (obj != null) which is faster and more concise.
   *
   * @default false
   */
  strictNullCheck?: boolean;

  /**
   * If `true`, tuple cast functions will include checks for inherited Array prototype methods
   * (e.g. `reverse`, `slice`, `shift`). These checks are technically correct but add noise
   * since tuples are rarely treated as general arrays.
   *
   * @default false
   */
  includeTupleArrayMethods?: boolean;

  /**
   * If `true`, each generated cast function will use a module-level `WeakMap<object, boolean>`
   * to cache the result of the structural check on a per-object basis. On subsequent calls with
   * the same object the cached boolean is returned immediately, avoiding redundant property
   * traversals. The WeakMap is lazily instantiated on first use so there is no overhead for
   * code paths that never invoke the function.
   *
   * Only applies to interface and object-type-alias cast functions (those that check object
   * properties). Primitive and string-literal cast functions are unaffected.
   *
   * @default false
   */
  enableWeakMapCaching?: boolean;
}

// Simple object containing a bunch of util functions.
const Utils = {
  nullRegex: /\s*\|\s*null\s*|\s*null\s*\|\s*/gi,
  checkTypeNullable: (type: Type<ts.Type>, prop: PropertySignature) =>
    type.isNull() ||
    type.isNullable() ||
    Utils.nullRegex.test(prop.getTypeNodeOrThrow().getText()),

  // Returns the header prefixed to every file that is created by this script
  getGenfileHeader(file: SourceFile) {
    return `// This is an autogenerated file, DO NOT EDIT.
// This file was generated from \`${file.getBaseName()}\` by executing GenCast.\n`;
  },
};

// Default configuration
const DEFAULT_CONFIG: Required<GenCastConfig> = {
  tsconfigPath: './tsconfig.json',
  genFileName: '[filename].gen.[ext]',
  outputLanguage: 'ts',
  funcPrefix: 'CastTo',
  preferReuseCastFunctions: true,
  requireIPrefix: false,
  outputEmptyInterfaces: true,
  generateClassCasts: false,
  generateTypeCasts: true,
  removeIPrefix: true,
  includeTupleArrayMethods: false,
  failureReturnValue: 'null',
  strictNullCheck: false,
  enableWeakMapCaching: false,
};

/**
 * Attempts to load gencast.config.js from the current working directory.
 * Returns an empty object if the file doesn't exist or cannot be loaded.
 */
export function loadConfig(): GenCastConfig {
  const configPath = path.resolve(process.cwd(), 'gencast.config.js');

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    // Use require to load the config file
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config = require(configPath);
    console.log(`Loaded configuration from ${configPath}\n`);
    return config;
  } catch (error) {
    console.warn(`Warning: Failed to load gencast.config.js: ${error}`);
    return {};
  }
}

/**
 * Generates a gencast.config.js file with default values and documentation.
 * @returns true if the file was created, false if it already exists
 */
export function initConfig(): boolean {
  const configPath = path.resolve(process.cwd(), 'gencast.config.js');

  if (fs.existsSync(configPath)) {
    console.error('Error: gencast.config.js already exists in this directory.');
    return false;
  }

  const configContent = `/** @type {import('gencast').GenCastConfig} */
module.exports = {
  // Path to your tsconfig.json (default: './tsconfig.json')
  tsconfigPath: './tsconfig.json',

  // Generated file name template using [filename] and [ext] placeholders (default: '[filename].gen.[ext]')
  genFileName: '[filename].gen.[ext]',

  // Output language for generated files: 'ts' (default) or 'js'
  outputLanguage: 'ts',

  // Prefix for generated functions (default: 'CastTo')
  funcPrefix: 'CastTo',

  // Reuse cast functions for inherited interfaces (default: true)
  preferReuseCastFunctions: true,

  // Generate functions for empty interfaces (default: true)
  outputEmptyInterfaces: true,

  // Generate cast functions for classes using instanceof (default: false)
  generateClassCasts: false,

  // Generate cast functions for all exported type aliases (default: true)
  generateTypeCasts: true,

  // Only generate for interfaces with 'I' prefix (default: false)
  requireIPrefix: false,

  // Remove 'I' prefix from interface names in function names (default: true)
  // For example, IUser generates CastToUser when true, CastToIUser when false
  removeIPrefix: true,

  // Value returned on cast failure (default: 'null')
  // Can be 'null' or 'undefined'
  failureReturnValue: 'null',

  // Use strict equality for null checks (default: false)
  strictNullCheck: true,

  // Cache cast results in a per-function WeakMap keyed on the input object (default: false)
  // Speeds up repeated casts of the same object; only applies to interface/object-type casts
  enableWeakMapCaching: false,
};
`;

  try {
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log(`✅ Created ${process.cwd()}/gencast.config.js`);
    console.log('\nYou can now customize the configuration options to fit your project.');
    return true;
  } catch (error) {
    console.error(`Error: Failed to create gencast.config.js: ${error}`);
    return false;
  }
}

/**
 * Updates VS Code workspace settings to exclude generated files.
 * Reads the genFileName from the config and adds exclusion patterns.
 * @returns true if the settings were updated successfully
 */
export function updateVSCodeSettings(): boolean {
  const vscodeDirPath = path.resolve(process.cwd(), '.vscode');
  const settingsPath = path.resolve(vscodeDirPath, 'settings.json');

  const userConfig = loadConfig();
  const config: Required<GenCastConfig> = {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };

  // Derive the glob suffix from the genFileName template (the part after [filename])
  const ext = config.outputLanguage === 'js' ? 'js' : 'ts';
  const filenameIdx = config.genFileName.indexOf('[filename]');
  const rawSuffix = config.genFileName.slice(filenameIdx + '[filename]'.length);
  const resolvedSuffix = rawSuffix.replace('[ext]', ext);
  const pattern = `**/*${resolvedSuffix}`;

  // Create .vscode directory if it doesn't exist
  if (!fs.existsSync(vscodeDirPath)) {
    try {
      fs.mkdirSync(vscodeDirPath, { recursive: true });
    } catch (error) {
      console.error(`Error: Failed to create .vscode directory: ${error}`);
      return false;
    }
  }

  // Load existing settings or start with empty object
  let settings: Record<string, any> = {};
  if (fs.existsSync(settingsPath)) {
    try {
      const content = fs.readFileSync(settingsPath, 'utf8');
      settings = JSON.parse(content);
    } catch (error) {
      console.error(`Error: Failed to parse existing .vscode/settings.json: ${error}`);
      return false;
    }
  }

  // Update exclusion patterns
  if (!settings['files.exclude']) {
    settings['files.exclude'] = {};
  }
  if (!settings['search.exclude']) {
    settings['search.exclude'] = {};
  }
  if (!settings['files.watcherExclude']) {
    settings['files.watcherExclude'] = {};
  }

  settings['files.exclude'][pattern] = true;
  settings['search.exclude'][pattern] = true;
  settings['files.watcherExclude'][pattern] = true;

  // Write updated settings
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    console.log(`✅ Updated .vscode/settings.json`);
    console.log(`   Excluded pattern: ${pattern}`);
    console.log('\nGenerated files will now be hidden from:');
    console.log('  • File Explorer (files.exclude)');
    console.log('  • Search Results (search.exclude)');
    console.log('  • File Watcher (files.watcherExclude)');
    return true;
  } catch (error) {
    console.error(`Error: Failed to write .vscode/settings.json: ${error}`);
    return false;
  }
}

/**
 * Main entry point for GenCast code generation
 * @param userConfig Optional configuration to override defaults
 */
export function generateCodegen(userConfig: GenCastConfig = {}): void {
  const config: Required<GenCastConfig> = {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };

  // Resolve the tsconfig path
  const tsconfigPath = path.resolve(process.cwd(), config.tsconfigPath);

  console.log('GenCast - Generating runtime cast methods...');
  console.log(`Using tsconfig: ${tsconfigPath}\n`);

  // Load the source files listed in the tsconfig
  const project = new Project();
  project.addSourceFilesFromTsConfig(tsconfigPath);

  const allSourceFiles = project.getSourceFiles();

  // Pre-compute the gen-import dependency graph so we can detect cycles when
  // preferReuseCastFunctions is enabled.  When disabled the graph is empty and all
  // cyclic-dep sets will also be empty, so the extra work is zero.
  const genImportGraph = config.preferReuseCastFunctions
    ? computeGenImportGraph(allSourceFiles, config)
    : new Map<string, Set<string>>();

  // Process each file and output the relevant file
  allSourceFiles.forEach((file) => generateCodegenFile(file, config, genImportGraph));

  console.log('\nDone generating casts\n');
}

/**
 * Writes the shared utility casts file (e.g. `gencast.gen.ts`).
 * Contains generic helpers that are not tied to any specific generated type.
 *
 * @param outputFilePath Optional path for the output file. Defaults to `./gencast.gen.[ext]`
 *   next to the cwd. Supports the `[ext]` placeholder.
 * @param userConfig Optional config overrides (e.g. `outputLanguage`, `failureReturnValue`, `strictNullCheck`).
 */
export function generateUtilityCastsFile(outputFilePath?: string, userConfig: GenCastConfig = {}): void {
  const config: Required<GenCastConfig> = { ...DEFAULT_CONFIG, ...userConfig };
  const ext = config.outputLanguage === 'js' ? 'js' : 'ts';
  const defaultPath = `./gencast.gen.[ext]`;
  const resolvedTemplate = outputFilePath ?? defaultPath;
  const outputPath = path.resolve(process.cwd(), resolvedTemplate.replace('[ext]', ext));
  const failureValue = config.failureReturnValue;
  const isJS = config.outputLanguage === 'js';

  const nullCheck = config.strictNullCheck
    ? 'obj !== null && obj !== undefined'
    : 'obj != null';

  const content = isJS
    ? `// This is an autogenerated file, DO NOT EDIT.
// This file was generated by GenCast and contains generic cast utilities.

/**
 * Casts \`obj\` to \`T\` if it is an instance of \`ctor\`, otherwise returns ${failureValue}.
 *
 * This is the generic alternative to per-class generated cast functions.
 * Usage: \`CastToClass(someObj, MyClass)\`
 */
export function CastToClass(obj, ctor) {
  return (${nullCheck} && obj instanceof ctor) ? obj : ${failureValue};
}

/**
 * Casts every element of \`arr\` using \`castFn\`.
 * Returns the typed array if every element casts successfully, otherwise returns ${failureValue}.
 *
 * Usage: \`CastToArray(CastToThing, myArray)\`
 */
export function CastToArray(castFn, arr) {
  if (!Array.isArray(arr)) return ${failureValue};
  const result = [];
  for (const item of arr) {
    const cast = castFn(item);
    if (cast === ${failureValue}) return ${failureValue};
    result.push(cast);
  }
  return result;
}
`
    : `// This is an autogenerated file, DO NOT EDIT.
// This file was generated by GenCast and contains generic cast utilities.

/**
 * Casts \`obj\` to \`T\` if it is an instance of \`ctor\`, otherwise returns ${failureValue}.
 *
 * This is the generic alternative to per-class generated cast functions.
 * Usage: \`CastToClass(someObj, MyClass)\`
 */
export function CastToClass<T>(obj: any, ctor: new (...args: any[]) => T): T | ${failureValue} {
  return (${nullCheck} && obj instanceof ctor) ? obj : ${failureValue};
}

/**
 * Casts every element of \`arr\` using \`castFn\`.
 * Returns the typed array if every element casts successfully, otherwise returns ${failureValue}.
 *
 * Usage: \`CastToArray(CastToThing, myArray)\`
 */
export function CastToArray<T>(castFn: (obj: any) => T | ${failureValue}, arr: any): T[] | ${failureValue} {
  if (!Array.isArray(arr)) { return ${failureValue}; }

  return arr.every((item) => castFn(item) !== ${failureValue}) ? arr as T[] : ${failureValue};
}
`;

  fs.writeFileSync(outputPath, content, 'utf8');
  console.log(`\ngencast`);
}

// ---------------------------------------------------------------------------
// Cycle-detection helpers for preferReuseCastFunctions
// ---------------------------------------------------------------------------

/**
 * Builds a dependency graph: for each source file, which other source file paths would
 * its generated file need to import cast functions from (under preferReuseCastFunctions).
 */
function computeGenImportGraph(
  sourceFiles: SourceFile[],
  config: Required<GenCastConfig>
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  for (const sf of sourceFiles) {
    const sfPath = sf.getFilePath();
    const deps = new Set<string>();
    graph.set(sfPath, deps);

    sf.getInterfaces()
      .filter((iface) => iface.isExported())
      .forEach((iface) => {
        // Inheritance - would call the base's cast function
        iface.getBaseDeclarations().forEach((base) => {
          if (base.isKind(ts.SyntaxKind.InterfaceDeclaration)) {
            const baseFilePath = (base as InterfaceDeclaration).getSourceFile().getFilePath();
            if (baseFilePath !== sfPath) deps.add(baseFilePath);
          }
        });
        // Complex property types - would call the property type's cast function
        iface.getProperties().forEach((prop) => {
          collectComplexTypeDep(prop.getType(), sfPath, deps);
        });
      });

    if (config.generateTypeCasts) {
      sf.getTypeAliases()
        .filter((ta) => ta.isExported())
        .forEach((ta) => {
          ta.getType().getProperties().forEach((prop) => {
            collectComplexTypeDep(prop.getTypeAtLocation(ta), sfPath, deps);
          });
        });
    }
  }
  return graph;
}

/** Records the source-file path of `propType`'s named declaration in `deps` if it is cross-file. */
function collectComplexTypeDep(
  propType: Type<ts.Type>,
  currentFilePath: string,
  deps: Set<string>
): void {
  if (!propType.isObject()) return;
  const symbol = propType.getAliasSymbol() ?? propType.getSymbol();
  const decl = (symbol?.getDeclarations() ?? []).find(
    (d) =>
      d.isKind(ts.SyntaxKind.InterfaceDeclaration) ||
      d.isKind(ts.SyntaxKind.TypeAliasDeclaration)
  );
  if (decl) {
    const declFilePath = decl.getSourceFile().getFilePath();
    if (declFilePath !== currentFilePath) deps.add(declFilePath);
  }
}

/** Returns `true` if there is a directed path from `from` to `to` in `graph`. */
function canReachInGraph(
  graph: Map<string, Set<string>>,
  from: string,
  to: string,
  visited: Set<string>
): boolean {
  if (from === to) return true;
  if (visited.has(from)) return false;
  visited.add(from);
  for (const dep of graph.get(from) ?? new Set<string>()) {
    if (canReachInGraph(graph, dep, to, visited)) return true;
  }
  return false;
}

/**
 * Returns the set of source file paths that would introduce a circular dependency if
 * `sourceFilePath`'s generated file were to import cast functions from them.
 *
 * A file is "cyclic" with respect to `sourceFilePath` when it can transitively reach
 * `sourceFilePath` in the gen-import dependency graph - meaning the two files would
 * mutually import each other's generated files.
 */
function findCyclicGenImports(
  graph: Map<string, Set<string>>,
  sourceFilePath: string
): Set<string> {
  const cyclic = new Set<string>();
  for (const [node] of graph) {
    if (node !== sourceFilePath && canReachInGraph(graph, node, sourceFilePath, new Set())) {
      cyclic.add(node);
    }
  }
  return cyclic;
}

// ---------------------------------------------------------------------------
// genFileName helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the generated file name for a source file using the `genFileName` template.
 * `[filename]` is replaced with the source base name (no extension), `[ext]` with `ts` or `js`.
 */
function resolveGenFileName(sourceBaseName: string, config: Required<GenCastConfig>): string {
  const ext = config.outputLanguage === 'js' ? 'js' : 'ts';
  const baseName = path.basename(sourceBaseName, path.extname(sourceBaseName));
  return config.genFileName
    .replace('[filename]', baseName)
    .replace('[ext]', ext);
}

/**
 * Returns `true` if the given file base name appears to be a previously-generated file,
 * based on the suffix that follows the `[filename]` placeholder in the template.
 */
function isGeneratedFile(baseName: string, config: Required<GenCastConfig>): boolean {
  const ext = config.outputLanguage === 'js' ? 'js' : 'ts';
  const filenameIdx = config.genFileName.indexOf('[filename]');
  const rawSuffix = config.genFileName.slice(filenameIdx + '[filename]'.length);
  const suffix = rawSuffix.replace('[ext]', ext);
  return baseName.endsWith(suffix);
}

/**
 * Returns the module-specifier suffix appended to a base import path when referencing
 * another generated file (e.g. `'./Gun'` → `'./Gun.gen'`).
 *
 * This is the portion after `[filename]` in the template, with the trailing file extension
 * (`.ts` / `.js`) stripped, because TypeScript module specifiers omit the extension.
 */
function genModuleSpecifierSuffix(config: Required<GenCastConfig>): string {
  const ext = config.outputLanguage === 'js' ? 'js' : 'ts';
  const filenameIdx = config.genFileName.indexOf('[filename]');
  const rawSuffix = config.genFileName.slice(filenameIdx + '[filename]'.length);
  return rawSuffix.replace('[ext]', ext).replace(/\.(ts|js)$/, '');
}

// ---------------------------------------------------------------------------

function generateCodegenFile(sourceFile: SourceFile, config: Required<GenCastConfig>, genImportGraph: Map<string, Set<string>>) {
  // If this function is called on a previously-generated file, ignore it
  if (isGeneratedFile(sourceFile.getBaseName(), config)) {
    return;
  }

  const outputFilePath = path.resolve(
    sourceFile.getDirectoryPath(),
    `./${resolveGenFileName(sourceFile.getBaseName(), config)}`
  );

  // If this file exists already, just straight up remove it.
  // It may be outdated and no longer necessary, so this will prune the file.
  // If it IS needed, then it'll simply be regenerated.
  if (fs.existsSync(outputFilePath)) {
    fs.unlinkSync(outputFilePath);
  }

  const interfaces = sourceFile.getInterfaces().filter(
    (x) =>
      // Ignore non-exported interfaces as they will cause import errors for the generated files
      x.isExported() &&
      // We might only be looking at the `I`-prefixed interfaces
      (config.requireIPrefix ? x.getName().charAt(0) === 'I' : true)
  );

  const classes = config.generateClassCasts
    ? sourceFile.getClasses().filter((x) => x.isExported())
    : [];

  // Collect different types of type aliases based on configuration
  let typeAliases: TypeAliasDeclaration[] = [];
  let primitiveTypeAliases: TypeAliasDeclaration[] = [];
  let stringLiteralTypeAliases: TypeAliasDeclaration[] = [];
  let constructorTypeAliases: TypeAliasDeclaration[] = [];

  if (config.generateTypeCasts) {
    sourceFile.getTypeAliases().forEach((x) => {
      if (!x.isExported()) return;

      const type = x.getType();

      // Check for construct signature types (e.g. `type Ctor = new (...) => T`)
      if (type.getConstructSignatures().length > 0) {
        constructorTypeAliases.push(x);
        return;
      }

      // Check for string literal unions (e.g., 'active' | 'inactive' | 'pending')
      if (type.isUnion()) {
        const unionTypes = type.getUnionTypes();
        const allStringLiterals = unionTypes.every(t => t.isStringLiteral());
        if (allStringLiterals && config.generateTypeCasts) {
          stringLiteralTypeAliases.push(x);
          return;
        }
      }

      // Check for single string literal
      if (type.isStringLiteral() && config.generateTypeCasts) {
        stringLiteralTypeAliases.push(x);
        return;
      }

      // Check for primitive types (number, string, boolean)
      if (config.generateTypeCasts) {
        if (type.isString() || type.isNumber() || type.isBoolean()) {
          primitiveTypeAliases.push(x);
          return;
        }
      }

      // Check for object types with properties
      if (config.generateTypeCasts) {
        const properties = type.getProperties();
        if (properties.length > 0) {
          typeAliases.push(x);
        }
      }
    });
  }

  // If there are no interfaces, classes, or type aliases in this file at all, then we don't need to look at it further
  if (interfaces.length == 0 && classes.length == 0 &&
      typeAliases.length == 0 && primitiveTypeAliases.length == 0 &&
      stringLiteralTypeAliases.length == 0 && constructorTypeAliases.length == 0) {
    return;
  }

  // show relative file path name in bold (relative to project base dir)
  console.log(`\x1b[1m${path.relative(process.cwd(), sourceFile.getFilePath())}\x1b[0m`);

  // Compute which source files would create circular dependencies if we imported their
  // generated cast functions from this file's gen file.
  const cyclicFilePaths = config.preferReuseCastFunctions
    ? findCyclicGenImports(genImportGraph, sourceFile.getFilePath())
    : new Set<string>();

  // if (cyclicFilePaths.size > 0) {
    // const names = [...cyclicFilePaths].map((p) => path.basename(p)).join(', ');
    // console.log(`  \x1b[33mCyclic import warning: ${names} - falling back to inline checks.\x1b[0m`);
  // }

  // Map<SourceFile, Map<name, isDefault>>
  let typeImports = new Map<SourceFile, Map<string, boolean>>();
  let valueImports = new Map<SourceFile, Map<string, boolean>>();
  // Track cast function imports from other generated files when preferReuseCastFunctions is true
  let genFunctionImports = new Map<SourceFile, Set<string>>();
  let generatedCode = '';
  let hasOutput = false;
  const isJS = config.outputLanguage === 'js';

  // for each interface found in this source file...
  interfaces.forEach((int) => {
    const interfaceName = int.getName();

    var compiledPropChecks = processInterface(int, typeImports, genFunctionImports, sourceFile, config, false, cyclicFilePaths);

    if (compiledPropChecks.length === 0) {
      const color = config.outputEmptyInterfaces ? '\x1b[33m' : '\x1b[31m';
      // console.warn(
      //   `  ${color}\tNo prop checks for "${interfaceName}"\x1b[0m`
      // );
      if (!config.outputEmptyInterfaces) {
        return;
      }
    }
    hasOutput = true;

    // We may have a type parameter, i.e. this may be a generic function.
    // This snippet will create the necessary `<T, U, ...>` string that's appended to the function
    // as well as the return type.

    let shortGenerics: string[] = [];
    let fullGenerics: string[] = [];

    int.getTypeParameters().forEach((v) => {
      const extension = v.getConstraint()?.getText() || '';
      const longName = v.getName() + (extension ? ` extends ${extension}` : '');
      const shortName = v.getName();

      shortGenerics.push(shortName);
      fullGenerics.push(longName);

      // Ensure any cross-file types used in the constraint are imported
      const constraintNode = v.getConstraint();
      if (constraintNode) {
        addConstraintTypeToImports(constraintNode.getType(), sourceFile, typeImports);
      }
    });

    const shortGenString =
      shortGenerics.length > 0 ? `<${shortGenerics.join(', ')}>` : '';
    const fullGenString =
      fullGenerics.length > 0 ? `<${fullGenerics.join(', ')}>` : '';

    // Since the cast functions accept 'any' as a param, we need to double check the possibility
    // that the input is null/undefined
    const nullCheck = config.strictNullCheck
      ? 'obj !== null && obj !== undefined'
      : 'obj != null';
    compiledPropChecks.unshift(nullCheck);

    const funcName = `${config.funcPrefix}${removeIPrefixMaybe(interfaceName, config.removeIPrefix)}`;
    const failureValue = config.failureReturnValue;

    if (config.enableWeakMapCaching) {
      // compiledPropChecks[0] is the null-check; the rest are property checks.
      // The WeakMap path already guards against null/non-object, so only the
      // property checks are placed inside the cached branch.
      const bodyChecks = compiledPropChecks.slice(1);
      const bodyChecksStr = bodyChecks.length > 0 ? bodyChecks.join(' && ') : 'true';
      const cacheVar = `_wmc_${funcName}`;

      if (isJS) {
        generatedCode += `
  let ${cacheVar};
  export function ${funcName}(obj) {
    if (obj != null && typeof obj === 'object') {
      if (!${cacheVar}) { ${cacheVar} = new WeakMap(); }
      const _cached = ${cacheVar}.get(obj);
      if (_cached !== undefined) { return _cached ? obj : ${failureValue}; }
      const _result = (${bodyChecksStr});
      ${cacheVar}.set(obj, _result);
      return _result ? obj : ${failureValue};
    }
    return ${failureValue};
  }
  `;
      } else {
        generatedCode += `
  let ${cacheVar}: WeakMap<object, boolean> | undefined;
  export function ${funcName}${fullGenString}(obj: any): ${interfaceName}${shortGenString} | ${failureValue} {
    if (obj != null && typeof obj === 'object') {
      if (!${cacheVar}) { ${cacheVar} = new WeakMap(); }
      const _cached = ${cacheVar}.get(obj);
      if (_cached !== undefined) { return _cached ? obj : ${failureValue}; }
      const _result = (${bodyChecksStr});
      ${cacheVar}.set(obj, _result);
      return _result ? obj : ${failureValue};
    }
    return ${failureValue};
  }
  `;
      }
    } else {
      const checks = compiledPropChecks.join(' && ');
      if (isJS) {
        generatedCode += `
  export function ${funcName}(obj) {
    return (${checks}) ? obj : ${failureValue};
  }
  `;
      } else {
        generatedCode += `
  export function ${funcName}${fullGenString}(obj: any): ${interfaceName}${shortGenString} | ${failureValue} {
    return (${checks}) ? obj : ${failureValue};
  }
  `;
      }
    }
  });

  // for each class found in this source file...
  classes.forEach((cls) => {
    const className = cls.getName();
    if (!className) {
      return;
    }

    hasOutput = true;

    // Track the class as a value import (not a type import) since we need instanceof
    const file = cls.getSourceFile();
    const list = valueImports.get(file) ?? new Map<string, boolean>();
    list.set(className, cls.isDefaultExport());
    valueImports.set(file, list);

    // Handle generics for classes
    let shortGenerics: string[] = [];
    let fullGenerics: string[] = [];

    cls.getTypeParameters().forEach((v) => {
      const extension = v.getConstraint()?.getText() || '';
      const longName = v.getName() + (extension ? ` extends ${extension}` : '');
      const shortName = v.getName();

      shortGenerics.push(shortName);
      fullGenerics.push(longName);
    });

    const shortGenString =
      shortGenerics.length > 0 ? `<${shortGenerics.join(', ')}>` : '';
    const fullGenString =
      fullGenerics.length > 0 ? `<${fullGenerics.join(', ')}>` : '';

    const funcName = `${config.funcPrefix}${className}`;
    const failureValue = config.failureReturnValue;

    if (isJS) {
      generatedCode += `
  export function ${funcName}(obj) {
    return (obj instanceof ${className}) ? obj : ${failureValue};
  }
  `;
    } else {
      generatedCode += `
  export function ${funcName}${fullGenString}(obj: any): ${className}${shortGenString} | ${failureValue} {
    return (obj instanceof ${className}) ? obj : ${failureValue};
  }
  `;
    }

    // print with color orange
    console.log(`  \x1b[38;5;208m${className}\x1b[0m`);
  });

  // for each type alias found in this source file...
  typeAliases.forEach((typeAlias) => {
    const typeName = typeAlias.getName();
    if (!typeName) {
      return;
    }

    var compiledPropChecks = processTypeAlias(typeAlias, typeImports, genFunctionImports, sourceFile, config, cyclicFilePaths);

    if (compiledPropChecks.length === 0) {
      const color = config.outputEmptyInterfaces ? '🟨' : '❌';
      console.warn(
        `  ${color} No prop checks found for type "${typeName}"`
      );
      if (!config.outputEmptyInterfaces) {
        return;
      }
    }
    hasOutput = true;

    // Handle generics for type aliases
    let shortGenerics: string[] = [];
    let fullGenerics: string[] = [];

    typeAlias.getTypeParameters().forEach((v) => {
      const extension = v.getConstraint()?.getText() || '';
      const longName = v.getName() + (extension ? ` extends ${extension}` : '');
      const shortName = v.getName();

      shortGenerics.push(shortName);
      fullGenerics.push(longName);

      // Ensure any cross-file types used in the constraint are imported
      const constraintNode = v.getConstraint();
      if (constraintNode) {
        addConstraintTypeToImports(constraintNode.getType(), sourceFile, typeImports);
      }
    });

    const shortGenString =
      shortGenerics.length > 0 ? `<${shortGenerics.join(', ')}>` : '';
    const fullGenString =
      fullGenerics.length > 0 ? `<${fullGenerics.join(', ')}>` : '';

    const nullCheck = config.strictNullCheck
      ? 'obj !== null && obj !== undefined'
      : 'obj != null';
    compiledPropChecks.unshift(nullCheck);

    const funcName = `${config.funcPrefix}${typeName}`;
    const failureValue = config.failureReturnValue;

    if (config.enableWeakMapCaching) {
      const bodyChecks = compiledPropChecks.slice(1);
      const bodyChecksStr = bodyChecks.length > 0 ? bodyChecks.join(' && ') : 'true';
      const cacheVar = `_wmc_${funcName}`;

      if (isJS) {
        generatedCode += `
  let ${cacheVar};
  export function ${funcName}(obj) {
    if (obj != null && typeof obj === 'object') {
      if (!${cacheVar}) { ${cacheVar} = new WeakMap(); }
      const _cached = ${cacheVar}.get(obj);
      if (_cached !== undefined) { return _cached ? obj : ${failureValue}; }
      const _result = (${bodyChecksStr});
      ${cacheVar}.set(obj, _result);
      return _result ? obj : ${failureValue};
    }
    return ${failureValue};
  }
  `;
      } else {
        generatedCode += `
  let ${cacheVar}: WeakMap<object, boolean> | undefined;
  export function ${funcName}${fullGenString}(obj: any): ${typeName}${shortGenString} | ${failureValue} {
    if (obj != null && typeof obj === 'object') {
      if (!${cacheVar}) { ${cacheVar} = new WeakMap(); }
      const _cached = ${cacheVar}.get(obj);
      if (_cached !== undefined) { return _cached ? obj : ${failureValue}; }
      const _result = (${bodyChecksStr});
      ${cacheVar}.set(obj, _result);
      return _result ? obj : ${failureValue};
    }
    return ${failureValue};
  }
  `;
      }
    } else {
      const checks = compiledPropChecks.join(' && ');
      if (isJS) {
        generatedCode += `
  export function ${funcName}(obj) {
    return (${checks}) ? obj : ${failureValue};
  }
  `;
      } else {
        generatedCode += `
  export function ${funcName}${fullGenString}(obj: any): ${typeName}${shortGenString} | ${failureValue} {
    return (${checks}) ? obj : ${failureValue};
  }
  `;
      }
    }
  });

  // for each constructor type alias found in this source file...
  constructorTypeAliases.forEach((typeAlias) => {
    const typeName = typeAlias.getName();
    if (!typeName) {
      return;
    }

    hasOutput = true;

    // Add type to imports
    const file = typeAlias.getSourceFile();
    const list = typeImports.get(file) ?? new Map<string, boolean>();
    list.set(typeName, typeAlias.isDefaultExport());
    typeImports.set(file, list);

    const funcName = `${config.funcPrefix}${typeName}`;
    const failureValue = config.failureReturnValue;
    const typeCheck = `typeof(obj) === "function" && 'prototype' in obj`;

    if (isJS) {
      generatedCode += `
  export function ${funcName}(obj) {
    return (${typeCheck}) ? obj : ${failureValue};
  }
  `;
    } else {
      generatedCode += `
  export function ${funcName}(obj: any): ${typeName} | ${failureValue} {
    return (${typeCheck}) ? obj : ${failureValue};
  }
  `;
    }

    // Use magenta color for constructor types
    console.log(`  \x1b[35m${typeName}\x1b[0m`);
  });

  // for each primitive type alias found in this source file...
  primitiveTypeAliases.forEach((typeAlias) => {
    const typeName = typeAlias.getName();
    if (!typeName) {
      return;
    }

    hasOutput = true;

    const type = typeAlias.getType();
    let typeCheck = '';

    if (type.isString()) {
      typeCheck = 'typeof(obj) === "string"';
    } else if (type.isNumber()) {
      typeCheck = 'typeof(obj) === "number"';
    } else if (type.isBoolean()) {
      typeCheck = 'typeof(obj) === "boolean"';
    } else {
      // Fallback - shouldn't happen given our filtering
      console.warn(`  ⚠️ Unknown primitive type for "${typeName}"`);
      return;
    }

    // Add type to imports
    const file = typeAlias.getSourceFile();
    const list = typeImports.get(file) ?? new Map<string, boolean>();
    list.set(typeName, typeAlias.isDefaultExport());
    typeImports.set(file, list);

    const funcName = `${config.funcPrefix}${typeName}`;
    const failureValue = config.failureReturnValue;

    if (isJS) {
      generatedCode += `
  export function ${funcName}(obj) {
    return (${typeCheck}) ? obj : ${failureValue};
  }
  `;
    } else {
      generatedCode += `
  export function ${funcName}(obj: any): ${typeName} | ${failureValue} {
    return (${typeCheck}) ? obj : ${failureValue};
  }
  `;
    }

    // Use blue color for primitive types
    console.log(`  \x1b[36m${typeName}\x1b[0m`);
  });

  // for each string literal type alias found in this source file...
  stringLiteralTypeAliases.forEach((typeAlias) => {
    const typeName = typeAlias.getName();
    if (!typeName) {
      return;
    }

    hasOutput = true;

    const type = typeAlias.getType();
    let checks: string[] = [];

    if (type.isUnion()) {
      // Handle union of string literals
      const unionTypes = type.getUnionTypes();
      checks = unionTypes.map((t: Type<ts.Type>) => `obj === ${t.getText()}`);
    } else if (type.isStringLiteral()) {
      // Handle single string literal
      checks = [`obj === ${type.getText()}`];
    } else {
      console.warn(`  ⚠️ Unexpected type for string literal "${typeName}"`);
      return;
    }

    // Add type to imports
    const file = typeAlias.getSourceFile();
    const list = typeImports.get(file) ?? new Map<string, boolean>();
    list.set(typeName, typeAlias.isDefaultExport());
    typeImports.set(file, list);

    const funcName = `${config.funcPrefix}${typeName}`;
    const checkString = checks.join(' || ');
    const failureValue = config.failureReturnValue;

    if (isJS) {
      generatedCode += `
  export function ${funcName}(obj) {
    return (${checkString}) ? obj : ${failureValue};
  }
  `;
    } else {
      generatedCode += `
  export function ${funcName}(obj: any): ${typeName} | ${failureValue} {
    return (${checkString}) ? obj : ${failureValue};
  }
  `;
    }

    // Use teal color for string literal types
    console.log(`  \x1b[36m${typeName}\x1b[0m`);
  });

  if (!hasOutput) {
    return;
  }

  let importString = '';

  // Generate cast function imports from other generated files (when preferReuseCastFunctions is true)
  const genFunctionImportItems = genFunctionImports.entries();
  let genFuncValue: [SourceFile, Set<string>];
  while ((genFuncValue = genFunctionImportItems.next()?.value!)) {
    const [file, funcNames] = genFuncValue;
    if (funcNames.size === 0) continue;

    // Generate the path to the generated file for this source file
    // Get the path FROM current source file TO the base file
    const relativePathBase = sourceFile.getRelativePathAsModuleSpecifierTo(file);
    // Append the gen module-specifier suffix (e.g. '.gen') derived from the genFileName template
    const relativePathGen = relativePathBase + genModuleSpecifierSuffix(config);

    const funcArray = Array.from(funcNames);
    importString += `import { ${funcArray.join(', ')} } from '${relativePathGen}';
`;
  }

  // Generate type imports (for interfaces) - skipped for JS output since there are no type annotations
  if (!isJS) {
    const typeImportItems = typeImports.entries();
    let typeValue: [SourceFile, Map<string, boolean>];
    while ((typeValue = typeImportItems.next()?.value!)) {
      const [file, members] = typeValue;
      const relativePath = sourceFile.getRelativePathAsModuleSpecifierTo(file);

      const defaultImports: string[] = [];
      const namedImports: string[] = [];

      members.forEach((isDefault, name) => {
        if (isDefault) {
          defaultImports.push(name);
        } else {
          namedImports.push(name);
        }
      });

      // Generate default imports
      defaultImports.forEach(name => {
        importString += `import type ${name} from '${relativePath}';\n`;
      });

      // Generate named imports
      if (namedImports.length > 0) {
        importString += `import type { ${namedImports.join(', ')} } from '${relativePath}';\n`;
      }
    }
  }

  // Generate value imports (for classes)
  const valueImportItems = valueImports.entries();
  let valueValue: [SourceFile, Map<string, boolean>];
  while ((valueValue = valueImportItems.next()?.value!)) {
    const [file, members] = valueValue;
    const relativePath = sourceFile.getRelativePathAsModuleSpecifierTo(file);

    const defaultImports: string[] = [];
    const namedImports: string[] = [];

    members.forEach((isDefault, name) => {
      if (isDefault) {
        defaultImports.push(name);
      } else {
        namedImports.push(name);
      }
    });

    // Generate default imports
    defaultImports.forEach(name => {
      importString += `import ${name} from '${relativePath}';\n`;
    });

    // Generate named imports
    if (namedImports.length > 0) {
      importString += `import { ${namedImports.join(', ')} } from '${relativePath}';\n`;
    }
  }

  generatedCode =
    Utils.getGenfileHeader(sourceFile) + importString + generatedCode;

  fs.writeFileSync(outputFilePath, generatedCode);
}

function removeIPrefixMaybe(val: string, shouldRemove: boolean) {
  return shouldRemove && val.charAt(0) === 'I' ? val.slice(1) : val;
}

/**
 * For a type-parameter constraint (e.g. `T extends Rect`, `T extends Rect & Shape`),
 * finds all named types referenced in the constraint and adds them to `typeImports`
 * so the generated file has the necessary `import type` statements.
 */
function addConstraintTypeToImports(
  constraintType: Type<ts.Type>,
  currentSourceFile: SourceFile,
  typeImports: Map<SourceFile, Map<string, boolean>>
): void {
  // Flatten intersection / union down to individual constituent types
  const constituents = constraintType.isIntersection()
    ? constraintType.getIntersectionTypes()
    : constraintType.isUnion()
      ? constraintType.getUnionTypes()
      : [constraintType];

  for (const t of constituents) {
    if (t.isBoolean() || t.isNumber() || t.isString()) continue;
    const symbol = t.getAliasSymbol() ?? t.getSymbol();
    const decl = (symbol?.getDeclarations() ?? []).find(
      (d) =>
        d.isKind(ts.SyntaxKind.InterfaceDeclaration) ||
        d.isKind(ts.SyntaxKind.TypeAliasDeclaration) ||
        d.isKind(ts.SyntaxKind.ClassDeclaration)
    );
    if (!decl || !symbol) continue;
    const declFile = decl.getSourceFile();
    if (declFile.getFilePath() === currentSourceFile.getFilePath()) continue;
    const name = symbol.getName();
    const isDefault = (decl as any).isDefaultExport?.() ?? false;
    const list = typeImports.get(declFile) ?? new Map<string, boolean>();
    list.set(name, isDefault);
    typeImports.set(declFile, list);
  }
}

function processInterface(
  interfaceDeclaration: InterfaceDeclaration,
  importsRef: Map<SourceFile, Map<string, boolean>>,
  genFunctionImportsRef: Map<SourceFile, Set<string>>,
  currentSourceFile: SourceFile,
  config: Required<GenCastConfig>,
  isInherited: boolean = false,
  cyclicFilePaths: Set<string> = new Set()
): string[] {
  const propertiesCheckCode: string[] = [];

  const interfaceName = interfaceDeclaration.getName();
  if (config.requireIPrefix && interfaceName.charAt(0) !== 'I') {
    return propertiesCheckCode;
  }

  if (!isInherited) {
    // If this is NOT inherited, then we need to add it to the imports list which is included in
    // the header of the generated file.
    const file = interfaceDeclaration.getSourceFile();
    const list = importsRef.get(file) ?? new Map<string, boolean>();
    list.set(interfaceName, interfaceDeclaration.isDefaultExport());
    importsRef.set(file, list);
  }

  // For interfaces with extensions, we will simply confirm that we can cast to the ancestors

  // IF TRYING TO REUSE EXISTING CAST FUNCTIONS...
  if (config.preferReuseCastFunctions) {
    interfaceDeclaration.getBaseDeclarations().forEach((i) => {
      if (i.isKind(ts.SyntaxKind.InterfaceDeclaration)) {
        const baseInterface = i as InterfaceDeclaration;
        const baseFile = baseInterface.getSourceFile();
        const isCrossFile = baseFile.getFilePath() !== currentSourceFile.getFilePath();
        const wouldCycle = isCrossFile && cyclicFilePaths.has(baseFile.getFilePath());

        if (wouldCycle) {
          // Importing this base's cast function would create a circular dependency between
          // generated files - fall back to inlining all its property checks instead.
          const baseName = baseInterface.getName()!;
          console.log(`  \t↳ ${interfaceName} extends ${baseName}: inlining (cycle detected)`);
          const subProps = processInterface(
            baseInterface,
            importsRef,
            genFunctionImportsRef,
            currentSourceFile,
            config,
            true,
            cyclicFilePaths
          );
          propertiesCheckCode.push(...subProps);
        } else {
          const baseName = baseInterface.getName()!;
          const baseFuncName = `${config.funcPrefix}${removeIPrefixMaybe(baseName, config.removeIPrefix)}`;

          if (isCrossFile) {
            // Need to import the cast function from the other generated file
            const funcSet = genFunctionImportsRef.get(baseFile) ?? new Set<string>();
            funcSet.add(baseFuncName);
            genFunctionImportsRef.set(baseFile, funcSet);
          }
          // If in the same file, no import needed - the function will be in the same generated file

          propertiesCheckCode.push(`${baseFuncName}(obj) !== ${config.failureReturnValue}`);
        }
      } else if (i.isKind(ts.SyntaxKind.TypeLiteral)) {
        // Non-interface base (e.g. an inline object type or a type alias resolved to a type
        // literal) - there is no separately generated cast function to call, so always inline.
        const subProps = processTypeLiteral(<TypeLiteralNode>i, genFunctionImportsRef, currentSourceFile, config, cyclicFilePaths);
        propertiesCheckCode.push(...subProps);
      }
    });
  } else {
    interfaceDeclaration.getBaseDeclarations().forEach((i) => {
      if (config.requireIPrefix && interfaceName.charAt(0) !== 'I') {
        return propertiesCheckCode;
      }

      if (i.isKind(ts.SyntaxKind.TypeLiteral)) {
        const subProps = processTypeLiteral(<TypeLiteralNode>i, genFunctionImportsRef, currentSourceFile, config, cyclicFilePaths);
        propertiesCheckCode.push(...subProps);
      } else if (i.isKind(ts.SyntaxKind.InterfaceDeclaration)) {
        // Only process as InterfaceDeclaration if it actually is one
        const subProps = processInterface(
          <InterfaceDeclaration>i,
          importsRef,
          genFunctionImportsRef,
          currentSourceFile,
          config,
          true,
          cyclicFilePaths
        );
        propertiesCheckCode.push(...subProps);
      }
      // Skip other base declaration types (e.g., type references like Partial<T>)
    });
  }

  // Ensure all methods exist. (Unfortunately we can't check if the return types are compatible!)
  interfaceDeclaration.getMethods().forEach((meth) => {
    const propName = meth.getName();
    propertiesCheckCode.push(`typeof(obj.${propName}) === "function"`);
  });

  // Check the fields for the given interface, confirming the types are correct
  interfaceDeclaration.getProperties().forEach((prop) => {
    const type: Type<ts.Type> = prop.getType();
    const propName = prop.getName();
    if (prop.hasQuestionToken() || type.isAny()) {
      return;
    }

    // Handle array property types before the generic type bailout
    if (type.isArray()) {
      const elementType = type.getArrayElementType();
      propertiesCheckCode.push(elementType
        ? generateArrayPropertyCheck(`obj.${propName}`, elementType, genFunctionImportsRef, currentSourceFile, config, cyclicFilePaths)
        : `Array.isArray(obj.${propName})`);
      return;
    }

    // Handle tuple types (e.g. payPerDay: [number, 'a' | 'b']) before the type-arguments bailout
    if (type.isTuple()) {
      const tupleProps = type.getProperties().filter((p) => /^\d+$/.test(p.getName()));
      const arrayCheck = `Array.isArray(obj.${propName})`;
      if (tupleProps.length === 0) {
        propertiesCheckCode.push(arrayCheck);
      } else {
        const tupleChecks = tupleProps.map((tProp) => {
          const tPropType = tProp.getTypeAtLocation(interfaceDeclaration);
          const tPropRef = `obj.${propName}[${tProp.getName()}]`;
          if (tPropType.isStringLiteral()) return `${tPropRef} === ${tPropType.getText()}`;
          if (tPropType.isUnion() && tPropType.getUnionTypes().every((t) => t.isStringLiteral())) {
            const checks = tPropType.getUnionTypes().map((t) => `${tPropRef} === ${t.getText()}`).join(' || ');
            return `(${checks})`;
          }
          if (tPropType.isString() || tPropType.isNumber() || tPropType.isBoolean()) {
            return `typeof(${tPropRef}) === "${tPropType.getText()}"`;
          }
          return `typeof(${tPropRef}) !== "undefined"`;
        });
        propertiesCheckCode.push(`${arrayCheck} && ${tupleChecks.join(' && ')}`);
      }
      return;
    }

    if (type.getTypeArguments().length > 0) {
      return;
    }

    const isNullable = Utils.checkTypeNullable(type, prop);
    const isStringLiteral = type.isStringLiteral();
    const isStringUnion = type.isUnion() && type.getUnionTypes().every(t => t.isStringLiteral());

    // Handle named object types (interfaces and type aliases) before the anonymous/fallback checks.
    // type.isAnonymous() is also true for type aliases like `type Foo = { ... }`, so we must
    // check for a named declaration first and delegate to the appropriate cast function.
    if (type.isObject()) {
      // Constructor types (e.g. `type Ctor = new (props: any) => T`) cannot be structurally
      // validated at runtime — no cast function is generated for them. Check that the value is
      // a constructable function via `'prototype' in fn` (arrows lack a prototype and cannot
      // be called with `new`, so this is more precise than a bare typeof check).
      if (type.getConstructSignatures().length > 0) {
        propertiesCheckCode.push(`typeof(obj.${propName}) === "function" && 'prototype' in obj.${propName}`);
        return;
      }
      const symbol = type.getAliasSymbol() ?? type.getSymbol();
      const decl = (symbol?.getDeclarations() ?? []).find(
        (d) =>
          d.isKind(ts.SyntaxKind.InterfaceDeclaration) ||
          d.isKind(ts.SyntaxKind.TypeAliasDeclaration)
      );
      if (decl && symbol) {
        const declFile = decl.getSourceFile();
        const isCrossFile = declFile.getFilePath() !== currentSourceFile.getFilePath();
        const wouldCycle = isCrossFile && cyclicFilePaths.has(declFile.getFilePath());
        if (!wouldCycle) {
          const typeName = symbol.getName();
          const funcName = `${config.funcPrefix}${removeIPrefixMaybe(typeName, config.removeIPrefix)}`;
          if (isCrossFile) {
            const funcSet = genFunctionImportsRef.get(declFile) ?? new Set<string>();
            funcSet.add(funcName);
            genFunctionImportsRef.set(declFile, funcSet);
          }
          propertiesCheckCode.push(`${funcName}(obj.${propName}) !== ${config.failureReturnValue}`);
          return;
        }
        // wouldCycle: fall through to the anonymous/function check below
      }
    }

    if (type.getCallSignatures().length > 0 || type.isAnonymous()) {
      // A function-typed property (or an anonymous type we can't inspect further) —
      // verify it is at least a function.
      propertiesCheckCode.push(`typeof(obj.${propName}) === "function"`);
    } else if (isNullable) {
      propertiesCheckCode.push(
        `(typeof(obj.${propName}) === "${type.getText()}" || obj.${propName} === null)`
      );
    } else if (type.isTypeParameter()) {
      propertiesCheckCode.push(`typeof(obj.${propName}) !== "undefined"`);
    } else if (isStringLiteral) {
      // Single string literal like "admin"
      propertiesCheckCode.push(`obj.${propName} === ${type.getText()}`);
    } else if (isStringUnion) {
      // Union of string literals like "admin" | "user"
      const checks = type.getUnionTypes()
        .map(t => `obj.${propName} === ${(t as Type<ts.Type>).getText()}`)
        .join(' || ');
      propertiesCheckCode.push(`(${checks})`);
    } else {
      propertiesCheckCode.push(
        `typeof(obj.${propName}) === "${(type as Type<ts.Type>).getText()}"`
      );
    }
  });

  if (!isInherited) {
    // green
    console.log(`  \x1b[32m${interfaceName}\x1b[0m`);
  }

  return propertiesCheckCode;
}

function processTypeLiteral(
  interfaceDeclaration: TypeLiteralNode,
  genFunctionImportsRef?: Map<SourceFile, Set<string>>,
  currentSourceFile?: SourceFile,
  config?: Required<GenCastConfig>,
  cyclicFilePaths?: Set<string>
): string[] {
  const propertiesCheckCode: string[] = [];

  // Check the fields for the given interface, confirming the types are correct
  interfaceDeclaration.getProperties().forEach((prop) => {
    const type: Type<ts.Type> = prop.getType();
    const propName = prop.getName();
    if (prop.hasQuestionToken() || type.isAny()) {
      return;
    }

    // Handle array property types before the generic type bailout
    if (type.isArray() && genFunctionImportsRef && currentSourceFile && config) {
      const elementType = type.getArrayElementType();
      propertiesCheckCode.push(elementType
        ? generateArrayPropertyCheck(`obj.${propName}`, elementType, genFunctionImportsRef, currentSourceFile, config, cyclicFilePaths)
        : `Array.isArray(obj.${propName})`);
      return;
    }

    if (type.getTypeArguments().length > 0) {
      return;
    }

    const isNullable = Utils.checkTypeNullable(type, prop);
    if (type.isAnonymous()) {
      // Actually a method but is showing up as a property! Again, can't check the return type.
      propertiesCheckCode.push(`typeof(obj.${propName}) === "function"`);
    } else if (isNullable) {
      propertiesCheckCode.push(
        `(typeof(obj.${propName}) === "${type.getText()}" || obj.${propName} === null)`
      );
    } else if (type.isTypeParameter()) {
      propertiesCheckCode.push(`typeof(obj.${propName}) !== "undefined"`);
    } else {
      propertiesCheckCode.push(
        `typeof(obj.${propName}) === "${(type as Type<ts.Type>).getText()}"`
      );
    }
  });

  return propertiesCheckCode;
}

/**
 * For a complex (object) type used as a property value, generates a thorough runtime check.
 *
 * - When `preferReuseCastFunctions` is true and the type has a named declaration (interface or
 *   type alias), emits a call to the existing cast function, e.g. `CastToVector2Like(obj[0]) !== null`.
 * - Otherwise inlines per-property checks with a null guard on the element itself, e.g.
 *   `(obj[0] != null && typeof(obj[0].x) === "number" && typeof(obj[0].y) === "number")`.
 *
 * Returns `null` when the type has no properties and no better check can be produced.
 */
function generateComplexTypeCheck(
  propRef: string,
  propType: Type<ts.Type>,
  location: TypeAliasDeclaration,
  genFunctionImportsRef: Map<SourceFile, Set<string>>,
  currentSourceFile: SourceFile,
  config: Required<GenCastConfig>,
  cyclicFilePaths: Set<string> = new Set()
): string | null {
  const properties = propType.getProperties();
  if (properties.length === 0) return null;

  // preferReuseCastFunctions: delegate to an existing cast function if one can be found
  if (config.preferReuseCastFunctions) {
    // For type aliases (e.g. `type Vector2Like = { ... }`), getSymbol() returns the symbol of the
    // underlying anonymous object structure, NOT the alias. getAliasSymbol() correctly returns the
    // type alias symbol. For interfaces, getSymbol() works fine. Prefer aliasSymbol.
    const symbol = propType.getAliasSymbol() ?? propType.getSymbol();
    const decls = symbol?.getDeclarations() ?? [];
    const decl = decls.find(
      (d) =>
        d.isKind(ts.SyntaxKind.InterfaceDeclaration) ||
        d.isKind(ts.SyntaxKind.TypeAliasDeclaration)
    );
    if (decl && symbol) {
      const declFile = decl.getSourceFile();
      const isCrossFile = declFile.getFilePath() !== currentSourceFile.getFilePath();
      const wouldCycle = isCrossFile && cyclicFilePaths.has(declFile.getFilePath());

      if (!wouldCycle) {
        const typeName = symbol.getName();
        const funcName = `${config.funcPrefix}${removeIPrefixMaybe(typeName, config.removeIPrefix)}`;
        if (isCrossFile) {
          const funcSet = genFunctionImportsRef.get(declFile) ?? new Set<string>();
          funcSet.add(funcName);
          genFunctionImportsRef.set(declFile, funcSet);
        }
        return `${funcName}(${propRef}) !== ${config.failureReturnValue}`;
      }
      // wouldCycle === true: fall through to the inline check below
      console.log(`  \t↳ ${propRef} (${symbol.getName()}): inlining (cycle detected)`);
    }
  }

  // Inline: null-guard the element and then check each of its properties
  const nullCheck = config.strictNullCheck
    ? `${propRef} !== null && ${propRef} !== undefined`
    : `${propRef} != null`;

  const subChecks: string[] = [nullCheck];
  properties.forEach((prop) => {
    const pType = prop.getTypeAtLocation(location);
    const pName = prop.getName();
    const pRef = /^\d+$/.test(pName) ? `${propRef}[${pName}]` : `${propRef}.${pName}`;

    if (pType.isString() || pType.isNumber() || pType.isBoolean()) {
      subChecks.push(`typeof(${pRef}) === "${pType.getText()}"`);
    } else {
      subChecks.push(`typeof(${pRef}) !== "undefined"`);
    }
  });

  return `(${subChecks.join(' && ')})`;
}

/**
 * Generates a runtime check expression for an array-typed property.
 *
 * - For primitive element types (`string`, `number`, `boolean`) emits an `.every()`
 *   inline check: `Array.isArray(propRef) && propRef.every(item => typeof item === "...")`
 * - For named object types (interfaces / type aliases) with an available cast function,
 *   delegates to it: `Array.isArray(propRef) && propRef.every(item => CastToX(item) !== null)`
 * - Falls back to a bare `Array.isArray(propRef)` when the element type cannot be resolved.
 */
function generateArrayPropertyCheck(
  propRef: string,
  elementType: Type<ts.Type>,
  genFunctionImportsRef: Map<SourceFile, Set<string>>,
  currentSourceFile: SourceFile,
  config: Required<GenCastConfig>,
  cyclicFilePaths: Set<string> = new Set()
): string {
  const failureValue = config.failureReturnValue;
  const isJS = config.outputLanguage === 'js';
  const itemParam = isJS ? 'item' : '(item: unknown)';
  const base = `Array.isArray(${propRef})`;

  // Primitive element types
  if (elementType.isString()) return `${base} && ${propRef}.every(${itemParam} => typeof item === "string")`;
  if (elementType.isNumber()) return `${base} && ${propRef}.every(${itemParam} => typeof item === "number")`;
  if (elementType.isBoolean()) return `${base} && ${propRef}.every(${itemParam} => typeof item === "boolean")`;

  // Named object type (interface or type alias) - call its cast function in .every()
  if (elementType.isObject()) {
    // Constructor types cannot be structurally validated; fall back to the array-only check.
    if (elementType.getConstructSignatures().length > 0) {
      return base;
    }
    const symbol = elementType.getAliasSymbol() ?? elementType.getSymbol();
    const decl = (symbol?.getDeclarations() ?? []).find(
      (d) =>
        d.isKind(ts.SyntaxKind.InterfaceDeclaration) ||
        d.isKind(ts.SyntaxKind.TypeAliasDeclaration)
    );
    if (decl && symbol) {
      const declFile = decl.getSourceFile();
      const isCrossFile = declFile.getFilePath() !== currentSourceFile.getFilePath();
      const wouldCycle = isCrossFile && cyclicFilePaths.has(declFile.getFilePath());
      if (!wouldCycle) {
        const typeName = symbol.getName();
        const funcName = `${config.funcPrefix}${removeIPrefixMaybe(typeName, config.removeIPrefix)}`;
        if (isCrossFile) {
          const funcSet = genFunctionImportsRef.get(declFile) ?? new Set<string>();
          funcSet.add(funcName);
          genFunctionImportsRef.set(declFile, funcSet);
        }
        return `${base} && ${propRef}.every(${itemParam} => ${funcName}(item) !== ${failureValue})`;
      }
    }
  }

  // Fallback: just confirm it is an array
  return base;
}

function processTypeAlias(
  typeAliasDeclaration: TypeAliasDeclaration,
  importsRef: Map<SourceFile, Map<string, boolean>>,
  genFunctionImportsRef: Map<SourceFile, Set<string>>,
  currentSourceFile: SourceFile,
  config: Required<GenCastConfig>,
  cyclicFilePaths: Set<string> = new Set()
): string[] {
  const propertiesCheckCode: string[] = [];

  const typeName = typeAliasDeclaration.getName();

  // Add to imports for the generated file
  const file = typeAliasDeclaration.getSourceFile();
  const list = importsRef.get(file) ?? new Map<string, boolean>();
  list.set(typeName, typeAliasDeclaration.isDefaultExport());
  importsRef.set(file, list);

  const type = typeAliasDeclaration.getType();

  // Handle intersection types (e.g., type Point3D = Point & { z: number })
  if (type.isIntersection()) {
    type.getIntersectionTypes().forEach((intersectedType) => {
      const props = intersectedType.getProperties();
      props.forEach((prop) => {
        const propType = prop.getTypeAtLocation(typeAliasDeclaration);
        const propName = prop.getName();
        const propRef = /^\d+$/.test(propName) ? `obj[${propName}]` : `obj.${propName}`;

        // Skip optional properties and any types; handle arrays before generic bailout
        if (propType.isAny() || !!(prop.getFlags() & ts.SymbolFlags.Optional)) {
          return;
        }

        // Handle array property types
        if (propType.isArray()) {
          const elementType = propType.getArrayElementType();
          propertiesCheckCode.push(elementType
            ? generateArrayPropertyCheck(propRef, elementType, genFunctionImportsRef, currentSourceFile, config, cyclicFilePaths)
            : `Array.isArray(${propRef})`);
          return;
        }

        if (propType.getTypeArguments().length > 0) {
          return;
        }

        const isNullable = propType.isNull() || propType.isNullable();
        const isStringLiteral = propType.isStringLiteral();
        const isStringUnion = propType.isUnion() && propType.getUnionTypes().every(t => t.isStringLiteral());

        if (isNullable) {
          propertiesCheckCode.push(
            `(typeof(${propRef}) === "${propType.getText()}" || ${propRef} === null)`
          );
        } else if (isStringLiteral) {
          propertiesCheckCode.push(`${propRef} === ${propType.getText()}`);
        } else if (isStringUnion) {
          const checks = propType.getUnionTypes()
            .map(t => `${propRef} === ${(t as Type<ts.Type>).getText()}`)
            .join(' || ');
          propertiesCheckCode.push(`(${checks})`);
        } else if (propType.isString() || propType.isNumber() || propType.isBoolean()) {
          propertiesCheckCode.push(`typeof(${propRef}) === "${propType.getText()}"`);
        } else {
          // For complex types, generate a thorough check (or fall back to existence check)
          const complexCheck = generateComplexTypeCheck(propRef, propType, typeAliasDeclaration, genFunctionImportsRef, currentSourceFile, config, cyclicFilePaths);
          propertiesCheckCode.push(complexCheck ?? `typeof(${propRef}) !== "undefined"`);
        }
      });
    });
  } else {
    // Regular object type (or tuple)
    // For tuples, getProperties() includes all inherited Array prototype methods (reverse, slice,
    // etc.) in addition to the index properties (0, 1, ...). Unless the user opts in, filter
    // those out so the generated cast only checks the actual tuple elements.
    const isTuple = type.isTuple();
    const rawProperties = type.getProperties();
    const properties = (isTuple && !config.includeTupleArrayMethods)
      ? rawProperties.filter((p) => /^\d+$/.test(p.getName()))
      : rawProperties;

    properties.forEach((prop) => {
      const propType = prop.getTypeAtLocation(typeAliasDeclaration);
      const propName = prop.getName();
      const propRef = /^\d+$/.test(propName) ? `obj[${propName}]` : `obj.${propName}`;

      // Skip optional properties and any types; handle arrays before generic bailout
      if (propType.isAny() || !!(prop.getFlags() & ts.SymbolFlags.Optional)) {
        return;
      }

      // Handle array property types
      if (propType.isArray()) {
        const elementType = propType.getArrayElementType();
        propertiesCheckCode.push(elementType
          ? generateArrayPropertyCheck(propRef, elementType, genFunctionImportsRef, currentSourceFile, config, cyclicFilePaths)
          : `Array.isArray(${propRef})`);
        return;
      }

      if (propType.getTypeArguments().length > 0) {
        return;
      }

      const isNullable = propType.isNull() || propType.isNullable();
      const isStringLiteral = propType.isStringLiteral();
      const isStringUnion = propType.isUnion() && propType.getUnionTypes().every(t => t.isStringLiteral());

      // Check if it's a method or constructor type
      const callSignatures = propType.getCallSignatures();
      if (propType.getConstructSignatures().length > 0) {
        propertiesCheckCode.push(`typeof(${propRef}) === "function" && 'prototype' in ${propRef}`);
      } else if (callSignatures.length > 0) {
        propertiesCheckCode.push(`typeof(${propRef}) === "function"`);
      } else if (isNullable) {
        propertiesCheckCode.push(
          `(typeof(${propRef}) === "${propType.getText()}" || ${propRef} === null)`
        );
      } else if (isStringLiteral) {
        propertiesCheckCode.push(`${propRef} === ${propType.getText()}`);
      } else if (isStringUnion) {
        const checks = propType.getUnionTypes()
          .map(t => `${propRef} === ${(t as Type<ts.Type>).getText()}`)
          .join(' || ');
        propertiesCheckCode.push(`(${checks})`);
      } else if (propType.isString() || propType.isNumber() || propType.isBoolean()) {
        propertiesCheckCode.push(`typeof(${propRef}) === "${propType.getText()}"`);
      } else {
        // For complex types, generate a thorough check (or fall back to existence check)
        const complexCheck = generateComplexTypeCheck(propRef, propType, typeAliasDeclaration, genFunctionImportsRef, currentSourceFile, config, cyclicFilePaths);
        propertiesCheckCode.push(complexCheck ?? `typeof(${propRef}) !== "undefined"`);
      }
    });
  }

  //  same blue as other types
  console.log(`  \x1b[36m${typeName}\x1b[0m`);

  return propertiesCheckCode;
}
