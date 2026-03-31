// environments/environment.prod.ts
export const environment = {
  production: false,
  apiGateway: 'http://localhost:8888',
  keycloak: {
    url:    'http://localhost:8080',
    realm:  'Simovite',
    clientId: 'simovite-app'
  },
  wsUrl: 'ws://localhost:8888/ws'
};