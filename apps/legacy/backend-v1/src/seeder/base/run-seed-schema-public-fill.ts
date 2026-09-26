import dataSourceMigrationsPublic from '../../config/data-source-migrations-public';
import { schemaPublicFill } from './schemaPublicFill';
//import dataSourceMigration from "../../config/data-source-migrations";



/**
 * Verifica si un nombre de schema es válido para PostgreSQL.
 * Reglas comunes:
 *  - Comienza con una letra o guion bajo
 *  - Solo contiene letras, números y guiones bajos
 */
function esNombreDeSchemaValido(schemaName: string): boolean {
  const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return regex.test(schemaName);
}

function agregarGuionBajoAlPrimerCaracter(schemaName: string){
    return schemaName.charAt(0) === '-' ? schemaName : `'_'${schemaName}`
}

const runSeedSchemaPublicFill = async () => {

    console.log("Reiniciando el schema 'public'...")

    const dataSource = await dataSourceMigrationsPublic.initialize()

    const queryRunner = dataSource.createQueryRunner()

    await queryRunner.connect()
    await queryRunner.startTransaction()

    try{
        console.log("Running run seed shema...")
        
        await new schemaPublicFill().run(queryRunner)

        await queryRunner.commitTransaction();
        console.log("Seeds completed successfully")

        console.log("Schema iniciado")

    }catch(err){
        console.log("Error running seeds: ", err);
        await queryRunner.rollbackTransaction();
        throw err;
    }finally{
        await queryRunner.release();
        await dataSource.destroy()
    }
}

runSeedSchemaPublicFill();
