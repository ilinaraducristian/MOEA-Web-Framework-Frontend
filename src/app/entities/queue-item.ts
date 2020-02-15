import { QualityIndicators } from "./quality-indicators";

export interface QueueItem {
  name: string;
  problem: string;
  algorithm: string;
  numberOfEvaluations: number;
  numberOfSeeds: number;
  status: string;
  results: QualityIndicators[];
  progress?: number;
  rabbitId?: string;
  solverId?: string;
}
