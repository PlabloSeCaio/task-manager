import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!, {
  ssl: { rejectUnauthorized: false },
  prepare: false,
  max_lifetime: 60 * 5,
  idle_timeout: 10,
  connect_timeout: 15,
});
export const db = drizzle(client, { schema });
