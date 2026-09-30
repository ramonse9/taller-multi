import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth/auth.service";

@Component({
  selector: "app-subscription-required-page",
  imports: [RouterLink],
  template: `
    <main class="min-h-full bg-[#f9f7f0] px-[clamp(1.5rem,6vw,6rem)] py-16 text-[#17251e] dark:bg-[#101713] dark:text-[#edf3ef]">
      <section class="mx-auto max-w-2xl border border-[#dcd9cf] bg-white p-8 shadow-sm dark:border-[#3d4d44] dark:bg-[#1a251f] sm:p-12">
        <p class="eyebrow">SUSCRIPCIÓN</p>
        <h1 class="mt-2 font-[var(--display)] text-4xl font-semibold tracking-[-0.04em]">Acceso temporalmente restringido</h1>
        <p class="mt-5 leading-7 text-[#68746d] dark:text-[#aab7af]">
          El plan de tu compañía está vencido, suspendido o no incluye esta capacidad. Tus clientes, vehículos y órdenes permanecen guardados.
        </p>
        @if (auth.user()?.subscription; as subscription) {
          <dl class="mt-7 grid gap-3 border-y border-[#e4e0d7] py-5 text-sm dark:border-[#34423a] sm:grid-cols-2">
            <div><dt class="text-[#68746d] dark:text-[#aab7af]">Plan</dt><dd class="font-bold">{{ subscription.planName }}</dd></div>
            <div><dt class="text-[#68746d] dark:text-[#aab7af]">Estado</dt><dd class="font-bold">{{ subscription.status }}</dd></div>
          </dl>
        }
        <p class="mt-6 text-sm">Solicita al administrador de plataforma la reactivación o el cambio de plan.</p>
        <div class="mt-7 flex gap-3">
          <a routerLink="/account" class="bg-[#e86a33] px-5 py-3 font-bold text-white">Mi cuenta</a>
          <button type="button" class="border border-[#dcd9cf] px-5 py-3 font-bold dark:border-[#46554c]" (click)="auth.logout()">Cerrar sesión</button>
        </div>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionRequiredPage {
  readonly auth = inject(AuthService);
}
