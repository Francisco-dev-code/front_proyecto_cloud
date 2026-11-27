import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificacionService } from './notificacion.service';
import { environment } from '../../../environments/environment';

describe('NotificacionService', () => {
  const url = `${environment.apiUrl.replace(/\/+$/, '')}/api/notificaciones`;
  let servicio: NotificacionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(NotificacionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('publica una notificación de negocio para generar auditoría', () => {
    const request = { destinatario: 'ana@correo.cl', contenido: 'Demo auditoría' };
    let estado = '';

    servicio.publicar(request).subscribe((res) => (estado = res.estado));

    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ mensaje: 'Notificación publicada en Kafka', id: 'msg-1', estado: 'PENDIENTE' });
    expect(estado).toBe('PENDIENTE');
  });
});
