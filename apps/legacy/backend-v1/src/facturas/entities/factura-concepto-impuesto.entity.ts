import { EnumEstatusConcepto, EnumEstatusConceptoFactura } from './../../commom/enums/general.enum';
import { FacturaConcepto } from './factura-concepto.entity';
import { SatImpuesto } from './../../sat/entities/sat-impuesto.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('pri_facturas_conceptos_impuestos')
export class FacturaConceptoImpuesto{
    @PrimaryGeneratedColumn()
    id: number;

    @Column('decimal', { precision: 10, scale: 2 })
    base: string;
    
    @ManyToOne( () => SatImpuesto )
    @JoinColumn({name: 'clave_sat_impuesto', referencedColumnName: 'clave'})
    satImpuesto: SatImpuesto

    @Column({ name: 'tipo_factor', type: 'varchar', length: 10})
    tipoFactor: 'Tasa' | 'Cuota' | 'Exento'

    @Column({ name: 'tasa_cuota', type: 'decimal', precision: 10, scale:6 })
    tasaCuota: string

    @Column('decimal', { precision: 10, scale: 2 })
    importe: string;

    @Column({type: 'varchar', length: 20})
    tipo: 'Traslado' | 'Retencion'

    @Column({
        type: 'enum',
        enum: EnumEstatusConceptoFactura,
        default: EnumEstatusConceptoFactura.VIGENTE
    })
    estatus: EnumEstatusConcepto;

    @ManyToOne( () => FacturaConcepto, concepto => concepto.impuestos, { onDelete: 'RESTRICT'} )
    @JoinColumn({name: 'id_concepto'})
    concepto: FacturaConcepto;
      
}