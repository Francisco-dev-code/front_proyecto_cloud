import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { KafkaAdminService } from '../../../core/services/kafka-admin.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  EventoMensajeria,
  PublicacionResponse,
  TipoEventoKafka,
  TopicResponse,
} from '../../../core/models/kafka.model';
import { mensajeError } from '../../../core/utils/http-error';

@Component({
  selector: 'app-publicar-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './publicar-panel.html',
  styleUrl: '../kafka.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicarPanelComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(KafkaAdminService);
  private readonly servicioNegocio = inject(NotificacionService);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly topics = signal<TopicResponse[]>([]);
  protected readonly enviando = signal(false);
  protected readonly ultimaPublicacionNegocio = signal<PublicacionResponse | null>(null);

  protected readonly tipos: TipoEventoKafka[] = [
    'NOTIFICACION',
    'TICKET',
    'DOCUMENTO',
    'PRESTAMO_CREADO',
    'PRESTAMO_DEVUELTO',
  ];

  protected readonly formulario = this.fb.nonNullable.group({
    topic: ['', Validators.required],
    id: [this.uuid(), Validators.required],
    tipo: ['NOTIFICACION' as TipoEventoKafka, Validators.required],
    destinatario: [''],
    contenido: ['', [Validators.required, Validators.maxLength(1000)]],
    correlationId: [this.uuid()],
  });

  protected readonly formularioSimple = this.fb.nonNullable.group({
    contenido: ['Hola desde el front', Validators.required],
  });

  protected readonly formularioNegocio = this.fb.nonNullable.group({
    destinatario: ['ana@correo.cl'],
    contenido: ['Demo auditoría', [Validators.required, Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    this.servicio
      .listarTopics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.topics.set(res),
        error: (e) =>
          this.snackBar.open(mensajeError(e, 'No se pudieron cargar los tópicos'), 'Cerrar', {
            duration: 3500,
          }),
      });
  }

  private uuid(): string {
    return (
      globalThis.crypto?.randomUUID?.() ??
      `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    );
  }

  private topic(): string {
    const topic = this.formulario.controls.topic.value;
    if (!topic) {
      this.snackBar.open('Selecciona un tópico', 'Cerrar', { duration: 2500 });
      return '';
    }
    return topic;
  }

  private avisar(mensaje: string): void {
    this.enviando.set(false);
    this.snackBar.open(mensaje, 'Cerrar', { duration: 3500 });
  }

  publicarEvento(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const topic = this.topic();
    if (!topic) return;

    const v = this.formulario.getRawValue();
    const claims = this.auth.account?.idTokenClaims as Record<string, unknown> | undefined;
    const evento: EventoMensajeria = {
      id: v.id.trim() || this.uuid(),
      tipo: v.tipo,
      destinatario: v.destinatario.trim() || null,
      contenido: v.contenido,
      fechaEnvio: new Date().toISOString(),
      correlationId: v.correlationId.trim() || this.uuid(),
      usuario: (claims?.['preferred_username'] as string) || this.auth.account?.username || null,
    };

    this.enviando.set(true);
    this.servicio
      .publicarEvento({ topic, evento })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.enviando.set(false);
          this.snackBar.open(`${res.mensaje} (id: ${res.id})`, 'Cerrar', { duration: 3500 });
          this.formulario.patchValue({ id: this.uuid(), correlationId: this.uuid() });
        },
        error: (e) => this.avisar(mensajeError(e, 'Error al publicar el evento')),
      });
  }

  publicarSimple(): void {
    const topic = this.topic();
    const contenido = this.formularioSimple.controls.contenido.value.trim();
    if (!topic || !contenido) {
      this.snackBar.open('Indica el tópico y el contenido', 'Cerrar', { duration: 2500 });
      return;
    }

    this.enviando.set(true);
    this.servicio
      .publicarSimple({ topic, contenido })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.enviando.set(false);
          this.snackBar.open(`${res.mensaje} (id: ${res.id})`, 'Cerrar', { duration: 3500 });
        },
        error: (e) => this.avisar(mensajeError(e, 'Error en la publicación rápida')),
      });
  }

  publicarInvalido(): void {
    // El backend publica siempre en biblioteca.notificaciones con contenido vacío.
    this.enviando.set(true);
    this.servicio
      .publicarInvalido()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.enviando.set(false);
          this.snackBar.open(`${res.mensaje} (id: ${res.id})`, 'Cerrar', { duration: 4000 });
        },
        error: (e) => this.avisar(mensajeError(e, 'Error al publicar el mensaje inválido')),
      });
  }

  /**
   * Productor real de negocio: `POST /api/notificaciones` en la API principal.
   * Es el único productor del panel que genera auditoría con `correlationId`.
   */
  publicarNegocio(): void {
    if (this.formularioNegocio.invalid) {
      this.formularioNegocio.markAllAsTouched();
      return;
    }

    const v = this.formularioNegocio.getRawValue();
    this.enviando.set(true);
    this.servicioNegocio
      .publicar({
        destinatario: v.destinatario.trim() || null,
        contenido: v.contenido,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.enviando.set(false);
          this.ultimaPublicacionNegocio.set(res);
          this.snackBar.open(`${res.mensaje} (id: ${res.id}, estado: ${res.estado})`, 'Cerrar', {
            duration: 4000,
          });
        },
        error: (e) => this.avisar(mensajeError(e, 'Error al publicar la notificación de negocio')),
      });
  }
}
