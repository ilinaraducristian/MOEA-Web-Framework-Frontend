import {QueueItem} from './queue-item';

export class QueueItemDTO {

  public name = '';
  public numberOfEvaluations = 0;
  public numberOfSeeds = 0;
  public algorithmMD5 = '';
  public problemMD5 = '';
  public referenceSetMD5 = '';

  constructor(private readonly queueItem: QueueItem) {
    this.name = queueItem.name;
    this.numberOfEvaluations = queueItem.numberOfEvaluations;
    this.numberOfSeeds = queueItem.numberOfSeeds;
    this.algorithmMD5 = queueItem.algorithm;
    this.problemMD5 = queueItem.problem;
    this.referenceSetMD5 = queueItem.referenceSet;
  }
}
