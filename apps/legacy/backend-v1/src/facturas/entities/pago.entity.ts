import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Factura } from './factura.entity';
import { Complemento } from './complemento.entity';

@Entity('pri_pagos')
export class Pago{
    
    @PrimaryGeneratedColumn()
    id: number

    @Column({name: 'numero_parcialidad'})
    numeroParcialidad: number;
    
    @Column({type: 'decimal', name: 'saldo_anterior'})
    saldoAnterior: number;

    @Column({type: 'decimal'})
    monto: number;

    @Column({type:'decimal', name: 'saldo_insoluto'})
    saldoInsoluto: number;
        
    @ManyToOne( () => Factura, (factura) => factura.pagos, { onDelete: 'RESTRICT'})
    @JoinColumn({name: 'id_factura'})
    factura: Factura;

    @ManyToOne( () => Complemento, complemento => complemento.facturasRelacionadas, { onDelete: 'CASCADE'}  )
    @JoinColumn({name: 'id_complemento'})
    complemento: Complemento;
    
    @CreateDateColumn({type: 'timestamptz'})
    createdAt: Date;
    
}