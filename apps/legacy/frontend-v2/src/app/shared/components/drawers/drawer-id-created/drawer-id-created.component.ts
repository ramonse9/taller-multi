import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: 'app-drawer-id-created',
  imports: [CommonModule],
  templateUrl: './drawer-id-created.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerIdCreatedComponent {

  entidad = input.required<{id: string, createdAt: string}>()
  label   = input<string>('Entidad')

}

export default DrawerIdCreatedComponent;

