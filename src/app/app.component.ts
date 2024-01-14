import { Component } from '@angular/core';
import '../webcomponent/applicationLayout'
import '../webcomponent/markdown'
import '../webcomponent/themeEditor'
import '../webcomponent/menu'
import '../webcomponent/dialog'
import '../webcomponent/network'
import '../webcomponent/cluster.js';
import '../webcomponent/services.js';
import '../webcomponent/users.js';
import '../webcomponent/applications.js';
import '../webcomponent/groups.js';
import '../webcomponent/roles.js';
import '../webcomponent/permissions.js';
import '../webcomponent/organizations.js';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  // Keep globules in memory
  static globules: Array<any> = [];

  // Keep hosts in memory
  static hosts: Array<any> = [];

  // wait until the web component is loaded
  componentLoaded: boolean = false;

  title = 'globular-console';

  constructor() {

    document.addEventListener('displayHostEvent', (evt: any) => {
      let host = evt['detail']['host'];
      let exist = false;
      AppComponent.hosts.forEach((h: any) => {
        if (h.getMac() == host.getMac()) {
          exist = true;
        }
      }
      );
      // keep the host in memory
      if(!exist) {
        AppComponent.hosts.push(host);
      }
    });

    // Here I will connect to globule_connection_evt
    document.addEventListener('globule_connection_evt', (evt: any) => {
      // get the globule
      // let globule = evt['detail'];
      // add it to the array
      // AppComponent.globules.push(globule);
      let globule = evt['detail']['globule']
      let exist = false;
      AppComponent.globules.forEach((g: any) => {
        if (g.config.Name == globule.config.Name) {
          exist = true;
        }
      }
      );

      if (!exist) {
        AppComponent.globules.push(globule);
      }
    }
    );
  }

  onComponentLoaded(event: Event) {
    this.componentLoaded = true;
  }
}
