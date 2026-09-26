import { UpperCasePipe } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-title-detail',
  imports: [UpperCasePipe],
  templateUrl: './page-title-detail.component.html'
})
export class PageTitleDetailComponent {

  titleNew      = input.required<string>()
  titleUpdate   = input.required<string>()
  id            = input.required<string>()
  detail        = input.required<string>()
  subdetail     = input<string>('')
  subtitle      = input<boolean>(true)

  get title(){
    return this.id() !== '' ? this.titleUpdate() : this.titleNew()
  }

}
