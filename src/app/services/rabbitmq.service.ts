import {Injectable, OnDestroy} from '@angular/core';
import {Connection, ConnectionOptions, EventContext, Receiver, ReceiverEvents, ReceiverOptions} from 'rhea-promise';
import {environment} from '../../environments/environment';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RabbitmqService implements OnDestroy {

  private readonly receiverName = 'receiver-1';
  private readonly receiverAddress = environment.AMQP_HOST;
  private readonly connectionOptions: ConnectionOptions = {
    transport: 'tls',
    host: environment.AMQP_HOST,
    hostname: environment.AMQP_HOST,
    username: environment.AMQP_USERNAME,
    password: environment.AMQP_PASSWORD,
    port: environment.AMQP_PORT,
    reconnect: true
  };
  private readonly connection: Connection;
  private readonly isConnected = new BehaviorSubject(false);

  constructor() {
    this.connection = new Connection(this.connectionOptions);
    this.connection.open().then(() => {
      this.isConnected.next(true);
    });
  }

  get connected(): Observable<boolean> {
    return this.isConnected.asObservable();
  }

  async addListener(queue: string, listener: (context: EventContext) => void): Promise<Receiver> {
    const receiverOptions: ReceiverOptions = {
      name: queue,
      source: {
        address: this.receiverAddress
      }
    };
    const receiver: Receiver = await this.connection.createReceiver(receiverOptions);
    receiver.on(ReceiverEvents.message, listener);
    return receiver;
  }

  ngOnDestroy(): void {
    if (this.connection !== null) {
      this.connection.close();
    }
  }

}
