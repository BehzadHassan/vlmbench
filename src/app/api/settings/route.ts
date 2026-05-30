import { NextResponse } from 'next/server';
import { isValidToken, extractToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

const DEFAULT_METRICS = [
  {
    id: 'm1_accuracy',
    name: 'Change Detection Accuracy',
    type: 'scale',
    min: 0,
    max: 5,
    defaultValue: 3,
    description: 'Measures if the model correctly identified the overall change status.',
    rangeExplainer: '5=Correct w/ confidence, 4=Correct but hedging, 3=Vague, 2=Uncertain/Partial, 1=Incorrect.'
  },
  {
    id: 'm2_type',
    name: 'Change Type Correctness',
    type: 'scale',
    min: 0,
    max: 5,
    defaultValue: 3,
    description: 'Measures if the model correctly classified the type of change.',
    rangeExplainer: '5=Exact correct, 4=Broadly correct, 3=Partially correct, 2=Wrong type but acknowledged change, 1=Completely wrong.'
  },
  {
    id: 'm3_spatial',
    name: 'Spatial Localization',
    type: 'scale',
    min: 0,
    max: 5,
    defaultValue: 3,
    description: 'Accuracy of the location description.',
    rangeExplainer: '5=Correct w/ 2 directions & landmark, 4=Correct w/ 1 direction, 3=Right area but imprecise, 2=Vague/Center only, 1=Wrong location.'
  },
  {
    id: 'm4_scale',
    name: 'Scale Estimation',
    type: 'scale',
    min: 0,
    max: 5,
    defaultValue: 3,
    description: 'Accuracy of the spatial scale estimate.',
    rangeExplainer: '5=Correct category, 4=Off by small margin, 3=Off by 1 category, 2=Off by 1 category but strong confidence, 1=Completely wrong.'
  },
  {
    id: 'm5_completeness',
    name: 'Completeness',
    type: 'scale',
    min: 0,
    max: 5,
    defaultValue: 3,
    description: 'Whether the model detected and reported all significant changes.',
    rangeExplainer: '5=All detected, 4=Most detected, 3=Half detected, 2=Only one minor detected, 1=No meaningful change detected.'
  },
  {
    id: 'm6_hallucination',
    name: 'Hallucination',
    type: 'scale',
    min: 0,
    max: 5,
    defaultValue: 0,
    description: 'Degree to which the model fabricated unverified elements.',
    rangeExplainer: '0=No hallucination, 1=Very minor, 2=Mild, 3=Moderate, 4=Severe, 5=Critical/Entirely hallucinated.'
  },
  {
    id: 'm7_unchanged',
    name: 'Unchanged Element Accuracy',
    type: 'scale',
    min: 0,
    max: 5,
    defaultValue: 3,
    description: 'Accuracy of identifying elements that remained unchanged.',
    rangeExplainer: '5=All verified, 4=Mostly correct, 3=Mixed, 2=Mostly wrong, 1=Completely wrong.'
  },
  {
    id: 'm8_grounding',
    name: 'Visual Grounding',
    type: 'scale',
    min: 0,
    max: 5,
    defaultValue: 3,
    description: 'Whether claims are grounded in specific, observable visual features.',
    rangeExplainer: '5=Every major claim supported, 4=Most grounded, 3=Half grounded, 2=Very few grounded, 1=Entirely abstract.'
  },
  {
    id: 'm9_consistency',
    name: 'Factual Consistency',
    type: 'scale',
    min: 0,
    max: 5,
    defaultValue: 3,
    description: 'Internal consistency of the response across steps/sections.',
    rangeExplainer: '5=Fully consistent, 4=One minor inconsistency, 3=Moderate contradiction, 2=Multiple contradictions, 1=Severe contradiction.'
  },
  {
    id: 'm10_utility',
    name: 'Response Utility',
    type: 'scale',
    min: 0,
    max: 5,
    defaultValue: 3,
    description: 'Holistic measure of practical usefulness for an analyst.',
    rangeExplainer: '5=Act directly with confidence, 4=Mostly useful, 3=Partially useful, 2=Mostly not useful, 1=Misleading or useless.'
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
