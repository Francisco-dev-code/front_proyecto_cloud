import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  PublicClientApplication
} from '@azure/msal-browser';

import {
  MsalGuardConfiguration,
  MsalInterceptorConfiguration
} from '@azure/msal-angular';

import { environment } from '../../../environments/environment';

export function msalInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.entra.clientId,
      authority: `https://login.microsoftonline.com/${environment.entra.tenantId}/v2.0`,
      redirectUri: environment.entra.redirectUri,
      postLogoutRedirectUri: environment.entra.redirectUri
    },
    cache: {
      cacheLocation: BrowserCacheLocation.SessionStorage
    }
  });
}

export function msalGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [
        'openid',
        'profile',
        environment.entra.apiScope
      ]
    }
  };
}

export function msalInterceptorConfigFactory(): MsalInterceptorConfiguration {
  // Modo demo (entra.enabled = false): MSAL no debe pedir token ni redirigir al login.
  if (!environment.entra.enabled) {
    return {
      interactionType: InteractionType.Redirect,
      protectedResourceMap: new Map<string, string[]>()
    };
  }

  const protectedResourceMap = new Map<string, string[]>();

  // Los tres microservicios (API, admin Kafka y admin Rabbit) validan el mismo JWT.
  const bases = [
    environment.apiUrl,
    environment.kafkaAdminUrl,
    environment.rabbitAdminUrl
  ].map((base) => base.replace(/\/+$/, ''));

  for (const base of new Set(bases)) {
    protectedResourceMap.set(`${base}/api/*`, [environment.entra.apiScope]);
  }

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}