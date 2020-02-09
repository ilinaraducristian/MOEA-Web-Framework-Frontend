export interface Problem {
  id?: number;
  userDefinedName: string;
  name: string;
  algorithm: string;
  numberOfEvaluations: number;
  numberOfSeeds: number;
  status: string;
  results: any[];
  rabbitId?: string;
  solverId?: string;
}
