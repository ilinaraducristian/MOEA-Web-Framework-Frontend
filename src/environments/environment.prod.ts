const backend = `http://custom-domain`;
export const environment = {
  production: true,
  backend: backend,
  backendDomain: "custom-domain",
  queues: [
    `${backend}/queue`, // Guest queue
    `${backend}/user/queue` // User queue
  ],
  public: `${backend}/public`,
  user: `${backend}/user`,
  problem: `${backend}/problem`,
  algorithm: `${backend}/algorithm`,
  rabbitMQ: {
    brokerURL: "ws://custom-broker/ws",
    login: "root",
    passcode: "root"
  }
};

export enum UserType {
  Guest = 0,
  User = 1
}
