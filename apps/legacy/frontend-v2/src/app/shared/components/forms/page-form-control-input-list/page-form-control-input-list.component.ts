import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, linkedSignal, Output, signal } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormUtils } from '@shared/utils/form-utils';

@Component({
  selector: 'app-page-form-control-input-list',
  imports: [CommonModule],
  templateUrl: './page-form-control-input-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFormControlInputListComponent {

  label = input.required<string>();
  name = input.required<string>();
  options = input.required<any[]>();
  controlForm = input<AbstractControl>()

  @Output() inputText = new EventEmitter<string>();

  nameInput = linkedSignal( () => this.name().trim() )
  isDropdownVisible = signal(false)


  optionsFiltered = computed( () => {

    return this.options().filter( ( option: any) => option.toLowerCase().includes( this.nameInput().trim().toLocaleLowerCase() ) )

  })


  showDropdown(){

    this.isDropdownVisible.set( true )

  }

  hideDropDown(){
    setTimeout( () => {
      this.isDropdownVisible.set( false )
    }, 100)
  }

  selectOption(option: string){

    this.nameInput.set( option.trim().toUpperCase() )
    this.inputText.emit( option.trim().toLowerCase() )

  }

  onInputName( name: string ){

    this.nameInput.set(name.trim())
    this.inputText.emit( name.trim() )

  }

  get errorMessage(){
    const errors: ValidationErrors = this.controlForm()?.errors || {}

    return Object.keys(errors).length > 0 ? FormUtils.getTextError( errors ) : null
  }

}
