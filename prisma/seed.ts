import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the Prisma seed.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const UNIVERSITY_SLUG = "university-of-kigali";

const departments = [
  { name: "Computer Science", code: "CS" },
  { name: "Information Technology", code: "IT" },
] as const;

async function main() {
  const institution = await db.institution.upsert({
    where: { slug: UNIVERSITY_SLUG },
    update: {
      name: "University of Kigali",
      domain: "uok.ac.rw",
    },
    create: {
      name: "University of Kigali",
      slug: UNIVERSITY_SLUG,
      domain: "uok.ac.rw",
    },
    select: { id: true },
  });

  for (const department of departments) {
    await db.department.upsert({
      where: {
        institutionId_code: {
          institutionId: institution.id,
          code: department.code,
        },
      },
      update: { name: department.name },
      create: {
        institutionId: institution.id,
        ...department,
      },
    });
  }

  console.log("Seeded University of Kigali with two departments.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
