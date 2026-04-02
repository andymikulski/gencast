# GenCast

**Runtime type casting for TypeScript interfaces using duck typing**

GenCast automatically generates type-safe runtime casting functions for your TypeScript interfaces. It crawls your TypeScript project and creates `.gen.ts` files with `CastTo*` functions that validate object shapes at runtime using duck typing.

## Why GenCast?

TypeScript's type system is erased at runtime, meaning you can't validate if an `unknown` or `any` value matches an interface. GenCast solves this by generating runtime validators that check if an object has the correct shape.

```typescript
// Your interface
export interface IUser {
  id: number;
  name: string;
  email: string;
}

// Generated function (in IUser.gen.ts)
export function CastToUser(obj: any): IUser | null {
  return (
    obj != null &&
    typeof(obj.id) === "number" &&
    typeof(obj.name) === "string" &&
    typeof(obj.email) === "string"
  ) ? obj : null;
}
```

## Installation

Install directly from GitHub:

```bash
npm install --save-dev github:andymikulski/gencast
# or
yarn add -D github:andymikulski/gencast
```

## Quick Start

1. **Add the script to your `package.json`:**

```json
{
  "scripts": {
    "gencast": "gencast"
  }
}
```

2. **(Optional) Create a configuration file:**

```bash
npm run gencast init
# or
yarn gencast init
```

This creates a `gencast.config.js` file with all available options and their defaults.

3. **Run GenCast:**

```bash
npm run gencast
# or
yarn gencast
```

4. **Use the generated casting functions:**

```typescript
import { CastToUser } from './User.gen';

const data: any = await fetchUserFromAPI();
const user = CastToUser(data);

if (user) {
  // user is now typed as IUser and validated!
  console.log(user.name);
} else {
  console.error('Invalid user data received');
}
```

## How It Works

GenCast scans all TypeScript files in your project (based on your `tsconfig.json`) and:

1. Finds all **exported** interfaces
2. Generates a `.gen.ts` file next to each source file containing interfaces
3. Creates `CastTo*` functions that validate object shapes at runtime
4. Handles inheritance, generics, nullable types, and string unions

## CLI Commands

```bash
# Generate casting functions (default command)
gencast

# Create a gencast.config.js configuration file
gencast init

# Show help message
gencast --help
```

## Configuration

Create a `gencast.config.js` file in your project root (optional):

```bash
npm run gencast init
```

This will create a configuration file with all available options:

```javascript
/** @type {import('gencast').GenCastConfig} */
module.exports = {
  // Path to your tsconfig.json (default: './tsconfig.json')
  tsconfigPath: './tsconfig.json',

  // Filename template for generated files (default: '[filename].gen.[ext]')
  // [filename] = source base name, [ext] = ts or js (based on outputLanguage)
  genFileName: '[filename].gen.[ext]',

  // Output language: 'ts' (default) or 'js'
  outputLanguage: 'ts',

  // Prefix for generated functions (default: 'CastTo')
  funcPrefix: 'CastTo',

  // Reuse cast functions for inherited interfaces instead of inlining checks (default: false)
  // Warning: may create circular dependencies
  preferReuseCastFunctions: false,

  // Only generate for interfaces with 'I' prefix (default: false)
  requireIPrefix: false,

  // Generate functions for empty interfaces (default: true)
  outputEmptyInterfaces: true,

  // Remove 'I' prefix from interface names in function names (default: true)
  // For example, IUser generates CastToUser when true, CastToIUser when false
  removeIPrefix: true,

  // Generate cast functions for classes using instanceof checks (default: false)
  generateClassCasts: false,

  // Generate cast functions for object type aliases, e.g. `type Point = { x: number; y: number }` (default: false)
  generateTypeCasts: false,

  // Generate cast functions for primitive type aliases, e.g. `type ID = number` (default: false)
  generatePrimitiveTypeCasts: false,

  // Generate cast functions for string literal union types, e.g. `type Status = 'active' | 'inactive'` (default: false)
  generateStringLiteralTypeCasts: false,

  // Value returned when a cast fails: 'null' (default) or 'undefined'
  failureReturnValue: 'null',

  // Use strict null checks: obj !== null && obj !== undefined (default: false)
  // When false, uses the more concise loose check: obj != null
  strictNullCheck: false,

  // Include inherited Array prototype method checks in tuple cast functions (default: false)
  includeTupleArrayMethods: false,

  // Generate a utility file with generic cast helpers such as CastToClass<T>(obj, ctor) (default: false)
  generateUtilityCasts: false,

  // Output path for the utility casts file; [ext] is replaced with 'ts' or 'js' (default: './gencast-utils.gen.[ext]')
  utilityCastsPath: './gencast-utils.gen.[ext]',

  // Cache cast results per-object using a WeakMap for faster repeated calls (default: false)
  enableWeakMapCaching: false,
};
```


