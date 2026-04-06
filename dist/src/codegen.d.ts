/**
 * GenCast - Runtime type casting for TypeScript interfaces
 *
 * This module generates type-safe runtime casting functions based on your TypeScript interfaces.
 * It uses duck typing to validate objects at runtime.
 */
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
/**
 * Attempts to load gencast.config.js from the current working directory.
 * Returns an empty object if the file doesn't exist or cannot be loaded.
 */
export declare function loadConfig(): GenCastConfig;
/**
 * Generates a gencast.config.js file with default values and documentation.
 * @returns true if the file was created, false if it already exists
 */
export declare function initConfig(): boolean;
/**
 * Updates VS Code workspace settings to exclude generated files.
 * Reads the genFileName from the config and adds exclusion patterns.
 * @returns true if the settings were updated successfully
 */
export declare function updateVSCodeSettings(): boolean;
/**
 * Main entry point for GenCast code generation
 * @param userConfig Optional configuration to override defaults
 */
export declare function generateCodegen(userConfig?: GenCastConfig): void;
/**
 * Writes the shared utility casts file (e.g. `gencast.gen.ts`).
 * Contains generic helpers that are not tied to any specific generated type.
 *
 * @param outputFilePath Optional path for the output file. Defaults to `./gencast.gen.[ext]`
 *   next to the cwd. Supports the `[ext]` placeholder.
 * @param userConfig Optional config overrides (e.g. `outputLanguage`, `failureReturnValue`, `strictNullCheck`).
 */
export declare function generateUtilityCastsFile(outputFilePath?: string, userConfig?: GenCastConfig): void;
