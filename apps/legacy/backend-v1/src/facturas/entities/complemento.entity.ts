import { EnumEstatusCFDI } from './../../commom/enums/general.enum';
import { Pago } from './pago.entity';
import { Column, CreateDateColumn, Entity, OneToMany } from "typeorm";
import { FacturaBase } from './factura-base.entity';

@Entity('pri_complementos')
export class Complemento extends FacturaBase{

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    montoTotal: number;

    @Column({
        type: 'enum',
        enum: EnumEstatusCFDI,
        default: EnumEstatusCFDI.VIGENTE
    })
    estatus: EnumEstatusCFDI;
             
    @Column({type: 'timestamptz', nullable: true, name: 'fecha_pago'})
    fechaPago?: Date;

    @OneToMany( () => Pago, pago => pago.complemento, { cascade: true} )
    facturasRelacionadas: Pago[]    
    
    @CreateDateColumn({type: 'timestamptz'})
    createdAt: Date;
}