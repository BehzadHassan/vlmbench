import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EVAL_JSON_PATH = path.join(process.cwd(), 'data', 'results', 'batch_results_20260528_234016_evaluated.json');
const SETTINGS_JSON_PATH = path.join(process.cwd(), 'data', 'results', 'evaluation_settings_multiprompt.json');

async function migrate() {
  console.log('Starting migration to Neon Postgres...');

  // 1. Migrate Settings
  if (fs.existsSync(SETTINGS_JSON_PATH)) {
    console.log(`Found settings at ${SETTINGS_JSON_PATH}`);
    try {
      const settingsContent = fs.readFileSync(SETTINGS_JSON_PATH, 'utf-8');
      const settings = JSON.parse(settingsContent);
      
      if (settings.metricsByPrompt) {
        await prisma.setting.upsert({
          where: { id: 1 },
          update: { metricsByPrompt: settings.metricsByPrompt },
          create: { id: 1, metricsByPrompt: settings.metricsByPrompt }
        });
        console.log('✅ Settings migrated successfully.');
      }
    } catch (e) {
      console.error('❌ Failed to migrate settings', e);
    }
  } else {
    console.log('No local settings file found.');
  }

  // 2. Migrate Evaluations
  if (fs.existsSync(EVAL_JSON_PATH)) {
    console.log(`Found evaluations at ${EVAL_JSON_PATH}`);
    try {
      const evalContent = fs.readFileSync(EVAL_JSON_PATH, 'utf-8');
      const evaluations = JSON.parse(evalContent);
      
      let count = 0;
      for (const [id, data] of Object.entries<any>(evaluations)) {
        await prisma.evaluation.upsert({
          where: { id },
          update: {
            evaluated: data.evaluated || false,
            scores: data.scores || {},
            notes: data.notes || '',
            evaluatedAt: data.evaluatedAt ? new Date(data.evaluatedAt) : null,
            flagged: data.flagged || false,
          },
          create: {
            id,
            evaluated: data.evaluated || false,
            scores: data.scores || {},
            notes: data.notes || '',
            evaluatedAt: data.evaluatedAt ? new Date(data.evaluatedAt) : null,
            flagged: data.flagged || false,
          }
        });
        count++;
      }
      console.log(`✅ Migrated ${count} evaluations successfully.`);
    } catch (e) {
      console.error('❌ Failed to migrate evaluations', e);
    }
  } else {
    console.log('No local evaluations file found.');
  }

  console.log('Migration complete!');
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
