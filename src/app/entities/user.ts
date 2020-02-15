import { QueueItem } from "./queue-item";

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName?: string;
  problems: string[];
  algorithms: string[];
  queue: QueueItem[];
}
