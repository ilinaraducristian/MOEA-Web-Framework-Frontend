import {UserType} from '../user-type.enum';
import {FormGroup} from '@angular/forms';

export class QueueItem {
  name = '';
  numberOfEvaluations = 0;
  numberOfSeeds = 0;
  status = 'waiting';
  rabbitId = '';
  results: string[] = [];
  algorithmMD5 = '';
  problemMD5 = '';
  referenceSetMD5 = '';
  progress = -1;
  userId: UserType = UserType.Guest;

  constructor(private readonly form?: FormGroup) {
    if (form !== undefined) {
      this.name = form.controls.name.value;
      this.numberOfEvaluations = form.controls.numberOfEvaluations.value;
      this.numberOfSeeds = form.controls.numberOfSeeds.value;
      this.algorithmMD5 = form.controls.algorithm.value;
      this.problemMD5 = form.controls.problem.value;
    }
  }

}
