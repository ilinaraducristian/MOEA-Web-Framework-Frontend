const backend = `http://reydw.go.ro:8080`;
export const environment = {
  production: true,
  backend: backend,
  backendDomain: "http://reydw.go.ro",
  queues: [
    `${backend}/queue`, // Guest queue
    `${backend}/user/queue` // User queue
  ],
  public: `${backend}/public`,
  user: `${backend}/user`,
  problem: `${backend}/problem`,
  algorithm: `${backend}/algorithm`,
  rabbitMQ: {
    brokerURL: "ws://reydw.go.ro:15674/ws",
    login: "root",
    passcode: "NKA@um0yZr0CIajNvYtseXRXWgX5NH%ngDljq4Y*TeOWvxx7#w"
  }
};

export enum UserType {
  Guest = 0,
  User = 1
}
