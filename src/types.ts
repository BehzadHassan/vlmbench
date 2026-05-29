export interface Metric {
  id: string;
  name: string;
  type: 'scale' | 'text';
  min?: number;
  max?: number;
  defaultValue: number | string;
  description?: string;
}

export interface EvaluationSettings {
  metricsByPrompt: Record<string, Metric[]>;
}

export interface RowData {
  id: string;
  index: number;
  timestamp: string;
  model: string;
  image_a_name: string;
  image_b_name: string;
  prompt: string;
  promptId: string;
  response: string;
  evaluated: boolean;
  scores: Record<string, number>;
  notes: string;
  evaluatedAt: string | null;
  flagged?: boolean;
}
