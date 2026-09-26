import { SatCancelacionMotivo } from './../sat/entities/sat-cancelacion-motivo.entity';
import { CreateCancelacionDto } from './dto/create-cancelacion-dto';
import { Complemento } from './entities/complemento.entity';
import { FacturaConceptoImpuesto } from './entities/factura-concepto-impuesto.entity';
import { OrdenConcepto } from './../ordenes/entities/orden_concepto.entity';
import { ProductoServicio } from './../productos-servicios/entities/producto-servicio.entity';
import { Empresa } from './../empresas/entities/empresa.entity';
import { Cliente } from './../clientes/entities/cliente.entity';
import { Orden } from './../ordenes/entities/orden.entity';
import { SatImpuestoPorcentaje } from './../sat/entities/sat-impuesto-porcentaje.entity';
import { SatImpuesto } from './../sat/entities/sat-impuesto.entity';
import { SatMoneda } from './../sat/entities/sat-moneda.entity';
import { SatProductoServicio } from './../sat/entities/sat-producto-servicio.entity';
import { SatTipoPersona } from './../sat/entities/sat-tipo-persona.entity';
import { SatMetodoPago } from './../sat/entities/sat-metodo-pago.entity';
import { SatFormaPago } from './../sat/entities/sat-forma-pago.entity';
import { SatTipoComprobante } from './../sat/entities/sat-tipo-comprobante.entity';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, In, QueryFailedError, QueryRunner, Repository } from 'typeorm';
import { generarEntityId } from '../config/generarEntityId';
import { Factura } from './entities/factura.entity';
import { Emisor } from '../emisor/entities/emisor.entity';
import { User } from '../auth/entities/user.entity';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { CalcularImpuestosDto } from './dto/calcular-impuestos-dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { toZonedTime, format, formatInTimeZone } from 'date-fns-tz';
import { FacturaConcepto } from './entities/factura-concepto.entity';
import { CreateComplementoDto } from './dto/create-complemento-dto';
import { SatExportacion } from '../sat/entities/sat-exportacion.entity';
import { dateIsGreaterThan, dateIsDistinctMonthAndYear, dateGetHoursDifference } from '../commom/utils/date-utils';
import { EnumEstatusCFDI, EnumEstatusConcepto, EnumEstatusOrdenFactura, EnumImpuestosPorcentajes, EnumSatCancelacionMotivo, EnumSatMetodoPago, EnumSatRegimenFiscal, EnumSatTipoComprobante, EnumSatTipoComprobanteDescripcion, EnumSatTipoPersona, EnumSatTipoTimbrado, EnumPrefijoEntity } from './../commom/enums/general.enum';
import { Pago } from './entities/pago.entity';
import { PagoResponseDto } from './dto/pago-response.dto';
import { mapPagoToResponseDto, mapFacturaSinLiquidarToResponseDto, FacturaSinLiquidarRAW, PagoRAW } from './mappers/factura.mapper';

interface IReceptor{
  rfc: string,
  razon_social: string,
  uso_cfdi: string,
  regimen_fiscal: string,
  codigo_postal: string
}

interface ImportesFactura{
  subtotal: number;
  ivaTrasladado: number;
  isrRetenido: number;
  ivaRetenido: number;
  total: number;
}

interface CancelarFactura{
  fechaCancelacion: string;
  satCancelacionMotivo: SatCancelacionMotivo;
  idSustitucion: string,
  uuidSustitucion: string,
  estatus: EnumEstatusCFDI
}

interface CancelarFacturaAcuse{
  cancelacionAcuseRespuesta: any
}

export interface ApiFactura {
  url: string,
  clientId: string,
  token: string
}

interface FacturaActualizarDatosTimbrado{
  id: string,
  uuid: string,  
  fecha_emision: string,
  fecha_timbrado: string,
  timbre_fiscal: {
    sello: string,
    sello_sat: string,
    num_certificado_sat: string,
    rfc_certifico: string
  }          
}

interface FacturaActualizarDatosFacturaSustitucion{
  idFacturaCancelar: string,
  idSustitucion: string,
  uuidSustitucion: string,
  fechaCancelacion: string,
  claveCancelacionMotivo: SatCancelacionMotivo,
  estatus: EnumEstatusCFDI,
  cancelacionAcuseRespuesta: any,
}      

interface RespuestaPacObtieneTimbresDisponibles{
    ok: boolean,
    body: {
        TimbresContratados:  number,
        TimbresConsumidos: number,
        TimbresDisponibles: number
    },
    status: number
}

interface RespuestaPacError{
    Codigo: number,
    Mensaje: string,
    Categoria: string,
    CodigoSat: string,
    MensajeSat: string,
    Valores: any
}


@Injectable()
export class FacturasService {
  
  private satImpuestosMap: Map<string, SatImpuesto>

  //TODO
              
