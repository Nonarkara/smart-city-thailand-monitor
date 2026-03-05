import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import type { StoreSnapshot } from "./store.js";

let writeQueue = Promise.resolve();

function resolveSnapshotPath() {
  if (!config.stateSnapshotPath) {
    return "";
  }

  return path.isAbsolute(config.stateSnapshotPath)
    ? config.stateSnapshotPath
    : path.resolve(process.cwd(), config.stateSnapshotPath);
}

async function writeSnapshotFile(payload: string) {
  const targetPath = resolveSnapshotPath();
  if (!targetPath) {
    return;
  }

  try {
    await mkdir(path.dirname(targetPath), { recursive: true });
    const tempPath = `${targetPath}.tmp`;
    await writeFile(tempPath, payload, "utf8");
    await rename(tempPath, targetPath);
  } catch (error) {
    console.warn("Failed to persist API state snapshot", error);
  }
}

export async function loadPersistedStoreSnapshot(): Promise<Partial<StoreSnapshot> | null> {
  const targetPath = resolveSnapshotPath();
  if (!targetPath) {
    return null;
  }

  try {
    const raw = await readFile(targetPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreSnapshot>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function persistStoreSnapshot(snapshot: StoreSnapshot) {
  const payload = JSON.stringify(snapshot, null, 2);
  writeQueue = writeQueue.then(() => writeSnapshotFile(payload));
  return writeQueue;
}

export function flushPersistedStoreSnapshot() {
  return writeQueue;
}
