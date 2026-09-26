import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-text-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextPreviewComponent {

  // Inputs como Signals
  text = input.required<string>();
  limit = input<number>(30);

  // Estado interno como Signal
  expanded = signal(false);

  // Lógica computada (eficiente y reactiva)
  isLongText = computed(() => ( this.text()?.length ?? 0 ) > this.limit());

  displayText = computed(() => {
    const currentText = this.text() ?? '';
    if (this.expanded() || currentText.length <= this.limit()) {
      return currentText;
    }
    return currentText.substring(0, this.limit());
  });

  showEllipsis = computed(() => !this.expanded() && this.isLongText());

  toggleText() {
    if (this.isLongText()) {
      this.expanded.update(v => !v);
    }
  }

  /*text = input<string>('');
  limit = input<number>(30);

  expanded: boolean = false;

  toggleText(){
    this.expanded = !this.expanded;
  }

  get displayText(): string{
    if(this.expanded || this.text().length <= this.limit() ){
      return this.text();
    }else{
      return this.text().substring( 0, this.limit())
    }
  }

  get mostrarPreview(){
    return !this.expanded && this.text().length > this.limit();
  }*/

}
