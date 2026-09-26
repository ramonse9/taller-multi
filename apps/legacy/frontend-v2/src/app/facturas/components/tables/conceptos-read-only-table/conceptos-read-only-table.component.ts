import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core';

@Component({
  selector: 'app-conceptos-read-only-table',
  imports: [CommonModule],
  templateUrl: './conceptos-read-only-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConceptosReadOnlyTableComponent implements OnInit {

  conceptos = input.required<any>()

  ngOnInit(){
  }

}
