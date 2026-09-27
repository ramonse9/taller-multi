import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'public', name: 'companies' })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Index({ unique: true })
  @Column({ name: 'schema_name', type: 'varchar', length: 63, unique: true })
  schemaName!: string;

  @Column({ name: 'login_code', type: 'varchar', length: 40, unique: true })
  loginCode!: string;

  @Column({ name: 'company_type_code', type: 'varchar', length: 30 })
  companyTypeCode!: string;

  @Column({ name: 'person_type_code', type: 'varchar', length: 20 })
  personTypeCode!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'withholds_isr', type: 'boolean', default: false })
  withholdsIsr!: boolean;

  @Column({ name: 'withholds_iva', type: 'boolean', default: false })
  withholdsIva!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