## Configuration Reference

### `tsconfigPath`

**Default:** `'./tsconfig.json'`

Path to your project's `tsconfig.json`. GenCast uses this to discover all source files in your project. Change this if your config lives somewhere other than the project root.

```javascript
tsconfigPath: './configs/tsconfig.build.json'
```

---

### `genFileName`

**Default:** `'[filename].gen.[ext]'`

Template for the names of generated files. Two placeholders are available:

- `[filename]` — replaced with the source file's base name (no extension)
- `[ext]` — replaced with `ts` or `js` based on `outputLanguage`

```javascript
genFileName: '[filename].cast.[ext]'        // → User.cast.ts
genFileName: '__generated__/[filename].[ext]' // → __generated__/User.ts
```

---

### `outputLanguage`

**Default:** `'ts'`

Controls whether generated files are TypeScript or plain JavaScript.

- `'ts'` — Full TypeScript with `import type` statements, generics, and return-type annotations.
- `'js'` — Plain JavaScript with no type annotations. Only value imports needed for `instanceof` checks are kept.

**With `outputLanguage: 'ts'` (default):**
```typescript
import type { IUser } from './User';

export function CastToUser(obj: any): IUser | null {
  return (obj != null && typeof(obj.id) === "number" && typeof(obj.name) === "string") ? obj : null;
}
```

**With `outputLanguage: 'js'`:**
```javascript
export function CastToUser(obj) {
  return (obj != null && typeof(obj.id) === "number" && typeof(obj.name) === "string") ? obj : null;
}
```

---

### `funcPrefix`

**Default:** `'CastTo'`

Prefix prepended to each interface or type name when forming the function name.

**With `funcPrefix: 'CastTo'` (default):**
```typescript
export function CastToUser(obj: any): IUser | null { ... }
```

**With `funcPrefix: 'validate'`:**
```typescript
export function validateUser(obj: any): IUser | null { ... }
```

---

### `removeIPrefix`

**Default:** `true`

When `true`, any leading `I` is stripped from interface names when building function names (e.g. `IUser` → `CastToUser`). The strip only applies when the `I` is followed by an uppercase letter, so names like `Input` are left untouched.

**With `removeIPrefix: true` (default):**
```typescript
export function CastToUser(obj: any): IUser | null { ... }
```

**With `removeIPrefix: false`:**
```typescript
export function CastToIUser(obj: any): IUser | null { ... }
```

---

### `requireIPrefix`

**Default:** `false`

When `true`, _only_ interfaces whose names begin with `I` (e.g. `IUser`) are processed. Interfaces without the `I` prefix are silently skipped. This can be useful for preventing GenCast from generating casts for third-party or ambient types (e.g. DOM interfaces like `HTMLElement`) that happen to be visible in your project.

**Input:**
```typescript
export interface IUser { id: number; name: string; }
export interface Config { debug: boolean; } // no I-prefix
```

| Setting | Result |
|---|---|
| `requireIPrefix: false` (default) | Generates `CastToUser` **and** `CastToConfig` |
| `requireIPrefix: true` | Generates `CastToUser` only — `Config` is skipped |

---

### `outputEmptyInterfaces`

**Default:** `true`

Controls whether cast functions are generated for interfaces that have no properties.

**Input:**
```typescript
export interface IMarker {}
```

**With `outputEmptyInterfaces: true` (default):**
```typescript
export function CastToMarker(obj: any): IMarker | null {
  return (obj != null) ? obj : null;
}
```

**With `outputEmptyInterfaces: false`:** `IMarker` is skipped — no function is generated.

---

### `preferReuseCastFunctions`

**Default:** `false`

Controls how inheritance is handled in generated cast functions.

- `false` — All property checks are inlined. The cast function for a child interface re-checks every property, including those inherited from parent interfaces.
- `true` — The child's cast function calls the already-generated parent cast function instead of repeating its checks. This produces leaner output but can cause **circular import errors** if two files have interfaces that extend each other across file boundaries.

**Input:**
```typescript
// Weapon.ts
export interface IWeapon { damage: number; }

// Missile.ts
import { IWeapon } from './Weapon';
export interface IMissile extends IWeapon { explosionRadius: number; }
```

**With `preferReuseCastFunctions: false` (default)** — every property inlined:
```typescript
// Missile.gen.ts
export function CastToMissile(obj: any): IMissile | null {
  return (obj != null &&
    typeof(obj.damage) === "number" &&
    typeof(obj.explosionRadius) === "number") ? obj : null;
}
```

