import { ChangeDetectionStrategy, Component, input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardAccesoRapidoComponent } from "../card-acceso-rapido/card-acceso-rapido.component";
import { AccesoRapidoItem } from "@shared/interfaces/acceso-rapido-item.interface";

@Component({
  selector: 'app-cards-accesos-rapidos',
  imports: [ CommonModule, CardAccesoRapidoComponent ],
  templateUrl: './cards-accesos-rapidos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsAccesosRapidosComponent{

  accesosRapidos = input.required<AccesoRapidoItem[]>()

}
