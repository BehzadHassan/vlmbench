import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateRandomScore = () => Math.floor(Math.random() * 6); // 0 to 5

async function main() {
  console.log('Fetching predictions...');
  const predictions = await prisma.prediction.findMany();
  console.log(`Found ${predictions.length} predictions.`);

  if (predictions.length === 0) {
    console.log('No predictions found. Have you run the seed script?');
    return;
  }

  const prompts = ['P1', 'P2', 'P3', 'P4'];
  let count = 0;

  for (const pred of predictions) {
    for (const prompt of prompts) {
      // e.g., "val_1_A__val_1_B__qwen2-vl-2b__P1"
      const evalId = `${pred.image_a_name}__${pred.image_b_name}__${pred.model}__${prompt}`;
      
      const scores = {
        M1: generateRandomScore(),
        M2: generateRandomScore(),
        M3: generateRandomScore(),
        M4: generateRandomScore(),
        M5: generateRandomScore(),
        M6: generateRandomScore(),
        M7: generateRandomScore(),
        M8: generateRandomScore(),
        M9: generateRandomScore(),
        M10: generateRandomScore(),
      };

      await prisma.evaluation.upsert({
        where: { id: evalId },
        update: {
          evaluated: true,
          scores: scores,
          notes: "Sample random evaluation generated automatically.",
          evaluatedAt: new Date(),
          flagged: false,
        },
        create: {
          id: evalId,
          evaluated: true,
          scores: scores,
          notes: "Sample random evaluation generated automatically.",
          evaluatedAt: new Date(),
          flagged: false,
        }
      });
      count++;
    }
  }

  console.log(`Successfully generated and upserted ${count} random evaluations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
