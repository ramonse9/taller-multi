import { Repository } from "typeorm";

export async function generarEntityId<T>(
    repo: Repository<T>,
    prefix: string
): Promise<string>{

    const last = await repo
            .createQueryBuilder('entity')
            .select('entity.id')
            .orderBy('entity.id', 'DESC')
            .getOne();

    if(!last) return `${prefix}000001`;

    const lastId = (last as any).id;
    const numericPart = parseInt(lastId.slice(prefix.length), 10);
    const nextNumber = (numericPart + 1).toString().padStart(6, '0');

    return `${prefix}${nextNumber}`;
}