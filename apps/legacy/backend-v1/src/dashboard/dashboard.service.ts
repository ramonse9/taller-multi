import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Orden } from '../ordenes/entities/orden.entity';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Marca } from '../marcas/entities/marca.entity';
import { Modelo } from '../modelos/entities/modelo.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class DashboardService {

  constructor(    
    private readonly dataSource: DataSource
  ){}

  async getCountAll( user: User ){

    const schema = user.compania.schema;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try{
      
      await queryRunner.query(`SET search_path TO ${schema}, public`);

      const manager = queryRunner.manager;

      /*
      const [ ordenes, vehiculos, clientes, empresas, marcas, modelos ] = await Promise.all([
        manager.count(Orden),
        manager.count(Vehiculo),
        manager.count(Cliente),
        manager.count(Empresa),
        manager.count(Marca),
        manager.count(Modelo)
      ])*/

      const ordenes = await manager.count(Orden);
      const vehiculos = await manager.count(Vehiculo);
      const clientes = await manager.count(Cliente);
      const empresas = await manager.count(Empresa);
      const marcas = await manager.count(Marca);
      const modelos = await manager.count(Modelo);

      return {
        ordenes,
        vehiculos, 
        clientes,
        empresas, 
        marcas,
        modelos
      }

    } catch (error) {
      // ¡Importante! Si hay un error, hay que manejarlo/relanzarlo
      throw error;

    }finally{

      await queryRunner.release()

    }
    
  }  
}
