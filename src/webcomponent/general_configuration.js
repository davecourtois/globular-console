
function containsIPv4(string) {
   const ipv4Regex = /(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/;
   return ipv4Regex.test(string);
}

function containsIPv6(string) {
   const ipv6Regex = /(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}|(?:[A-Fa-f0-9]{1,4}:){1,7}:|:(?::[A-Fa-f0-9]{1,4}){1,7}/;
   return ipv6Regex.test(string);
}

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

             .section {
               background-color: var(--surface-color);
               padding: 1rem;
               border-radius: 0.5rem;
               margin: 1rem;  
               margin-left: 0;     
               display: flex;
               flex-direction: column;    
             }

             .section > .title {
               font-size: 1.2rem;
               margin-right: 1rem;
               flex-grow: 1;
             }

         </style>
         <div id="container">
            <div id="" class="section">
               <div class="title">General</div>
               <slot name="general-infos"></slot>
            </div>

            <div id="" class="section">
               <div class="title">Network</div>
               <slot name="network-infos"></slot>
            </div>
            
            <div id="" class="section">
               <div class="title">Nework interface</div>
               <slot name="network-interface"></slot>
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

      this.displayGeneralInfos()
      this.displayNetworkInfos()
      this.displayNetworkInterface()
   }

   // The connection callback.
   connectedCallback() {

   }

   displayGeneralInfos() {
      let version_fragment = `
      <div class="sub-section">
         <div class="label">Version</div>
         <div class="value">${this.globule.config.Version}</div>
      </div>
      `

      let build_fragment = `
      <div class="sub-section">
         <div class="label">Build</div>
         <div class="value">${this.globule.config.Build}</div>
      </div>
      `

      let platform_fragment = `
      <div class="sub-section">
         <div class="label">Platform</div>
         <div class="value">${this.globule.config.Platform}</div>
      </div>
      `


      let div = document.createElement("div")
      div.slot = "general-infos"

      div.innerHTML = version_fragment + build_fragment + platform_fragment
      this.appendChild(div)

   }

   displayNetworkInfos() {
      // The host name.
      let host_name_fragment = `
      <div class="sub-section">
         <div class="label">Host name</div>
         <div class="value">${this.globule.config.Name}</div>
      </div>
                        `

      // The actual domain.
      let domain_fragment = `
      <div class="sub-section">
         <div class="label">Domain</div>
         <div class="value">${this.globule.config.Domain}</div>
      </div>
      `

      // The alternative domains
      let alternative_domains_fragment = `
      <div class="sub-section">
         <div class="label">Alternate domains</div>
         <div style="display: flex; flex-direction: column;">    
      `

      for (let i = 0; i < this.globule.config.AlternateDomains.length; i++) {
         alternative_domains_fragment += `
         <div class="value">${this.globule.config.AlternateDomains[i]}</div>
         `
      }

      alternative_domains_fragment += `</div> </div>`


      // The range of port.
      let port_range_fragment = `
      <div class="sub-section">
         <div class="label">Ports range</div>
         <div class="value">${this.globule.config.PortsRange}</div>
      </div>
      `

      // The DNS server.
      let dns_server_fragment = `
      <div class="sub-section">
         <div class="label">DNS server</div>
         <div class="value">${this.globule.config.DNS}</div>
      </div>
      `

      let div = document.createElement("div")
      div.slot = "network-infos"

      div.innerHTML = host_name_fragment + domain_fragment + alternative_domains_fragment + port_range_fragment + dns_server_fragment
      this.appendChild(div)

   }


   displayNetworkInterface() {

      const address = this.globule.config.Name + "." + this.globule.config.Domain
      getStats(address, (obj) => {
         let interfaces = obj.network_interfaces
         interfaces.forEach(element => {
            // create the network interface display.
            if (this.globule.config.Mac.startsWith(element.mac)) {
               // So here I will display the network interface.
               if (element.mac.length > 0) {


                  // The mac address.
                  let mac_address_fragment = `
                  <div class="sub-section">
                     <div class="label">Mac address</div>
                     <div class="value">${element.mac}</div>
                  </div>
                `

                  let addresses_fragment = `
                  <div class="sub-section" style="display: flex; flex-direction: column;">
                     <div class="label">Addresses</div>
                     <div style="display: flex; flex-direction: column; border: none;"></div>
                 
                `

                  for (let i = 0; i < element.addresses.length; i++) {
                     let address = JSON.parse(element.addresses[i])
                     let label = ""
                     if (containsIPv4(address.addr)) {
                        label = "IPv4"
                     } else if (containsIPv6(address.addr)) {
                        label = "IPv6"
                     }

                     addresses_fragment += `
                        <div class="sub-section">
                           <div class="label">${label}</div>
                           <div class="value">${address.addr}</div>
                        </div>
                     `
                  }

                  addresses_fragment += `</div>`

                  // Here I will display the external ip address.
                  let external_ip_address_fragment = `
                  <div class="sub-section">
                     <div class="label">Public IP address</div>
                     <div class="value">${this.globule.config.ExternalIpAddress}</div>
                  </div>
                  `

                  let div = document.createElement("div")
                  div.slot = "network-interface"

                  div.innerHTML = mac_address_fragment + addresses_fragment + external_ip_address_fragment
                  this.appendChild(div)
               }

            }
         });

      }, (error) => {
         console.log(error)
      })
   }


}

customElements.define('globular-general-configuration-manager', GeneralConfigurationManager)

// Get the stats of the globule.
function getStats(address, callback, errorcallback) {

   let url = `http://${address}`

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


