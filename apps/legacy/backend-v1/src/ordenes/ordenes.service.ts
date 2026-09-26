import { UpdateOrdenEstatusResponseDto } from './dto/update-orden-estatus-response.dto';
import { EnumEstatusOrden, EnumEstatusOrdenFactura, EnumOrdenConceptoTipo, EnumPrefijoEntity } from './../commom/enums/general.enum';
import { ProductoServicio } from './../productos-servicios/entities/producto-servicio.entity';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource, In, QueryRunner } from 'typeorm';
import { CreateOrdenDto } from './dto/create-orden.dto';
import { UpdateOrdenDto } from './dto/update-orden.dto';
import { Orden } from './entities/orden.entity';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { OrdenNota } from './entities/orden_nota.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { ImageService } from '../image/image.service';
import { OrdenNotaImagen } from './entities/orden_nota_imagen.entity';
import { CreateOrdenNotaDescripcionDto } from './dto/create-orden-nota-descripcion.dto';
import { UpdateOrdenEstatusDto } from './dto/update-orden-estatus.dto';
import { User } from '../auth/entities/user.entity';
import { generarEntityId } from '../config/generarEntityId';
import { OrdenConcepto } from './entities/orden_concepto.entity';
import { CreateOrdenConceptoDto } from './dto/create-orden-concepto.dto';
import { UpdateOrdenPagoDto } from './dto/update-orden-pago.dto';
import { Modelo } from '../modelos/entities/modelo.entity';
import { Producto } from '../productos/entities/producto.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { InventarioFifoService } from '../inventario/services/inventario-fifo.service';
import { InventarioSnapshotsService } from '../inventario/services/inventario-snapshots.service';

export interface MontosConcepto{
  subtotalCosto: number;
  subtotalVenta: number;
  utilidad: number;
}

@Injectable()
export class OrdenesService {

  constructor(    
    private readonly imageService: ImageService,
    private dataSource: DataSource,
    private readonly fifoService: InventarioFifoService,
    private readonly snapshotsService: InventarioSnapshotsService,
  ){}

