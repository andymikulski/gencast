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
    obj !== null &&
    obj !== undefined &&
    typeof(obj.id) === "number" &&
    typeof(obj.name) === "string" &&
    typeof(obj.email) === "string"
  ) ? obj : null;
}
```

## Installation

```bash
npm install --save-dev gencast
# or
yarn add -D gencast
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

2. **Run GenCast:**

```bash
npm run gencast
# or
yarn gencast
# or
npx gencast
```

3. **Use the generated casting functions:**

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

## Configuration

Create a `gencast.config.js` file in your project root (optional):

```javascript
/** @type {import('gencast').GenCastConfig} */
module.exports = {
  // Path to your tsconfig.json (default: './tsconfig.json')
  tsconfigPath: './tsconfig.json',

  // Extension for generated files (default: '.gen.ts')
  genFileExt: '.gen.ts',

  // Prefix for generated functions (default: 'CastTo')
  funcPrefix: 'CastTo',

  // Reuse cast functions for inherited interfaces (default: false)
  // Warning: may create circular dependencies
  preferReuseCastFunctions: false,

  // Only generate for interfaces with 'I' prefix (default: false)
  requireIPrefix: false,

  // Generate functions for empty interfaces (default: true)
  outputEmptyInterfaces: true,

  // Remove 'I' prefix from interface names in function names (default: true)
  // For example, IUser generates CastToUser when true, CastToIUser when false
  removeIPrefix: true,
};
```

You can also use the API programmatically:

```typescript
import { generateCodegen } from 'gencast';

generateCodegen({
  tsconfigPath: './tsconfig.json',
  funcPrefix: 'Validate',
});
```

## Features

### Handles Complex Types

- **Inheritance**: Validates all properties from parent interfaces
- **Generics**: Generates generic casting functions
- **Nullable types**: Properly handles `| null` unions
- **String unions**: Validates string literal types like `"admin" | "user"`
- **Methods**: Checks that methods exist (but can't validate signatures)

### Smart Generation

- Only generates for **exported** interfaces
- Skips previously generated `.gen.ts` files
- Removes outdated generated files automatically
- Handles relative imports correctly

### TypeScript Native

- Uses `ts-morph` for accurate TypeScript parsing
- Respects your `tsconfig.json` settings
- Generates properly typed `.d.ts` files

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
    obj !== null &&
    obj !== undefined &&
    typeof(obj.id) === "number" &&
    typeof(obj.name) === "string" &&
    typeof(obj.email) === "string"
  ) ? obj : null;
}

export function CastToAdmin(obj: any): IAdmin | null {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof(obj.id) === "number" &&
    typeof(obj.name) === "string" &&
    typeof(obj.email) === "string" &&
    typeof(obj.permissions) === "object"
  ) ? obj : null;
}
```

## Use Cases

- **API Response Validation**: Validate data from external APIs
- **Message Queue Handlers**: Ensure messages have the correct shape
- **Storage Deserialization**: Validate data loaded from localStorage/database
- **Third-party Library Integration**: Type-check data from untyped libraries
- **Runtime Type Guards**: Generate type guards automatically

## Limitations

- Cannot validate method return types (only checks methods exist)
- Generic type parameters are checked for existence, not specific types
- Optional properties (`?`) are not validated
- Array/object contents are not deeply validated (only checks `typeof === "object"`)

## License

MIT

