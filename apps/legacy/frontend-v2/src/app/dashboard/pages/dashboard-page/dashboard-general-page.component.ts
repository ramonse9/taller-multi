import {ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DashboardGraphComponent } from '@dashboard/components/cards/dashboard-graph/dashboard-graph.component';
import { DashboardService } from '@dashboard/services/dashboard.service';

@Component({
  selector: 'app-dashboard-general-page',
  imports: [DashboardGraphComponent ],
  templateUrl: './dashboard-general-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardGeneralPageComponent {

  dashboardService = inject(DashboardService)

  totalCountRX = rxResource({
    stream: () => {
      return this.dashboardService.getAllCounts()
    }
  })

}

export default DashboardGeneralPageComponent;
