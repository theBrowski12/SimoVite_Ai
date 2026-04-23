export const environment = {
  production: true,
  apiGateway: 'http://localhost:8888',   // browser calls this — stays localhost
  wsUrl: 'http://localhost:8083/ws',     // browser calls this — stays localhost
  keycloak: {
    url: 'http://localhost:8080',        // browser calls this — stays localhost
    realm: 'Simovite',
    clientId: 'simovite-app'
  },
  mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};