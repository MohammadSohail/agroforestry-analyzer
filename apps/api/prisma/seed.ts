import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plots = [
    {
      name: 'Bomet Highland Block A',
      latitude: -0.7813,
      longitude: 35.3416,
      areaAcres: 12.5,
      primarySpecies: 'Grevillea robusta',
      notes: 'Agroforestry intercrop with tea; monitored for canopy thinning.',
    },
    {
      name: 'Nakuru Riparian Strip',
      latitude: -0.3031,
      longitude: 36.08,
      areaAcres: 4.2,
      primarySpecies: 'Acacia xanthophloea',
      notes: 'Riverbank stabilisation planting.',
    },
    {
      name: 'Kericho Shade Plot 7',
      latitude: -0.3677,
      longitude: 35.2831,
      areaAcres: 8.0,
      primarySpecies: 'Eucalyptus grandis',
      notes: 'Shade trees over smallholder tea.',
    },
  ];

  for (const plot of plots) {
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
