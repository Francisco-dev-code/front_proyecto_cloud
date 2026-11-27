// Entorno por defecto (producción y desarrollo): backend detrás de AWS API Gateway.
// Las URLs son BASES, sin el sufijo /api (los servicios lo agregan).
// Si en la nube los administradores tienen API Manager propio, cambia kafkaAdminUrl y
// rabbitAdminUrl por sus bases; si están en el mismo Gateway, déjalas igual que apiUrl.
export const environment = {
  production: true,
  apiUrl: 'https://0merzvv7vb.execute-api.us-east-1.amazonaws.com',
  kafkaAdminUrl: 'https://0merzvv7vb.execute-api.us-east-1.amazonaws.com',
  rabbitAdminUrl: 'https://0merzvv7vb.execute-api.us-east-1.amazonaws.com',
  // Solo enlace visual a la consola local; Angular NO consume su API.
  kafkaUiUrl: 'http://localhost:8085',
  entra: {
    enabled: true,
    // true si el tenant permite auto-registro (Entra External ID). Si es false, «Crear cuenta» usa el login normal.
    selfSignUp: true,
    clientId: '22394faa-e1a7-4f07-a4df-fda6bf538d33',
    tenantId: 'a94e2d64-6e37-4765-8ceb-bfe6bc09932b',
    redirectUri: 'http://localhost:4200',
    apiScope: 'api://a328191c-fd63-40fc-8994-b9260a828929/recurso.read',
  },
};
