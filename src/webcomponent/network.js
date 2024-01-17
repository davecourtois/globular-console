import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-icons/communication-icons'
import '@polymer/iron-icons/editor-icons'
import "@polymer/paper-spinner/paper-spinner.js";

import { SystemMonitor } from "./systemMonitor.js"
import { ConfigurationManager } from "./configuration.js"
import { Globular } from 'globular-web-client';
import { getAvailableHostsRequest } from 'globular-web-client/admin/admin_pb';
import { displayError, displaySuccess } from './utility';
import { AppComponent } from '../app/app.component';


let scanFct = (row) => {

    const waitSpinner = row.querySelector('paper-spinner')
    const input = row.querySelector('input')
    const address = input.value
    const refreshBtn = row.querySelector(`#${row.id}-refresh-btn`)

    waitSpinner.active = true
    waitSpinner.style.display = "block"
    input.disabled = true
    refreshBtn.style.display = "none"

    // I will test if the address is valid.
    let url = window.location.protocol + address + "/config"

    // I will test if the globule is already in the list.
    let globule = new Globular(url, () => {

        // now I will scan the local network and try to find other globules.
        let rqst = new getAvailableHostsRequest()
        globule.adminService.getAvailableHosts(rqst, {}).then((response) => {
            // I will clear the list of globules.
            document.querySelector("globular-cluster-manager").clear()

            // I will keep the globule in the local store
            for (let i = 0; i < response.getHostsList().length; i++) {
                let host = response.getHostsList()[i]
                let event = new CustomEvent('displayHostEvent', { detail: { host: host } });
                document.dispatchEvent(event);
            }

            input.disabled = true;
            waitSpinner.active = false
            waitSpinner.style.display = "none"
            refreshBtn.style.display = ""

            // I will keep the address in the local store.
            let addresses = localStorage.getItem("addresses")
            if (addresses == null) {
                addresses = []
            } else {
                addresses = JSON.parse(addresses)
            }
            // I will add the address if it is not already in the list.
            if (addresses.indexOf(address) == -1) {
                addresses.push(address)
            }

            localStorage.setItem("addresses", JSON.stringify(addresses))

            // I will set the row id.
            let id = "address-row-" + address.replace(/\./g, "-")
            row.id = id
            input.select()

        }).catch((err) => {
            displayError(err)
            input.disabled = false
            waitSpinner.active = false
            refreshBtn.style.display = ""
            waitSpinner.style.display = "none"
            input.select()
        })

    }, err => {
        input.disabled = false
        waitSpinner.active = false
        refreshBtn.style.display = ""
        waitSpinner.style.display = "none"
        displayError(err)

        // I will select the input text.
        input.select()
    })

}

/**
 * This class will be used as entry point for finding globules or potential hosts.
 * If globular is on the host then it will be added to the list of globules.
 */
