import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const allowedOrigins = process.env.STAGE === 'prod' 
    ? [
      'https://app.multiservicios247.com',
      'https://www.app.multiservicios247.com',
      'https://p-tc-frontend-v2.onrender.com',
    ]
    : ['http://localhost:4200', 'http://localhost:3000'];
  
  app.enableCors({      
    origin: ( origin, callback) => {

        if(!origin) return callback(null, true)

        if( process.env.STAGE === 'prod' ){

          if(allowedOrigins.includes(origin)){
            return callback(null, true);
          }

          return callback(new Error('CORS blocked'))
          
        }

        return callback(null, true);        
        
      },
      credentials: true,
      methods: 'GET,POST,PATCH,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization, Accept, Origin'
    })
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    //TODO
    //forbidNonWhitelisted: true
  }))
  app.useStaticAssets(join(__dirname, '../public'))
  app.setGlobalPrefix('api');
  
  app.use( express.json({
    limit: '2mb'
  }))

  app.use( compression())
  app.disable('x-powered-by');

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy:
        process.env.STAGE === 'prod'
          ? undefined
          : false,
    })
  )
  app.use( cookieParser() )

  const theme = new SwaggerTheme()
  const darkStyle = theme.getBuffer(SwaggerThemeNameEnum.DARK)

  const config = new DocumentBuilder()    
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT-auth',
    )
    .setTitle('Documentación API')
    .setDescription('API para taller')
    .setVersion('1.0') 
    .addTag('Clientes')
    .addTag('Vehiculos')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  if( process.env.STAGE !== 'prod' ){
    SwaggerModule.setup('documentacion', app, document, { customCss: darkStyle });
  }

  const host = process.env.ADDRESS ?? '0.0.0.0'

  await app.listen(process.env.PORT ?? 3000, host);
  
}
bootstrap();