**With `preferReuseCastFunctions: true`** — delegates to parent's cast:
```typescript
// Missile.gen.ts
import { CastToWeapon } from './Weapon.gen';

export function CastToMissile(obj: any): IMissile | null {
  return (obj != null &&
    CastToWeapon(obj) !== null &&
    typeof(obj.explosionRadius) === "number") ? obj : null;
}
```

---

### `failureReturnValue`

**Default:** `'null'`

The value returned when a cast fails. Choose `'null'` or `'undefined'` depending on your project's conventions.

**With `failureReturnValue: 'null'` (default):**
```typescript
export function CastToUser(obj: any): IUser | null {
  return (obj != null && typeof(obj.id) === "number") ? obj : null;
}
```

**With `failureReturnValue: 'undefined'`:**
```typescript
export function CastToUser(obj: any): IUser | undefined {
  return (obj != null && typeof(obj.id) === "number") ? obj : undefined;
}
```

---

### `strictNullCheck`

**Default:** `false`

Controls the style of the null guard at the start of each cast.

- `false` — Uses the concise loose equality `obj != null`, which catches both `null` and `undefined` in a single check.
- `true` — Uses `obj !== null && obj !== undefined` with strict equality operators. Useful when your linting rules forbid `==`/`!=`.

**With `strictNullCheck: false` (default):**
```typescript
export function CastToUser(obj: any): IUser | null {
  return (obj != null && typeof(obj.id) === "number" && typeof(obj.name) === "string") ? obj : null;
}
```

**With `strictNullCheck: true`:**
```typescript
export function CastToUser(obj: any): IUser | null {
  return (obj !== null && obj !== undefined && typeof(obj.id) === "number" && typeof(obj.name) === "string") ? obj : null;
}
```

---

### `generateClassCasts`

**Default:** `false`

When `true`, generates a cast function for each exported class using an `instanceof` check rather than duck typing.

> If you want one generic helper instead of per-class functions, see `generateUtilityCasts`.

**Input:**
```typescript
export class UserAccount {
  constructor(public id: number, public username: string) {}
}
```

**With `generateClassCasts: false` (default):** no function generated for `UserAccount`.

**With `generateClassCasts: true`:**
```typescript
import { UserAccount } from './User';

export function CastToUserAccount(obj: any): UserAccount | null {
  return (obj != null && obj instanceof UserAccount) ? obj : null;
}
```

---

### `generateTypeCasts`

**Default:** `false`

When `true`, generates cast functions for exported **object** type aliases (i.e. `type Foo = { ... }`). The generated checks behave identically to interface casts.

**Input:**
```typescript
export type Point = { x: number; y: number };
export type Point3D = Point & { z: number };
```

**With `generateTypeCasts: false` (default):** no functions generated.

**With `generateTypeCasts: true`:**
```typescript
export function CastToPoint(obj: any): Point | null {
  return (obj != null && typeof(obj.x) === "number" && typeof(obj.y) === "number") ? obj : null;
}

export function CastToPoint3D(obj: any): Point3D | null {
  return (obj != null && CastToPoint(obj) && typeof(obj.z) === "number") ? obj : null;
}
```

---

### `generatePrimitiveTypeCasts`

**Default:** `false`

When `true`, generates cast functions for type aliases that resolve to a primitive type (`number`, `string`, `boolean`).

**Input:**
```typescript
export type ID = number;
export type Username = string;
export type IsActive = boolean;
```

**With `generatePrimitiveTypeCasts: false` (default):** no functions generated.

**With `generatePrimitiveTypeCasts: true`:**
```typescript
export function CastToID(obj: any): ID | null {
  return (typeof(obj) === "number") ? obj : null;
}

export function CastToUsername(obj: any): Username | null {
  return (typeof(obj) === "string") ? obj : null;
}

export function CastToIsActive(obj: any): IsActive | null {
  return (typeof(obj) === "boolean") ? obj : null;
}
```

---

### `generateStringLiteralTypeCasts`

**Default:** `false`

When `true`, generates cast functions for string literal union types. The check validates the input against every allowed string value using strict equality.

**Input:**
```typescript
export type Status = 'active' | 'inactive' | 'pending';
```

**With `generateStringLiteralTypeCasts: false` (default):** no function generated.

**With `generateStringLiteralTypeCasts: true`:**
```typescript
export function CastToStatus(obj: any): Status | null {
  return (obj === "active" || obj === "inactive" || obj === "pending") ? obj : null;
}
```

---

### `generateUtilityCasts` and `utilityCastsPath`

