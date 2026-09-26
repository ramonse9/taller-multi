import { ChangeDetectionStrategy, Component, effect, input, output, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIcon } from "@ng-icons/core";

@Component({
  selector: 'app-drawer-base',
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  templateUrl: './drawer-base.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerBaseComponent {

  isOpen = input.required<boolean>();
  title = input.required<string>();

  closeDrawerEmit = output<void>();

  constructor(){
    effect( () => {
      if( this.isOpen()){
        document.body.classList.add('overflow-hidden');
      }else{
        document.body.classList.remove('overflow-hidden');
      }
    })
  }

  onClose(){
    this.closeDrawerEmit.emit();
  }

}
