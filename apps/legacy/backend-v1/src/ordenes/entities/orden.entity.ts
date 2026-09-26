import { SatMetodoPago } from './../../sat/entities/sat-metodo-pago.entity';
import { Factura } from './../../facturas/entities/factura.entity';
import { IsBoolean, IsOptional } from "class-validator";
import { Cliente } from "../../clientes/entities/cliente.entity";
import { Vehiculo } from "../../vehiculos/entities/vehiculo.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { OrdenNota } from "./orden_nota.entity";
import { Empresa } from "../../empresas/entities/empresa.entity";
import { AuditableEntity } from "../../auth/entities/auditable.entity";
import { OrdenConcepto } from './orden_concepto.entity';
import { EnumEstatusOrden, EnumEstatusOrdenFactura } from './../../commom/enums/general.enum';
import { AtLeastOneExists } from '../decorators/at-least-one.decorator';

@Entity('pri_ordenes')
export class Orden extends AuditableEntity {

        @PrimaryColumn()
        id: string;
            
        @Column({type: 'text'})
        descripcion: string;        
        
        //@Column({type: 'timestamptz', nullable:true, name: 'fecha_entrega_estimada'})        
        //fechaEntregaEstimada: Date;

        @Column({type: 'timestamptz', name: 'fecha_ingreso'})        
        fechaIngreso: Date;
            
        @Column({type: 'timestamptz', nullable: true, name: 'fecha_entrega_real'})    
        @IsOptional()        
        fechaEntregaReal?: Date;

        @Column({type: 'timestamptz', nullable: true, name: 'fecha_pago'})    
        @IsOptional()
        fechaPago?: Date;

        @Column({type: 'boolean', name: 'pagada', default: false})
        @IsBoolean()
        pagada: boolean = false;

        @IsOptional()
        @Column({type: 'int', nullable: true})
        kilometros?: number;

        @IsOptional()
        @Column({type: 'text', nullable: true})
        poliza?: string;

        @IsOptional()
        @Column({type: 'text', nullable: true})
        siniestro?: string;            
        
        @Column({
                type: 'enum',
                enum: EnumEstatusOrden,
                default: EnumEstatusOrden.PROCESO
        })
        estatus: EnumEstatusOrden;
                
        @Column({
                name: 'estatus_factura',
                type: 'enum',
                enum: EnumEstatusOrdenFactura,
                default: EnumEstatusOrdenFactura.PENDIENTE
         })
        estatusFactura: EnumEstatusOrdenFactura;

        @ManyToOne(() => SatMetodoPago)
        @JoinColumn({name: 'clave_sat_metodo_pago', referencedColumnName: 'clave'})  
        satMetodoPago: SatMetodoPago;
        
        @Column({type: 'boolean', name: 'liquidacion_factura', default: false})
        @IsBoolean()
        liquidacionFactura: boolean = false;

        @Column({type: 'timestamptz', nullable: true, name: 'fecha_liquidacion'})
        @IsOptional()
        fechaLiquidacion?: Date;
        
        @IsOptional()
        @Column({type: 'text', nullable: true, name: 'folio_nota'})
        folioNota?: string;

        @Column({ type: 'decimal', precision: 12, scale: 2, name: 'subtotal_costo', nullable: true })
        subtotalCosto: number;

        @Column({ type: 'decimal', precision: 12, scale: 2, name: 'subtotal_venta', nullable: true })
        subtotalVenta: number;

        @Column({ type: 'decimal', precision: 12, scale: 2, name: 'utilidad', nullable: true })
        utilidad: number;

        @ManyToOne( () => Vehiculo)
        @JoinColumn({name: 'id_vehiculo'})
        vehiculo: Vehiculo;
    
        @AtLeastOneExists('empresa')
        @IsOptional()
        @ManyToOne( () => Cliente, {nullable: true})
        @JoinColumn({name:'id_cliente'})
        cliente?: Cliente;
        
        @AtLeastOneExists('cliente')
        @IsOptional()
        @ManyToOne( () => Empresa, {nullable: true})
        @JoinColumn({name:'id_empresa'})
        empresa?: Empresa;  

        @OneToMany( () => Factura, factura => factura.orden )
        facturas: Factura[]

        @OneToMany(() => OrdenNota, nota => nota.orden, { cascade: true })
        notas: OrdenNota[];

        @OneToMany( () => OrdenConcepto, concepto => concepto.orden, { cascade: true }) 
        conceptos: OrdenConcepto[]
        
        @CreateDateColumn({type: 'timestamptz'})        
        createdAt: Date;
        
        @CreateDateColumn({type: 'timestamptz'})        
        updatedAt: Date;
}