**Defaults:** `false` / `'./gencast-utils.gen.[ext]'`

When `generateUtilityCasts` is `true`, GenCast writes a single shared utility file containing generic helpers that are not tied to any specific type. The file location is set by `utilityCastsPath`; the `[ext]` placeholder is replaced with `ts` or `js` based on `outputLanguage`.

Currently included utilities:

- **`CastToClass<T>(obj, ctor)`** — generic `instanceof` check. An alternative to enabling `generateClassCasts` for every class individually.
- **`CastToArray(castFn, arr)`** — validates every element of an array using a provided cast function. Returns the typed array if all elements pass, or `null`/`undefined` if any element fails.

**Generated (`gencast-utils.gen.ts`):**
```typescript
// This is an autogenerated file, DO NOT EDIT.
export function CastToClass<T>(obj: any, ctor: new (...args: any[]) => T): T | null {
  return (obj != null && obj instanceof ctor) ? obj : null;
}

export function CastToArray<T>(castFn: (o: any) => T | null, arr: any): T[] | null {
  if (!Array.isArray(arr)) return null;
  const result: T[] = [];
  for (const item of arr) {
    const cast = castFn(item);
    if (cast === null) return null;
    result.push(cast);
  }
  return result;
}
```

**Usage:**
```typescript
import { CastToClass, CastToArray } from './gencast-utils.gen';
import { CastToUser } from './User.gen';

const account = CastToClass(someObj, UserAccount); // UserAccount | null
const users = CastToArray(CastToUser, rawArray);   // IUser[] | null
```

---

### `enableWeakMapCaching`

**Default:** `false`

When `true`, each generated cast function stores its result in a module-level `WeakMap` keyed on the input object. On subsequent calls with the same object reference, the cached boolean is returned immediately without re-running the property checks.

The `WeakMap` is lazily created on first use, so there is zero overhead for code paths that never call the function. Only applies to interface and object-type cast functions — primitive and string-literal casts are not affected.

This is most beneficial in hot code paths where the same object is validated repeatedly (e.g. inside a rendering loop or a high-frequency event handler).

**With `enableWeakMapCaching: false` (default):**
```typescript
export function CastToUser(obj: any): IUser | null {
  return (obj != null && typeof(obj.id) === "number" && typeof(obj.name) === "string") ? obj : null;
}
```

**With `enableWeakMapCaching: true`:**
```typescript
let _wmc_CastToUser: WeakMap<object, boolean> | undefined;
export function CastToUser(obj: any): IUser | null {
  if (obj != null && typeof obj === 'object') {
    if (!_wmc_CastToUser) { _wmc_CastToUser = new WeakMap(); }
    const _cached = _wmc_CastToUser.get(obj);
    if (_cached !== undefined) { return _cached ? obj : null; }
    const _result = (typeof(obj.id) === "number" && typeof(obj.name) === "string");
    _wmc_CastToUser.set(obj, _result);
    return _result ? obj : null;
  }
  return null;
}
```

---

### `includeTupleArrayMethods`

**Default:** `false`

Applies only to tuple-typed properties. When `true`, the generated check also verifies that standard `Array` prototype methods (`push`, `pop`, `reverse`, `slice`, etc.) exist on the value. These checks are technically correct but add significant noise to the output, since tuples are almost never used as generic arrays in practice.

Leave this `false` unless you have a specific reason to verify the full `Array` interface at runtime.

---

## Example

**Input (`User.ts`):**

```typescript
export interface IUser {
  id: number;
  name: string;
  email: string;
  role?: "admin" | "user";
}

export interface IAdmin extends IUser {
  permissions: string[];
}
```

**Generated (`User.gen.ts`):**

```typescript
import type { IUser, IAdmin } from './User';

export function CastToUser(obj: any): IUser | null {
  return (
    obj != null &&
    typeof(obj.id) === "number" &&
    typeof(obj.name) === "string" &&
    typeof(obj.email) === "string"
  ) ? obj : null;
}

export function CastToAdmin(obj: any): IAdmin | null {
  return (
    obj != null &&
    typeof(obj.id) === "number" &&
    typeof(obj.name) === "string" &&
    typeof(obj.email) === "string" &&
    typeof(obj.permissions) === "object"
  ) ? obj : null;
}
```

## Limitations

- Cannot validate method return types (only checks methods exist)
- Generic type parameters are checked for existence, not specific types
- Optional properties (`?`) are not validated (their presence is not required)
- Array/object contents are not deeply validated (only checks `typeof === "object"`)
- Union types with multiple object shapes (e.g. `{ success: true } | { success: false }`) are validated against the common properties only

## License

MIT

