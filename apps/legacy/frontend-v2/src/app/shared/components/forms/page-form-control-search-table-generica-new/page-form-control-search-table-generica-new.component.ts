import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, input, OnInit, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormUtils } from '@shared/utils/form-utils';

@Component({
  selector: 'app-page-form-control-search-table-generica-new',
  imports: [CommonModule],
  templateUrl: './page-form-control-search-table-generica-new.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFormControlSearchTableGenericaNewComponent implements OnInit {

  label = input.required<string>();
  optionPlaceholder = input.required<string>();
  controlForm = input<AbstractControl>()
  currentValue = signal<string | null>(null)
  optionSelectedValue = input<string | null>(null)
  plusButton = input<boolean>(false)
  private destroyRef = inject( DestroyRef )

  @Output() searchText = new EventEmitter<string>();

  isDropdownVisible = signal(false)

  ngOnInit(): void {

    if( this.controlForm() ){
      this.controlForm()?.valueChanges
      .pipe( takeUntilDestroyed(this.destroyRef))
      .subscribe( value => {
        this.currentValue.set( value )
      })
    }

  }

  showDropdown(){
    this.isDropdownVisible.set( !this.isDropdownVisible() )
  }

  onInput(input: HTMLInputElement) {
    this.searchText.emit(input.value);
  }

  restart(input: HTMLInputElement){
    input.value = ''
    this.searchText.emit('');
  }

  hideDropdown(){
    this.isDropdownVisible.set( false );
  }

  get errorMessage(){
    const errors: ValidationErrors= this.controlForm()?.errors || {}

    return Object.keys(errors).length > 0 ? FormUtils.getTextError( errors ) : null
  }

}
