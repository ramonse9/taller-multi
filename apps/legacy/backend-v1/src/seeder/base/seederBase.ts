import { QueryRunner } from 'typeorm';

export abstract class SeederBase {
  abstract name: string;

  abstract up(queryRunner: QueryRunner): Promise<void>;

  async run(queryRunner: QueryRunner): Promise<void> {
    console.log(`Running seeder: ${this.name}`);
    await this.up(queryRunner);
    console.log(`Seeder ${this.name} executed successfully.`);
  }
}