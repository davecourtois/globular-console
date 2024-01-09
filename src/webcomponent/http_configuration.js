/**
 * Use to display the network interface.
 */
export class HttpConfigurationManager extends HTMLElement {

    // Create the applicaiton view.
    constructor(globule) {

        super()

        // Keep reference to the globule.
        this.globule = globule
        
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });


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
               <div class="title">CORS Policies</div>
               <slot name="cors-policies"></slot>
            </div>
            
         </div>
         `

        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        // Display general http configuration infos.
        this.displayGenealInfos()

        // Display CORS configuration.
        this.displayCorsConfiguration()

    }

    displayCorsConfiguration() {
        let allowed_origins_fragment = `
        <div class="sub-section">
            <div class="label">Allowed origins</div>
            <div style="display: flex; flex-direction: column">
            `
        for (let i = 0; i < this.globule.config.AllowedOrigins.length; i++) {
            allowed_origins_fragment += `<div class="value">${this.globule.config.AllowedOrigins[i]}</div>`
        }

        allowed_origins_fragment += `
            </div></div>
     `

        let allowed_methods_fragment = `
        <div class="sub-section">
            <div class="label">Allowed methods</div>
            <div style="display: flex; flex-direction: column">
            `
        for (let i = 0; i < this.globule.config.AllowedMethods.length; i++) {
            allowed_methods_fragment += `<div class="value">${this.globule.config.AllowedMethods[i]}</div>`
        }

        allowed_methods_fragment += `
            </div></div>
        `

        let allowed_headers_fragment = `
        <div class="sub-section">
            <div class="label">Allowed headers</div>
            <div style="display: flex; flex-direction: column">
            `
        for (let i = 0; i < this.globule.config.AllowedHeaders.length; i++) {
            allowed_headers_fragment += `<div class="value">${this.globule.config.AllowedHeaders[i]}</div>`
        }

        allowed_headers_fragment += `
            </div></div>
        `

        let div = document.createElement("div")
        div.slot = "cors-policies"

        div.innerHTML = allowed_origins_fragment + allowed_methods_fragment + allowed_headers_fragment
        this.appendChild(div)

    }

    displayGenealInfos() {


      // The actual protocol.
      let protocol_fragment = `
      <div class="sub-section">
         <div class="label">Protocol</div>
         <div class="value">${this.globule.config.Protocol}</div>
      </div>
      `

      // The actual port.
      let port_fragment = `
      <div class="sub-section">
         <div class="label">Port Https</div>
         <div class="value">${this.globule.config.PortHttps}</div>
      </div>
      <div class="sub-section">
            <div class="label">Port Http</div>
            <div class="value">${this.globule.config.PortHttp }</div>
      </div>
      `

      // The default index application.
      let index_application_fragment = `
      <div class="sub-section">
         <div class="label">Index application</div>
         <div class="value">${this.globule.config.IndexApplication.length > 0 ? this.globule.config.IndexApplication : "NA"}</div>
      </div>
      `

      let div = document.createElement("div")
      div.slot = "general-infos"

      div.innerHTML = protocol_fragment + port_fragment + index_application_fragment
      this.appendChild(div)

    }

}

customElements.define('globular-http-config-manager', HttpConfigurationManager)