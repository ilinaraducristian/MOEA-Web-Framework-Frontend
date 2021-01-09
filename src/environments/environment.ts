export const environment = {
  production: false,
  backend: 'http://localhost:8080',
  urls: [
    // Guest
    { queue: '/public/queue' },
    // User
    { queue: '/user/queue' },
  ],
  keycloak: {
    url: 'http://localhost:8180/auth',
    realm: 'MOEA-Web-Framework',
    clientId: 'moeawebframework',
  },
  amqp: {
    host: 'localhost',
    username: 'guest',
    password: 'guest',
    port: 5671,
    sender_address: 'localhost',
  },
};
