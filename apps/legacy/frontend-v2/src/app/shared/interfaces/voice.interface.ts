export interface VoiceDatosVehiculo{
    id_marca:       string | null;
    id_modelo:      string | null;
    marca:          string | null;
    modelo:         string | null;
    año:            string | null;
    placa:          string | null;
    color:          string | null;
    numeroSerie:    string | null;
}

export interface VoiceDatosCliente{
    nombre:     string | null;
    telefono:   string | null;
    email:      string | null;
}

export interface VoiceDatosEmpresa{
    nombre:     string | null;
    telefono:   string | null;
    email:      string | null;
}