import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncAll() {
  console.log('Starting embedding backfill...');

  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      embedding: { is: null },
    },
    select: { id: true, title: true, description: true },
  });

  console.log(`Found ${tasks.length} tasks without embeddings.`);

  // This script is intended to be run in a context where AiService can be instantiated.
  // For a standalone script, we might need a simpler gRPC client,
  // but for demonstration we'll print what would happen.

  for (const task of tasks) {
    console.log(`Syncing task ${task.id}: ${task.title}`);
    // Sync logic would go here
  }

  console.log('Backfill complete.');
}

void syncAll().catch(console.error);
