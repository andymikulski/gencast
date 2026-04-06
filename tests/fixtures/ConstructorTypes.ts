// Fixture for testing constructor/construct signature types

// A stand-alone constructor type alias
export type ComponentConstructor = new (props: any) => object;

// An interface containing a property typed as a constructor type
export interface IComponentRegistry {
  name: string;
  ctor: ComponentConstructor;
}

// An interface containing an inline construct signature property
export interface IFactory {
  label: string;
  create: new (id: number) => object;
}

// An interface with a regular call-signature method (not a constructor)
export interface IService {
  name: string;
  getDisplayName(): string;
}
