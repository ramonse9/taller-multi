import { EnumEstatusOrden } from './../../commom/enums/general.enum';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Orden } from "./orden.entity";
import { OrdenNotaImagen } from "./orden_nota_imagen.entity";
import { AuditableEntity } from "../../auth/entities/auditable.entity";

@Entity('pri_ordenes_notas')
export class OrdenNota extends AuditableEntity{

    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', length: 1000})    
    nota: string;

    @Column({
            type: 'enum',
            enum: EnumEstatusOrden,
            nullable: true
    })
    estatus: EnumEstatusOrden;
    
    @ManyToOne( () => Orden, (orden) => orden.notas, { onDelete: 'RESTRICT' } )
    @JoinColumn({ name: 'id_orden' })
    orden: Orden

    @OneToMany( () => OrdenNotaImagen, (imagen) => imagen.nota, {cascade: true })
    imagenes: OrdenNotaImagen[];

    @CreateDateColumn({type: 'timestamptz'})
    createdAt: Date;

}
