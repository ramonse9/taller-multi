import { EnumRole } from "../../commom/enums/general.enum";

export const usersSeed = [
    { email: 'seed@gmail.com', password: 'Abc123', fullName: 'Seed', isActive: false, role: EnumRole.CAPTURISTA, id_compania: 'com000001', zonaHoraria: 'America/Mazatlan' },
    { email: 'ramonantoniojr@gmail.com', password: 'Abc123', fullName: 'Ramón Antonio', isActive: true, role: EnumRole.CAPTURISTA, id_compania: 'com000001', zonaHoraria: 'America/Mazatlan'  }
    //{ email: 'alejandro@gmail.com', password: 'Abc123', fullame: 'Alejandro Alvarez', isActive: true, role: EnumRole.CAPTURISTA, id_compania: 'com000002', zonaHoraria: 'America/Mazatlan'  },
    //{ email: 'bruno@gmail.com', password: 'Abc123', fullName: 'Bruno Barrerra', isActive: true, role: EnumRole.CAPTURISTA, id_compania: 'com000002', zonaHoraria: 'America/Mazatlan'  },
    //{ email: 'carlos@gmail.com', password: 'Abc123', fullName: 'Carlos Cruz', isActive: true, role: EnumRole.CAPTURISTA, id_compania: 'com000002', zonaHoraria: 'America/Mazatlan'  }//,
    //{ email: 'fernando@gmail.com', password: 'Abc123', fullName: 'Carlos Cruz', is_active: true, roles: ['user'], compania: '', schema_name: 'taller_carroceria_y_pintura_ortiz' },
    //{ email: 'melkars@gmail.com', password: 'Abc123', fullName: 'Carlos Cruz', is_active: true, roles: ['user'], schema_name: 'taller_melkars_diagnostico_automotriz' }
]