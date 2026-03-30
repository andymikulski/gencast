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

