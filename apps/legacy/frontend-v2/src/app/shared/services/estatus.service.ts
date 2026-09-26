import { Injectable } from '@angular/core';
import { Estatus } from '@shared/interfaces/estatus.interface';
import { EnumCategoria, EnumEstatusCompra, EnumEstatusOrden } from '@shared/enums/general-estatus.enum';

@Injectable({
  providedIn: 'root'
})
export class EstatusService {

  private readonly badgeBase = 'text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm text-white'

  private estatusMap: ReadonlyMap<EnumCategoria, Estatus[]> = new Map([

    [EnumCategoria.ORDENES, [
      { nombre: EnumEstatusOrden.PROCESO,  clave: EnumEstatusOrden.PROCESO,
        classBadge: `${this.badgeBase} bg-green-600 dark:bg-green-800`,     classIndicator: 'bg-green-600 dark:bg-green-800' },

      { nombre: EnumEstatusOrden.FINALIZADO,    clave: EnumEstatusOrden.FINALIZADO,
        classBadge: `${this.badgeBase} bg-blue-600 dark:bg-blue-800`,         classIndicator: 'bg-blue-600 dark:bg-blue-800' },

      { nombre: EnumEstatusOrden.PAUSADO,    clave: EnumEstatusOrden.PAUSADO,
        classBadge: `${this.badgeBase} bg-red-600 dark:bg-red-800`,            classIndicator: 'bg-red-600 dark:bg-red-800' },

      { nombre: EnumEstatusOrden.CANCELADO, clave: EnumEstatusOrden.CANCELADO,
        classBadge: `${this.badgeBase} bg-purple-600 dark:bg-purple-800`,      classIndicator: 'bg-purple-600 dark:bg-purple-800' },
    ]],

    [EnumCategoria.COMPRAS, [
      { nombre: EnumEstatusCompra.BORRADOR,  clave: EnumEstatusCompra.BORRADOR,
        classBadge: `${this.badgeBase} bg-yellow-600 dark:bg-yellow-700`,     classIndicator: 'bg-orange-600 dark:bg-yellow-700' },

      { nombre: EnumEstatusCompra.CONFIRMADA,    clave: EnumEstatusCompra.CONFIRMADA,
        classBadge: `${this.badgeBase} bg-green-600 dark:bg-green-800`,     classIndicator: 'bg-green-600 dark:bg-green-800' },

      { nombre: EnumEstatusCompra.CANCELADA,    clave: EnumEstatusCompra.CANCELADA,
        classBadge: `${this.badgeBase} bg-red-600 dark:bg-red-800`,            classIndicator: 'bg-red-600 dark:bg-red-800' },

    ]],

    [EnumCategoria.FACTURAS, [
      { nombre: 'vigente', clave: 'vigente', classBadge: 'bg-green-100 text-green-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-green-700 dark:text-green-300', classIndicator: 'bg-green-700 hover:bg-green-800 dark:bg-green-700 dark:hover:bg-green-700' },
      { nombre: 'cancelada', clave: 'cancelada', classBadge: 'bg-gray-300 text-gray-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-300 dark:text-gray-800 ', classIndicator: 'bg-gray-300 dark:bg-gray-300 hover:bg-gray-500  dark:hover:bg-gray-500' },
    ]]

  ])

  getEstatusByCategoria( categoria: EnumCategoria): Estatus[]{
    return this.estatusMap.get( categoria ) || []
  }

  getEstatusByCategoriaAndClave(categoria: EnumCategoria, clave: string): Estatus | null{

    return this.estatusMap.get(categoria)?.find( estatus => estatus.clave === clave ) ?? null

  }

}
