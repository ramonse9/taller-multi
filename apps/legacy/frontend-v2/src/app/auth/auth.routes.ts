import { AuthLayoutComponent } from "./layouts/auth-layout/auth-layout.component";
import { LoginPageComponent } from "./pages/login-page/login-page.component";
import { RegisterPageComponent } from "./pages/register-page/register-page.component";
import { Routes } from "@angular/router";

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        component: LoginPageComponent
      },
      {
        path: 'register',
        component: RegisterPageComponent
      },
    ]
  }
]

export default authRoutes;
