import { IGun } from './Gun';

export interface IPistol extends IGun {
  hasManualSafety: boolean;
  gripType: string;
}
