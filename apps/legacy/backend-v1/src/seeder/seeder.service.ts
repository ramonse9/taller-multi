import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Marca } from '../marcas/entities/marca.entity';
import { Modelo } from '../modelos/entities/modelo.entity';
import { User } from '../auth/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { TenantService } from '../tenant/tenant.service';
import { marcasSeed } from './data/marcasSeed';
import { usersSeed } from './data/usersSeed';
import { modelosSeed } from './data/modelosSeed';

@Injectable()
export class SeederService implements OnModuleInit {

    constructor(         
        private readonly tenantService: TenantService,
        private readonly configService: ConfigService,
        private dataSource: DataSource
    ){}

    async onModuleInit(){

        const shouldReset = this.configService.get<string>('DB_RESET') == 'true';        

        if(shouldReset){

            console.log("Reiniciando datos...")

            //const queryBuilderUser = await this.userRepository.createQueryBuilder();
            //await queryBuilderUser.delete().where({}).execute()            
            
            //await this.dataSource.dropDatabase();
            //await this.dataSource.query(`DROP SCHEMA public RESTRICT;`);
            //await this.dataSource.query(`CREATE SCHEMA public;`);
            //await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
            
            //await this.dataSource.synchronize();
            //await this.dataSource.runMigrations();
            
            await this.seed()

            console.log("Base de Datos inicializada completamente")

        }else{

            console.log("DB_RESET es false. Saltando reinicio de base de datos.")

        }

    } 

    async seed(){

        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try{    
            
            const userRepo = queryRunner.manager.getRepository(User);
            const marcaRepo = queryRunner.manager.getRepository(Marca);
            const modeloRepo = queryRunner.manager.getRepository(Modelo);
            
            //USERS
            let ultimoIdUser = 0

            const usersConIds = usersSeed.map( (user, index) => {

                const nuevoId = (ultimoIdUser + index + 1).toString().padStart(6,'0');
                const pass = bcrypt.hashSync( user.password, 10 );                
                
                return { id: `usu${nuevoId}`, ...user, password: pass,}
            })

            
            //@follow-up
            //await userRepo.save(usersConIds);

            const userSeed = usersConIds[0]

            //MARCAS
            let ultimoIdMarca = 0
            
            const marcasConIds = marcasSeed.map( (marca, index) => {
                const nuevoId = (ultimoIdMarca + index + 1).toString().padStart(6,'0');
                return { id: `mar${nuevoId}`, ...marca, createdAtUser: userSeed, updatedAtUser: userSeed }
            })

            
            //@follow-up
            //await marcaRepo.save(marcasConIds);

            //MODELOS
            let ultimoIdModelo = 0
            const modelosConIds = modelosSeed.map( (modelo, index) => {
                const nuevoId = (ultimoIdModelo + index + 1).toString().padStart(6,'0');
                const marca = marcasConIds.find( marca => marca.nombre == modelo.marca )
                return { id: `mod${nuevoId}`, nombre: modelo.nombre, marca: { id: marca.id },  createdAtUser: userSeed, updatedAtUser: userSeed }
            })

            
            
            //@follow-up
            //await modeloRepo.save(modelosConIds);

            //const companiasUnicas = [...new Set(usersSeed.map(u => u.compania))];       
            
            /*for( const compania of companiasUnicas){
                
                const schemaName = this.tenantService.schemaName( compania );

                await queryRunner.query(`SET search_path TO ${schemaName}, public`);
                
                const clienteRepo = queryRunner.manager.getRepository(Cliente);
                const vehiculoRepo = queryRunner.manager.getRepository(Vehiculo);

                let ultimoClienteId = 0

                const clientesConIds = clientesSeed.map( ( cliente, index ) => {
                    const nuevoId = (ultimoClienteId + index + 1).toString().padStart(6, '0');
                    return { id: `cli${nuevoId}`, ...cliente, createdAtUser: userSeed, updatedAtUser: userSeed }
                })

                //@follow-up
                //await clienteRepo.save(clientesConIds);

                let ultimoVehiculoId = 0

                const vehiculosConIds = vehiculosSeed.map( (vehiculo, index) => {
                    const nuevoId = (ultimoVehiculoId + index + 1).toString().padStart(6,'0')
                    return { id: `veh${nuevoId}`, ...vehiculo, createdAtUser: userSeed, updatedAtUser: userSeed }
                })

                //@follow-up
                //await vehiculoRepo.save(vehiculosConIds);                

            }*/

            await queryRunner.commitTransaction();
            console.log("Seeder completed successfully");

        }catch(err){
            console.log("Error running seed: ", err)
            await queryRunner.rollbackTransaction();
        }finally{
            await queryRunner.release()
            await this.dataSource.destroy()
        }

    }    
    
}  
