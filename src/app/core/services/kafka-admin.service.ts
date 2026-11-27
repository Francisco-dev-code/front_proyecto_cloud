import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConsumerGroupResponse,
  KafkaMetrics,
  PublicacionResponse,
  PublicarEventoRequest,
  PublicarSimpleRequest,
  TopicRequest,
  TopicResponse,
  TopicUpdateRequest,
} from '../models/kafka.model';

/**
 * Cliente del microservicio `biblioteca-admin-kafka` (contrato EP5/EP6).
 *
 *   GET/POST/DELETE /api/kafka/topics  ·  GET/PUT /api/kafka/topics/{name}
 *   GET             /api/kafka/consumer-groups[/{groupId}]
 *   POST            /api/kafka/publish-evento | /publish | /publish-invalid
 *   GET             /api/kafka/metrics
 */
@Injectable({ providedIn: 'root' })
export class KafkaAdminService {
  private readonly http = inject(HttpClient);

  private get url(): string {
    return `${environment.kafkaAdminUrl.replace(/\/+$/, '')}/api/kafka`;
  }

  listarTopics(): Observable<TopicResponse[]> {
    return this.http.get<TopicResponse[]>(`${this.url}/topics`);
  }

  obtenerTopic(nombre: string): Observable<TopicResponse> {
    return this.http.get<TopicResponse>(`${this.url}/topics/${encodeURIComponent(nombre)}`);
  }

  crearTopic(topic: TopicRequest): Observable<TopicResponse> {
    return this.http.post<TopicResponse>(`${this.url}/topics`, topic);
  }

  actualizarTopic(nombre: string, cambios: TopicUpdateRequest): Observable<TopicResponse> {
    return this.http.put<TopicResponse>(
      `${this.url}/topics/${encodeURIComponent(nombre)}`,
      cambios,
    );
  }

  eliminarTopic(nombre: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/topics/${encodeURIComponent(nombre)}`);
  }

  listarConsumerGroups(): Observable<ConsumerGroupResponse[]> {
    return this.http.get<ConsumerGroupResponse[]>(`${this.url}/consumer-groups`);
  }

  obtenerConsumerGroup(groupId: string): Observable<ConsumerGroupResponse> {
    return this.http.get<ConsumerGroupResponse>(
      `${this.url}/consumer-groups/${encodeURIComponent(groupId)}`,
    );
  }

  publicarEvento(request: PublicarEventoRequest): Observable<PublicacionResponse> {
    return this.http.post<PublicacionResponse>(`${this.url}/publish-evento`, request);
  }

  publicarSimple(request: PublicarSimpleRequest): Observable<PublicacionResponse> {
    return this.http.post<PublicacionResponse>(`${this.url}/publish`, request);
  }

  publicarInvalido(): Observable<PublicacionResponse> {
    return this.http.post<PublicacionResponse>(`${this.url}/publish-invalid`, {});
  }

  obtenerMetricas(): Observable<KafkaMetrics> {
    return this.http.get<KafkaMetrics>(`${this.url}/metrics`);
  }
}
