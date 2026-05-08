// Fixture for enum-union regression: cross-file enum members must resolve to
// their literal values rather than `import("/abs/path").Enum.Member` syntax,
// which would leak an `import(...)` expression into the generated cast.

export enum AnimalA {
  Cat = 'cat',
  Dog = 'dog',
}

export enum AnimalB {
  Bird = 'bird',
  Fish = 'fish',
}

export enum Numbered {
  Zero,
  One,
  Two,
}

export type AnyAnimal = AnimalA | AnimalB;
export type AnyNumbered = Numbered;
export type Mixed = AnimalA | Numbered;

export interface HasEnumProp {
  pet: AnimalA;
  rank: Numbered;
  multi: AnimalA | AnimalB;
}
