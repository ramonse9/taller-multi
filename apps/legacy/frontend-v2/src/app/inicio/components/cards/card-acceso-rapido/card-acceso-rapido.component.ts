import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { EnumColor } from '@shared/enums/general-estatus.enum';
import { AccesoRapidoItem } from '@shared/interfaces/acceso-rapido-item.interface';

@Component({
  selector: 'app-card-acceso-rapido',
  imports: [ NgIcon, RouterLink, CommonModule ],
  templateUrl: './card-acceso-rapido.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardAccesoRapidoComponent {

  accesoRapido = input.required<AccesoRapidoItem>();

  private classColorMap: ReadonlyMap<EnumColor, string> = new Map([
    [ EnumColor.BLUE,     'bg-blue-200 dark:bg-blue-700 text-blue-700 dark:text-blue-200' ],
    [ EnumColor.YELLOW,   'bg-yellow-200 dark:bg-yellow-700 text-yellow-700 dark:text-yellow-200' ],
    [ EnumColor.RED,      'bg-red-200 dark:bg-red-700 text-red-700 dark:text-red-200' ],
    [ EnumColor.ORANGE,   'bg-orange-200 dark:bg-orange-700 text-orange-700 dark:text-orange-200' ],
    [ EnumColor.GREEN,    'bg-green-300 dark:bg-green-800 text-green-800 dark:text-green-300' ],
    [ EnumColor.GREENSOFT,'bg-green-200 dark:bg-green-700 text-green-700 dark:text-green-200' ],
    [ EnumColor.GRAY,     'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200' ],
    [ EnumColor.PURPLE,   'bg-purple-200 dark:bg-purple-700 text-purple-700 dark:text-purple-200' ],
    [ EnumColor.BLUESKY,  'bg-sky-200 dark:bg-sky-700 text-sky-700 dark:text-sky-200' ],
    [ EnumColor.BLUEREY,  'bg-indigo-200 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-200'],
    [ EnumColor.PINK,     'bg-pink-200 dark:bg-pink-700 text-pink-700 dark:text-pink-200'],
  ])

  /*
  private estatusMap: ReadonlyMap<EnumCategoria, Estatus[]> = new Map([

      [EnumCategoria.ORDENES, [
        { nombre: EnumEstatusOrden.PROCESO,  clave: EnumEstatusOrden.PROCESO,  classBadge: 'bg-green-100 text-green-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-green-700 dark:text-green-300',     classIndicator: 'bg-green-700 hover:bg-green-800 dark:bg-green-700 dark:hover:bg-green-700' },
        { nombre: EnumEstatusOrden.FINALIZADO,    clave: EnumEstatusOrden.FINALIZADO,    classBadge: 'bg-blue-100 text-blue-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-blue-700 dark:text-blue-300',         classIndicator: 'dark:bg-blue-700 dark:hover:bg-blue-700 bg-blue-700 hover:bg-blue-800' },
        { nombre: EnumEstatusOrden.PAUSADO,    clave: EnumEstatusOrden.PAUSADO,    classBadge: 'bg-red-100 text-red-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-red-700 dark:text-red-300',             classIndicator: 'dark:bg-red-700 dark:hover:bg-red-700 bg-red-700 hover:bg-red-800' },
        { nombre: EnumEstatusOrden.CANCELADO, clave: EnumEstatusOrden.CANCELADO, classBadge: 'bg-purple-100 text-purple-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-purple-900 dark:text-purple-300', classIndicator: 'bg-purple-700 hover:bg-purple-500 dark:bg-purple-900 dark:hover:bg-purple-500' },
      ]],

      [EnumCategoria.FACTURAS, [
        { nombre: 'vigente', clave: 'vigente', classBadge: 'bg-green-100 text-green-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-green-700 dark:text-green-300', classIndicator: 'bg-green-700 hover:bg-green-800 dark:bg-green-700 dark:hover:bg-green-700' },
        { nombre: 'cancelada', clave: 'cancelada', classBadge: 'bg-gray-300 text-gray-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-300 dark:text-gray-800 ', classIndicator: 'bg-gray-300 dark:bg-gray-300 hover:bg-gray-500  dark:hover:bg-gray-500' },
      ]]

    ])
    */


  classColor( color: EnumColor){
    return this.classColorMap.get( color )
  }

}
