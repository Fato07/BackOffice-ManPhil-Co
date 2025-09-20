import { defineConfig } from "prisma/config";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrations: {
    seed: `bun prisma/seed.ts`
  }
});