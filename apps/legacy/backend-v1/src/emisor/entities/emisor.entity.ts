
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Factura } from "../../facturas/entities/factura.entity";
import { AuditableEntity } from "../../auth/entities/auditable.entity";
import { User } from "../../auth/entities/user.entity";
import { SatRegimenFiscal } from './../../sat/entities/sat-regimen-fiscal.entity';

/*
    //@Column({type: 'text', name: 'uso_cfdi'})
    //usoCFDI: string;

    //@Column({type: 'text', name: 'clave_sat_regimen_fiscal'})
    //claveSatRegimenFiscal: number;
*/

@Entity('pri_emisores')
export class Emisor extends AuditableEntity {

    @PrimaryColumn()
    id: string;

    @Column({ default: true, name: 'is_active' })
    isActive: boolean;

    @Column()
    rfc: string;

    @Column({type: 'text', name: 'razon_social'})
    razonSocial: string;

    @ManyToOne(() => SatRegimenFiscal, { nullable: true })
    @JoinColumn({ name: 'clave_sat_regimen_fiscal' })    
    satRegimenFiscal: SatRegimenFiscal;
    
    @Column({type: 'text', name: 'codigo_postal'})
    codigoPostal: string;  
           
    @Column({ type: 'text', name: 'cer_file_encrypted', nullable: true, select: false })
    cerFileEncrypted: string;

    @Column({ type: 'text', name: 'key_file_encrypted', nullable: true, select: false })
    keyFileEncrypted: string;

    @Column({ type: 'text', name: 'password_encrypted', nullable: true, select: false })
    passwordEncrypted: string;

    @Column({ type: 'text', name: 'cer_file_iv', nullable: true, select: false})
    cerFileIV: string;

    @Column({ type: 'text', name: 'key_file_iv', nullable: true, select: false})
    keyFileIV: string;

    @Column({ type: 'text', name: 'password_iv', nullable: true, select: false })
    passwordIV: string;    

    @Column({type: 'timestamptz', name:'valid_from', nullable: true})
    validFrom: Date;

    @Column({type: 'timestamptz', name: 'valid_to', nullable: true})
    validTo: Date;    
    
    @ManyToOne( () => User, { onDelete: 'RESTRICT'})
    @JoinColumn({name: 'id_user'})
    usuario: User;
    
    @OneToMany( () => Factura, factura => factura.emisor, { cascade: true} )
    facturas: Factura[]
    
    @CreateDateColumn({type: 'timestamptz'})
    createdAt: Date;
    
    @UpdateDateColumn({type: 'timestamptz'})
    updatedAt: Date;    
    
}
//@Column({nullable: true})
//contrasena_key: string;

//@OneToMany(() => Factura, (factura) => factura.emisor)
//facturas: Factura[]

//@Column()
//usuario_id: string;    

 /*@Column({ nullable: true, type: 'bytea' })
    certificado_cer: Buffer;

    @Column({ nullable: true, type: 'bytea' })
    certificado_key: Buffer;

    @Column({ nullable: true })
    contrasena_key_encriptada: string;*/
