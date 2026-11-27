import { msalInterceptorConfigFactory } from './auth.config';
import { environment } from '../../../environments/environment';

describe('Configuración MSAL', () => {
  it('protege las bases de la API, Kafka y Rabbit con el scope de la API', () => {
    const map = msalInterceptorConfigFactory().protectedResourceMap;

    for (const base of [
      environment.apiUrl,
      environment.kafkaAdminUrl,
      environment.rabbitAdminUrl
    ]) {
      const key = `${base.replace(/\/+$/, '')}/api/*`;
      expect(map.get(key)).toEqual([environment.entra.apiScope]);
    }
  });
});
