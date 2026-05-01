import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env";
import * as schema from "./schema";

const env = getServerEnv();
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
