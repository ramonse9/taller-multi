import { QueryRunner } from "typeorm";
import { SeederBase } from "./seederBase";
import * as bcrypt from 'bcrypt';
import { marcasSeed } from "../data/marcasSeed";
import { modelosSeed } from "../data/modelosSeed";
import { provisionTenantSchema } from '../../tenant/tenant-schema.provisioner';

export class schemaPublicFill extends SeederBase{

    name = 'schemaPublicSeed';
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        
        /*sat_CLAVES_UNIDADES*/
        await queryRunner.query(`
            INSERT INTO public.pub_sat_claves_unidades (clave, nombre, descripcion, nota) VALUES
            ('E48', 'Servicio', 'Unidad de conteo que define el número de unidades de servicio (unidad de servicio: definido período / propiedad / centro / utilidad de alimentación).', ''),
            ('H87', 'Pieza', 'Unidad de conteo que define el número de piezas (pieza: un solo artículo, artículo o ejemplar).', ''),
            ('LTR', 'Litro', 'Es una unidad de volumen equivalente a un decímetro cúbico (1 dm³). Su uso es aceptado en el Sistema Internacional de Unidades (SI), aunque ya no pertenece estrictamente a él.', ''),
            ('KGM', 'Kilogramo', 'Una unidad de masa igual a mil gramos.', ''),
            ('MTR', 'Metro', 'El metro (símbolo m) es la principal unidad de longitud del Sistema Internacional de Unidades. Un metro es la distancia que recorre la luz en el vacío en un intervalo de 1/299 792 458 de segundo.', '');
        `)

        /*sat_TIPOS_PERSONAS*/
        await queryRunner.query(`
            INSERT INTO public.pub_sat_tipos_personas (tipo, retenciones) VALUES
                ('fisica', false),
                ('moral', true)
        `)

         /*sat_RETENCIONES_ISR*/
        await queryRunner.query(`
            INSERT INTO public.pub_sat_retenciones_isr ( id, porcentaje) VALUES
                ('01', 0),
                ('02', 1.25),
                ('03', 10)
        `)

        /*sat_RETENCIONES_IVA*/
        await queryRunner.query(`
            INSERT INTO public.pub_sat_retenciones_iva ( id, porcentaje) VALUES
                ('01', 0),
                ('02', 10.6667)
        `)

        /*sat_TIPOS_PRODUCTOS_SERVICIOS*/
        await queryRunner.query(`
            INSERT INTO public.pub_sat_tipos_productos_servicios (tipo) VALUES
                ('producto'),
                ('servicio')
        `)

        /*COMPANIAS_TIPOS_GIROS*/
        await queryRunner.query(`
            INSERT INTO public.pub_companias_tipos_giros (tipo) VALUES 
                ('carroceria'), 
                ('multiservicios'),
                ('mecanico')
        `)

        /*sat_REGIMENES_FISCALES*/
        await queryRunner.query(`
            INSERT INTO public.pub_sat_regimenes_fiscales (clave, descripcion, fisica, moral) VALUES
                ( '601', 'General de Ley Personas Morales', false, true),
                ( '603', 'Personas Morales con Fines no Lucrativos', false, true),
                ( '605', 'Sueldos y Salarios e Ingresos Asimilados a Salarios', true, false),
                ( '606', 'Arrendamiento', true, false),
                ( '607', 'Régimen de Enajenación o Adquisición de Bienes', true, false),
                ( '608', 'Demás ingresos', true, false),
                ( '610', 'Residentes en el Extranjero sin Establecimiento Permanente en México', true, true),
                ( '611', 'Ingresos por Dividendos (socios y accionistas)', true, false),
                ( '612', 'Personas Físicas con Actividades Empresariales y Profesionales', true, false),
                ( '614', 'Ingresos por intereses', true, false),
                ( '615', 'Régimen de los ingresos por obtención de premios', true, false),
                ( '616', 'Sin obligaciones fiscales', true, false),
                ( '620', 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos', false, true),
                ( '621', 'Incorporación Fiscal', true, false),
                ( '622', 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras', false, true),
                ( '623', 'Opcional para Grupos de Sociedades', false, true),
                ( '624', 'Coordinados', false, true),
                ( '625', 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', true, false),
                ( '626', 'Régimen Simplificado de Confianza', true, true);
        `)

