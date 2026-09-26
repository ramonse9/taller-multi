import { EnumRole } from './../../commom/enums/general.enum';
import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Compania } from "../../companias/entities/compania.entity";
import { ZonaHoraria } from "./zona-horaria.entity";


@Entity({name:'pub_users', schema:'public'})
export class User{

    @PrimaryColumn()
    id: string;

    @Column('text', { unique: true})
    email: string;

    @Column('text', { select: false})
    password: string;

    @Column('text', {name: 'full_name'})
    fullName: string;

    @Column('bool', {default: true, name: 'is_active'})
    isActive: boolean;

    //@Column('text', { array: true, default: ['user'] })
    //roles: string[];

    @Column({ 
        type: 'enum',  
        enum: EnumRole,
        default: EnumRole.CAPTURISTA
    })
    role: EnumRole;

    @ManyToOne( () => Compania, { eager: true})    
    @JoinColumn({name: 'id_compania'})
    compania: Compania

    @ManyToOne( () => ZonaHoraria, { eager: true})
    @JoinColumn({name: 'clave_zona_horaria'})
    zonaHoraria: ZonaHoraria;

    @Column({default: 0,})
    failedLoginAttempts: number;

    @Column({type: 'timestamp',nullable: true,})
    lockedUntil?: Date;

    @Column({ nullable: true, select: false})
    refreshTokenHash?: string;

    @CreateDateColumn({type: 'timestamptz'})        
    createdAt: Date;
            
    @CreateDateColumn({type: 'timestamptz'})        
    updatedAt: Date;
    
    @BeforeInsert()
    checkFieldsBeforeInsert(){
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate(){
        this.checkFieldsBeforeInsert();
    }

}
