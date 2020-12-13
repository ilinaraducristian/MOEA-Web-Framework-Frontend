export const environment = {
  production: false,
  backend: 'http://localhost:8080',
  urls: [
    // Guest
    {queue: '/public/queue'},
    // User
    {queue: '/user/queue'},
  ],
  keycloak: {
    url: 'http://localhost:8180/auth',
    realm: 'MOEA-Web-Framework',
    clientId: 'moeawebframework',
  },
  AMQP_HOST: 'localhost',
  AMQP_USERNAME: 'guest',
  AMQP_PASSWORD: 'guest',
  AMQP_PORT: 5671,
  SENDER_ADDRESS: 'localhost',
};
