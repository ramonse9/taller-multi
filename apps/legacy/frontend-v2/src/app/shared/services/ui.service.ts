import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {

  isSidebarOpen = signal(false);

  toggleSidebar(){
    this.isSidebarOpen.update( state => !state);
  }

  closeSidebar(){
    this.isSidebarOpen.set( false );
  }

}
