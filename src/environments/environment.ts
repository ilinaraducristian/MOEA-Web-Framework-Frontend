const backend = `http://localhost:8080`;
export const environment = {
  production: false,
  backend: backend,
  guestQueue: `${backend}/queue`,
  userQueue: `${backend}/user/queue`,
  public: `${backend}/public`,
  user: `${backend}/user`,
  problem: `${backend}/problem`,
  algorithm: `${backend}/algorithm`
};

export enum UserType {
  Guest = 0,
  User = 1
}