        /*sat_USO_CFDI*/
        await queryRunner.query(`
            INSERT INTO public.pub_sat_uso_cfdi (clave, descripcion, fisica, moral) VALUES
                ('G01', 'Adquisición de mercancías.', true, true),
                ('G02', 'Devoluciones, descuentos o bonificaciones.', true, true),
                ('G03', 'Gastos en general.', true, true),
                ('I01', 'Construcciones.', true, true),
                ('I02', 'Mobiliario y equipo de oficina por inversiones.', true, true),
                ('I03', 'Equipo de transporte.', true, true),
                ('I04', 'Equipo de computo y accesorios.', true, true),
                ('I05', 'Dados, troqueles, moldes, matrices y herramental.', true, true),
                ('I06', 'Comunicaciones telefónicas.', true, true),
                ('I07', 'Comunicaciones satelitales.', true, true),
                ('I08', 'Otra maquinaria y equipo.', true, true),
                ('D01', 'Honorarios médicos, dentales y gastos hospitalarios.', true, false),
                ('D02', 'Gastos médicos por incapacidad o discapacidad.', true, false),
                ('D03', 'Gastos funerales.', true, false),
                ('D04', 'Donativos.', true, false),
                ('D05', 'Intereses reales pagados por créditos hipotecarios.', true, false),
                ('D06', 'Aportaciones voluntarias al SAR.', true, false),
                ('D07', 'Primas por seguros de gastos médicos.', true, false),
                ('D08', 'Gastos de transportación escolar obligatoria.', true, false),
                ('D09', 'Depósitos en cuentas de ahorro o planes de pensiones.', true, false),
                ('D10', 'Pagos por servicios educativos (colegiaturas).', true, false),
                ('S01', 'Sin efectos fiscales.', true, true),
                ('CP01', 'Pagos', true, true),
                ('CN01', 'Nómina', true, false);
        `)

