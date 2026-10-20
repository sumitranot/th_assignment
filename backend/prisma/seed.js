import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Passw0rd!demo';

export async function seed() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Create or update demo users (Idempotent via upsert)
  const users = [
    { username: 'alice', name: 'Alice Submitter', role: 'submitter' },
    { username: 'bob', name: 'Bob Submitter', role: 'submitter' },
    { username: 'riley', name: 'Riley Reviewer', role: 'reviewer' },
    { username: 'rohan', name: 'Rohan Reviewer', role: 'reviewer' },
  ];

  const createdUsers = {};
  for (const user of users) {
    createdUsers[user.username] = await prisma.user.upsert({
      where: { username: user.username },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
      create: {
        username: user.username,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });
    console.log(`  ✓ User: ${user.username} (${user.role})`);
  }

  // 2. Clear existing sample documents to ensure clean idempotent seed
  await prisma.document.deleteMany({
    where: {
      submitterId: {
        in: [createdUsers.alice.id, createdUsers.bob.id],
      },
    },
  });

  // 3. Create sample documents across pending, approved, and rejected states
  const now = new Date();
  const sampleDocs = [
    {
      title: 'Q3 Financial Overview & Budget Variance',
      description: 'Quarterly summary of operational expenditure, revenue targets, and burn rate.',
      textContent:
        'Executive Summary:\nRevenue for Q3 reached $1.82M, representing 14% growth quarter-over-quarter. Core operating expenses were maintained at $1.2M, yielding a positive net margin of $620K.',
      status: 'pending',
      submitterId: createdUsers.alice.id,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    },
    {
      title: 'Architecture Decision Record: Async Job Queue',
      description: 'Technical RFC for replacing inline batch jobs with BullMQ and Redis.',
      textContent:
        'Context:\nLong-running document exports currently run in the main Node process, causing occasional event-loop lag.\nDecision:\nAdopt BullMQ backed by AWS ElastiCache Redis.',
      status: 'approved',
      submitterId: createdUsers.alice.id,
      reviewerId: createdUsers.riley.id,
      reviewedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12), // 12 hours ago
      reviewComment: 'Approved. Clean architectural separation with sound disaster recovery plan.',
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    },
    {
      title: 'Vendor Security Assessment: CloudAudit Inc.',
      description: 'Third-party vendor risk assessment for external code scanning integration.',
      textContent:
        'Vendor provided SOC 2 Type II report (audit window Jan-Dec 2025). High-risk finding: lack of automated offboarding logs. Recommendation: conditional approval pending mitigation.',
      status: 'rejected',
      submitterId: createdUsers.bob.id,
      reviewerId: createdUsers.rohan.id,
      reviewedAt: new Date(now.getTime() - 1000 * 60 * 60 * 4), // 4 hours ago
      reviewComment:
        'Rejected. We cannot onboard vendors with open critical or high access control findings until audited proof of remediation is supplied.',
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
    },
    {
      title: 'Employee Onboarding & Security Handbook 2026',
      description:
        'Updated company guidelines covering device management, 2FA, and phishing reports.',
      textContent:
        'Key updates:\n1. Mandatory hardware keys for all production infrastructure access.\n2. 90-day password cycling replaced with NIST SP 800-63B passphrase guidelines.',
      status: 'pending',
      submitterId: createdUsers.bob.id,
      createdAt: new Date(now.getTime() - 1000 * 60 * 30), // 30 mins ago
    },
  ];

  for (const doc of sampleDocs) {
    await prisma.document.create({ data: doc });
    console.log(`  ✓ Document: "${doc.title}" [${doc.status}]`);
  }

  console.log('\n✅ Seed completed successfully!');
  console.log('Demo Credentials:');
  console.log('  Submitters: alice, bob (Password: Passw0rd!demo)');
  console.log('  Reviewers:  riley, rohan (Password: Passw0rd!demo)');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seed()
    .catch(error => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
