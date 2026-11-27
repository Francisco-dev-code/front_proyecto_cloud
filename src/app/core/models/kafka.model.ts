/** Contrato Kafka EP5/EP6. Espejo del DTO `com.biblioteca.messaging.event.EventoMensajeria`. */

export type TipoEventoKafka =
  'NOTIFICACION' | 'TICKET' | 'DOCUMENTO' | 'PRESTAMO_CREADO' | 'PRESTAMO_DEVUELTO';

export interface EventoMensajeria {
  id: string;
  tipo: TipoEventoKafka;
  destinatario?: string | null;
  contenido: string;
  fechaEnvio: string;
  correlationId?: string | null;
  usuario?: string | null;
}

export interface TopicResponse {
  name: string;
  partitions: number;
  replicationFactor: number;
  configs: Record<string, string>;
}

export interface TopicRequest {
  name: string;
  partitions?: number;
  replicationFactor?: number;
  configs?: Record<string, string>;
}

export interface TopicUpdateRequest {
  partitions?: number;
  configs?: Record<string, string>;
}

export interface ConsumerGroupMember {
  memberId: string;
  clientId: string;
  host: string;
  assignedPartitions: string[];
}

export interface ConsumerGroupResponse {
  groupId: string;
  state: string;
  topics: string[];
  members: ConsumerGroupMember[];
}

export interface PublicacionResponse {
  mensaje: string;
  id: string;
  estado: string;
}

export interface PublicarEventoRequest {
  topic: string;
  evento: EventoMensajeria;
}

export interface PublicarSimpleRequest {
  topic: string;
  contenido: string;
}

export interface KafkaTopicMetric {
  name: string;
  partitions: number;
  replicationFactor: number;
  totalMessages: number;
  eventsPerMinute: number;
  failures: number;
  failuresPerMinute: number;
}

export interface KafkaConsumerMetric {
  groupId: string;
  state: string;
  members: number;
  committedOffsets: Record<string, number>;
  lagByTopic: Record<string, number>;
  totalLag: number;
}

export interface KafkaPartitionMetric {
  groupId: string;
  topic: string;
  partition: number;
  committedOffset: number;
  endOffset: number;
  lag: number;
}

export interface KafkaMetrics {
  generatedAt: string;
  pollingIntervalSeconds: number;
  topics: KafkaTopicMetric[];
  consumerGroups: KafkaConsumerMetric[];
  distribution: KafkaPartitionMetric[];
  summary: {
    eventsPerMinute: number;
    totalFailures: number;
    totalLag: number;
  };
}

export interface AuditoriaFiltros {
  desde?: string;
  hasta?: string;
  tipo?: TipoEventoKafka;
  usuario?: string;
  correlationId?: string;
}

export interface AuditoriaItem {
  id: number;
  mensajeId: string;
  eventoTipo: TipoEventoKafka;
  estado: string;
  usuario: string | null;
  correlationId: string | null;
  destinatario: string | null;
  contenido: string;
  canal: string;
  fechaCreacion: string;
  fechaProcesamiento?: string | null;
  error?: string | null;
}
