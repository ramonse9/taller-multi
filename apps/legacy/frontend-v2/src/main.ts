import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es-MX';
import localeEn from '@angular/common/locales/en';

registerLocaleData(  localeEs, 'es-MX' )
registerLocaleData(  localeEn, 'en' )


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
