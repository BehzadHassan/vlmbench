import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isValidToken, extractToken } from '@/lib/auth';

const SETTINGS_JSON_PATH = path.join(process.cwd(), 'data', 'results', 'evaluation_settings_multiprompt.json');

const DEFAULT_METRICS = [
  {
    id: 'correctness',
    name: 'Correctness',
    type: 'scale',
    min: 1,
    max: 5,
    defaultValue: 3,
    description: 'Overall accuracy of the change detection response.'
  },
  {
    id: 'completeness',
    name: 'Completeness',
    type: 'scale',
    min: 1,
    max: 10,
    defaultValue: 5,
    description: 'How well the response addressed all prompts (what, where, how large).'
  }
];

const DEFAULT_SETTINGS = {
  metricsByPrompt: {
    'P1': [...DEFAULT_METRICS],
    'P2': [...DEFAULT_METRICS],
    'P3': [...DEFAULT_METRICS],
    'P4': [...DEFAULT_METRICS]
  }
};

export async function GET() {
  try {
    if (!fs.existsSync(SETTINGS_JSON_PATH)) {
      // Create with default settings
      const dir = path.dirname(SETTINGS_JSON_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    const settingsContent = fs.readFileSync(SETTINGS_JSON_PATH, 'utf-8');
    const settings = JSON.parse(settingsContent);
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Verify admin token
    const token = extractToken(request);
    if (!isValidToken(token)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { metricsByPrompt } = body;

    if (!metricsByPrompt || typeof metricsByPrompt !== 'object') {
      return NextResponse.json({ error: 'Invalid metricsByPrompt object' }, { status: 400 });
    }

    const newSettings = { metricsByPrompt };

    const dir = path.dirname(SETTINGS_JSON_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(newSettings, null, 2), 'utf-8');

    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
