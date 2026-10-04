import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth/auth.service";

@Component({
  selector: "app-subscription-required-page",
  imports: [RouterLink],
  template: `
    <main class="min-h-full bg-[#fbfaf7] px-[clamp(1.5rem,6vw,6rem)] py-16 text-[#17251e] dark:bg-[#111d2e] dark:text-[#edf4fb]">
      <section class="mx-auto max-w-2xl border border-[#d5dce3] bg-white p-8 shadow-sm dark:border-[#38516d] dark:bg-[#19283b] sm:p-12">
        <p class="eyebrow">SUSCRIPCIÓN</p>
        <h1 class="mt-2 font-[var(--display)] text-4xl font-semibold tracking-[-0.04em]">Acceso temporalmente restringido</h1>
        <p class="mt-5 leading-7 text-[#63717d] dark:text-[#afbed0]">
          El plan de tu compañía está vencido, suspendido o no incluye esta capacidad. Tus clientes, vehículos y órdenes permanecen guardados.
        </p>
        @if (auth.user()?.subscription; as subscription) {
          <dl class="mt-7 grid gap-3 border-y border-[#e2e7ec] py-5 text-sm dark:border-[#38516d] sm:grid-cols-2">
            <div><dt class="text-[#63717d] dark:text-[#afbed0]">Plan</dt><dd class="font-bold">{{ subscription.planName }}</dd></div>
            <div><dt class="text-[#63717d] dark:text-[#afbed0]">Estatus</dt><dd class="font-bold">{{ subscription.status }}</dd></div>
          </dl>
        }
        <p class="mt-6 text-sm">Solicita al administrador de plataforma la reactivación o el cambio de plan.</p>
        <div class="mt-7 flex gap-3">
          <a routerLink="/account" class="bg-[#e86a33] px-5 py-3 font-bold text-white">Mi cuenta</a>
          <button type="button" class="border border-[#d5dce3] px-5 py-3 font-bold dark:border-[#38516d]" (click)="auth.logout()">Cerrar sesión</button>
        </div>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionRequiredPage {
  readonly auth = inject(AuthService);
}
