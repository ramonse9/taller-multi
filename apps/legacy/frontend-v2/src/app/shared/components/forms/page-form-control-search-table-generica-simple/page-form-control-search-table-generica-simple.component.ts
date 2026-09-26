import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, input, OnInit, Output, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-page-form-control-search-table-generica-simple',
  imports: [CommonModule, NgIcon],
  templateUrl: './page-form-control-search-table-generica-simple.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFormControlSearchTableGenericaSimpleComponent implements OnInit {

  label = input.required<string>();
  optionPlaceholder = input.required<string>();
  currentValue = signal<string | null>(null);
  optionSelectedValue = input<string | null>(null);
  plusButton = input<boolean>(false);
  plusButtonMostrar = input<boolean>(true);
  private destroyRef = inject( DestroyRef )

  @Output() searchText = new EventEmitter<string>();

  isDropdownVisible = signal(false)

  ngOnInit(): void {
  }

  showDropdown(){
    this.isDropdownVisible.set( !this.isDropdownVisible() )
  }

  onInput(input: HTMLInputElement) {
    this.searchText.emit(input.value);
  }

  refresh(input: HTMLInputElement){
    input.value = ''
    this.searchText.emit('');
  }

  hideDropdown(){
    this.isDropdownVisible.set( false );
  }

}
