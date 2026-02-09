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
     *
     * @default false
     */
    generateClassCasts?: boolean;
    /**
     * If `true`, will remove the 'I' prefix from interface names when generating function names.
     * For example, `IUser` will generate `CastToUser` instead of `CastToIUser`.
     *
     * @default true
     */
    removeIPrefix?: boolean;
}
/**
 * Attempts to load gencast.config.js from the current working directory.
 * Returns an empty object if the file doesn't exist or cannot be loaded.
 */
export declare function loadConfig(): GenCastConfig;
/**
 * Main entry point for GenCast code generation
 * @param userConfig Optional configuration to override defaults
 */
export declare function generateCodegen(userConfig?: GenCastConfig): void;
