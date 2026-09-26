import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextPreviewComponent } from '@shared/components/text-preview/text-preview.component';

@Component({
  selector: 'app-card-component-description',
  imports: [ CommonModule, TextPreviewComponent],
  templateUrl: './card-component-description.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponentDescriptionComponent {

  description = input.required<string>();

  observaciones = input<boolean>(false);

 }