        await queryRunner.query(`
            INSERT INTO public.pub_sat_uso_cfdi_regimen_fiscal (clave_sat_uso_cfdi, clave_sat_regimen_fiscal) VALUES
            -- G01
            ('G01', '601'), ('G01', '603'), ('G01', '606'), ('G01', '612'), ('G01', '620'),
            ('G01', '621'), ('G01', '622'), ('G01', '623'), ('G01', '624'), ('G01', '625'), ('G01', '626'),

            -- G02
            ('G02', '601'), ('G02', '603'), ('G02', '606'), ('G02', '612'), ('G02', '616'),
            ('G02', '620'), ('G02', '621'), ('G02', '622'), ('G02', '623'), ('G02', '624'), ('G02', '625'), ('G02', '626'),

            -- G03
            ('G03', '601'), ('G03', '603'), ('G03', '606'), ('G03', '612'), ('G03', '620'),
            ('G03', '621'), ('G03', '622'), ('G03', '623'), ('G03', '624'), ('G03', '625'), ('G03', '626'),

            -- I01
            ('I01', '601'), ('I01', '603'), ('I01', '606'), ('I01', '612'), ('I01', '620'),
            ('I01', '621'), ('I01', '622'), ('I01', '623'), ('I01', '624'), ('I01', '625'), ('I01', '626'),

            -- I02
            ('I02', '601'), ('I02', '603'), ('I02', '606'), ('I02', '612'), ('I02', '620'),
            ('I02', '621'), ('I02', '622'), ('I02', '623'), ('I02', '624'), ('I02', '625'), ('I02', '626'),

            -- I03
            ('I03', '601'), ('I03', '603'), ('I03', '606'), ('I03', '612'), ('I03', '620'),
            ('I03', '621'), ('I03', '622'), ('I03', '623'), ('I03', '624'), ('I03', '625'), ('I03', '626'),

            -- I04
            ('I04', '601'), ('I04', '603'), ('I04', '606'), ('I04', '612'), ('I04', '620'),
            ('I04', '621'), ('I04', '622'), ('I04', '623'), ('I04', '624'), ('I04', '625'), ('I04', '626'),

            -- I05
            ('I05', '601'), ('I05', '603'), ('I05', '606'), ('I05', '612'), ('I05', '620'),
            ('I05', '621'), ('I05', '622'), ('I05', '623'), ('I05', '624'), ('I05', '625'), ('I05', '626'),

            -- I06
            ('I06', '601'), ('I06', '603'), ('I06', '606'), ('I06', '612'), ('I06', '620'),
            ('I06', '621'), ('I06', '622'), ('I06', '623'), ('I06', '624'), ('I06', '625'), ('I06', '626'),

            -- I07
            ('I07', '601'), ('I07', '603'), ('I07', '606'), ('I07', '612'), ('I07', '620'),
            ('I07', '621'), ('I07', '622'), ('I07', '623'), ('I07', '624'), ('I07', '625'), ('I07', '626'),

            -- I08
            ('I08', '601'), ('I08', '603'), ('I08', '606'), ('I08', '612'), ('I08', '620'),
            ('I08', '621'), ('I08', '622'), ('I08', '623'), ('I08', '624'), ('I08', '625'), ('I08', '626'),

            -- D01
            ('D01', '605'), ('D01', '606'), ('D01', '608'), ('D01', '611'), ('D01', '612'),
            ('D01', '614'), ('D01', '607'), ('D01', '615'), ('D01', '625'),

            -- D02
            ('D02', '605'), ('D02', '606'), ('D02', '608'), ('D02', '611'), ('D02', '612'),
            ('D02', '614'), ('D02', '607'), ('D02', '615'), ('D02', '625'),

            -- D03
            ('D03', '605'), ('D03', '606'), ('D03', '608'), ('D03', '611'), ('D03', '612'),
            ('D03', '614'), ('D03', '607'), ('D03', '615'), ('D03', '625'),

            -- D04
            ('D04', '605'), ('D04', '606'), ('D04', '608'), ('D04', '611'), ('D04', '612'),
            ('D04', '614'), ('D04', '607'), ('D04', '615'), ('D04', '625'),

            -- D05
            ('D05', '605'), ('D05', '606'), ('D05', '608'), ('D05', '611'), ('D05', '612'),
            ('D05', '614'), ('D05', '607'), ('D05', '615'), ('D05', '625'),

            -- D06
            ('D06', '605'), ('D06', '606'), ('D06', '608'), ('D06', '611'), ('D06', '612'),
            ('D06', '614'), ('D06', '607'), ('D06', '615'), ('D06', '625'),

            -- D07
            ('D07', '605'), ('D07', '606'), ('D07', '608'), ('D07', '611'), ('D07', '612'),
            ('D07', '614'), ('D07', '607'), ('D07', '615'), ('D07', '625'),

            -- D08
            ('D08', '605'), ('D08', '606'), ('D08', '608'), ('D08', '611'), ('D08', '612'),
            ('D08', '614'), ('D08', '607'), ('D08', '615'), ('D08', '625'),

            -- D09
            ('D09', '605'), ('D09', '606'), ('D09', '608'), ('D09', '611'), ('D09', '612'),
            ('D09', '614'), ('D09', '607'), ('D09', '615'), ('D09', '625'),

            -- D10
            ('D10', '605'), ('D10', '606'), ('D10', '608'), ('D10', '611'), ('D10', '612'),
            ('D10', '614'), ('D10', '607'), ('D10', '615'), ('D10', '625'),

            -- S01
            ('S01', '601'), ('S01', '603'), ('S01', '605'), ('S01', '606'), ('S01', '608'),
            ('S01', '610'), ('S01', '611'), ('S01', '612'), ('S01', '614'), ('S01', '616'),
            ('S01', '620'), ('S01', '621'), ('S01', '622'), ('S01', '623'), ('S01', '624'),
            ('S01', '607'), ('S01', '615'), ('S01', '625'), ('S01', '626'),

            -- CP01
            ('CP01', '601'), ('CP01', '603'), ('CP01', '605'), ('CP01', '606'), ('CP01', '608'),
            ('CP01', '610'), ('CP01', '611'), ('CP01', '612'), ('CP01', '614'), ('CP01', '616'),
            ('CP01', '620'), ('CP01', '621'), ('CP01', '622'), ('CP01', '623'), ('CP01', '624'),
            ('CP01', '607'), ('CP01', '615'), ('CP01', '625'), ('CP01', '626'),

            -- CN01
            ('CN01', '605');
        `);
              
