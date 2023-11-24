import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-icons/communication-icons'
import '@polymer/iron-icons/editor-icons'
import "@polymer/paper-spinner/paper-spinner.js";

import { Globular } from 'globular-web-client';
import { getAvailableHostsRequest } from 'globular-web-client/admin/admin_pb';

export class NetworkAddressManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()

        // Keep list of globule by address.
        this.globules = {}

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        const backgroundColor = this.getAttribute('background-color') || '#f5f2f0';

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
                <paper-icon-button id="add-item-btn" icon="icons:info-outline"></paper-icon-button>
            </div>

            <div id="address-list">
            </div>
        </div>
        `
        const addBtn = this.shadowRoot.querySelector('#add-item-btn')
        addBtn.addEventListener('click', () => {
            let html = `
            <div class="address-row">
                <label>Address</label>
                <input label="Address"></input>
                <paper-icon-button id="refresh-btn" icon="icons:refresh"></paper-icon-button>
                <paper-spinner id="wait-spinner" ></paper-spinner>
                <paper-icon-button id="delete-btn" icon="icons:delete"></paper-icon-button>
            </div>
            `
            const addressList = this.shadowRoot.querySelector('#address-list')
            addressList.insertAdjacentHTML('beforeend', html)

            const waitSpinner = addressList.querySelector('#wait-spinner')
            const input = addressList.querySelector('input')
            const refreshBtn = addressList.querySelector('#refresh-btn')


            let scanFct = (address) => {
                console.log("Scan: " + address)
                waitSpinner.active = true
                waitSpinner.style.display = "block"
                input.disabled = true
                refreshBtn.style.display = "none"

                // so here I will call the scan function.
                console.log("I will create a new globule")
                // it seems the address must be prefixed by https:// otherwise it will not work 
                // because the browser will not allow to connect to the server. So let's run the
                // backend with https.
                let url = "https://" + address + "/config"
                this.globules[address] = new Globular(url, () => {
                    // now I will scan the local network and try to find other globules.
                    let rqst = new getAvailableHostsRequest()
                    this.globules[address].adminService.getAvailableHosts(rqst, {}).then((response) => {
                        console.log(response)
                        for (let i = 0; i < response.getHostsList().length; i++) {
                            let host = response.getHostsList()[i]
                            console.log(host)
                        }

                        input.disabled = false
                        waitSpinner.active = false
                        waitSpinner.style.display = "none"
                        refreshBtn.style.display = ""
                    }).catch((err) => {
                        console.log(err)
                        input.disabled = false
                        waitSpinner.active = false
                        refreshBtn.style.display = ""
                        waitSpinner.style.display = "none"
                    })

                }, err => {
                    input.disabled = false
                    waitSpinner.active = false
                    refreshBtn.style.display = ""
                    waitSpinner.style.display = "none"
                    console.log(err)
                })

            }

            // I will also set the action when the user press the enter key.
            refreshBtn.addEventListener('click', () => {
                scanFct(input.value)

            })


            input.addEventListener('keyup', (event) => {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    scanFct(input.value)
                }
            })

            const deleteBtn = addressList.querySelector('#delete-btn')
            deleteBtn.addEventListener('click', () => {
                console.log("Delete")
            })

            // I will set the focus on the input.
            input.focus()
        })
    }

    connectedCallback() {

    }
}


customElements.define('globular-network-address-manager', NetworkAddressManager)
