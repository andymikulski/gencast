// Fixtures for Record<K, V> handling and node_modules type references.

export interface IInner {
  id: number;
}

// Simple Record with primitive value
export interface IThing {
  name: string;
  meta: Record<string, number>;
}

// Record with named-type value
export interface IRegistry {
  byId: Record<string, IInner>;
}

// Record with string-literal-union key
export interface IKeyedFlags {
  flags: Record<'a' | 'b' | 'c', boolean>;
}

// Record inside a type alias
export type Bag = {
  byKey: Record<string, string>;
};
