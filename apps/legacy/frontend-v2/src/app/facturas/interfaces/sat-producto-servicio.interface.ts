 export interface SatProductoServicio{
  id:                                         string;
  clave:                                      string;
  descripcion:                                string;
  palabrasSimilares:                          string;
  companiaTipoGiro:                           CompaniaTipoGiro;
  satTipoProductoServicio:                    SatTipoProductoServicio;
  satClaveUnidad:                             SatClaveUnidad;
  satObjetoImpuesto:                          SatObjetoImpuesto;
 }

export interface CompaniaTipoGiro{
  id:               string;
  tipo:             string;
}

export interface SatTipoProductoServicio{
 tipo:              string;
}

export interface SatClaveUnidad{
 clave:             string;
 nombre:            string;
 descripcion:       string;
 nota:              string;
}

export interface SatObjetoImpuesto{
 clave:             string;
 descripcion:       string;
}
