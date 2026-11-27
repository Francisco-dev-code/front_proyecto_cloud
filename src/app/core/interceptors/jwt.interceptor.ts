import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

const BASES = [environment.apiUrl, environment.kafkaAdminUrl, environment.rabbitAdminUrl]
  .map((base) => base.replace(/\/+$/, ''));

/**
 * Agrega el JWT solo si ya hay sesión iniciada. Nunca redirige al login:
 * el acceso es voluntario y se hace con el botón de la barra superior.
 */
export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const esApi = BASES.some((base) => request.url.startsWith(`${base}/api/`));

  if (!esApi || !auth.isAuthenticated) {
    return next(request);
  }

  return from(auth.acquireToken()).pipe(
    switchMap((resultado) =>
      next(
        request.clone({
          setHeaders: { Authorization: `Bearer ${resultado.accessToken}` }
        })
      )
    ),
    // Token vencido o sin interacción: se envía la petición sin token (401).
    catchError(() => next(request))
  );
};
