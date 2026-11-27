import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, catchError, distinctUntilChanged, switchMap, tap, timer } from 'rxjs';
import { KafkaAdminService } from '../../../core/services/kafka-admin.service';
import { KafkaMetrics } from '../../../core/models/kafka.model';
import { mensajeError } from '../../../core/utils/http-error';

/** Polling según `pollingIntervalSeconds` devuelto por el backend (5 s por defecto). */
@Component({
  selector: 'app-metrics-panel',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatIconModule],
  templateUrl: './metrics-panel.html',
  styleUrl: '../kafka.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsPanelComponent {
  private readonly servicio = inject(KafkaAdminService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly datos = signal<KafkaMetrics | null>(null);
  private readonly intervalo = signal(5000);

  protected readonly columnasTopics = [
    'name',
    'partitions',
    'replicationFactor',
    'totalMessages',
    'eventsPerMinute',
    'failures',
  ];
  protected readonly columnasGrupos = ['groupId', 'state', 'members', 'totalLag'];
  protected readonly columnasDistribucion = [
    'groupId',
    'topic',
    'partition',
    'committedOffset',
    'endOffset',
    'lag',
  ];

  constructor() {
    toObservable(this.intervalo)
      .pipe(
        distinctUntilChanged(),
        switchMap((ms) => timer(0, ms)),
        switchMap(() =>
          this.servicio.obtenerMetricas().pipe(
            tap((m) => {
              const segundos = Number(m.pollingIntervalSeconds);
              if (Number.isFinite(segundos) && segundos > 0) {
                this.intervalo.set(Math.min(300, segundos) * 1000);
              }
            }),
            catchError((e) => {
              this.snackBar.open(mensajeError(e, 'No se pudieron cargar las métricas'), 'Cerrar', {
                duration: 3500,
              });
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((m) => this.datos.set(m));
  }

  protected readonly actualizado = (): string => this.datos()?.generatedAt ?? '—';
  protected readonly intervaloSegundos = (): number => this.intervalo() / 1000;
}
