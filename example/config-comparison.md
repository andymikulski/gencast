# GenCast Configuration Options

## `failureReturnValue` (default: `'null'`)
Controls what value is returned when a cast fails.

**Options:**
- `'null'` — Returns `null` on failure
- `'undefined'` — Returns `undefined` on failure

**Example with `'null'`:**
```typescript
export function CastToUser(obj: any): IUser | null {
  return (obj != null && typeof(obj.id) === "number" ...) ? obj : null;
}
```

**Example with `'undefined'`:**
```typescript
export function CastToUser(obj: any): IUser | undefined {
  return (obj != null && typeof(obj.id) === "number" ...) ? obj : undefined;
}
```

---

## `strictNullCheck` (default: `false`)
Controls whether to use strict or loose equality for null/undefined checks.

**Options:**
- `false` — Uses loose equality `obj != null` (faster, more concise, checks both null and undefined)
- `true` — Uses strict equality `obj !== null && obj !== undefined` (explicit, verbose)

**Example with `strictNullCheck: false` (default, loose):**
```typescript
export function CastToUser(obj: any): IUser | null {
  return (obj != null && typeof(obj.id) === "number" ...) ? obj : null;
}
```

**Example with `strictNullCheck: true` (strict):**
```typescript
export function CastToUser(obj: any): IUser | null {
  return (obj !== null && obj !== undefined && typeof(obj.id) === "number" ...) ? obj : null;
}
```

---

## `generateTypeCasts` (default: `false`)
If `true`, generates cast functions for all exported type aliases — object types, primitive aliases, and string literal unions.
```typescript
export type Point = { x: number; y: number };
// generates: CastToPoint(obj: any): Point | null

export type ID = number;
// generates: CastToID(obj: any): ID | null  — checks typeof obj === "number"

export type Status = 'active' | 'inactive';
// generates: CastToStatus(obj: any): Status | null  — validates allowed values
```

---

## `generateClassCasts` (default: `false`)
If `true`, generates `instanceof`-based cast functions for exported classes.
```typescript
export class MyClass { ... }
// generates: CastToMyClass(obj: any): MyClass | null  — uses instanceof
```

---

## `generateUtilityCasts` / `utilityCastsPath`
When `generateUtilityCasts: true`, a utility file is created with generic helpers:
```typescript
// gencast-utils.gen.ts
export function CastToClass<T>(obj: any, ctor: new (...args: any[]) => T): T | null {
  return obj instanceof ctor ? obj : null;
}
```
`utilityCastsPath` controls where this file is written (default: `'./gencast-utils.gen.[ext]'`).

---

## `enableWeakMapCaching` (default: `false`)
If `true`, each generated cast function caches its result per object using a `WeakMap`. Useful when
the same objects are cast repeatedly in hot code paths.

---

## Performance Notes

**Loose equality (`obj != null`) is:**
- Slightly faster (one comparison instead of two)
- More concise
- Semantically equivalent for null/undefined checks
- **Recommended for most use cases**

**Strict equality (`obj !== null && obj !== undefined`) is:**
- More explicit about what's being checked
- Preferred by some linting rules or code styles
- Functionally identical to loose equality for null/undefined

---

## Full Configuration Example

```javascript
/** @type {import('gencast').GenCastConfig} */
module.exports = {
  tsconfigPath: './tsconfig.json',
  genFileName: '[filename].gen.[ext]',
  outputLanguage: 'ts',
  funcPrefix: 'CastTo',
  preferReuseCastFunctions: false,
  outputEmptyInterfaces: true,
  requireIPrefix: false,
  removeIPrefix: true,
  generateClassCasts: false,
  generateTypeCasts: false,
  failureReturnValue: 'null',
  strictNullCheck: false,
  includeTupleArrayMethods: false,
  generateUtilityCasts: false,
  utilityCastsPath: './gencast-utils.gen.[ext]',
  enableWeakMapCaching: false,
};
```
