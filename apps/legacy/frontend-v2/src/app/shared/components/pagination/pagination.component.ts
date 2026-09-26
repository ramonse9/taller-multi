import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, linkedSignal, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule, RouterLink],
  templateUrl: './pagination.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {

  pages = input(0);
  currentPage = input<number>(1);

  @Output() itemsPerPageSelected = new EventEmitter<number>();

  activePage = linkedSignal( () => this.currentPage() )

  //getPagesList = computed( () => {
  //  return Array.from({length: this.pages()}, (_, i) => i + 1 )
  //})

  selectPerPageChange(itemsPerPage: number){

    this.itemsPerPageSelected.emit( itemsPerPage )

  }

  getPagesList = computed(() => {
    const total = this.pages();
    const current = this.activePage();
    const delta = 1;

    // casos especiales
    if (total <= 0) {
      return []; // no hay páginas
    }
    if (total === 1) {
      return [1]; // solo una página
    }

    const range: (number | string)[] = [];

    // siempre incluir primera página
    range.push(1);

    // si hay hueco entre 1 y el rango inicial
    if (current - delta > 2) {
      range.push('...');
    }

    // rango alrededor de la página actual
    for (let i = current - delta; i <= current + delta; i++) {
      if (i > 1 && i < total) {
        range.push(i);
      }
    }

    // si hay hueco entre el rango final y la última página
    if (current + delta < total - 1) {
      range.push('...');
    }

    // siempre incluir última página
    range.push(total);

    return range;
  });

}
