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
     * The extension for generated files.
     * For instance, if the extension is `.gen.ts`, then the generated file for
     * `MyInterface.ts` will be `MyInterface.gen.ts`.
     * @default '.gen.ts'
     */
    genFileExt?: string;
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
     * If `true`, will generate cast functions for type aliases with object types.
     *
     * @default false
     */
    generateTypeCasts?: boolean;
    /**
     * If `true`, will generate cast functions for primitive type aliases.
     * For example, `type ID = number` will generate a function that checks typeof.
     *
     * @default false
     */
    generatePrimitiveTypeCasts?: boolean;
    /**
     * If `true`, will generate cast functions for string literal union types.
     * For example, `type Status = 'active' | 'inactive'` will generate a function
     * that validates the string matches one of the allowed values.
     *
     * @default false
     */
    generateStringLiteralTypeCasts?: boolean;
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
    checkTupleArrayMethods?: boolean;
    /**
     * If `true`, generates a single utility file containing generic cast helpers that are not
     * tied to any specific type. Currently includes:
     *
     * - `CastToClass<T>(obj, ctor)` — generic instanceof check, so you can write
     *   `CastToClass(obj, MyClass)` instead of a per-class generated function.
     *
     * The output path is controlled by `utilityCastsPath`.
     *
     * @default false
     */
    generateUtilityCasts?: boolean;
    /**
     * The path (relative to cwd) where the utility casts file is written when
     * `generateUtilityCasts` is `true`.
     *
     * @default './gencast-utils.gen.ts'
     */
    utilityCastsPath?: string;
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
 * Reads the genFileExt from the config and adds exclusion patterns.
 * @returns true if the settings were updated successfully
 */
export declare function updateVSCodeSettings(): boolean;
/**
 * Main entry point for GenCast code generation
 * @param userConfig Optional configuration to override defaults
 */
export declare function generateCodegen(userConfig?: GenCastConfig): void;
