import { JoinColumn, ManyToOne } from "typeorm";

export abstract class AuditableEntity{
    @ManyToOne(() => require('./user.entity').User)
    @JoinColumn({name: 'createdAtUser'})
    createdAtUser: import('./user.entity').User;

    @ManyToOne(() => require('./user.entity').User)
    @JoinColumn({name: 'updatedAtUser'})
    updatedAtUser: import('./user.entity').User
   
}

//@ManyToOne( () => User)
//@JoinColumn({name: 'createdAtUser'})
//createdAtUser;

//@ManyToOne( () => User)
//@JoinColumn({name: 'updatedAtUser'})
//updatedAtUser: User


