import { Modelo } from './../../modelos/entities/modelo.entity';
import { Empresa } from './../../empresas/entities/empresa.entity';
import { Vehiculo } from './../../vehiculos/entities/vehiculo.entity';

import { Cliente } from "../../clientes/entities/cliente.entity";
import { AuditableEntity } from "../../auth/entities/auditable.entity";
import { Orden } from "../../ordenes/entities/orden.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { CotizacionConcepto } from "./cotizacion_concepto.entity";
import { IsOptional } from 'class-validator';
import { AtLeastOneExists } from './../../ordenes/decorators/at-least-one.decorator';

@Entity('pri_cotizaciones')
export class Cotizacion extends AuditableEntity {
    @PrimaryColumn()
    id: string;

    @Column({type: 'text'})    
    descripcion: string;     

    @AtLeastOneExists('empresa')
    @IsOptional()
    @ManyToOne(() => Cliente, { nullable: true})
    @JoinColumn({name: 'id_cliente'})
    cliente?: Cliente;
    
    @AtLeastOneExists('cliente')
    @IsOptional()
    @ManyToOne( () => Empresa, {nullable: true})
    @JoinColumn({name:'id_empresa'})
    empresa?: Empresa;
    
    @AtLeastOneExists('modelo')
    @IsOptional()
    @ManyToOne( () => Vehiculo, {nullable: true})
    @JoinColumn({name: 'id_vehiculo'})
    vehiculo?: Vehiculo;

    @AtLeastOneExists('vehiculo')
    @IsOptional()
    @ManyToOne( () => Modelo, { nullable: true})
    @JoinColumn({name: 'id_modelo'})
    modelo?: Modelo

    @AtLeastOneExists('vehiculo')
    @IsOptional()
    @Column({type: 'int', nullable: true})
    anio?: number;

    @OneToMany( () => CotizacionConcepto, concepto => concepto.cotizacion, { cascade: true} )
    conceptos: CotizacionConcepto[];

    @IsOptional()
    @ManyToOne(() => Orden, { nullable: true })
    @JoinColumn({name: 'id_orden'})
    orden?: Orden;

    @CreateDateColumn({type: 'timestamptz'})        
    createdAt: Date;
    
    @CreateDateColumn({type: 'timestamptz'})        
    updatedAt: Date;

}
