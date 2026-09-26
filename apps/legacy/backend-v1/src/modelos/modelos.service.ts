import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modelo } from './entities/modelo.entity';
import { Marca } from '../marcas/entities/marca.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ModelosService {
  
  constructor(
    @InjectRepository(Modelo) private readonly modeloRepository: Repository<Modelo>,
    @InjectRepository(Marca) private readonly marcaRepository: Repository<Marca>
  ){}
  
  async generarIdModelo(): Promise<string>{
    
    const ultimoModelo = await this.modeloRepository
      .createQueryBuilder('modelo')
      .orderBy('modelo.id','DESC')
      .getOne();

    let nuevoId = 'mod000001'

    if(ultimoModelo){
      const ultimoId = ultimoModelo.id
      const numero = parseInt( ultimoId.slice(3) )
      const siguienteNumero = (numero + 1).toString().padStart(6 , '0')
      nuevoId = `mod${siguienteNumero}`
    }

    return nuevoId
  }
    
  async create(createModeloDto: CreateModeloDto, user: User) {

    try{

      const { id_marca, ...nuevoCreateModeloDto } = createModeloDto;      

      const marca = await this.marcaRepository.findOneBy({id: id_marca})

      if(!marca){
        throw new NotFoundException(`No es posible guardar este modelo por que la Marca con el Id: ${ id_marca } no existe`)
      }

      const modelo = await this.findOneByName( nuevoCreateModeloDto.nombre )
      
      if( modelo ){
        throw new BadRequestException(`No se puede guardar este modelo por que ya está registrado con el Id: ${ modelo.id.toUpperCase() } `)
      }
                
      const nuevoId = await this.generarIdModelo()
      
      const nuevoModelo = this.modeloRepository.create({
        id: nuevoId,
        ...createModeloDto,
        marca: marca,
        createdAtUser: user,
        updatedAtUser: user
      })      

      return await this.modeloRepository.save( nuevoModelo )

    }catch(error){

      if( error instanceof NotFoundException ){
        throw error
      }

      if( error instanceof BadRequestException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al crear el Modelo')
    }

  }  

  async getPaginado( page: number, limit: number, fSearch: string ) {    

    const query = this.modeloRepository.createQueryBuilder('modelo')    

    if(fSearch !== ''){

      const search = `%${fSearch.trim().toLowerCase()}%`

      query.andWhere(
        `(
        modelo.id LIKE :search OR
        modelo.nombre LIKE :search OR
        marca.nombre LIKE :search
        )`,
        {
          search: search
        }
      )
    }

    query.leftJoinAndSelect('modelo.marca', 'marca')

    query.orderBy(`modelo.id`, 'DESC')

    const offset = ( page - 1 ) * limit;
    query.skip(offset).take(limit)

    const [ data, totalItems ] = await query.getManyAndCount()

    return {
      count: totalItems,
      pages: Math.ceil( totalItems / limit ),
      modelos: data
    }    
  }

  async getOne(id: string) {

    const query = this.modeloRepository.createQueryBuilder('modelo')
    
    query.andWhere('modelo.id LIKE :id', { id: `${ id.toLowerCase() }`})

    query.leftJoinAndSelect('modelo.marca', 'marca')

    const data = await query.getOne()

    if(!data){
      throw new NotFoundException(`El modelo con el Id ${ id } no fué encontrado`)
    }

    return data
  }

  private async findOne(id: string) {
    
    const modelo = await this.modeloRepository.findOneBy({id: id.toLowerCase()})
    
    if(!modelo){
      throw new NotFoundException(`El modelo con el Id ${ id } no fué encontrado`)
    }
    return modelo;
  }

  async findOneByName(nombre: string){
    const modelo = await this.modeloRepository.findOneBy({nombre: nombre.toLowerCase()})

    return modelo;
  }

  async update(id: string, updateModeloDto: UpdateModeloDto, user: User) {

    try{
    
      const modelo = await this.findOne(id)

      //Object.assign( modelo, updateModeloDto);
      modelo.nombre = updateModeloDto.nombre;
      modelo.updatedAtUser = user;

      return await this.modeloRepository.save(modelo);

    }catch(error){      
    
      if( error instanceof BadRequestException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al actualizar el Modelo')
    }
  }

  remove(id: number) {
    return `This action removes a #${id} modelo`;
  }
}
