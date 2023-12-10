
/**
 * This will be use to manage the general configuration of a given globule.
 */
export class GeneralConfigurationManager extends HTMLElement {
    // attributes.
 
    // Create the applicaiton view.
    constructor(globule) {
       super()
       // Set the shadow dom.
       this.attachShadow({ mode: 'open' });
 
       // Set the globule.
       this.globule = globule
 
       // Innitialisation of the layout.
       this.shadowRoot.innerHTML = `
         <style>
            
             #container{
                 background-color: var(--background-color);
                 color: var(--palette-text-primary);
             }
         </style>
         <div id="container">
             <div id="title">
                 <span>General</span>
                 <div>
                   <slot name="network-interface"></slot>
                 </div>
             </div>
         </div>
         `
       // give the focus to the input.
       let container = this.shadowRoot.querySelector("#container")
       let url = "https://globule-ryzen.globular.cloud/log_metrics"
 
       // now i will fetch the data as plain text.
       fetch(url)
          .then((response) => {
             return response.text()
          })
          .then((data) => {
             console.log(data)
          })
          .catch((error) => {
             console.log(error)
          })
 
 
    }
 
    // The connection callback.
    connectedCallback() {
 
    }
 
 
    displayNetworkInterface() {
       const address = this.globule.config.Name + "." + this.globule.config.Domain
       getStats(address, (obj) => {
          let interfaces = obj.network_interfaces
          interfaces.forEach(element => {
             // create the network interface display.
             let display = new NetworkInterfaceDisplay(element)
             display.slot = "network-interface"
             // add the display to the slot.
             this.slot.appendChild(display)
          });
 
       }, (error) => {
          console.log(error)
       })
    }
 
 
 }
 
 customElements.define('globular-general-configuration-manager', GeneralConfigurationManager)
 
 
 function getStats(address, callback, errorcallback) {
 
    let url = `https://${address}`
 
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.timeout = 1500
 
    xmlhttp.onreadystatechange = function () {
       if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
          var obj = JSON.parse(this.responseText);
          callback(obj);
       } else if (this.readyState == 4) {
          errorcallback("fail to get the configuration file at url " + url + " status " + this.status)
       }
    };
 
    xmlhttp.open("GET", url + "/stats", true);
    xmlhttp.setRequestHeader("domain", address);
 
    xmlhttp.send();
 }
 
 
 /**
  * Use to display the network interface.
  */
 export class NetworkInterfaceDisplay extends HTMLElement {
 
    // Create the applicaiton view.
    constructor(networkInterface) {
       super()
       // Set the shadow dom.
       this.attachShadow({ mode: 'open' });
 
       // Innitialisation of the layout.
       this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }
        </style>
        <div id="container">
        </div>
        `
       // give the focus to the input.
       let container = this.shadowRoot.querySelector("#container")
 
    }
 
 }
 
 customElements.define('globular-empty', NetworkInterfaceDisplay)