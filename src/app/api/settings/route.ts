import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SETTINGS_JSON_PATH = path.resolve('..', 'results', 'evaluation_settings.json');

const DEFAULT_SETTINGS = {
  metrics: [
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
  ]
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
    const body = await request.json();
    const { metrics } = body;

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json({ error: 'Invalid metrics list' }, { status: 400 });
    }

    const newSettings = { metrics };

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
