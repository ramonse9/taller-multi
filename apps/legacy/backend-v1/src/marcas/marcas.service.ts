import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marca } from './entities/marca.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class MarcasService {

  constructor(
    @InjectRepository(Marca) private readonly marcaRepository: Repository<Marca>
  ){    
  }

  async generarIdMarca(): Promise<string>{
    
    const ultimaMarca = await this.marcaRepository
      .createQueryBuilder('marca')
      .orderBy('marca.id','DESC')
      .getOne();

    let nuevoId = 'mar000001'

    if(ultimaMarca){
      const ultimoId = ultimaMarca.id
      const numero = parseInt( ultimoId.slice(3) )
      const siguienteNumero = (numero + 1).toString().padStart(6 , '0')
      nuevoId = `mar${siguienteNumero}`
    }

    return nuevoId
  }
  
  async create(createMarcaDto: CreateMarcaDto, user: User) {

    try{

      const marca = await this.findOneByName( createMarcaDto.nombre )

      if( marca ){
        throw new BadRequestException(`No se puede guardar esta marca por que ya está registrada con el Id: ${ marca.id.toUpperCase() } `)
      }
      
      const nuevoId = await this.generarIdMarca()    
      
      const nuevaMarca = this.marcaRepository.create({
        id: nuevoId,
        ...createMarcaDto,
        createdAtUser: user,
        updatedAtUser: user
      })

      return this.marcaRepository.save( nuevaMarca )

    }catch(error){

      if( error instanceof NotFoundException ){
        throw error
      }

      if( error instanceof BadRequestException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al crear la Marca')
    }
    
  }

  async findAll(){    
    const [data, totalItems ] = await this.marcaRepository.findAndCount({
      relations: {
        modelos: true
      },
      order: {
        nombre: 'ASC'
      }
    })

    return {
      count: totalItems,
      marcas: data      
    }

  }

  async getPaginado(
    page: number, 
    limit: number, 
    fSearch: string
  ) {

    const query = this.marcaRepository.createQueryBuilder('marca')    

    if(fSearch !== ''){

      const search = `%${fSearch.trim().toLowerCase()}%`

      query.andWhere(
        `(
        marca.id LIKE :search OR
        marca.nombre LIKE :search
        )`,
        {
          search: search
        }
      )
    }

    query.orderBy(`marca.id`, 'DESC')

    const offset = ( page - 1 ) * limit;
    query.skip(offset).take(limit)

    const [ data, totalItems ] = await query.getManyAndCount()
   
    return {
      count: totalItems,
      pages: Math.ceil(totalItems / limit),
      marcas: data
    }
      
  }  

  async findOne(id: string) {
    const marca = await this.marcaRepository.findOneBy({id: id.toLowerCase()})

    if(!marca){
      throw new NotFoundException(`La marca con el Id ${ id } no fué encontrada`)
    }
    return marca;
  }

  async findOneByName(nombre: string){
    const marca = await this.marcaRepository.findOneBy({nombre: nombre.toLowerCase()})

    return marca
  }

  async update(id: string, updateMarcaDto: UpdateMarcaDto, user: User) {

    try{

      const marca = await this.findOne(id)

      marca.updatedAtUser = user

      Object.assign( marca, updateMarcaDto)

      return await this.marcaRepository.save(marca)

    }catch(error){   
      
      if( error instanceof NotFoundException ){
        throw error
      }

      if( error instanceof BadRequestException){
        throw error
      }
      
      throw new InternalServerErrorException('Ocurrió un error inesperado al actualizar la Marca')
    }

  }

  remove(id: number) {
    return `This action removes a #${id} marca`;
  }
}
