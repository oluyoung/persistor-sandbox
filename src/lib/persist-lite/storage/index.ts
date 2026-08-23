import type { StorageEngine } from "../types";
import { createLocalStorage } from "./local";
import { noopStorage } from "./noop";

export function createStorageEngine(): StorageEngine {
  if (typeof window === "undefined") return noopStorage; // SSR
  return createLocalStorage();
}

export { noopStorage };
export type { StorageEngine };