        /* sat_FORMAS_PAGOS*/
        await queryRunner.query(`
            insert into public.pub_sat_formas_pagos ( clave, descripcion, bancarizado ) values
			('01', 'Efectivo', false),
			('02', 'Cheque nominativo', true),
			('03', 'Transferencia electrónica de fondos', true),
			('04', 'Tarjeta de crédito', true),
			('05', 'Monedero electrónico', true),
			('06', 'Dinero electrónico',	true),
			('08', 'Vales de despensa', false),
			('12', 'Dación en pago',	false),
			('13', 'Pago por subrogación', false),
			('14', 'Pago por consignación', false),
			('15', 'Condonación', false),
			('17', 'Compensación', false),
			('23', 'Novación', false),
			('24', 'Confusión', false),
			('25', 'Remisión de deuda', false),
			('26', 'Prescripción o caducidad', false),
			('27', 'A satisfacción del acreedor', false),
			('28', 'Tarjeta de débito', true),
			('29', 'Tarjeta de servicios', true),
			('30', 'Aplicación de anticipos', false),
			('31', 'Intermediario pagos', false),
			('99', 'Por definir', false)
        `)
        
        /* sat_MONEDAS*/
        await queryRunner.query(`
        	insert into public.pub_sat_monedas (clave, descripcion ) values
			('MXN', 'Peso Mexicano'),
            ('USD',	'Dólar americano'),
            ('CAD',	'Dólar Canadiense')
        `)
        
        /* sat_EXPORTACIONES*/
        await queryRunner.query(`
			insert into public.pub_sat_exportaciones (clave, descripcion ) values
                ('01', 'No aplica'),
                ('02', 'Definitiva con clave A1'),
                ('03', 'Temporal'),
                ('04', 'Definitiva con clave distinta a A1 o cuando no existe enajenación en términos del CFF')
        `)

        /* sat_TIPOS_COMPROBANTES*/
        await queryRunner.query(`
			insert into public.pub_sat_tipos_comprobantes (clave, descripcion ) values
                ('I', 'Ingreso'),
                ('E', 'Egreso'),
                ('T', 'Traslado'),
                ('N', 'Nómina'),
                ('P', 'Pago')
        `)

        /* sat_METODOS_DE_PAGOS*/
        await queryRunner.query(`
			insert into public.pub_sat_metodos_pagos (clave, descripcion ) values
			('PUE', 'Pago en una sola exhibición'),
            ('PPD', 'Pago en parcialidades o diferido')
        `)

        /* sat_IMPUESTOS  */
        await queryRunner.query(`
            INSERT INTO public.pub_sat_impuestos (clave, descripcion, retencion, traslado) VALUES               
                ('001', 'ISR', true, false),
                ('002', 'IVA', true, true),
                ('003', 'IEPS', true, true);
        `)

        /* sat_IMPUESTOS_PORCENTAJES  */
        await queryRunner.query(`
            INSERT INTO public.pub_sat_impuestos_porcentajes (clave, descripcion, tasa, tipo, operacion) VALUES
                ('iva_rate', 'Impuesto al Valor Agregado (IVA) 16%', 0.16, 'TRASLADO', 'SUMA'),
                ('isr_retention_pf_actividad_empresarial', 'Retención de ISR para PF con Actividad Empresarial 10%', 0.10, 'RETENCION', 'RESTA'),
                ('isr_retention_pf_resico', 'Retención de ISR para PF en RESICO 1.25%', 0.0125, 'RETENCION', 'RESTA'),
                ('iva_retention_rate', 'Retención de IVA para PF 10.6666% (2/3 de la tasa general)', 0.106666, 'RETENCION', 'RESTA');
        `)

