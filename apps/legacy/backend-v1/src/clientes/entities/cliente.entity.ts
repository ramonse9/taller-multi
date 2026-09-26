import { User } from '../../auth/entities/user.entity';
import { AuditableEntity } from '../../auth/entities/auditable.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Factura } from '../../facturas/entities/factura.entity';
import { SatUsoCFDI } from './../../sat/entities/sat-uso-cfdi.entity';
import { SatRegimenFiscal } from './../../sat/entities/sat-regimen-fiscal.entity';

@Entity('pri_clientes')
export class Cliente extends AuditableEntity {
    
    @PrimaryColumn()
    id:string

    @Column({type: 'varchar', length: 50 })
    nombre: string    

    @Column({type: 'varchar', length: 10})
    telefono: string

    @Column({nullable: true, type: 'varchar', length: 40})
    email: string
    
    @Column({nullable: true, type: 'text', name: 'rfc'})
    rfc: string

    @Column({nullable: true, type: 'text', name: 'razon_social'})
    razonSocial: string 
    
    @ManyToOne(() => SatRegimenFiscal, { nullable: true })
    @JoinColumn({ name: 'clave_sat_regimen_fiscal' })    
    satRegimenFiscal: SatRegimenFiscal;
    
    @ManyToOne(() => SatUsoCFDI, { nullable: true } )
    @JoinColumn({ name: 'clave_sat_uso_cfdi'})    
    satUsoCFDI: SatUsoCFDI;
    
    @Column({nullable: true, type: 'text', name: 'codigo_postal'})
    codigoPostal: string

    @OneToMany(() => Factura, (factura) => factura.emisor)
    facturas: Factura[] //@follow-up

    @CreateDateColumn({type: 'timestamptz'})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamptz'})
    updatedAt: Date;    

}