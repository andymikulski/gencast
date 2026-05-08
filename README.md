# GenCast

**Runtime type casting for TypeScript interfaces using duck typing**

GenCast crawls your TypeScript project and generates `.gen.ts` files containing `CastTo*` functions that validate object shapes at runtime. Cast something to an interface and you get back the typed object on success, or `null` on failure.

```ts
const damageable = CastToDamageable(target);
damageable?.takeDamage(10);
```

## Example

Define your interfaces:

```ts
interface IDamageable {
  takeDamage(amount: number): void;
}

type GuildName = 'Red' | 'Blue' | 'Green';
interface IGuildMember {
  guild: GuildName;
}
```

Implement them on whatever you like:

```ts
class Goblin implements IDamageable, IGuildMember {
  public guild: GuildName = 'Red';
  takeDamage(amount: number) { /* ... */ }
}

class Dragon implements IDamageable {
  takeDamage(amount: number) { /* halve incoming damage */ }
}

class Chair implements IDamageable {
  takeDamage(amount: number) { /* break if hit hard */ }
}
```

Then use the generated casts at runtime:

```ts
class SuperSword {
  hitTarget(target: any) {
    // Anything implementing IDamageable takes a hit — Dragon, Goblin, Chair.
    const damageable = CastToDamageable(target);
    damageable?.takeDamage(this.attackPower);

    // Goblins take damage twice!
    if (CastToGoblin(target)) {
      damageable?.takeDamage(this.attackPower);
    }
  }
}

class ElvenBow {
  hitTarget(target: any) {
    // Only damages Red guild members.
    if (CastToGuildMember(target)?.guild === 'Red') {
      CastToDamageable(target)?.takeDamage(this.attackPower);
    }
  }
}
```

## What the generated code looks like

**Input (`Movie.ts`):**

```ts
type ActorPreferences = {
  imdbRating: number;
  willDoStunts: boolean;
  isSuperFamous?: boolean;
};

interface IActor {
  name: string;
  preferences: ActorPreferences;
}

interface IAnimalActor extends IActor {
  species: string;
}
```

**Generated (`Movie.gen.ts`):**

```ts
import type { IActor, IAnimalActor, ActorPreferences } from './Movie';

export function CastToActorPreferences(obj: any): ActorPreferences | null {
  return obj != null &&
    typeof obj.imdbRating === 'number' &&
    typeof obj.willDoStunts === 'boolean'
    // `isSuperFamous` is optional, so it is not checked.
    ? obj
    : null;
}

export function CastToActor(obj: any): IActor | null {
  return obj != null &&
    typeof obj.name === 'string' &&
    CastToActorPreferences(obj.preferences) !== null
    ? obj
    : null;
}

export function CastToAnimalActor(obj: any): IAnimalActor | null {
  return obj != null &&
    // IAnimalActor extends IActor, so reuse the parent cast.
    CastToActor(obj) !== null &&
    typeof obj.species === 'string'
    ? obj
    : null;
}
```

## Getting started

Install from GitHub:

```bash
npm install --save-dev github:andymikulski/gencast
# or
yarn add -D github:andymikulski/gencast
```

Then run:

```bash
npx gencast init    # (optional) create a gencast.config.js
npx gencast utils   # (optional) write shared helpers (CastToClass, CastToArray)
npx gencast         # generate .gen.ts files for the whole project
```

A handy `package.json` script that runs GenCast and formats the output:

```json
{
  "scripts": {
    "gencast": "gencast && prettier ./**/*.gen.{ts,js} --write"
  }
}
```

## CLI

```bash
gencast                              # generate casts for the whole project
gencast generate <file|directory>    # generate casts for one file or directory
gencast init                         # scaffold gencast.config.(c)js
gencast utils [output-file]          # write shared helpers (CastToClass, CastToArray)
gencast vscode                       # add .gen.* files to VS Code's hide/search/watch excludes
gencast --help
```

`generate` is for development — it scopes output to the files you pass in but still loads the full project from `tsconfig.json`, so cross-file inheritance still resolves.

### Shared helpers (`gencast utils`)

`gencast utils` writes a shared file (default `./gencast.gen.ts`) containing helpers that aren't tied to any specific type:

- `CastToClass<T>(obj, ctor)` — generic `instanceof` check; an alternative to `generateClassCasts`.
- `CastToArray(arr, castFn)` — runs `castFn` over every element; returns the typed array or `null`/`undefined`.

```ts
import { CastToClass, CastToArray } from './gencast.gen';
import { CastToUser } from './User.gen';
import { UserAccount } from './User';

const account = CastToClass(myObj, UserAccount); // UserAccount | null
const users = CastToArray(myArray, CastToUser);  // IUser[] | null
```

## Configuration

GenCast looks for `gencast.config.cjs` or `gencast.config.js` in your project root. See **[docs/CONFIG.md](./docs/CONFIG.md)** for the full reference.

## Limitations

GenCast cannot validate method *return types* at runtime; that would require executing the method as well as any side effects.

## License

MIT
