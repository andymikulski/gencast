# GenCast Configuration

GenCast looks for `gencast.config.cjs` (preferred) or `gencast.config.js` in your project root. Run `npx gencast init` to scaffold one.

```js
/** @type {import('gencast').GenCastConfig} */
module.exports = {
  tsconfigPath: './tsconfig.json',
  genFileName: '[filename].gen.[ext]',
  outputLanguage: 'ts',
  // ...
};
```

## Options

| Option | Default | Description |
|---|---|---|
| [`tsconfigPath`](#tsconfigpath) | `'./tsconfig.json'` | Path to your project's tsconfig. |
| [`genFileName`](#genfilename) | `'[filename].gen.[ext]'` | Template for generated file names. |
| [`outputLanguage`](#outputlanguage) | `'ts'` | Emit TypeScript or plain JavaScript. |
| [`funcPrefix`](#funcprefix) | `'CastTo'` | Prefix used when forming function names. |
| [`removeIPrefix`](#removeiprefix) | `true` | Strip leading `I` from interface names. |
| [`requireIPrefix`](#requireiprefix) | `false` | Only process interfaces named `I…`. |
| [`outputEmptyInterfaces`](#outputemptyinterfaces) | `true` | Generate casts for property-less interfaces. |
| [`preferReuseCastFunctions`](#preferreusecastfunctions) | `true` | Child casts call parent casts instead of inlining. |
| [`failureReturnValue`](#failurereturnvalue) | `'null'` | Value returned when a cast fails. |
| [`strictNullCheck`](#strictnullcheck) | `false` | Use `!== null && !== undefined` instead of `!= null`. |
| [`generateClassCasts`](#generateclasscasts) | `false` | Emit per-class `instanceof` casts. |
| [`generateTypeCasts`](#generatetypecasts) | `true` | Emit casts for exported type aliases. |
| [`includeTupleArrayMethods`](#includetuplearraymethods) | `false` | Include inherited Array methods in tuple checks. |
| [`enableWeakMapCaching`](#enableweakmapcaching) | `false` | Cache cast results per object in a `WeakMap`. |
| [`useUtilityArrayCast`](#useutilityarraycast) | `false` | Use `CastToArray` helper for array-of-named-type checks. |
| [`utilsFilePath`](#utilsfilepath) | `'./gencast.gen.[ext]'` | Path to the shared utility helpers file. |
| [`generateNodeModulesCasts`](#generatenodemodulescasts) | `false` | Emit casts for types declared in `node_modules`. |
| [`nodeModulesCastsFilePath`](#nodemodulescastsfilepath) | `'./gencast.nodemodules.gen.[ext]'` | Path to the shared `node_modules` casts file. |
| [`exclude`](#exclude) | `[]` | Source-file paths to skip — strings (substring match) and/or `RegExp`. |

---

### `tsconfigPath`

Path to the `tsconfig.json` GenCast uses to discover source files. Change this if your config lives outside the project root.

```js
tsconfigPath: './configs/tsconfig.build.json'
```

### `genFileName`

Template for generated file names. Two placeholders are available:

- `[filename]` — the source file's base name (no extension)
- `[ext]` — `ts` or `js`, based on `outputLanguage`

```js
genFileName: '[filename].cast.[ext]'           // → User.cast.ts
genFileName: '__generated__/[filename].[ext]'  // → __generated__/User.ts
```

### `outputLanguage`

- `'ts'` — full TypeScript with `import type` statements and return-type annotations.
- `'js'` — plain JavaScript with no type annotations. Only value imports needed for `instanceof` checks are kept.

### `funcPrefix`

Prefix prepended to each interface or type name when forming the function name.

```js
funcPrefix: 'CastTo' // CastToUser
funcPrefix: 'is'     // isUser
```

### `removeIPrefix`

When `true`, a leading `I` is stripped from interface names when forming function names (e.g. `IUser` → `CastToUser`). Only applies when the `I` is followed by an uppercase letter, so names like `Input` are left alone.

### `requireIPrefix`

When `true`, only interfaces whose names begin with `I` are processed. Useful for keeping GenCast away from third-party or ambient types (e.g. DOM interfaces like `HTMLElement`) that happen to be visible in your project.

| Setting | Result for `IUser` + `Config` |
|---|---|
| `false` (default) | `CastToUser` and `CastToConfig` |
| `true` | `CastToUser` only |

### `outputEmptyInterfaces`

Controls whether cast functions are generated for interfaces with no properties. Since `{}` is effectively a supertype of all non-nullish values, an empty-interface cast accepts almost anything and is rarely useful.

### `preferReuseCastFunctions`

Controls how inheritance is handled.

- `true` (default) — the child's cast calls the parent's cast.
- `false` — every property check is inlined. Use this if you hit circular import errors caused by interfaces extending each other across files.

```ts
// preferReuseCastFunctions: true
export function CastToMissile(obj: any): IMissile | null {
  return (obj != null &&
    CastToWeapon(obj) !== null &&
    typeof(obj.explosionRadius) === "number") ? obj : null;
}

// preferReuseCastFunctions: false
export function CastToMissile(obj: any): IMissile | null {
  return (obj != null &&
    typeof(obj.damage) === "number" &&
    typeof(obj.explosionRadius) === "number") ? obj : null;
}
```

### `failureReturnValue`

What a failing cast returns. `'null'` or `'undefined'` — match your project conventions.

### `strictNullCheck`

- `false` (default) — uses `obj != null`.
- `true` — uses `obj !== null && obj !== undefined`. Useful when linting forbids `==`/`!=`.

### `generateClassCasts`

When `true`, each exported class gets its own `instanceof`-based cast:

```ts
export function CastToUserAccount(obj: any): UserAccount | null {
  return (obj != null && obj instanceof UserAccount) ? obj : null;
}
```

The generic `CastToClass(obj, Ctor)` helper (see `gencast utils`) is usually a better default than per-class functions.

### `generateTypeCasts`

When `true`, exported type aliases get cast functions. Three shapes are handled:

| Alias | Example | Check |
|---|---|---|
| Object type | `type Point = { x: number; y: number }` | property-by-property |
| Primitive alias | `type ID = number` | `typeof obj === 'number'` |
| String literal union | `type Status = 'a' \| 'b'` | equality check per member |

### `includeTupleArrayMethods`

When `true`, tuple casts include checks for inherited Array prototype methods (`reverse`, `slice`, etc.). Technically correct but noisy, since tuples are rarely treated as general arrays.

### `enableWeakMapCaching`

When `true`, each generated cast stores its result in a module-level `WeakMap` keyed on the input object. Subsequent calls with the same reference return the cached result without re-running checks. The `WeakMap` is created lazily, so unused functions cost nothing.

Only applies to interface and object-type casts — primitive and string-literal casts are unaffected. Most useful in hot code paths (render loops, high-frequency event handlers).

### `useUtilityArrayCast`

When `true`, array-of-named-type checks use the `CastToArray` helper instead of an inline `Array.isArray(...) && (...).every(...)`:

```ts
// false (default)
Array.isArray(obj.users) && obj.users.every((item: unknown) => CastToUser(item) !== null)

// true
CastToArray(obj.users, CastToUser) !== null
```

When enabled, the utility file at `utilsFilePath` is created if it doesn't already exist.

### `utilsFilePath`

Where the shared utility helpers file lives. Used by `useUtilityArrayCast` and by `gencast utils`. Supports `[ext]`.

### `generateNodeModulesCasts`

When `true`, types declared inside `node_modules` (e.g. `lib.*.d.ts`, `@types/*`) get structural casts emitted into a shared file at `nodeModulesCastsFilePath`, and other gen files import from there.

When `false` (default), references to `node_modules`-declared types fall back to a basic existence check and no deep `node_modules` imports are emitted.

`Record<K, V>` is always handled inline regardless of this flag.

### `nodeModulesCastsFilePath`

Where the shared `node_modules` casts file lives. Used when `generateNodeModulesCasts` is enabled. Supports `[ext]`.

### `exclude`

Source-file paths matching any entry are skipped — no `.gen.ts` is written for them. The full project is still loaded from `tsconfig.json`, so types declared in excluded files remain resolvable for files that reference them.

- **String entries** match as a case-sensitive substring against the file path. Paths are normalised to forward slashes before testing, so `'src/engine'` works on Windows too.
- **RegExp entries** are tested with `.test(filePath)` against the normalised path.

Accepts a single value or an array. The default is `[]` (nothing excluded).

```js
// Skip everything in src/engine
exclude: ['src/engine']

// Skip a folder and all test files
exclude: ['src/engine', /\.test\.ts$/]

// Single regex (no array needed)
exclude: /\.spec\.ts$/
```

**Caveat:** when [`preferReuseCastFunctions`](#preferreusecastfunctions) is `true` and a non-excluded file extends a type declared in an excluded file, the generated import will point at a `.gen.ts` that does not exist. Either restructure the inheritance or set `preferReuseCastFunctions: false` for those cases.
