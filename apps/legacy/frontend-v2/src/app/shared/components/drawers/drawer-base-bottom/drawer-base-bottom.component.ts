import { ChangeDetectionStrategy, Component, effect, input, OnDestroy, output, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIcon } from "@ng-icons/core";
import { EnumDrawerDirection } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-drawer-base-bottom',
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  templateUrl: './drawer-base-bottom.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerBaseBottomComponent implements OnDestroy {

  isOpen = input.required<boolean>();
  title = input.required<string>();
  //directionBottom = input<boolean>(false);
  drawerDirection = input<EnumDrawerDirection>(EnumDrawerDirection.RIGHT);

  closeDrawerEmit = output<void>();
  searchTextEmit = output<string>();

  constructor(){
    effect( () => {
      if( this.isOpen()){
        document.body.classList.add('overflow-hidden');
      }else{
        document.body.classList.remove('overflow-hidden');
      }
    })
  }

  ngOnDestroy(): void {
    document.body.classList.remove('overflow-hidden');
  }

  onInput(input: HTMLInputElement) {
    this.searchTextEmit.emit(input.value);
  }

  refresh(input: HTMLInputElement){
    input.value = ''
    this.searchTextEmit.emit('');
  }

  onClose(){
    this.closeDrawerEmit.emit();
  }

  get EnumDrawerDirection(){
    return EnumDrawerDirection;
  }

}
