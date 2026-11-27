// Plantilla: copia los valores reales a environment.ts.
// `apiUrl` es la URL BASE (sin /api). Los servicios agregan /api/{recurso}.
export const environment = {
  production: false,
  apiUrl: 'https://TU_API_GATEWAY_ID.execute-api.us-east-1.amazonaws.com',
  // Bases de los microservicios administradores (sin /api).
  kafkaAdminUrl: 'https://TU_API_GATEWAY_ID.execute-api.us-east-1.amazonaws.com',
  rabbitAdminUrl: 'https://TU_API_GATEWAY_ID.execute-api.us-east-1.amazonaws.com',
  entra: {
    enabled: true,
    // true si el tenant permite auto-registro (Entra External ID). Si es false, «Crear cuenta» usa el login normal.
    selfSignUp: true,
    clientId: 'TU_ANGULAR_CLIENT_ID',
    tenantId: 'TU_TENANT_ID',
    redirectUri: 'http://localhost:4200',
    apiScope: 'api://TU_API_CLIENT_ID/recurso.read'
  }
};
