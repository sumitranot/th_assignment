import bcrypt from 'bcryptjs';
import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';

export const TEST_PASSWORD = 'Passw0rd!demo';

export async function resetDatabase() {
  // Truncate tables cleanly in correct foreign key order
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "documents", "users" RESTART IDENTITY CASCADE;');

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  // Seed baseline test users
  const alice = await prisma.user.create({
    data: {
      username: 'alice',
      name: 'Alice Submitter',
      role: 'submitter',
      passwordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      username: 'bob',
      name: 'Bob Submitter',
      role: 'submitter',
      passwordHash,
    },
  });

  const riley = await prisma.user.create({
    data: {
      username: 'riley',
      name: 'Riley Reviewer',
      role: 'reviewer',
      passwordHash,
    },
  });

  const rohan = await prisma.user.create({
    data: {
      username: 'rohan',
      name: 'Rohan Reviewer',
      role: 'reviewer',
      passwordHash,
    },
  });

  return { alice, bob, riley, rohan };
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
