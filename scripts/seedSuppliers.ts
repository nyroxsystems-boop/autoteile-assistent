import { Client } from "pg";

export interface DbClient {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }>;
}

type SupplierSeed = {
  name: string;
  country: string;
  actor_variant: string;
  actor_config?: Record<string, unknown> | null;
};

const ACTOR_ID = "making-data-meaningful/multi-shop-scraper";

const SUPPLIERS: SupplierSeed[] = [
  { name: "Autodoc DE", country: "DE", actor_variant: "AUTODOC_DE" },
  { name: "Stahlgruber", country: "DE", actor_variant: "STAHLGRUBER" },
  { name: "Mister Auto", country: "DE", actor_variant: "MISTER_AUTO" },
];

async function createDbClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new Client({ connectionString });
  await client.connect();

  const db: DbClient & { close: () => Promise<void> } = {
    query: (sql: string, params?: any[]) => client.query(sql, params),
    close: () => client.end(),
  };

  return db;
}

async function seedSuppliers(db: DbClient) {
  const sql = `
    INSERT INTO suppliers (
      name, country, apify_actor_id, supports_oem_search, enabled_global,
      actor_variant, actor_config, created_at, updated_at
    )
    VALUES ($1, $2, $3, true, true, $4, $5, now(), now())
    ON CONFLICT (name, country) DO UPDATE
      SET apify_actor_id = EXCLUDED.apify_actor_id,
          supports_oem_search = EXCLUDED.supports_oem_search,
          enabled_global = EXCLUDED.enabled_global,
          actor_variant = EXCLUDED.actor_variant,
          actor_config = EXCLUDED.actor_config,
          updated_at = now()
    RETURNING id;
  `;

  for (const supplier of SUPPLIERS) {
    const params = [
      supplier.name,
      supplier.country,
      ACTOR_ID,
      supplier.actor_variant,
      supplier.actor_config ?? null,
    ];
    const { rows } = await db.query(sql, params);
    const id = rows?.[0]?.id ?? null;
    console.log(`[seedSuppliers] Upserted supplier "${supplier.name}" (id=${id ?? "unknown"})`);
  }
}

async function main() {
  const db = await createDbClient();
  try {
    await seedSuppliers(db);
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[seedSuppliers] Failed:", err);
    process.exit(1);
  });
}
