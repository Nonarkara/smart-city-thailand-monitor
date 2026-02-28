import "./loadEnv.js";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";
const adminToken = process.env.ADMIN_TOKEN ?? "";

async function run() {
  if (!adminToken) {
    console.error("ADMIN_TOKEN is required for the sync worker.");
    process.exit(1);
  }

  const response = await fetch(`${apiBaseUrl}/api/admin/sources/sync`, {
    method: "POST",
    headers: {
      "x-admin-token": adminToken
    }
  });

  if (!response.ok) {
    console.error(`Sync failed with status ${response.status}`);
    process.exit(1);
  }

  const payload = await response.json();
  console.log(JSON.stringify(payload, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
