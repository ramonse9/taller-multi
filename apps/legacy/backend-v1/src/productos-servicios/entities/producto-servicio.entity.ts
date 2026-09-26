import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { SatProductoServicio } from './../../sat/entities/sat-producto-servicio.entity';
import { AuditableEntity } from '../../auth/entities/auditable.entity';
import { IsDecimal } from "class-validator";

@Entity({name:'pri_productos_servicios'})
export class ProductoServicio extends AuditableEntity {

    @PrimaryColumn()
    id: string;    

    @Column()
    descripcion: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'valor_unitario' })    
    @IsDecimal({ decimal_digits: '0,2' }, { message: 'El Valor Unitario debe ser un número con hasta dos decimales' })
    valorUnitario: number;
    
    @ManyToOne( () => SatProductoServicio )
    @JoinColumn( {name: 'id_sat_producto_servicio'} )
    satProductoServicio: SatProductoServicio;

    @UpdateDateColumn({type: 'timestamptz'})
    updatedAt: Date;

    @CreateDateColumn({type: 'timestamptz'})        
    createdAt: Date;
}