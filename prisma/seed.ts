import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting DB seed...');
  
  // You can adjust the path if the csv is not at data/results/batch_results...
  const csvPath = path.join(process.cwd(), 'data', 'results', 'batch_results_20260528_234016.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`Seed file not found at ${csvPath}`);
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const parsed = Papa.parse<any>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  console.log(`Parsed ${parsed.data.length} rows from CSV.`);

  // Clear existing predictions
  await prisma.prediction.deleteMany({});
  console.log('Cleared existing predictions.');

  for (const row of parsed.data) {
    if (!row.image_a_name) continue;

    await prisma.prediction.create({
      data: {
        image_a_name: row.image_a_name,
        image_b_name: row.image_b_name,
        model: row.model || 'qwen2-vl-2b',
        timestamp: row.timestamp || new Date().toISOString(),
        response_P1: row.response_P1 || '',
        response_P2: row.response_P2 || '',
        response_P3: row.response_P3 || '',
        response_P4: row.response_P4 || '',
      }
    });
  }

  console.log('Successfully seeded database with predictions.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
