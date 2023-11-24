import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-icons/communication-icons'
import '@polymer/iron-icons/editor-icons'
import "@polymer/paper-spinner/paper-spinner.js";
import {SystemMonitor} from  "./systemMonitor.js"

import { Globular } from 'globular-web-client';
import { getAvailableHostsRequest } from 'globular-web-client/admin/admin_pb';
import { displayError, displaySuccess } from './utility';

let scanFct = (row) => {

    const waitSpinner = row.querySelector('#wait-spinner')
    const input = row.querySelector('input')
    const address = input.value
    const refreshBtn = row.querySelector('#refresh-btn')

    waitSpinner.active = true
    waitSpinner.style.display = "block"
    input.disabled = true
    refreshBtn.style.display = "none"

    // it seems the address must be prefixed by https:// otherwise it will not work 
    // because the browser will not allow to connect to the server. So let's run the
    // backend with https.
    let url = "https://" + address + "/config"
    let globule = new Globular(url, () => {
        // now I will scan the local network and try to find other globules.
        let rqst = new getAvailableHostsRequest()
        globule.adminService.getAvailableHosts(rqst, {}).then((response) => {

            // I will keep the globule in the local store
            displaySuccess("Globule found at " + globule.address)
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
                <span class="label">Add new Address</span>
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
            <paper-icon-button id="refresh-btn" icon="icons:refresh"></paper-icon-button>
            <paper-spinner id="wait-spinner" ></paper-spinner>
            <paper-icon-button id="delete-btn" icon="icons:delete"></paper-icon-button>
        </div>
        `
        const addressList = this.shadowRoot.querySelector('#address-list')
        if (address == "new") {
            addressList.insertAdjacentHTML('afterbegin', html)
        } else {
            addressList.insertAdjacentHTML('beforeend', html)
        }
        const input = addressList.querySelector('input')

        const refreshBtn = addressList.querySelector('#refresh-btn')

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

        const deleteBtn = addressList.querySelector('#delete-btn')
        deleteBtn.addEventListener('click', () => {
            console.log("Delete")
        })

        return row
    }

    connectedCallback() {
        // I will load the addresses from the local storage.
        let addresses = localStorage.getItem("addresses")

        if (addresses) {
            addresses = JSON.parse(addresses)
            for (let i = 0; i < addresses.length; i++) {
                let row = this.createRow(addresses[i])
                row.querySelector('input').value = addresses[i]
                // I will scan the address.
                scanFct(row)
            }
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
                <span id="title">Hosts</span>
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
        });
    }

    // The connected callback
    connectedCallback() {

    }

    displayHost(host) {

        // I will test if the panel is not already in the list.
        let id = "_" + host.getMac().replace(/:/g, "-")
        let hostPanel = this.querySelector('#' + id)
        if (!hostPanel) {
            // I will create the host panel.
            hostPanel = document.createElement("globular-host-panel")
            hostPanel.slot = "hosts"

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
                position: absolute;
                top: 0px;
                right: 0px;
                color: var(--primary-color);
            }

            #content img {
                width: 64px;
                height: 64px;
            }


        </style>

        <div id="container">
            <div id="content">
                <paper-icon-button id="info-btn" icon="icons:info-outline"  style="align-self: flex-start;"></paper-icon-button> 
                <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                    <div style="position: relative;"> 
                        <img id="connection-status" src="./assets/icons/disconnected.svg" alt="connection status" style="position: absolute; top: 20px; right: -24px; height: 24px; width: 24px;">
                        <img id="host-image" src="./assets/icons/Gnome-fs-server.svg" alt="host"> 
                    </div>
                    <span id="host-name">Host</span>
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
        if (hostname.length == 0) {
            hostname = "unknown"
            this.shadowRoot.querySelector("#info-btn").style.display = "none"
        } else {
            // In that case i will try to connect to the globule... 
            // I will set the connection status.
            this.globule = new Globular("https://" + host.getName() + "/config", () => {

                // I will set the connection status.
                this.shadowRoot.querySelector("#connection-status").src = "./assets/icons/connected.svg"

                // I will display the info button.
                this.shadowRoot.querySelector("#info-btn").style.display = ""
                this.shadowRoot.querySelector("#info-btn").addEventListener('click', () => {
                    let id = "_" + this.globule.config.Mac.replace(/:/g, "-") + "-system-info"
                    
                    // will do nothing if the system monitor is already displayed.
                    if(document.body.querySelector("#" + id)) {
                        return
                    }

                    // Here I will display system informations...
                    let systemInfo = new SystemMonitor(this.globule)
                    systemInfo.id = id

                    document.body.appendChild(systemInfo)
                })

            }, (err) => {
                // I will set the connection status.
                this.shadowRoot.querySelector("#connection-status").src = "./assets/icons/disconnected.svg"

                // I will hide the info button.
                this.shadowRoot.querySelector("#info-btn").style.display = "none"
               
            })
        }

        this.shadowRoot.querySelector("#host-name").innerHTML = hostname
        this.shadowRoot.querySelector("#host-address").innerHTML = host.getIp()
        this.shadowRoot.querySelector("#host-mac").innerHTML = host.getMac()


    }
}

customElements.define('globular-host-panel', HostPanel)


/**
 * This class will display the globule manager panel.
 */
export class GlobuleManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
        #container {
            background-color: var(--surface-color);
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem;
            flex-direction: column;
            position: relative;
        }

        </style>
        <div id="container">
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

    }

    // Call search event.
    setGlobule(globule) {

    }
}

customElements.define('globular-globule-manager', GlobuleManager)