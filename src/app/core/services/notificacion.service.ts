import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { Notificacion, PublicarNotificacionRequest } from '../models/mensajeria.model';
import { PublicacionResponse } from '../models/kafka.model';
import { environment } from '../../../environments/environment';

/** GET /api/notificaciones: resultado de las tareas asíncronas procesadas por los consumidores. */
@Injectable({ providedIn: 'root' })
export class NotificacionService extends ApiBaseService<Notificacion> {
  protected resource = 'notificaciones';

  constructor(http: HttpClient) {
    super(http, environment.apiUrl);
  }

  /**
   * Publica en `biblioteca.notificaciones` como productor de negocio (8080).
   * A diferencia de los productores de prueba de `/api/kafka/**`, genera una fila en `/api/auditoria`.
   */
  publicar(request: PublicarNotificacionRequest): Observable<PublicacionResponse> {
    return this.http.post<PublicacionResponse>(this.url, request);
  }
}
