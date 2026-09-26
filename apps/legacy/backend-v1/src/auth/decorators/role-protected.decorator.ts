import { EnumRole } from './../../commom/enums/general.enum';
import { SetMetadata } from '@nestjs/common';

export const META_ROLE = 'role';


export const RoleProtected = ( role: EnumRole ) => {

    
      return SetMetadata( META_ROLE , role);
}
