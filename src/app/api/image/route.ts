import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'A', 'B', or 'label'
    const name = searchParams.get('name'); // e.g., 'val_1_A' or 'val_1_B'

    if (!type || !name) {
      return NextResponse.json({ error: 'Missing type or name parameter' }, { status: 400 });
    }

    if (!['A', 'B', 'label'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Extract prefix from image name (e.g. 'val_1_A' -> 'val_1')
    let baseName = name;
    if (name.endsWith('_A')) {
      baseName = name.slice(0, -2);
    } else if (name.endsWith('_B')) {
      baseName = name.slice(0, -2);
    }

    const fileName = `${baseName}.png`;
    let filePath = path.resolve('..', 'val', type, fileName);

    if (type === 'label') {
      const updatedFilePath = path.resolve('..', 'val', 'updated_label', fileName);
      if (fs.existsSync(updatedFilePath)) {
        filePath = updatedFilePath;
      }
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Image file not found at ${filePath}` }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
