import { Routes } from "@angular/router";
import { Error403Component } from "./pages/error-403/error-403.component";
import { ErrorLayoutComponent } from "./layouts/error-layout/error-layout.component";
import { Error404Component } from "./pages/error-404/error-404.component";

export const errorRoutes: Routes = [
  {
    path: '',
    component: ErrorLayoutComponent,
    children: [
      {
        path: '403',
        component: Error403Component
      },
      {
        path: '404',
        component: Error404Component
      },
      {
        path: '**',
        redirectTo: '/error/404'
      }
    ]
  }
]

export default errorRoutes;
