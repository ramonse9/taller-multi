import { PartialType } from '@nestjs/swagger';
import { CreateGastoMovimientoDto } from './create-gasto-movimiento.dto';

export class UpdateGastoMovimientoDto extends PartialType(CreateGastoMovimientoDto) {}
