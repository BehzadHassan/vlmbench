import React from 'react';
import prisma from '@/lib/prisma';
import { ArrowLeft, BarChart3, TrendingUp, Layers, Info, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60; // Cache data for 60 seconds to drastically improve load times

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
    'M1': 'Did the model correctly identify whether a meaningful change occurred between the two images?',
    'M2': 'Did the model correctly classify the type of change (construction, demolition, vegetation, infrastructure, land use)?',
    'M3': 'Did the model correctly describe where the change occurred using directional references and landmarks?',
    'M4': 'Did the model correctly estimate the scale of change as Small (<10%), Moderate (10–40%), or Large (>40%)?',
    'M5': 'Did the model detect and report all significant changes present in the image pair?',
    'M6': 'Did the model fabricate or describe elements not visually present or verifiable in the images?',
    'M7': 'Did the model correctly identify elements that remained the same between the two images?',
    'M8': 'Did the model support its claims with specific observable visual features from the images?',
    'M9': 'Is the response internally consistent with no contradictions between sections or steps?',
    'M10': 'Would this response be useful to a real satellite imagery analyst making an operational decision?'
  };

  const metricScales = {
    'M1': '5 = Correct with confidence\n4 = Correct but hedging\n3 = Correct but vague\n2 = Uncertain when answer was clear / Partial\n1 = Incorrect with some awareness\n0 = No response / Completely wrong',
    'M2': '5 = Exact correct type\n4 = Broadly correct category\n3 = Partially correct (one of multiple)\n2 = Wrong type but change acknowledged\n1 = Completely wrong type\n0 = No type mentioned',
    'M3': '5 = Correct with 2+ directional refs & landmark\n4 = Correct with 1 directional reference\n3 = Partially correct general area\n2 = Vague / center only with no further detail\n1 = Entirely wrong location\n0 = No location described',
    'M4': '5 = Correct category\n4 = Correct category with minor boundary error\n3 = Off by one category\n2 = Wrong category stated with high confidence\n1 = Completely wrong category\n0 = No scale mentioned',
    'M5': '5 = All significant changes reported\n4 = Most detected with minor omissions\n3 = Roughly half detected\n2 = Only one of several changes detected\n1 = Only trivial change detected\n0 = No changes detected at all',
    'M6': '5 = No hallucination at all\n4 = One minor unverifiable detail\n3 = A couple of unsupported claims\n2 = One clearly fabricated element (confident)\n1 = Multiple fabricated elements affecting core\n0 = Response mostly or entirely hallucinated',
    'M7': '5 = All unchanged elements verified correct\n4 = Mostly correct with one minor error\n3 = Mixed — some correct some wrong\n2 = Mostly wrong\n1 = All described unchanged elements are changed\n0 = No unchanged elements described',
    'M8': '5 = Every major claim supported by visible feature\n4 = Most claims grounded (one or two unsupported)\n3 = About half of claims have visible evidence\n2 = Few claims grounded — rest generic\n1 = One vague reference only\n0 = No visual evidence cited anywhere',
    'M9': '5 = Fully consistent throughout\n4 = One minor inconsistency not affecting conclusion\n3 = One moderate inconsistency\n2 = One significant contradiction\n1 = Multiple major contradictions\n0 = Conclusion directly contradicts own evidence',
    'M10': '5 = Analyst could act on this directly (confident)\n4 = Mostly useful with minor gaps\n3 = Partially useful but needs heavy verification\n2 = Mostly useless — too vague or wrong\n1 = Misleading — would cause wrong decision\n0 = Harmful or completely useless'
  };

  const scaleIntro = "Researchers utilize a 0-5 Likert scale to capture the nuance of generative outputs that binary (Pass/Fail) scoring cannot. Higher is always better.";

  const prompts = ['P1', 'P2', 'P3', 'P4'];
  const promptDetails = {
    'P1': { title: 'P1: Narrative Report', desc: 'Requires a concise, objective report covering change status, type, location, scale, and unchanged elements.' },
    'P2': { title: 'P2: Step-by-Step Analysis', desc: 'Forces structured reasoning: describing Image 1, Image 2, identifying differences, and culminating in a final report.' },
    'P3': { title: 'P3: Intelligence-Grade', desc: 'Demands a highly structured, strict classification report citing specific visual evidence to support conclusions.' },
    'P4': { title: 'P4: Zero-Shot Baseline', desc: 'Provides minimal instruction, serving as a baseline to measure unguided change detection capabilities.' }
  };

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
    <div className="min-h-screen p-4 sm:p-6 lg:p-12" style={{ background: '#050a18', color: '#e2e8f0' }}>
      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-indigo-400 transition-colors mb-4" style={{ color: '#94a3b8' }}>
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Evaluation Results</h1>
            <p className="text-base sm:text-lg mt-2" style={{ color: '#94a3b8' }}>
              Comprehensive performance metrics across {overallStats.total} evaluated image pairs.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Overall Results */}
        <div className="p-5 sm:p-8 rounded-3xl relative"
          style={{ 
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-indigo-500/10 blur-[80px] sm:blur-[100px] rounded-full" />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 relative">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
            <h2 className="text-xl sm:text-2xl font-bold">Overall Combined Results</h2>
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
                      <Info className="w-4 h-4 text-indigo-400 opacity-60 hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[240px] sm:w-64 p-3 bg-slate-800 text-xs rounded-lg opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-50 text-slate-200 shadow-xl border border-slate-700">
                        <p className="font-bold text-indigo-300 mb-1">{metricNames[m as keyof typeof metricNames]}</p>
                        <p className="leading-relaxed">{metricDescriptions[m as keyof typeof metricDescriptions]}</p>
                      </div>
                    </div>
                    {/* Scale Definition Tooltip */}
                    <div className="group/scale relative cursor-help">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-60 hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-full -right-4 sm:right-0 mb-2 w-[280px] sm:w-80 p-3 bg-slate-800 text-xs rounded-lg opacity-0 group-hover/scale:opacity-100 pointer-events-none transition-opacity z-50 text-slate-200 shadow-xl border border-slate-700">
                        <p className="font-bold text-emerald-400 mb-1">0-5 Evaluation Scale</p>
                        <p className="mb-2 text-[10px] text-slate-400 leading-snug">{scaleIntro}</p>
                        <div className="space-y-1 whitespace-pre-line leading-relaxed font-mono text-[10px] bg-slate-900/50 p-2 rounded border border-slate-700/50">
                          {metricScales[m as keyof typeof metricScales]}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mb-4 h-8 leading-tight pr-4">{metricNames[m as keyof typeof metricNames]}</div>
                <div className="text-3xl font-black mb-3">{overallStats.metrics[m]}</div>
                {/* Horizontal Progress Bar */}
                <div className="w-full h-1.5 sm:h-2 bg-slate-800/80 rounded-full overflow-hidden mt-auto relative">
                  <div 
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${(overallStats.metrics[m] / 5) * 100}%`,
                      background: overallStats.metrics[m] >= 4 ? '#34d399' : overallStats.metrics[m] >= 2.5 ? '#fbbf24' : '#f87171',
                      boxShadow: `0 0 10px ${overallStats.metrics[m] >= 4 ? 'rgba(52, 211, 153, 0.5)' : overallStats.metrics[m] >= 2.5 ? 'rgba(251, 191, 36, 0.5)' : 'rgba(248, 113, 113, 0.5)'}`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results by Prompt */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-bold">Results by Prompt Strategy</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {prompts.map(p => (
              <div key={p} className="p-4 sm:p-6 rounded-2xl"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 sm:mb-8 gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-cyan-50 mb-1">{promptDetails[p as keyof typeof promptDetails].title}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">{promptDetails[p as keyof typeof promptDetails].desc}</p>
                  </div>
                  <span className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full shrink-0 self-start" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#22d3ee' }}>
                    {promptStats[p].total} evals
                  </span>
                </div>
                
                <div className="grid grid-cols-5 gap-y-4 gap-x-1 sm:gap-2">
                  {metrics.map(m => (
                    <div key={`${p}-${m}`} className="text-center group relative cursor-default">
                      <div className="text-[10px] sm:text-xs font-bold text-slate-400 mb-2 sm:mb-3">{m}</div>
                      
                      {/* Vertical Progress Bar */}
                      <div className="w-1.5 sm:w-2.5 h-10 sm:h-14 bg-slate-800/80 rounded-full mx-auto mb-2 overflow-hidden flex flex-col justify-end relative shadow-inner">
                        <div 
                          className="w-full rounded-full transition-all duration-1000 ease-out absolute bottom-0"
                          style={{ 
                            height: `${(promptStats[p].metrics[m] / 5) * 100}%`,
                            background: promptStats[p].metrics[m] >= 4 ? '#34d399' : promptStats[p].metrics[m] >= 2.5 ? '#fbbf24' : '#f87171',
                            boxShadow: `0 0 8px ${promptStats[p].metrics[m] >= 4 ? 'rgba(52, 211, 153, 0.4)' : promptStats[p].metrics[m] >= 2.5 ? 'rgba(251, 191, 36, 0.4)' : 'rgba(248, 113, 113, 0.4)'}`
                          }}
                        />
                      </div>

                      <div className="text-xs sm:text-sm font-bold text-slate-200" 
                        style={{ color: promptStats[p].metrics[m] >= 4 ? '#34d399' : promptStats[p].metrics[m] >= 2.5 ? '#fbbf24' : '#f87171' }}
                      >
                        {promptStats[p].metrics[m]}
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[120px] sm:max-w-[150px] p-1.5 sm:p-2 bg-slate-800 text-[10px] sm:text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-slate-200 shadow-xl border border-slate-700 leading-tight">
                        {metricNames[m as keyof typeof metricNames]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
