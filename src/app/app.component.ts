import { Component } from '@angular/core';
import { Globular } from 'globular-web-client';
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
import { getAvailableHostsRequest } from 'globular-web-client/admin/admin_pb';


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

    // I load the globules from the local storage.
    let addresses = []
    let item = localStorage.getItem("globules")
    if (item == null) {
      addresses = []
    } else {
      addresses = JSON.parse(item)
    }

    // I will initialize the globules from the local storage.
    addresses.forEach((address: string) => {

      // I will test if the address is valid.
      let url = address + "/config"

      let globule = new Globular(url, () => {
        // now I will scan the local network and try to find other globules.
        if (globule == null) {
          return
        }

        // throw globule_connection_evt 
        let event = new CustomEvent('globule_connection_evt', { detail: { globule: globule } });
        document.dispatchEvent(event);

      }, err => {
        console.log("error", err)
      })

    });

    // I will scan the local network and try to find other globules.
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
      if (!exist) {
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
      });

      if (!exist) {
        AppComponent.globules.push(globule);

        // I will keep the address in the local store.
        let item = localStorage.getItem("globules")
        if (item == null) {
          addresses = []
        } else {
          addresses = JSON.parse(item)
        }

        // I will add the address if it is not already in the list.
        let address = globule.config.Name + "." + globule.config.Domain
        if (window.location.protocol == "https:") {
          address = "https://" + address + ":" + globule.config.PortHttps
        } else {
          address = "http://" + address + ":" + globule.config.PortHttp
        }

        if (addresses.indexOf(address) == -1) {
          addresses.push(address)
        }

        localStorage.setItem("globules", JSON.stringify(addresses))
      }
    }
    );
  }

  onComponentLoaded(event: Event) {
    this.componentLoaded = true;
  }
}

