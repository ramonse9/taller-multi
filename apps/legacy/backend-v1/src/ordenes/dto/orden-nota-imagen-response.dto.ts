import { ApiProperty } from "@nestjs/swagger";

export class OrdenNotaImagenResponseDto {
    @ApiProperty({example: '23', description: 'ID consecutivo para la imagen'})
    id: number;

    @ApiProperty({example: 'https://res.cloudinary.com/ddteoo6mz/image/upload/v1745400861/taller_cp/tuycryiquvzikvioahcw.jpg', description: 'URL de la imagen'})
    url: string;

    @ApiProperty({example: 'taller_cp/tuycryiquvzikvioahcw', description: 'Public ID de la imagen'})
    public_id: string;
}