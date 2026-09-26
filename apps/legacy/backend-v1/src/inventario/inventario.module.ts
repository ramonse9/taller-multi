import { Module } from '@nestjs/common';
import { InventarioCoreModule } from './inventario-core.module';
import { ProductosModule } from '../productos/productos.module';
import { ServiciosModule } from '../servicios/servicios.module';
import { ProveedoresModule } from '../proveedores/proveedores.module';
import { ComprasModule } from '../compras/compras.module';

@Module({
  imports: [
    InventarioCoreModule,
    ProductosModule,
    ServiciosModule,
    ProveedoresModule,
    ComprasModule,
  ],
  exports: [InventarioCoreModule],
})
export class InventarioModule {}
