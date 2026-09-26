import { ChangeDetectionStrategy, Component, input, output, Signal, signal, TemplateRef, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DrawerBaseBottomComponent } from "../drawer-base-bottom/drawer-base-bottom.component";
import { CargandoDetallesComponent } from "@shared/components/loading/cargando-detalles/cargando-detalles.component";
import DrawerIdCreatedComponent from "../drawer-id-created/drawer-id-created.component";

interface ResourceFormShape<T>{
  isLoading: () => boolean;
  value: () => T | null | undefined;
}

@Component({
  selector: 'app-drawer-form-container',
  imports: [CommonModule, ReactiveFormsModule, DrawerBaseBottomComponent, CargandoDetallesComponent, DrawerIdCreatedComponent],
  templateUrl: './drawer-form-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerFormContainerComponent<T extends { id: string, createdAt: string}> {

  isOpen = input.required<boolean>();
  titleNuevo = input<string>('Nuevo Registro');
  titleEditar = input<string>('Editar Registro');

  labelId = input<string>('Registro');

  idSeleccionado = input<any>(null)
  resource = input.required<ResourceFormShape<T>>();

  formTemplateNuevo       = input.required<TemplateRef<{$implicit: T | null}>>();
  formTemplateInformacion = input<TemplateRef<{$implicit: T | null}> | null>(null);

  closeDrawerEmit = output<void>();

}

//formTemplateNuevo       = input<TemplateRef<{$implicit: null}> | null >(null);
//formTemplateInformacion = input.required<TemplateRef<{$implicit: T | null}>>();
