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
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KafkaAdminService } from '../../../core/services/kafka-admin.service';
import { TopicResponse } from '../../../core/models/kafka.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import { mensajeError } from '../../../core/utils/http-error';

interface EntradaConfig {
  clave: string;
  valor: string;
}

@Component({
  selector: 'app-topics-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './topics-panel.html',
  styleUrl: '../kafka.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicsPanelComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(KafkaAdminService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly columnas = [
    'name',
    'partitions',
    'replicationFactor',
    'retencion',
    'acciones',
  ];
  protected readonly datos = signal<TopicResponse[]>([]);
  protected readonly detalle = signal<TopicResponse | null>(null);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    name: [
      '',
      [Validators.required, Validators.maxLength(249), Validators.pattern(/^[A-Za-z0-9._-]+$/)],
    ],
    partitions: [3, [Validators.required, Validators.min(1)]],
    replicationFactor: [3, [Validators.required, Validators.min(1)]],
    retention: ['604800000', Validators.required],
  });

  protected readonly formularioActualizacion = this.fb.nonNullable.group({
    partitions: [3, [Validators.required, Validators.min(1)]],
    retention: ['604800000', Validators.required],
    cleanupPolicy: ['delete', Validators.required],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.servicio
      .listarTopics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.datos.set(res);
          this.cargando.set(false);
        },
        error: (e) => {
          this.cargando.set(false);
          this.snackBar.open(mensajeError(e, 'No se pudieron cargar los tópicos'), 'Cerrar', {
            duration: 3500,
          });
        },
      });
  }

  crear(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const v = this.formulario.getRawValue();
    this.guardando.set(true);
    this.servicio
      .crearTopic({
        name: v.name.trim(),
        partitions: v.partitions,
        replicationFactor: v.replicationFactor,
        configs: {
          'retention.ms': v.retention.trim(),
          'cleanup.policy': 'delete',
        },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.snackBar.open(`Tópico "${v.name}" creado`, 'Cerrar', { duration: 2500 });
          this.formulario.reset({
            name: '',
            partitions: 3,
            replicationFactor: 3,
            retention: '604800000',
          });
          this.detalle.set(null);
          this.cargar();
        },
        error: (e) => {
          this.guardando.set(false);
          this.snackBar.open(mensajeError(e, 'Error al crear el tópico'), 'Cerrar', {
            duration: 3500,
          });
        },
      });
  }

  verDetalle(topic: TopicResponse): void {
    this.servicio
      .obtenerTopic(topic.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalle) => {
          this.detalle.set(detalle);
          this.formularioActualizacion.patchValue({
            partitions: detalle.partitions,
            retention: detalle.configs['retention.ms'] ?? '604800000',
            cleanupPolicy: detalle.configs['cleanup.policy'] ?? 'delete',
          });
        },
        error: (e) =>
          this.snackBar.open(mensajeError(e, 'No se pudo cargar el detalle'), 'Cerrar', {
            duration: 3500,
          }),
      });
  }

  entradasConfigs(): EntradaConfig[] {
    const topic = this.detalle();
    return topic ? Object.entries(topic.configs).map(([clave, valor]) => ({ clave, valor })) : [];
  }

  actualizar(): void {
    const topic = this.detalle();
    if (!topic || this.formularioActualizacion.invalid) {
      this.formularioActualizacion.markAllAsTouched();
      return;
    }

    const v = this.formularioActualizacion.getRawValue();
    if (v.partitions < topic.partitions) {
      this.snackBar.open('Kafka solo permite aumentar el número de particiones', 'Cerrar', {
        duration: 3500,
      });
      return;
    }

    this.guardando.set(true);
    this.servicio
      .actualizarTopic(topic.name, {
        partitions: v.partitions,
        configs: {
          'retention.ms': v.retention.trim(),
          'cleanup.policy': v.cleanupPolicy,
        },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.snackBar.open(`Tópico "${topic.name}" actualizado`, 'Cerrar', {
            duration: 2500,
          });
          this.cargar();
          this.verDetalle(topic);
        },
        error: (e) => {
          this.guardando.set(false);
          this.snackBar.open(mensajeError(e, 'Error al actualizar el tópico'), 'Cerrar', {
            duration: 3500,
          });
        },
      });
  }

  retencion(topic: TopicResponse): string {
    return topic.configs['retention.ms'] ?? 'default';
  }

  eliminar(topic: TopicResponse): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Eliminar tópico',
        mensaje: `¿Eliminar el tópico "${topic.name}" y todos sus mensajes? Esta acción no se puede deshacer.`,
      },
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ok: boolean) => {
        if (!ok) return;
        this.servicio
          .eliminarTopic(topic.name)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Tópico eliminado', 'Cerrar', { duration: 2500 });
              if (this.detalle()?.name === topic.name) this.detalle.set(null);
              this.cargar();
            },
            error: (e) =>
              this.snackBar.open(mensajeError(e, 'Error al eliminar el tópico'), 'Cerrar', {
                duration: 3500,
              }),
          });
      });
  }
}
