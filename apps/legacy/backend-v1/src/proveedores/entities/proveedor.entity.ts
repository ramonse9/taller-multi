import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuditableEntity } from '../../auth/entities/auditable.entity';

@Entity('pri_proveedores')
export class Proveedor extends AuditableEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  rfc: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ nullable: true })
  contacto: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
