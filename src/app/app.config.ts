import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MsalBroadcastService,
  MsalGuard,
  MsalService
} from '@azure/msal-angular';
import { IPublicClientApplication } from '@azure/msal-browser';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { apiErrorInterceptor } from './core/interceptors/api-error.interceptor';

import { routes } from './app.routes';
import { msalGuardConfigFactory, msalInstanceFactory } from './core/auth/auth.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),

    // El Bearer se agrega solo si hay sesión; navegar nunca fuerza el login.
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor, apiErrorInterceptor])),

    provideAnimationsAsync(),

    {
      provide: MSAL_INSTANCE,
      useFactory: msalInstanceFactory
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: msalGuardConfigFactory
    },

    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};
