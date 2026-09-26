import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { spinnerInterceptor } from './shared/interceptors/spinner.interceptor';
import { authInterceptor } from './auth/interceptors/auth.interceptor';
import { provideIcons } from '@ng-icons/core';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { tablerAlertCircle, tablerArrowBackUp, tablerArrowNarrowRightDashed, tablerArrowNarrowUp, tablerArrowRight, tablerBrandWhatsapp, tablerBuilding, tablerCalendar, tablerCalendarCheck, tablerCalendarDollar, tablerCalendarPlus, tablerCamera, tablerCar, tablerCategoryPlus, tablerChartBarPopular, tablerCheck, tablerChecklist, tablerCheckupList, tablerChevronDown, tablerChevronRight, tablerCircleCheck, tablerCirclePlus, tablerClick, tablerClipboardText, tablerClock, tablerCrop169, tablerCurrencyDollar, tablerCurrencyDollarOff, tablerExclamationMark, tablerEye, tablerFileAlert, tablerFileDollar, tablerFileTypeXls, tablerHash, tablerHistory, tablerHome, tablerId, tablerLayoutGrid, tablerLibrary, tablerLineDashed, tablerLineDotted, tablerListCheck, tablerLock, tablerLogout, tablerMail, tablerMenu2, tablerMessage, tablerMicrophone, tablerMoon, tablerMoon2, tablerPencil, tablerPhone, tablerPlayerStop, tablerPlus, tablerQuestionMark, tablerReceipt, tablerReceiptOff, tablerReportMoney, tablerSearch, tablerSettings, tablerShare, tablerShoppingCart, tablerSquare, tablerSquareCheck, tablerSquareKey, tablerSun, tablerTable, tablerThumbDown, tablerTool, tablerTrash, tablerUser, tablerUserCircle, tablerUsersGroup, tablerX, tablerXboxX } from '@ng-icons/tabler-icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      //withRouterConfig({ onSameUrlNavigation: 'reload' })
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([spinnerInterceptor, authInterceptor])
    ),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark'
        }
      },
      translation: {
        accept: 'Aceptar',
        reject: 'Cancelar',
        dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
        dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
        dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"],
        monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
        monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
        today: 'Hoy',
        clear: 'Limpiar',
        firstDayOfWeek: 0
      }
    }),
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'es-MX'},
    provideIcons({ tablerTool, tablerClock, tablerCheck, tablerExclamationMark, tablerCalendarCheck, tablerHistory, tablerCalendarPlus, tablerCirclePlus, tablerReceiptOff, tablerEye, tablerUser, tablerPhone, tablerBrandWhatsapp, tablerBuilding, tablerCar, tablerCrop169, tablerListCheck, tablerClipboardText, tablerSearch, tablerChecklist, tablerFileAlert, tablerMessage, tablerLock, tablerLibrary, tablerShoppingCart, tablerHome, tablerThumbDown, tablerPencil, tablerArrowBackUp, tablerArrowRight, tablerArrowNarrowRightDashed, tablerLineDashed, tablerLineDotted, tablerMail, tablerMoon, tablerMoon2, tablerSun, tablerX, tablerXboxX, tablerAlertCircle, tablerCircleCheck, tablerTable, tablerLayoutGrid, tablerTrash, tablerQuestionMark, tablerFileDollar, tablerCurrencyDollar, tablerCheckupList, tablerUsersGroup, tablerArrowNarrowUp, tablerMenu2, tablerLogout, tablerCamera, tablerShare, tablerReportMoney, tablerSquare, tablerSquareCheck, tablerFileTypeXls, tablerCalendarDollar, tablerUserCircle, tablerCalendar, tablerId, tablerChartBarPopular, tablerCategoryPlus, tablerChevronDown, tablerChevronRight, tablerSettings, tablerSquareKey, tablerCurrencyDollarOff, tablerMicrophone, tablerPlayerStop, tablerClick, tablerPlus, tablerHash,
     })
  ]
};
