export const environment = {
  production: false,
  apiGateway:  'http://localhost:8888',
  etaService:  'http://localhost:8085',     // direct if gateway not proxying Python
  keycloak: {
    url:      'http://keycloak:8080',
    realm:    'Simovite',
    clientId: 'simovite-app'
  },
  wsUrl:       'http://localhost:8083/ws',
  mapTileUrl:  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};