  async createWithNota(createOrdenDto: CreateOrdenDto, user: User) {

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect()

    await queryRunner.startTransaction();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      if (!createOrdenDto.conceptos || createOrdenDto.conceptos.length === 0) {
        throw new NotFoundException(`Debes especificar al menos un concepto`)
      }

      //Vehiculo
      const repoVehiculo = queryRunner.manager.getRepository(Vehiculo);

      let vehiculo = null

      if(createOrdenDto.vehiculoForm){

        if( !createOrdenDto.vehiculoForm.numeroSerie ){
          throw new BadRequestException(`Debes ingresar el Número de Serie`)
        }
        
        const numeroSerieRegistradoPreviamente = await repoVehiculo.findOneBy({numeroSerie: createOrdenDto.vehiculoForm.numeroSerie.toLowerCase()})        
        
        if( numeroSerieRegistradoPreviamente ){
          throw new BadRequestException(`El Número de Serie ingresado ya fué registrado con el vehículo: ${ numeroSerieRegistradoPreviamente.id }`)
        }
                    
        const repoModelo = queryRunner.manager.getRepository(Modelo);
  
        const modelo = await repoModelo.findOneBy({ id: createOrdenDto.vehiculoForm.id_modelo })
  
        if( !modelo ){
          throw new NotFoundException(`El modelo con el Id: ${createOrdenDto.vehiculoForm.id_modelo} no existe`)
        }
        
        const nuevoIdVehiculo = await generarEntityId( repoVehiculo, EnumPrefijoEntity.VEHICULOS )
        
        const nuevoVehiculo = repoVehiculo.create({
          ...createOrdenDto.vehiculoForm,
          modelo: modelo,
          id: nuevoIdVehiculo,
          createdAtUser: user,
          updatedAtUser: user
        })

        vehiculo = await queryRunner.manager.save( nuevoVehiculo )

      }else if( createOrdenDto.id_vehiculo ){

        vehiculo = await repoVehiculo.findOneBy({id:createOrdenDto.id_vehiculo.toLowerCase()});

        if(!vehiculo){
          throw new NotFoundException(`El vehículo con el ID: ${createOrdenDto.id_vehiculo} no existe`)
        }

      }else{
        throw new NotFoundException(`Debes proporcionar el Id del Vehículo o los datos del nuevo Vehículo`)
      }

      //Cliente
      const repoCliente = queryRunner.manager.getRepository(Cliente);
        
      let cliente = null

      if(createOrdenDto.clienteForm){
        const nuevoIdCliente = await generarEntityId( repoCliente, EnumPrefijoEntity.CLIENTES )
        
        const nuevoCliente = repoCliente.create({
          ...createOrdenDto.clienteForm,
          id: nuevoIdCliente,
          createdAtUser: user,
          updatedAtUser: user
        })

        cliente = await queryRunner.manager.save( nuevoCliente )

      }else if( createOrdenDto.id_cliente ){

        cliente = await repoCliente.findOneBy({id:createOrdenDto.id_cliente.toLowerCase()});

        if(!cliente){
          throw new NotFoundException(`El cliente con el ID: ${createOrdenDto.id_cliente} no existe`)
        }

      }
      //else{
      //  throw new NotFoundException(`Debes proporcionar el Id del Cliente o los datos del nuevo Cliente`)
      //}

      //Empresa
      const repoEmpresa = queryRunner.manager.getRepository(Empresa);
        
      let empresa = null

      if(createOrdenDto.empresaForm){
        const nuevoIdEmpresa = await generarEntityId( repoEmpresa, EnumPrefijoEntity.EMPRESAS )
        
        const nuevoEmpresa = repoEmpresa.create({
          ...createOrdenDto.empresaForm,
          id: nuevoIdEmpresa,
          createdAtUser: user,
          updatedAtUser: user
        })

        empresa = await queryRunner.manager.save( nuevoEmpresa )

      }else if( createOrdenDto.id_empresa ){

        empresa = await repoEmpresa.findOneBy({id:createOrdenDto.id_empresa.toLowerCase()});

        if(!empresa){
          throw new NotFoundException(`El empresa con el ID: ${createOrdenDto.id_empresa} no existe`)
        }

      }
      //else{
      //  throw new NotFoundException(`Debes proporcionar el Id de la Empresa o los datos de la nueva Empresa`)
      //}

      if( !cliente && !empresa){
        throw new NotFoundException(`Debes indicar un cliente o una empresa para la orden`)
      }

      const repoOrden = queryRunner.manager.getRepository(Orden);

      const nuevoId = await generarEntityId( repoOrden, EnumPrefijoEntity.ORDENES )

      const nuevaOrden = repoOrden.create({
        id: nuevoId,
        vehiculo: vehiculo,
        cliente: cliente,
        empresa: empresa,
        descripcion: createOrdenDto.descripcion,
        fechaIngreso: new Date( createOrdenDto.fechaIngreso ),
        //fechaEntregaEstimada: new Date( createOrdenDto.fechaEntregaEstimada ),
        fechaEntregaReal: createOrdenDto.fechaEntregaReal ? new Date(createOrdenDto.fechaEntregaReal) : null,
        kilometros: createOrdenDto.kilometros,
        poliza: createOrdenDto.poliza,
        siniestro: createOrdenDto.siniestro,
        folioNota: createOrdenDto.folioNota,
        //...createOrdenDto,
        estatus: EnumEstatusOrden.PROCESO,
        estatusFactura: EnumEstatusOrdenFactura.PENDIENTE,
        liquidacionFactura: false,
        createdAtUser: user,
        updatedAtUser: user
      });      
      
      console.log( "nuevaOrden:" )
      console.log( nuevaOrden )
      
      const ordenGuardada = await queryRunner.manager.save( nuevaOrden )

      const repoOrdenNota = queryRunner.manager.getRepository(OrdenNota);
      
      const nuevaNota = repoOrdenNota.create({
        orden: ordenGuardada,
        nota: 'Recepción.',
        estatus: EnumEstatusOrden.PROCESO,
        createdAtUser: user,
        updatedAtUser: user
      })

      await queryRunner.manager.save(nuevaNota)

      let subtotalCosto = 0;
      let subtotalVenta = 0;
      let utilidad = 0;

      /* CONCEPTOS  */
      if (createOrdenDto.conceptos && createOrdenDto.conceptos.length > 0) {
        for (const dto of createOrdenDto.conceptos) {

          const montos = await this.procesarConceptoTransaccional(queryRunner, ordenGuardada, dto);
          subtotalCosto += montos.subtotalCosto;
          subtotalVenta += montos.subtotalVenta;
          utilidad += montos.utilidad;

        }
      }     

      const montosOrden = {
        subtotalCosto,
        subtotalVenta,
        utilidad
      }

      await queryRunner.manager.update(Orden, nuevaOrden.id, montosOrden);

      await queryRunner.commitTransaction()

      return {
        id: ordenGuardada.id
      }

    }catch(error){      

      await queryRunner.rollbackTransaction();

      if( error instanceof NotFoundException ){
        throw error
      }

      if( error instanceof BadRequestException){
        throw error
      }      
      
      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar crear la Orden: ${error}`)
    }finally{
      await queryRunner.release();
    }

  }

  async createNotaWithImagenes(createOrdenNotaDescripcionDto: CreateOrdenNotaDescripcionDto, user: User, files?: Express.Multer.File[] ){
  //async createNotaWithImagenes(createOrdenNotaDescripcionDto: CreateOrdenNotaDescripcionDto, user: User, files?: any[] ){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoOrden = queryRunner.manager.getRepository(Orden);            
      
      const ordenCount = await repoOrden.count({ where: {id: createOrdenNotaDescripcionDto.id_orden }});

      if( ordenCount === 0){
        throw new NotFoundException(`Orden con ID ${createOrdenNotaDescripcionDto.id_orden} no encontrada.`)
      }

      let numeroImagenes = ''
      if( files?.length ){
        numeroImagenes = files.length === 1 ?  `. Se subió 1 imagen.` : `. Se subieron ${files.length} imágenes.`
      }      

      const repoOrdenNota = queryRunner.manager.getRepository(OrdenNota)

      const nuevaNota = repoOrdenNota.create({
        orden: { id: createOrdenNotaDescripcionDto.id_orden } as Orden,
        nota: `${createOrdenNotaDescripcionDto.nota}${numeroImagenes}`,
        estatus: null, 
        createdAtUser: user,
        updatedAtUser: user
      })
      
      const notaGuardada = await queryRunner.manager.save( nuevaNota )

      if( files?.length ){

        const imagenesCloudinary =  await this.imageService.uploadImages(files)

        const repoOrdenNotaImagen = queryRunner.manager.getRepository( OrdenNotaImagen );

        const imagenesNotas = imagenesCloudinary.map( (img) => 
          repoOrdenNotaImagen.create({        
            nota: notaGuardada,
            url: img.secure_url,
            public_id: img.public_id
          })        
        )
        
        await queryRunner.manager.save( imagenesNotas )

      }

      await queryRunner.commitTransaction()

      const notaConImagenes = await repoOrdenNota.findOne({
        where: { id: notaGuardada.id},        
        relations: [ 'imagenes' ]
      })

      return {
        ...notaConImagenes,
        id_orden: createOrdenNotaDescripcionDto.id_orden 
      }

    }catch(error){

      await queryRunner.rollbackTransaction();
      
      if( error instanceof NotFoundException ){
        throw error
      }

      if( error instanceof BadRequestException ){
        throw error
      }

      throw new InternalServerErrorException('')
    }finally{
      await queryRunner.release();
    }

  }

  private async deleteNotaconImagenes(id_orden_nota: string){

    const queryRunner = this.dataSource.createQueryRunner()

    await queryRunner.connect()

    await queryRunner.startTransaction()

    try{

      //1 Buscar nota y validar existencia
      const nota = await queryRunner.manager.findOne(OrdenNota, {
        where: {id: parseInt( id_orden_nota) },
        relations: ['imagenes']
      });

      if(!nota){
        throw new NotFoundException('Nota no encontrada');
      }

      //2 Eliminar imagenes de Cloudinary (en paralelo con Promise.all)
      const imagenes = nota.imagenes

      if(imagenes.length > 0){
        await Promise.all(
          imagenes.map( (img) => this.imageService.deleteImage(img.public_id))
        );

        //3 eliminar los registro de imagenes ne la BD
        await queryRunner.manager.delete(OrdenNotaImagen, {
          id_orden_nota: id_orden_nota
        });
      }

      //4. Eliminar la nora en sí
      await queryRunner.manager.delete(OrdenNota, {id: id_orden_nota})

      await queryRunner.commitTransaction();

      return {message: 'Nota e imágenes eliminadas correctamente'}

    }catch(error){
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Error al eliminar la nota');
    }finally{
      await queryRunner.release()
    }
  }  

  async getPaginado( page: number = 1, limit: number, fSearch: string, user: User ) {
    
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoOrden = queryRunner.manager.getRepository(Orden);
      
      const baseQuery = repoOrden.createQueryBuilder('orden')
        .select('orden.id')
        .innerJoin('orden.cliente', 'cliente')
        .innerJoin('orden.vehiculo', 'vehiculo')
        .innerJoin('vehiculo.modelo', 'modelo')
        .innerJoin('modelo.marca', 'marca');
        
      if (fSearch !== '') {
        const search = `%${fSearch.trim().toLowerCase()}%`;

        baseQuery.where(`(
          vehiculo.id::text LIKE :search OR
          modelo.nombre ILIKE :search OR
          marca.nombre ILIKE :search OR
          vehiculo.anio::text LIKE :search OR
          COALESCE(vehiculo.color, '') ILIKE :search OR
          COALESCE(vehiculo.placa, '') ILIKE :search OR
          vehiculo.numeroSerie ILIKE :search OR
          cliente.id::text LIKE :search OR
          unaccent(cliente.nombre) ILIKE :search OR
          cliente.telefono ILIKE :search OR
          cliente.email ILIKE :search OR
          COALESCE(orden.poliza, '') ILIKE :search OR
          COALESCE(orden.siniestro, '') ILIKE :search OR
          COALESCE(orden.folioNota, '') ILIKE :search
        )`, {
          search: search,          
        });
      }

      const offset = ( page -1 ) * limit;
      
      const [idsResults, totalItems] = await baseQuery
        .orderBy('orden.id', 'DESC')
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      if( totalItems === 0){
        return { count: 0, pages: 0, ordenes: [] }
      }

      const ids = idsResults.map( o => o.id )

        /*.leftJoin('productoServicio.satProductoServicio', 'satProductoServicio')        
        .leftJoin('satProductoServicio.satTipoProductoServicio', 'satTipoProductoServicio')
        .addSelect(['satTipoProductoServicio.tipo'])*/
      
      const ordenes = await repoOrden.createQueryBuilder('orden')
        .innerJoinAndSelect('orden.cliente', 'cliente')
        .leftJoinAndSelect('orden.empresa', 'empresa')
        .innerJoinAndSelect('orden.vehiculo', 'vehiculo')
        .innerJoinAndSelect('vehiculo.modelo', 'modelo')
        .innerJoinAndSelect('modelo.marca', 'marca')
        .innerJoinAndSelect('orden.notas', 'notas')
        .leftJoinAndSelect('notas.imagenes', 'imagenes')
        .leftJoinAndSelect('orden.satMetodoPago', 'satMetodoPago')

        .leftJoinAndSelect('orden.conceptos', 'conceptos')        

        .leftJoin('orden.facturas', 'factura')
        .addSelect(['factura.total', 'factura.estatus', 'factura.id'])
        .leftJoin('factura.pagos','pago')
        .addSelect(['pago.id', 'pago.monto','pago.numeroParcialidad','pago.saldoAnterior','pago.saldoInsoluto'])
        .leftJoin('pago.complemento','complemento')
        .addSelect(['complemento.id', 'complemento.montoTotal', 'complemento.fechaPago', 'complemento.estatus'])

        .leftJoin('conceptos.producto', 'producto')
        .addSelect(['producto.id','producto.descripcion'])

        .leftJoin('conceptos.servicio', 'servicio')
        .addSelect(['servicio.id', 'servicio.descripcion'])
        
        .leftJoin('conceptos.productoServicio', 'productoServicio')
        .addSelect(['productoServicio.descripcion'])

        .leftJoin('productoServicio.satProductoServicio','satProductoServicio') 
        .addSelect(['satProductoServicio.descripcion'])

        .leftJoin('satProductoServicio.satTipoProductoServicio','satTipoProductoServicio')
        .addSelect(['satTipoProductoServicio.tipo'])
        
        .where('orden.id IN (:...ids)', { ids })
        .orderBy('orden.id', 'DESC')
        .addOrderBy('notas.id', 'ASC', 'NULLS LAST')
        .addOrderBy('factura.id', 'ASC')
        .getMany()
      
      return {
        count: totalItems,
        pages: Math.ceil( totalItems / limit ),
        ordenes: ordenes
      }

    }finally{
      await queryRunner.release();
    }
  } 

  async getOne( id: string, user: User){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()

    try{
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoOrden = queryRunner.manager.getRepository(Orden);
    
      const query = repoOrden.createQueryBuilder('orden')
      
      query.innerJoinAndSelect('orden.cliente', 'cliente')
      query.leftJoinAndSelect('orden.empresa', 'empresa')
      query.innerJoinAndSelect('orden.vehiculo', 'vehiculo')
      query.innerJoinAndSelect('vehiculo.modelo', 'modelo')
      query.innerJoinAndSelect('modelo.marca', 'marca')
      query.innerJoinAndSelect('orden.notas', 'notas')
      query.leftJoinAndSelect('notas.imagenes', 'imagenes' )

      query.leftJoinAndSelect('cliente.satRegimenFiscal', 'satRegimenFiscalCliente')
      query.leftJoinAndSelect('cliente.satUsoCFDI', 'usoCfdiCliente')

      query.leftJoinAndSelect('empresa.satRegimenFiscal', 'satRegimenFiscalEmpresa')
      query.leftJoinAndSelect('empresa.satUsoCFDI', 'usoCfdiEmpresa')
      
      query.leftJoinAndSelect('orden.conceptos', 'conceptos')
      query.leftJoin('conceptos.productoServicio', 'productoServicio')
      query.addSelect(['productoServicio.id', 'productoServicio.descripcion'])

      query.leftJoin('productoServicio.satProductoServicio', 'satProductoServicio')
      query.addSelect(['satProductoServicio.descripcion'])
      query.leftJoin('satProductoServicio.satTipoProductoServicio', 'satTipoProductoServicio')
      query.addSelect(['satTipoProductoServicio.tipo'])

      query.leftJoinAndSelect('orden.satMetodoPago', 'satMetodoPago')

        .leftJoin('orden.facturas', 'factura')
        .addSelect(['factura.total', 'factura.estatus', 'factura.id'])
        .leftJoin('factura.pagos','pago')
        .addSelect(['pago.id', 'pago.monto','pago.numeroParcialidad','pago.saldoAnterior','pago.saldoInsoluto'])
        .leftJoin('pago.complemento','complemento')
        .addSelect(['complemento.id', 'complemento.montoTotal', 'complemento.fechaPago', 'complemento.estatus'])

        .leftJoin('factura.conceptos', 'facturaConcepto')
        .addSelect(['facturaConcepto.cantidad','facturaConcepto.subtotal','facturaConcepto.valorUnitario'])
        .leftJoin('facturaConcepto.impuestos', 'facturaConceptoImpuesto')
        .addSelect(['facturaConceptoImpuesto.importe', 'facturaConceptoImpuesto.tipo'])
        .leftJoin('facturaConcepto.productoServicio', 'productoServicio2')
        .addSelect(['productoServicio2.descripcion'])
        
        .leftJoin('productoServicio2.satProductoServicio', 'satProductoServicio2')
        .addSelect(['satProductoServicio2.id', 'satProductoServicio2.descripcion'])
        .leftJoin('satProductoServicio2.satTipoProductoServicio', 'satTipoProductoServicio2')
        .addSelect(['satTipoProductoServicio2.tipo'])
        



      query.andWhere('orden.id LIKE :id', { id: `${ id }` })

      query.addOrderBy('notas.id', 'ASC', 'NULLS LAST');
      query.addOrderBy('factura.id', 'ASC')
      
      const data = await query.getOne()

      if(!data){
        throw new NotFoundException(`La orden con el ID: ${ id.toUpperCase() } no fué encontrada`)
      }
      
      return data

    }finally{
      await queryRunner.release();
    }
    
  }

  async getTotalesPorEstatus(user: User) 
  {
    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoOrden = queryRunner.manager.getRepository(Orden);

      // Agrupar por estatus y contar
      const resultados = await repoOrden.createQueryBuilder('orden')
        .select('orden.estatus', 'estatus')
        .addSelect('COUNT(*)', 'total')
        .groupBy('orden.estatus')
        .getRawMany();

      // Normalizar salida: convertir a objetos con estatus y total
      const totalesPorEstatus = resultados.map(r => ({
        estatus: r.estatus as EnumEstatusOrden,
        total: Number(r.total)
      }));

      return totalesPorEstatus;

    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, updateOrdenDto: UpdateOrdenDto, user: User) {
    
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect()

    await queryRunner.startTransaction();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      //Vehiculo
      const repoVehiculo = queryRunner.manager.getRepository(Vehiculo);

      let vehiculo = null

      if(updateOrdenDto.vehiculoForm){

        if( !updateOrdenDto.vehiculoForm.numeroSerie ){
          throw new BadRequestException(`Debes ingresar el Numero de Serie`)
        }
        
        const numeroSerieRegistradoPreviamente = await repoVehiculo.findOneBy({numeroSerie: updateOrdenDto.vehiculoForm.numeroSerie.toLowerCase()})
        
        if( numeroSerieRegistradoPreviamente && numeroSerieRegistradoPreviamente.id != updateOrdenDto.id_vehiculo?.toLocaleLowerCase() ){
          throw new BadRequestException(`El Número de Serie ingresado ya fué registrado con el vehículo: ${ numeroSerieRegistradoPreviamente.id }`)
        }
                    
        const repoModelo = queryRunner.manager.getRepository(Modelo);
  
        const modelo = await repoModelo.findOneBy({ id: updateOrdenDto.vehiculoForm.id_modelo })
  
        if( !modelo ){
          throw new NotFoundException(`El modelo con el Id: ${updateOrdenDto.vehiculoForm.id_modelo} no existe`)
        }
        
        const nuevoIdVehiculo = await generarEntityId( repoVehiculo, EnumPrefijoEntity.VEHICULOS )
        
        const nuevoVehiculo = repoVehiculo.create({
          ...updateOrdenDto.vehiculoForm,
          modelo: modelo,
          id: nuevoIdVehiculo,
          createdAtUser: user,
          updatedAtUser: user
        })

        vehiculo = await queryRunner.manager.save( nuevoVehiculo )

      }else if( updateOrdenDto.id_vehiculo ){

        vehiculo = await repoVehiculo.findOneBy({id:updateOrdenDto.id_vehiculo.toLowerCase()});

        if(!vehiculo){
          throw new NotFoundException(`El vehículo con el ID: ${updateOrdenDto.id_vehiculo} no existe`)
        }

      }else{
        throw new NotFoundException(`Debes proporcionar el Id del Vehículo o los datos del nuevo Vehículo`)
      }

       //Cliente
      const repoCliente = queryRunner.manager.getRepository(Cliente);
        
      let cliente = null

      if(updateOrdenDto.clienteForm){
        const nuevoIdCliente = await generarEntityId( repoCliente, EnumPrefijoEntity.CLIENTES )
        
        const nuevoCliente = repoCliente.create({
          ...updateOrdenDto.clienteForm,
          id: nuevoIdCliente,
          createdAtUser: user,
          updatedAtUser: user
        })

        cliente = await queryRunner.manager.save( nuevoCliente )

      }else if( updateOrdenDto.id_cliente ){

        cliente = await repoCliente.findOneBy({id:updateOrdenDto.id_cliente.toLowerCase()});

        if(!cliente){
          throw new NotFoundException(`El cliente con el ID: ${updateOrdenDto.id_cliente} no existe`)
        }

      }

      //Empresa
      const repoEmpresa = queryRunner.manager.getRepository(Empresa);
        
      let empresa = null

      if(updateOrdenDto.empresaForm){
        const nuevoIdEmpresa = await generarEntityId( repoEmpresa, EnumPrefijoEntity.EMPRESAS )
        
        const nuevoEmpresa = repoEmpresa.create({
          ...updateOrdenDto.empresaForm,
          id: nuevoIdEmpresa,
          createdAtUser: user,
          updatedAtUser: user
        })

        empresa = await queryRunner.manager.save( nuevoEmpresa )

      }else if( updateOrdenDto.id_empresa ){

        empresa = await repoEmpresa.findOneBy({id:updateOrdenDto.id_empresa.toLowerCase()});

        if(!empresa){
          throw new NotFoundException(`El empresa con el ID: ${updateOrdenDto.id_empresa} no existe`)
        }

      }

      if( !cliente && !empresa){
        throw new NotFoundException(`Debes indicar un cliente o una empresa para la orden`)
      }  
      
      const repoOrden = queryRunner.manager.getRepository(Orden);

      const result = await repoOrden.update(
        { id: id },
        { 
          descripcion: updateOrdenDto.descripcion,
          fechaIngreso: updateOrdenDto.fechaIngreso,
          //fechaEntregaEstimada: updateOrdenDto.fechaEntregaEstimada,
          fechaEntregaReal: updateOrdenDto.fechaEntregaReal,
          kilometros: updateOrdenDto.kilometros,
          poliza: updateOrdenDto.poliza,
          siniestro: updateOrdenDto.siniestro,
          folioNota: updateOrdenDto.folioNota,
          vehiculo: vehiculo, 
          cliente: cliente,
          empresa: empresa
        }
      );      

      if(result.affected === 0){
        throw new NotFoundException(`La orden con el ID: ${ id.toUpperCase() } no fué encontrada`)
      }

      await queryRunner.commitTransaction()

      return {
        id: id
      }

    }catch(error){  
      
      await queryRunner.rollbackTransaction();
      
      if( error instanceof NotFoundException ){
        throw error
      }
    
      if( error instanceof BadRequestException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al actualizar la Orden')
    }finally{
      await queryRunner.release();
    }
  }

  async updateOLD(id: string, updateOrdenDto: UpdateOrdenDto, user: User) {

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoOrden = queryRunner.manager.getRepository(Orden);

      const result = await repoOrden.update(
        { id: id },
        { 
          descripcion: updateOrdenDto.descripcion,
          fechaIngreso: updateOrdenDto.fechaIngreso,
          //fechaEntregaEstimada: updateOrdenDto.fechaEntregaEstimada,
          fechaEntregaReal: updateOrdenDto.fechaEntregaReal,
          kilometros: updateOrdenDto.kilometros,
          poliza: updateOrdenDto.poliza,
          siniestro: updateOrdenDto.siniestro,
        }
      );      

      if(result.affected === 0){
        throw new NotFoundException(`La orden con el ID: ${ id.toUpperCase() } no fué encontrada`)
      }

      return {
        id: id
      }

    }catch(error){    
      
      if( error instanceof NotFoundException ){
        throw error
      }
    
      if( error instanceof BadRequestException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al actualizar la Orden')
    }finally{
      await queryRunner.release();
    }
  }

  async updateEstatus( id: string, updateOrdenEstatusDto: UpdateOrdenEstatusDto, user: User  ):Promise<UpdateOrdenEstatusResponseDto>{

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoOrden = queryRunner.manager.getRepository(Orden);

      const result = await repoOrden.update(
        { id },
        { estatus: updateOrdenEstatusDto.estatus, updatedAtUser: user }
      );

      if( result.affected === 0 ){
        throw new NotFoundException(`La orden con el ID: ${ id.toUpperCase() } no fué encontrada`)
      }

      const repoOrdenNota = queryRunner.manager.getRepository( OrdenNota );

      const nuevaNota = repoOrdenNota.create({
        orden: { id },
        nota: 'Se actualizó el Estatus.',
        estatus: updateOrdenEstatusDto.estatus,
        createdAtUser: user,
        updatedAtUser: user
      })

      const nuevaNotaGuardada = await queryRunner.manager.save(nuevaNota)

      await queryRunner.commitTransaction()

      return {
        id: nuevaNotaGuardada.id,
        estatus: nuevaNotaGuardada.estatus as EnumEstatusOrden,
        nota: nuevaNotaGuardada.nota,
        createdAt: nuevaNotaGuardada.createdAt.toISOString(),
        id_orden: id
      } as UpdateOrdenEstatusResponseDto

    }catch(error){

      await queryRunner.rollbackTransaction();

      if( error instanceof NotFoundException ){
        throw error
      }
 
      if(error instanceof BadRequestException){
        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al actualizar el estatus de la Orden: ${error}`)

    }finally{

      await queryRunner.release()

    }

  }

  async updatePago( id: string, updateOrdenPagoDto: UpdateOrdenPagoDto, user: User  ){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{      

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoOrden = queryRunner.manager.getRepository(Orden);

      let fechaPago = null
      if( updateOrdenPagoDto.pagada ){
        
        fechaPago = updateOrdenPagoDto.fechaPago != null ? new Date( updateOrdenPagoDto.fechaPago ) : new Date( )
        
      }

      const result = await repoOrden.update(
        { id },
        { pagada: updateOrdenPagoDto.pagada, fechaPago: fechaPago, updatedAtUser: user }
      );

      if( result.affected === 0 ){
        throw new NotFoundException(`La orden con el ID: ${ id.toUpperCase() } no fué encontrada`)
      }      

      await queryRunner.commitTransaction()
      
      return {
        pagada: updateOrdenPagoDto.pagada,
        fechaPago: fechaPago
      }

    }catch(error){
      
      await queryRunner.rollbackTransaction();

      if( error instanceof NotFoundException ){
        throw error
      }
 
      if(error instanceof BadRequestException){
        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al actualizar el pago de la Orden: ${error}`)

    }finally{

      await queryRunner.release()

    }

  }

  async updateConceptos(id: string, conceptosDto: CreateOrdenConceptoDto[], user: User) {

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect();
    await queryRunner.startTransaction()

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoOrden = queryRunner.manager.getRepository(Orden);

      const orden = await repoOrden.findOne({
        where: {id: id},
        relations: ['conceptos']
      })

      if(!orden){
        throw new NotFoundException(`La orden con el ID: ${ id.toUpperCase() } no fué encontrada`)
      }

      if( orden.estatusFactura === EnumEstatusOrdenFactura.TIMBRADA ){
        throw new NotFoundException(`La orden con el ID: ${ id.toUpperCase() } ya está timbrada y no puedes modificar los conceptos`)
      }

      // 1. Revertir consumos de lotes FIFO antes de borrar conceptos antiguos
      if (orden.conceptos && orden.conceptos.length > 0) {
        for (const concepto of orden.conceptos) {
          await this.fifoService.revertirPorCancelacionConcepto(queryRunner, concepto.id);
        }
      }

      // 2. Borrar conceptos antiguos de la BD
      await queryRunner.manager.delete(OrdenConcepto, { orden: { id: id } });

      // 3. Crear nuevos conceptos uno por uno usando la lógica FIFO transaccional
      /* TODO */
      /*
      for (const dto of conceptosDto) {
        await this.procesarConceptoTransaccional(queryRunner, orden, dto);
      }
        */

      await queryRunner.commitTransaction();

      return {
        id: id,
      };   

    }catch(error){

      await queryRunner.rollbackTransaction()
      
      if( error instanceof NotFoundException ){
        throw error
      }
    
      if( error instanceof BadRequestException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al actualizar los conceptos de la Orden')
    }finally{
      await queryRunner.release();
    }
  }

  private async procesarConceptoTransaccional(
    queryRunner: QueryRunner,
    orden: Orden,
    dtoConcepto: CreateOrdenConceptoDto,
  ): Promise<MontosConcepto> {
    
    const repoOrdenConcepto = queryRunner.manager.getRepository(OrdenConcepto);
    const tipo = dtoConcepto.tipo.toLowerCase();

    let subtotalCosto = 0;
    let subtotalVenta = 0;
    let utilidad = 0;

    if (tipo === EnumOrdenConceptoTipo.PRODUCTO ) {
      
      const producto = await queryRunner.manager.findOne(Producto, {
        where: { id: dtoConcepto.id_producto_servicio },
      });
      
      if (!producto) {
        throw new BadRequestException(`Producto ${dtoConcepto.id_producto_servicio} no encontrado`);
      }

      const ordenConceptoSnapshot = {
        tipo: EnumOrdenConceptoTipo.PRODUCTO,
        cantidad: dtoConcepto.cantidad,
        costoUnitarioPromedioSnapshot: null,
        subtotalCostoSnapshot: null,
        precioVentaSnapshot: Number( producto.precioVenta ),
        subtotalPrecioVentaSnapshot: Number( producto.precioVenta ) * Number( dtoConcepto.cantidad ),
        utilidadSnapshot: null,
        producto: producto,
        orden: orden
      }

      const ordenConcepto = repoOrdenConcepto.create(
        ordenConceptoSnapshot
      ) 

      const ordenConceptoGuardado = await queryRunner.manager.save(OrdenConcepto, ordenConcepto);

      const { costoUnitarioPromedioSnapshot, subtotalCostoSnapshot } =
        await this.fifoService.consumirProductoFIFO( queryRunner, ordenConcepto.id, producto.id, dtoConcepto.cantidad )

      // Actualizar el concepto con los valores de snapshot obtenidos del FIFO
      ordenConceptoGuardado.costoUnitarioPromedioSnapshot = costoUnitarioPromedioSnapshot;
      ordenConceptoGuardado.subtotalCostoSnapshot = subtotalCostoSnapshot;
      ordenConceptoGuardado.utilidadSnapshot = (Number( producto.precioVenta ) - Number( costoUnitarioPromedioSnapshot )) * Number( dtoConcepto.cantidad );

      subtotalCosto = Number( subtotalCostoSnapshot );
      subtotalVenta = Number( dtoConcepto.cantidad ) * Number( producto.precioVenta );
      utilidad = ( Number( dtoConcepto.cantidad ) * Number( producto.precioVenta ) ) - Number( subtotalCostoSnapshot )

      await queryRunner.manager.save(OrdenConcepto, ordenConceptoGuardado);

      return { subtotalCosto, subtotalVenta, utilidad }

    } else if ( tipo == EnumOrdenConceptoTipo.SERVICIO) {
      
      const servicio = await queryRunner.manager.findOne(Servicio, {
        where: { id: dtoConcepto.id_producto_servicio },
      });

      if (!servicio) {
        throw new BadRequestException(`Servicio ${dtoConcepto.id_producto_servicio} no encontrado`);
      }

      const ordenConceptoSnapshot = {
        tipo: EnumOrdenConceptoTipo.SERVICIO,
        cantidad: dtoConcepto.cantidad,
        precioVentaSnapshot: Number( servicio.precioVenta ),
        subtotalPrecioVentaSnapshot: Number( servicio.precioVenta ) * Number( dtoConcepto.cantidad ),
        utilidadSnapshot: Number( servicio.precioVenta ) * Number( dtoConcepto.cantidad ),
        servicio: servicio,
        orden: orden
      }

      const ordenConcepto = repoOrdenConcepto.create(
        ordenConceptoSnapshot
      )

      subtotalCosto = 0;
      subtotalVenta = Number( dtoConcepto.cantidad ) * Number( servicio.precioVenta );
      utilidad = ( Number( dtoConcepto.cantidad ) * Number( servicio.precioVenta ) )

      await queryRunner.manager.save(OrdenConcepto, ordenConcepto);

      return { subtotalCosto, subtotalVenta, utilidad }
    } /*else {
      // Legacy ProductoServicio
      const ps = await queryRunner.manager.findOne(ProductoServicio, {
        where: { id: idLower },
      });
      if (!ps) {
        throw new BadRequestException(`Legacy producto/servicio ${dto.id_producto_servicio} no encontrado`);
      }

      const snapshot = await this.snapshotsService.construirDesdeProductoServicio(
        queryRunner,
        ps.id,
        Number(dto.valorUnitario),
      );

      const ordenConcepto = repoOrdenConcepto.create({
        cantidad: dto.cantidad,
        valorUnitario: Number(dto.valorUnitario),
        orden: orden,
        productoServicio: ps,
        costoUnitario: 0,
        subtotalCosto: 0,
        utilidad: Number(dto.valorUnitario) * dto.cantidad,
      });

      this.snapshotsService.aplicarAConcepto(ordenConcepto, snapshot);
      return queryRunner.manager.save(OrdenConcepto, ordenConcepto);
    }*/
  }

  /*
  private async procesarConceptoTransaccionalOLD(
    queryRunner: QueryRunner,
    orden: Orden,
    dto: CreateOrdenConceptoDto,
  ): Promise<OrdenConcepto> {
    const repoOrdenConcepto = queryRunner.manager.getRepository(OrdenConcepto);
    const idLower = dto.id_producto_servicio.toLowerCase();

    if (idLower.startsWith('prd_')) {
      const producto = await queryRunner.manager.findOne(Producto, {
        where: { id: idLower },
      });
      if (!producto) {
        throw new BadRequestException(`Producto ${dto.id_producto_servicio} no encontrado`);
      }

      const snapshot = await this.snapshotsService.construirDesdeProducto(
        queryRunner,
        producto.id,
        Number(dto.valorUnitario),
      );

      const ordenConcepto = repoOrdenConcepto.create({
        cantidad: dto.cantidad,
        valorUnitario: Number(dto.valorUnitario),
        orden: orden,
        producto: producto,
      });

      this.snapshotsService.aplicarAConcepto(ordenConcepto, snapshot);
      const guardado = await queryRunner.manager.save(OrdenConcepto, ordenConcepto);

      return this.fifoService.consumirParaOrdenConcepto({
        queryRunner,
        ordenConcepto: guardado,
        idProducto: producto.id,
        cantidad: dto.cantidad,
        valorUnitario: Number(dto.valorUnitario),
      });
    } else if (idLower.startsWith('srv_')) {
      const servicio = await queryRunner.manager.findOne(Servicio, {
        where: { id: idLower },
      });
      if (!servicio) {
        throw new BadRequestException(`Servicio ${dto.id_producto_servicio} no encontrado`);
      }

      const snapshot = await this.snapshotsService.construirDesdeServicio(
        queryRunner,
        servicio.id,
        Number(dto.valorUnitario),
      );

      const ordenConcepto = repoOrdenConcepto.create({
        cantidad: dto.cantidad,
        valorUnitario: Number(dto.valorUnitario),
        orden: orden,
        costoUnitario: 0,
        subtotalCosto: 0,
        utilidad: Number(dto.valorUnitario) * dto.cantidad,
      });

      this.snapshotsService.aplicarAConcepto(ordenConcepto, snapshot);
      return queryRunner.manager.save(OrdenConcepto, ordenConcepto);
    } else {
      // Legacy ProductoServicio
      const ps = await queryRunner.manager.findOne(ProductoServicio, {
        where: { id: idLower },
      });
      if (!ps) {
        throw new BadRequestException(`Legacy producto/servicio ${dto.id_producto_servicio} no encontrado`);
      }

      const snapshot = await this.snapshotsService.construirDesdeProductoServicio(
        queryRunner,
        ps.id,
        Number(dto.valorUnitario),
      );

      const ordenConcepto = repoOrdenConcepto.create({
        cantidad: dto.cantidad,
        valorUnitario: Number(dto.valorUnitario),
        orden: orden,
        productoServicio: ps,
        costoUnitario: 0,
        subtotalCosto: 0,
        utilidad: Number(dto.valorUnitario) * dto.cantidad,
      });

      this.snapshotsService.aplicarAConcepto(ordenConcepto, snapshot);
      return queryRunner.manager.save(OrdenConcepto, ordenConcepto);
    }
  }
    */

}
