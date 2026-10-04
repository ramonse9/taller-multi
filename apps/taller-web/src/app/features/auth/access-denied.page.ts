import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth/auth.service";

@Component({
  selector: "app-access-denied-page",
  imports: [RouterLink],
  template: `
    <main class="grid min-h-[75vh] place-items-center px-6 py-16">
      <section class="w-full max-w-xl border border-[#d5dce3] bg-white p-8 text-center dark:border-[#38516d] dark:bg-[#19283b]">
        <span class="mx-auto grid size-14 place-items-center rounded-full bg-[#ffdcd2] text-2xl text-[#a63725] dark:bg-[#633d3d] dark:text-[#ff9e8c]">!</span>
        <p class="eyebrow mt-6">ACCESO INSUFICIENTE</p>
        <h1 class="m-0 font-[var(--display)] text-4xl font-semibold">No tienes permiso para esta sección</h1>
        <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-[#63717d] dark:text-[#afbed0]">
          Tu cuenta no tiene habilitado <strong>{{ permissionLabel() }}</strong>.
          Solicita el acceso a un Administrador o Administrador principal.
        </p>
        <a class="primary mt-6 inline-block no-underline" [routerLink]="auth.homeUrl()">Volver</a>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessDeniedPage {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  permissionLabel(): string {
    const code = this.route.snapshot.queryParamMap.get("permission") ?? "esta operación";
    return code.replaceAll("_", " ").replace(".", ": ");
  }
}
