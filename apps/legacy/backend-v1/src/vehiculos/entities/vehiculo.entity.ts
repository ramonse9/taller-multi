import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Modelo } from "../../modelos/entities/modelo.entity";
import { AuditableEntity } from "../../auth/entities/auditable.entity";

@Entity('pri_vehiculos')
export class Vehiculo extends AuditableEntity{
    @PrimaryColumn()
    id: string;

    @Column({type: 'int'})
    anio: number;
    
    @Column({type: 'varchar', length: 20})
    color: string;
        
    @Column({type: 'varchar', length: 15, nullable: true})
    placa?: string;

    @Column({ type: 'varchar', length: 10, unique: true, name: 'numero_serie'})
    numeroSerie: string;

    @ManyToOne( () => Modelo)
    @JoinColumn({name: 'id_modelo'})
    modelo: Modelo

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}