            //@follow-up
  private readonly IVA_RATE = 0.16; // 16%
  private readonly ISR_RETENTION_PF_ACTIVIDAD_EMPRESARIAL = 0.10; // 10%
  private readonly ISR_RETENTION_PF_RESICO = 0.0125; // 1.25%
  private readonly IVA_RETENTION_RATE = 0.106666; // 10.66% (2/3 de 16%)

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(SatImpuesto) private readonly satImpuestoRepository: Repository<SatImpuesto>,
    @InjectRepository(SatImpuestoPorcentaje) private readonly satImpuestoPorcentajeRepository: Repository<SatImpuestoPorcentaje>,
    private readonly dataSource: DataSource
  ){} 

  async onModuleInit(){
    const impuestos = await this.satImpuestoRepository.find({})
    this.satImpuestosMap = new Map( impuestos.map( i => [i.clave, i]) )
  }

  getSatImpuestoPorClave( clave: string): SatImpuesto{
    const impuesto = this.satImpuestosMap.get( clave );
    if( !impuesto ) throw new Error(`Impuesto con clave ${clave} no encontrado`)
    return impuesto
  }

  //OBTENER API FACTURA
  private _obtenerApiFacturaPAC(): ApiFactura{
      
    const apiFactura: ApiFactura = {
        url: '',
        clientId: '',
        token: ''
      }
      
    try{
      
      if( this.configService.get<string>('STAGE') === 'dev' ){
        apiFactura.url = this.configService.get<string>('TECH_API_URL_DEV')
        apiFactura.clientId = this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
        apiFactura.token = this.configService.get<string>('TECH_API_TOKEN_DEV')
      }else{
        apiFactura.url = this.configService.get<string>('TECH_API_URL_DEV')
        apiFactura.clientId = this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
        apiFactura.token = this.configService.get<string>('TECH_API_TOKEN_DEV')
      }

      return apiFactura;

    }catch(error: any){        
      
      if( error instanceof BadRequestException){
        throw error
      }

      if( error.response?.data?.Mensaje ){  
        throw new BadRequestException(error.response?.data?.Mensaje)
      }   

      throw new BadRequestException(`Hubo un error al querer asignar el objeto ApiFactura: ${error}`)

    }

  }

  //OBTENER HEADERS
  private _obtenerHeadersPAC(){
    if( this.configService.get<string>('STAGE') === 'dev' ){
      return {
        Authorization: `Bearer ${this.configService.get<string>('TECH_API_TOKEN_DEV')}`,
        'Content-Type': 'application/json',
        'X-CLIENT-ID': this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
      }      
    }else{
      return {
        Authorization: `Bearer ${this.configService.get<string>('TECH_API_TOKEN_DEV')}`,
        'Content-Type': 'application/json',
        'X-CLIENT-ID': this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
      }      
    }  
  }

  private async _obtenerEmisor( queryRunner: QueryRunner): Promise<Emisor>{
      
    let emisor: Emisor | null = null;
      
    try{

      const repoEmisor = queryRunner.manager.getRepository(Emisor);
    
      emisor = await repoEmisor.findOne({
        where: { isActive: true },
        relations: ['satRegimenFiscal', 'usuario', 'usuario.compania.satTipoPersona']
      });          

      if(!emisor){
        throw new NotFoundException(`No hay un Emisor con estatus activo`)
      }     

      return emisor;

    }catch(error: any){        
      
      if( error instanceof BadRequestException){
        throw error
      }

      if( error.response?.data?.Mensaje ){  
        throw new BadRequestException(error.response?.data?.Mensaje)
      }   

      throw new BadRequestException(`Hubo un error al obtener el Emisor: ${error}`)

    }
  }

  private async _obtenerReceptorYCatalogos( orden: Orden, receptorClaveSatTipoPersona: string, queryRunner: QueryRunner){

    // DEFINIR EL RECEPTOR
      //let receptor: any | null = null;
      //let receptorSatRegimenFiscal: any | null = null;
      //let receptorSatUsoCFDI: any | null = null;

      //let receptorSatTipoPersona: SatTipoPersona | null = null;

      try{
         
        const repoSatTipoPersona = queryRunner.manager.getRepository(SatTipoPersona);
        
        const receptorSatTipoPersona = await repoSatTipoPersona.findOneBy({tipo: receptorClaveSatTipoPersona});

        if(!receptorSatTipoPersona){
          throw new NotFoundException(`El tipo de persona: ${receptorClaveSatTipoPersona} no existe`)
        }             

        if( receptorSatTipoPersona.tipo === EnumSatTipoPersona.MORAL ){

          this.validarEmpresa( orden.empresa )

        }else{

          this.validarCliente( orden.cliente )

        }

        const receptor = {          
          rfc: ( receptorSatTipoPersona.tipo === EnumSatTipoPersona.MORAL ) 
                ? orden.empresa.rfc.toUpperCase() 
                : orden.cliente.rfc.toUpperCase(),
          razon_social: ( receptorSatTipoPersona.tipo === EnumSatTipoPersona.MORAL ) 
                        ? orden.empresa.nombre.toUpperCase()
                        : orden.cliente.razonSocial.toUpperCase(),
          uso_cfdi: ( receptorSatTipoPersona.tipo === EnumSatTipoPersona.MORAL ) 
                    ? orden.empresa.satUsoCFDI.clave
                    : orden.cliente.satUsoCFDI.clave,
          regimen_fiscal: ( receptorSatTipoPersona.tipo === EnumSatTipoPersona.MORAL ) 
                          ? orden.empresa.satRegimenFiscal.clave 
                          : orden.cliente.satRegimenFiscal.clave,
          codigo_postal: ( receptorSatTipoPersona.tipo === EnumSatTipoPersona.MORAL )
                          ? orden.empresa.codigoPostal
                          : orden.cliente.codigoPostal,
          email: ( receptorSatTipoPersona.tipo === EnumSatTipoPersona.MORAL )
                          ? orden.empresa.email
                          : orden.cliente.email

        }
        
        const receptorSatRegimenFiscal = ( receptorSatTipoPersona.tipo === EnumSatTipoPersona.MORAL )
                                        ? orden.empresa.satRegimenFiscal
                                        : orden.cliente.satRegimenFiscal

        const receptorSatUsoCFDI = ( receptorSatTipoPersona.tipo === EnumSatTipoPersona.MORAL )
                                        ? orden.empresa.satUsoCFDI
                                        : orden.cliente.satUsoCFDI

        return{
          receptor,
          receptorSatRegimenFiscal,
          receptorSatUsoCFDI,
          receptorSatTipoPersona
        }

      }catch(error){
             
        if( error instanceof BadRequestException){
       
          throw error

        }

        if( error instanceof NotFoundException){        

          throw error

        }     

        throw new BadRequestException(`Hubo un error al validar al receptor: ${error}`)        

      }

  }

  private async _obtenerOrden( idOrden: string, queryRunner: QueryRunner){
    
    // OBTENER DATOS DE LA ORDEN
    let orden: Orden | null = null;

    try{
      
      const repoOrden = queryRunner.manager.getRepository(Orden);
      
      orden = await repoOrden.findOne({
        where: {id: idOrden },
        relations: ['cliente', 'cliente.satRegimenFiscal', 'cliente.satUsoCFDI', 'empresa', 'empresa.satRegimenFiscal', 'empresa.satUsoCFDI', 'conceptos', 'conceptos.productoServicio', 'conceptos.productoServicio.satProductoServicio']         
      });

      if(!orden){
        throw new NotFoundException(`La Orden: ${idOrden} no existe`)
      }

      return orden;

    }catch(error){
    
      if( error instanceof BadRequestException){       

        throw error

      }

      if( error instanceof NotFoundException){       

        throw error

      }   

      throw new BadRequestException(`Hubo un error al obtener la Orden: ${error}`)        

    }
  }

  private _obtenerFechaLocalFactura( ){
    try{

      return new Date()

    }catch(error){
      
      if( error instanceof BadRequestException){        

        throw error

      }

      if( error instanceof NotFoundException){          

        throw error

      }

      throw new BadRequestException(`Hubo un error al intentar obtener la fecha local: ${error}`)

    }
  }

  private _obtenerFechaToZonedTime( fecha: Date, claveZonaHoraria: string ){
    try{

      const fechaToZonedTime = toZonedTime(fecha, claveZonaHoraria)      

      return fechaToZonedTime

    }catch(error){
      
      if( error instanceof BadRequestException){        

        throw error

      }

      if( error instanceof NotFoundException){          

        throw error

      }

      throw new BadRequestException(`Hubo un error al intentar obtener la fecha to zoned time: ${error}`)

    }
  }

  private _obtenerFechasLocales( fechaEmision: Date, fechaPago: Date, user: User ){
    try{  
      
      const fechaEmisionLocal = formatInTimeZone(fechaEmision, user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss')
      const fechaPagoLocal =    formatInTimeZone(fechaPago, user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss')

      return {
        fechaEmisionLocal,
        fechaPagoLocal
      }      

    }catch(error){
      
      if( error instanceof BadRequestException){        

        throw error

      }

      if( error instanceof NotFoundException){          

        throw error

      }

      throw new BadRequestException(`Hubo un error al intentar obtener fechas locales: ${error}`)

    }
  }

  private async _obtenerNuevoId<T>( repo: Repository<T>, prefijo:string){
    try{
      
      return await generarEntityId( repo, prefijo);

    }catch(error){

      if( error instanceof BadRequestException){        

        throw error

      }

      if( error instanceof NotFoundException){          

        throw error

      }

      throw new BadRequestException(`Hubo un error al intentar obtener fechas locales: ${error}`)

    }

  }
  
  private _validarDetallesComplemento( monto: string, claveSatTipoComprobante: string ){
    try{      

      if( monto.trim() === '' || Number( monto ) <= 0  ){
        throw new BadRequestException(`El monto del Complemento de Pago debe ser mayor a cero`)
      }

      if( claveSatTipoComprobante !== EnumSatTipoComprobante.PAGO ){
        throw new BadRequestException(`El Complemento de Pago debe ser Tipo de Comprobante P - Pago`)
      }

    }catch(error){
      
      if( error instanceof BadRequestException){        

        throw error

      }

      if( error instanceof NotFoundException){          

        throw error

      }

      throw new BadRequestException(`Hubo un error al validar detalles para el Complemento: ${error}`)

    }
  }

  private async _validarTimbresDisponibles( emisor: Emisor, apiFactura: ApiFactura ){
    // 02 PAC TIMBRES DISPONIBLES
    try{

      const bodyEmisorTimbresDisponibles = {
        //"RfcEmisor": "FUNK671228PH7"
        "RfcEmisor": emisor.rfc
      }

      const respuestaPacObtieneTimbresDisponibles =  await firstValueFrom( this.httpService.post<RespuestaPacObtieneTimbresDisponibles>( `${apiFactura.url}/v1/compatibilidad/${apiFactura.clientId}/ObtieneTimbresDisponibles`, bodyEmisorTimbresDisponibles ) );    

      if(respuestaPacObtieneTimbresDisponibles.data.ok){      
        
        if( respuestaPacObtieneTimbresDisponibles.data.body.TimbresDisponibles <= 0 ){          

          throw new BadRequestException('No hay timbres disponibles para facturar. Por favor, contacte con el administrador del sistema.');

        }

      }else{
      
        throw new BadRequestException(`Hubo un error al consultar los timbres disponibles: ${respuestaPacObtieneTimbresDisponibles.data.body}`)

      }

    }catch( error: any ){
  
      
      if( error instanceof BadRequestException){      

        throw error

      }

      if( error.response?.data?.Mensaje ){
      
        throw new BadRequestException(error.response?.data?.Mensaje)
      } 

      throw new BadRequestException(`Hubo un error al consultar los timbres disponibles: ${error}`)

    }
  }

  private async _validarFacturaCancelar( idFactura: string, uuidFactura: string, queryRunner: QueryRunner){
    
    let facturaCancelar: Factura | null = null;

    const repoFactura = queryRunner.manager.getRepository( Factura );

    try{
      
      //satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO },
      //orden: { id: createCancelacionDto. .id_orden },
      //estatus: EnumEstatusCFDI.VIGENTE,
      //fechaCancelacion: null

      facturaCancelar = await repoFactura.findOne({
        where: {
          id: idFactura,
        },
        relations: ['satTipoComprobante', 'satMetodoPago', 'complementoPagos', 'orden']
      });
      //relations: ['satMetodoPago']
      

      if( !facturaCancelar ){
        throw new NotFoundException(`No se encontró una factura con ID: ${ idFactura.toUpperCase() }`)
      }

      if( facturaCancelar.estatus === EnumEstatusCFDI.CANCELADA ){
        throw new BadRequestException(`La factura con ID: ${idFactura.toUpperCase()} ya está Cancelada`)
      }

      if( facturaCancelar.estatus !== EnumEstatusCFDI.VIGENTE ){
        throw new BadRequestException(`La factura con ID: ${idFactura.toUpperCase()} no está Vigente`)
      }
      
      if( facturaCancelar.uuid !== uuidFactura ){
        throw new BadRequestException(`La factura con ID: ${idFactura.toUpperCase()} no coincide con el UUID del timbre`)
      }

      //const diferenciaHoras = dateGetHoursDifference( facturaCancelar.fechaTimbrado, new Date( fechaLocal ) );

      //if( diferenciaHoras > 72 ){
      //   timbradoMayor72H = true
      //}

      if( facturaCancelar.satTipoComprobante.clave === EnumSatTipoComprobante.INGRESO ){
        if( facturaCancelar.satMetodoPago.clave === EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO ){              
          facturaCancelar.pagos.forEach( p => {
            if( p.complemento.estatus == EnumEstatusCFDI.VIGENTE ){
              throw new BadRequestException(`La factura con ID: ${ idFactura } tiene al menos un Complemento de Pago Vigente, debes de cancelarlo primero`)
            }
            /*if( p.estatus === EnumEstatusCFDI.VIGENTE ){
              throw new BadRequestException(`La factura con ID: ${ idFactura } tiene al menos un Complemento de Pago Vigente, debes de cancelarlo primero`)
            }*/
          })
          /*facturaCancelar.complementoPagos.forEach( cP => {
            if( cP.estatus === EnumEstatusCFDI.VIGENTE ){
              throw new BadRequestException(`La factura con ID: ${ idFactura } tiene al menos un Complemento de Pago Vigente, debes de cancelarlo primero`)
            }
          })*/
        }
      }

      return facturaCancelar

    }catch(error){        
      
      if( error instanceof BadRequestException){

        throw error

      }

      if( error instanceof NotFoundException){

        throw error

      }

      throw new BadRequestException(`Hubo un error al consultar la Factura: ${error}`)        

    }

  }

  private async _validarCatalogoSatTipoComprobante( claveSatTipoComprobante: string, queryRunner: QueryRunner){
           
    try{

      const repoSatTipoComprobante = queryRunner.manager.getRepository(SatTipoComprobante);
      const satTipoComprobante = await repoSatTipoComprobante.findOneBy({ clave: claveSatTipoComprobante })

      if(!satTipoComprobante){
        throw new NotFoundException(`El Tipo de Comprobante con ID: ${claveSatTipoComprobante} no existe`)
      }

      return satTipoComprobante

    }catch( error ){
          
      if( error instanceof BadRequestException){       

        throw error

      }

      if( error instanceof NotFoundException){       

        throw error

      }      

      throw new BadRequestException(`Hubo un error al revisar los catálogos: ${error}`)

    }

  }
  
  private async _validarCatalogoSatCancelacionMotivo( claveSatCancelacionMotivo: string, queryRunner: QueryRunner){
           
    try{

      const repoSatCancelacionMotivo = queryRunner.manager.getRepository(SatCancelacionMotivo);
      const satCancelacionMotivo = await repoSatCancelacionMotivo.findOneBy({ clave: claveSatCancelacionMotivo })

      if(!satCancelacionMotivo){
        throw new NotFoundException(`El motivo de Cancelación con ID: ${claveSatCancelacionMotivo} no existe`)
      }

      return satCancelacionMotivo

    }catch( error ){
          
      if( error instanceof BadRequestException){       

        throw error

      }

      if( error instanceof NotFoundException){       

        throw error

      }      

      throw new BadRequestException(`Hubo un error al revisar los catálogos: ${error}`)

    }

  }

  private async _validarCatalogoSatMetodoPago( claveSatMetodoPago: string, queryRunner: QueryRunner){
           
    try{

      const repoSatMetodoPago = queryRunner.manager.getRepository(SatMetodoPago);
      const satMetodoPago = await repoSatMetodoPago.findOneBy({ clave: claveSatMetodoPago })

      if(!satMetodoPago){
        throw new NotFoundException(`El método de pago con ID: ${claveSatMetodoPago} no existe`)
      }

      return satMetodoPago

    }catch( error ){
          
      if( error instanceof BadRequestException){       

        throw error

      }

      if( error instanceof NotFoundException){       

        throw error

      }      

      throw new BadRequestException(`Hubo un error al revisar los catálogos: ${error}`)

    }

  }

  private async _validarCatalogoSatFormaPago( claveSatFormaPago: string, queryRunner: QueryRunner){
           
    try{

      const repoSatFormaPago = queryRunner.manager.getRepository(SatFormaPago);
      const satFormaPago = await repoSatFormaPago.findOneBy({ clave: claveSatFormaPago })

      if(!satFormaPago){
        throw new NotFoundException(`La forma de pago con ID: ${claveSatFormaPago} no existe`)
      }

      return satFormaPago

    }catch( error ){
          
      if( error instanceof BadRequestException){       

        throw error

      }

      if( error instanceof NotFoundException){       

        throw error

      }      

      throw new BadRequestException(`Hubo un error al revisar los catálogos: ${error}`)

    }

  }

  private async _validarCatalogoSatMoneda( claveSatMoneda: string, queryRunner: QueryRunner){
           
    try{

      const repoSatMoneda = queryRunner.manager.getRepository(SatMoneda);
      const satMoneda = await repoSatMoneda.findOneBy({ clave: claveSatMoneda })

      if(!satMoneda){
        throw new NotFoundException(`La forma de pago con ID: ${claveSatMoneda} no existe`)
      }

      return satMoneda

    }catch( error ){
          
      if( error instanceof BadRequestException){       

        throw error

      }

      if( error instanceof NotFoundException){       

        throw error

      }      

      throw new BadRequestException(`Hubo un error al revisar los catálogos: ${error}`)

    }

  }

  private async _validarCatalogoSatExportacion( claveSatExportacion: string, queryRunner: QueryRunner){
           
    try{

      const repoSatExportacion = queryRunner.manager.getRepository(SatExportacion);
      const satExportacion = await repoSatExportacion.findOneBy({ clave: claveSatExportacion })

      if(!satExportacion){
        throw new NotFoundException(`La clave de exportacion con ID: ${claveSatExportacion} no existe`)
      }

      return satExportacion

    }catch( error ){
          
      if( error instanceof BadRequestException){       

        throw error

      }

      if( error instanceof NotFoundException){       

        throw error

      }      

      throw new BadRequestException(`Hubo un error al revisar los catálogos: ${error}`)

    }

  }
  
  private async _validarFacturasSiExistan( idsFacturas: string[], fechaPagoLocal: string, fechaEmisionLocal: string, queryRunner: QueryRunner){
           
    try{

      const repoFactura = queryRunner.manager.getRepository(Factura);

      const facturasExistentes = await repoFactura.find({
        where: {
          satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO },
          id: In(idsFacturas)
        },
        select: [ 'id', 'uuid', 'total', 'estatus', 'fechaTimbrado', 'receptorRFC', 'receptorRazonSocial', 'receptorSatRegimenFiscal', 'receptorCodigoPostal', 'emisorRFC', 'emisorRazonSocial', 'emisorSatRegimenFiscal', 'emisorCodigoPostal', 'lugarExpedicion' ],
        relations: ['satMetodoPago', 'orden', 'receptorSatRegimenFiscal', 'emisorSatRegimenFiscal', 'pagos']
      })

      if( facturasExistentes.length == 0 ){
          throw new NotFoundException(`No se encontró ninguna factura indicada`);
      }
      
      const facturaBase = facturasExistentes[0];
      
      facturasExistentes.forEach( facturaExistente => {

        if( facturaExistente.estatus === EnumEstatusCFDI.CANCELADA ){
          throw new BadRequestException(`La factura con ID: ${ facturaExistente.id.toUpperCase() } está Cancelada`)
        }

        if( facturaExistente.estatus !== EnumEstatusCFDI.VIGENTE ){
          throw new BadRequestException(`La factura con ID: ${ facturaExistente.id.toUpperCase() } no está Vigente`)
        }
  
        if( facturaExistente.satMetodoPago.clave !== EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO ){
          throw new BadRequestException(`La factura con ID: ${ facturaExistente.id.toUpperCase() } no está con método de pago PPD - Pago en Parcialidades ó Diferido, por lo que no se puede generar un Complemento de Pago`)
        }

        if( facturaExistente.orden.liquidacionFactura ){
          throw new BadRequestException(`La Factura: ${ facturaExistente.id.toUpperCase() } con la Orden: ${ facturaExistente.orden.id.toUpperCase() }  ya está liquidada con fecha: ${ format( facturaExistente.orden.fechaLiquidacion, 'yyyy-MM-dd HH:mm:ss') }, por lo que no se puede generar un Complemento de Pago`)
        }

        if( dateIsGreaterThan( facturaExistente.fechaTimbrado, new Date( fechaPagoLocal ) ) ){
          throw new BadRequestException(`La fecha del pago no puede ser menor a la fecha de timbrado de la factura: ${ facturaExistente.fechaTimbrado }. Factura: ${ facturaExistente.id.toUpperCase() }`)
        }  
        
      })
      
      if( dateIsGreaterThan( new Date( fechaEmisionLocal ), new Date( fechaPagoLocal ) ) ){
        throw new BadRequestException(`La fecha de Emision: ${ fechaEmisionLocal } no puede ser menor a la fecha de Pago: ${ fechaPagoLocal }`)
      }

      if( dateIsDistinctMonthAndYear( new Date(fechaPagoLocal), new Date( fechaEmisionLocal ) ) ){
        throw new BadRequestException(`La fecha del Pago y la fecha de Emision deben ser del mismo mes y año`)
      }

      return facturasExistentes;

    }catch( error ){
          
      if( error instanceof BadRequestException){       

        throw error

      }

      if( error instanceof NotFoundException){       

        throw error

      }      

      throw new BadRequestException(`Hubo un error al revisar los catálogos: ${error}`)

    }

  }

  private async _validarFacturaNoExista( idOrden: string, queryRunner: QueryRunner){
    
      try{        

        const repoFactura = queryRunner.manager.getRepository(Factura);
        
        const facturaExistente = await repoFactura.findOne({
          where: {
            satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO},
            orden: { id: idOrden },
            estatus: EnumEstatusCFDI.VIGENTE,
            fechaCancelacion: null
          },
          relations: ['satMetodoPago']
        });        
  
        if( facturaExistente ){

          if(facturaExistente.satMetodoPago.clave === EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION ){
            throw new NotFoundException(`Ya existe una Factura con método de PUE - Pago de Una sola Exhibición para esta orden, la factura tiene el ID: ${facturaExistente.id }`)
          }else{
            throw new NotFoundException(`Ya existe una Factura con método de PPD - Pago en Parcialidades ó Diferido para esta orden, la factura tiene el ID: ${facturaExistente.id }`)

          }          

        }

      }catch(error){        
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al consultar la Factura: ${error}`)        

      }    
  }

  private _validarReceptorFacturas( listaFacturas: Partial<Factura[]>): IReceptor{

    try{

      if( listaFacturas.length === 0) {
        throw new NotFoundException(`El listado de Facturas está vacío`);
      }

      const facturaBase = listaFacturas[0];

      console.log("facturaBase")
      console.log(facturaBase)

      const receptor: IReceptor = {
        rfc:              facturaBase.receptorRFC,
        razon_social:     facturaBase.receptorRazonSocial,
        uso_cfdi:         "CP01",
        regimen_fiscal:   facturaBase.receptorSatRegimenFiscal.clave,
        codigo_postal:    facturaBase.receptorCodigoPostal
      }

      if( listaFacturas.length == 1){
        return receptor;
      }

      const consistenciaCorrecta = listaFacturas.every( f => 
        f.receptorRFC                    === receptor.rfc &&
        f.receptorRazonSocial            === receptor.razon_social &&
        f.receptorSatRegimenFiscal.clave === receptor.regimen_fiscal &&
        f.receptorCodigoPostal           === receptor.codigo_postal
      )

      if( !consistenciaCorrecta ){
        throw new NotFoundException(`El listado de Facturas tiene Receptores con distinta información`);
      }

      return receptor;

    }catch(error){
            
      if( error instanceof BadRequestException){
      
        throw error

      }

      if( error instanceof NotFoundException){        

        throw error

      }     

      throw new BadRequestException(`Hubo un error al validar al receptor: ${error}`)        

    }

  }

  private async _obtenerFolioSerie( queryRunner: QueryRunner, user: User){
    // OBTENER FOLIOS Y SERIES
    //let serie = ''
    //let folio = ''
    try{    

      const serieAnio = `${new Date().getFullYear()}${user.compania.id}`

      //const serie = `${serieAnio}-${satTipoComprobante.descripcion}`
      
      let serie = `${serieAnio}-${EnumSatTipoComprobanteDescripcion.INGRESO}`
    
      //const folio = await this.obtenerFolio( repoFactura );
      let folio = await this.obtenerFolioFactura( queryRunner );

      return {
        serie,
        folio
      }
  
    }catch( error ){    
          
      if( error instanceof BadRequestException){        

        throw error

      }

      if( error instanceof NotFoundException){

        throw error

      }   

      throw new BadRequestException(`Hubo un error al obtener los folios: ${error}`)

    }
  }

  private async _cancelarConceptosOrden( idOrden: string, queryRunner: QueryRunner){

     try{

      const repoOrdenConcepto = queryRunner.manager.getRepository(OrdenConcepto);
        
        await repoOrdenConcepto.update(
          { orden: { id: idOrden } },
          { estatus: EnumEstatusConcepto.CANCELADA }
        )
    
      }catch( error ){    
            
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }   

        throw new BadRequestException(`Hubo un error al obtener intentar cancelar los Conceptos de la Orden: ${error}`)

      }

  }  

  /*private async _cancelarConceptosFactura( idFactura: string, queryRunner: QueryRunner){

     try{

        const repoFacturaConcepto = queryRunner.manager.getRepository(FacturaConcepto);
        
        await repoFacturaConcepto.update(
          { factura: { id: idFactura } },
          { estatus: EnumEstatusConcepto.CANCELADA }
        )
    
      }catch( error ){    
            
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }   

        throw new BadRequestException(`Hubo un error al obtener intentar cancelar los Conceptos de la Factura: ${error}`)

      }

  }
  */

  private async _cancelarConceptosEImpuestosFactura( idFactura: string, queryRunner: QueryRunner){

     try{
       
       const repoFacturaConcepto = queryRunner.manager.getRepository(FacturaConcepto);
       
       const conceptos = await repoFacturaConcepto.find({
        where: { factura: { id: idFactura} },
        relations: ['impuestos']
       });

       for( const concepto of conceptos ){
        concepto.estatus = EnumEstatusConcepto.CANCELADA;
        concepto.impuestos.forEach( i => i.estatus = EnumEstatusConcepto.CANCELADA )        
       }

       await queryRunner.manager.save( conceptos );
    
      }catch( error ){    
            
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }   

        throw new BadRequestException(`Hubo un error al obtener intentar cancelar los Conceptos de la Factura: ${error}`)

      }

  }

  private async _guardarConceptosEImpuestosFactura( facturaConceptos: any, facturaGuardada: Factura, queryRunner: QueryRunner ){

    try{      

      const repoFacturaConcepto = queryRunner.manager.getRepository(FacturaConcepto);

      const conceptos = facturaConceptos.map( fC => {        

        const concepto = new FacturaConcepto();
          //productoServicio: { id: fC.productoServicio. fcProductoServicio}
        concepto.productoServicio = fC.productoServicio;
        concepto.valorUnitario = fC.valor_unitario;
        concepto.cantidad = fC.cantidad;
        concepto.subtotal = fC.subtotal;
        concepto.descuento = fC.descuento,
        concepto.importe = fC.importe;
        concepto.factura = facturaGuardada;
        concepto.estatus = EnumEstatusConcepto.VIGENTE

        concepto.impuestos = []

        fC.impuestos?.traslados?.forEach( iT => {
          const impuestoTraslado = new FacturaConceptoImpuesto();
          impuestoTraslado.base = iT.base;
          impuestoTraslado.satImpuesto = this.getSatImpuestoPorClave( iT.impuesto );
          impuestoTraslado.tipoFactor = iT.tipo_factor;
          impuestoTraslado.tasaCuota = iT.tasa_cuota;
          impuestoTraslado.importe = iT.importe;
          impuestoTraslado.tipo = 'Traslado';
          impuestoTraslado.estatus = EnumEstatusConcepto.VIGENTE;
          //impuestoTraslado.concepto = fC;
          concepto.impuestos.push(impuestoTraslado);
        })

        fC.impuestos?.retenciones?.forEach(iR => {
          const impuestoRetencion = new FacturaConceptoImpuesto();
          impuestoRetencion.base = iR.base;
          impuestoRetencion.satImpuesto = this.getSatImpuestoPorClave(iR.impuesto);
          impuestoRetencion.tipoFactor = iR.tipo_factor;
          impuestoRetencion.tasaCuota = iR.tasa_cuota;
          impuestoRetencion.importe = iR.importe;
          impuestoRetencion.tipo = 'Retencion';
          impuestoRetencion.estatus = EnumEstatusConcepto.VIGENTE;
          //impuestoRetencion.concepto = iR;
          concepto.impuestos.push(impuestoRetencion);
        });

        return concepto;
      })      

      //Guardar todo en cascada
      const conceptosGuardados = await repoFacturaConcepto.save( conceptos );

      return conceptosGuardados;

    }catch(error){

      if( error instanceof BadRequestException){        

        throw error

      }

      if( error instanceof NotFoundException){     

        throw error

      }

      if( error instanceof QueryFailedError){       

        if( error.driverError?.code === '23503'){
          throw new BadRequestException('Error con las claves foráneas al guardar en Concepto')
        }

        throw new BadRequestException(error)

      }
    
      throw new BadRequestException(`Hubo un error al guardar los conceptos de la factura: ${error}`)

    }
  }

  //TODO
  private async _guardarConceptosFactura( conceptosFactura: any, facturaGuardada: Factura, queryRunner: QueryRunner ){
    // GUARDAR CONCEPTOS DE SUSTITUCION DE LA FACTURA    
    try{
      
      const conceptos = []

      const repoFacturaConcepto = queryRunner.manager.getRepository( FacturaConcepto );

      //totalesConceptosImpuestosFactura.conceptosFactura.forEach( cF => {
      conceptosFactura.forEach( cF => {
                
        const concepto = {
          claveProdServ: { id: cF.clave_prod_serv } as SatProductoServicio,
          descripcion: cF.descripcion,
          claveUnidad: cF.clave_unidad,
          unidad: cF.unidad,
          valorUnitario: cF.valor_unitario,
          cantidad: cF.cantidad,
          subtotal: cF.subtotal,
          descuento: cF.descuento,
          importe: cF.importe,
          //productoServicio: { id : cF.producto_servicio } as ProductoServicio,
          productoServicio: { id : cF.productoServicio } as ProductoServicio,
          objetoImpuesto: cF.objeto_impuesto,
          factura: facturaGuardada,
          estatus: EnumEstatusConcepto.VIGENTE
        }
      
        conceptos.push( concepto );

      })
        
      const result = await repoFacturaConcepto.insert( conceptos );
  
    }catch(error){     
      
      if( error instanceof BadRequestException){        

        throw error

      }

      if( error instanceof NotFoundException){     

        throw error

      }

      if( error instanceof QueryFailedError){       

        if( error.driverError?.code === '23503'){
          throw new BadRequestException('Error con las claves foráneas al guardar en Concepto')
        }

        throw new BadRequestException(error)

      }
    
      throw new BadRequestException(`Hubo un error al guardar los conceptos de la factura: ${error}`)

    }
  }

  private async _guardarImpuestosFactura( totalesConceptosImpuestosFactura: any, queryRunner: QueryRunner){
     // GUARDAR CONCEPTOS IMPUESTOS DE SUSTITUCION

      try{

        const impuestos = []     
        const repoFacturaConceptoImpuesto = queryRunner.manager.getRepository(FacturaConceptoImpuesto);

        totalesConceptosImpuestosFactura.conceptosFactura.forEach( cF => {

          cF.impuestos?.traslados?.forEach( iT => {

            const impuestoTraslado = {
              base: iT.base,
              satImpuesto: this.getSatImpuestoPorClave( iT.impuesto ),
              tipoFactor: iT.tipo_factor,
              tasaCuota: iT.tasa_cuota,
              importe: iT.importe,
              tipo: 'Traslado',
              concepto: cF
            }        

            impuestos.push( impuestoTraslado )          
            
          })

          cF.impuestos?.retenciones?.forEach( iR => {        

            const impuestoRetencion = {
              base: iR.base,
              satImpuesto: this.getSatImpuestoPorClave( iR.impuesto ),
              tipoFactor: iR.tipo_factor,
              tasaCuota: iR.tasa_cuota,
              importe: iR.importe,
              tipo: 'Retencion',
              concepto: cF
            }

            impuestos.push( impuestoRetencion )
            
          })
          
        });

        await repoFacturaConceptoImpuesto.insert( impuestos );

      }catch(error){
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){        

          throw error

        }

        if( error instanceof QueryFailedError){          

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Factura Concepto Impuesto')
          }

          throw new BadRequestException(error)

        }

        throw new BadRequestException(`Hubo un error al guardar los impuestos: ${error}`)

      }
  }

  private async _actualizarFacturaConDatosTimbrado( facturaActualizarDatosTimbrado: FacturaActualizarDatosTimbrado,  queryRunner: QueryRunner){
    
    try{

      const repoFactura = queryRunner.manager.getRepository(Factura);

      await repoFactura.update(
        { id: facturaActualizarDatosTimbrado.id.toLowerCase() },
        { 
          uuid: facturaActualizarDatosTimbrado.uuid,
          fechaEmision: new Date( facturaActualizarDatosTimbrado.fecha_emision ),
          fechaTimbrado: facturaActualizarDatosTimbrado.fecha_timbrado,
          sello: facturaActualizarDatosTimbrado.timbre_fiscal.sello,
          selloSat: facturaActualizarDatosTimbrado.timbre_fiscal.sello_sat,
          numCertificadoSat: facturaActualizarDatosTimbrado.timbre_fiscal.num_certificado_sat,
          rfcCertifico: facturaActualizarDatosTimbrado.timbre_fiscal.rfc_certifico
        }
      );      

    }catch(error){   
      
      if( error instanceof BadRequestException){       

        throw error

      }

      if( error instanceof NotFoundException){
    
        throw error

      }

      if( error instanceof QueryFailedError){         

        if( error.driverError?.code === '23503'){
          throw new BadRequestException('Error con las claves foráneas al actualizar la Factura de Sustitución')
        }

        throw new BadRequestException(error)

      }      

      throw new BadRequestException(`Hubo un error al actualizar la Factura de Sustitución: ${error}`)

    }    

  }

  private async _actualizarFacturaConFacturaSustitucion( facturaActualizarDatosFacturaSustitucion: FacturaActualizarDatosFacturaSustitucion,  queryRunner: QueryRunner){
    
    try{

      const repoFactura = queryRunner.manager.getRepository(Factura);

      await repoFactura.update(
        { id: facturaActualizarDatosFacturaSustitucion.idFacturaCancelar.toLowerCase() },
        { 
          idSustitucion: facturaActualizarDatosFacturaSustitucion.idSustitucion,
          uuidSustitucion: facturaActualizarDatosFacturaSustitucion.uuidSustitucion,
          fechaCancelacion: facturaActualizarDatosFacturaSustitucion.fechaCancelacion,
          satCancelacionMotivo: { clave:  EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION } as SatCancelacionMotivo,
          estatus: EnumEstatusCFDI.CANCELADA,
          cancelacionAcuseRespuesta: facturaActualizarDatosFacturaSustitucion.cancelacionAcuseRespuesta
        }
      );      

    }catch(error){   
      
      if( error instanceof BadRequestException){       

        throw error

      }

      if( error instanceof NotFoundException){
    
        throw error

      }

      if( error instanceof QueryFailedError){         

        if( error.driverError?.code === '23503'){
          throw new BadRequestException('Error con las claves foráneas al actualizar la Factura Original con la Factura de Sustitución')
        }

        throw new BadRequestException(error)

      }      

      throw new BadRequestException(`Hubo un error al actualizar la Factura Original con la Factura de Sustitución: ${error}`)

    }    

  }
  
  private async _actualizarOrdenConNuevaFactura( idOrden: string, satMetodoPago: SatMetodoPago, queryRunner: QueryRunner ){

    try{

      const repoOrden = queryRunner.manager.getRepository( Orden );

      await repoOrden.update(
        {id: idOrden },
        {
          estatusFactura: EnumEstatusOrdenFactura.TIMBRADA,
          liquidacionFactura: ( satMetodoPago.clave == EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION ),
          satMetodoPago: satMetodoPago,
          fechaLiquidacion: ( satMetodoPago.clave == EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION ) ? new Date() : null
        }
      )

    }catch(error){ 
      
      if( error instanceof BadRequestException){

        throw error

      }

      if( error instanceof NotFoundException){

        throw error

      }

      if( error instanceof QueryFailedError){

        if( error.driverError?.code === '23503'){
          throw new BadRequestException('Error con las claves foráneas al actualizar la Orden')
        }

        throw new BadRequestException(error)

      }

      throw new BadRequestException(`Hubo un error al actualizar la Orden con los datos de la nueva Factura: ${error}`)

    }
  

  }

  private async _actualizarOrdenFacturaCancelada( idOrden: string, queryRunner: QueryRunner ){

    try{

      const repoOrden = queryRunner.manager.getRepository( Orden );

      await repoOrden.update(
        {id: idOrden },
        {
          liquidacionFactura: false,
          estatusFactura: EnumEstatusOrdenFactura.PENDIENTE
        }
      )

    }catch(error){ 
      
      if( error instanceof BadRequestException){

        throw error

      }

      if( error instanceof NotFoundException){

        throw error

      }

      if( error instanceof QueryFailedError){

        if( error.driverError?.code === '23503'){
          throw new BadRequestException('Error con las claves foráneas al actualizar la Orden')
        }

        throw new BadRequestException(error)

      }

      throw new BadRequestException(`Hubo un error al actualizar la Orden para cancelar su liquidación: ${error}`)

    }
  

  }

  private async _actualizarOrdenesConComplemento(facturasExistentes: Factura[], liquidar: boolean, user: User, queryRunner: QueryRunner){
     
      try{

        if( !liquidar ) return;

        const idsOrdenes = facturasExistentes.map( fE => {
          return fE.orden.id
        })
        
        //const newDateLocal = formatInTimeZone( new Date(), user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss' )

        const updateOrden = {
          liquidacionFactura: true,
          fechaLiquidacion: new Date()
        }

        const repoOrden = queryRunner.manager.getRepository( Orden );
        
        await repoOrden.update( idsOrdenes, updateOrden )

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al actualizar la Orden')
          }

          throw new BadRequestException(error)

        }        

        throw new BadRequestException(`Hubo un error al actualizar la ó las Ordenes: ${error}`)

      }            


  }

  private _definirPagos( pagoIndividual: boolean, facturasExistentes: Factura[], complemento: Complemento,  monto: string ){

    let montoTotal = 0;

    const pagos: Pago[]  = []

    facturasExistentes.forEach( fE => {

      const pago = new Pago()      

      if( pagoIndividual ){

        montoTotal = Number( monto )

        pago.numeroParcialidad = fE.pagos.length + 1;
        const totalPagado = fE.pagos.reduce( (acumulador, p ) => { return p.complemento.estatus === EnumEstatusCFDI.VIGENTE ? acumulador + p.monto : acumulador; }, 0 );
        pago.saldoAnterior =  Number( fE.total ) - totalPagado;
        pago.monto = Number( monto );
        pago.saldoInsoluto = pago.saldoAnterior - pago.monto;
        pago.factura = { id: fE.id, uuid: fE.uuid } as Factura;
        pago.complemento = complemento;

        if( pago.monto > pago.saldoInsoluto ){
          throw new BadRequestException(`El monto pagado no puede ser mayor al saldo insoluto: ${pago.saldoInsoluto}`)
        }

      }else{

        montoTotal += Number( fE.total )

        pago.numeroParcialidad = 1;
        pago.saldoAnterior = Number( fE.total );
        pago.monto = Number( fE.total );
        pago.saldoInsoluto = 0;
        pago.factura = { id: fE.id } as Factura;
        pago.complemento = complemento;

      }

      pagos.push( pago)

      console.log( "------pagos------" )
      console.log( pagos )

    })

    let liquidar = true
    if( pagoIndividual ){
      liquidar = pagos[0].saldoInsoluto == 0
    }

    return {
      pagos,
      montoTotal,
      liquidar
    }

  }
  /* Create FACTURA ( PUE - PPD ) */
  async createFactura( createFacturaDto: CreateFacturaDto, user: User ) {

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    
    try{
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const repoFactura = queryRunner.manager.getRepository(Factura);

      const fechaLocal = this._obtenerFechaLocalFactura();

      // REVISAR EL TIPO DE COMPROBANTE Y EL METODO DE PAGO 
      try{        

        if( createFacturaDto.claveSatTipoComprobante != EnumSatTipoComprobante.INGRESO ){
          throw new BadRequestException(`Debes de asignar una factura con Tipo de Comprobante I - Ingreso`)
        }

        if( createFacturaDto.claveSatMetodoPago != EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION 
            && createFacturaDto.claveSatMetodoPago != EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO ){
          throw new BadRequestException(`Debes de asignar una factura con Método de Pago válido`)
        }

      }catch(error){
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){          

          throw error

        }

        throw new BadRequestException(`Hubo un error al intentar generar la Factura: ${error}`)

      }
      
      // VALIDAR QUE LA ORDEN NO TENGA FACTURA VIGENTE
      await this._validarFacturaNoExista(createFacturaDto.id_orden, queryRunner)
      
      // OBTENER API FACTURA -
      const apiFactura = this._obtenerApiFacturaPAC();
   
      // OBTENER EMISOR -
      const emisor = await this._obtenerEmisor( queryRunner );
   
      // REVISAR TIMBRES DISPONIBLES -
      await this._validarTimbresDisponibles( emisor, apiFactura ) 
      
      // VALIDAR QUE EXISTAN LOS DATOS DEL DTO EN LOS CATALOGOS
      const satTipoComprobante = await this._validarCatalogoSatTipoComprobante( createFacturaDto.claveSatTipoComprobante, queryRunner);
      const satFormaPago = await this._validarCatalogoSatFormaPago( createFacturaDto.claveSatFormaPago, queryRunner );
      const satMetodoPago = await this._validarCatalogoSatMetodoPago( createFacturaDto.claveSatMetodoPago, queryRunner );
      const satMoneda = await this._validarCatalogoSatMoneda( createFacturaDto.claveSatMoneda, queryRunner );
      const satExportacion = await this._validarCatalogoSatExportacion( createFacturaDto.claveSatExportacion, queryRunner );

      // OBTENER FOLIOS Y SERIES -
      let { serie, folio } = await this._obtenerFolioSerie( queryRunner, user )

      // OBTENER DATOS DE LA ORDEN
      const orden = await this._obtenerOrden( createFacturaDto.id_orden, queryRunner );      

      const { receptor, receptorSatRegimenFiscal, receptorSatUsoCFDI, receptorSatTipoPersona } = await this._obtenerReceptorYCatalogos( orden, createFacturaDto.receptorClaveSatTipoPersona, queryRunner )
            
      // CALCULAR LOS IMPUESTOS DE LOS CONCEPTOS -
      let totalesConceptosImpuestosFactura = await this._calcularConceptosImpuestosFacturaNew( createFacturaDto.receptorClaveSatTipoPersona as EnumSatTipoPersona, orden.conceptos, emisor, user );
      
      let nuevoId = await this._obtenerNuevoId(repoFactura, EnumPrefijoEntity.FACTURAS );

      const { fechaEmisionLocal, fechaPagoLocal } = this._obtenerFechasLocales( new Date( createFacturaDto.fechaEmision ), new Date(), user);

                       //throw new BadRequestException("TODO BIEN HASTA AQUI")
     
      // GUARDAR FACTURA LOCAL
      let facturaGuardada: Factura | null = null;      

      try{

        const nuevaFactura = repoFactura.create({
          id: nuevoId,           
          serie: serie,
          folio: folio,
          satFormaPago: satFormaPago,
          condicionesPago: createFacturaDto.condicionesPago,
          satMetodoPago: satMetodoPago,
          satMoneda: satMoneda,
          tipoCambio: 1,
          lugarExpedicion: createFacturaDto.lugarExpedicion,
          observaciones: createFacturaDto.observaciones,
          satTipoComprobante: satTipoComprobante,
          subtotal:  totalesConceptosImpuestosFactura.totalesFactura.subtotal.toFixed(2),
          descuento: "0",
          total: totalesConceptosImpuestosFactura.totalesFactura.total.toFixed(2),
          emisorRFC: emisor.rfc,
          emisorRazonSocial: emisor.razonSocial,
          emisorSatRegimenFiscal: emisor.satRegimenFiscal,
          emisorCodigoPostal: emisor.codigoPostal,
          receptorRFC: receptor.rfc,
          receptorRazonSocial: receptor.razon_social,
          receptorEmail: receptor.email,
          receptorSatRegimenFiscal: receptorSatRegimenFiscal,
          receptorSatUsoCFDI: receptorSatUsoCFDI,
          receptorCodigoPostal: receptor.codigo_postal,
          receptorSatTipoPersona: receptorSatTipoPersona,
          fechaCancelacion: null,
          anio: new Date( createFacturaDto.fechaEmision ).getFullYear().toString(),
          satExportacion: satExportacion,
          emisor: emisor,
          receptorCliente: orden.cliente,
          receptorEmpresa: orden.empresa,
          orden: orden,
          estatus: EnumEstatusCFDI.VIGENTE
        }) 
        
        facturaGuardada = await repoFactura.save( nuevaFactura )

      }catch(error){   
        
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){       

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Factura')
          }

          throw new BadRequestException(error)

        }       

        throw new BadRequestException(`Hubo un error al generar la Factura: ${error}`)

      }

      // GUARDAR CONCEPTOS E IMPUESTOS
      await this._guardarConceptosEImpuestosFactura( totalesConceptosImpuestosFactura.conceptosFactura, facturaGuardada, queryRunner );      
      
      // GUARDAR FACTURA PAC
      let facturaPAC: any | null = null;      
      
      try{              

        const nuevaFacturaPAC = {
          fecha_emision: fechaEmisionLocal,
          serie: serie,
          folio: Number( folio ),
          forma_pago: satFormaPago.clave,
          condiciones_pago: createFacturaDto.condicionesPago,
          metodo_pago: satMetodoPago.clave,          
          moneda: satMoneda.clave,
          lugar_expedicion: createFacturaDto.lugarExpedicion,
          observaciones: createFacturaDto.observaciones,
          tipo_comprobante: satTipoComprobante.clave,
          subtotal: totalesConceptosImpuestosFactura.totalesFactura.subtotal,
          total: totalesConceptosImpuestosFactura.totalesFactura.total,
          exportacion: satExportacion.clave,
          emisor: {
            rfc: emisor.rfc.toUpperCase(),
            razon_social: emisor.razonSocial.toUpperCase(),
            regimen_fiscal: emisor.satRegimenFiscal.clave,
            codigo_postal: emisor.codigoPostal
          },
          receptor: receptor,
          conceptos: totalesConceptosImpuestosFactura.conceptosFactura,
          impuestos: totalesConceptosImpuestosFactura.impuestosFactura
        } 
        
        const headers = this._obtenerHeadersPAC();        
        
        const respuesta =  await firstValueFrom( this.httpService.post( `${apiFactura.url}/v1/facturacion/timbrar`, nuevaFacturaPAC, {
          headers
        } ) );

        facturaPAC = respuesta.data.data;    

      }catch(error: any){ 

        if( error.response?.status == 400){
   
          if( error.response?.data?.status == 'error'){

            throw new BadRequestException( `Hubo un error al generar la Factura PAC: ${error.response?.data?.message}` )

          }
        }
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        } 

        throw new BadRequestException(`Hubo un error al generar la Factura PAC: ${error}`)

      }      
      
      // UPDATE FACTURA LOCAL CON LOS DATOS DEL TIMBRADO PAC -
      await this._actualizarFacturaConDatosTimbrado( { id:facturaGuardada.id, ...facturaPAC }, queryRunner );
      
      // UPDATE ORDEN CON LOS DATOS DE LA NUEVA FACTURA
      await this._actualizarOrdenConNuevaFactura( orden.id, satMetodoPago, queryRunner ); 
      
      await queryRunner.commitTransaction()      
      
      return {
        id: facturaGuardada.id
      }

    }catch(error: any){

      await queryRunner.rollbackTransaction();

      const data = error?.response?.data

      if( data ){

        if( data.message ){

          throw new BadRequestException(`Error al facturar: ${ data.message} `);
        }

      }
      
      if(error instanceof NotFoundException ){

        throw error
      }

      if(error instanceof BadRequestException){

        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar crear la Factura: ${error}`)      

    }finally{
      await queryRunner.release();
    }   
    
  }

  /* Create COMPLEMENTO - Complemento de Pago */
  async createComplemento( createComplementoDto: CreateComplementoDto, user: User ) {

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    
    try{
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      //const repoFactura = queryRunner.manager.getRepository(Factura);
      //const repoOrden = queryRunner.manager.getRepository(Orden);
      const repoComplemento = queryRunner.manager.getRepository(Complemento);

      // DEFINIR FECHAS LOCALES

      //let fechaEmisionLocal: string;
      //let fechaPagoLocal: string;

      const fechaEmisionUTC = this._obtenerFechaToZonedTime( createComplementoDto.fechaEmision, user.zonaHoraria.clave ) 

      console.log( "fechaEmisionUTC" )
      console.log( fechaEmisionUTC )



      const { fechaEmisionLocal, fechaPagoLocal } = this._obtenerFechasLocales( createComplementoDto.fechaEmision, createComplementoDto.fechaPago, user );

      console.log("fechaEmisionLocal")
      console.log(fechaEmisionLocal)


                    //throw new BadRequestException("TODO BIEN HASTA AQUI")

      this._validarDetallesComplemento( createComplementoDto.monto, createComplementoDto.claveSatTipoComprobante );
      
      // 00 FACTURA EXISTENTE Y VALIDACIONES      
      const idsFacturas = createComplementoDto.pagoIndividual ? [createComplementoDto.id_factura] : createComplementoDto.idFacturas;

      let facturasExistentes: Factura[] = await this._validarFacturasSiExistan( idsFacturas, fechaPagoLocal, fechaEmisionLocal, queryRunner );
      
      let facturaBase = facturasExistentes[0];

      console.log( "facturaBase" )
      console.log( facturaBase )

      // OBTENER API FACTURA -
      const apiFactura = this._obtenerApiFacturaPAC();       

      // OBTENER EMISOR -
      const emisor = await this._obtenerEmisor( queryRunner );      
   
      // REVISAR TIMBRES DISPONIBLES -
      await this._validarTimbresDisponibles( emisor, apiFactura ) 
      
      // VALIDAR QUE EXISTAN LOS DATOS DEL DTO EN LOS CATALOGOS
      const satTipoComprobante = await this._validarCatalogoSatTipoComprobante( createComplementoDto.claveSatTipoComprobante, queryRunner );
      const satFormaPago = await this._validarCatalogoSatFormaPago( createComplementoDto.claveSatFormaPago, queryRunner );
      const satMoneda = await this._validarCatalogoSatMoneda( createComplementoDto.claveSatMoneda, queryRunner );
      const satExportacion = await this._validarCatalogoSatExportacion( createComplementoDto.claveSatExportacion, queryRunner );
     
      // OBTENER FOLIOS Y SERIES -
      let { serie, folio } = await this._obtenerFolioSerie( queryRunner, user )
      
      // DEFINIR EL RECEPTOR
      let receptor = this._validarReceptorFacturas(facturasExistentes)
      
      let nuevoId = await this._obtenerNuevoId(repoComplemento, EnumPrefijoEntity.COMPLEMENTOSPAGOS);
      
      // GUARDAR COMPLEMENTO PAGO LOCAL
      let complementoGuardado: Complemento | null = null;
      
      let montoTotal = 0;
      let liquidar = true;
      
      try{

        const nuevoComplemento = repoComplemento.create({
          id: nuevoId,
          satTipoComprobante: satTipoComprobante,
          satFormaPago: satFormaPago,
          satMoneda: satMoneda,
          satExportacion: satExportacion,
          tipoCambio: 1,
          observaciones: createComplementoDto.observaciones,
          anio: new Date( createComplementoDto.fechaEmision ).getFullYear().toString(),
          serie: serie,
          folio: folio,
          estatus: EnumEstatusCFDI.VIGENTE
        })
     
        console.log( "COMPLEMENTO 02" )

        const { pagos, montoTotal: montoTotalDefinido, liquidar: liquidarDefinido } = this._definirPagos( createComplementoDto.pagoIndividual, facturasExistentes, nuevoComplemento, createComplementoDto.monto );

        montoTotal = montoTotalDefinido;
        liquidar = liquidarDefinido;

        console.log( "COMPLEMENTO 03" )

        console.log( "pagos: " )
        console.log( pagos )

        console.log( "montoTotal: " )
        console.log( montoTotal )        
        
        nuevoComplemento.montoTotal = montoTotal;
        nuevoComplemento.facturasRelacionadas = pagos;
          
        complementoGuardado = await repoComplemento.save( nuevoComplemento );
            
      }catch(error){   
        
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){       

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Factura Complemento Pago')
          }

          throw new BadRequestException(error)

        }       

        throw new BadRequestException(`Hubo un error al generar la Factura Complemento Pago: ${error}`)

      }      
      
      // GUARDAR COMPLEMENTO PAGO PAC
        
      let complementoPAC: any | null = null;      
      
      try{

        const emisorComplemento = {
          rfc: facturaBase.emisorRFC.toUpperCase(),
          razon_social: facturaBase.emisorRazonSocial.toUpperCase(),
          uso_cfdi: "G03",            
          regimen_fiscal: facturaBase.emisorSatRegimenFiscal.clave,
          codigo_postal: facturaBase.emisorCodigoPostal
        }

        const documentosRelacionados = complementoGuardado.facturasRelacionadas.map( p => {
           return {
            id_documento: p.factura.uuid,
            moneda_dr: satMoneda.clave,
            equivalencia_dr: 1,
            num_parcialidad: p.numeroParcialidad,
            imp_saldo_ant: p.saldoAnterior,
            imp_pagado: p.monto,
            imp_saldo_insoluto: p.saldoInsoluto,            
            objeto_imp_dr: "01"
          }
        });

        const nuevoComplementoPagoPAC = {
          fecha_emision: fechaEmisionLocal,
          serie: serie,
          folio: Number( folio ),
          moneda: "XXX",
          lugar_expedicion: facturaBase.lugarExpedicion,
          observaciones: createComplementoDto.observaciones,
          tipo_comprobante: satTipoComprobante.clave,
          subtotal: 0,
          total: 0,
          exportacion: satExportacion.clave,
          emisor: emisorComplemento,
          receptor: receptor,
          conceptos: [
            {
              clave_prod_serv: "84111506",
              descripcion: "Pago",
              clave_unidad: "ACT",
              valor_unitario: 0,
              cantidad: 1,
              subtotal: 0,
              importe: 0,
              objeto_impuesto: "01"
            }
          ],
          complementos: {
            pagos_20: {
              version: "2.0",
              totales: {
                  monto_total_pagos: montoTotal
              },
              pago: [
                {
                  fecha_pago:  format( fechaPagoLocal, 'yyyy-MM-dd\'T\'HH:mm:ss'),
                  forma_de_pago_p: satFormaPago.clave,
                  moneda_p: satMoneda.clave,
                  tipo_cambio_p: 1,
                  monto: montoTotal,
                  docto_relacionado: documentosRelacionados,
                }
              ]
            }
          }
        }

        const headers = this._obtenerHeadersPAC();

        console.log("headers")
        console.log(headers)

        console.log("nuevoComplementoPagoPAC")
        console.log( JSON.stringify(  nuevoComplementoPagoPAC, null, 3 ) )
        
        const respuesta =  await firstValueFrom( this.httpService.post( `${apiFactura.url}/v1/facturacion/timbrar`, nuevoComplementoPagoPAC, {
          headers
        } ) );
        
        complementoPAC = respuesta.data.data;

      }catch(error: any){ 

        if( error.response?.status == 400){
   
          if( error.response?.data?.status == 'error'){

            throw new BadRequestException( `Hubo un error al generar el Complemento Pago PAC: ${error.response?.data?.message}` )

          }
        }
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        } 

        throw new BadRequestException(`Hubo un error al generar el Complemento Pago PAC: ${error}`)

      }      
      
      // COMPLEMENTO PAGO UPDATE
      
      try{
        
        await repoComplemento.update( complementoGuardado.id, {
          uuid:               complementoPAC.uuid,
          fechaTimbrado:      complementoPAC.fecha_timbrado,
          fechaPago:          fechaPagoLocal,
          fechaEmision:       complementoPAC.fecha_emision,
          sello:              complementoPAC.timbre_fiscal.sello,
          selloSat:           complementoPAC.timbre_fiscal.sello_sat,
          numCertificadoSat:  complementoPAC.timbre_fiscal.num_certificado_sat,
          rfcCertifico:       complementoPAC.timbre_fiscal.rfc_certifico,
        });        

      }catch(error){   
        
        if( error instanceof BadRequestException){       

          throw error

        }

        if( error instanceof NotFoundException){
      
          throw error

        }

        if( error instanceof QueryFailedError){         

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al actualizar el Complemento Pago')
          }

          throw new BadRequestException(error)

        }      

        throw new BadRequestException(`Hubo un error al actualizar el Complemento Pago: ${error}`)

      }

      await this._actualizarOrdenesConComplemento( facturasExistentes, liquidar, user, queryRunner );      
      
      await queryRunner.commitTransaction()

      return {        
        id: complementoGuardado.id      
      }      

    }catch(error: any){

      await queryRunner.rollbackTransaction();

      const data = error?.response?.data

      if( data ){

        if( data.message ){

          throw new BadRequestException(`Error al crear el Complemento: ${ data.message} `);
        }

      }
      
      if(error instanceof NotFoundException ){
        
        throw error
      }

      if(error instanceof BadRequestException){

        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar crear el Complemento: ${error}`)

    }finally{
      await queryRunner.release();
    }   
    
  }

  async createCancelacionFacturaNew( createCancelacionDto: CreateCancelacionDto, user: User ) {

    if( createCancelacionDto.claveSatCancelacionMotivo !== EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION){

      return this.createCancelacionFacturaNoSustitucionNew( createCancelacionDto, user );

    }else{

      return this.createCancelacionFacturaSiSustitucionNew( createCancelacionDto, user );

    }
    
  }

  async createIngresoNewCancelacionSiSustitucionNewNewNewNewNewNEwNew( createCancelacionDto: CreateCancelacionDto, user: User ) {

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    
    try{
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const repoFactura = queryRunner.manager.getRepository(Factura);

      let fechaLocal: string;
      let fechaUTC: string;
      let timbradoMayor72H: boolean = false;

      try{
              
        fechaLocal = formatInTimeZone( new Date(), user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss');
        fechaUTC = new Date().toISOString();

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al intentar establecer la Fecha Local: ${error}`)

      }

      // REVISAR EL TIPO DE COMPROBANTE Y EL METODO DE PAGO 
      /*
      try{        

        if( createFacturaDto.claveSatTipoComprobante != EnumSatTipoComprobante.INGRESO ){
          throw new BadRequestException(`Debes de asignar una factura con Tipo de Comprobante I - Ingreso`)
        }

        if( createFacturaDto.claveSatMetodoPago != EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION 
            && createFacturaDto.claveSatMetodoPago != EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO ){
          throw new BadRequestException(`Debes de asignar una factura con Método de Pago válido`)
        }

      }catch(error){
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){          

          throw error

        }

        throw new BadRequestException(`Hubo un error al intentar generar la Factura: ${error}`)

      }
      */

      // REVISAR QUE LA FACTURA A CANCELAR EXISTA Y VALIDARLA

      let facturaCancelar = await this._validarFacturaCancelar( createCancelacionDto.id_factura, createCancelacionDto.uuid, queryRunner )
      
      // VALIDAR QUE LA ORDEN NO TENGA FACTURA VIGENTE
      /*
      let facturaExistente: Factura | null = null;

      try{        
        
        facturaExistente = await repoFactura.findOne({
          where: {
            satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO},
            orden: { id: createFacturaDto.id_orden },
            estatus: EnumEstatusCFDI.VIGENTE,
            fechaCancelacion: null
          },
          relations: ['satMetodoPago']
        });        
  
        if( facturaExistente ){

          if(facturaExistente.satMetodoPago.clave === EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION ){
            throw new NotFoundException(`Ya existe una Factura con método de PUE - Pago de Una sola Exhibición para esta orden, la factura tiene el ID: ${facturaExistente.id }`)
          }else{
            throw new NotFoundException(`Ya existe una Factura con método de PPD - Pago en Parcialidades ó Diferido para esta orden, la factura tiene el ID: ${facturaExistente.id }`)

          }          

        }

      }catch(error){        
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al consultar la Factura: ${error}`)        

      }*/    
      
      // OBTENER API FACTURA -
      const apiFactura = this._obtenerApiFacturaPAC();
   
      // OBTENER EMISOR -
      const emisor = await this._obtenerEmisor( queryRunner );
   
      // REVISAR TIMBRES DISPONIBLES -
      await this._validarTimbresDisponibles( emisor, apiFactura ) 
      
      // VALIDAR QUE EXISTAN LOS DATOS DEL DTO EN LOS CATALOGOS
      
      const satCancelacionMotivo = await this._validarCatalogoSatCancelacionMotivo( createCancelacionDto.claveSatCancelacionMotivo, queryRunner )
      //let satTipoComprobante: SatTipoComprobante | null = null;
      //let satFormaPago: SatFormaPago | null = null;
      //let satMetodoPago: SatMetodoPago | null = null;

      /*
      console.log("cancelarFactura 01")
           
      try{

        const repoSatCancelacionMotivo = queryRunner.manager.getRepository(SatCancelacionMotivo);
        satCancelacionMotivo = await repoSatCancelacionMotivo.findOneBy({ clave: createCancelacionDto.claveSatCancelacionMotivo })

        if(!satCancelacionMotivo){
          throw new NotFoundException(`El motivo de Cancelación con ID: ${createCancelacionDto.claveSatCancelacionMotivo} no existe`)
        }

      }catch( error ){
            
        if( error instanceof BadRequestException){       

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        }      

        throw new BadRequestException(`Hubo un error al revisar los catálogos: ${error}`)

      }    
      */ 

      // CANCELAR LOS CONCEPTOS DE LA ORDEN
      //await this._cancelarConceptosOrden( facturaCancelar.orden.id, queryRunner )

      console.log("cancelarFactura 02")

      // CANCELAR LOS CONCEPTOS DE LA FACTURA
      await this._cancelarConceptosEImpuestosFactura( facturaCancelar.id, queryRunner )

      console.log("cancelarFactura 03")

      // OBTENER DATOS DE LA ORDEN
      /*
      let orden: Orden | null = null;

      try{
        
        const repoOrden = queryRunner.manager.getRepository(Orden);
        
        orden = await repoOrden.findOne({
          where: {id:createFacturaDto.id_orden },
          relations: ['cliente', 'cliente.satRegimenFiscal', 'cliente.satUsoCFDI', 'empresa', 'empresa.satRegimenFiscal', 'empresa.satUsoCFDI', 'conceptos', 'conceptos.productoServicio', 'conceptos.productoServicio.satProductoServicio']         
        });
  
        if(!orden){
          throw new NotFoundException(`La Orden: ${createFacturaDto.id_orden} no existe`)
        }

      }catch(error){
      
        if( error instanceof BadRequestException){       

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        }   

        throw new BadRequestException(`Hubo un error al consultar la Orden: ${error}`)        

      }*/

      console.log("cancelarFactura 04")

      console.log("fechaLocal")
      console.log(fechaLocal)

      console.log("fechaUTC")
      console.log(fechaUTC)

      console.log("new Date()")
      console.log(new Date())

      //cancelarFactura.idSustitucion = '';
      //cancelarFactura.uuidSustitucion = '';        

      // 09 CANCELACION DE LA FACTURA
      //let cancelarFactura: CancelarFactura ;
      
      try{

        //cancelarFactura.fechaCancelacion = fechaUTC;
        //cancelarFactura.satCancelacionMotivo = satCancelacionMotivo;
        //cancelarFactura.estatus = EnumEstatusCFDI.CANCELADA;

        //console.log("cancelarFactura")
        //console.log(cancelarFactura)
        
        await repoFactura.update(
          {id: facturaCancelar.id},
          {
            fechaCancelacion: fechaUTC                ,
            satCancelacionMotivo: satCancelacionMotivo,
            estatus: EnumEstatusCFDI.CANCELADA
          }
        )
        
      }catch(error){   
        
        
        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){
          //const repoOrden = queryRunner.manager.getRepository( Orden );
                      //const nuevaCancelacion = repoFactura.create( cancelarFactura )
                      //await repoFactura.update( facturaCancelar.id, nuevaCancelacion )          
            
                    //}else{
                      
                    //  const nuevaCancelacion = repoComplementoPago.create( cancelarFactura )
                    //  await repoComplementoPago.update( complementoPagoExistente.id, nuevaCancelacion )
            
                    //}
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){       

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Cancelacion')
          }

          throw new BadRequestException(error)

        }       

        throw new BadRequestException(`Hubo un error al generar la Cancelación: ${error}`)

      }


      //throw new BadRequestException("TODO BIEN HASTA AQUI")

           
      //CANCELAR FACTURA PAC
      
      let cancelacionPAC: any | null = null;
      let uuidFactura: string = '';
      let motivo: string = '';
      let folioSustitucion: string = '';
      
      try{

        //uuidFactura =       facturaCancelar.uuid;
        //motivo =            satCancelacionMotivo.clave;
        //folioSustitucion =  '';

        const headers = {
          //Authorization: `Bearer ${apiFactura.token}`,
          //'Content-Type': 'application/json',
          //'X-CLIENT-ID': apiFactura.clientId
          key: "Content-Type",
          value: "application/json",
          type: "text"
        } 

        const raw = {

        }

        /*        
        raw: "{
            "RfcEmisor": "IIA040805DZ4",
            "FolioFiscal": "380230be-e125-4bce-8ca4-e0a059389cc2",
            "MotivoCancelacion": "01",
            "FolioFiscalSustitucion": "9072de4b-d071-4b74-bfde-4248a86e5996"
        }",*/
        
        const cancelaCFDIAck = {
          RfcEmisor: facturaCancelar.emisorRFC.toUpperCase(),
          FolioFiscal: facturaCancelar.uuid,
          MotivoCancelacion: satCancelacionMotivo.clave,
          FolioFiscalSustitucion: ''
        }
        

        //respuesta
        /*{
            "CodigoSat": "0",
            "ResultadoSat": "",
            "Acuse": "<?xml version=\"1.0\" encoding=\"utf-8\"?><Acuse xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" Fecha=\"2025-12-02T22:14:35.1740028\" RfcEmisor=\"WATM640917J45\"><Folios xmlns=\"http://cancelacfd.sat.gob.mx\"><UUID>B3D1E2E5-A13C-49A7-B4E5-5B19CA4414B9</UUID><EstatusUUID>201</EstatusUUID></Folios><Signature xmlns=\"http://www.w3.org/2000/09/xmldsig#\"><SignedInfo><CanonicalizationMethod Algorithm=\"http://www.w3.org/TR/2001/REC-xml-c14n-20010315\" /><SignatureMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#rsa-sha1\" /><Reference URI=\"\"><Transforms><Transform Algorithm=\"http://www.w3.org/2000/09/xmldsig#enveloped-signature\" /></Transforms><DigestMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#sha1\" /><DigestValue>Zf5dGpvH0cuM5Kvi4N4gyMjtF3M=</DigestValue></Reference></SignedInfo><SignatureValue>b7Bdev3iAXiKTVNYRRoadX6y4Jh4H77AU6LwKnjYpkRUOvR+rVj8A0pMBP8wg5yCJ8EqBw25XAiVLsr1+GUYXNx+hdIF1YA3U7xGC3sZ7234+UglshVxaeFDJPyjLAzFYr4lNoEIJqLPm9tItYcRIcK3nRPO4z90l5fJCF2QTa1hmrflZqwS0mXo4iWNXSDag2nnmNMIFlmblbcgMsFX0mhcH9dKr24FSi9cvQA/+lj7GrDjZW5R0Blsc7s+4g3TLjKvkCiKjcIZO6au+rzTPfFohsXFDp/seDeMdqudIt9TntPPhsvoMFrDaGHDotiaqiauhnr61KrVJBil1xxeGA==</SignatureValue><KeyInfo><X509Data><X509IssuerSerial><X509IssuerName>OID.1.2.840.113549.1.9.2=responsable: ACDMA-SAT, OID.2.5.4.45=2.5.4.45, L=COYOACAN, S=CIUDAD DE MEXICO, C=MX, PostalCode=06370, STREET=3ra cerrada de caliz, E=oscar.martinez@sat.gob.mx, OU=SAT-IES Authority, O=SERVICIO DE ADMINISTRACION TRIBUTARIA, CN=AC UAT</X509IssuerName><X509SerialNumber>3330303031303030303030353030303033333632</X509SerialNumber></X509IssuerSerial><X509Certificate>MIIFgzCCA2ugAwIBAgIUMzAwMDEwMDAwMDA1MDAwMDMzNjIwDQYJKoZIhvcNAQELBQAwggErMQ8wDQYDVQQDDAZBQyBVQVQxLjAsBgNVBAoMJVNFUlZJQ0lPIERFIEFETUlOSVNUUkFDSU9OIFRSSUJVVEFSSUExGjAYBgNVBAsMEVNBVC1JRVMgQXV0aG9yaXR5MSgwJgYJKoZIhvcNAQkBFhlvc2Nhci5tYXJ0aW5lekBzYXQuZ29iLm14MR0wGwYDVQQJDBQzcmEgY2VycmFkYSBkZSBjYWxpejEOMAwGA1UEEQwFMDYzNzAxCzAJBgNVBAYTAk1YMRkwFwYDVQQIDBBDSVVEQUQgREUgTUVYSUNPMREwDwYDVQQHDAhDT1lPQUNBTjERMA8GA1UELRMIMi41LjQuNDUxJTAjBgkqhkiG9w0BCQITFnJlc3BvbnNhYmxlOiBBQ0RNQS1TQVQwHhcNMjMwNTE1MTY1NzU3WhcNMjcwNTE1MTY1NzU3WjCBqjEeMBwGA1UEAxMVTUFSSUEgV0FURU1CRVIgVE9SUkVTMR4wHAYDVQQpExVNQVJJQSBXQVRFTUJFUiBUT1JSRVMxHjAcBgNVBAoTFU1BUklBIFdBVEVNQkVSIFRPUlJFUzEWMBQGA1UELRMNV0FUTTY0MDkxN0o0NTEbMBkGA1UEBRMSV0FUTTY0MDkxN01IR1RSUjAxMRMwEQYDVQQLEwpTdWN1cnNhbCAxMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAueKA188y59jth2cxGI3IRAwKXA77p7bOOli5hb5Jsv3GdWdnrjg+hldmCnfV5OnfAj/oGKkD8UcpIEir1Yk9iz1CYN+p7uSndp0cwp6ExsCYY9GRC0FWPNY/ZXwc/CHOKW3Y2iXlWJDBfyhLCKC+4oTkBzp+2KmjRNIVdsJoVvZH/KSs6U7j+coos9ygrbvQk+i1UrC5L0/JhTA44Rp2l4Kj9sVhz1PUqA+Lq9rLMkvsDBC6NS3NlLhPsJ+4c5PlLTikc3LcLZVtBp/rz20pct+AAskGwDZe8/HVRecehb71pDaPCdHyj6j3Z3NJIArxLm6ecZZguWaSrA1LuSSOnQIDAQABox0wGzAMBgNVHRMBAf8EAjAAMAsGA1UdDwQEAwIGwDANBgkqhkiG9w0BAQsFAAOCAgEAdu2JXVqSJ/0nLLFIq+3bodv9dHgR8RraMTrMugBToKut69OEZ2+59rUzaYEOyfCnkoOcrpRikTH80QNvYyu4n2PaGuf6labBGloR8rkWgql96vB+xKTzhdF/kc9DwEYIWZgGAeamZ3X4CofJs10oYBUDCSdwOt4PPb9mDB7pKw6yH0M/OqLOFVCC7BAk4ER4pcuj5T/xBMLFcb09/cvUg/+/jETjHHrnS+BuBzXTvCUtLHBr6IOOmWAr8B8Onmph7FrJY/2lmZMLlGVY0POUa/4i+M8wntvfXxlyUoYc+5g4ZAdj2b6oj3gh2dDldkwV6K0ekPSChVcKqPgjsL9y7RfT+1miEwbEf+W5OeKE67MQoEtScJ7vuXXP1Gz/juUMyQY+BC/n2UmiLCTqAoXYybyTKiK1gV9Ymmxk1/LZUq6fvOuZoyOSgC0znlGg874BAwQ65WJwq34IOsN0grCC/pVPbLJpUUp9ZzDMMqAk6yC7UDHacQI7hO4b7TKn7vz150vp2ZJzjFwP3zUKBlF+VmWsMmpiINfguo/owVR4NYzy5RaZLkXbuiomU74VIsJySpo8SpUouvmkZjbMDbcsMD1rblXn+sCozz2altEP6DJYANqtbDy9hrWjIwTy0HbXR7Wg1ASz1fmV4YyPBks5otf0DomGmzLSEEHPaBNuDCU=</X509Certificate></X509Data></KeyInfo></Signature></Acuse>",
            "Codigo": 0,
            "Mensaje": "Factura cancelada correctamente.",
            "Valores": null
        }*/

        console.log("CancelaCFDIAck")


        //CancelaCFDIAck
        const respuesta: any =  await firstValueFrom( 
          this.httpService.post( `${apiFactura.url}/v1/compatibilidad/${apiFactura.clientId}/CancelaCFDIAck`, cancelaCFDIAck, {
            headers
          }) 
        );
        
        
        /*
          "Cancelar factura"
          "{{API_URL}}/v1/facturacion/cancelar/9a881c59-f1c5-4d86-8ec0-fdd6b8dc505c?motivo=03&folio_sustitucion="
          const respuesta =  await firstValueFrom( this.httpService.delete( `${apiFactura.url}/v1/facturacion/cancelar/${uuidFactura}?motivo=${motivo}&folio_sustitucion=${folioSustitucion}`, {
          headers
        } ) );*/



        //const respuesta =  await firstValueFrom( this.httpService.post( `${apiFactura.url}/v1/facturacion/timbrar`, nuevaFacturaPAC, {
        //  headers
        //} ) );
        
        //cancelacionPAC = respuesta.data.data;
        cancelacionPAC = respuesta.data;

        console.log("cancelacionPAC")
        console.log(cancelacionPAC)


        //console.log("cancelaCFDIAck")
        //console.log(cancelaCFDIAck)

        //console.log("respuesta")
        //console.log(respuesta)

      }catch(error: any){ 

        if( error.response?.status == 400){
   
          if( error.response?.data?.status == 'error'){

            throw new BadRequestException( `Hubo un error al generar la Cancelación PAC: ${error.response?.data?.message}` )

          }
        }
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        } 

        throw new BadRequestException(`Hubo un error al generar la Cancelacion PAC: ${error}`)

      }

       // UPDATE FACTURA CON ACUSE RESPUESTA
      //let cancelarFactura: CancelarFactura = null
      
      try{

        //const updateFacturaCancelada: CancelarFacturaAcuse = {
        //  cancelacionAcuseRespuesta: cancelacionPAC
        //}

        //cancelarFactura.fechaCancelacion = fechaLocal;
        //cancelarFactura.satCancelacionMotivo = satCancelacionMotivo;
        //cancelarFactura.idSustitucion = '';
        //cancelarFactura.uuidSustitucion = '';        

        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){

        console.log("Antes cancelacion 01")

        console.log("facturaCancelar.id")
        console.log(facturaCancelar.id)

          await repoFactura.update(
            {id: facturaCancelar.id},
            {
              cancelacionAcuseRespuesta: cancelacionPAC
            }
          )

          console.log("despues cancelacion 02")

          //const updateFacturaAcuse = repoFactura.create( updateFacturaCancelada )
          //await repoFactura.update( facturaCancelar.id, updateFacturaAcuse )

        //}else{
          
        //  const nuevaCancelacion = repoComplementoPago.create( cancelarFactura )
        //  await repoComplementoPago.update( complementoPagoExistente.id, nuevaCancelacion )

        //}

      }catch(error){   
        
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){       

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Cancelacion')
          }

          throw new BadRequestException(error)

        }       

        throw new BadRequestException(`Hubo un error al generar la Cancelación: ${error}`)

      }
      
            
      
    
      // GUARDAR FACTURA LOCAL
      /*
      let facturaGuardada: Factura | null = null;

      let nuevoId = ''

      let fechaEmisionLocal: string;
      
      try{   

        nuevoId = await generarEntityId( repoFactura, EnumPrefijoEntity.FACTURAS);
        
        fechaEmisionLocal = formatInTimeZone(createCancelacionDto.fechaEmision, user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss')     

        const nuevaFactura = repoFactura.create({
          id: nuevoId,           
          serie: serie,
          folio: folio,
          satFormaPago: satFormaPago,
          condicionesPago: createCancelacionDto.condicionesPago,
          satMetodoPago: satMetodoPago,
          satMoneda:                  facturaCancelar.satMoneda,
          tipoCambio:                 facturaCancelar.tipoCambio,
          lugarExpedicion: createCancelacionDto.lugarExpedicion,
          observaciones: createCancelacionDto.observaciones,
          satTipoComprobante:         facturaCancelar.satTipoComprobante,
          subtotal:  totalesConceptosImpuestosFactura.totalesFactura.subtotal.toFixed(2),
          descuento: "0",
          total: totalesConceptosImpuestosFactura.totalesFactura.total.toFixed(2),
          emisorRFC:                  facturaCancelar.emisorRFC,
          emisorRazonSocial:          facturaCancelar.emisorRazonSocial,
          emisorSatRegimenFiscal:     facturaCancelar.emisorSatRegimenFiscal,
          emisorCodigoPostal:         facturaCancelar.emisorCodigoPostal,
          receptorRFC:                facturaCancelar.receptorRFC,
          receptorRazonSocial:        facturaCancelar.receptorRazonSocial,
          receptorEmail:              facturaCancelar.receptorEmail,
          receptorSatRegimenFiscal:   facturaCancelar.receptorSatRegimenFiscal,
          receptorSatUsoCFDI:         facturaCancelar.receptorSatUsoCFDI,
          receptorCodigoPostal:       facturaCancelar.receptorCodigoPostal,
          receptorSatTipoPersona:     facturaCancelar.receptorSatTipoPersona,
          fechaCancelacion:           null,
          anio:                       new Date( fechaLocal ).getFullYear().toString(),
          satExportacion:             facturaCancelar.satExportacion,
          emisor:                     facturaCancelar.emisor,
          receptorCliente:            facturaCancelar.orden.cliente,
          receptorEmpresa:            facturaCancelar.orden.empresa,
          orden:                      facturaCancelar.orden,
          estatus: EnumEstatusCFDI.VIGENTE
        }) 
        
        facturaGuardada = await repoFactura.save( nuevaFactura )

      }catch(error){   
        
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){       

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Factura')
          }

          throw new BadRequestException(error)

        }       

        throw new BadRequestException(`Hubo un error al generar la Factura: ${error}`)

      }
      */

      // GUARDAR CONCEPTOS E IMPUESTOS
      /*
      await this._guardarConceptosEImpuestosFactura( totalesConceptosImpuestosFactura.conceptosFactura, facturaGuardada, queryRunner );      
      */
      
      // GUARDAR FACTURA PAC
      /*
      let facturaPAC: any | null = null;      
      
      try{              

        const nuevaFacturaPAC = {
          fecha_emision: fechaEmisionLocal,
          serie: serie,
          folio: Number( folio ),
          forma_pago: satFormaPago.clave,
          condiciones_pago: createCancelacionDto.condicionesPago,
          metodo_pago: satMetodoPago.clave,          
          moneda:               facturaCancelar.satMoneda.clave,
          lugar_expedicion: createCancelacionDto.lugarExpedicion,
          observaciones: createCancelacionDto.observaciones,
          tipo_comprobante: satTipoComprobante.clave,
          subtotal: totalesConceptosImpuestosFactura.totalesFactura.subtotal,
          total: totalesConceptosImpuestosFactura.totalesFactura.total,
          exportacion: facturaCancelar.satExportacion.clave,
          emisor: {
            rfc: facturaCancelar.emisorRFC.toUpperCase(),
            razon_social: facturaCancelar.emisorRazonSocial.toUpperCase(),
            regimen_fiscal: facturaCancelar.emisorSatRegimenFiscal.clave,
            codigo_postal: facturaCancelar.emisorCodigoPostal
          },
          receptor: receptor,
          conceptos: totalesConceptosImpuestosFactura.conceptosFactura,
          impuestos: totalesConceptosImpuestosFactura.impuestosFactura
        }     

        const headers = {
          Authorization: `Bearer ${apiFactura.token}`,
          'Content-Type': 'application/json',
          'X-CLIENT-ID': apiFactura.clientId
        }   
        
        const respuesta =  await firstValueFrom( this.httpService.post( `${apiFactura.url}/v1/facturacion/timbrar`, nuevaFacturaPAC, {
          headers
        } ) );

        facturaPAC = respuesta.data.data;    

      }catch(error){ 

        if( error.response?.status == 400){
   
          if( error.response?.data?.status == 'error'){

            throw new BadRequestException( `Hubo un error al generar la Factura PAC: ${error.response?.data?.message}` )

          }
        }
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        } 

        throw new BadRequestException(`Hubo un error al generar la Factura PAC: ${error}`)

      }      
      */
      
      // UPDATE FACTURA LOCAL CON LOS DATOS DEL TIMBRADO PAC -
      //await this._actualizarFacturaConDatosTimbrado( { id:facturaGuardada.id, ...facturaPAC }, queryRunner );
      
                      // UPDATE ORDEN CON LOS DATOS DE LA NUEVA FACTURA
                      //await this._actualizarOrdenConNuevaFactura( facturaCancelar.orden.id, satMetodoPago, totalesConceptosImpuestosFactura.totalesFactura.total, queryRunner ); 

      // UPDATE LIDACION FACTURA EN ORDEN

      console.log("UPDATE LIDACION FACTURA EN ORDEN")

      console.log("facturaCancelar.orden.id")
      console.log(facturaCancelar.orden.id)
      await this._actualizarOrdenFacturaCancelada(facturaCancelar.orden.id, queryRunner)
      
      await queryRunner.commitTransaction()      
      
      return {
        id: facturaCancelar.id
      }

    }catch(error: any){

      await queryRunner.rollbackTransaction();

      const data = error?.response?.data

      if( data ){

        if( data.message ){

          throw new BadRequestException(`Error al facturar: ${ data.message} `);
        }

      }
      
      if(error instanceof NotFoundException ){

        throw error
      }

      if(error instanceof BadRequestException){

        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar Cancelar la Factura: ${error}`)      

    }finally{
      await queryRunner.release();
    }   
    
  }

  async createCancelacionFacturaSiSustitucionNew( createCancelacionDto: CreateCancelacionDto, user: User ) {

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    
    try{
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const repoFactura = queryRunner.manager.getRepository(Factura);
      const repoFacturaConcepto = queryRunner.manager.getRepository(FacturaConcepto);
      const repoFacturaConceptoImpuesto = queryRunner.manager.getRepository(FacturaConceptoImpuesto);
      const repoSatTipoPersona = queryRunner.manager.getRepository(SatTipoPersona);
      const repoOrden = queryRunner.manager.getRepository(Orden);
            
      const repoProductoServicio = queryRunner.manager.getRepository(ProductoServicio);
      const repoOrdenConcepto = queryRunner.manager.getRepository(OrdenConcepto)

      let fechaLocal: string;
      let timbradoMayor72H: boolean = false;

      try{        
              
        fechaLocal = formatInTimeZone( new Date(), user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss');

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al intentar establecer la Fecha Local: ${error}`)

      }

      // REVISAR EL TIPO DE COMPROBANTE Y EL METODO DE PAGO 
      /*
      try{        

        if( createFacturaDto.claveSatTipoComprobante != EnumSatTipoComprobante.INGRESO ){
          throw new BadRequestException(`Debes de asignar una factura con Tipo de Comprobante I - Ingreso`)
        }

        if( createFacturaDto.claveSatMetodoPago != EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION 
            && createFacturaDto.claveSatMetodoPago != EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO ){
          throw new BadRequestException(`Debes de asignar una factura con Método de Pago válido`)
        }

      }catch(error){
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){          

          throw error

        }

        throw new BadRequestException(`Hubo un error al intentar generar la Factura: ${error}`)

      }
      */

      // REVISAR QUE LA FACTURA A CANCELAR EXISTA Y VALIDARLA

      let facturaCancelar: Factura | null = null;

      try{
        
        facturaCancelar = await repoFactura.findOne({
          where: {
            id: createCancelacionDto.id_factura,
            //satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO },
            //orden: { id: createCancelacionDto. .id_orden },
            //estatus: EnumEstatusCFDI.VIGENTE,
            //fechaCancelacion: null
          },
          relations: ['satTipoComprobante', 'pagos']
          //relations: ['satMetodoPago']
        });

        if( !facturaCancelar ){
          throw new NotFoundException(`No se encontró una factura con ID: ${ createCancelacionDto.id_factura}`)
        }

        if( facturaCancelar.estatus === EnumEstatusCFDI.CANCELADA ){
          throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} ya está Cancelada`)
        }

        if( facturaCancelar.estatus !== EnumEstatusCFDI.VIGENTE ){
          throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} no está Vigente`)
        }
        
        if( facturaCancelar.uuid !== createCancelacionDto.uuid ){
          throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} no coincide con el UUID del timbre`)
        }

        const diferenciaHoras = dateGetHoursDifference( facturaCancelar.fechaTimbrado, new Date( fechaLocal ) );

        if( diferenciaHoras > 72 ){
          timbradoMayor72H = true
        }

        //TODO complementoPagos
        /*
        if( facturaCancelar.satTipoComprobante.clave === EnumSatTipoComprobante.INGRESO ){
          if( facturaCancelar.satMetodoPago.clave === EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO ){              
            facturaCancelar.complementoPagos.forEach( cP => {
              if( cP.estatus === EnumEstatusCFDI.VIGENTE ){
                throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} tiene al menos un Complemento de Pago Vigente, debes de cancelarlo primero`)
              }
            })
          }
        }
        */

      }catch(error){        
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al consultar la Factura: ${error}`)        

      }

      
      // VALIDAR QUE LA ORDEN NO TENGA FACTURA VIGENTE
      /*
      let facturaExistente: Factura | null = null;

      try{        
        
        facturaExistente = await repoFactura.findOne({
          where: {
            satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO},
            orden: { id: createFacturaDto.id_orden },
            estatus: EnumEstatusCFDI.VIGENTE,
            fechaCancelacion: null
          },
          relations: ['satMetodoPago']
        });        
  
        if( facturaExistente ){

          if(facturaExistente.satMetodoPago.clave === EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION ){
            throw new NotFoundException(`Ya existe una Factura con método de PUE - Pago de Una sola Exhibición para esta orden, la factura tiene el ID: ${facturaExistente.id }`)
          }else{
            throw new NotFoundException(`Ya existe una Factura con método de PPD - Pago en Parcialidades ó Diferido para esta orden, la factura tiene el ID: ${facturaExistente.id }`)

          }          

        }

      }catch(error){        
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al consultar la Factura: ${error}`)        

      }*/    
      
      // OBTENER API FACTURA -
      const apiFactura = this._obtenerApiFacturaPAC();
   
      // OBTENER EMISOR -
      const emisor = await this._obtenerEmisor( queryRunner );
   
      // REVISAR TIMBRES DISPONIBLES -
      await this._validarTimbresDisponibles( emisor, apiFactura ) 
      
      // VALIDAR QUE EXISTAN LOS DATOS DEL DTO EN LOS CATALOGOS
      let satCancelacionMotivo: SatCancelacionMotivo | null = null
      let satTipoComprobante: SatTipoComprobante | null = null;
      let satFormaPago: SatFormaPago | null = null;
      let satMetodoPago: SatMetodoPago | null = null;
      //let satMoneda: SatMoneda | null = null;      
      //let satExportacion: SatExportacion | null = null;      

      try{

        const repoSatCancelacionMotivo = queryRunner.manager.getRepository(SatCancelacionMotivo);
        satCancelacionMotivo = await repoSatCancelacionMotivo.findOneBy({ clave: createCancelacionDto.claveSatCancelacionMotivo })

        if(!satCancelacionMotivo){
          throw new NotFoundException(`El motivo de Cancelación con ID: ${createCancelacionDto.claveSatCancelacionMotivo} no existe`)
        }
        
        const repoSatFormaPago = queryRunner.manager.getRepository(SatFormaPago);
        satFormaPago = await repoSatFormaPago.findOneBy({clave: createCancelacionDto.claveSatFormaPago});      

        if(!satFormaPago){
          throw new NotFoundException(`El tipo de forma de pago con Clave: ${createCancelacionDto.claveSatFormaPago} no existe`)
        } 

        const repoSatMetodoPago = queryRunner.manager.getRepository(SatMetodoPago);
        satMetodoPago = await repoSatMetodoPago.findOneBy({clave:createCancelacionDto.claveSatMetodoPago});

        if(!satMetodoPago){
          throw new NotFoundException(`El método de pago con Clave: ${createCancelacionDto.claveSatMetodoPago} no existe`)
        }

      }catch( error ){
            
        if( error instanceof BadRequestException){       

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        }      

        throw new BadRequestException(`Hubo un error al revisar los catálogos: ${error}`)

      }

      //VALIDAR QUE LOS DATOS PARA LA NUEVA FACTURA TENGA INFORMACION DISTINTA
      try{
        
        if( satCancelacionMotivo.clave === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){
          
          //if( facturaCancelar.satMetodoPago.clave != satMetodoPagoSustitucion .clave ) return;
          if( facturaCancelar.satMetodoPago.clave != satMetodoPago.clave ) return;
          if( facturaCancelar.satFormaPago.clave != satFormaPago.clave ) return;
          if( facturaCancelar.condicionesPago.trim() != createCancelacionDto.condicionesPago.trim() ) return;
          if( facturaCancelar.lugarExpedicion.trim() != createCancelacionDto.lugarExpedicion.trim() ) return;
          if( facturaCancelar.observaciones.trim() != createCancelacionDto.observaciones.trim() ) return;            
          if( facturaCancelar.fechaEmision.getTime() != createCancelacionDto.fechaEmision.getTime() ) return;

          if( facturaCancelar.conceptos.length !== createCancelacionDto.conceptos.length ) return;

          for( const concepto of facturaCancelar.conceptos){
            
            const conceptoDto = createCancelacionDto.conceptos.find( cDto => cDto.id_producto_servicio === concepto.productoServicio.id )

            if( !conceptoDto ) return;

            if( Number(conceptoDto.cantidad) !== Number(concepto.cantidad) 
              || Number(concepto.valorUnitario) !== Number(concepto.valorUnitario) ){
                return;
            }

          }
          
          throw new NotFoundException(`No se encontró diferencia entre la factura original y la nueva factura de sustitución`)

        }          

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al revisar los datos para la Factura de Sustitución: ${error}`)

      }

      // OBTENER FOLIOS Y SERIES -
      let { serie, folio } = await this._obtenerFolioSerie( queryRunner, user )

      // CANCELAR LOS CONCEPTOS DE LA ORDEN
      await this._cancelarConceptosOrden( facturaCancelar.orden.id, queryRunner )

      // CANCELAR LOS CONCEPTOS DE LA FACTURA
      await this._cancelarConceptosEImpuestosFactura( facturaCancelar.id, queryRunner )

      // INSERTAR LOS NUEVOS CONCEPTOS EN LA ORDEN ORIGINAL
      const ordenConceptosNuevos: OrdenConcepto[] = [];

      try{

        const ids = createCancelacionDto.conceptos.map( c => c.id_producto_servicio );
        const productos = await repoProductoServicio.findBy({id: In(ids)});
        const productosMap = new Map( productos.map( p => [ p.id, p]));


        for( const conceptoDto of createCancelacionDto.conceptos ){
          const productoServicio = productosMap.get(conceptoDto.id_producto_servicio);
          if(!productoServicio){
            throw new NotFoundException(`Producto/Servicio con ID ${ conceptoDto.id_producto_servicio } no encontrado.`);
          }

          /* TODO */

          const ordenConcepto = {} as OrdenConcepto

          /*
          const ordenConcepto = repoOrdenConcepto.create({
            cantidad: conceptoDto.cantidad,
            valorUnitario: Number( conceptoDto.valorUnitario ),
            orden: facturaCancelar.orden,
            productoServicio: productoServicio,
            estatus: EnumEstatusConcepto.VIGENTE
          });*/

          ordenConceptosNuevos.push( ordenConcepto );

        }

        await repoOrdenConcepto.save( ordenConceptosNuevos );       
    
      }catch( error ){
            
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }   

        throw new BadRequestException(`Hubo un error al obtener los folios: ${error}`)

      }



      // OBTENER DATOS DE LA ORDEN
      /*
      let orden: Orden | null = null;

      try{
        
        const repoOrden = queryRunner.manager.getRepository(Orden);
        
        orden = await repoOrden.findOne({
          where: {id:createFacturaDto.id_orden },
          relations: ['cliente', 'cliente.satRegimenFiscal', 'cliente.satUsoCFDI', 'empresa', 'empresa.satRegimenFiscal', 'empresa.satUsoCFDI', 'conceptos', 'conceptos.productoServicio', 'conceptos.productoServicio.satProductoServicio']         
        });
  
        if(!orden){
          throw new NotFoundException(`La Orden: ${createFacturaDto.id_orden} no existe`)
        }

      }catch(error){
      
        if( error instanceof BadRequestException){       

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        }   

        throw new BadRequestException(`Hubo un error al consultar la Orden: ${error}`)        

      }*/
            
      // DEFINIR EL RECEPTOR
      let receptor: any | null = null;
      let receptorSatRegimenFiscal: any | null = null;
      let receptorSatUsoCFDI: any | null = null;

      let receptorSatTipoPersona: SatTipoPersona | null = null;

      try{
         
        const repoSatTipoPersona = queryRunner.manager.getRepository(SatTipoPersona);

        receptor = {
          rfc:              facturaCancelar.receptorRFC,
          razon_social:     facturaCancelar.receptorRazonSocial,
          uso_cfdi:         facturaCancelar.receptorSatUsoCFDI.clave,
          regimen_fiscal:   facturaCancelar.receptorSatRegimenFiscal.clave,
          codigo_postal:    facturaCancelar.receptorCodigoPostal,
          email:            facturaCancelar.receptorEmail
        }

        receptorSatRegimenFiscal = facturaCancelar.receptorSatRegimenFiscal;

        receptorSatUsoCFDI = facturaCancelar.receptorSatUsoCFDI;

      }catch(error){
             
        if( error instanceof BadRequestException){
       
          throw error

        }

        if( error instanceof NotFoundException){        

          throw error

        }     

        throw new BadRequestException(`Hubo un error al validar al receptor: ${error}`)        

      }
      
      // CALCULAR LOS IMPUESTOS DE LOS CONCEPTOS -
      //let totalesConceptosImpuestosFactura = await this._calcularConceptosImpuestosFacturaNew( createFacturaDto.receptorClaveSatTipoPersona as EnumSatTipoPersona, orden.conceptos, emisor, user )
      let totalesConceptosImpuestosFactura = await this._calcularConceptosImpuestosFacturaNew( facturaCancelar.receptorSatTipoPersona.tipo as EnumSatTipoPersona, ordenConceptosNuevos, emisor, user )

     
      // GUARDAR FACTURA LOCAL
      let facturaGuardada: Factura | null = null;

      let nuevoId = ''

      let fechaEmisionLocal: string;
      
      try{   

        nuevoId = await generarEntityId( repoFactura, EnumPrefijoEntity.FACTURAS);
        
        fechaEmisionLocal = formatInTimeZone(createCancelacionDto.fechaEmision, user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss')

        const nuevaFactura = repoFactura.create({
          id: nuevoId,           
          serie: serie,
          folio: folio,
          satFormaPago: satFormaPago,
          condicionesPago: createCancelacionDto.condicionesPago,
          satMetodoPago: satMetodoPago,
          satMoneda:                  facturaCancelar.satMoneda,
          tipoCambio:                 facturaCancelar.tipoCambio,
          lugarExpedicion: createCancelacionDto.lugarExpedicion,
          observaciones: createCancelacionDto.observaciones,
          satTipoComprobante:         facturaCancelar.satTipoComprobante,
          subtotal:  totalesConceptosImpuestosFactura.totalesFactura.subtotal.toFixed(2),
          descuento: "0",
          total: totalesConceptosImpuestosFactura.totalesFactura.total.toFixed(2),
          emisorRFC:                  facturaCancelar.emisorRFC,
          emisorRazonSocial:          facturaCancelar.emisorRazonSocial,
          emisorSatRegimenFiscal:     facturaCancelar.emisorSatRegimenFiscal,
          emisorCodigoPostal:         facturaCancelar.emisorCodigoPostal,
          receptorRFC:                facturaCancelar.receptorRFC,
          receptorRazonSocial:        facturaCancelar.receptorRazonSocial,
          receptorEmail:              facturaCancelar.receptorEmail,
          receptorSatRegimenFiscal:   facturaCancelar.receptorSatRegimenFiscal,
          receptorSatUsoCFDI:         facturaCancelar.receptorSatUsoCFDI,
          receptorCodigoPostal:       facturaCancelar.receptorCodigoPostal,
          receptorSatTipoPersona:     facturaCancelar.receptorSatTipoPersona,
          fechaCancelacion:           null,
          anio:                       new Date( fechaLocal ).getFullYear().toString(),
          satExportacion:             facturaCancelar.satExportacion,
          emisor:                     facturaCancelar.emisor,
          receptorCliente:            facturaCancelar.orden.cliente,
          receptorEmpresa:            facturaCancelar.orden.empresa,
          orden:                      facturaCancelar.orden,
          estatus: EnumEstatusCFDI.VIGENTE
        }) 
        
        facturaGuardada = await repoFactura.save( nuevaFactura )

      }catch(error){   
        
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){       

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Factura')
          }

          throw new BadRequestException(error)

        }       

        throw new BadRequestException(`Hubo un error al generar la Factura: ${error}`)

      }

      // GUARDAR CONCEPTOS E IMPUESTOS
      await this._guardarConceptosEImpuestosFactura( totalesConceptosImpuestosFactura.conceptosFactura, facturaGuardada, queryRunner );      
      
      // GUARDAR FACTURA PAC
      let facturaPAC: any | null = null;      
      
      try{              

        const nuevaFacturaPAC = {
          fecha_emision: fechaEmisionLocal,
          serie: serie,
          folio: Number( folio ),
          forma_pago: satFormaPago.clave,
          condiciones_pago: createCancelacionDto.condicionesPago,
          metodo_pago: satMetodoPago.clave,          
          moneda:               facturaCancelar.satMoneda.clave,
          lugar_expedicion: createCancelacionDto.lugarExpedicion,
          observaciones: createCancelacionDto.observaciones,
          tipo_comprobante: satTipoComprobante.clave,
          subtotal: totalesConceptosImpuestosFactura.totalesFactura.subtotal,
          total: totalesConceptosImpuestosFactura.totalesFactura.total,
          exportacion: facturaCancelar.satExportacion.clave,
          emisor: {
            rfc: facturaCancelar.emisorRFC.toUpperCase(),
            razon_social: facturaCancelar.emisorRazonSocial.toUpperCase(),
            regimen_fiscal: facturaCancelar.emisorSatRegimenFiscal.clave,
            codigo_postal: facturaCancelar.emisorCodigoPostal
          },
          receptor: receptor,
          conceptos: totalesConceptosImpuestosFactura.conceptosFactura,
          impuestos: totalesConceptosImpuestosFactura.impuestosFactura
        }

        const headers = this._obtenerHeadersPAC();
        
        const respuesta =  await firstValueFrom( this.httpService.post( `${apiFactura.url}/v1/facturacion/timbrar`, nuevaFacturaPAC, {
          headers
        } ) );

        facturaPAC = respuesta.data.data;    

      }catch(error: any){ 

        if( error.response?.status == 400){
   
          if( error.response?.data?.status == 'error'){

            throw new BadRequestException( `Hubo un error al generar la Factura PAC: ${error.response?.data?.message}` )

          }
        }
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        } 

        throw new BadRequestException(`Hubo un error al generar la Factura PAC: ${error}`)

      }      
      
      // UPDATE FACTURA LOCAL CON LOS DATOS DEL TIMBRADO PAC -
      await this._actualizarFacturaConDatosTimbrado( { id:facturaGuardada.id, ...facturaPAC }, queryRunner );
      
      // UPDATE ORDEN CON LOS DATOS DE LA NUEVA FACTURA
      //await this._actualizarOrdenConNuevaFactura( facturaCancelar.orden.id, satMetodoPago, totalesConceptosImpuestosFactura.totalesFactura.total, queryRunner ); 
      await this._actualizarOrdenConNuevaFactura( facturaCancelar.orden.id, satMetodoPago, queryRunner ); 
      
      await queryRunner.commitTransaction()      
      
      return {
        id: facturaGuardada.id
      }

    }catch(error: any){

      await queryRunner.rollbackTransaction();

      const data = error?.response?.data

      if( data ){

        if( data.message ){

          throw new BadRequestException(`Error al facturar: ${ data.message} `);
        }

      }
      
      if(error instanceof NotFoundException ){

        throw error
      }

      if(error instanceof BadRequestException){

        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar crear la Factura: ${error}`)      

    }finally{
      await queryRunner.release();
    }   
    
  }

  async createCancelacionFacturaNoSustitucionNew( createCancelacionDto: CreateCancelacionDto, user: User ) {

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();
    
    try{
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const repoFactura = queryRunner.manager.getRepository(Factura);
      //const repoFacturaConcepto = queryRunner.manager.getRepository(FacturaConcepto);
      //const repoFacturaConceptoImpuesto = queryRunner.manager.getRepository(FacturaConceptoImpuesto);
      //const repoSatTipoPersona = queryRunner.manager.getRepository(SatTipoPersona);
      //const repoOrden = queryRunner.manager.getRepository(Orden);
            
      //const repoProductoServicio = queryRunner.manager.getRepository(ProductoServicio);
      //const repoOrdenConcepto = queryRunner.manager.getRepository(OrdenConcepto)

      let fechaLocal: string;
      let fechaUTC: string;
      let timbradoMayor72H: boolean = false;

      try{
              
        fechaLocal = formatInTimeZone( new Date(), user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss');
        fechaUTC = new Date().toISOString();

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al intentar establecer la Fecha Local: ${error}`)

      }

      // REVISAR EL TIPO DE COMPROBANTE Y EL METODO DE PAGO 
      /*
      try{        

        if( createFacturaDto.claveSatTipoComprobante != EnumSatTipoComprobante.INGRESO ){
          throw new BadRequestException(`Debes de asignar una factura con Tipo de Comprobante I - Ingreso`)
        }

        if( createFacturaDto.claveSatMetodoPago != EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION 
            && createFacturaDto.claveSatMetodoPago != EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO ){
          throw new BadRequestException(`Debes de asignar una factura con Método de Pago válido`)
        }

      }catch(error){
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){          

          throw error

        }

        throw new BadRequestException(`Hubo un error al intentar generar la Factura: ${error}`)

      }
      */

      // REVISAR QUE LA FACTURA A CANCELAR EXISTA Y VALIDARLA

      let facturaCancelar = await this._validarFacturaCancelar( createCancelacionDto.id_factura, createCancelacionDto.uuid, queryRunner )


      /*
      let facturaCancelar: Factura | null = null;

      try{
        
        //satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO },
        //orden: { id: createCancelacionDto. .id_orden },
        //estatus: EnumEstatusCFDI.VIGENTE,
        //fechaCancelacion: null

        facturaCancelar = await repoFactura.findOne({
          where: {
            id: createCancelacionDto.id_factura,
          },
          relations: ['satTipoComprobante', 'satMetodoPago', 'complementoPagos', 'orden']
        });
        //relations: ['satMetodoPago']
        

        if( !facturaCancelar ){
          throw new NotFoundException(`No se encontró una factura con ID: ${ createCancelacionDto.id_factura}`)
        }

        if( facturaCancelar.estatus === EnumEstatusCFDI.CANCELADA ){
          throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} ya está Cancelada`)
        }

        if( facturaCancelar.estatus !== EnumEstatusCFDI.VIGENTE ){
          throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} no está Vigente`)
        }
        
        if( facturaCancelar.uuid !== createCancelacionDto.uuid ){
          throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} no coincide con el UUID del timbre`)
        }

        const diferenciaHoras = dateGetHoursDifference( facturaCancelar.fechaTimbrado, new Date( fechaLocal ) );

        if( diferenciaHoras > 72 ){
          timbradoMayor72H = true
        }

        if( facturaCancelar.satTipoComprobante.clave === EnumSatTipoComprobante.INGRESO ){
          if( facturaCancelar.satMetodoPago.clave === EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO ){              
            facturaCancelar.complementoPagos.forEach( cP => {
              if( cP.estatus === EnumEstatusCFDI.VIGENTE ){
                throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} tiene al menos un Complemento de Pago Vigente, debes de cancelarlo primero`)
              }
            })
          }
        }

      }catch(error){        
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al consultar la Factura: ${error}`)        

      }
      */

      
      // VALIDAR QUE LA ORDEN NO TENGA FACTURA VIGENTE
      /*
      let facturaExistente: Factura | null = null;

      try{        
        
        facturaExistente = await repoFactura.findOne({
          where: {
            satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO},
            orden: { id: createFacturaDto.id_orden },
            estatus: EnumEstatusCFDI.VIGENTE,
            fechaCancelacion: null
          },
          relations: ['satMetodoPago']
        });        
  
        if( facturaExistente ){

          if(facturaExistente.satMetodoPago.clave === EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION ){
            throw new NotFoundException(`Ya existe una Factura con método de PUE - Pago de Una sola Exhibición para esta orden, la factura tiene el ID: ${facturaExistente.id }`)
          }else{
            throw new NotFoundException(`Ya existe una Factura con método de PPD - Pago en Parcialidades ó Diferido para esta orden, la factura tiene el ID: ${facturaExistente.id }`)

          }          

        }

      }catch(error){        
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al consultar la Factura: ${error}`)        

      }*/    
      
      // OBTENER API FACTURA -
      const apiFactura = this._obtenerApiFacturaPAC();
   
      // OBTENER EMISOR -
      const emisor = await this._obtenerEmisor( queryRunner );
   
      // REVISAR TIMBRES DISPONIBLES -
      await this._validarTimbresDisponibles( emisor, apiFactura ) 
      
      // VALIDAR QUE EXISTAN LOS DATOS DEL DTO EN LOS CATALOGOS
      let satCancelacionMotivo: SatCancelacionMotivo | null = null
      //let satTipoComprobante: SatTipoComprobante | null = null;
      //let satFormaPago: SatFormaPago | null = null;
      //let satMetodoPago: SatMetodoPago | null = null;

      console.log("cancelarFactura 01")
           
      try{

        const repoSatCancelacionMotivo = queryRunner.manager.getRepository(SatCancelacionMotivo);
        satCancelacionMotivo = await repoSatCancelacionMotivo.findOneBy({ clave: createCancelacionDto.claveSatCancelacionMotivo })

        if(!satCancelacionMotivo){
          throw new NotFoundException(`El motivo de Cancelación con ID: ${createCancelacionDto.claveSatCancelacionMotivo} no existe`)
        }

      }catch( error ){
            
        if( error instanceof BadRequestException){       

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        }      

        throw new BadRequestException(`Hubo un error al revisar los catálogos: ${error}`)

      }     

      // CANCELAR LOS CONCEPTOS DE LA ORDEN
      //await this._cancelarConceptosOrden( facturaCancelar.orden.id, queryRunner )

      console.log("cancelarFactura 02")

      // CANCELAR LOS CONCEPTOS DE LA FACTURA
      await this._cancelarConceptosEImpuestosFactura( facturaCancelar.id, queryRunner )

      console.log("cancelarFactura 03")

      // OBTENER DATOS DE LA ORDEN
      /*
      let orden: Orden | null = null;

      try{
        
        const repoOrden = queryRunner.manager.getRepository(Orden);
        
        orden = await repoOrden.findOne({
          where: {id:createFacturaDto.id_orden },
          relations: ['cliente', 'cliente.satRegimenFiscal', 'cliente.satUsoCFDI', 'empresa', 'empresa.satRegimenFiscal', 'empresa.satUsoCFDI', 'conceptos', 'conceptos.productoServicio', 'conceptos.productoServicio.satProductoServicio']         
        });
  
        if(!orden){
          throw new NotFoundException(`La Orden: ${createFacturaDto.id_orden} no existe`)
        }

      }catch(error){
      
        if( error instanceof BadRequestException){       

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        }   

        throw new BadRequestException(`Hubo un error al consultar la Orden: ${error}`)        

      }*/

      console.log("cancelarFactura 04")

      console.log("fechaLocal")
      console.log(fechaLocal)

      console.log("fechaUTC")
      console.log(fechaUTC)

      console.log("new Date()")
      console.log(new Date())

      //cancelarFactura.idSustitucion = '';
      //cancelarFactura.uuidSustitucion = '';        

      // 09 CANCELACION DE LA FACTURA
      //let cancelarFactura: CancelarFactura ;
      
      try{

        //cancelarFactura.fechaCancelacion = fechaUTC;
        //cancelarFactura.satCancelacionMotivo = satCancelacionMotivo;
        //cancelarFactura.estatus = EnumEstatusCFDI.CANCELADA;

        //console.log("cancelarFactura")
        //console.log(cancelarFactura)
        
        await repoFactura.update(
          {id: facturaCancelar.id},
          {
            fechaCancelacion: fechaUTC                ,
            satCancelacionMotivo: satCancelacionMotivo,
            estatus: EnumEstatusCFDI.CANCELADA
          }
        )
        
      }catch(error){   
        
        
        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){
          //const repoOrden = queryRunner.manager.getRepository( Orden );
                      //const nuevaCancelacion = repoFactura.create( cancelarFactura )
                      //await repoFactura.update( facturaCancelar.id, nuevaCancelacion )          
            
                    //}else{
                      
                    //  const nuevaCancelacion = repoComplementoPago.create( cancelarFactura )
                    //  await repoComplementoPago.update( complementoPagoExistente.id, nuevaCancelacion )
            
                    //}
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){       

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Cancelacion')
          }

          throw new BadRequestException(error)

        }       

        throw new BadRequestException(`Hubo un error al generar la Cancelación: ${error}`)

      }

      //throw new BadRequestException("TODO BIEN HASTA AQUI")
           
      //CANCELAR FACTURA PAC
      
      let cancelacionPAC: any | null = null;
      let uuidFactura: string = '';
      let motivo: string = '';
      let folioSustitucion: string = '';
      
      try{

        //uuidFactura =       facturaCancelar.uuid;
        //motivo =            satCancelacionMotivo.clave;
        //folioSustitucion =  '';

        const headers = {
          //Authorization: `Bearer ${apiFactura.token}`,
          //'Content-Type': 'application/json',
          //'X-CLIENT-ID': apiFactura.clientId
          key: "Content-Type",
          value: "application/json",
          type: "text"
        } 

        const raw = {

        }

        /*        
        raw: "{
            "RfcEmisor": "IIA040805DZ4",
            "FolioFiscal": "380230be-e125-4bce-8ca4-e0a059389cc2",
            "MotivoCancelacion": "01",
            "FolioFiscalSustitucion": "9072de4b-d071-4b74-bfde-4248a86e5996"
        }",*/
        
        const cancelaCFDIAck = {
          RfcEmisor: facturaCancelar.emisorRFC.toUpperCase(),
          FolioFiscal: facturaCancelar.uuid,
          MotivoCancelacion: satCancelacionMotivo.clave,
          FolioFiscalSustitucion: ''
        }
        

        //respuesta
        /*{
            "CodigoSat": "0",
            "ResultadoSat": "",
            "Acuse": "<?xml version=\"1.0\" encoding=\"utf-8\"?><Acuse xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" Fecha=\"2025-12-02T22:14:35.1740028\" RfcEmisor=\"WATM640917J45\"><Folios xmlns=\"http://cancelacfd.sat.gob.mx\"><UUID>B3D1E2E5-A13C-49A7-B4E5-5B19CA4414B9</UUID><EstatusUUID>201</EstatusUUID></Folios><Signature xmlns=\"http://www.w3.org/2000/09/xmldsig#\"><SignedInfo><CanonicalizationMethod Algorithm=\"http://www.w3.org/TR/2001/REC-xml-c14n-20010315\" /><SignatureMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#rsa-sha1\" /><Reference URI=\"\"><Transforms><Transform Algorithm=\"http://www.w3.org/2000/09/xmldsig#enveloped-signature\" /></Transforms><DigestMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#sha1\" /><DigestValue>Zf5dGpvH0cuM5Kvi4N4gyMjtF3M=</DigestValue></Reference></SignedInfo><SignatureValue>b7Bdev3iAXiKTVNYRRoadX6y4Jh4H77AU6LwKnjYpkRUOvR+rVj8A0pMBP8wg5yCJ8EqBw25XAiVLsr1+GUYXNx+hdIF1YA3U7xGC3sZ7234+UglshVxaeFDJPyjLAzFYr4lNoEIJqLPm9tItYcRIcK3nRPO4z90l5fJCF2QTa1hmrflZqwS0mXo4iWNXSDag2nnmNMIFlmblbcgMsFX0mhcH9dKr24FSi9cvQA/+lj7GrDjZW5R0Blsc7s+4g3TLjKvkCiKjcIZO6au+rzTPfFohsXFDp/seDeMdqudIt9TntPPhsvoMFrDaGHDotiaqiauhnr61KrVJBil1xxeGA==</SignatureValue><KeyInfo><X509Data><X509IssuerSerial><X509IssuerName>OID.1.2.840.113549.1.9.2=responsable: ACDMA-SAT, OID.2.5.4.45=2.5.4.45, L=COYOACAN, S=CIUDAD DE MEXICO, C=MX, PostalCode=06370, STREET=3ra cerrada de caliz, E=oscar.martinez@sat.gob.mx, OU=SAT-IES Authority, O=SERVICIO DE ADMINISTRACION TRIBUTARIA, CN=AC UAT</X509IssuerName><X509SerialNumber>3330303031303030303030353030303033333632</X509SerialNumber></X509IssuerSerial><X509Certificate>MIIFgzCCA2ugAwIBAgIUMzAwMDEwMDAwMDA1MDAwMDMzNjIwDQYJKoZIhvcNAQELBQAwggErMQ8wDQYDVQQDDAZBQyBVQVQxLjAsBgNVBAoMJVNFUlZJQ0lPIERFIEFETUlOSVNUUkFDSU9OIFRSSUJVVEFSSUExGjAYBgNVBAsMEVNBVC1JRVMgQXV0aG9yaXR5MSgwJgYJKoZIhvcNAQkBFhlvc2Nhci5tYXJ0aW5lekBzYXQuZ29iLm14MR0wGwYDVQQJDBQzcmEgY2VycmFkYSBkZSBjYWxpejEOMAwGA1UEEQwFMDYzNzAxCzAJBgNVBAYTAk1YMRkwFwYDVQQIDBBDSVVEQUQgREUgTUVYSUNPMREwDwYDVQQHDAhDT1lPQUNBTjERMA8GA1UELRMIMi41LjQuNDUxJTAjBgkqhkiG9w0BCQITFnJlc3BvbnNhYmxlOiBBQ0RNQS1TQVQwHhcNMjMwNTE1MTY1NzU3WhcNMjcwNTE1MTY1NzU3WjCBqjEeMBwGA1UEAxMVTUFSSUEgV0FURU1CRVIgVE9SUkVTMR4wHAYDVQQpExVNQVJJQSBXQVRFTUJFUiBUT1JSRVMxHjAcBgNVBAoTFU1BUklBIFdBVEVNQkVSIFRPUlJFUzEWMBQGA1UELRMNV0FUTTY0MDkxN0o0NTEbMBkGA1UEBRMSV0FUTTY0MDkxN01IR1RSUjAxMRMwEQYDVQQLEwpTdWN1cnNhbCAxMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAueKA188y59jth2cxGI3IRAwKXA77p7bOOli5hb5Jsv3GdWdnrjg+hldmCnfV5OnfAj/oGKkD8UcpIEir1Yk9iz1CYN+p7uSndp0cwp6ExsCYY9GRC0FWPNY/ZXwc/CHOKW3Y2iXlWJDBfyhLCKC+4oTkBzp+2KmjRNIVdsJoVvZH/KSs6U7j+coos9ygrbvQk+i1UrC5L0/JhTA44Rp2l4Kj9sVhz1PUqA+Lq9rLMkvsDBC6NS3NlLhPsJ+4c5PlLTikc3LcLZVtBp/rz20pct+AAskGwDZe8/HVRecehb71pDaPCdHyj6j3Z3NJIArxLm6ecZZguWaSrA1LuSSOnQIDAQABox0wGzAMBgNVHRMBAf8EAjAAMAsGA1UdDwQEAwIGwDANBgkqhkiG9w0BAQsFAAOCAgEAdu2JXVqSJ/0nLLFIq+3bodv9dHgR8RraMTrMugBToKut69OEZ2+59rUzaYEOyfCnkoOcrpRikTH80QNvYyu4n2PaGuf6labBGloR8rkWgql96vB+xKTzhdF/kc9DwEYIWZgGAeamZ3X4CofJs10oYBUDCSdwOt4PPb9mDB7pKw6yH0M/OqLOFVCC7BAk4ER4pcuj5T/xBMLFcb09/cvUg/+/jETjHHrnS+BuBzXTvCUtLHBr6IOOmWAr8B8Onmph7FrJY/2lmZMLlGVY0POUa/4i+M8wntvfXxlyUoYc+5g4ZAdj2b6oj3gh2dDldkwV6K0ekPSChVcKqPgjsL9y7RfT+1miEwbEf+W5OeKE67MQoEtScJ7vuXXP1Gz/juUMyQY+BC/n2UmiLCTqAoXYybyTKiK1gV9Ymmxk1/LZUq6fvOuZoyOSgC0znlGg874BAwQ65WJwq34IOsN0grCC/pVPbLJpUUp9ZzDMMqAk6yC7UDHacQI7hO4b7TKn7vz150vp2ZJzjFwP3zUKBlF+VmWsMmpiINfguo/owVR4NYzy5RaZLkXbuiomU74VIsJySpo8SpUouvmkZjbMDbcsMD1rblXn+sCozz2altEP6DJYANqtbDy9hrWjIwTy0HbXR7Wg1ASz1fmV4YyPBks5otf0DomGmzLSEEHPaBNuDCU=</X509Certificate></X509Data></KeyInfo></Signature></Acuse>",
            "Codigo": 0,
            "Mensaje": "Factura cancelada correctamente.",
            "Valores": null
        }*/

        console.log("CancelaCFDIAck")


        //CancelaCFDIAck
        const respuesta: any =  await firstValueFrom( 
          this.httpService.post( `${apiFactura.url}/v1/compatibilidad/${apiFactura.clientId}/CancelaCFDIAck`, cancelaCFDIAck, {
            headers
          }) 
        );
        
        
        /*
          "Cancelar factura"
          "{{API_URL}}/v1/facturacion/cancelar/9a881c59-f1c5-4d86-8ec0-fdd6b8dc505c?motivo=03&folio_sustitucion="
          const respuesta =  await firstValueFrom( this.httpService.delete( `${apiFactura.url}/v1/facturacion/cancelar/${uuidFactura}?motivo=${motivo}&folio_sustitucion=${folioSustitucion}`, {
          headers
        } ) );*/



        //const respuesta =  await firstValueFrom( this.httpService.post( `${apiFactura.url}/v1/facturacion/timbrar`, nuevaFacturaPAC, {
        //  headers
        //} ) );
        
        //cancelacionPAC = respuesta.data.data;
        cancelacionPAC = respuesta.data;

        console.log("cancelacionPAC")
        console.log(cancelacionPAC)

        return {
          id: ''
        }

        //console.log("cancelaCFDIAck")
        //console.log(cancelaCFDIAck)

        //console.log("respuesta")
        //console.log(respuesta)

      }catch(error: any){ 

        if( error.response?.status == 400){
   
          if( error.response?.data?.status == 'error'){

            throw new BadRequestException( `Hubo un error al generar la Cancelación PAC: ${error.response?.data?.message}` )

          }
        }
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        } 

        throw new BadRequestException(`Hubo un error al generar la Cancelacion PAC: ${error}`)

      }

       // UPDATE FACTURA CON ACUSE RESPUESTA
      //let cancelarFactura: CancelarFactura = null
      
      try{

        //const updateFacturaCancelada: CancelarFacturaAcuse = {
        //  cancelacionAcuseRespuesta: cancelacionPAC
        //}

        //cancelarFactura.fechaCancelacion = fechaLocal;
        //cancelarFactura.satCancelacionMotivo = satCancelacionMotivo;
        //cancelarFactura.idSustitucion = '';
        //cancelarFactura.uuidSustitucion = '';        

        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){

        console.log("Antes cancelacion 01")

        console.log("facturaCancelar.id")
        console.log(facturaCancelar.id)

          await repoFactura.update(
            {id: facturaCancelar.id},
            {
              cancelacionAcuseRespuesta: cancelacionPAC
            }
          )

          console.log("despues cancelacion 02")

          //const updateFacturaAcuse = repoFactura.create( updateFacturaCancelada )
          //await repoFactura.update( facturaCancelar.id, updateFacturaAcuse )

        //}else{
          
        //  const nuevaCancelacion = repoComplementoPago.create( cancelarFactura )
        //  await repoComplementoPago.update( complementoPagoExistente.id, nuevaCancelacion )

        //}

      }catch(error: any){   
        
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){       

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Cancelacion')
          }

          throw new BadRequestException(error)

        }       

        throw new BadRequestException(`Hubo un error al generar la Cancelación: ${error}`)

      }
      
            
      
    
      // GUARDAR FACTURA LOCAL
      /*
      let facturaGuardada: Factura | null = null;

      let nuevoId = ''

      let fechaEmisionLocal: string;
      
      try{   

        nuevoId = await generarEntityId( repoFactura, EnumPrefijoEntity.FACTURAS);
        
        fechaEmisionLocal = formatInTimeZone(createCancelacionDto.fechaEmision, user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss')     

        const nuevaFactura = repoFactura.create({
          id: nuevoId,           
          serie: serie,
          folio: folio,
          satFormaPago: satFormaPago,
          condicionesPago: createCancelacionDto.condicionesPago,
          satMetodoPago: satMetodoPago,
          satMoneda:                  facturaCancelar.satMoneda,
          tipoCambio:                 facturaCancelar.tipoCambio,
          lugarExpedicion: createCancelacionDto.lugarExpedicion,
          observaciones: createCancelacionDto.observaciones,
          satTipoComprobante:         facturaCancelar.satTipoComprobante,
          subtotal:  totalesConceptosImpuestosFactura.totalesFactura.subtotal.toFixed(2),
          descuento: "0",
          total: totalesConceptosImpuestosFactura.totalesFactura.total.toFixed(2),
          emisorRFC:                  facturaCancelar.emisorRFC,
          emisorRazonSocial:          facturaCancelar.emisorRazonSocial,
          emisorSatRegimenFiscal:     facturaCancelar.emisorSatRegimenFiscal,
          emisorCodigoPostal:         facturaCancelar.emisorCodigoPostal,
          receptorRFC:                facturaCancelar.receptorRFC,
          receptorRazonSocial:        facturaCancelar.receptorRazonSocial,
          receptorEmail:              facturaCancelar.receptorEmail,
          receptorSatRegimenFiscal:   facturaCancelar.receptorSatRegimenFiscal,
          receptorSatUsoCFDI:         facturaCancelar.receptorSatUsoCFDI,
          receptorCodigoPostal:       facturaCancelar.receptorCodigoPostal,
          receptorSatTipoPersona:     facturaCancelar.receptorSatTipoPersona,
          fechaCancelacion:           null,
          anio:                       new Date( fechaLocal ).getFullYear().toString(),
          satExportacion:             facturaCancelar.satExportacion,
          emisor:                     facturaCancelar.emisor,
          receptorCliente:            facturaCancelar.orden.cliente,
          receptorEmpresa:            facturaCancelar.orden.empresa,
          orden:                      facturaCancelar.orden,
          estatus: EnumEstatusCFDI.VIGENTE
        }) 
        
        facturaGuardada = await repoFactura.save( nuevaFactura )

      }catch(error){   
        
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){       

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Factura')
          }

          throw new BadRequestException(error)

        }       

        throw new BadRequestException(`Hubo un error al generar la Factura: ${error}`)

      }
      */

      // GUARDAR CONCEPTOS E IMPUESTOS
      /*
      await this._guardarConceptosEImpuestosFactura( totalesConceptosImpuestosFactura.conceptosFactura, facturaGuardada, queryRunner );      
      */
      
      // GUARDAR FACTURA PAC
      /*
      let facturaPAC: any | null = null;      
      
      try{              

        const nuevaFacturaPAC = {
          fecha_emision: fechaEmisionLocal,
          serie: serie,
          folio: Number( folio ),
          forma_pago: satFormaPago.clave,
          condiciones_pago: createCancelacionDto.condicionesPago,
          metodo_pago: satMetodoPago.clave,          
          moneda:               facturaCancelar.satMoneda.clave,
          lugar_expedicion: createCancelacionDto.lugarExpedicion,
          observaciones: createCancelacionDto.observaciones,
          tipo_comprobante: satTipoComprobante.clave,
          subtotal: totalesConceptosImpuestosFactura.totalesFactura.subtotal,
          total: totalesConceptosImpuestosFactura.totalesFactura.total,
          exportacion: facturaCancelar.satExportacion.clave,
          emisor: {
            rfc: facturaCancelar.emisorRFC.toUpperCase(),
            razon_social: facturaCancelar.emisorRazonSocial.toUpperCase(),
            regimen_fiscal: facturaCancelar.emisorSatRegimenFiscal.clave,
            codigo_postal: facturaCancelar.emisorCodigoPostal
          },
          receptor: receptor,
          conceptos: totalesConceptosImpuestosFactura.conceptosFactura,
          impuestos: totalesConceptosImpuestosFactura.impuestosFactura
        }     

        const headers = {
          Authorization: `Bearer ${apiFactura.token}`,
          'Content-Type': 'application/json',
          'X-CLIENT-ID': apiFactura.clientId
        }   
        
        const respuesta =  await firstValueFrom( this.httpService.post( `${apiFactura.url}/v1/facturacion/timbrar`, nuevaFacturaPAC, {
          headers
        } ) );

        facturaPAC = respuesta.data.data;    

      }catch(error){ 

        if( error.response?.status == 400){
   
          if( error.response?.data?.status == 'error'){

            throw new BadRequestException( `Hubo un error al generar la Factura PAC: ${error.response?.data?.message}` )

          }
        }
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        } 

        throw new BadRequestException(`Hubo un error al generar la Factura PAC: ${error}`)

      }      
      */
      
      // UPDATE FACTURA LOCAL CON LOS DATOS DEL TIMBRADO PAC -
      //await this._actualizarFacturaConDatosTimbrado( { id:facturaGuardada.id, ...facturaPAC }, queryRunner );
      
                      // UPDATE ORDEN CON LOS DATOS DE LA NUEVA FACTURA
                      //await this._actualizarOrdenConNuevaFactura( facturaCancelar.orden.id, satMetodoPago, totalesConceptosImpuestosFactura.totalesFactura.total, queryRunner ); 

      // UPDATE LIDACION FACTURA EN ORDEN

      console.log("UPDATE LIDACION FACTURA EN ORDEN")

      console.log("facturaCancelar.orden.id")
      console.log(facturaCancelar.orden.id)
      await this._actualizarOrdenFacturaCancelada(facturaCancelar.orden.id, queryRunner)
      
      await queryRunner.commitTransaction()      
      
      return {
        id: facturaCancelar.id
      }

    }catch(error: any){

      await queryRunner.rollbackTransaction();

      const data = error?.response?.data

      if( data ){

        if( data.message ){

          throw new BadRequestException(`Error al facturar: ${ data.message} `);
        }

      }
      
      if(error instanceof NotFoundException ){

        throw error
      }

      if(error instanceof BadRequestException){

        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar Cancelar la Factura: ${error}`)      

    }finally{
      await queryRunner.release();
    }   
    
  }

  async createCancelacionPago( createCancelacionDto: CreateCancelacionDto, user: User ){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();


    // 01 Recibir toda la informacion, 
    
    // 02 verificar el tipo de cancelacion, si se creara o nó una factura de Sustitucion
    
    // 03 En caso de cancelacion con factura de sustitucion 
    // 04 Validar que haya al menos un cambio en conceptos ó en cualquier otro campo
    // 05 actualizar la orden original con la nueva informacion
    // 06 generar la nueva factura

    // 07 timbrar la cancelacion   

    
    try{
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const repoFactura = queryRunner.manager.getRepository(Factura);      
      const repoOrden = queryRunner.manager.getRepository(Orden);
      //const repoComplemento = queryRunner.manager.getRepository(Complemento);
      const repoPago = queryRunner.manager.getRepository(Pago);
      const repoProductoServicio = queryRunner.manager.getRepository(ProductoServicio);

      // 00 FACTURA P - PAGO

      let fechaLocal: string;      
      let timbradoMayor72H: boolean = false;

      try{

        //si motivoCancelacion es igual a 01 se debe de requerir folio sustitucion

        //si se cancela una FActura tipo I - Ingreso con PUE
          //Que no haya pasado mas de 72 horas de timbrado
            //Si ya pasaron mas de 72 horas del timbrado, el receptor debe aceptar la cancelacion en el buzon tributario

        //factura I - Ingreso  conm PPD
          //si ya tiene complemento de PAGO, entonces se deben cancelar primero los complementos de PAgoy al final la factura de ingreso

        //Complemento de PAGO
            //se puede cancelar si no hay otro posterior
              //si se cancela se debe de emitir uno nuevo si el pago sigue siendo valido

              
              //fechaEmisionLocal = formatInTimeZone(createComplementoDto.fechaEmision, user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss')
              //fechaPagoLocal =    formatInTimeZone(createComplementoDto.fechaPago, user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss')
              
        //if( createCancelacionDto.claveSatCancelacionMotivo === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){
          //if( createCancelacionDto.uuid_sustitucion.trim() === '' ){
          //  throw new BadRequestException(`Debes de ingresar un UUID de Sustitución`);
          //}
        //}
              
        fechaLocal = formatInTimeZone( new Date(), user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss');
        //if( createComplementoDto.monto.trim() === '' || Number( createComplementoDto.monto ) <= 0  ){
        //  throw new BadRequestException(`El monto del Complemento de Pago debe ser mayor a cero`)
        //}

        //if( createComplementoDto.claveSatTipoComprobante !== EnumSatTipoComprobante.PAGO ){
         // throw new BadRequestException(`El Complemento de Pago debe ser Tipo de Comprobante P - Pago`)
        //}
        

      }catch(error){
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){          

          throw error

        }

        throw new BadRequestException(`Hubo un error al intentar generar la Cancelación: ${error}`)

      }
      
      // 00 FACTURA EXISTENTE y Validaciones

      let facturaExistente: Factura | null = null;

      try{

        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){
          
          facturaExistente = await repoFactura.findOne({
            where: {
              //satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO },
              //orden: { id: createComplementoDto.id_factura },
              id: createCancelacionDto.id_factura,
              //estatus: EnumSatFacturaEstatusFiscal.VIGENTE,
              //fechaCancelacion: null,
            },
            relations: ['satTipoComprobante', 'pagos']
            //relations: ['satMetodoPago', 'receptorSatRegimenFiscal', 'emisorSatRegimenFiscal', 'complementoPagos', 'orden']
          });          
  
          if( !facturaExistente ){
            throw new NotFoundException(`No se encontró una factura con ID: ${ createCancelacionDto.id_factura}`)
          }
  
          if( facturaExistente.estatus === EnumEstatusCFDI.CANCELADA ){
            throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} ya está Cancelada`)
          }
  
          if( facturaExistente.estatus !== EnumEstatusCFDI.VIGENTE ){
            throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} no está Vigente`)
          }
          
          if( facturaExistente.uuid !== createCancelacionDto.uuid ){
            throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} no coincide con el UUID del timbre`)
          }
          
          const diferenciaHoras = dateGetHoursDifference( facturaExistente.fechaTimbrado, new Date( fechaLocal ) );

          if( diferenciaHoras > 72 ){
            timbradoMayor72H = true
          }

          //TODO complementoPagos
          /*
          if( facturaExistente.satTipoComprobante.clave === EnumSatTipoComprobante.INGRESO ){
            if( facturaExistente.satMetodoPago.clave === EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO ){              
              facturaExistente.complementoPagos.forEach( cP => {
                if( cP.estatus === EnumEstatusCFDI.VIGENTE ){
                  throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} tiene al menos un Complemento de Pago Vigente, debes de cancelarlo primero`)
                }
              })
            }
          }

          */

        //}

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al Cancelar: ${error}`)

      }

      // 01 CATALOGOS
      let satCancelacionMotivo: SatCancelacionMotivo | null = null

      let satMetodoPagoSustitucion: SatMetodoPago | null = null;
      let satFormaPagoSustitucion: SatFormaPago | null = null;

      try{       

        const repoSatCancelacionMotivo = queryRunner.manager.getRepository(SatCancelacionMotivo);
        satCancelacionMotivo = await repoSatCancelacionMotivo.findOneBy({ clave: createCancelacionDto.claveSatCancelacionMotivo })

        if(!satCancelacionMotivo){
          throw new NotFoundException(`El motivo de Cancelación con ID: ${createCancelacionDto.claveSatCancelacionMotivo} no existe`)
        }

        if( satCancelacionMotivo.clave === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){

          const repoSatMetodoPago = queryRunner.manager.getRepository(SatMetodoPago);
          satMetodoPagoSustitucion = await repoSatMetodoPago.findOneBy({ clave: createCancelacionDto.claveSatMetodoPago  })
          
          if( !satMetodoPagoSustitucion ){
            throw new NotFoundException(`El Método de Pago con ID: ${createCancelacionDto.claveSatMetodoPago} no existe`)
          }

          const repoSatFormaPago = queryRunner.manager.getRepository(SatFormaPago);
          satFormaPagoSustitucion = await repoSatFormaPago.findOneBy({ clave: createCancelacionDto.claveSatFormaPago  })
          
          if( !satFormaPagoSustitucion ){
            throw new NotFoundException(`La Forma de Pago con ID: ${createCancelacionDto.claveSatFormaPago} no existe`)
          }          

        }

      }catch( error ){    
        
        if( error instanceof BadRequestException){       

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        }      

        throw new BadRequestException(`Hubo un error al revisar los catálogos: ${error}`)

      }

      // 02 VALIDAR QUE LA NUEVOS DATOS PARA LA FACTURA DE SUSTITUCION TENGA INFORMACION DISTINTA
      try{

        if( satCancelacionMotivo.clave === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){

          //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){
            
            if( facturaExistente.satMetodoPago.clave != satMetodoPagoSustitucion.clave ) return;
            if( facturaExistente.satFormaPago.clave != satFormaPagoSustitucion.clave ) return;
            if( facturaExistente.condicionesPago.trim() != createCancelacionDto.condicionesPago.trim() ) return;
            if( facturaExistente.lugarExpedicion.trim() != createCancelacionDto.lugarExpedicion.trim() ) return;
            if( facturaExistente.observaciones.trim() != createCancelacionDto.observaciones.trim() ) return;            
            if( facturaExistente.fechaEmision.getTime() != createCancelacionDto.fechaEmision.getTime() ) return;

            if( facturaExistente.conceptos.length !== createCancelacionDto.conceptos.length ) return;

            for( const concepto of facturaExistente.conceptos){
              
              const conceptoDto = createCancelacionDto.conceptos.find( cDto => cDto.id_producto_servicio === concepto.productoServicio.id )

              if( !conceptoDto ) return;

              if( Number(conceptoDto.cantidad) !== Number(concepto.cantidad) 
                || Number(concepto.valorUnitario) !== Number(concepto.valorUnitario) ){
                  return;
              }

            }
            
            throw new NotFoundException(`No se encontró diferencia entre la factura original y la nueva factura de sustitución`)
          //}          

        }

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al revisar los datos para la Factura de Sustitución: ${error}`)

      }
      
      // 00 FACTURA SUSTITUCION EXISTENTE y Validaciones
      /*
      let facturaSustitucionExistente: Factura | null = null;

      try{

        if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){
          
          facturaSustitucionExistente = await repoFactura.findOne({
            where: {
              //satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO },
              //orden: { id: createComplementoDto.id_factura },
              id: createCancelacionDto.id_sustitucion,
              //estatus: EnumSatFacturaEstatusFiscal.VIGENTE,
              //fechaCancelacion: null,
            },
            //relations: ['satTipoComprobante', 'complementoPagos']
            //relations: ['satMetodoPago', 'receptorSatRegimenFiscal', 'emisorSatRegimenFiscal', 'complementoPagos', 'orden']
          });          
  
          if( !facturaSustitucionExistente ){
            throw new NotFoundException(`No se encontró la factura de sustitución con ID: ${ createCancelacionDto.id_sustitucion}`)
          }
  
          if( facturaSustitucionExistente.estatus === EnumEstatusCFDI.CANCELADA ){
            throw new BadRequestException(`La factura de sustitución con ID: ${createCancelacionDto.id_sustitucion} ya está Cancelada`)
          }
  
          if( facturaSustitucionExistente.estatus !== EnumEstatusCFDI.VIGENTE ){
            throw new BadRequestException(`La factura de sustitución con ID: ${createCancelacionDto.id_factura} no está Vigente`)
          }

          if( facturaSustitucionExistente.uuid !== createCancelacionDto.uuid_sustitucion ){
            throw new BadRequestException(`La factura de sustitución con ID: ${createCancelacionDto.id_factura} no coincide con el UUID del timbre`)
          }          
          
          if( facturaSustitucionExistente.receptorRFC !== facturaExistente.receptorRFC ){
            throw new BadRequestException(`La factura de sustitución con ID: ${createCancelacionDto.id_factura} no coincide con el RFC del Receptor`)
          }
          
        }

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al Cancelar: ${error}`)

      }
      */

      // 00 COMPLEMENTO PAGO EXISTENTE y Validaciones
      
      let pagoExistente: Pago | null = null;

      try{

        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.COMPLEMENTO ){
          
          pagoExistente = await repoPago.findOne({
            where: {
              //satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO },
              //orden: { id: createComplementoDto.id_factura },
              id: Number( createCancelacionDto.id_pago ),
              //estatus: EnumSatFacturaEstatusFiscal.VIGENTE,
              //fechaCancelacion: null,
            },
            relations: ['complemento']
            //relations: ['satMetodoPago', 'receptorSatRegimenFiscal', 'emisorSatRegimenFiscal', 'complementoPagos', 'orden']
          });
          
          //REVISAR que no haya complemento de Pagos posteriores con estatus de VIGENTE
  
          if( !pagoExistente ){
            throw new NotFoundException(`No se encontró un Complemento de Pago con ID: ${createCancelacionDto.id_pago}`)
          }
  
          if( pagoExistente.complemento.estatus === EnumEstatusCFDI.CANCELADA ){
            throw new BadRequestException(`El Complemento de Pago con ID: ${createCancelacionDto.id_factura} está Cancelado`)
          }
  
          if( pagoExistente.complemento.estatus !== EnumEstatusCFDI.VIGENTE ){
            throw new BadRequestException(`El Complemento de Pago con ID: ${createCancelacionDto.id_factura} no está Vigente`)
          }

          if( pagoExistente.complemento.uuid !== createCancelacionDto.uuid ){
            throw new BadRequestException(`El Complemento de Pago con ID: ${createCancelacionDto.id_factura} no coincide con el UUID del timbre`)
          }

          const diferenciaHoras = dateGetHoursDifference( pagoExistente.complemento.fechaTimbrado, new Date( fechaLocal ) );

          if( diferenciaHoras > 72 ){
            timbradoMayor72H = true
          }

        //}

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al Cancelar: ${error}`)        

      }
      

      // 00 COMPLEMENTO PAGO SUSTITUTO EXISTENTE y Validaciones
      /*
      let complementoPagoSustitucionExistente: FacturaComplementoPago | null = null;

      try{

        if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.COMPLEMENTO ){
          
          complementoPagoSustitucionExistente = await repoComplementoPago.findOne({
            where: {
              //satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO },
              //orden: { id: createComplementoDto.id_factura },
              id: createCancelacionDto.id_sustitucion,
              //estatus: EnumSatFacturaEstatusFiscal.VIGENTE,
              //fechaCancelacion: null,
            },
            //relations: ['complementoPagos']
            //relations: ['satMetodoPago', 'receptorSatRegimenFiscal', 'emisorSatRegimenFiscal', 'complementoPagos', 'orden']
          });
          
          //REVISAR que no haya complemento de Pagos posteriores con estatus de VIGENTE
  
          if( !complementoPagoSustitucionExistente ){
            throw new NotFoundException(`No se encontró un Complemento Pago de Sustitucion con ID: ${createCancelacionDto.id_sustitucion}`)
          }
  
          if( complementoPagoSustitucionExistente.estatus === EnumEstatusCFDI.CANCELADA ){
            throw new BadRequestException(`El Complemento de Pago de Sustitución con ID: ${createCancelacionDto.id_sustitucion} está Cancelado`)
          }
  
          if( complementoPagoSustitucionExistente.estatus !== EnumEstatusCFDI.VIGENTE ){
            throw new BadRequestException(`El Complemento de Pago de Sustitución con ID: ${createCancelacionDto.id_sustitucion} no está Vigente`)
          }

          if( complementoPagoSustitucionExistente.uuid !== createCancelacionDto.uuid_sustitucion ){
            throw new BadRequestException(`El Complemento de Pago de Sustitución con ID: ${createCancelacionDto.id_factura} no coincide con el UUID del timbre`)
          }

          const diferenciaHoras = dateGetHoursDifference( complementoPagoSustitucionExistente.fechaTimbrado, new Date( fechaLocal ) );

        }

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al Cancelar: ${error}`)        

      }
      */

  
      const apiFactura: ApiFactura = {
        url: '',
        clientId: '',
        token: ''
      }        
      
      /* 01 EMISOR */
      
      let emisor: Emisor | null = null;
      
      try{
        
        if( this.configService.get<string>('STAGE') === 'dev' ){
          apiFactura.url = this.configService.get<string>('TECH_API_URL_DEV')
          apiFactura.clientId = this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
          apiFactura.token = this.configService.get<string>('TECH_API_TOKEN_DEV')
        }else{
          apiFactura.url = this.configService.get<string>('TECH_API_URL_DEV')
          apiFactura.clientId = this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
          apiFactura.token = this.configService.get<string>('TECH_API_TOKEN_DEV')
        }

        const repoEmisor = queryRunner.manager.getRepository(Emisor);

        //TODO
        //Revisar las relaciones a: ['satRegimenFiscal', 'usuario', 'usuario.compania.satTipoPersona']
      
        emisor = await repoEmisor.findOne({
          where: { isActive: true },
          relations: ['satRegimenFiscal', 'usuario', 'usuario.compania.satTipoPersona']
        });          

        if(!emisor){
          throw new NotFoundException(`No hay un Emisor con estatus activo`)
        }

      }catch(error: any){        
        
        if( error instanceof BadRequestException){
          throw error
        }

        if( error.response?.data?.Mensaje ){  
          throw new BadRequestException(error.response?.data?.Mensaje)
        }   

        throw new BadRequestException(`Hubo un error al querer generar la Cancelacion: ${error}`)

      }
   
      // 02 EMISOR PAC TIMBRES DISPONIBLES
      try{

        const bodyEmisorTimbresDisponibles = {
          //"RfcEmisor": "FUNK671228PH7"
          "RfcEmisor": emisor.rfc
        }

        const respuestaPacObtieneTimbresDisponibles =  await firstValueFrom( this.httpService.post<RespuestaPacObtieneTimbresDisponibles>( `${apiFactura.url}/v1/compatibilidad/${apiFactura.clientId}/ObtieneTimbresDisponibles`, bodyEmisorTimbresDisponibles ) );
      
        if(respuestaPacObtieneTimbresDisponibles.data.ok){      
          
          if( respuestaPacObtieneTimbresDisponibles.data.body.TimbresDisponibles <= 0 ){          

            throw new BadRequestException('No hay timbres disponibles para Cancelar. Por favor, contacte con el administrador del sistema.');

          }

        }else{
       
          throw new BadRequestException(`Hubo un error al consultar los timbres disponibles: ${respuestaPacObtieneTimbresDisponibles.data.body}`)

        }

      }catch( error: any ){
    
        
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error.response?.data?.Mensaje ){
       
          throw new BadRequestException(error.response?.data?.Mensaje)
        } 

        throw new BadRequestException(`Hubo un error al consultar los timbres disponibles: ${error}`)

      }
      
      

      


                    //throw new Error("*facturasService create PAGO TEST* ANTES DE LLAMAR AL ENDPOINT")   


      // 04 OBTENER PRODUCTOS SERVICIOS PARA LOS NUEVOS CONCEPTOS
      let conceptosConProductoServicio = []
   
      try{    

        if( satCancelacionMotivo.clave === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){
          
          const ids = createCancelacionDto.conceptos.map( c => c.id_producto_servicio );
          const idsUnicos = Array.from( new Set(ids));

          const productosServicios = await repoProductoServicio.findBy({
            id: In(idsUnicos)
          })

          const productoServicioMap = new Map<string, ProductoServicio>();
          productosServicios.forEach( p => productoServicioMap.set(p.id, p));

          conceptosConProductoServicio = createCancelacionDto.conceptos.map( dto => {
            const productoServicio = productoServicioMap.get( dto.id_producto_servicio )
            if( !productoServicio ){
              throw new BadRequestException(`No se encontró el producto ó servicio con el ID ${ dto.id_producto_servicio }`);
            }

            return {
              ...dto,
              productoServicio: productoServicio
            }

          });

        }
    
      }catch( error ){    
            
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }   

        throw new BadRequestException(`Hubo un error al obtener los folios: ${error}`)

      }




      
      // 07 IMPUESTOS

      let totalesConceptosImpuestosFactura: any | null = null;

      try{
        
        if( satCancelacionMotivo.clave === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){
          //totalesConceptosImpuestosFactura = await this.calcularConceptosImpuestosFactura( facturaExistente.receptorSatTipoPersona.tipo as EnumSatTipoPersona, conceptosConProductoServicio, emisor, user );
          totalesConceptosImpuestosFactura = await this._calcularConceptosImpuestosFacturaNew( facturaExistente.receptorSatTipoPersona.tipo as EnumSatTipoPersona, conceptosConProductoServicio, emisor, user );
        }

      }catch(error){     
        
        if( error instanceof BadRequestException){       

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        } 

        throw new BadRequestException(`Hubo un error al calcular los impuestos: ${error}`)

      }

      // 04 FOLIOS Y SERIES

      let serie = '';
      let folio = '';
      
      try{    

        if( satCancelacionMotivo.clave === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){
          
          const serieAnio = `${new Date().getFullYear()}${user.compania.id}`
          
          serie = `${serieAnio}-${facturaExistente.satTipoComprobante.descripcion}`
                 
          //folio = await this.obtenerFolioFactura( repoFactura );
          folio = await this.obtenerFolioFactura( queryRunner );

        }
    
      }catch( error ){    
            
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }   

        throw new BadRequestException(`Hubo un error al obtener los folios: ${error}`)

      }



      // 08 FACTURAS

      let facturaGuardada: Factura | null = null;

      let nuevoId = ''

      let fechaEmisionLocal: string;
      
      try{   

        if( satCancelacionMotivo.clave === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){


        }

        nuevoId = await generarEntityId( repoFactura, EnumPrefijoEntity.FACTURAS );
        
        //fechaEmisionLocal = formatInTimeZone( createFacturaDto.fechaEmision, user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss')
        fechaEmisionLocal = formatInTimeZone( createCancelacionDto.fechaEmision, user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss')

        //uuid: facturaPAC.uuid,          
        //fechaTimbrado: facturaPAC.fecha_timbrado,
        //estado: facturaPAC.estado,

        const nuevaFactura = repoFactura.create({
          id: nuevoId, 
          fechaEmision: fechaEmisionLocal,
          serie: serie,
          folio: folio,
          satFormaPago: satFormaPagoSustitucion,
          condicionesPago: createCancelacionDto.condicionesPago.trim(),
          satMetodoPago: satMetodoPagoSustitucion,
          satMoneda: facturaExistente.satMoneda,
          tipoCambio: facturaExistente.tipoCambio,
          lugarExpedicion: createCancelacionDto.lugarExpedicion,
          observaciones: createCancelacionDto.observaciones,
          satTipoComprobante: facturaExistente.satTipoComprobante,
          
          subtotal:  totalesConceptosImpuestosFactura.totalesFactura.subtotal.toFixed(2),
          descuento: "0",
          total: totalesConceptosImpuestosFactura.totalesFactura.total.toFixed(2),

          emisorRFC: facturaExistente.emisorRFC,
          emisorRazonSocial: facturaExistente.emisorRazonSocial,
          emisorSatRegimenFiscal: facturaExistente.emisorSatRegimenFiscal,
          emisorCodigoPostal: facturaExistente.emisorCodigoPostal,
          receptorRFC: facturaExistente.receptorRFC,
          receptorRazonSocial: facturaExistente.receptorRazonSocial,
          receptorEmail: facturaExistente.receptorEmail,
          receptorSatRegimenFiscal: facturaExistente.receptorSatRegimenFiscal,
          receptorSatUsoCFDI: facturaExistente.receptorSatUsoCFDI,
          receptorCodigoPostal: facturaExistente.receptorCodigoPostal,
          receptorSatTipoPersona: facturaExistente.receptorSatTipoPersona,
          
          fechaCancelacion: fechaLocal,
          
          anio: new Date( createCancelacionDto.fechaEmision ).getFullYear().toString(),
          satExportacion: facturaExistente.satExportacion,
          emisor: facturaExistente.emisor,
          receptorCliente: facturaExistente.orden.cliente,
          receptorEmpresa: facturaExistente.orden.empresa,
          orden: facturaExistente.orden,
          estatus: EnumEstatusCFDI.VIGENTE
        }) 
        
        facturaGuardada = await repoFactura.save( nuevaFactura )

      }catch(error){   
        
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){       

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Factura')
          }

          throw new BadRequestException(error)

        }       

        throw new BadRequestException(`Hubo un error al generar la Factura: ${error}`)

      }
           





      // 09 CREAR COMPLEMENTO PAGO DE SUSTITUCION



      
      // 10 CANCELACION DE LA FACTURA | COMPLEMENTO PAGO
      let cancelarFactura: CancelarFactura = null
      
      try{

        cancelarFactura.fechaCancelacion = fechaLocal;
        cancelarFactura.satCancelacionMotivo = satCancelacionMotivo;
        cancelarFactura.idSustitucion = '';
        cancelarFactura.uuidSustitucion = '';

        //TODO

        if( satCancelacionMotivo.clave === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){
          
          //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){
            cancelarFactura.idSustitucion = ''//facturaSustitucionExistente.id;//TODO
            cancelarFactura.uuidSustitucion = ''//facturaSustitucionExistente.uuid;//TODO
          //}else{
            cancelarFactura.idSustitucion = ''// complementoPagoSustitucionExistente.id; //TODO
            cancelarFactura.uuidSustitucion = ''// complementoPagoSustitucionExistente.uuid; //TODO
          //}

        }        

        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){

          const nuevaCancelacion = repoFactura.create( cancelarFactura )
          await repoFactura.update( facturaExistente.id, nuevaCancelacion )

        //}else{
          
          //const nuevaCancelacion = repoComplementoPago.create( cancelarFactura )
          //await repoComplementoPago.update( complementoPagoExistente.id, nuevaCancelacion )

        //}

      }catch(error){   
        
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){       

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Cancelacion')
          }

          throw new BadRequestException(error)

        }       

        throw new BadRequestException(`Hubo un error al generar la Cancelación: ${error}`)

      }                        
      
      // 20 FACTURA PAC
      
      let cancelacionPAC: any | null = null;
      let uuidFactura: string = '';
      let motivo: string = '';
      let folioSustitucion: string = '';
      
      try{

        uuidFactura = facturaExistente.uuid;
        motivo = cancelarFactura.satCancelacionMotivo.clave;
        folioSustitucion = cancelarFactura.uuidSustitucion;

        const apiFactura: ApiFactura = {
          url: '',
          clientId: '',
          token: ''
        }
          
        if( this.configService.get<string>('STAGE') === 'dev' ){
          apiFactura.url = this.configService.get<string>('TECH_API_URL_DEV')
          apiFactura.clientId = this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
          apiFactura.token = this.configService.get<string>('TECH_API_TOKEN_DEV')
        }else{
          apiFactura.url = this.configService.get<string>('TECH_API_URL_DEV')
          apiFactura.clientId = this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
          apiFactura.token = this.configService.get<string>('TECH_API_TOKEN_DEV')
        }
       
        //throw new Error("*facturasService create TEST* ANTES DE LLAMAR AL ENDPOINT")

        const headers = this._obtenerHeadersPAC();
        
        const respuesta =  await firstValueFrom( this.httpService.delete( `${apiFactura.url}/v1/facturacion/cancelar/${uuidFactura}?motivo=${motivo}&folio_sustitucion=${folioSustitucion}`, {
          headers
        } ) );
        
        cancelacionPAC = respuesta.data.data;

      }catch(error: any){ 

        if( error.response?.status == 400){
   
          if( error.response?.data?.status == 'error'){

            throw new BadRequestException( `Hubo un error al generar la Cancelación PAC: ${error.response?.data?.message}` )

          }
        }
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        } 

        throw new BadRequestException(`Hubo un error al generar la Cancelacion PAC: ${error}`)

      }
      
      // 22 FACTURAS UPDATE
      
      try{

        const updateFacturaCancelar: CancelarFacturaAcuse = {
          cancelacionAcuseRespuesta: cancelacionPAC
        }

        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){

          const updateFacturaAcuse = repoFactura.create( updateFacturaCancelar )
          await repoFactura.update( facturaExistente.id, updateFacturaAcuse )

        //}else{
          
        //  const updateFacturaAcuse = repoComplementoPago.create( updateFacturaCancelar )
        //  await repoComplementoPago.update( complementoPagoExistente.id, updateFacturaAcuse )

        //}

      }catch(error){   
        
        if( error instanceof BadRequestException){       

          throw error

        }

        if( error instanceof NotFoundException){
      
          throw error

        }

        if( error instanceof QueryFailedError){         

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al actualizar la Cancelacion')
          }

          throw new BadRequestException(error)

        }      

        throw new BadRequestException(`Hubo un error al actualizar la Cancelación: ${error}`)

      }

      // 23 ORDEN UPDATE
      try{

        //const utcDate = zonedTimeToUtc(new Date(), user.zonaHoraria.clave);
        const newDateLocal = formatInTimeZone( new Date(), user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss' )       
                                                        
                                                                                /*const updateOrden = repoOrden.create({
                                                                                  liquidacionFactura: ( imp_saldo_insoluto === 0 ),
                                                                                  fechaLiquidacion: ( imp_saldo_insoluto === 0 ) ? newDateLocal : null
                                                                                })                                                        
                                                                                
                                                                                await repoOrden.update( facturaExistente.orden.id, updateOrden )*/

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al actualizar la Orden')
          }

          throw new BadRequestException(error)

        }        

        throw new BadRequestException(`Hubo un error al actualizar la Orden: ${error}`)

      }
      
      await queryRunner.commitTransaction()

       //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){

          return {
            id: facturaExistente.id
          }

        //}else{
          
