import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { Marca } from '../../marcas/entities/marca.entity';
import { AuditableEntity } from '../../auth/entities/auditable.entity';

@Entity({name:'pub_modelos', schema:'public'})
export class Modelo extends AuditableEntity {
    @PrimaryColumn()
    id:string;

    @Column({type: 'varchar', length: 30})
    nombre: string;

    @ManyToOne( () => Marca, (marca) => marca.modelos )
    @JoinColumn({name: 'id_marca'})
    marca: Marca;
}
