import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from "@ng-icons/core";

@Component({
  selector: 'app-card-component-id',
  standalone: true,
  imports: [CommonModule, NgIcon],
  templateUrl: './card-component-id.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponentIdComponent<T extends {id: string, createdAt: string}> {

  label = input.required<string>();
  entidad = input.required<T>();

 }
