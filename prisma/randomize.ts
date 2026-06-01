import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getRandomScore() {
  const rand = Math.random();
  if (rand < 0.05) return 0;
  if (rand < 0.15) return 1;
  if (rand < 0.40) return 2;
  if (rand < 0.70) return 3;
  if (rand < 0.95) return 4;
  return 5;
}

async function main() {
  console.log('Fetching predictions...');
  const predictions = await prisma.prediction.findMany();
  
  const prompts = ['P1', 'P2', 'P3', 'P4'];
  const dbKeys = [
    'm1_accuracy',
    'm2_type',
    'm3_spatial',
    'm4_scale',
    'm5_completeness',
    'm6_hallucination',
    'm7_unchanged',
    'm8_grounding',
    'm9_consistency',
    'm10_utility'
  ];

  console.log(`Found ${predictions.length} predictions. Building transaction...`);

  const ops = [];
  
  for (const pred of predictions) {
    for (const p of prompts) {
      const imgA = pred.image_a_name.replace('.png', '').replace('.jpg', '');
      const imgB = pred.image_b_name.replace('.png', '').replace('.jpg', '');
      const evalId = `${imgA}__${imgB}__${pred.model}__${p}`;
      
      const scores: Record<string, number> = {};
      dbKeys.forEach(key => {
        scores[key] = getRandomScore();
      });

      ops.push(
        prisma.evaluation.upsert({
          where: { id: evalId },
          update: {
            evaluated: true,
            scores: scores,
            notes: 'this is randomly generated remarks real will be updated later',
            evaluatedAt: new Date()
          },
          create: {
            id: evalId,
            evaluated: true,
            scores: scores,
            notes: 'this is randomly generated remarks real will be updated later',
            evaluatedAt: new Date()
          }
        })
      );
    }
  }

  console.log(`Executing ${ops.length} upserts in parallel...`);
  
  // Execute in batches of 50 to avoid connection pool exhaustion
  for (let i = 0; i < ops.length; i += 50) {
    const batch = ops.slice(i, i + 50);
    await Promise.all(batch);
    console.log(`Finished batch ${i / 50 + 1}...`);
  }

  console.log(`Successfully generated and saved ${ops.length} random evaluations to the database!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
