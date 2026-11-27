import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KafkaAdminService } from '../../../core/services/kafka-admin.service';
import { ConsumerGroupResponse } from '../../../core/models/kafka.model';
import { mensajeError } from '../../../core/utils/http-error';

@Component({
  selector: 'app-consumer-groups-panel',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './consumer-groups-panel.html',
  styleUrl: '../kafka.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsumerGroupsPanelComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly servicio = inject(KafkaAdminService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly columnas = ['groupId', 'state', 'topics', 'members', 'acciones'];
  protected readonly columnasMiembros = ['memberId', 'clientId', 'host', 'assignedPartitions'];
  protected readonly datos = signal<ConsumerGroupResponse[]>([]);
  protected readonly detalle = signal<ConsumerGroupResponse | null>(null);
  protected readonly cargando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.servicio
      .listarConsumerGroups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.datos.set(res);
          this.cargando.set(false);
        },
        error: (e) => {
          this.cargando.set(false);
          this.snackBar.open(
            mensajeError(e, 'No se pudieron cargar los consumer groups'),
            'Cerrar',
            { duration: 3500 },
          );
        },
      });
  }

  verDetalle(grupo: ConsumerGroupResponse): void {
    this.servicio
      .obtenerConsumerGroup(grupo.groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalle) => this.detalle.set(detalle),
        error: (e) =>
          this.snackBar.open(mensajeError(e, 'No se pudo cargar el grupo'), 'Cerrar', {
            duration: 3500,
          }),
      });
  }

  temas(grupo: ConsumerGroupResponse): string {
    return grupo.topics.join(', ');
  }

  particiones(particiones: string[]): string {
    return particiones.join(', ');
  }
}
