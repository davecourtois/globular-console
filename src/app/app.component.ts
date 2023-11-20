import { Component } from '@angular/core';
import '../controllers/Backend'
import '../controllers/File'
import '../controllers/Title'
import '../webcomponent/applicationLayout'
import '../webcomponent/themeEditor'
import '../webcomponent/application'
import '../webcomponent/menu'
import '../webcomponent/dialog'

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
