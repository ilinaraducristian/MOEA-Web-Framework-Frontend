const backend = `https://moea-web-framework.herokuapp.com/`;
export const environment = {
  production: true,
  backend: backend,
  backendDomain: "https://moea-web-framework.herokuapp.com/",
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
    passcode: process.env.rabbitmq_password
  }
};

export enum UserType {
  Guest = 0,
  User = 1
}
