import { PartialType } from '@nestjs/swagger';
import { CreateSatDto } from './create-sat.dto';

export class UpdateSatDto extends PartialType(CreateSatDto) {}
