import { PrismaClient } from '@prisma/client';
import { DEMO_PLOTS } from '../src/modules/plots/demo-plots';

const prisma = new PrismaClient();

async function main() {
  for (const plot of DEMO_PLOTS) {
    const existing = await prisma.plot.findFirst({ where: { name: plot.name } });
    if (!existing) {
      await prisma.plot.create({ data: plot });
      // eslint-disable-next-line no-console
      console.log(`Seeded plot: ${plot.name}`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
