import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isValidToken, extractToken } from '@/lib/auth';

const EVAL_JSON_PATH = path.resolve('..', 'results', 'batch_results_20260526_173249_evaluated.json');

export async function POST(request: Request) {
  try {
    // Verify admin token
    const token = extractToken(request);
    if (!isValidToken(token)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, scores, notes, evaluated, flagged } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing row ID' }, { status: 400 });
    }

    let evaluations: Record<string, any> = {};
    if (fs.existsSync(EVAL_JSON_PATH)) {
      const evalContent = fs.readFileSync(EVAL_JSON_PATH, 'utf-8');
      try {
        evaluations = JSON.parse(evalContent);
      } catch (e) {
        console.error('Failed to parse evaluations JSON, starting fresh', e);
      }
    }

    // Update or add the evaluation
    const existing = evaluations[id] || {};
    evaluations[id] = {
      evaluated: evaluated !== undefined ? evaluated : (existing.evaluated || false),
      scores: scores !== undefined ? scores : (existing.scores || {}),
      notes: notes !== undefined ? notes : (existing.notes || ''),
      evaluatedAt: evaluated !== undefined ? new Date().toISOString() : existing.evaluatedAt,
      flagged: flagged !== undefined ? flagged : !!existing.flagged,
    };

    // Ensure results directory exists
    const resultsDir = path.dirname(EVAL_JSON_PATH);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Write back to file
    fs.writeFileSync(EVAL_JSON_PATH, JSON.stringify(evaluations, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
