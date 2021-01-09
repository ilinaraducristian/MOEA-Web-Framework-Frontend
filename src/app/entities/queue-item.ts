import { UserType } from '../user-type.enum';

export class QueueItem {
  name = '';
  numberOfEvaluations = 0;
  numberOfSeeds = 0;
  status = 'waiting';
  rabbitId = '';
  results: string[] = [];
  algorithm = '';
  problem = '';
  referenceSet = '';
  progress = -1;
  userId: UserType = UserType.Guest;
}
