export const C_FORMA_PAGO = [
  { clave: '01', descripcion: 'Efectivo' },
  { clave: '02', descripcion: 'Cheque nominativo' },
  { clave: '03', descripcion: 'Transferencia electrónica de fondos' },
  { clave: '04', descripcion: 'Tarjeta de crédito' },
  { clave: '28', descripcion: 'Tarjeta de débito' },
  { clave: '99', descripcion: 'Por definir' }
];

export const C_METODO_PAGO = [
  { clave: 'PUE', descripcion: 'Pago en una sola exhibición' },
  { clave: 'PPD', descripcion: 'Pago en parcialidades o diferido' }
];

export const C_MONEDA = [
  { clave: 'MXN', descripcion: 'Peso Mexicano' },
  { clave: 'USD', descripcion: 'Dólar Estadounidense' }
];

export const C_TIPO_COMPROBANTE = [
  { clave: 'I', descripcion: 'Ingreso' },
  { clave: 'E', descripcion: 'Egreso' },
  { clave: 'T', descripcion: 'Traslado' },
  { clave: 'N', descripcion: 'Nómina' },
  { clave: 'P', descripcion: 'Pago' }
];

export const C_REGIMEN_FISCAL = [
  { clave: '601', descripcion: 'General de Ley Personas Morales' },
  { clave: '603', descripcion: 'Personas Morales con Fines no Lucrativos' },
  { clave: '605', descripcion: 'Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { clave: '606', descripcion: 'Arrendamiento' },
  { clave: '607', descripcion: 'Régimen de Enajenación o Adquisición de Bienes' },
  { clave: '608', descripcion: 'Demás ingresos' },
  { clave: '610', descripcion: 'Residentes en el Extranjero sin Establecimiento Permanente en México' },
  { clave: '611', descripcion: 'Ingresos por Dividendos (socios y accionistas)' },
  { clave: '612', descripcion: 'Personas Físicas con Actividades Empresariales y Profesionales' },
  { clave: '614', descripcion: 'Ingresos por intereses' },
  { clave: '616', descripcion: 'Sin obligaciones fiscales' },
  { clave: '620', descripcion: 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos' },
  { clave: '621', descripcion: 'Incorporación Fiscal' },
  { clave: '622', descripcion: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { clave: '623', descripcion: 'Opcional para Grupos de Sociedades' },
  { clave: '624', descripcion: 'Coordinados' },
  { clave: '625', descripcion: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { clave: '626', descripcion: 'Régimen Simplificado de Confianza' }
];

export const C_REGIMEN_FISCAL_USO_CFDI = [
  { clave: "601", usoCfdiListado: ["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "S01", "CP01"] },
  { clave: "603", usoCfdiListado: ["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "S01", "CP01"] },
  { clave: "605", usoCfdiListado: ["D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "S01", "CP01", "CN01"] },
  { clave: "606", usoCfdiListado: ["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "S01", "CP01"] },
  { clave: "607", usoCfdiListado: ["D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "S01", "CP01"] },
  { clave: "608", usoCfdiListado: ["D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "S01", "CP01"] },
  { clave: "610", usoCfdiListado: ["S01", "CP01"] },
  { clave: "611", usoCfdiListado: ["D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "S01", "CP01"] },
  { clave: "612", usoCfdiListado: ["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "S01", "CP01"] },
  { clave: "614", usoCfdiListado: ["D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "S01", "CP01"] },
  { clave: "615", usoCfdiListado: ["D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "S01", "CP01"] },
  { clave: "616", usoCfdiListado: ["G02", "S01", "CP01"] },
  { clave: "620", usoCfdiListado: ["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "S01", "CP01"] },
  { clave: "621", usoCfdiListado: ["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "S01", "CP01"] },
  { clave: "622", usoCfdiListado: ["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "S01", "CP01"] },
  { clave: "623", usoCfdiListado: ["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "S01", "CP01"] },
  { clave: "624", usoCfdiListado: ["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "S01", "CP01"] },
  { clave: "625", usoCfdiListado: ["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "S01", "CP01"] },
  { clave: "626", usoCfdiListado: ["G01", "G02", "G03", "I01", "I02", "I03", "I04", "I05", "I06", "I07", "I08", "S01", "CP01"] },
]

export const C_USO_CFDI = [
  { clave: 'G01', descripcion: 'Adquisición de mercancías' },
  { clave: 'G02', descripcion: 'Devoluciones, descuentos o bonificaciones' },
  { clave: 'G03', descripcion: 'Gastos en general' },
  { clave: 'I01', descripcion: 'Construcciones' },
  { clave: 'I02', descripcion: 'Mobilario y equipo de oficina por inversiones' },
  { clave: 'I03', descripcion: 'Equipo de transporte' },
  { clave: 'I04', descripcion: 'Equipo de computo y accesorios' },
  { clave: 'I05', descripcion: 'Dados, troqueles, moldes, matrices y herramental' },
  { clave: 'I06', descripcion: 'Comunicaciones telefónicas' },
  { clave: 'I07', descripcion: 'Comunicaciones satelitales' },
  { clave: 'I08', descripcion: 'Otra maquinaria y equipo' },
  { clave: 'D01', descripcion: 'Honorarios médicos, dentales y gastos hospitalarios' },
  { clave: 'D02', descripcion: 'Gastos médicos por incapacidad o discapacidad' },
  { clave: 'D03', descripcion: 'Gastos funerales' },
  { clave: 'D04', descripcion: 'Donativos' },
  { clave: 'D05', descripcion: 'Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)' },
  { clave: 'D06', descripcion: 'Aportaciones voluntarias al SAR' },
  { clave: 'D07', descripcion: 'Primas por seguros de gastos médicos' },
  { clave: 'D08', descripcion: 'Gastos de transportación escolar obligatoria' },
  { clave: 'D09', descripcion: 'Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones' },
  { clave: 'D10', descripcion: 'Pagos por servicios educativos (colegiaturas)' },
  { clave: 'S01', descripcion: 'Sin efectos fiscales' },
  { clave: 'CP01', descripcion: 'Pagos' },
  { clave: 'CN01', descripcion: 'Nómina' }
];

export const C_CONCEPTOS_SERVICIOS = [
  { clave: '78181501', descripcion: 'Servicio de pintura o reparación de carrocerías de vehículos', detalles: 'Servicios de hojalatería y pintura', compania_tipo_id: '01', clave_unidad_id: 'E48' },
]

export const C_PAIS = [
    { clave: '001', descripcion: 'méxico' }
]

export const C_ESTADOS = [
    { clave: '01', descripcion: 'aguascalientes', clave_pais: '001' },
    { clave: '02', descripcion: 'baja california', clave_pais: '001' },
    { clave: '03', descripcion: 'baja california Sur', clave_pais: '001' },
    { clave: '04', descripcion: 'campeche', clave_pais: '001' },
    { clave: '05', descripcion: 'coahuila', clave_pais: '001' },
    { clave: '06', descripcion: 'colima', clave_pais: '001' },
    { clave: '07', descripcion: 'chiapas', clave_pais: '001' },
    { clave: '08', descripcion: 'chihuahua', clave_pais: '001' },
    { clave: '09', descripcion: 'ciudad de méxico', clave_pais: '001' },
    { clave: '10', descripcion: 'durango', clave_pais: '001' },
    { clave: '11', descripcion: 'guanajuato', clave_pais: '001' },
    { clave: '12', descripcion: 'guerrero', clave_pais: '001' },
    { clave: '13', descripcion: 'hidalgo', clave_pais: '001' },
    { clave: '14', descripcion: 'jalisco', clave_pais: '001' },
    { clave: '15', descripcion: 'méxico', clave_pais: '001' },
    { clave: '16', descripcion: 'michoacán', clave_pais: '001' },
    { clave: '17', descripcion: 'morelos', clave_pais: '001' },
    { clave: '18', descripcion: 'nayarit', clave_pais: '001' },
    { clave: '19', descripcion: 'nuevo león', clave_pais: '001' },
    { clave: '20', descripcion: 'oaxaca', clave_pais: '001' },
    { clave: '21', descripcion: 'puebla', clave_pais: '001' },
    { clave: '22', descripcion: 'querétaro', clave_pais: '001' },
    { clave: '23', descripcion: 'quintana roo', clave_pais: '001' },
    { clave: '24', descripcion: 'san luis potosí', clave_pais: '001' },
    { clave: '25', descripcion: 'sinaloa', clave_pais: '001' },
    { clave: '26', descripcion: 'sonora', clave_pais: '001' },
    { clave: '27', descripcion: 'tabasco', clave_pais: '001' },
    { clave: '28', descripcion: 'tamaulipas', clave_pais: '001' },
    { clave: '29', descripcion: 'tlaxcala', clave_pais: '001' },
    { clave: '30', descripcion: 'veracruz', clave_pais: '001' },
    { clave: '31', descripcion: 'yucatán', clave_pais: '001' },
    { clave: '32', descripcion: 'zacatecas', clave_pais: '001' }
]