export class NetworkAddressManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

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

                flex-direction: column;
            }

            .label {
                font-size: 1rem;
                margin-left: 1rem;
                flex-grow: 1;
            }

            #address-list {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                padding: 1rem;
            }

            .address-row {
                display: flex;
                flex-direction: row;
                align-items: center;
            }

            .address-row input {
                flex-grow: 1;
                margin-left: 1rem;
                margin-right: 1rem;

                border: none;
                border-bottom: 1px solid var(--divider-color);
                background-color: transparent;

                /* Remove the outline */
                outline: none;

                font-size: 1rem;
            }

            .address-row input:focus {
                border-bottom: 1px solid var(--primary-color);
            }

            .address-row label {
                font-size: 1rem;
                margin-left: 1rem;
            }

            #wait-spinner {
                display: none;
            }


        </style>
       
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <paper-icon-button id="add-item-btn" icon="icons:add"></paper-icon-button>
                <span class="label">Enter the network addresses to scan for host's</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline"></paper-icon-button>
            </div>

            <div id="address-list">
            </div>


        </div>
        `
        const addBtn = this.shadowRoot.querySelector('#add-item-btn')


        addBtn.addEventListener('click', () => {
            let row = this.createRow("new")
        })
    }

    createRow(address) {

        // I will test if the address is already in the list.
        let id = "address-row-" + address.replace(/\./g, "-")

        // I will test if the row already exists.
        let row = this.shadowRoot.querySelector('#' + id)
        if (row) {
            return row
        }

        let html = `
        <div id="${id}" class="address-row">
            <label>Address</label>
            <input label="Address"></input>
            <paper-icon-button id="${id}-refresh-btn" icon="icons:refresh"></paper-icon-button>
            <paper-spinner id="${id}-wait-spinner" ></paper-spinner>
            <paper-icon-button id="${id}-delete-btn" icon="icons:delete"></paper-icon-button>
        </div>
        `
        const addressList = this.shadowRoot.querySelector('#address-list')
        if (address == "new") {
            addressList.insertAdjacentHTML('afterbegin', html)
        } else {
            addressList.insertAdjacentHTML('beforeend', html)
        }
        const input = addressList.querySelector('input')

        const refreshBtn = addressList.querySelector(`#${id}-refresh-btn`)

        row = addressList.querySelector('#' + id)

        // I will also set the action when the user press the enter key.
        refreshBtn.addEventListener('click', () => {
            scanFct(row)
        })

        input.addEventListener('keyup', (event) => {
            if (event.keyCode === 13) {
                event.preventDefault();
                scanFct(row)
            }
        })

        const deleteBtn = addressList.querySelector(`#${id}-delete-btn`)
        deleteBtn.addEventListener('click', () => {
            console.log("Delete")
        })

        return row
    }

    connectedCallback() {

        // I will load the addresses from the local storage.
        let addresses = localStorage.getItem("addresses")
        let rows = []
        if (addresses) {
            addresses = JSON.parse(addresses)
            for (let i = 0; i < addresses.length; i++) {
                let row = this.createRow(addresses[i])
                row.querySelector('input').value = addresses[i]
                rows.push(row)
            }
        }

        if (AppComponent.hosts.length > 0) {
            AppComponent.hosts.forEach((host) => {
                let event = new CustomEvent('displayHostEvent', { detail: { host: host } });
                document.dispatchEvent(event);
            });

        } else {
            rows.forEach((row) => {
                scanFct(row)
            });
        }

    }
}

customElements.define('globular-network-address-manager', NetworkAddressManager)


/**
 * This class will be used to manage the globules or potential globule(s) found on the network.
 */
