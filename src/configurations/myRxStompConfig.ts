import { InjectableRxStompConfig } from "@stomp/ng2-stompjs";

export const myRxStompConfig: InjectableRxStompConfig = {
  brokerURL: "ws://localhost:15674/ws",

  connectHeaders: {
    login: "root",
    passcode: "root"
  },

  heartbeatIncoming: 0,
  heartbeatOutgoing: 20000,
  reconnectDelay: 3000

  // debug: (msg: string): void => {
  //   console.log(new Date(), msg);
  // }
};
