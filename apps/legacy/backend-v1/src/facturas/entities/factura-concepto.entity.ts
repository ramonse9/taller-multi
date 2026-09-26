import { EnumEstatusConcepto, EnumEstatusConceptoFactura } from './../../commom/enums/general.enum';
import { ProductoServicio } from './../../productos-servicios/entities/producto-servicio.entity';
import { FacturaConceptoImpuesto } from './factura-concepto-impuesto.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Factura } from "./factura.entity";

/*c_ClaveProdServ
78181501	Servicio de pintura o reparación de carrocerías de vehículos
...*/
/*c_ClaveUnidad
  E48	Unidad de servicio  
  ...*/

@Entity('pri_facturas_conceptos')
export class FacturaConcepto {  

  @PrimaryGeneratedColumn()  
  id: number;

  @ManyToOne( () => ProductoServicio)
  @JoinColumn({name: 'id_producto_servicio' })  
  productoServicio: ProductoServicio;

  @Column({type: 'decimal', name: 'valor_unitario'})
  valorUnitario: number;  

  @Column('decimal')
  cantidad: number;
  
  @Column('decimal')
  subtotal: number;

  @Column('decimal')
  descuento: number;

  @Column('decimal')
  importe: number;

  @ManyToOne( () => Factura, (factura) => factura.conceptos, { onDelete: 'RESTRICT'})
  @JoinColumn({ name: 'id_factura'})
  factura: Factura

  @OneToMany(() => FacturaConceptoImpuesto, impuesto => impuesto.concepto, { cascade: true} )
  impuestos: FacturaConceptoImpuesto[];
  
  @Column({
      type: 'enum',
      enum: EnumEstatusConceptoFactura,
      default: EnumEstatusConceptoFactura.VIGENTE
  })
  estatus: EnumEstatusConcepto;  
  
}


//clave_prod_serv
//clave_unidad
//valor_unitario
//importe
//objeto_imp