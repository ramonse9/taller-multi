import { ApiProperty } from "@nestjs/swagger";

export class ProveedorResponseDto{   
    
    @ApiProperty({example: 'Auto Zone', description: 'Nombre del Proveedor'})
    nombre: string;

    @ApiProperty({example: 'ATZO12345678', description: 'RFC del Proveedor'})
    rfc?: string;

    @ApiProperty({example: '6677112233', description: 'Telefono'})
    telefono?: string;

    @ApiProperty({example: 'autoone@autoone.com', description: 'Email'})
    email?: string;

    @ApiProperty({example: 'Blvd. Zapata #2345', description: 'Dirección'})
    direccion?: string;

    @ApiProperty({example: 'Alberto López', description: 'Contado del Proveedor'})
    contacto?: string;
    
}