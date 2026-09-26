
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-card-component-icon-fondo',
  imports: [ CommonModule, NgIcon],
  templateUrl: './card-component-icon-fondo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponentIconFondoComponent {

  iconName = input.required<string>();
  textColor = input<string>("text-slate-600 dark:text-slate-100");

 }
