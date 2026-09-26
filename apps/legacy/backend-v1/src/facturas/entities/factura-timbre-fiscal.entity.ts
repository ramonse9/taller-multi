

/*
@Entity('facturas_timbres_fiscales')
export class FacturaTimbreFiscal{

    @OneToOne( () => Factura, factura => factura.timbreFiscal, { onDelete: 'RESTRICT' } )
    @JoinColumn({name: 'uuid', referencedColumnName: 'id'})
    @PrimaryColumn({type:'uuid'})
    uuid: string;

    @Column('text')
    sello: string;

    @Column({ type: 'text', name: 'sello_sat'})
    selloSat: string;

    @Column({type: 'varchar', name: 'num_certificado_sat', length: 20})
    numCertificadoSat: string;

    @Column({type: 'varchar', name: 'rfc_certifico', length: 13})
    rfcCertifico: string;    
    
    factura: Factura;

}
*/
