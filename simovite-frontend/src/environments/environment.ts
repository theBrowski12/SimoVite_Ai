export const environment = {
  production: false,
  apiGateway:  'http://localhost:8888',
  etaService:  'http://localhost:8085',     // direct if gateway not proxying Python
  keycloak: {
    url:      'http://localhost:8080',
    realm:    'Simovite',
    clientId: 'simovite-app'
  },
  wsUrl:       'ws://localhost:8888/ws',
  mapTileUrl:  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};