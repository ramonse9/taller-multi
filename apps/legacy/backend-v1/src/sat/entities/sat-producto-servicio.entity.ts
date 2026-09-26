import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
//import { SatClaveUnidad } from '../../facturas/entities/sat-clave-unidad.entity';
import { CompaniaTipoGiro } from '../../companias/entities/compania-tipo-giro.entity';
import { SatTipoProductoServicio } from "./sat-tipo-producto-servicio.entity";
import { SatClaveUnidad } from "./sat-clave-unidad.entity";
import { SatObjetoImpuesto } from "./sat-objeto-impuesto.entity";
//import { SatTipoProductoServicio } from "../../facturas/entities/sat-tipo-producto-servicio.entity";

@Entity({name:'pub_sat_productos_servicios', schema:'public'})
export class SatProductoServicio {

    @PrimaryColumn()
    id: string;

    @Column({unique: true})
    clave: string;

    @Column()
    descripcion: string;
    
    @Column({type: 'text', name: 'palabras_similares'})
    palabrasSimilares: string;
    
    @ManyToOne( () => CompaniaTipoGiro,  {eager: true, nullable: false} )
    @JoinColumn( {name: 'tipo_compania_tipo_giro'} )
    companiaTipoGiro: CompaniaTipoGiro;

    @ManyToOne( () => SatTipoProductoServicio, {eager: true, nullable: false} )
    @JoinColumn( {name: 'tipo_sat_tipo_producto_servicio' })
    satTipoProductoServicio: SatTipoProductoServicio;

    @ManyToOne( () => SatClaveUnidad, {eager: true, nullable: false})
    @JoinColumn({name: 'clave_sat_clave_unidad'})
    satClaveUnidad: SatClaveUnidad;

    @ManyToOne( () => SatObjetoImpuesto, {eager: true, nullable: false})
    @JoinColumn({name: 'clave_sat_objeto_impuesto'})
    satObjetoImpuesto: SatObjetoImpuesto;

    //@OneToMany( () => FacturaProductoServicio, (facturaProductoServicio) => facturaProductoServicio.facturaCatalogoProductoServicio)
    //facturaProductoServicio: FacturaProductoServicio[];

    @CreateDateColumn({type: 'timestamptz'})        
    createdAt: Date;
}