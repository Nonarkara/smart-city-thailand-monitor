import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import type { Pool as PgPool } from "pg";
import { config } from "../config.js";

const { Pool } = pg;

let poolPromise: Promise<PgPool | null> | null = null;

function resolveSnapshotPath(snapshotPath: string) {
  return path.isAbsolute(snapshotPath) ? snapshotPath : path.resolve(process.cwd(), snapshotPath);
}

async function writeSnapshotFile(snapshotPath: string, payload: string) {
  const targetPath = resolveSnapshotPath(snapshotPath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  const tempPath = `${targetPath}.tmp`;
  await writeFile(tempPath, payload, "utf8");
  await rename(tempPath, targetPath);
}

async function readSnapshotFile<T>(snapshotPath: string) {
  const targetPath = resolveSnapshotPath(snapshotPath);
  const raw = await readFile(targetPath, "utf8");
  return JSON.parse(raw) as T;
}

async function ensurePool() {
  if (!config.databaseUrl) {
    return null;
  }

  if (!poolPromise) {
    poolPromise = (async () => {
      const pool = new Pool({
        connectionString: config.databaseUrl,
        max: 3
      });

      await pool.query(`
        create table if not exists dashboard_snapshots (
          snapshot_key text primary key,
          payload jsonb not null,
          updated_at timestamptz not null default now()
        )
      `);

      return pool;
    })().catch((error) => {
      console.warn("Failed to connect durable snapshot storage", error);
      poolPromise = null;
      return null;
    });
  }

  return poolPromise;
}

export async function loadDurableJsonSnapshot<T>(snapshotKey: string, snapshotPath: string): Promise<T | null> {
  const pool = await ensurePool();
  if (pool) {
    try {
      const result = await pool.query<{ payload: T }>(
        "select payload from dashboard_snapshots where snapshot_key = $1 limit 1",
        [snapshotKey]
      );
      const payload = result.rows[0]?.payload;
      if (payload) {
        return payload;
      }
    } catch (error) {
      console.warn(`Failed to read durable snapshot "${snapshotKey}" from Postgres`, error);
    }
  }

  try {
    return await readSnapshotFile<T>(snapshotPath);
  } catch {
    return null;
  }
}

export async function persistDurableJsonSnapshot(snapshotKey: string, snapshotPath: string, payload: unknown) {
  const pool = await ensurePool();
  if (pool) {
    try {
      await pool.query(
        `
          insert into dashboard_snapshots (snapshot_key, payload, updated_at)
          values ($1, $2::jsonb, now())
          on conflict (snapshot_key)
          do update set payload = excluded.payload, updated_at = now()
        `,
        [snapshotKey, JSON.stringify(payload)]
      );
      return;
    } catch (error) {
      console.warn(`Failed to persist durable snapshot "${snapshotKey}" to Postgres`, error);
    }
  }

  await writeSnapshotFile(snapshotPath, JSON.stringify(payload, null, 2));
}

export function getDurableStorageMode() {
  return config.databaseUrl ? "postgres" : "file";
}
