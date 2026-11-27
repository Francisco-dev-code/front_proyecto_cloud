import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditoriaFiltros, AuditoriaItem } from '../models/kafka.model';

/** Auditoría de eventos Kafka: la expone la API principal (puerto 8080 / Gateway). */
@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);

  private get url(): string {
    return `${environment.apiUrl.replace(/\/+$/, '')}/api/auditoria`;
  }

  listar(filtros: AuditoriaFiltros = {}): Observable<AuditoriaItem[]> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<AuditoriaItem[]>(this.url, { params });
  }
}
