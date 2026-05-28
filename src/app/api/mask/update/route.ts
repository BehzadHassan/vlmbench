import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, base64Image } = body;

    if (!name || !base64Image) {
      return NextResponse.json({ error: 'Missing name or base64Image parameter' }, { status: 400 });
    }

    // Extract prefix from image name (e.g. 'val_1_A' -> 'val_1')
    let baseName = name;
    if (name.endsWith('_A') || name.endsWith('_B')) {
      baseName = name.slice(0, -2);
    }

    const fileName = `${baseName}.png`;
    const updatedLabelDir = path.resolve('..', 'val', 'updated_label');

    if (!fs.existsSync(updatedLabelDir)) {
      fs.mkdirSync(updatedLabelDir, { recursive: true });
    }

    const filePath = path.join(updatedLabelDir, fileName);

    // base64Image is expected to be a data URL: "data:image/png;base64,iVBORw0KGgo..."
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    fs.writeFileSync(filePath, base64Data, 'base64');

    return NextResponse.json({ success: true, fileName });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
