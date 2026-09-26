import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { AuditableEntity } from '../../auth/entities/auditable.entity';
import { EnumEstatusCompra } from '../../commom/enums/general.enum';
import { Proveedor } from '../../proveedores/entities/proveedor.entity';
import { CompraDetalle } from './compra-detalle.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('pri_compras')
export class Compra extends AuditableEntity {
  @PrimaryColumn()
  id: string;

  //@Column({ unique: true })
  //folio: string;

  @ManyToOne(() => Proveedor)
  @JoinColumn({ name: 'id_proveedor' })
  proveedor: Proveedor;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  iva: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  /*@Column({ type: 'text', nullable: true })
  observaciones: string;
  */
  
  @Column({
    type: 'enum',
    enum: EnumEstatusCompra,
    default: EnumEstatusCompra.BORRADOR,
  })
  estatus: EnumEstatusCompra;

  @ManyToOne( () => User)
  @JoinColumn({name: 'id_user_borrador'})
  usuarioBorrador: User;

  @Column({type: 'timestamptz', name: 'fecha_confirmacion', nullable: true})
  fechaConfirmacion?: Date;    
      
  @ManyToOne( () => User, { nullable: true })
  @JoinColumn({name: 'id_user_confirmacion'})
  usuarioConfirmacion?: User;

  @Column({type: 'timestamptz', name: 'fecha_cancelacion', nullable: true})
  fechaCancelacion?: Date;    
      
  @ManyToOne( () => User, {nullable: true})
  @JoinColumn({name: 'id_user_cancelacion'})
  usuarioCancelacion?: User;

  @Column({ type: 'text', nullable: true })
  motivoCancelacion: string;

  @OneToMany(() => CompraDetalle, (detalle) => detalle.compra)
  detalles: CompraDetalle[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
