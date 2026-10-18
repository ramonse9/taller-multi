import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { NavigationIconName } from "../../core/navigation/tenant-navigation.config";

@Component({
  selector: "app-navigation-icon",
  templateUrl: "./navigation-icon.component.html",
  styleUrl: "./navigation-icon.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationIconComponent {
  readonly name = input.required<NavigationIconName>();
}
