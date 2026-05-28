import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const CSV_PATH = path.resolve('..', 'results', 'batch_results_20260526_173249.csv');
const EVAL_JSON_PATH = path.resolve('..', 'results', 'batch_results_20260526_173249_evaluated.json');

export async function GET() {
  try {
    if (!fs.existsSync(CSV_PATH)) {
      return NextResponse.json({ error: `CSV file not found at ${CSV_PATH}` }, { status: 404 });
    }

    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    
    // Parse CSV
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    let evaluations: Record<string, any> = {};
    if (fs.existsSync(EVAL_JSON_PATH)) {
      const evalContent = fs.readFileSync(EVAL_JSON_PATH, 'utf-8');
      try {
        evaluations = JSON.parse(evalContent);
      } catch (e) {
        console.error('Failed to parse evaluations JSON, starting fresh', e);
      }
    }

    // Merge CSV rows with evaluations
    let data = parsed.data.map((row: any, index: number) => {
      const id = `${row.image_a_name}__${row.image_b_name}__${row.model || 'unknown'}`;
      const evalData = evaluations[id] || {};
      
      return {
        id,
        index,
        timestamp: row.timestamp || '',
        model: row.model || '',
        image_a_name: row.image_a_name || '',
        image_b_name: row.image_b_name || '',
        prompt: row.prompt || '',
        response: row.response || '',
        // Override with evaluations if present
        evaluated: !!evalData.evaluated,
        scores: evalData.scores || {},
        notes: evalData.notes || '',
        evaluatedAt: evalData.evaluatedAt || null,
        flagged: !!evalData.flagged,
      };
    });

    // Sort by image number to ensure 1-64 order
    data.sort((a: any, b: any) => {
      const numA = parseInt(a.image_a_name.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.image_a_name.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    });

    // Re-assign index so it is sequential
    data.forEach((item: any, i: number) => {
      item.index = i;
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
