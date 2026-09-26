import { Entity, PrimaryColumn } from "typeorm";

@Entity({name: 'pub_sat_tipos_productos_servicios', schema:'public'})
export class SatTipoProductoServicio {

    @PrimaryColumn()
    tipo: string;
    
}