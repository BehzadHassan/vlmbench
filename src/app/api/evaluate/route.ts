import { NextResponse } from 'next/server';
import { isValidToken, extractToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    // Fetch existing to merge fields if only partial update is sent
    const existing = await prisma.evaluation.findUnique({ where: { id } });

    // Ensure we handle scores as an object properly for Prisma Json
    const scoresData = scores !== undefined ? scores : (existing?.scores || {});
    
    await prisma.evaluation.upsert({
      where: { id },
      update: {
        evaluated: evaluated !== undefined ? evaluated : (existing?.evaluated || false),
        scores: scoresData,
        notes: notes !== undefined ? notes : (existing?.notes || ''),
        evaluatedAt: evaluated !== undefined ? new Date() : existing?.evaluatedAt,
        flagged: flagged !== undefined ? flagged : !!existing?.flagged,
      },
      create: {
        id,
        evaluated: evaluated !== undefined ? evaluated : false,
        scores: scoresData,
        notes: notes !== undefined ? notes : '',
        evaluatedAt: evaluated !== undefined ? new Date() : null,
        flagged: flagged !== undefined ? flagged : false,
      }
    });

    // Add Audit Log
    let action = 'EVALUATION_UPDATED';
    if (flagged !== undefined && !!existing?.flagged !== flagged) {
      action = 'RECORD_FLAGGED';
    }

    await prisma.auditLog.create({
      data: {
        action,
        details: {
          id,
          scores: scores !== undefined ? scores : null,
          notes: notes !== undefined ? notes : null,
          evaluated: evaluated !== undefined ? evaluated : null,
          flagged: flagged !== undefined ? flagged : null,
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = extractToken(request);
    if (!isValidToken(token)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      await prisma.evaluation.deleteMany({});
      
      await prisma.auditLog.create({
        data: {
          action: 'EVALUATIONS_CLEARED',
          details: { cleared: true }
        }
      });
      
      return NextResponse.json({ success: true, message: 'All evaluations cleared' });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
