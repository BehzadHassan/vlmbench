import { NextResponse } from 'next/server';
import { isValidToken, extractToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    const setting = await prisma.setting.findFirst({ where: { id: 1 } });
    if (!setting) {
      await prisma.setting.create({
        data: {
          id: 1,
          metricsByPrompt: DEFAULT_SETTINGS.metricsByPrompt,
        }
      });
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    return NextResponse.json({ metricsByPrompt: setting.metricsByPrompt });
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

    const setting = await prisma.setting.upsert({
      where: { id: 1 },
      update: { metricsByPrompt },
      create: {
        id: 1,
        metricsByPrompt
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'SETTING_UPDATED',
        details: { metricsByPrompt }
      }
    });

    return NextResponse.json({ success: true, settings: { metricsByPrompt: setting.metricsByPrompt } });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
