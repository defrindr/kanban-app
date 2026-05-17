import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('demo123456', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@kanbanpro.com' },
    update: {},
    create: { email: 'demo@kanbanpro.com', name: 'Demo User', avatar: 'DU', password },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@kanbanpro.com' },
    update: {},
    create: { email: 'alice@kanbanpro.com', name: 'Alice Rose', avatar: 'AR', password },
  });

  const mike = await prisma.user.upsert({
    where: { email: 'mike@kanbanpro.com' },
    update: {},
    create: { email: 'mike@kanbanpro.com', name: 'Mike Kim', avatar: 'MK', password },
  });

  const existingBoard = await prisma.board.findFirst({ where: { ownerId: user.id } });
  if (existingBoard) {
    console.log('Seed data already exists, skipping');
    return;
  }

  const board = await prisma.board.create({
    data: {
      name: 'Product Roadmap',
      description: 'Main product development board',
      ownerId: user.id,
      members: {
        create: [
          { userId: user.id, role: 'ADMIN' },
          { userId: alice.id, role: 'MEMBER' },
          { userId: mike.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const backlog = await prisma.list.create({ data: { boardId: board.id, title: 'Backlog', position: 1 } });
  const todo = await prisma.list.create({ data: { boardId: board.id, title: 'To Do', position: 2 } });
  const inProgress = await prisma.list.create({ data: { boardId: board.id, title: 'In Progress', position: 3 } });
  const review = await prisma.list.create({ data: { boardId: board.id, title: 'Review', position: 4 } });
  const done = await prisma.list.create({ data: { boardId: board.id, title: 'Done', position: 5 } });

  const card1 = await prisma.card.create({
    data: { listId: backlog.id, title: 'Implement OAuth2 integration', description: 'Add support for Google and GitHub OAuth2 login', position: 1 },
  });
  await prisma.cardLabel.create({ data: { cardId: card1.id, name: 'Backend', color: '#F97316' } });

  const card2 = await prisma.card.create({
    data: { listId: backlog.id, title: 'Database schema optimization', description: 'Optimize indexes and query performance', position: 2 },
  });
  await prisma.cardLabel.create({ data: { cardId: card2.id, name: 'DevOps', color: '#8B5CF6' } });

  const card3 = await prisma.card.create({
    data: { listId: todo.id, title: 'Design system color palette', description: 'Create consistent color tokens for the design system', position: 1 },
  });
  await prisma.cardLabel.create({ data: { cardId: card3.id, name: 'Design', color: '#8B5CF6' } });
  await prisma.cardAssignee.create({ data: { cardId: card3.id, userId: alice.id } });
  await prisma.comment.create({
    data: { cardId: card3.id, userId: user.id, content: 'Looking forward to seeing the palette!' },
  });

  const card4 = await prisma.card.create({
    data: { listId: inProgress.id, title: 'Implement authentication flow', description: 'Complete auth including login, register, and session management', position: 1 },
  });
  await prisma.cardLabel.create({ data: { cardId: card4.id, name: 'Frontend', color: '#3B82F6' } });
  await prisma.cardAssignee.create({ data: { cardId: card4.id, userId: user.id } });

  const card5 = await prisma.card.create({
    data: { listId: inProgress.id, title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', position: 2 },
  });
  await prisma.cardLabel.create({ data: { cardId: card5.id, name: 'DevOps', color: '#8B5CF6' } });
  await prisma.cardAssignee.create({ data: { cardId: card5.id, userId: mike.id } });

  const card6 = await prisma.card.create({
    data: { listId: review.id, title: 'Mobile responsive fixes', description: 'Fix layout issues on mobile devices', position: 1, labels: ['Frontend', 'Bug'] },
  });
  await prisma.cardLabel.create({ data: { cardId: card6.id, name: 'Frontend', color: '#3B82F6' } });
  await prisma.cardLabel.create({ data: { cardId: card6.id, name: 'Bug', color: '#EF4444' } });
  await prisma.cardAssignee.create({ data: { cardId: card6.id, userId: user.id } });

  const card7 = await prisma.card.create({
    data: { listId: done.id, title: 'Project setup and dependencies', description: 'Initialize project with TypeScript and Tailwind', position: 1 },
  });
  await prisma.cardAssignee.create({ data: { cardId: card7.id, userId: user.id } });

  await prisma.activity.create({
    data: { boardId: board.id, userId: user.id, action: 'CREATE', entityType: 'BOARD', entityId: board.id },
  });

  console.log(`Seeded board "${board.name}" with ${user.email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect());
