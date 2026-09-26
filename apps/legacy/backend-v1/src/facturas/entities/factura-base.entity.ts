import { SatCancelacionMotivo } from './../../sat/entities/sat-cancelacion-motivo.entity';
import { SatExportacion } from './../../sat/entities/sat-exportacion.entity';
import { SatMoneda } from './../../sat/entities/sat-moneda.entity';
import { SatFormaPago } from './../../sat/entities/sat-forma-pago.entity';
import { SatTipoComprobante } from './../../sat/entities/sat-tipo-comprobante.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, TableInheritance } from "typeorm";
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { EnumEstatusCFDI } from './../../commom/enums/general.enum';

@Entity()
@TableInheritance({column: { type: 'varchar', name: 'tipo'}})
export abstract class FacturaBase{
    
    @PrimaryColumn()    
    id: string;
    
    @Column()
    anio: string

    @Column()
    serie: string;

    @Column()
    folio: string;
    
    @ManyToOne(() => SatTipoComprobante)
    @JoinColumn({name: 'clave_sat_tipo_comprobante', referencedColumnName: 'clave'})
    satTipoComprobante: SatTipoComprobante;
    
    @ManyToOne(() => SatFormaPago )
    @JoinColumn({name: 'clave_sat_forma_pago', referencedColumnName: 'clave'})
    satFormaPago: SatFormaPago;
    
    @ManyToOne(() => SatMoneda)
    @JoinColumn({name: 'clave_sat_moneda', referencedColumnName: 'clave'})
    satMoneda: SatMoneda;
    
    @ManyToOne( () => SatExportacion )
    @JoinColumn({name: 'clave_sat_exportacion', referencedColumnName: 'clave'})
    satExportacion: SatExportacion;
    
    @Column('decimal', { precision: 10, scale: 2, name: 'tipo_cambio'})
    tipoCambio: number;
    
    @Column()
    observaciones: string;     
    
    @Column({type: 'uuid', unique: true, nullable: true})
    uuid: string;      
    
    @Column({type: 'text', nullable: true})
    sello: string;
    
    @Column({ type: 'text', name: 'sello_sat', nullable: true})
    selloSat: string;
    
    @Column({type: 'varchar', name: 'num_certificado_sat', length: 20, nullable: true})
    numCertificadoSat: string;
    
    @Column({type: 'varchar', name: 'rfc_certifico', length: 13, nullable: true})
    rfcCertifico: string;    
    
    @Column({
        type: 'enum',
        enum: EnumEstatusCFDI,
        default: EnumEstatusCFDI.VIGENTE
    })
    estatus: EnumEstatusCFDI;
    
    @Column({type: 'timestamptz', nullable: true, name: 'fecha_emision'})
    fechaEmision: Date;

    @Column({nullable: true, type: 'timestamp', name: 'fecha_timbrado'})
    @Type( () => Date)
    fechaTimbrado: Date;

    @Column({type: 'timestamptz', nullable: true, name: 'fecha_cancelacion'})    
    @IsOptional()    
    fechaCancelacion?: Date;

    @ManyToOne( () => SatCancelacionMotivo )
    @JoinColumn({name: 'clave_sat_cancelacion_motivo', referencedColumnName: 'clave'})
    satCancelacionMotivo: SatCancelacionMotivo;
    
    @Column({name: 'id_sustitucion', nullable: true })
    idSustitucion: string;
    
    @Column({type: 'uuid', name: 'uuid_sustitucion', nullable: true })
    uuidSustitucion: string;

    @Column({ name: 'cancelacion_acuse_respuesta',type: 'jsonb', nullable: true })
    cancelacionAcuseRespuesta?: any;

    @CreateDateColumn({type: 'timestamptz'})
    createdAt: Date;
              
    @CreateDateColumn({type: 'timestamptz'})
    updatedAt: Date;
}