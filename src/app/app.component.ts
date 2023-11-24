import { Component } from '@angular/core';
import '../webcomponent/applicationLayout'
import '../webcomponent/markdown'
import '../webcomponent/themeEditor'
import '../webcomponent/menu'
import '../webcomponent/dialog'
import '../webcomponent/network'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  

  // wait until the web component is loaded
  componentLoaded:boolean = false;

  title = 'globular-console';

  constructor() {
    console.log('AppComponent constructor called');
  }

  onComponentLoaded(event: Event) {
    this.componentLoaded = true;
    console.log('Web component loaded event received:', event);
  }
}
