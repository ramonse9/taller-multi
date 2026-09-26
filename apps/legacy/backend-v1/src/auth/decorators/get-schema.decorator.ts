import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";

export const GetSchema = createParamDecorator( ( data: string, ctx: ExecutionContext) => {

    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if(!user)
        throw new InternalServerErrorException('User not found (request)')

    if(!user.compania)
        throw new InternalServerErrorException('Not found company')    

    if(!user.compania.schema)
        throw new InternalServerErrorException('Not found schema')

    return data
})