        /* sat_OBJETOS_IMPUESTOS  */
        await queryRunner.query(`
            INSERT INTO public.pub_sat_objetos_impuestos (clave, descripcion) VALUES
                ('01', 'No objeto de impuesto.'),
                ('02', 'Sí objeto de impuesto.'),
                ('03', 'Sí objeto del impuesto y no obligado al desglose.'),
                ('04', 'Sí objeto del impuesto y no causa impuesto.'),
                ('05', 'Sí objeto del impuesto, IVA crédito PODEBI.'),
                ('06', 'Sí objeto del IVA, No traslado IVA.'),
                ('07', 'No traslado del IVA, Sí desglose IEPS.'),
                ('08', 'No traslado del IVA, No desglose IEPS.');
        `)

        /* sat_TIPOS_RELACIONES  */
        await queryRunner.query(`
            INSERT INTO public.pub_sat_tipos_relaciones (clave, descripcion) VALUES
                ('01', 'Nota de crédito de los documentos relacionados'),
                ('02', 'Nota de débito de los documentos relacionados'),
                ('03', 'Devolución de mercancía sobre facturas o traslados previos'),
                ('04', 'Sustitución de los CFDI previos'),
                ('05', 'Traslados de mercancías facturados previamente'),
                ('06', 'Factura generada por los traslados previos'),
                ('07', 'CFDI por aplicación de anticipo');
        `)

        /* sat_CANCELACIONES_MOTIVOS  */
        await queryRunner.query(`
            INSERT INTO public.pub_sat_cancelaciones_motivos (clave, descripcion) VALUES
                ('01', 'Comprobante emitido con errores con relacion'),
                ('02', 'Comprobante emitido con errores sin relacion'),
                ('03', 'No se llevó acabo la operación'),
                ('04', 'Operación nominativa relacionada en una factura global')
        `)

        /* sat_PRODUCTOS_SERVICIOS*/
        await queryRunner.query(`                  
            INSERT INTO public.pub_sat_productos_servicios (id, clave, descripcion, palabras_similares, tipo_compania_tipo_giro, tipo_sat_tipo_producto_servicio, clave_sat_clave_unidad, clave_sat_objeto_impuesto) VALUES
                ('sps000001', '78181500', 'Servicios de mantenimiento y reparación de vehículos', 'Servicio de taller mecánico', 'multiservicios', 'servicio', 'E48', '02'),
                ('sps000002', '78181501', 'Servicio de pintura o reparación de carrocerías de vehículos', 'Servicios de hojalatería y pintura', 'carroceria', 'servicio', 'E48', '02'),
                ('sps000003', '15121501', 'Aceite motor', '', 'multiservicios', 'producto', 'LTR', '02'),
                ('sps000004', '15121504', 'Aceite hidráulico', '', 'multiservicios', 'producto', 'LTR', '02'),
                ('sps000005', '15121508', 'Aceite de transmisión', '', 'multiservicios', 'producto', 'LTR', '02'),
                ('sps000006', '15121509', 'Aceite de frenos', '', 'multiservicios', 'producto', 'LTR', '02'),
                ('sps000007', '15121807', 'Anticongelante', '', 'multiservicios', 'producto', 'LTR', '02'),
                ('sps000008', '40161500', 'Filtros', '', 'multiservicios', 'producto', 'H87', '02'),
                ('sps000009', '26101700', 'Accesorios y componentes de motor', '', 'multiservicios', 'producto', 'H87', '02'),
                ('sps000010', '25172000', 'Componentes de sistema de suspensión', '', 'multiservicios', 'producto', 'H87', '02'),
                ('sps000011', '25174000', 'Sistema de refrigeración de motor', '', 'multiservicios', 'producto', 'H87', '02'),
                ('sps000012', '25174200', 'Sistema de dirección', '', 'multiservicios', 'producto', 'H87', '02'),
                ('sps000013', '25171700', 'Sistemas de frenado y componentes', '', 'multiservicios', 'producto', 'H87', '02'),
                ('sps000014', '25172500', 'Neumáticos y cámaras de neumáticos', '', 'multiservicios', 'producto', 'H87', '02'),
                ('sps000015', '26111700', 'Baterías, pilas y accesorios', '', 'multiservicios', 'producto', 'H87', '02'),
                ('sps000016', '31171500', 'Rodamientos (Baleros)', 'Baleros', 'multiservicios', 'producto', 'H87', '02')
        `)

