import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { environment } from '../../../environments/environment';
import { TopicsPanelComponent } from './topics-panel/topics-panel';
import { ConsumerGroupsPanelComponent } from './consumer-groups-panel/consumer-groups-panel';
import { PublicarPanelComponent } from './publicar-panel/publicar-panel';
import { MetricsPanelComponent } from './metrics-panel/metrics-panel';
import { AuditoriaPanelComponent } from './auditoria-panel/auditoria-panel';

/** Streaming con Kafka: tópicos, consumer groups, productores, métricas y auditoría. */
@Component({
  selector: 'app-kafka',
  standalone: true,
  imports: [
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    TopicsPanelComponent,
    ConsumerGroupsPanelComponent,
    PublicarPanelComponent,
    MetricsPanelComponent,
    AuditoriaPanelComponent,
  ],
  templateUrl: './kafka.html',
  styleUrl: './kafka.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KafkaComponent {
  protected readonly kafkaUiUrl = environment.kafkaUiUrl;
}
