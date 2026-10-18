import { computed, inject, Injectable } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import {
  isTenantAccessAllowed,
  TENANT_HOME_ACTIONS,
  TENANT_NAVIGATION,
  TenantAccessContext,
} from "./tenant-navigation.config";

@Injectable({ providedIn: "root" })
export class TenantNavigationService {
  private readonly auth = inject(AuthService);

  readonly items = computed(() => {
    const context = this.context();
    if (!context) return [];
    return TENANT_NAVIGATION.filter((item) =>
      isTenantAccessAllowed(item, context),
    );
  });

  readonly homeActions = computed(() => {
    const context = this.context();
    if (!context) return [];
    return TENANT_HOME_ACTIONS.filter((action) =>
      isTenantAccessAllowed(action, context),
    );
  });

  private context(): TenantAccessContext | null {
    const user = this.auth.user();
    if (!user) return null;
    return {
      role: user.role,
      planCode: user.subscription?.planCode ?? null,
      subscriptionUsable: user.subscription?.usable ?? false,
      features: user.subscription?.features ?? [],
      readOnlyFeatures: user.subscription?.readOnlyFeatures ?? [],
      permissions: user.permissions,
    };
  }
}
