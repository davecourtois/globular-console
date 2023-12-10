/**
 * This will be use to manage the general configuration of a given globule.
 */
export class ClusterConfigurationManager extends HTMLElement {
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
                 <div style="flex; flex-direction: row;">
                   <slot name="dns-config"></slot>
                   <slot name="peers-config"></slot>
                 </div>
             </div>
         </div>
         `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")
        // Create the dns configuration manager.
        this.dnsConfigurationManager = new DnsConfigurationManager(this.globule)
        this.dnsConfigurationManager.slot = "dns-config"
        this.appendChild(this.dnsConfigurationManager)

        // Create the peers configuration manager.
        this.peersConfigurationManager = new PeersConfigurationManager(this.globule)
        this.peersConfigurationManager.slot = "peers-config"
        this.appendChild(this.peersConfigurationManager)

    }

    // The connection callback.
    connectedCallback() {

    }

}

customElements.define('globular-cluster-configuration-manager', ClusterConfigurationManager)

/**
* This will be use to manage the general configuration of a given globule.
*/
export class PeersConfigurationManager extends HTMLElement {
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

             /* Any custom styling for your code block */
             @import url('./styles.css');
 
             #content {
                 display: flex;
                 background-color: var(--surface-color);
                 padding: 1rem;
                 border-radius: 0.5rem;
                 margin: 1rem;
                 margin-left: 0rem;
 
                 flex-direction: column;
             }

         </style>
         <div id="content">
             <div id="title">
                 <span>Peers Configuations</span>
             </div>
             <div style="display: flex; flex-direction: row;">
                <div class="peers-lst">
                    <span>Connected Peers</span>
                    <div>
                    </div>
                </div>
                <div style="display: flex; flex-direction:column;">
                    <paper-icon-button id="add-btn" icon="icons:arrow-forward"></paper-icon-button>
                    <paper-icon-button id="remove-btn" icon="icons:arrow-back"></paper-icon-button>
                </div>
                <div class="peers-lst">
                    <span>Potential Peers</span>
                    <div >
                    </div>
                </div>
             </div>
         </div>
         `

    }

    // The connection callback.
    connectedCallback() {

    }

}

customElements.define('globular-peers-configuration-manager', PeersConfigurationManager)


/**
 * Set DNS configuration.
 */
export class DnsConfigurationManager extends HTMLElement {
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
            /* Any custom styling for your code block */
            @import url('./styles.css');

            #content {
                display: flex;
                background-color: var(--surface-color);
                padding: 1rem;
                border-radius: 0.5rem;
                margin: 1rem;
                margin-left: 0rem;

                flex-direction: column;
            }

            #content input {
                flex-grow: 1;
                margin-left: 1rem;
                margin-right: 1rem;
                border: none;
                border-bottom: 1px solid var(--divider-color);
                background-color: transparent;
                outline: none;
                font-size: 1rem;
            }

            .label {
                margin-right: 1rem;
            }

         </style>
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span class="label">Domain Name Sever Configurations (DNS)</span>
                <span style="flex-grow: 1;"></span>
                <paper-icon-button id="info-btn" icon="icons:info-outline"></paper-icon-button>
            </div>

            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span class="label">Server Address</span>
                <input id="server-address" label="Server Address" value="${globule.config.DNS}"></input>
            </div>
         </div>
         `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")


    }

    // The connection callback.
    connectedCallback() {

    }

}

customElements.define('globular-dns-configuration-manager', DnsConfigurationManager)