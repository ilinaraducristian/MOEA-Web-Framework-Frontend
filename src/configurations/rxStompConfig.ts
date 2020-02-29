import { InjectableRxStompConfig } from "@stomp/ng2-stompjs";
import { environment } from "src/environments/environment";

export const rxStompConfig: InjectableRxStompConfig = {
  brokerURL: environment.rabbitMQ.brokerURL,

  connectHeaders: {
    login: environment.rabbitMQ.login,
    passcode: environment.rabbitMQ.passcode
  },

  heartbeatIncoming: 0,
  heartbeatOutgoing: 20000,
  reconnectDelay: 3000
};
