import {QueueItem} from './queue-item';

export class User {

  id = 0;
  username = '';
  email = '';
  firstName = '';
  lastName: string | null = null;
  problems: string[] = [];
  algorithms: string[] = [];
  referenceSets: string[] = [];
  queue: QueueItem[] = [];

}
