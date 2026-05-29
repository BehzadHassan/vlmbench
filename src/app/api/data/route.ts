import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const CSV_PATH = path.join(process.cwd(), 'data', 'results', 'batch_results_20260528_234016.csv');
const EVAL_JSON_PATH = path.join(process.cwd(), 'data', 'results', 'batch_results_20260528_234016_evaluated.json');

const PROMPTS: Record<string, string> = {
    'P1': 'You are a remote sensing analyst examining two high-resolution\nsatellite images of the same geographic location taken at different\npoints in time.\n\nIMAGE 1 is the BEFORE image (earlier date).\nIMAGE 2 is the AFTER image (later date).\n\nThese overhead RGB images show an urban or peri-urban area. Study\nboth images carefully — pay attention to structures, roads,\nvegetation, open land, and water bodies.\n\nWrite a concise change detection report covering:\n1. WHETHER a meaningful change occurred (or if the scene is unchanged)\n2. WHAT type of change occurred (e.g. new building footprints,\n   demolition, road widening, vegetation loss, flooding,\n   land clearance)\n3. WHERE the change is located (use spatial references:\n   north/south/east/west, center, corners, relative to landmarks\n   visible in the image)\n4. HOW LARGE the changed area appears relative to the whole image\n5. WHAT remained unchanged\n\nKeep the report factual and objective. If you are uncertain about\na detail, say so explicitly rather than guessing.',
    'P2': 'You are a remote sensing analyst examining two high-resolution\nsatellite images of the same geographic location taken at different\npoints in time.\n\nIMAGE 1 is the BEFORE image. IMAGE 2 is the AFTER image.\nThese overhead RGB images show an urban or peri-urban area.\n\nFollow each step in order and write your answer for each step:\n\nSTEP 1 — DESCRIBE IMAGE 1:\nIn 2-3 sentences, describe the main features you see in the BEFORE\nimage. Cover structures, roads, vegetation, and open land. Note\nlocations using at least two of: north / south / east / west /\ncenter.\n\nSTEP 2 — DESCRIBE IMAGE 2:\nIn 2-3 sentences, describe the same features in the AFTER image\nusing the same structure as Step 1.\n\nSTEP 3 — IDENTIFY DIFFERENCES:\nCompare your two descriptions above. What is present in one image\nbut not the other? What has changed in appearance, size, or\nposition? List only what is clearly observable.\n\nSTEP 4 — FINAL REPORT:\nBased on your comparison in Step 3, write a concise report:\n- Change status: Did meaningful change occur? (Yes / No / Uncertain)\n- Change type: What changed? (e.g. new construction, demolition,\n  road widening, vegetation loss, land clearance)\n- Location: Where? Use at least two directional references\n  (north/south/east/west). Do not use "center" as the only reference.\n- Scale: Small (under 10%), Moderate (10-40%), or Large (over 40%)\n  of the image. Do not estimate a specific percentage.\n- Unchanged: What remained the same?\n\nImportant: Do not contradict observations you made in earlier steps.\nIf uncertain about any detail, say so explicitly.',
    'P3': 'You are a satellite imagery analyst producing an\nintelligence-grade change detection report.\n\nIMAGE 1 is the BEFORE image. IMAGE 2 is the AFTER image.\nThese overhead RGB images show an urban or peri-urban area.\n\nWrite a structured report covering each section below:\n\n1. CHANGE STATUS\n   Did a meaningful change occur? Answer: Yes / No / Uncertain\n\n2. CHANGE TYPE\n   Classify the change as one of:\n   - Construction (new buildings or extensions)\n   - Demolition (removed structures)\n   - Infrastructure (roads, walls, fences, utilities)\n   - Vegetation (clearance, growth, burning)\n   - Land Use (agricultural, industrial, or residential shift)\n   - No Change\n   - Other (describe briefly)\n\n3. LOCATION\n   Where is the change? Use at least two directional references\n   (north/south/east/west) and one visible landmark if available.\n   Do not use "center" as your only reference.\n\n4. SCALE\n   Estimate the affected area as:\n   Small (under 10%) / Moderate (10-40%) / Large (over 40%)\n   Do not estimate a specific percentage.\n\n5. VISUAL EVIDENCE\n   List 2-3 specific visual observations that support your\n   conclusion. Examples: new rooftops visible, disturbed soil,\n   shadow differences, road markings added, vegetation removed.\n   Only cite what you can actually see.\n\n6. UNCHANGED ELEMENTS\n   What remained the same between the two images?\n\nRemain strictly objective. Do not speculate beyond what is\nvisually observable. If uncertain about any section, say so\nexplicitly.',
    'P4': 'You are a remote sensing analyst.\n\nIMAGE 1 is the BEFORE image. IMAGE 2 is the AFTER image.\n\nDescribe what changed between the two satellite images.\nBe specific about what changed, where it changed,\nand how much of the image is affected.',
};

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

    // Merge CSV rows with evaluations and expand for each prompt
    let data: any[] = [];
    
    parsed.data.forEach((row: any) => {
      const promptKeys = ['P1', 'P2', 'P3', 'P4'];
      
      promptKeys.forEach(promptKey => {
        // ID format: val_1_A__val_1_B__qwen2-vl-2b__P1
        const id = `${row.image_a_name}__${row.image_b_name}__${row.model || 'unknown'}__${promptKey}`;
        const evalData = evaluations[id] || {};
        
        data.push({
          id,
          index: 0, // Assigned later
          timestamp: row.timestamp || '',
          model: row.model || '',
          image_a_name: row.image_a_name || '',
          image_b_name: row.image_b_name || '',
          promptId: promptKey,
          prompt: PROMPTS[promptKey] || '',
          response: row[`response_${promptKey}`] || '',
          // Override with evaluations if present
          evaluated: !!evalData.evaluated,
          scores: evalData.scores || {},
          notes: evalData.notes || '',
          evaluatedAt: evalData.evaluatedAt || null,
          flagged: !!evalData.flagged,
        });
      });
    });

    // Sort by image number to ensure 1-64 order
    data.sort((a: any, b: any) => {
      const numA = parseInt(a.image_a_name.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.image_a_name.replace(/[^0-9]/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      // If same image, sort by prompt ID
      return a.promptId.localeCompare(b.promptId);
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
