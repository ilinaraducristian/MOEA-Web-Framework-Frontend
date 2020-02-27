const backend = `http://localhost:8080`;
export const environment = {
  production: false,
  backend: backend,
  backendDomain: "localhost:8080",
  queues: [
    `${backend}/queue`, // Guest queue
    `${backend}/user/queue` // User queue
  ],
  public: `${backend}/public`,
  user: `${backend}/user`,
  problem: `${backend}/problem`,
  algorithm: `${backend}/algorithm`
};

export enum UserType {
  Guest = 0,
  User = 1
}
