import dataSourceMigrations from "../../config/data-source-migrations";

const runUpdateSchema = async () => {
    console.log("Actualizando schema...")

    const dataSource = await dataSourceMigrations.initialize();

    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const schemas = ['test']    

    try{


        for( const schema of schemas ){
            
            await queryRunner.query(`ALTER TABLE "${schema}"."clientes" ADD COLUMN IF NOT EXISTS "razonSocial" character varying, ADD COLUMN IF NOT EXISTS "rfc" character varying, ADD COLUMN IF NOT EXISTS "usoCfdi" character varying, ADD COLUMN IF NOT EXISTS "regimenFiscal" character varying;`);           
                
            await queryRunner.commitTransaction();

        }


    }catch(err){

        await queryRunner.rollbackTransaction();

    }finally{
        await queryRunner.release();
        await dataSource.destroy();
    }

}


runUpdateSchema()