        /* COMPANIAS*/
        await queryRunner.query(`                   
            INSERT INTO public.pub_companias (id, nombre, schema, is_active, tipo_compania_tipo_giro, tipo_sat_tipo_persona, id_sat_retencion_isr, id_sat_retencion_iva ) VALUES            
            ('com000001', 'Development Rodriguez', 'dev_rodriguez', TRUE, 'multiservicios', 'fisica', '02', '02' )
        `)
        
        /* ZONAS_HORARIAS */
        await queryRunner.query(`
            INSERT INTO public.pub_zonas_horarias (clave, descripcion) VALUES
                ('America/Mazatlan', 'Hora de Mazatlán, Sinaloa.'),
                ('America/Mexico_City', 'Hora del Centro (CDMX).'),
                ('America/Monterrey', 'Hora de Monterrey, Nuevo León.'),
                ('America/Tijuana', 'Hora de Tijuana, Baja California.')
        `)
       
        /* Bootstrap administrator. Never keep deployable credentials in source. */
        const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
        const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
        if (!bootstrapEmail || !bootstrapPassword || bootstrapPassword.length < 12) {
            throw new Error('Define BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_PASSWORD (mínimo 12 caracteres) para inicializar la base de datos');
        }
        const bootstrapPasswordHash = bcrypt.hashSync(bootstrapPassword, 12);
        await queryRunner.query(
            `INSERT INTO public.pub_users
             (id, email, password, full_name, is_active, role, id_compania, clave_zona_horaria)
             VALUES ($1, $2, $3, $4, true, 'super', $5, $6)`,
            ['usu000001', bootstrapEmail, bootstrapPasswordHash, 'Administrador inicial', 'com000001', 'America/Mazatlan'],
        );

        // El tenant de arranque debe respetar el mismo invariante que el endpoint:
        // compañía registrada y schema completo dentro de una sola transacción.
        await provisionTenantSchema(queryRunner, 'dev_rodriguez');

        const usuarioSeed = 'usu000001';        
        
        
        /* Marcas Data */
        let ultimoIdMarca = 0
                
        const marcasConIdsArray = marcasSeed.map( (marca, index) => {

            const nuevoId = (ultimoIdMarca + index + 1).toString().padStart(6,'0');            
            return { id: `mar${nuevoId}`, nombre: marca.nombre }

        });

        const marcasConIdsInsert = marcasConIdsArray.map(marca => {           
            return `('${marca.id}', '${marca.nombre}', '${usuarioSeed}', '${usuarioSeed}')`;
        }).join(',\n');        
        
        await queryRunner.query(`
            INSERT INTO "public"."pub_marcas"(  "id", "nombre", "createdAtUser", "updatedAtUser" ) VALUES 
            ${marcasConIdsInsert}
        `)
        
        /* Modelos Data */
        let ultimoIdModelo = 0
        
        const modelosConIds = modelosSeed.map( (modelo, index) => {

            const nuevoId = (ultimoIdModelo + index + 1).toString().padStart(6,'0');

            const marca = marcasConIdsArray.find( marca => marca.nombre === modelo.marca )            
          
            return `('mod${nuevoId}', '${modelo.nombre}', '${marca.id}', '${usuarioSeed}', '${usuarioSeed}')`

        }).join(',\n'); 
        
        await queryRunner.query(`
            INSERT INTO "public"."pub_modelos"(  "id", "nombre", "id_marca", "createdAtUser", "updatedAtUser" ) VALUES 
            ${modelosConIds}
        `)

        /* SEED USERS */

        /*let ultimoIdUser = 0
        
        const usersConIds = usersData.map( (user, index) => {

            const nuevoId = (ultimoIdUser + index + 1).toString().padStart(6,'0');
            const pass = bcrypt.hashSync( user.password, 10 );
            
            return { id: `usu${nuevoId}`, ...user, password: pass }

        }).join(',\n'); 
        
        await queryRunner.query(`
            INSERT INTO "public"."users"(  "id", "email", "password", "fullname", "is_active", "roles", "id_compania" ) VALUES 
            ${usersConIds}
        `)*/

  

    }    
}
