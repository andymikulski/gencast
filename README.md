# GenCast

**Runtime type casting for TypeScript interfaces using duck typing**

GenCast automatically generates type-safe runtime casting functions for your TypeScript interfaces. It crawls your TypeScript project and creates `.gen.ts` files with `CastTo*` functions that validate object shapes at runtime using duck typing.

## Table of Contents

- [Example](#example)
- [Getting Started](#getting-started)
- [CLI Commands](#cli-commands)
- [Configuration](#configuration)
- [Configuration Reference](#configuration-reference)
  - [`tsconfigPath`](#tsconfigpath)
  - [`genFileName`](#genfilename)
  - [`outputLanguage`](#outputlanguage)
  - [`funcPrefix`](#funcprefix)
  - [`removeIPrefix`](#removeiprefix)
  - [`requireIPrefix`](#requireiprefix)
  - [`outputEmptyInterfaces`](#outputemptyinterfaces)
  - [`preferReuseCastFunctions`](#preferreusecastfunctions)
  - [`failureReturnValue`](#failurereturnvalue)
  - [`strictNullCheck`](#strictnullcheck)
  - [`generateClassCasts`](#generateclasscasts)
  - [`generateTypeCasts`](#generatetypecasts)
  - [`enableWeakMapCaching`](#enableweakmapcaching)
- [Generated Example](#generated-example)
- [Limitations](#limitations)
- [License](#license)

## Example

This demonstrates a simple weapon/damage system where Goblins and Dragons can be damaged by weapons at runtime.

When called, the weapons use casts to look for relevant interfaces and apply damage/effects accordingly. This produces a very versatile system. As we can see here, a few lines of code can create a complex set of weapons and enemies with different interactions.


```ts

// Generic interface describing an entity that can take damage.
interface IDamageable {
  takeDamage(amount: number): void;
}

// Generic faction system
type GuildName = "Red" | "Blue" | "Green";
interface IGuildMember {
  guild: GuildName;
}

// Goblins can be damaged, and they also belong to guilds.
class Goblin implements IDamageable, IGuildMember {
  public guild: GuildName;
  takeDamage(amount: number) {
    console.log(`Goblin takes ${amount} damage!`);
  }
}

// Dragons can be damaged, but they have tough scales that reduce incoming damage by half.
class Dragon implements IDamageable {
  takeDamage(amount: number) {
    const adjusted = amount / 2;
    console.log(`Dragon takes ${adjusted} damage!`);
  }
}

// Even inanimate objects can be damageable! The chair takes damage and can break if hit hard enough.
class Chair implements IDamageable {
  takeDamage(amount: number) {
    console.log(`Chair takes ${amount} damage!`);
    if (amount > 10) {
      console.log(`The chair breaks!`);
    }
  }
}

// -----

// Generic weapon interface. Note this is used by both the Sword and Bow.
interface IWeapon {
  hitTarget(target: any): void;
  attackPower: number;
}

// The sword damages anything, but does 2X damage to Goblins.
class SuperSword implements IWeapon {
  /**
    * If this weapon hits a target, the weapon then goes on to check if it should trigger corresponding
    * effects based on the type of the target. For example, if the target is damageable, it takes damage.
    * If the target is a goblin, it takes double damage.
    */
  hitTarget(target: any) {
    // Check if the target can be damaged; if it implements IDamageable, we can apply damage here.
    // In this example, Dragon and Goblin would both be hit.
    const damageable = CastToDamageable(target);
    damageable?.takeDamage(this.attackPower);

    // Goblins get double damage!
    if (CastToGoblin(target)) {
      damageable?.takeDamage(this.attackPower);
    }
  }
}

// The bow works differently from the sword; it ONLY damages RED guild members.
class ElvenBow implements IWeapon {
  hitTarget(target: any) {
    // Simply check if the target is a member of the RED guild.
    // Variables are not used here for brevity; you can often one-line the cast and API call in one go.
    if (CastToGuildMember(target)?.guild === 'Red') {
      CastToDamageable(target)?.takeDamage(this.attackPower);
    }
  }
}
```

## Getting Started

Install directly from GitHub:

```bash
npm install --save-dev github:andymikulski/gencast
# or
yarn add -D github:andymikulski/gencast
```

**(Optional) Create the utils file:**
```bash
npx gencast utils
```

**(Optional) Create a configuration file:**

```bash
npx gencast init
```

**Run GenCast:**

```bash
npx gencast
```

**(Optional) Use `script` field in package.json:**

You can add a script to your `package.json` to make it easier to run GenCast. For example, this runs GenCast and then formats the generated files with Prettier:

```json
{
  "scripts": {
    "gencast": "gencast && prettier ./**/*.gen.{ts,js} --write"
  }
}
```

## CLI Commands

```bash
# Generate casting functions (default command)
npx gencast

# Create a gencast.config.js configuration file
npx gencast init

# Write the shared utility helpers file (CastToClass, CastToArray, etc.)
npx gencast utils

# Update VS Code settings to exclude generated files
npx gencast vscode

# Show help message
npx gencast --help
```

## Configuration

Create a `gencast.config.js` file in your project root (optional):

```bash
npx gencast init
```

## Configuration

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

Technically, `{}` in TypeScript is effectively a supertype of all non-nullish values, so an empty interface can be "cast" from any object. GenCast can still generate a function for this case, but it may not be useful and could even be misleading — if you have an empty interface, you probably don't need a cast function for it.

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

---

### `preferReuseCastFunctions`

**Default:** `true`

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

**With `preferReuseCastFunctions: false`** — every property inlined:
```typescript
// Missile.gen.ts
export function CastToMissile(obj: any): IMissile | null {
  return (obj != null &&
    typeof(obj.damage) === "number" &&
    typeof(obj.explosionRadius) === "number") ? obj : null;
}
```

**With `preferReuseCastFunctions: true` (default)** — delegates to parent's cast:
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

**Default:** `true`

When `true`, generates cast functions for all exported type aliases. Three flavours are handled automatically based on the shape of the type:

| Alias kind | Example | Check generated |
|---|---|---|
| Object type | `type Point = { x: number; y: number }` | property-by-property `typeof` check |
| Primitive alias | `type ID = number` | `typeof obj === "number"` |
| String literal union | `type Status = 'active' \| 'inactive'` | equality check against each member |

**Input:**
```typescript
export type Point = { x: number; y: number };
export type Point3D = Point & { z: number };
export type ID = number;
export type Status = 'active' | 'inactive' | 'pending';
```

**With `generateTypeCasts: false`:** no functions generated.

**With `generateTypeCasts: true` (default):**
```typescript
export function CastToPoint(obj: any): Point | null {
  return (obj != null && typeof(obj.x) === "number" && typeof(obj.y) === "number") ? obj : null;
}

export function CastToPoint3D(obj: any): Point3D | null {
  return (obj != null && typeof(obj.x) === "number" && typeof(obj.y) === "number" && typeof(obj.z) === "number") ? obj : null;
}

export function CastToID(obj: any): ID | null {
  return (typeof(obj) === "number") ? obj : null;
}

export function CastToStatus(obj: any): Status | null {
  return (obj === "active" || obj === "inactive" || obj === "pending") ? obj : null;
}
```

---

### `gencast utils`

Writes a shared utility file containing generic helpers not tied to any specific type.

```bash
# Write to the default location (./gencast.gen.ts or .gen.js)
gencast utils

# Write to a custom path
gencast utils src/utils/cast-helpers.ts
```

The output language (`ts`/`js`) and null-check style are derived from your `gencast.config.js` if one exists, so you don't need to pass any other flags. The `[ext]` placeholder is supported in the path argument.

Currently generated helpers:

- **`CastToClass<T>(obj, ctor)`** — generic `instanceof` check. An alternative to per-class cast functions generated by `generateClassCasts`.
- **`CastToArray(castFn, arr)`** — validates every element of an array with a cast function. Returns the typed array if all elements pass, or `null`/`undefined` if any fails.


**Usage:**
```typescript
import { CastToClass, CastToArray } from './gencast.gen';
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

---

## Generated Example

**Input (`Movie.ts`):**

```typescript
interface IMovie {
  name: string;
  ensemble: IActor[];
  release: 'theater' | 'straight-to-dvd';
}

type ActorPreferences = {
    imdbRating: number;
    willDoStunts: boolean;
    wantsANiceTrailer: boolean;
    isSuperFamous?: boolean;
  }

interface IActor {
  name: string;
  preferences: ActorPreferences;
}

interface IAnimalActor extends IActor {
  species: string;
}

class MovieStore { /* .. */ }
```

**Generated (`Movie.gen.ts`):**

(Comments have been added here for clarity, but the actual output contains none.)

```typescript
import type { IMovie, IActor, IAnimalActor, ActorPreferences } from './main';

// Cast for the `ActorPreferences` type.
// Each field's presence and type is checked
export function CastToActorPreferences(obj: any): ActorPreferences | null {
  return obj !== null &&
    obj !== undefined &&
    typeof obj.imdbRating === 'number' &&
    typeof obj.willDoStunts === 'boolean' &&
    typeof obj.wantsANiceTrailer === 'boolean'
    // Notice the absence of `isSuperFamous` - since it's optional, we don't check for it at all.
    ? obj
    : null;
}

// Cast function for IMovie.
export function CastToMovie(obj: any): IMovie | null {
  return obj !== null &&
    obj !== undefined &&
    typeof obj.name === 'string' &&
    // `ensemble` must be an array of objects that can be cast to IActor
    // (note - an empty array will still pass this check!)
    Array.isArray(obj.ensemble) &&
    obj.ensemble.every((item: unknown) => CastToActor(item) !== null) &&
    // `release` is a string literal union, so we ensure it matches one of the allowed values.
    (obj.release === 'theater' || obj.release === 'straight-to-dvd')
    ? obj
    : null;
}

// IActor
export function CastToActor(obj: any): IActor | null {
  return obj !== null &&
    obj !== undefined &&
    typeof obj.name === 'string' &&
    // `payPerDay` is a tuple, so we ensure it's the right type, and then ensure that each of its members
    // matches the described type.
    Array.isArray(obj.payPerDay) &&
    // The first element is a primitive type
    typeof obj.payPerDay[0] === 'number' &&
    // The second element is a string literal union
    (obj.payPerDay[1] === 'dollarbucks' ||
      obj.payPerDay[1] === 'dollarydoos') &&
    // Finally, ensure the `preferences` field can be cast to the ActorPreferences type
    CastToActorPreferences(obj.preferences) !== null
    ? obj
    : null;
}

export function CastToAnimalActor(obj: any): IAnimalActor | null {
  return obj !== null &&
    obj !== undefined &&
    // `IAnimalActor` extends `IActor`, so we can reuse that check here.
    CastToActor(obj) !== null &&
    // We will still check the IAnimalActor-specific fields.
    typeof obj.species === 'string'
    ? obj
    : null;
}

// Notice there is no `CastToMovieStore` function generated.
// Instead, you would use the `CastToClass` array: CastToClass(MovieStore)
```

## Limitations

The main caveat is that GenCast *cannot* validate method return types at runtime. Doing so would require executing the method in order to cast its output, which can produce unexpected side effects or general overhead.

Currently, GenCast simply checks for the existence of a function when checking a cast, instead.

## License

MIT

