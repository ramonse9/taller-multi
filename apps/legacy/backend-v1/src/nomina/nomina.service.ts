import { generarEntityId } from './../config/generarEntityId';
import { EnumNominaMovimientoEstatus, EnumPrefijoEntity } from './../commom/enums/general.enum';
import { User } from './../auth/entities/user.entity';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateNominaPeriodoDto } from './dto/create-nomina-periodo.dto';
import { EnumNominaPeriodicidad } from './../commom/enums/general.enum';
import { Between, DataSource, In, QueryFailedError } from 'typeorm';
import { NominaPeriodo } from './entities/nomina-periodo.entity';
import { NominaMovimiento } from './entities/nomina-movimiento.entity';
import { CreateNominaMovimientoDto } from './dto/create-nomina-movimiento.dto';
import { Empleado } from '../empleados/entities/empleado.entity';

interface Periodo {
  anio: number,
  periodicidad: EnumNominaPeriodicidad,
  nombre: string;
  fechaInicio: Date;
  fechaFin: Date;
}

@Injectable()
export class NominaService {

  constructor(
    private dataSource: DataSource
  ){

  }

  async createNominaPeriodos(createNominaPeriodoDto: CreateNominaPeriodoDto, user: User ){
    
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
          
      const repoNominaPeriodo = queryRunner.manager.getRepository(NominaPeriodo);

      const nominaPeriodos = this.generarPeriodos( 
          createNominaPeriodoDto.anio,
          createNominaPeriodoDto.fechaFinPrimerPeriodo,
          createNominaPeriodoDto.periodicidad,
          user
        )
          
      await repoNominaPeriodo.save( nominaPeriodos )
  
      await queryRunner.commitTransaction()

      return {
        año: createNominaPeriodoDto.anio,
        periodicidad: createNominaPeriodoDto.periodicidad
      }

    }catch(error){
    
      await queryRunner.rollbackTransaction();
      
      if( error instanceof NotFoundException ){
        throw error
      }

      if( error instanceof BadRequestException ){
        throw error
      }

      if( error instanceof QueryFailedError){       
    
        if( error.driverError?.code === '23503'){
          throw new BadRequestException('Error con las claves foráneas al guardar en Concepto')
        }

        throw new BadRequestException(error)
    
      }

      throw new InternalServerErrorException('')

    }finally{
      await queryRunner.release();
    }

  }

  async createNominaMovimiento(createNominaMovimientoDto: CreateNominaMovimientoDto, user: User ){
    
    const schema = user.compania.schema;
    
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoEmpleado = queryRunner.manager.getRepository( Empleado )

      const empleado = await repoEmpleado.findOneBy({id: createNominaMovimientoDto.id_empleado})
      
      if(!empleado){
        throw new NotFoundException(`No es posible guardar este movimiento por que el Empleado con el Id: ${ createNominaMovimientoDto.id_empleado } no existe`)
      }

      const repoNominaPeriodo = queryRunner.manager.getRepository( NominaPeriodo )

      const nominaPeriodo = await repoNominaPeriodo.findOneBy({id: createNominaMovimientoDto.id_periodo})
      
      if(!nominaPeriodo){
        throw new NotFoundException(`No es posible guardar este movimiento por que el Periodo con el Id: ${ createNominaMovimientoDto.id_periodo } no existe`)
      }

      const repoNominaMovimiento = queryRunner.manager.getRepository(NominaMovimiento);    
      
      const nuevoId = await generarEntityId( repoNominaMovimiento, EnumPrefijoEntity.MOVIMIENTOS );

      const nominaMovimiento = repoNominaMovimiento.create({
        id: nuevoId,
        salarioBase: Number( createNominaMovimientoDto.salarioBase ),
        totalPercepciones: Number( createNominaMovimientoDto.totalPercepciones ),
        totalDeducciones: Number( createNominaMovimientoDto.totalDeducciones ),
        totalNeto: Number( createNominaMovimientoDto.totalNeto ),
        fecha: new Date(createNominaMovimientoDto.fecha),
        estatus: EnumNominaMovimientoEstatus.ACTIVO,
        empleado: empleado,
        nominaPeriodo: nominaPeriodo,
        createdAtUser: user,
        updatedAtUser: user
      })

      const nominaMovimientoBD = await repoNominaMovimiento.save( nominaMovimiento );

      await queryRunner.commitTransaction();

      //const nominaMovimientoResponseDto = plainToInstance( NominaMovimientoResponseDto, nominaMovimientoBD, { excludeExtraneousValues: true } );
      //const nominaMovimientoResponseDto =  nominaMovimientoBD;

      return {
        id: nominaMovimientoBD.id
      };

    }catch(error){

      await queryRunner.rollbackTransaction();

      if(error instanceof NotFoundException ){
        throw error
      }

      if(error instanceof BadRequestException){
        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar guardar el Empleado: ${error}`)

    }finally{
      await queryRunner.release();
    }

  }  

  async getNominaPeriodosMes(mes: number, anio: number, user: any) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const fechaInicio = new Date(anio, mes - 1, 1);
      const fechaFin = new Date(anio, mes, 0, 23, 59, 59);

      // Buscamos los periodos y hacemos el join manual con NominaMovimiento
      const periodosConMontos = await queryRunner.manager.getRepository(NominaPeriodo)
        .createQueryBuilder('periodo')
        // Join manual: Relacionamos Movimiento con Periodo por el ID
        .leftJoin(NominaMovimiento, 'movimiento', 'movimiento.id_periodo = periodo.id')
        .select([
          'periodo.id AS id',
          'periodo.nombre AS nombre',
          'periodo.fechaInicio AS "fechaInicio"',
          'periodo.fechaFin AS "fechaFin"',
        ])
        .addSelect('SUM(COALESCE(movimiento.totalNeto, 0))', 'totalNeto')
        .addSelect('SUM(COALESCE(movimiento.totalPercepciones, 0))', 'totalPercepciones')
        .addSelect('SUM(COALESCE(movimiento.totalDeducciones, 0))', 'totalDeducciones')
        .where('periodo.fechaFin BETWEEN :inicio AND :fin', { inicio: fechaInicio, fin: fechaFin })
        .groupBy('periodo.id')
        .orderBy('periodo.fechaFin', 'ASC')
        .getRawMany();

      // Sumatoria total del mes (Gran Total)
      const granTotalMes = periodosConMontos.reduce((acc, curr) => {
        acc.neto += Number(curr.totalNeto);
        acc.percepciones += Number(curr.totalPercepciones);
        acc.deducciones += Number(curr.totalDeducciones);
        return acc;
      }, { neto: 0, percepciones: 0, deducciones: 0 });

      return {
        granTotalMes,
        periodos: periodosConMontos
      };

    } catch (error) {
      console.error('Error al obtener periodos del mes:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getNominaPeriodosMovimientosMes(user: any, idsPeriodos: number[]) {
    if (!idsPeriodos || idsPeriodos.length === 0) {
      return { granTotalMes: {}, cantidadPeriodos: 0, nominaPeriodos: [] };
    }

    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      // 1. Obtener repositorios
      const repoMovimiento = queryRunner.manager.getRepository(NominaMovimiento);
      const repoEmpleado = queryRunner.manager.getRepository(Empleado);
      const repoPeriodo = queryRunner.manager.getRepository(NominaPeriodo);

      // 2. Obtener TODOS los empleados activos (Master List)
      const empleadosActivos = await repoEmpleado.find({
        where: { activo: true }, // Ajusta según el nombre de tu enum de estatus
        order: { nombre: 'ASC' }
      });

      // 3. Obtener la info de los Periodos para las cabeceras
      const periodosInfo = await repoPeriodo.find({
        where: { id: In(idsPeriodos) },
        order: { fechaFin: 'ASC' }
      });

      // 4. Obtener movimientos existentes con sus detalles
      const movimientosExistentes = await repoMovimiento.find({
        where: { nominaPeriodo: { id: In(idsPeriodos) } },
        relations: ['empleado', 'nominaPeriodo', 'nominaMovimientoDetalles']
      });

      // 5. Crear un mapa para búsqueda rápida: "idPeriodo_idEmpleado" -> movimiento
      const mapaMovimientos = new Map<string, NominaMovimiento>();
      movimientosExistentes.forEach(m => {
        mapaMovimientos.set(`${m.nominaPeriodo.id}_${m.empleado.id}`, m);
      });

      const granTotalMes = { neto: 0, percepciones: 0, deducciones: 0 };

      // 6. Construir la respuesta recorriendo Periodos -> Empleados
      const nominaPeriodos = periodosInfo.map(periodo => {
        const totalPeriodo = { neto: 0, percepciones: 0, deducciones: 0 };
        
        const listaEmpleadosFinal = empleadosActivos.map(empleado => {
          // Buscamos si este empleado ya tiene movimiento en este periodo
          const mov = mapaMovimientos.get(`${periodo.id}_${empleado.id}`);
          
          const montoNeto = mov ? Number(mov.totalNeto) : 0;
          const montoPercepciones = mov ? Number(mov.totalPercepciones) : 0;
          const montoDeducciones = mov ? Number(mov.totalDeducciones) : 0;

          // Acumulamos a los totales
          totalPeriodo.neto += montoNeto;
          totalPeriodo.percepciones += montoPercepciones;
          totalPeriodo.deducciones += montoDeducciones;
          
          granTotalMes.neto += montoNeto;
          granTotalMes.percepciones += montoPercepciones;
          granTotalMes.deducciones += montoDeducciones;

          return {
            ...empleado, // Información completa del empleado
            movimiento: mov ? {
              id: mov.id,
              salarioBase: mov.salarioBase,
              totalPercepciones: montoPercepciones,
              totalDeducciones: montoDeducciones,
              totalNeto: montoNeto,
              fecha: mov.fecha,
              estatus: mov.estatus,
              detalles: mov.nominaMovimientoDetalles
            } : null // Si es null, el frontend sabe que debe mostrar el botón "Agregar Movimiento"
          };
        });

        return {
          id: periodo.id,
          nombre: periodo.nombre,
          rango: `${periodo.fechaInicio} - ${periodo.fechaFin}`,
          totalPeriodo,
          empleadosConMovimientos: listaEmpleadosFinal
        };
      });

      return {
        granTotalMes,
        cantidadPeriodos: idsPeriodos.length,
        nominaPeriodos
      };

    } catch (error) {
      console.error('Error al generar reporte:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getPeriodoMovimientos(user: any, idPeriodo: number) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const repoEmpleado = queryRunner.manager.getRepository(Empleado);
      const repoMovimiento = queryRunner.manager.getRepository(NominaMovimiento);

      // 1. Obtener empleados activos
      const empleados = await repoEmpleado.find({
        where: { activo: true },
        order: { nombre: 'ASC' }
      });

      // 2. Obtener movimientos de este periodo específico
      const movimientos = await repoMovimiento.find({
        where: { nominaPeriodo: { id: idPeriodo } },
        relations: ['empleado', 'nominaMovimientoDetalles']
      });

      // 3. Cruzar datos: Empleado + su movimiento (si existe)
      const detalleEmpleados = empleados.map(emp => {
        const mov = movimientos.find(m => m.empleado.id === emp.id);

        if(!mov){
          return { ...emp, movimiento: null }
        }

        const { empleado, ...movSinEmpleado } = mov

        return {
          ...emp,
          movimiento: movSinEmpleado
        };
      });

      return {
        idPeriodo,
        empleadosConMovimientos: detalleEmpleados
      };

    } catch (error) {
      console.error('Error al obtener detalle del periodo:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getPeriodosMovimientos(user: any, idsPeriodos: number[]) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const repoEmpleado = queryRunner.manager.getRepository(Empleado);
      const repoMovimiento = queryRunner.manager.getRepository(NominaMovimiento);
      const repoPeriodo = queryRunner.manager.getRepository(NominaPeriodo);

      // 1. Obtener los periodos solicitados
      const periodos = await repoPeriodo.find({
        where: { id: In(idsPeriodos) },
        order: { fechaInicio: 'ASC' }
      });

      // 2. Obtener todos los empleados activos
      const empleadosActivos = await repoEmpleado.find({
        where: { activo: true },
        order: { nombre: 'ASC' }
      });

      // 3. Obtener movimientos de esos periodos
      const movimientos = await repoMovimiento.find({
        where: { nominaPeriodo: { id: In(idsPeriodos) } },
        relations: ['empleado', 'nominaPeriodo']
      });

      let granTotalGeneral = 0;

      // 4. Agrupar: Para cada periodo, listar sus empleados y sus montos
      const reporteEstructurado = periodos.map(periodo => {
        let totalDelPeriodo = 0;

        const listaEmpleados = empleadosActivos.map(emp => {
          const mov = movimientos.find(m => 
            m.empleado.id === emp.id && m.nominaPeriodo.id === periodo.id
          );

          const neto = mov ? Number(mov.totalNeto) : 0;
          totalDelPeriodo += neto;

          return {
            id: emp.id,
            nombre: emp.nombre,
            salarioBase: emp.salarioBase,
            totalNeto: neto,
            fecha: mov ? mov.fecha : null
          };
        });

        granTotalGeneral += totalDelPeriodo;

        return {
          idPeriodo: periodo.id,
          nombrePeriodo: periodo.nombre,
          rangoFechas: `${periodo.fechaInicio} al ${periodo.fechaFin}`,
          totalPeriodo: totalDelPeriodo,
          empleados: listaEmpleados
        };
      });

      return {
        periodos: reporteEstructurado,
        granTotalGeneral: granTotalGeneral
      };

    } finally {
      await queryRunner.release();
    }
  }

  async getTotalesMovimientosUltimos6Meses(user: User) {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoMovimiento = queryRunner.manager.getRepository(NominaMovimiento);


      // 1. Definimos el punto de corte (hace 6 meses atrás)
      const fechaLimite = new Date();
      fechaLimite.setMonth(fechaLimite.getMonth() - 5);
      fechaLimite.setDate(1);

      // 2. Construimos la consulta extrayendo Año y Mes de la fechaFin del periodo
      const data = await repoMovimiento
        .createQueryBuilder('movimiento')
        .innerJoin('movimiento.nominaPeriodo', 'periodo')
        .select("EXTRACT(YEAR FROM periodo.fechaFin)", "anio")
        .addSelect("EXTRACT(MONTH FROM periodo.fechaFin)", "mes")
        .addSelect("SUM(movimiento.totalNeto)", "total")
        .where("periodo.fechaFin >= :fechaLimite", { fechaLimite })
        .andWhere("movimiento.estatus = :estatus", { estatus: EnumNominaMovimientoEstatus.ACTIVO }) // Opcional: filtrar solo activos
        //.groupBy("anio")
        //.addGroupBy("mes")
        .groupBy('EXTRACT(YEAR FROM periodo.fechaFin)')
        .addGroupBy('EXTRACT(MONTH FROM periodo.fechaFin)')
        .orderBy("anio", "ASC")
        .addOrderBy("mes", "ASC")
        .getRawMany();

      // 3. Formateamos la salida para asegurar números en lugar de strings
      return data.map(item => ({
        anio: parseInt(item.anio),
        mes: parseInt(item.mes),
        total: parseFloat(item.total)
      }));

      /*
      const repoGasto = queryRunner.manager.getRepository(Gasto);

      // Fecha actual
      const hoy = new Date();
      // Fecha de inicio: hace 6 meses
      const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
      const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

      // Query agrupando por mes y año
      const resultados = await repoGasto.createQueryBuilder('gasto')
        .select([
          `EXTRACT(YEAR FROM gasto.fecha) AS anio`,
          `EXTRACT(MONTH FROM gasto.fecha) AS mes`,
          `SUM(gasto.monto) AS total`
        ])
        .where('gasto.fecha BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
        .groupBy('anio')
        .addGroupBy('mes')
        .orderBy('anio', 'ASC')
        .addOrderBy('mes', 'ASC')
        .getRawMany();

      // Normalizar salida: convertir a objetos con mes, año y total
      const totalesPorMes = resultados.map(r => ({
        anio: Number(r.anio),
        mes: Number(r.mes),
        total: Number(r.total)
      }));

      return totalesPorMes;*/

    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return `This action returns all nomina`;
  }

  findOne(id: number) {
    return `This action returns a #${id} nomina`;
  }
  
  remove(id: number) {
    return `This action removes a #${id} nomina`;
  }

  generarPeriodos(
    year: number,
    fechaFinPrimerPeriodoStr: string,
    enumPeriodicidad: EnumNominaPeriodicidad,
    user: User
  ) {
    let diasPeriodo = (enumPeriodicidad === EnumNominaPeriodicidad.SEMANAL) ? 7 : 14;

    const periodos: any[] = [];
    // Usamos el 31 de diciembre del año solicitado como límite
    const endOfYear = new Date(year, 11, 31); 

    let numero = 1;

    // 1. Parsear la fecha recibida ignorando la zona horaria (usando solo los componentes YYYY-MM-DD)
    // Esto evita que "2026-01-03T00:00:00Z" se convierta en el día anterior por el desfase horario
    const [y, m, d] = fechaFinPrimerPeriodoStr.split('T')[0].split('-').map(Number);
    let fechaFin = new Date(y, m - 1, d);

    // 2. Calcular inicio (Si termina Sábado, resta 6 días para que sea Domingo)
    let fechaInicio = new Date(fechaFin);
    fechaInicio.setDate(fechaFin.getDate() - (diasPeriodo - 1));

    while (fechaFin.getFullYear() <= year) {
      // Si la fecha fin ya se pasó al siguiente año, detenemos el ciclo
      if (fechaFin.getFullYear() > year && periodos.length > 0) break;

      periodos.push({
        anio: year,
        periodicidad: enumPeriodicidad,
        nombre: `Periodo ${numero}`,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        createdAtUser: user,
        updatedAtUser: user
      });

      numero++;

      // Calcular el siguiente Domingo
      fechaInicio = new Date(fechaFin);
      fechaInicio.setDate(fechaFin.getDate() + 1);

      // Calcular el siguiente Sábado
      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaInicio.getDate() + (diasPeriodo - 1));
    }

    return periodos;
  }


  generarPeriodosOLD(
    year: number,
    fechaFinPrimerPeriodo: string,
    enumPeriodicidad: EnumNominaPeriodicidad,
  ) {

    let diasPeriodo = 0

    if( enumPeriodicidad == EnumNominaPeriodicidad.SEMANAL ){
      diasPeriodo = 7;
    }

    if( enumPeriodicidad == EnumNominaPeriodicidad.CATORCENAL_1 || enumPeriodicidad == EnumNominaPeriodicidad.CATORCENAL_2){
      diasPeriodo = 14;
    }

    const periodos: Periodo[] = [];    

    const endOfYear = new Date(year, 11, 31);

    let numero = 1;

    // calcular inicio del primer periodo
    let fechaFin = new Date(fechaFinPrimerPeriodo);
    let fechaInicio = new Date(fechaFinPrimerPeriodo);
    fechaInicio.setDate(fechaInicio.getDate() - (diasPeriodo - 1));    

    while (fechaFin <= endOfYear) {

      const periodoFin = new Date(fechaFin);

      periodos.push({
        anio: year,
        periodicidad: enumPeriodicidad,
        nombre: `Periodo ${numero}`,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(periodoFin),
      });
      
      numero++;

      fechaInicio = new Date(fechaFin);
      fechaInicio.setDate(fechaInicio.getDate() + 1);

      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + (diasPeriodo - 1));
    }

    return periodos;
  }

}
