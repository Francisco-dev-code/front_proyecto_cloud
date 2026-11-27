import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { KafkaAdminService } from './kafka-admin.service';
import { EventoMensajeria } from '../models/kafka.model';
import { environment } from '../../../environments/environment';

describe('KafkaAdminService', () => {
  const base = `${environment.kafkaAdminUrl.replace(/\/+$/, '')}/api/kafka`;
  let servicio: KafkaAdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(KafkaAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista y detalla tópicos con el nombre codificado', () => {
    servicio.listarTopics().subscribe();
    http.expectOne(`${base}/topics`).flush([]);

    servicio.obtenerTopic('biblioteca.prestamos').subscribe();
    http.expectOne(`${base}/topics/biblioteca.prestamos`).flush({});
  });

  it('crea un tópico con particiones, réplicas y configuración', () => {
    const topic = {
      name: 'biblioteca.demo',
      partitions: 3,
      replicationFactor: 3,
      configs: { 'retention.ms': '604800000', 'cleanup.policy': 'delete' },
    };
    servicio.crearTopic(topic).subscribe();
    const req = http.expectOne(`${base}/topics`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(topic);
    req.flush({});
  });

  it('actualiza y elimina un tópico', () => {
    servicio.actualizarTopic('a b', { partitions: 6 }).subscribe();
    const update = http.expectOne(`${base}/topics/a%20b`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual({ partitions: 6 });
    update.flush({});

    servicio.eliminarTopic('a b').subscribe();
    const del = http.expectOne(`${base}/topics/a%20b`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
  });

  it('consulta consumer groups', () => {
    servicio.listarConsumerGroups().subscribe();
    http.expectOne(`${base}/consumer-groups`).flush([]);

    servicio.obtenerConsumerGroup('biblioteca-dlt').subscribe();
    http.expectOne(`${base}/consumer-groups/biblioteca-dlt`).flush({});
  });

  it('publica el DTO completo sin modificar sus campos', () => {
    const evento: EventoMensajeria = {
      id: 'msg-123',
      tipo: 'PRESTAMO_CREADO',
      destinatario: 'ana@correo.cl',
      contenido: 'Demo préstamo',
      fechaEnvio: '2026-11-27T10:15:30.123Z',
      correlationId: 'demo-corr-1',
      usuario: 'ana@correo.cl',
    };

    servicio.publicarEvento({ topic: 'biblioteca.prestamos', evento }).subscribe();
    const req = http.expectOne(`${base}/publish-evento`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ topic: 'biblioteca.prestamos', evento });
    req.flush({ mensaje: 'ok', id: 'msg-123', estado: 'PENDIENTE' });
  });

  it('publica mensaje simple e inválido', () => {
    servicio.publicarSimple({ topic: 'biblioteca.notificaciones', contenido: 'Hola' }).subscribe();
    const simple = http.expectOne(`${base}/publish`);
    expect(simple.request.body).toEqual({ topic: 'biblioteca.notificaciones', contenido: 'Hola' });
    simple.flush({});

    servicio.publicarInvalido().subscribe();
    http.expectOne(`${base}/publish-invalid`).flush({});
  });

  it('obtiene métricas de Kafka', () => {
    servicio.obtenerMetricas().subscribe();
    http.expectOne(`${base}/metrics`).flush({ pollingIntervalSeconds: 5 });
  });
});
