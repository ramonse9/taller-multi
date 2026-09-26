import { CommonModule } from '@angular/common';
import {  Component, input } from '@angular/core';

@Component({
  selector: 'app-page-form-body',
  imports: [CommonModule],
  templateUrl: './page-form-body.component.html',

})
export class PageFormBodyComponent {

  borderColor = input<string>('border-gray-200 dark:border-gray-700'); 
 }
