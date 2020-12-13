export class QueueItem {

  name = '';
  numberOfEvaluations = 0;
  numberOfSeeds = 0;
  status = '';
  rabbitId: string | null = null;
  results: string[] = [];
  algorithmMD5 = '';
  problemMD5 = '';
  referenceSetMD5 = '';
  progress: number | null = null;

}
