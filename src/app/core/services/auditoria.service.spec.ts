import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuditoriaService } from './auditoria.service';
import { environment } from '../../../environments/environment';

describe('AuditoriaService', () => {
  const url = `${environment.apiUrl.replace(/\/+$/, '')}/api/auditoria`;
  let servicio: AuditoriaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AuditoriaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta auditoría sin filtros', () => {
    servicio.listar().subscribe();
    http.expectOne((req) => req.url === url && req.params.keys().length === 0).flush([]);
  });

  it('envía solo los filtros con valor', () => {
    servicio
      .listar({ tipo: 'PRESTAMO_CREADO', correlationId: 'demo-corr-1', usuario: '' })
      .subscribe();

    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.get('tipo')).toBe('PRESTAMO_CREADO');
    expect(req.request.params.get('correlationId')).toBe('demo-corr-1');
    expect(req.request.params.has('usuario')).toBe(false);
    req.flush([]);
  });
});
