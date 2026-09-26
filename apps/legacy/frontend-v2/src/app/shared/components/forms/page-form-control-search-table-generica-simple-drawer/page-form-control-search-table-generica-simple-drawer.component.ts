import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, input, OnInit, output, Output, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { DrawerBaseBottomComponent } from '@shared/components/drawers/drawer-base-bottom/drawer-base-bottom.component';
import { EnumDrawerDirection } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-page-form-control-search-table-generica-simple-drawer',
  imports: [CommonModule, NgIcon, DrawerBaseBottomComponent],
  templateUrl: './page-form-control-search-table-generica-simple-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFormControlSearchTableGenericaSimpleDrawerComponent implements OnInit {

  label = input.required<string>();
  optionPlaceholder = input.required<string>();
  currentValue = signal<string | null>(null);
  optionSelectedValue = input<string | null>(null);
  plusButton = input<boolean>(false);
  plusButtonMostrar = input<boolean>(true);
  private destroyRef = inject( DestroyRef )

  //@Output() searchText = new EventEmitter<string>();
  searchTextEmit = output<string>()

  isDrawerVisible = signal(false)

  get EnumDrawerDirection(){
    return EnumDrawerDirection
  }

  ngOnInit(): void {
  }

  showDrawer(){
    this.isDrawerVisible.set( !this.isDrawerVisible() )
  }

  onInput(input: HTMLInputElement) {
    this.searchTextEmit.emit(input.value);
  }

  searchText( event: string ){
    this.searchTextEmit.emit( event )
  }

  refresh(input: HTMLInputElement){
    input.value = ''
    this.searchTextEmit.emit('');
  }

  hideDrawer(){
    this.isDrawerVisible.set( false );
  }



}
