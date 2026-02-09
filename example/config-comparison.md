# GenCast Configuration Options

## Summary of Changes

### 1. `failureReturnValue` (default: `'null'`)
Controls what value is returned when a cast fails.

**Options:**
- `'null'` - Returns `null` on failure
- `'undefined'` - Returns `undefined` on failure

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

### 2. `strictNullCheck` (default: `false`)
Controls whether to use strict or loose equality for null/undefined checks.

**Options:**
- `false` - Uses loose equality `obj != null` (faster, more concise, checks both null and undefined)
- `true` - Uses strict equality `obj !== null && obj !== undefined` (explicit, verbose)

**Example with `strictNullCheck: false` (loose):**
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

## Configuration Example

```javascript
/** @type {import('gencast').GenCastConfig} */
module.exports = {
  tsconfigPath: './tsconfig.json',
  genFileExt: '.gen.ts',
  funcPrefix: 'CastTo',
  preferReuseCastFunctions: true,
  outputEmptyInterfaces: true,
  generateClassCasts: false,
  requireIPrefix: false,
  removeIPrefix: true,

  // New options:
  failureReturnValue: 'null',      // or 'undefined'
  strictNullCheck: false,           // or true
};
```