export class GlobulesManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
        @import url('./styles.css');
   
        #content {
            display: none;
            background-color: var(--surface-color);
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem;

            flex-direction: column;
        }

        #title {
            font-size: 1.2rem;
            margin-left: 1rem;
            margin-right: 1rem;
            flex-grow: 1;
        }

        #hosts {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
        }

        </style>

        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span id="title">Connected Devices</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline"></paper-icon-button>
            </div>
            <div id="hosts">
                <slot name="hosts"></slot>
            </div>
        </div>
        `

        document.addEventListener('displayHostEvent', (event) => {
            this.shadowRoot.querySelector("#content").style.display = "block"
            this.displayHost(event.detail.host)

            document.querySelector("globular-cluster-manager").style.display = "block"
        });



    }

    // The connected callback
    connectedCallback() {

    }

    displayHost(host) {

        // I will test if the panel is not already in the list.
        let id = "_" + host.getMac().replace(/:/g, "-")
        let hostPanel = document.querySelector('#' + id)

        if (!hostPanel) {
            // I will create the host panel.
            hostPanel = document.createElement("globular-host-panel")
            hostPanel.slot = "hosts"
            hostPanel.setAttribute("draggable", "true")


            hostPanel.addEventListener('dragstart', (e) => {
                // Set the dragged data (can be any data)
                e.dataTransfer.setData('text/plain', hostPanel.id);
            });


            this.appendChild(hostPanel)
        }

        // I will set the host infos.
        hostPanel.setHostInfos(host)

    }
}

customElements.define('globular-globules-manager', GlobulesManager)


/**
 * Thist panel shows the very basic information about the host (name, ip, mac, etc.).
 * to have more information about the host the user must connect to the host.
 */
export class HostPanel extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.globule = null;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            #container {
                user-select: none;
                background-color: var(--surface-color);
                padding: .5rem;
                border-radius: 0.5rem;
                margin: .5rem;
                flex-direction: column;
                position: relative;
                width: 200px;
                height: 180px;
                box-shadow: 0 0 0 1px var(--separator-color);
            }

            #content {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: end;
                width: 100%;
                height: 100%;
               
            }

            #info-btn {
 
            }

            #content img {
                width: 64px;
                height: 64px; 
                user-drag: none;
                -webkit-user-drag: none;
                user-select: none;
                -moz-user-select: none;
                -webkit-user-select: none;
                -ms-user-select: none;

            }

            #actions {
                width: 100%;
                display: flex;
                flex-direction: row;
                justify-content: flex-end;
                width: 100%;
                position: absolute;
                top: 0px;
                right: 0px;
                color: var(--primary-color);
            }

            #actions-slot {
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                width: 100%;
                position: absolute;
                top: -40px;
                right: 0px;
                color: var(--google-grey-700);
                font-size: .8rem;
            }

        </style>

        <div id="container">
            <div id="actions-slot">
                <slot  name="actions"></slot>
            </div>
            <div id="content">
                <div id="actions">
                    <paper-icon-button id="settings-btn" icon="icons:settings"  style="align-self: flex-start;"></paper-icon-button>
                    <span style="flex-grow: 1;"></span>
                    <paper-icon-button id="info-btn" icon="icons:info-outline"  style="align-self: flex-start;"></paper-icon-button> 
                </div>
                <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                    <div style="position: relative;"> 
                        <img id="connection-status" src="./assets/icons/disconnected.svg" alt="connection status" style="position: absolute; top: 20px; right: -24px; height: 24px; width: 24px;">
                        <img id="host-image" src="./assets/icons/Gnome-fs-server.svg" alt="host"> 
                    </div>
                    <span id="host-name">Host</span>
                    <span id="host-infos">Infos</span>
                    <span id="host-address">Address</span>
                    <span id="host-mac">MAC</span> 
                </div>
            </div>
            <slot></slot>
        </div>
        `
    }

    // Call search event.
    setHostInfos(host) {

        // I will set the id of the container.
        this.id = "_" + host.getMac().replace(/:/g, "-")
        let hostname = host.getName().split(":")[0]
        let infos = host.getInfos()

        if (hostname.length == 0) {
            hostname = "unknown"
            this.shadowRoot.querySelector("#actions").style.display = "none"
        }

        // In that case i will try to connect to the globule... 
        // I will set the connection status.
        this.globule = new Globular("http://" + host.getIp() + "/config", () => {

            this.globule.config.LocalIpAddress = host.getIp()
            this.globule.config.Mac = host.getMac() // also set the mac address...

            if (!this.globule.config) {
                return
            }

            // here I will emit globule evt.
            let event = new CustomEvent('globule_connection_evt', { detail: { globule: this.globule } });
            document.dispatchEvent(event);

            hostname = this.globule.config.Name.split(":")[0]
            this.shadowRoot.querySelector("#host-name").innerHTML = hostname

            // be sure the panel dosent stay in the list.
            let panels = document.querySelectorAll("globular-host-panel")
            for (let i = 0; i < panels.length; i++) {
                if (panels[i].id == this.id) {
                    panels[i].parentNode.removeChild(panels[i])
                }
            }

            // keep the host panel as reference in the globule.
            this.globule.hostPanel = this

            // set the globule in the cluster manager...
            document.querySelector("globular-cluster-manager").setGlobule(this.globule)

            // I will set the connection status.
            this.shadowRoot.querySelector("#connection-status").src = "./assets/icons/connected.svg"

            // I will display the info button.
            this.shadowRoot.querySelector("#actions").style.display = ""

            // The system info button.
            this.shadowRoot.querySelector("#info-btn").addEventListener('click', () => {
                let id = "_" + this.globule.config.Mac.replace(/:/g, "-") + "-system-info"

                // will do nothing if the system monitor is already displayed.
                if (document.body.querySelector("#" + id)) {
                    return
                }

                // Here I will display system informations...
                let systemInfo = new SystemMonitor(this.globule)
                systemInfo.id = id

                document.body.appendChild(systemInfo)
            })

            // The configuration button.
            this.shadowRoot.querySelector("#settings-btn").addEventListener('click', () => {
                let id = "_" + this.globule.config.Mac.replace(/:/g, "-") + "-settings"

                // will do nothing if the system monitor is already displayed.
                if (document.body.querySelector("#" + id)) {
                    return
                }

                // Here I will display system informations...
                let configuration = new ConfigurationManager(this.globule)
                configuration.id = id

                document.body.appendChild(configuration)
            })

        }, (err) => {
            // I will set the connection status.
            this.shadowRoot.querySelector("#connection-status").src = "./assets/icons/disconnected.svg"

            // I will hide the info button.
            this.shadowRoot.querySelector("#actions").style.display = "none"

        })


        this.shadowRoot.querySelector("#host-name").innerHTML = hostname
        this.shadowRoot.querySelector("#host-address").innerHTML = host.getIp()
        this.shadowRoot.querySelector("#host-mac").innerHTML = host.getMac()
        this.shadowRoot.querySelector("#host-infos").innerHTML = infos

    }
}

customElements.define('globular-host-panel', HostPanel)


