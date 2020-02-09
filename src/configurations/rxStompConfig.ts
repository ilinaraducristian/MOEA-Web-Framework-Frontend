import { InjectableRxStompConfig } from "@stomp/ng2-stompjs";

export const rxStompConfig: InjectableRxStompConfig = {
  brokerURL: "ws://localhost:15674/ws",

  connectHeaders: {
    login: "root",
    passcode: "root"
  },

  heartbeatIncoming: 0,
  heartbeatOutgoing: 20000,
  reconnectDelay: 3000
};
