import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { AuditoriaFiltros, AuditoriaItem, TipoEventoKafka } from '../../../core/models/kafka.model';
import { mensajeError } from '../../../core/utils/http-error';

@Component({
  selector: 'app-auditoria-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './auditoria-panel.html',
  styleUrl: '../kafka.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditoriaPanelComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(AuditoriaService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly columnas = [
    'fechaCreacion',
    'eventoTipo',
    'estado',
    'usuario',
    'correlationId',
    'canal',
    'contenido',
    'error',
  ];

  protected readonly tipos: TipoEventoKafka[] = [
    'NOTIFICACION',
    'TICKET',
    'DOCUMENTO',
    'PRESTAMO_CREADO',
    'PRESTAMO_DEVUELTO',
  ];

  protected readonly datos = signal<AuditoriaItem[]>([]);
  protected readonly cargando = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    desde: [''],
    hasta: [''],
    tipo: [''],
    usuario: [''],
    correlationId: [''],
  });

  ngOnInit(): void {
    this.buscar();
  }

  private fecha(valor: string): string | undefined {
    const limpio = valor.trim();
    if (!limpio) return undefined;
    return limpio.length === 16 ? `${limpio}:00` : limpio;
  }

  buscar(): void {
    const v = this.formulario.getRawValue();
    const filtros: AuditoriaFiltros = {
      desde: this.fecha(v.desde),
      hasta: this.fecha(v.hasta),
      tipo: v.tipo ? (v.tipo as TipoEventoKafka) : undefined,
      usuario: v.usuario.trim() || undefined,
      correlationId: v.correlationId.trim() || undefined,
    };

    this.cargando.set(true);
    this.servicio
      .listar(filtros)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.datos.set(res);
          this.cargando.set(false);
        },
        error: (e) => {
          this.cargando.set(false);
          this.snackBar.open(mensajeError(e, 'No se pudo cargar la auditoría'), 'Cerrar', {
            duration: 3500,
          });
        },
      });
  }

  limpiar(): void {
    this.formulario.reset({ desde: '', hasta: '', tipo: '', usuario: '', correlationId: '' });
    this.buscar();
  }
}
