import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setup() {
  process.env.NODE_ENV = 'test';
  const testDbUrl =
    process.env.DATABASE_URL_TEST ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/document_workflow_test?schema=public';

  process.env.DATABASE_URL = testDbUrl;

  console.log(`\n🛠️  Running global test setup: deploying Prisma migrations to test database...`);
  try {
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '../../'),
      env: {
        ...process.env,
        DATABASE_URL: testDbUrl,
      },
      stdio: 'pipe',
    });
    console.log(`✅ Test database schema is in sync.`);
  } catch (err) {
    console.error(`❌ Global setup failed to run migrations:`, err.message);
    throw err;
  }
}

export async function teardown() {
  // Teardown if needed
}
