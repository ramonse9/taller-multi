import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, linkedSignal, Output, signal } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { ProductosServiciosTableComponent } from '@catalogos/components/tables/productos-servicios-table/productos-servicios-table.component';
import { FormUtils } from '@shared/utils/form-utils';

@Component({
  selector: 'app-page-form-control-search-table-producto-servicio',
  imports: [CommonModule, ProductosServiciosTableComponent],
  templateUrl: './page-form-control-search-table-producto-servicio.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFormControlSearchTableProductoServicioComponent {

  label = input.required<string>();
  options = input.required<any[]>();
  id = input.required<string>();
  newOption = input.required<string>();
  controlForm = input<AbstractControl>()

  @Output() optionSelected = new EventEmitter<any>();
  @Output() searchText = new EventEmitter<string>();

  //@Output() clienteSelected = new EventEmitter<Cliente>();

  isDropdownVisible = signal(false)
  //search = signal('')

  idSelected = linkedSignal( () => this.id() )

  valueName = computed( () => {
    return this.options().find( op => op.id === this.idSelected() )
  });



  //optionsFiltered = computed( () => {
  //  return this.options().filter( option => option.nombre.toLowerCase().includes( this.search() )  )
  //})

  showDropdown(){
    if( this.isDropdownVisible() === true ){
      this.hideDropdown()
    }else{
      //TODO
      //this.opcionesFiltradas = [...this.opciones];
      this.isDropdownVisible.set( true )
    }
  }

  /*selectOption(option: any){

    this.idSelected.set( option.id )

    this.optionSelected.emit(option.id)

    this.hideDropdown()
  }*/

  selectOption(option: any){

    this.idSelected.set( option.id )

    this.optionSelected.emit(option)

    this.hideDropdown()
  }


  search( search: string ){
    this.searchText.emit( search )
  }

  hideDropdown(){
    this.isDropdownVisible.set( false );
  }

  get errorMessage(){
    const errors: ValidationErrors= this.controlForm()?.errors || {}

    return Object.keys(errors).length > 0 ? FormUtils.getTextError( errors ) : null
  }

}
