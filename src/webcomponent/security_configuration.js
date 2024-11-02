/**
 * @fileoverview This file contains the {@link SecurityConfigurationManager} class.
 */
export class SecurityConfigurationManager extends HTMLElement {

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
               <div class="title">TLS Certificate</div>
               <slot name="tls-certificate"></slot>
            </div>
            
         </div>
         `

        // display the general configuration.
        this.displayGenealInfos()


        // display the tls certificate.
        this.displayTLSCertificate()

    }

    /**
     * Display general configuration infos.
     */
    displayGenealInfos() {

        let admin_email_fragment = `
        <div class="sub-section">
            <div class="label">Admin email</div>
            <div class="value">${this.globule.config.AdminEmail}</div>
        </div>
        `


        let session_timenout_fragment = `
        <div class="sub-section">
            <div class="label">Session Timeout</div>
            <div class="value">${this.globule.config.SessionTimeout} min.</div>
        </div>
        `

        let div = document.createElement('div')
        div.innerHTML = admin_email_fragment + session_timenout_fragment
        div.slot = "general-infos"

        this.appendChild(div)
    }

    /**
     * Display the TLS certificate.
     */
    displayTLSCertificate() {
        let address = this.globule.config.Name + "." + this.globule.config.Domain
        address = window.location.protocol + "//" + address
        if(window.location.protocol == "https:") {
            address += ":" + this.globule.config.PortHttps
        } else {
            address += ":" + this.globule.config.PortHttp
        }

        let certificate_fragment = `
        <div class="sub-section">
            <div class="label">Certificate</div>
            <a href="${address + "/get_certificate"}" class="value">${this.globule.config.Certificate}</a>
        </div>
        `

        let certificate_authority_fragment = `
        <div class="sub-section">
            <div class="label">Certificate authority</div>
            <a href="${address + "/get_issuer_certificate"}" class="value">${this.globule.config.CertificateAuthorityBundle}</a>
        </div>
        `

        let cert_expiration_delay_fragment = `
        <div class="sub-section">
            <div class="label">Expiration delay</div>
            <div class="value">${this.globule.config.CertExpirationDelay} days</div>
        </div>
        `

        let cert_country_fragment = `
        <div class="sub-section">
            <div class="label">Country</div>
            <div class="value">${this.globule.config.Country}</div>
        </div>
        `

        let cert_State_fragment = `
        <div class="sub-section">
            <div class="label">State</div>
            <div class="value">${this.globule.config.State}</div>
        </div>
        `

        let cert_city_fragment = `
        <div class="sub-section">
            <div class="label">City</div>
            <div class="value">${this.globule.config.City}</div>
        </div>
        `

        let cert_organization_fragment = `
        <div class="sub-section">
            <div class="label">Organization</div>
            <div class="value">${this.globule.config.Organization}</div>
        </div>
        `


        let div = document.createElement('div')
        div.innerHTML = certificate_fragment + certificate_authority_fragment + cert_expiration_delay_fragment + cert_city_fragment + cert_State_fragment + cert_country_fragment + cert_organization_fragment
        div.slot = "tls-certificate"

        this.appendChild(div)
    }

}

customElements.define('globular-security-config-manager', SecurityConfigurationManager)