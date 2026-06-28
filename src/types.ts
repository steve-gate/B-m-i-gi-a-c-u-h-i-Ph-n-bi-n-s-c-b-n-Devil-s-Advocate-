export interface RefinementScore {
  criticalDepth: number;     // 0 - 100
  creativeSpark: number;     // 0 - 100
  logicalConsistency: number; // 0 - 100
}

export interface ReframingAlternative {
  title: string;
  version: string;
  reason: string;
}

export interface CritiqueResult {
  originalQuery: string;
  scores: RefinementScore;
  blindSpots: string[];
  logicalFallacies: string[];
  unintendedConsequences: string[];
  reframedVersion: string;
  alternativeOptions: ReframingAlternative[];
  challengeQuestions: string[];
  verdict: string; // Brief overall summary of the flaw
  sixHats?: {
    hat: string;
    emoji: string;
    response: string;
  }[];
  score?: number; // Điểm đánh giá (1-100)
  actionPlan?: string[]; // Các bước hành động cụ thể
}

export interface DebateMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface SavedQuestion {
  id: string;
  title: string;
  originalText: string;
  improvedText: string;
  scores: RefinementScore;
  advocateType: string;
  timestamp: string;
  score?: number;
  actionPlan?: string[];
}

export interface Persona {
  id: string;
  name: string;
  title: string;
  description: string;
  emoji: string;
  systemPrompt: string;
  group?: string;
}
