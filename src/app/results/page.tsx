import React from 'react';
import prisma from '@/lib/prisma';
import { ArrowLeft, BarChart3, TrendingUp, Layers, Info, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0; // Ensure data is always fresh

export default async function ResultsPage() {
  // Fetch all evaluated records
  const evaluations = await prisma.evaluation.findMany({
    where: { evaluated: true },
  });

  const metrics = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10'];
  const metricNames = {
    'M1': 'Change Detection Accuracy',
    'M2': 'Change Type Correctness',
    'M3': 'Spatial Localization',
    'M4': 'Scale Estimation',
    'M5': 'Completeness',
    'M6': 'Hallucination',
    'M7': 'Unchanged Element Accuracy',
    'M8': 'Visual Grounding',
    'M9': 'Factual Consistency',
    'M10': 'Response Utility'
  };

  const metricDescriptions = {
    'M1': 'Evaluates the core capability of the model to correctly identify whether a meaningful change occurred between the two images or if the scene remained entirely unchanged.',
    'M2': 'Assesses the accuracy of categorizing the specific type of change (e.g., new construction, demolition, vegetation growth) rather than just detecting a generic difference.',
    'M3': 'Measures the precision of locating the change within the geographical layout of the image using standard spatial references (e.g., North/South/East/West).',
    'M4': 'Evaluates how accurately the model estimates the relative size, proportion, or affected area of the detected change compared to the whole image.',
    'M5': 'Assesses whether all significant changes in the image pair were identified without omission. High completeness means no major changes were missed.',
    'M6': 'Measures the degree to which the model fabricated changes, objects, or details that are completely absent in the actual source images.',
    'M7': 'Evaluates the model\'s ability to correctly identify and describe the baseline elements that remained exactly the same across both timestamps.',
    'M8': 'Measures how well the model\'s textual descriptions logically align with specific, observable visual evidence present in the images.',
    'M9': 'Assesses whether the model\'s final conclusions logically follow from its earlier analytical observations without internal contradictions.',
    'M10': 'Evaluates the overall usefulness, clarity, and professional quality of the generated report for practical intelligence or analytical purposes.'
  };

  const scaleDescription = "Researchers utilize a 0-5 Likert scale for this metric because binary (Pass/Fail) scoring cannot capture the nuance of generative outputs. This range balances fine-grained discriminability with annotator consistency.\n\n0: Absolute Failure (Completely wrong or hallucinated)\n1: Poor (Major errors making it unusable)\n2: Fair (Partially correct but missing critical details)\n3: Good (Generally accurate with minor imprecisions)\n4: Very Good (Highly accurate with negligible flaws)\n5: Excellent (Expert-level human analysis)";

  const prompts = ['P1', 'P2', 'P3', 'P4'];

  const dbKeys = {
    'M1': 'm1_accuracy',
    'M2': 'm2_type',
    'M3': 'm3_spatial',
    'M4': 'm4_scale',
    'M5': 'm5_completeness',
    'M6': 'm6_hallucination',
    'M7': 'm7_unchanged',
    'M8': 'm8_grounding',
    'M9': 'm9_consistency',
    'M10': 'm10_utility'
  };

  // Initialize data structures
  const promptStats: Record<string, { total: number; metrics: Record<string, number> }> = {};
  prompts.forEach(p => {
    promptStats[p] = { total: 0, metrics: {} };
    metrics.forEach(m => promptStats[p].metrics[m] = 0);
  });

  const overallStats = { total: 0, metrics: {} as Record<string, number> };
  metrics.forEach(m => overallStats.metrics[m] = 0);

  // Aggregate scores
  evaluations.forEach(evalRecord => {
    // Extract prompt from id (e.g., val_1_A__val_1_B__qwen2-vl-2b__P1)
    const parts = evalRecord.id.split('__');
    const prompt = parts.length >= 4 ? parts[3] : null;

    if (!prompt || !prompts.includes(prompt) || !evalRecord.scores) return;

    const scores = evalRecord.scores as Record<string, number>;
    
    // Validate scores has properties
    let validScores = false;
    
    metrics.forEach(m => {
      const dbKey = dbKeys[m as keyof typeof dbKeys];
      const score = scores[dbKey];
      if (typeof score === 'number') {
        promptStats[prompt].metrics[m] += score;
        overallStats.metrics[m] += score;
        validScores = true;
      }
    });

    if (validScores) {
      promptStats[prompt].total++;
      overallStats.total++;
    }
  });

  // Calculate averages
  prompts.forEach(p => {
    const total = promptStats[p].total || 1; // prevent div by zero
    metrics.forEach(m => {
      promptStats[p].metrics[m] = promptStats[p].total > 0 ? Number((promptStats[p].metrics[m] / total).toFixed(2)) : 0;
    });
  });

  const totalEvaluations = overallStats.total || 1;
  metrics.forEach(m => {
    overallStats.metrics[m] = overallStats.total > 0 ? Number((overallStats.metrics[m] / totalEvaluations).toFixed(2)) : 0;
  });

  return (
    <div className="min-h-screen p-6 lg:p-12" style={{ background: '#050a18', color: '#e2e8f0' }}>
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-indigo-400 transition-colors mb-4" style={{ color: '#94a3b8' }}>
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight">Evaluation Results</h1>
            <p className="text-lg mt-2" style={{ color: '#94a3b8' }}>
              Comprehensive performance metrics across {overallStats.total} evaluated image pairs.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Overall Results */}
        <div className="p-8 rounded-3xl relative overflow-hidden"
          style={{ 
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            <h2 className="text-2xl font-bold">Overall Combined Results</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {metrics.map(m => (
              <div key={`overall-${m}`} className="p-4 rounded-xl flex flex-col justify-between relative group"
                style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-bold text-indigo-300">{m}</div>
                  <div className="flex gap-2">
                    {/* Metric Definition Tooltip */}
                    <div className="group/info relative cursor-help">
                      <Info clas