import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { OrdenNota } from "./orden_nota.entity";
import { IsUrl } from "class-validator";

@Entity('pri_ordenes_notas_imagenes')
export class OrdenNotaImagen{

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsUrl()
    url: string;

    @Column()
    public_id: string;

    @ManyToOne( () => OrdenNota, (nota) => nota.imagenes, { onDelete: 'RESTRICT' })
    @JoinColumn({name: 'id_orden_nota'})
    nota: OrdenNota

}