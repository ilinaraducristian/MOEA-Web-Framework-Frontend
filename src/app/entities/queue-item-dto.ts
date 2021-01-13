import {QueueItem} from './queue-item';

export class QueueItemDTO {

  name = '';
  numberOfEvaluations = 0;
  numberOfSeeds = 0;
  algorithmMD5 = '';
  problemMD5 = '';
  referenceSetMD5 = '';

  constructor(private readonly queueItem: QueueItem) {
    // this.name = queueItem.name;
    // this.numberOfEvaluations = queueItem.numberOfEvaluations;
    // this.numberOfSeeds = queueItem.numberOfSeeds;
    // this.algorithmMD5 = queueItem.algorithm;
    // this.problemMD5 = queueItem.problem;
    // this.referenceSetMD5 = queueItem.referenceSet;
  }
}