//          return {
//            id: complementoPagoExistente.id
          //}

        //}

    }catch(error: any){

      await queryRunner.rollbackTransaction();

      const data = error?.response?.data

      if( data ){

        if( data.message ){

          throw new BadRequestException(`Error al cancelar: ${ data.message} `);
        }

      }
      
      if(error instanceof NotFoundException ){
        
        throw error
      }

      if(error instanceof BadRequestException){

        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar Cancelar: ${error}`)      

    }finally{
      await queryRunner.release();
    }  


  }

  /*
  async createCancelacionOLD( createCancelacionDto: CreateCancelacionDto, user: User ){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();


    // 01 Recibir toda la informacion, 
    
    // 02 verificar el tipo de cancelacion, si se creara o nó una factura de Sustitucion
    
    // 03 En caso de cancelacion con factura de sustitucion 
    // 04 Validar que haya al menos un cambio en conceptos ó en cualquier otro campo
    // 05 actualizar la orden original con la nueva informacion
    // 06 generar la nueva factura

    // 07 timbrar la cancelacion   

    
    try{
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);
      
      const repoFactura = queryRunner.manager.getRepository(Factura);      
      const repoOrden = queryRunner.manager.getRepository(Orden);
      const repoComplemento = queryRunner.manager.getRepository(Complemento);

      // 00 FACTURA P - PAGO

      let fechaLocal: string;      
      let timbradoMayor72H: boolean = false;

      try{

        //si motivoCancelacion es igual a 01 se debe de requerir folio sustitucion

        //si se cancela una FActura tipo I - Ingreso con PUE
          //Que no haya pasado mas de 72 horas de timbrado
            //Si ya pasaron mas de 72 horas del timbrado, el receptor debe aceptar la cancelacion en el buzon tributario

        //factura I - Ingreso  conm PPD
          //si ya tiene complemento de PAGO, entonces se deben cancelar primero los complementos de PAgoy al final la factura de ingreso

        //Complemento de PAGO
            //se puede cancelar si no hay otro posterior
              //si se cancela se debe de emitir uno nuevo si el pago sigue siendo valido

              
              //fechaEmisionLocal = formatInTimeZone(createComplementoDto.fechaEmision, user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss')
              //fechaPagoLocal =    formatInTimeZone(createComplementoDto.fechaPago, user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss')
              
        //if( createCancelacionDto.claveSatCancelacionMotivo === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){
          //if( createCancelacionDto.uuid_sustitucion.trim() === '' ){
          //  throw new BadRequestException(`Debes de ingresar un UUID de Sustitución`);
          //}
        //}
              
        fechaLocal = formatInTimeZone( new Date(), user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss');
        //if( createComplementoDto.monto.trim() === '' || Number( createComplementoDto.monto ) <= 0  ){
        //  throw new BadRequestException(`El monto del Complemento de Pago debe ser mayor a cero`)
        //}

        //if( createComplementoDto.claveSatTipoComprobante !== EnumSatTipoComprobante.PAGO ){
         // throw new BadRequestException(`El Complemento de Pago debe ser Tipo de Comprobante P - Pago`)
        //}
        

      }catch(error){
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){          

          throw error

        }

        throw new BadRequestException(`Hubo un error al intentar generar la Cancelación: ${error}`)

      }
      
      // 00 FACTURA EXISTENTE y Validaciones

      let facturaExistente: Factura | null = null;

      try{

        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){
          
          facturaExistente = await repoFactura.findOne({
            where: {
              //satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO },
              //orden: { id: createComplementoDto.id_factura },
              id: createCancelacionDto.id_factura,
              //estatus: EnumSatFacturaEstatusFiscal.VIGENTE,
              //fechaCancelacion: null,
            },
            relations: ['satTipoComprobante', 'complementoPagos']
            //relations: ['satMetodoPago', 'receptorSatRegimenFiscal', 'emisorSatRegimenFiscal', 'complementoPagos', 'orden']
          });          
  
          if( !facturaExistente ){
            throw new NotFoundException(`No se encontró una factura con ID: ${ createCancelacionDto.id_factura}`)
          }
  
          if( facturaExistente.estatus === EnumEstatusCFDI.CANCELADA ){
            throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} ya está Cancelada`)
          }
  
          if( facturaExistente.estatus !== EnumEstatusCFDI.VIGENTE ){
            throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} no está Vigente`)
          }
          
          if( facturaExistente.uuid !== createCancelacionDto.uuid ){
            throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} no coincide con el UUID del timbre`)
          }
          
          const diferenciaHoras = dateGetHoursDifference( facturaExistente.fechaTimbrado, new Date( fechaLocal ) );

          if( diferenciaHoras > 72 ){
            timbradoMayor72H = true
          }

          if( facturaExistente.satTipoComprobante.clave === EnumSatTipoComprobante.INGRESO ){
            if( facturaExistente.satMetodoPago.clave === EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO ){              
              facturaExistente.complementoPagos.forEach( cP => {
                if( cP.estatus === EnumEstatusCFDI.VIGENTE ){
                  throw new BadRequestException(`La factura con ID: ${createCancelacionDto.id_factura} tiene al menos un Complemento de Pago Vigente, debes de cancelarlo primero`)
                }
              })
            }
          }

        //}

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al Cancelar: ${error}`)

      }
      
      // 00 FACTURA SUSTITUCION EXISTENTE y Validaciones
      let facturaSustitucionExistente: Factura | null = null;

      try{

        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){
          
          facturaSustitucionExistente = await repoFactura.findOne({
            where: {
              //satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO },
              //orden: { id: createComplementoDto.id_factura },
              //TODO ???
              //Generar factura y luego usar si ID para ponerlo aqui
              //id: createCancelacionDto.id_sustitucion,
              //estatus: EnumSatFacturaEstatusFiscal.VIGENTE,
              //fechaCancelacion: null,
            },
            //relations: ['satTipoComprobante', 'complementoPagos']
            //relations: ['satMetodoPago', 'receptorSatRegimenFiscal', 'emisorSatRegimenFiscal', 'complementoPagos', 'orden']
          });          


  
                                                  
                                                  if( !facturaSustitucionExistente ){
                                                    throw new NotFoundException(`No se encontró la factura de sustitución con ID: ${ createCancelacionDto.id_sustitucion}`)
                                                  }
                                          
                                                  if( facturaSustitucionExistente.estatus === EnumEstatusCFDI.CANCELADA ){
                                                    throw new BadRequestException(`La factura de sustitución con ID: ${createCancelacionDto.id_sustitucion} ya está Cancelada`)
                                                  }
                                          
                                                  if( facturaSustitucionExistente.estatus !== EnumEstatusCFDI.VIGENTE ){
                                                    throw new BadRequestException(`La factura de sustitución con ID: ${createCancelacionDto.id_factura} no está Vigente`)
                                                  }

                                                  if( facturaSustitucionExistente.uuid !== createCancelacionDto.uuid_sustitucion ){
                                                    throw new BadRequestException(`La factura de sustitución con ID: ${createCancelacionDto.id_factura} no coincide con el UUID del timbre`)
                                                  }          
                                                  
                                                  if( facturaSustitucionExistente.receptorRFC !== facturaExistente.receptorRFC ){
                                                    throw new BadRequestException(`La factura de sustitución con ID: ${createCancelacionDto.id_factura} no coincide con el RFC del Receptor`)
                                                  }

                                                  
          
        //}

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al Cancelar: ${error}`)

      }

      // 00 COMPLEMENTO PAGO EXISTENTE y Validaciones
      let complementoPagoExistente: FacturaComplementoPago | null = null;

      try{

        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.COMPLEMENTO ){
          
          complementoPagoExistente = await repoComplementoPago.findOne({
            where: {
              //satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO },
              //orden: { id: createComplementoDto.id_factura },
              id: createCancelacionDto.id_factura,
              //estatus: EnumSatFacturaEstatusFiscal.VIGENTE,
              //fechaCancelacion: null,
            },
            //relations: ['complementoPagos']
            //relations: ['satMetodoPago', 'receptorSatRegimenFiscal', 'emisorSatRegimenFiscal', 'complementoPagos', 'orden']
          });
          
          //REVISAR que no haya complemento de Pagos posteriores con estatus de VIGENTE
  
          if( !complementoPagoExistente ){
            throw new NotFoundException(`No se encontró un Complemento Pago con ID: ${createCancelacionDto.id_factura}`)
          }
  
          if( complementoPagoExistente.estatus === EnumEstatusCFDI.CANCELADA ){
            throw new BadRequestException(`El Complemento de Pago con ID: ${createCancelacionDto.id_factura} está Cancelado`)
          }
  
          if( complementoPagoExistente.estatus !== EnumEstatusCFDI.VIGENTE ){
            throw new BadRequestException(`El Complemento de Pago con ID: ${createCancelacionDto.id_factura} no está Vigente`)
          }

          if( complementoPagoExistente.uuid !== createCancelacionDto.uuid ){
            throw new BadRequestException(`El Complemento de Pago con ID: ${createCancelacionDto.id_factura} no coincide con el UUID del timbre`)
          }

          const diferenciaHoras = dateGetHoursDifference( complementoPagoExistente.fechaTimbrado, new Date( fechaLocal ) );

          if( diferenciaHoras > 72 ){
            timbradoMayor72H = true
          }
    
          
          if( facturaExistente.satMetodoPago.clave !== EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO ){
            throw new BadRequestException(`La factura no está con método de pago PPD - Pago en Parcialidades ó Diferido, por lo que no se puede generar un Complemento de Pago`)
          }


        //}

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al Cancelar: ${error}`)        

      }

       // 00 COMPLEMENTO PAGO SUSTITUTO EXISTENTE y Validaciones
      let complementoPagoSustitucionExistente: FacturaComplementoPago | null = null;

      try{

        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.COMPLEMENTO ){
          
          complementoPagoSustitucionExistente = await repoComplementoPago.findOne({
            where: {
              //satTipoComprobante: { clave: EnumSatTipoComprobante.INGRESO },
              //orden: { id: createComplementoDto.id_factura },
              //id: createCancelacionDto.id_sustitucion,
              //estatus: EnumSatFacturaEstatusFiscal.VIGENTE,
              //fechaCancelacion: null,
            },
            //relations: ['complementoPagos']
            //relations: ['satMetodoPago', 'receptorSatRegimenFiscal', 'emisorSatRegimenFiscal', 'complementoPagos', 'orden']
          });
          
          //REVISAR que no haya complemento de Pagos posteriores con estatus de VIGENTE


                                              
                                              if( !complementoPagoSustitucionExistente ){
                                                throw new NotFoundException(`No se encontró un Complemento Pago de Sustitucion con ID: ${createCancelacionDto.id_sustitucion}`)
                                              }
                                      
                                              if( complementoPagoSustitucionExistente.estatus === EnumEstatusCFDI.CANCELADA ){
                                                throw new BadRequestException(`El Complemento de Pago de Sustitución con ID: ${createCancelacionDto.id_sustitucion} está Cancelado`)
                                              }
                                      
                                              if( complementoPagoSustitucionExistente.estatus !== EnumEstatusCFDI.VIGENTE ){
                                                throw new BadRequestException(`El Complemento de Pago de Sustitución con ID: ${createCancelacionDto.id_sustitucion} no está Vigente`)
                                              }

                                              if( complementoPagoSustitucionExistente.uuid !== createCancelacionDto.uuid_sustitucion ){
                                                throw new BadRequestException(`El Complemento de Pago de Sustitución con ID: ${createCancelacionDto.id_factura} no coincide con el UUID del timbre`)
                                              }

                                              

          const diferenciaHoras = dateGetHoursDifference( complementoPagoSustitucionExistente.fechaTimbrado, new Date( fechaLocal ) );

          //if( diferenciaHoras > 72 ){
          //  timbradoMayor72H = true
          //}
    
          
          if( facturaExistente.satMetodoPago.clave !== EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO ){
            throw new BadRequestException(`La factura no está con método de pago PPD - Pago en Parcialidades ó Diferido, por lo que no se puede generar un Complemento de Pago`)
          }
        //}

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        throw new BadRequestException(`Hubo un error al Cancelar: ${error}`)        

      }
  
      const apiFactura: ApiFactura = {
        url: '',
        clientId: '',
        token: ''
      }        
      
      // 01 EMISOR 
      
      let emisor: Emisor | null = null;
      
      try{
        
        if( this.configService.get<string>('STAGE') === 'dev' ){
          apiFactura.url = this.configService.get<string>('TECH_API_URL_DEV')
          apiFactura.clientId = this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
          apiFactura.token = this.configService.get<string>('TECH_API_TOKEN_DEV')
        }else{
          apiFactura.url = this.configService.get<string>('TECH_API_URL_DEV')
          apiFactura.clientId = this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
          apiFactura.token = this.configService.get<string>('TECH_API_TOKEN_DEV')
        }

        const repoEmisor = queryRunner.manager.getRepository(Emisor);

        //TODO
        //Revisar las relaciones a: ['satRegimenFiscal', 'usuario', 'usuario.compania.satTipoPersona']
      
        emisor = await repoEmisor.findOne({
          where: { isActive: true },
          relations: ['satRegimenFiscal', 'usuario', 'usuario.compania.satTipoPersona']
        });          

        if(!emisor){
          throw new NotFoundException(`No hay un Emisor con estatus activo`)
        }

      }catch(error){        
        
        if( error instanceof BadRequestException){
          throw error
        }

        if( error.response?.data?.Mensaje ){  
          throw new BadRequestException(error.response?.data?.Mensaje)
        }   

        throw new BadRequestException(`Hubo un error al querer generar la Cancelacion: ${error}`)

      }
   
      // 02 EMISOR PAC TIMBRES DISPONIBLES
      try{

        const bodyEmisorTimbresDisponibles = {
          //"RfcEmisor": "FUNK671228PH7"
          "RfcEmisor": emisor.rfc
        }

        const respuestaPacObtieneTimbresDisponibles =  await firstValueFrom( this.httpService.post<RespuestaPacObtieneTimbresDisponibles>( `${apiFactura.url}/v1/compatibilidad/${apiFactura.clientId}/ObtieneTimbresDisponibles`, bodyEmisorTimbresDisponibles ) );
      
        if(respuestaPacObtieneTimbresDisponibles.data.ok){      
          
          if( respuestaPacObtieneTimbresDisponibles.data.body.TimbresDisponibles <= 0 ){          

            throw new BadRequestException('No hay timbres disponibles para Cancelar. Por favor, contacte con el administrador del sistema.');

          }

        }else{
       
          throw new BadRequestException(`Hubo un error al consultar los timbres disponibles: ${respuestaPacObtieneTimbresDisponibles.data.body}`)

        }

      }catch( error ){
    
        
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error.response?.data?.Mensaje ){
       
          throw new BadRequestException(error.response?.data?.Mensaje)
        } 

        throw new BadRequestException(`Hubo un error al consultar los timbres disponibles: ${error}`)

      }
      
      // 03 CATALOGOS
      let satCancelacionMotivo: SatCancelacionMotivo | null = null

      try{       

        const repoSatCancelacionMotivo = queryRunner.manager.getRepository(SatCancelacionMotivo);
        satCancelacionMotivo = await repoSatCancelacionMotivo.findOneBy({ clave: createCancelacionDto.claveSatCancelacionMotivo })

        if(!satCancelacionMotivo){
          throw new NotFoundException(`El motivo de Cancelación con ID: ${createCancelacionDto.claveSatCancelacionMotivo} no existe`)
        }

      }catch( error ){    
        
        if( error instanceof BadRequestException){       

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        }      

        throw new BadRequestException(`Hubo un error al revisar los catálogos: ${error}`)

      }

      


                                                //throw new Error("*facturasService create PAGO TEST* ANTES DE LLAMAR AL ENDPOINT")



      
      // 09 CANCELACION DE LA FACTURA
      let cancelarFactura: CancelarFactura = null
      
      try{

        cancelarFactura.fechaCancelacion = fechaLocal;
        cancelarFactura.satCancelacionMotivo = satCancelacionMotivo;
        cancelarFactura.idSustitucion = '';
        cancelarFactura.uuidSustitucion = '';

        if( satCancelacionMotivo.clave === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){
          
          //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){
            cancelarFactura.idSustitucion = facturaSustitucionExistente.id;
            cancelarFactura.uuidSustitucion = facturaSustitucionExistente.uuid;
          //}else{
//            cancelarFactura.idSustitucion = complementoPagoSustitucionExistente.id;
            //cancelarFactura.uuidSustitucion = complementoPagoSustitucionExistente.uuid;
          //}

        }        

        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){

          const nuevaCancelacion = repoFactura.create( cancelarFactura )
          await repoFactura.update( facturaExistente.id, nuevaCancelacion )

        //}else{
          
//          const nuevaCancelacion = repoComplementoPago.create( cancelarFactura )
          //await repoComplementoPago.update( complementoPagoExistente.id, nuevaCancelacion )

        //}

      }catch(error){   
        
        if( error instanceof BadRequestException){      

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){       

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al guardar en Cancelacion')
          }

          throw new BadRequestException(error)

        }       

        throw new BadRequestException(`Hubo un error al generar la Cancelación: ${error}`)

      }                        
      
      // 20 FACTURA PAC
      
      let cancelacionPAC: any | null = null;
      let uuidFactura: string = '';
      let motivo: string = '';
      let folioSustitucion: string = '';
      
      try{

        uuidFactura = facturaExistente.uuid;
        motivo = cancelarFactura.satCancelacionMotivo.clave;
        folioSustitucion = cancelarFactura.uuidSustitucion;

        const apiFactura: ApiFactura = {
          url: '',
          clientId: '',
          token: ''
        }
          
        if( this.configService.get<string>('STAGE') === 'dev' ){
          apiFactura.url = this.configService.get<string>('TECH_API_URL_DEV')
          apiFactura.clientId = this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
          apiFactura.token = this.configService.get<string>('TECH_API_TOKEN_DEV')
        }else{
          apiFactura.url = this.configService.get<string>('TECH_API_URL_DEV')
          apiFactura.clientId = this.configService.get<string>('TECH_X_CLIENT_ID_DEV')
          apiFactura.token = this.configService.get<string>('TECH_API_TOKEN_DEV')
        }
       
        //throw new Error("*facturasService create TEST* ANTES DE LLAMAR AL ENDPOINT")        

        const headers = {
          Authorization: `Bearer ${apiFactura.token}`,
          'Content-Type': 'application/json',
          'X-CLIENT-ID': apiFactura.clientId
        }   
        
        const respuesta =  await firstValueFrom( this.httpService.delete( `${apiFactura.url}/v1/facturacion/cancelar/${uuidFactura}?motivo=${motivo}&folio_sustitucion=${folioSustitucion}`, {
          headers
        } ) );
        
        cancelacionPAC = respuesta.data.data;

      }catch(error){ 

        if( error.response?.status == 400){
   
          if( error.response?.data?.status == 'error'){

            throw new BadRequestException( `Hubo un error al generar la Cancelación PAC: ${error.response?.data?.message}` )

          }
        }
        
        if( error instanceof BadRequestException){        

          throw error

        }

        if( error instanceof NotFoundException){       

          throw error

        } 

        throw new BadRequestException(`Hubo un error al generar la Cancelacion PAC: ${error}`)

      }
      
      // 22 FACTURAS UPDATE
      
      try{

        const updateFacturaCancelar: CancelarFacturaAcuse = {
          cancelacionAcuseRespuesta: cancelacionPAC
        }

        //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){

          const updateFacturaAcuse = repoFactura.create( updateFacturaCancelar )
          await repoFactura.update( facturaExistente.id, updateFacturaAcuse )

        //}else{
          
//          const updateFacturaAcuse = repoComplementoPago.create( updateFacturaCancelar )
  //        await repoComplementoPago.update( complementoPagoExistente.id, updateFacturaAcuse )

    //    }

      }catch(error){   
        
        if( error instanceof BadRequestException){       

          throw error

        }

        if( error instanceof NotFoundException){
      
          throw error

        }

        if( error instanceof QueryFailedError){         

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al actualizar la Cancelacion')
          }

          throw new BadRequestException(error)

        }      

        throw new BadRequestException(`Hubo un error al actualizar la Cancelación: ${error}`)

      }

      // 23 ORDEN UPDATE
      try{

        //const utcDate = zonedTimeToUtc(new Date(), user.zonaHoraria.clave);
        const newDateLocal = formatInTimeZone( new Date(), user.zonaHoraria.clave, 'yyyy-MM-dd HH:mm:ss' )       
                                                        
                                                                                const updateOrden = repoOrden.create({
                                                                                  liquidacionFactura: ( imp_saldo_insoluto === 0 ),
                                                                                  fechaLiquidacion: ( imp_saldo_insoluto === 0 ) ? newDateLocal : null
                                                                                })                                                        
                                                                                
                                                                                await repoOrden.update( facturaExistente.orden.id, updateOrden )

      }catch(error){
        
        if( error instanceof BadRequestException){

          throw error

        }

        if( error instanceof NotFoundException){

          throw error

        }

        if( error instanceof QueryFailedError){

          if( error.driverError?.code === '23503'){
            throw new BadRequestException('Error con las claves foráneas al actualizar la Orden')
          }

          throw new BadRequestException(error)

        }        

        throw new BadRequestException(`Hubo un error al actualizar la Orden: ${error}`)

      }
      
      await queryRunner.commitTransaction()

       //if( createCancelacionDto.tipoTimbrado === EnumSatTipoTimbrado.FACTURA ){

          return {
            id: facturaExistente.id
          }

        //}else{
          
          //return {
          //  id: complementoPagoExistente.id
          //}

        //}

    }catch(error){

      await queryRunner.rollbackTransaction();

      const data = error?.response?.data

      if( data ){

        if( data.message ){

          throw new BadRequestException(`Error al cancelar: ${ data.message} `);
        }

      }
      
      if(error instanceof NotFoundException ){
        
        throw error
      }

      if(error instanceof BadRequestException){

        throw error
      }

      throw new InternalServerErrorException(`Ocurrió un error inesperado al intentar Cancelar: ${error}`)      

    }finally{
      await queryRunner.release();
    }  


  }
  */

  async getPaginado( page: number, limit: number, fSearch: string, user: User){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);      
      
      const repoFactura = queryRunner.manager.getRepository(Factura); 
      
      const offset = ( page -1 ) * limit;
      
      const query = repoFactura.createQueryBuilder('factura')
                    .leftJoinAndSelect('factura.satTipoComprobante', 'satTipoComprobante')
                    .leftJoinAndSelect('factura.satFormaPago', 'satFormaPago')
                    .leftJoinAndSelect('factura.satMetodoPago', 'satMetodoPago')
                    .leftJoinAndSelect('factura.receptorSatRegimenFiscal', 'receptorSatRegimenFiscal')
                    .leftJoinAndSelect('factura.orden', 'orden')
                    .leftJoinAndSelect('factura.pagos', 'pagos')
                    .leftJoin('pagos.complemento', 'complemento')
                    .addSelect(['complemento.id', 'complemento.montoTotal', 'complemento.estatus'])
                    .orderBy(`factura.id`, 'DESC')
                    .addOrderBy('pagos.id', 'ASC')
         
                    .skip(offset).take(limit);
     
      const [ data, totalItems ] = await query.getManyAndCount();

      return {
        count: totalItems, 
        pages: Math.ceil(totalItems / limit),
        facturas: data
      }

    }catch(error){
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }      
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener las facturas')

    }finally{
      await queryRunner.release()
    }

  }

  async getFacturasSinLiquidar( receptorRFC: string, user: User){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);      
      
      const repoFactura = queryRunner.manager.getRepository(Factura);     
      
      const query = repoFactura.createQueryBuilder('factura')
                    .innerJoin('factura.orden', 'orden')
                    .where('factura.receptor_rfc = :receptorRFC', {receptorRFC: receptorRFC.toUpperCase()})
                    .andWhere('factura.clave_sat_metodo_pago = :claveSatMetodoPago', {claveSatMetodoPago: EnumSatMetodoPago.PPD_PAGO_EN_PARCIALIDADES_O_DIFERIDO})
                    .andWhere('factura.estatus = :estatusFacturaCFDI', {estatusFacturaCFDI: EnumEstatusCFDI.VIGENTE })
                    .andWhere('orden.liquidacion_factura = :liquidacionFactura', {liquidacionFactura: false})
                    .andWhere('orden.estatus_factura = :estatusFactura', { estatusFactura: EnumEstatusOrdenFactura.TIMBRADA})
                    .orderBy('factura.id', 'DESC')
                    .select([
                      'factura.id',
                      'factura.uuid',
                      'factura.total',
                      'orden.id'
                    ])
                                       
      const data: FacturaSinLiquidarRAW[] = await query.getRawMany();
      
      if(!data){
        throw new NotFoundException(`No se encontraron Facturas Sin Liquidar del Receptor: ${ receptorRFC }`)
      }      

      return data.map( mapFacturaSinLiquidarToResponseDto )

    }catch(error){
    
      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }      
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener las facturas')

    }finally{
      await queryRunner.release()
    }

  }

  async getOne( id: string, user: User, complete: boolean = true ){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoFactura = queryRunner.manager.getRepository(Factura);
                  
      const query = repoFactura.createQueryBuilder('factura')
      if( complete ){
        query.leftJoinAndSelect('factura.receptorSatTipoPersona', 'receptorSatTipoPersona')
          .leftJoinAndSelect('factura.receptorSatRegimenFiscal', 'receptorSatRegimenFiscal')
          .leftJoinAndSelect('factura.receptorSatUsoCFDI', 'receptorSatUsoCFDI')
          .leftJoinAndSelect('factura.emisorSatRegimenFiscal', 'emisorSatRegimenFiscal')
      }
        query.leftJoinAndSelect('factura.satMetodoPago', 'satMetodoPago')
          .leftJoinAndSelect('factura.satFormaPago', 'satFormaPago')
          .leftJoinAndSelect('factura.pagos', 'pagos')
          .andWhere('factura.id = :id', { id })
          .orderBy('pagos.id', 'ASC')
                  
      const data = await query.getOne();

      if( !data ){
        throw new NotFoundException(`La Factura con el ID: ${ id } no fué encontrada`)
      }

      return data;

    }catch(error){

      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener la factura')
    

    }finally{
      await queryRunner.release();
    }

  }

  async getOneMinimal( id: string, user: User ){

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoFactura = queryRunner.manager.getRepository(Factura);
                  
      const query = repoFactura.createQueryBuilder('factura')
          .select([
            'factura.id',
            'factura.uuid',
            'factura.fechaEmision',
            'factura.condicionesPago',
            'factura.lugarExpedicion',
            'factura.observaciones',
            'factura.total',
            'factura.estatus',
            'factura.receptorRFC',
            'factura.receptorRazonSocial',
            'factura.receptorCodigoPostal',
            'factura.receptorEmail',
            'factura.emisorRFC',
            'factura.emisorRazonSocial',
            'factura.emisorCodigoPostal',
          ])
          .leftJoinAndSelect('factura.satMetodoPago', 'satMetodoPago')
          .leftJoinAndSelect('factura.satFormaPago', 'satFormaPago')
          .leftJoinAndSelect('factura.conceptos', 'conceptos')
          .leftJoinAndSelect('factura.receptorSatTipoPersona', 'receptorSatTipoPersona')
          .leftJoinAndSelect('factura.receptorSatRegimenFiscal', 'receptorSatRegimenFiscal')
          .leftJoinAndSelect('factura.receptorSatUsoCFDI', 'receptorSatUsoCFDI')
          .leftJoinAndSelect('factura.emisorSatRegimenFiscal', 'emisorSatRegimenFiscal')
          .leftJoinAndSelect('conceptos.productoServicio', 'productoServicio')
          .leftJoinAndSelect('productoServicio.satProductoServicio', 'satProductoServicio')
          .leftJoinAndSelect('satProductoServicio.satTipoProductoServicio', 'satTipoProductoServicio' )
          .leftJoinAndSelect('satProductoServicio.satClaveUnidad', 'satClaveUnidad' )
          .leftJoinAndSelect('satProductoServicio.satObjetoImpuesto', 'satObjetoImpuesto' )
          .leftJoin('factura.orden', 'orden')
          .addSelect(['orden.id'])

          .andWhere('factura.id = :id', { id })          
          
      const data = await query.getOne();

      if( !data ){
        throw new NotFoundException(`La Factura con el ID: ${ id } no fué encontrada`)
      }

      return data;

    }catch(error){

      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener la factura')
    

    }finally{
      await queryRunner.release();
    }

  }
  
  async getPagos(idFactura: string, user: User): Promise<PagoResponseDto[]> {
    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const repoPago = queryRunner.manager.getRepository(Pago);

      const query = repoPago.createQueryBuilder('pago')
                    .innerJoin('pago.complemento', 'complemento')
                    .innerJoin('complemento.satFormaPago', 'satFormaPago')
                    .where('pago.factura = :idFactura', {idFactura})
                    .orderBy('pago.id', 'ASC')
                    .select([
                      'pago.numeroParcialidad',
                      'pago.saldoAnterior',
                      'pago.monto',
                      'pago.saldoInsoluto',
                      'complemento.fechaPago',
                      'complemento.fechaEmision',
                      'satFormaPago.clave',
                      'satFormaPago.descripcion'
                    ])
      
      const data: PagoRAW[] = await query.getRawMany();

      if(!data){
        throw new NotFoundException(`No se encontraron Complementos de Pago para la Factura con ID: ${idFactura}`)
      }

      return data.map( mapPagoToResponseDto );

    }catch(error){

      console.log("error")
      console.log(error)

      if( error instanceof BadRequestException){
        throw error
      }

      if(error instanceof NotFoundException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al obtener los complementos de pagos')

    }finally{
      await queryRunner.release();
    }

  }
  
  async obtenerFolioFactura( queryRunner: QueryRunner ){

    const repoFactura = queryRunner.manager.getRepository(Factura);
    
    const anio = new Date().getFullYear();

    const factura = await repoFactura.createQueryBuilder('factura').select(['factura.id as id', 'factura.folio as folio']).where('factura.anio = :anio', { anio }).orderBy('factura.id', 'DESC').getRawOne();

    if(!factura) return '000001';

    const lastFolio = (factura as any).folio;

    const numericPart = parseInt(lastFolio);    

    const nextNumber = (numericPart + 1).toString().padStart(6, '0');

    return nextNumber

  }

  validarCliente( cliente: Cliente | null){

    if( !cliente ){
      throw new NotFoundException("No tienes un Cliente asignado a la Orden")
    }

    if( !cliente.codigoPostal || cliente.codigoPostal === '' 
        || !cliente.email || cliente.email === ''
        || !cliente.razonSocial || cliente.razonSocial === ''
        || !cliente.rfc || cliente.rfc === ''
        || !cliente.satRegimenFiscal
        || !cliente.satUsoCFDI        
    ){
      throw new NotFoundException("Debes capturar previamente toda la información fiscal del Cliente")
    }

  }
  
  validarEmpresa( empresa: Empresa | null){

    if( !empresa ){
      throw new NotFoundException("No tienes una Empresa asignada a la Orden")
    }

    if( !empresa.codigoPostal || empresa.codigoPostal == '' 
        || !empresa.email || empresa.email == ''
        || !empresa.razonSocial || empresa.razonSocial === ''
        || !empresa.rfc || empresa.rfc === ''
        || !empresa.satRegimenFiscal
        || !empresa.satUsoCFDI
    ){
      throw new NotFoundException("Debes capturar previamente toda la información fiscal de la Empresa")
    }

  }

  async calcularImpuestosParaFront( calcularImpuestosDto: CalcularImpuestosDto, user: User  ){ 

    
    const conceptos = calcularImpuestosDto.conceptos.map( dtoConcepto => {

      const ordenConcepto = new OrdenConcepto();
      
      /* TODO */

      ordenConcepto.cantidad = dtoConcepto.cantidad;
      //ordenConcepto.valorUnitario = Number( dtoConcepto.valorUnitario );
      //ordenConcepto.costoUnitario = Number( 0 );
      //ordenConcepto.productoServicio = { id: dtoConcepto.id_producto_servicio } as ProductoServicio;

      return ordenConcepto;

    })    
  
    const receptorSatTipoPersona = calcularImpuestosDto.receptorSatTipoPersona;

    const schema = user.compania.schema;

    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();    

    try{

      await queryRunner.query(`SET search_path TO ${schema}, public`)

      const repoEmisor = queryRunner.manager.getRepository(Emisor);

      const emisor = await repoEmisor.findOne({ 
        //where: { isActive: true, usuario: { id: user.id } },
        where: { isActive: true },
        relations: ['satRegimenFiscal']
      })

      if( !emisor ){        
        throw new NotFoundException(`No hay un Emisor con estatus activo`);        
      }

      return await this.calcularImpuestos( receptorSatTipoPersona, conceptos, emisor, user )


    }catch(error){
      throw new InternalServerErrorException(`Error al calcular impuestos: ${error} `);
    }
    finally{
      await queryRunner.release();
    }
  }
  
  private async calcularImpuestos( receptorSatTipoPersona: EnumSatTipoPersona, conceptos: OrdenConcepto[], emisor: Emisor, user: User ){    

    if( !emisor.satRegimenFiscal ){
      throw new BadRequestException(`El Emisor no tiene Regimen Fiscal`)
    }

    const companiaSatTipoPersona = user.compania.satTipoPersona.tipo
    
    const impuestosPorcentajes = await this.satImpuestoPorcentajeRepository.find({
      relations: ['satImpuesto']
    })

    const impuesto_iva = impuestosPorcentajes.find( i => i.clave === EnumImpuestosPorcentajes.IVA_RATE )
    const impuesto_isr_retention_pf_actividad_empresarial = impuestosPorcentajes.find( i => i.clave === EnumImpuestosPorcentajes.ISR_RETENTION_PF_ACTIVIDAD_EMPRESARIAL )
    const impuesto_isr_retention_pf_resico = impuestosPorcentajes.find( i => i.clave === EnumImpuestosPorcentajes.ISR_RETENTION_PF_RESICO )
    const impuesto_iva_retention_rate = impuestosPorcentajes.find( i => i.clave === EnumImpuestosPorcentajes.IVA_RETENTION_RATE )

    let importe_subtotal = 0;
    let importe_ivaTrasladado = 0;
    let importe_isrRetenido = 0;
    let importe_ivaRetenido = 0;    

    conceptos.forEach( concepto => {
      importe_subtotal += concepto.cantidad * Number( concepto.precioVentaSnapshot );
    })

    importe_ivaTrasladado = importe_subtotal * ( Number( impuesto_iva?.tasa ?? 0 ) )

    // Retención de ISR
    if (
      companiaSatTipoPersona === EnumSatTipoPersona.FISICA &&
       receptorSatTipoPersona === EnumSatTipoPersona.MORAL
    ) {       

      if ( emisor.satRegimenFiscal.clave === EnumSatRegimenFiscal.RESICO) {
        importe_isrRetenido = importe_subtotal * ( Number( impuesto_isr_retention_pf_resico?.tasa || 0 ) );
      } else if (
        emisor?.satRegimenFiscal.clave === EnumSatRegimenFiscal.ACTIVIDAD_EMPRESARIAL
      ) {
        importe_isrRetenido = importe_subtotal * ( Number( impuesto_isr_retention_pf_actividad_empresarial?.tasa || 0 ) );
      }
    }

    // Retención de IVA
    if (
      companiaSatTipoPersona === EnumSatTipoPersona.FISICA &&
      receptorSatTipoPersona === EnumSatTipoPersona.MORAL
    ) {
      importe_ivaRetenido = importe_subtotal * ( Number( impuesto_iva_retention_rate?.tasa || 0 ) ); // Aplica 2/3 del IVA (10.66%)
    }

    // El total es el subtotal + IVA trasladado - ISR retenido - IVA retenido
    const importe_total = importe_subtotal + importe_ivaTrasladado - importe_isrRetenido - importe_ivaRetenido;

    return {
      subtotal: Number( importe_subtotal.toFixed(2) ),
      ivaTrasladado: Number( importe_ivaTrasladado.toFixed(2) ),
      isrRetenido: Number( importe_isrRetenido.toFixed(2) ),
      ivaRetenido: Number( importe_ivaRetenido.toFixed(2) ),
      total: Number( importe_total.toFixed(2) ),
    }

    /*this.importes.set({
      subtotal: Number( importe_subtotal.toFixed(2) ),
      ivaTrasladado: Number( importe_ivaTrasladado.toFixed(2) ),
      isrRetenido: Number( importe_isrRetenido.toFixed(2) ),
      ivaRetenido: Number( importe_ivaRetenido.toFixed(2) ),
      total: Number( importe_total.toFixed(2) ),
    })*/

  }

  private async _calcularConceptosImpuestosFacturaNew( receptorSatTipoPersona: EnumSatTipoPersona, conceptos: OrdenConcepto[], emisor: Emisor, user: User ){

    try{

      if( !emisor.satRegimenFiscal ){
        throw new BadRequestException(`El Emisor no cuenta con Regimen Fiscal`)
      }

      let totalImpuestosTrasladados = 0;
      let totalImpuestosRetenidos = 0;

      let trasladosTotalBase = 0;
      let trasladosTotalImporte = 0;

      let retenidosTotalImporteISR = 0;
      let retenidosTotalImporteIVA = 0;
      let retenidosTasaCuotaISR = "";
      let retenidosTasaCuotaIVA = "";

      const companiaSatTipoPersona = user.compania.satTipoPersona.tipo as EnumSatTipoPersona;
      
      const impuestosPorcentajes = await this.satImpuestoPorcentajeRepository.find({
        relations: ['satImpuesto']
      })

      const impuesto_iva = impuestosPorcentajes.find( i => i.clave === EnumImpuestosPorcentajes.IVA_RATE )
      const impuesto_isr_retention_pf_actividad_empresarial = impuestosPorcentajes.find( i => i.clave === EnumImpuestosPorcentajes.ISR_RETENTION_PF_ACTIVIDAD_EMPRESARIAL )
      const impuesto_isr_retention_pf_resico = impuestosPorcentajes.find( i => i.clave === EnumImpuestosPorcentajes.ISR_RETENTION_PF_RESICO )
      const impuesto_iva_retention_rate = impuestosPorcentajes.find( i => i.clave === EnumImpuestosPorcentajes.IVA_RETENTION_RATE )

      let importe_subtotal = 0;
      let importe_ivaTrasladado = 0;
      let importe_isrRetenido = 0;
      let importe_ivaRetenido = 0;    

      const conceptosFactura:any = []

      conceptos.forEach( concepto => {

        const conceptoFactura: any = {}

        /* TODO */
        /*
        conceptoFactura.clave_prod_serv = concepto.productoServicio.satProductoServicio.clave;
        conceptoFactura.descripcion = concepto.productoServicio.descripcion;
        conceptoFactura.clave_unidad = concepto.productoServicio.satProductoServicio.satClaveUnidad.clave;
        conceptoFactura.unidad = concepto.productoServicio.satProductoServicio.satClaveUnidad.nombre.toUpperCase();
        conceptoFactura.valor_unitario = Number( Number( concepto.valorUnitario ).toFixed(2) );
        conceptoFactura.cantidad = concepto.cantidad;
        conceptoFactura.subtotal = concepto.cantidad * Number( concepto.valorUnitario );
        conceptoFactura.descuento = 0;
        conceptoFactura.importe = conceptoFactura.subtotal - conceptoFactura.descuento;
        conceptoFactura.productoServicio = concepto.productoServicio.id;
      
        conceptoFactura.objeto_impuesto = concepto.productoServicio.satProductoServicio.satObjetoImpuesto.clave;
        */

        const traslados = this.obtenerIvaTraslado( conceptoFactura.subtotal, Number( impuesto_iva.tasa ) )

        trasladosTotalBase += Number( traslados[0].base );
        trasladosTotalImporte += Number( traslados[0].importe );

        const retenciones = this.obtenerIsrIvaRetencion( conceptoFactura.subtotal, 
                              companiaSatTipoPersona, receptorSatTipoPersona, emisor,
                              impuesto_isr_retention_pf_actividad_empresarial, impuesto_isr_retention_pf_resico, impuesto_iva_retention_rate )

        retenidosTotalImporteISR += Number( retenciones.find( r => r.impuesto === '001' ).importe );
        retenidosTotalImporteIVA += Number( retenciones.find( r => r.impuesto === '002' ).importe );

        retenidosTasaCuotaISR = retenciones.find( r => r.impuesto === '001' ).tasa_cuota;
        retenidosTasaCuotaIVA = retenciones.find( r => r.impuesto === '002' ).tasa_cuota;

        conceptoFactura.impuestos = {
          traslados: traslados,
          retenciones: retenciones
        }

        conceptosFactura.push( conceptoFactura );

        importe_subtotal += concepto.cantidad * Number( concepto.precioVentaSnapshot );
        importe_ivaTrasladado += Number( traslados[0].importe );
        importe_isrRetenido += Number( retenciones.find( r => r.impuesto === '001' ).importe );
        importe_ivaRetenido += Number( retenciones.find( r => r.impuesto === '002' ).importe );
      })

      const impuestosFactura = {
        total_impuestos_trasladados: trasladosTotalImporte.toFixed(2),                
        total_impuestos_retenidos: (retenidosTotalImporteISR + retenidosTotalImporteIVA).toFixed(2),
        traslados: [
          {
            base: trasladosTotalBase.toFixed(2),
            impuesto: '002', // IVA
            tipo_factor: 'Tasa',
            //"0.160000",
            //tasa_cuota: Number( impuesto_iva.tasa ),
            tasa_cuota: impuesto_iva.tasa.toString().padEnd(8,'0'),
            importe: trasladosTotalImporte.toFixed(2)
          }
        ],
        //TODO
        retenciones: [
          {
            base: trasladosTotalBase.toFixed(2),
            impuesto: '001', // ISR
            tipo_factor: 'Tasa',
            //tasa_cuota: retenidosTasaCuotaISR,
            tasa_cuota: retenidosTasaCuotaISR.toString().padEnd(8,'0'),
            importe: retenidosTotalImporteISR.toFixed(2)
          },
          {
            base: trasladosTotalBase.toFixed(2),
            impuesto: '002', // IVA
            tipo_factor: 'Tasa',
            //tasa_cuota: retenidosTasaCuotaIVA,
            tasa_cuota: retenidosTasaCuotaIVA.toString().padEnd(8,'0'),
            importe: retenidosTotalImporteIVA.toFixed(2)
          }
        ]
      }

      // El total es el subtotal + IVA trasladado - ISR retenido - IVA retenido
      const importe_total = importe_subtotal + importe_ivaTrasladado - importe_isrRetenido - importe_ivaRetenido;

      const totalesFactura = {
        subtotal: Number( importe_subtotal.toFixed(2) ),
        ivaTrasladado: Number( importe_ivaTrasladado.toFixed(2) ),
        isrRetenido: Number( importe_isrRetenido.toFixed(2) ),
        ivaRetenido: Number( importe_ivaRetenido.toFixed(2) ),
        total: Number( importe_total.toFixed(2) ),
      }

      return { totalesFactura, conceptosFactura, impuestosFactura } ;

    }catch(error){
      
      if( error instanceof BadRequestException){       

        throw error

      }

      if( error instanceof NotFoundException){       

        throw error

      } 

      throw new BadRequestException(`Hubo un error al calcular los impuestos: ${error}`)

    }    

  }  

  private obtenerIvaTraslado( base: string, tasa_cuota: number ){

    return [
      {
        base: base,
        impuesto: '002', // IVA
        tipo_factor: 'Tasa',
        tasa_cuota: tasa_cuota.toString().padEnd(8,'0'),
        //tasa_cuota: tasa_cuota,
        importe: ( Number( base ) * tasa_cuota ).toFixed(2)
      }
    ]    

  }

  private obtenerIsrIvaRetencion( base: string, companiaSatTipoPersona: EnumSatTipoPersona, receptorSatTipoPersona: EnumSatTipoPersona, emisor: Emisor,
          impuesto_isr_retention_pf_actividad_empresarial: SatImpuestoPorcentaje, impuesto_isr_retention_pf_resico: SatImpuestoPorcentaje, impuesto_iva_retention_rate: SatImpuestoPorcentaje
  ){    
    
    const retencionISR = {
      base: base,
      impuesto: '001', // ISR
      tipo_factor: 'Tasa',
      tasa_cuota: "0.000000",
      importe: "0"
    }

    // Retención de ISR
    if (
      companiaSatTipoPersona === EnumSatTipoPersona.FISICA &&
       receptorSatTipoPersona === EnumSatTipoPersona.MORAL
    ) {

      if ( emisor.satRegimenFiscal.clave === EnumSatRegimenFiscal.RESICO) {

        retencionISR.importe = ( Number( base ) * ( Number( impuesto_isr_retention_pf_resico?.tasa || 0 ) ) ).toFixed(2);
        //importe_isrRetenido = Number( base ) * ( Number( impuesto_isr_retention_pf_resico?.tasa || 0 ) );
        retencionISR.tasa_cuota =  impuesto_isr_retention_pf_resico?.tasa.padEnd(8,'0');

      } else if (
        emisor?.satRegimenFiscal.clave === EnumSatRegimenFiscal.ACTIVIDAD_EMPRESARIAL
      ) {
        
        retencionISR.importe = ( Number( base ) * ( Number( impuesto_isr_retention_pf_actividad_empresarial?.tasa || 0 ) ) ).toFixed(2);
        retencionISR.tasa_cuota = impuesto_isr_retention_pf_actividad_empresarial?.tasa.padEnd(8,'0') ;
        //importe_isrRetenido = Number( base ) * ( Number( impuesto_isr_retention_pf_actividad_empresarial?.tasa || 0 ) );
      }
    }
    
    const retencionIVA = {
      base: base,
      impuesto: '002', // ISR
      tipo_factor: 'Tasa',
      tasa_cuota: "0.000000",
      importe: "0"
    }
    
    // Retención de IVA
    if (
      companiaSatTipoPersona === EnumSatTipoPersona.FISICA &&
      receptorSatTipoPersona === EnumSatTipoPersona.MORAL
    ) {    
      retencionIVA.importe = ( Number( base ) * ( Number( impuesto_iva_retention_rate?.tasa || 0 ) ) ).toFixed(2); // Aplica 2/3 del IVA (10.66%)
      retencionIVA.tasa_cuota = impuesto_iva_retention_rate?.tasa.padEnd(8,'0');
    }

    return [
      retencionISR,
      retencionIVA
    ]
  }
  
}