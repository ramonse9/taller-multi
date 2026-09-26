import { Empresa } from './../../empresas/entities/empresa.entity';
import { SatTipoPersona } from './../../sat/entities/sat-tipo-persona.entity';
import { SatUsoCFDI } from './../../sat/entities/sat-uso-cfdi.entity';
import { SatRegimenFiscal } from './../../sat/entities/sat-regimen-fiscal.entity';
import { SatMetodoPago } from './../../sat/entities/sat-metodo-pago.entity';
import { Orden } from './../../ordenes/entities/orden.entity';
import { Cliente } from "../../clientes/entities/cliente.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { FacturaConcepto } from "./factura-concepto.entity";
import { Emisor } from "../../emisor/entities/emisor.entity";
import { FacturaBase } from './factura-base.entity';
import { Pago } from './pago.entity';

@Entity('pri_facturas')
export class Factura extends FacturaBase { 
    
  @Column({type: 'text', name: 'condiciones_pago'})
  condicionesPago: string;

  @ManyToOne(() => SatMetodoPago)
  @JoinColumn({name: 'clave_sat_metodo_pago', referencedColumnName: 'clave'})  
  satMetodoPago: SatMetodoPago;
  
  @Column({ type: 'text', name: 'lugar_expedicion'})
  lugarExpedicion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: string;

  @Column('decimal', { precision: 10, scale: 2 })
  descuento: string;
  
  @Column('decimal', { precision: 10, scale: 2 })
  total: string;
    
  @Column({type: 'text', name: 'emisor_rfc'})
  emisorRFC: string;

  @Column({type: 'text', name: 'emisor_razon_social'})
  emisorRazonSocial: string;

  @ManyToOne(() => SatRegimenFiscal)
  @JoinColumn({name: 'emisor_clave_sat_regimen_fiscal', referencedColumnName: 'clave'})
  emisorSatRegimenFiscal: SatRegimenFiscal;
  
  @Column({type: 'text', name: 'emisor_codigo_postal'})
  emisorCodigoPostal: string;

  @Column({type: 'text', name: 'receptor_rfc'})
  receptorRFC: string;

  @Column({type: 'text', name: 'receptor_razon_social'})
  receptorRazonSocial: string;

  @ManyToOne(() => SatRegimenFiscal)
  @JoinColumn({name: 'receptor_clave_sat_regimen_fiscal', referencedColumnName: 'clave'})
  receptorSatRegimenFiscal: SatRegimenFiscal;
  
  @ManyToOne(() => SatUsoCFDI)
  @JoinColumn({ name: 'receptor_clave_sat_uso_cfdi', referencedColumnName: 'clave'})
  receptorSatUsoCFDI: SatUsoCFDI;

  @Column({type: 'text', name: 'receptor_codigo_postal'})
  receptorCodigoPostal: string;  

  @Column({ name: 'receptor_email', type: 'varchar', length: 40})
  receptorEmail: string;
  
  @ManyToOne(() => SatTipoPersona)
  @JoinColumn({name: 'receptor_tipo_sat_tipo_persona', referencedColumnName: 'tipo'})
  receptorSatTipoPersona: SatTipoPersona;

  @ManyToOne(() => Emisor, emisor => emisor.facturas)
  @JoinColumn({name: 'id_emisor'})
  emisor: Emisor;

  @ManyToOne(() => Cliente, cliente => cliente.facturas, {nullable: true})
  @JoinColumn({name: 'id_cliente'})
  receptorCliente?: Cliente;

  @ManyToOne(() => Empresa, empresa => empresa.facturas, {nullable: true})
  @JoinColumn({name: 'id_empresa'})
  receptorEmpresa?: Empresa;
    
  @ManyToOne( () => Orden, orden => orden.facturas, {nullable: true})
  @JoinColumn({name: 'id_orden'})
  orden: Orden;

  @OneToMany(() => FacturaConcepto, concepto => concepto.factura, { cascade: true })
  conceptos: FacturaConcepto[];

  @OneToMany( () => Pago, pago => pago.factura )
  pagos: Pago[]; 
  
  @CreateDateColumn({type: 'timestamptz'})
  createdAt: Date;
    
}