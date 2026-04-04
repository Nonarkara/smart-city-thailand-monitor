import { config } from "../config.js";
import { loadDurableJsonSnapshot, persistDurableJsonSnapshot } from "./durableStore.js";
import type { StoreSnapshot } from "./store.js";

let writeQueue = Promise.resolve();

export async function loadPersistedStoreSnapshot(): Promise<Partial<StoreSnapshot> | null> {
  return loadDurableJsonSnapshot<Partial<StoreSnapshot>>("api-state", config.stateSnapshotPath);
}

export function persistStoreSnapshot(snapshot: StoreSnapshot) {
  writeQueue = writeQueue
    .then(() => persistDurableJsonSnapshot("api-state", config.stateSnapshotPath, snapshot))
    .catch((error) => {
      console.warn("Failed to persist API state snapshot", error);
    });

  return writeQueue;
}

export function flushPersistedStoreSnapshot() {
  return writeQueue;
}
