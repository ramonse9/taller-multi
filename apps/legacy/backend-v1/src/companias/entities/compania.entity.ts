import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from "typeorm";
import { CompaniaTipoGiro } from "./compania-tipo-giro.entity";
import { SatTipoPersona } from "../../sat/entities/sat-tipo-persona.entity";
import { SatRetencionIVA } from "../../sat/entities/sat-retencion-iva.entity";
import { SatRetencionISR } from "../../sat/entities/sat-retencion-isr.entity";
import { CompaniaInfo } from "./compania-info.entity";

@Entity({name: 'pub_companias', schema:'public'})
export class Compania {

    @PrimaryColumn()
    id: string;

    @Column('text', { unique: true})
    nombre: string;

    @Column('text', { unique: true })
    schema: string;

    @Column('bool', {default: true, name: 'is_active', select: false})
    isActive: boolean;

    @Column('bool', {default: false, name: 'modulo_inventario', select: false})
    moduloInventario: boolean;
    
    @Column('bool', {default: false, name: 'modulo_facturacion', select: false})
    moduloFacturacion: boolean;

    @Column('bool', {default: false, name: 'modulo_gastos', select: false})
    moduloGastos: boolean;

    @Column('bool', {default: false, name: 'modulo_nomina', select: false})
    moduloNomina: boolean;
    
    @ManyToOne( () => CompaniaTipoGiro )
    @JoinColumn( {name: 'tipo_compania_tipo_giro'} )
    companiaTipoGiro: CompaniaTipoGiro;
    
    @ManyToOne( () => SatTipoPersona )
    @JoinColumn( {name: 'tipo_sat_tipo_persona'} )
    satTipoPersona: SatTipoPersona

    @ManyToOne( () => SatRetencionISR )
    @JoinColumn( {name: 'id_sat_retencion_isr'} )
    satRetencionISR: SatRetencionISR

    @ManyToOne( () => SatRetencionIVA )
    @JoinColumn( {name: 'id_sat_retencion_iva'} )
    satRetencionIVA: SatRetencionIVA

    @OneToOne( () => CompaniaInfo, info => info.compania, { cascade: true} )
    companiaInfo: CompaniaInfo;

    @CreateDateColumn({type: 'timestamptz'})        
    createdAt: Date;

}
