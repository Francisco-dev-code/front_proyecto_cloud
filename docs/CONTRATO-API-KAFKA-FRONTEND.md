# Contrato API Kafka consumido por el frontend

Fuente: contrato entregado por el equipo de backend. El navegador **no habla el protocolo Kafka**:
publica y consulta eventos a través de los microservicios Spring Boot, siempre con el JWT de Entra ID.

## Bases y autenticación

| Microservicio                            | Base local              | Rutas                                                                                                     |
| ---------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| API principal (`biblioteca-api`)         | `http://localhost:8080` | `/api/libros`, `/api/autores`, `/api/usuarios`, `/api/prestamos`, `/api/notificaciones`, `/api/auditoria` |
| Admin Kafka (`biblioteca-admin-kafka`)   | `http://localhost:8081` | `/api/kafka/**`                                                                                           |
| Admin Rabbit (`biblioteca-admin-rabbit`) | `http://localhost:8082` | `/api/rabbit/**` (sin cambios)                                                                            |

En `src/environments/` esas bases son `apiUrl`, `kafkaAdminUrl` y `rabbitAdminUrl`.
`MsalInterceptor` adjunta `Authorization: Bearer <token>` a `{base}/api/*` en las tres bases y
`authRequiredInterceptor` exige sesión antes de enviar la petición. CORS permitido: `http://localhost:4200`.

## Tópicos declarados por el backend

| Tópico                          | Particiones | Réplicas |          Retención | cleanup.policy | Consumer group              |
| ------------------------------- | ----------: | -------: | -----------------: | -------------- | --------------------------- |
| `biblioteca.notificaciones`     |           3 |        3 | 604800000 (7 días) | delete         | `biblioteca-notificaciones` |
| `biblioteca.prestamos`          |           3 |        3 | 604800000 (7 días) | delete         | `biblioteca-prestamos`      |
| `biblioteca.notificaciones.DLT` |           3 |        3 |    86400000 (24 h) | delete         | `biblioteca-dlt`            |
| `biblioteca.prestamos.DLT`      |           3 |        3 |    86400000 (24 h) | delete         | `biblioteca-dlt`            |

Clúster: 3 ZooKeeper + 3 brokers, `min.insync.replicas=2`, `acks=all`,
`auto.create.topics.enable=false`. Kafka UI en `http://localhost:8085`.

## DTO publicado por el front

```json
{
  "id": "msg-123",
  "tipo": "PRESTAMO_CREADO",
  "destinatario": "ana@correo.cl",
  "contenido": "Préstamo creado para el libro Clean Code",
  "fechaEnvio": "2026-11-27T10:15:30.123Z",
  "correlationId": "7f1a1f0e-8e2a-4f46-9c7b-1a2b3c4d5e6f",
  "usuario": "ana@correo.cl"
}
```

`tipo` ∈ `NOTIFICACION | TICKET | DOCUMENTO | PRESTAMO_CREADO | PRESTAMO_DEVUELTO`.
El front genera `id` y `correlationId` con UUID, `fechaEnvio` con ISO-8601 y toma `usuario` del
claim `preferred_username` del token. La key del mensaje es `id`. No se usa Schema Registry.

## Endpoints y vista que los consume

| Vista (ruta `/kafka`) | Endpoint                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Tópicos               | `GET/POST /api/kafka/topics`, `GET/PUT/DELETE /api/kafka/topics/{name}`                                                           |
| Consumer groups       | `GET /api/kafka/consumer-groups`, `GET /api/kafka/consumer-groups/{groupId}`                                                      |
| Publicar evento       | `POST /api/kafka/publish-evento` (DTO completo), `POST /api/kafka/publish` (rápido), `POST /api/kafka/publish-invalid` (demo DLT) |
| Métricas en vivo      | `GET /api/kafka/metrics`, polling con `pollingIntervalSeconds` de la propia respuesta (5 s por defecto)                           |
| Auditoría             | `GET /api/auditoria?desde=&hasta=&tipo=&usuario=&correlationId=`                                                                  |

Respuestas de publicación: `{ "mensaje": "...", "id": "...", "estado": "PENDIENTE" }`.
Las métricas incluyen `eventsPerMinute`, `failures`, `committedOffsets`, `lagByTopic` y
`distribution` con `committedOffset`, `endOffset` y `lag` por partición.

## Flujo de demostración desde el front

1. Levantar `docker-compose.yml`, `docker-compose.kafka.yml`, `docker-compose.kafka-ui.yml` y `docker-compose.backend.yml`.
2. Iniciar sesión con Entra ID en `http://localhost:4200` (mismo flujo OAuth 2.0/OIDC de la EV2).
3. Abrir **Streaming (Kafka) → Tópicos**: ver los 4 tópicos con 3/3 y su configuración; crear
   `biblioteca.demo` y aumentar sus particiones.
4. Abrir **Consumer groups**: ver `biblioteca-notificaciones`, `biblioteca-prestamos` y `biblioteca-dlt`
   con sus miembros y particiones asignadas.
5. Abrir **Publicar evento**: enviar un `PRESTAMO_CREADO` con `correlationId` propio y verificar en
   Kafka UI la key y los 7 campos del value.
6. Abrir **Métricas en vivo**: repetir publicaciones y comprobar que suben `eventsPerMinute`, avanzan
   los `committedOffsets` y baja el `lag`.
7. Pulsar **Simular fallo**: tras los reintentos aparece `biblioteca.notificaciones.DLT` y aumenta `failures`.
8. Abrir **Auditoría**: filtrar por `correlationId` y mostrar el registro con `canal`, `estado` y
   `fechaProcesamiento`.
9. Volver a **Mensajería (RabbitMQ)** y **Notificaciones** para evidenciar que la integración previa sigue igual.
