import { QualityIndicators } from "./quality-indicators";

export interface RabbitResponse extends QualityIndicators {
  error: string;
  status: string;
  currentSeed: number;
}
