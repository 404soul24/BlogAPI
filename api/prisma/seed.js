import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const posts = [
  {
    title: 'Hello, world',
    content: 'First post. Only published after the author flips the switch in the admin app.',
    published: true,
  },
  {
    title: 'A draft nobody can see',
    content: 'Drafts 404 for anyone without an author token.',
    published: false,
  },
  {
    title: 'Comments need an account',
    content: 'POST /api/posts/:id/comments requires a Bearer token.',
    published: true,
  },
];

async function main() {
  const author = await prisma.user.upsert({
    where: { email: 'author@example.com' },
    update: {},
    create: {
      name: 'Author',
      email: 'author@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      isAuthor: true,
    },
  });

  const reader = await prisma.user.upsert({
    where: { email: 'reader@example.com' },
    update: {},
    create: {
      name: 'Reader',
      email: 'reader@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      isAuthor: false,
    },
  });

  for (const p of posts) {
    const existing = await prisma.post.findFirst({ where: { title: p.title } });
    if (existing) continue;
    await prisma.post.create({ data: { ...p, authorId: author.id } });
  }

  console.log('seeded: author@example.com / password123 (author)');
  console.log('seeded: reader@example.com / password123 (reader)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
