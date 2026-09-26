import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { FormUtils } from '@shared/utils/form-utils';

@Component({
  selector: 'app-page-form-control-list',
  imports: [CommonModule],
  templateUrl: './page-form-control-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFormControlListComponent {

  label = input.required<string>();
  options = input.required<{ clave: string | number, descripcion: string}[]>();
  newOption = input.required<string>();
  controlForm = input<AbstractControl>();
  defaultSelected = input<Boolean>(false)

  //@Output() optionSelected = new EventEmitter<string>();
  optionSelected = output<string>();

  isDropdownVisible = signal(false)
  search = signal('')

  /*valueClaveDescripcion = computed( () => {
    const currentOptions = this.options();
    const currentKey = this.controlForm()?.value;
    
    if( !currentOptions || currentOptions.length === 0 ) return null;

    const resultado = currentOptions.find( op => String(op.clave) === String(currentKey));
    
    return resultado ? `${resultado.clave} - ${resultado.descripcion}` : null
  })*/

  get valueClaveDescripcion(){
    
    const currentOptions = this.options();
    const currentKey = this.controlForm()?.value;

    if (!currentOptions?.length) return null;

    const resultado = currentOptions.find(
      op => String(op.clave) === String(currentKey)
    );

    return resultado
      ? `${resultado.clave} - ${resultado.descripcion}`
      : null;

  }

  optionsFiltered = computed( () => {
    return this.options().filter( option => option.descripcion.toLowerCase().includes( this.search() )  )
  })

  showDropdown(){
    this.isDropdownVisible.set( !this.isDropdownVisible() )
  }

  selectOption(option: any){

    this.optionSelected.emit( option.clave )

    this.controlForm()?.setValue( option.clave )

    this.hideDropdown()
  }

  hideDropdown(){
    this.isDropdownVisible.set(false)
  }

  get errorMessage(){
    const errors: ValidationErrors = this.controlForm()?.errors || {}

    return Object.keys(errors).length > 0 ? FormUtils.getTextError( errors ) : null
  }

}
