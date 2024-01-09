import { AppComponent } from '../app/app.component'
import '@polymer/iron-icons/av-icons'
import '@polymer/paper-button/paper-button.js';
import { displayAuthentication, displayError, displaySuccess } from './utility';
import { StartServiceInstanceRequest, StopServiceInstanceRequest } from 'globular-web-client/services_manager/services_manager_pb';

/**
 * The services manager.
 */
export class ServicesManager extends HTMLElement {
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

            #title {
                font-size: 1.2rem;
                margin-left: 1rem;
                margin-right: 1rem;
                flex-grow: 1;
            }

            #services {
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

        </style>
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span id="title">Cluster Services</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
            <div id="services">
            <slot name="services"></slot>
            </div>
        </div>`


    }

    // Called when the element is added to the DOM.
    connectedCallback() {
        // Add the event listeners.
        let services = {}

        // Now I will get the list of available services on the cluster.
        AppComponent.globules.forEach(globule => {

            // subscribe to the services event.
            if (!globule.updateServiceConfigurationListener) {
                globule.eventHub.subscribe("update_globular_service_configuration_evt", (uuid) => {
                    globule.updateServiceConfigurationListener = uuid
                }, (evt) => {
                    let service = JSON.parse(evt)

                    // so here I will publish a custom event.
                    let event = new CustomEvent(`update_${globule.config.Mac}_${service.Id}_configuration_evt`, { detail: service });
                    document.dispatchEvent(event);

                }, false)
            }

            for (var id in globule.config.Services) {
                let service = globule.config.Services[id]
                if (services[service.Id] == null) {
                    services[service.Id] = service
                    let s = new ServiceManager(service)
                    s.id = "_" + service.Id
                    s.slot = "services"
                    s.addGlobule(globule)
                    this.appendChild(s)
                } else {
                    let s = this.querySelector("#_" + service.Id)
                    s.addGlobule(globule)
                }
            }
        })
    }

}

customElements.define('globular-services-manager', ServicesManager)


/**
 * The service manager.
 */
export class ServiceManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(service) {
        super()

        this.service = service


        this.globules = []

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                
                color: var(--primary-text-color);
            }

            .header{
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
            }

            .header > span {
                font-size: 1.2rem;
                margin-left: 1rem;
                margin-right: 1rem;
            }

            #service-name {
                flex-grow: 1;
            }

            paper-icon-button{
                color: var(--secondary-color);
                --paper-icon-button-ink-color: var(--primary-text-color);
            }


            iron-collapse  {
            }

            .collapse-content {
                display: flex;
                flex-direction: column;
                margin-left: 1rem;
                margin-right: 1rem;
                background-color: var(--background-color);
                border-radius: 0.4rem;
            }

            ::slotted(.instances) {
                padding: 1rem;
                padding-top: 0;
                padding-bottom: 0;
                display: flex;
                flex-direction: row;
            }

            ::slotted(.instance-infos){
                padding: 1rem;
                padding-top: 0;
                padding-left: 2rem;
                padding-top: 0;
                display: flex;
                flex-direction: column;
            }


        </style>

        <div id="container">
            <div class="header">
                <paper-icon-button id="collapse-btn" icon="icons:expand-more" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <span id="service-name">${service.Name} <span id="instance" title="number of service instances"></span></span>
            </div>
            <iron-collapse class="subitems" id="collapse-panel" style="display: flex; flex-direction: column;">
                <div class="collapse-content">
                    <slot name="general-infos"></slot>
                    <slot name="instances"></slot>
                    <slot name="instance"></slot>
                </div>
            </iron-collapse>
        </div>
        `

        // give the focus to the input.
        let collapse_btn = this.shadowRoot.querySelector("#collapse-btn")
        let collapse_panel = this.shadowRoot.querySelector("#collapse-panel")
        collapse_btn.onclick = (evt) => {
            evt.stopPropagation();
            if (!collapse_panel.opened) {
                collapse_btn.icon = "expand-less"
            } else {
                collapse_btn.icon = "expand-more"
            }
            collapse_panel.toggle();
        }

    }

    // Add globule to the service.
    addGlobule(globule) {
        let exist = false
        this.globules.forEach(g => {
            if (g.config.Mac == globule.config.Mac) {
                exist = true
            }
        })

        if (!exist) {
            this.globules.push(globule)
            let instance = this.shadowRoot.querySelector("#instance")
            instance.innerHTML = "(" + this.globules.length + ")"

            // Here I will subscribe to the service configuration update event.
            document.addEventListener(`update_${globule.config.Mac}_${this.service.Id}_configuration_evt`, (evt) => {
                // So here I will update the service instance.
                let service = evt.detail

                let servicePidDiv = this.querySelector("#service-pid-div")
                servicePidDiv.innerHTML = service.Process 

                // I will update informations.
                let serviceStateDiv = this.querySelector("#service-state-div")
                serviceStateDiv.innerHTML = service.State

                if(service.State == "running"){
                    let startBtn = this.querySelector("#start-btn")
                    startBtn.style.display = "none"

                    let stopBtn = this.querySelector("#stop-btn")
                    stopBtn.style.display = "block"
                }

            }, false)

        }

        this.innerHTML = ""

        this.displayGeneralInfos()
        this.displayInstances()
    }

    displayInstances() {

        // So each service instance will run on a globule...
        let div = document.createElement('div')
        div.className = "instances"
        div.slot = "instances"

        let instances_fragment = ""

        for (let i = 0; i < this.globules.length; i++) {
            let globule = this.globules[i]
            instances_fragment += `
                <div class="instance-selector">${globule.config.Name}</div>
            `
        }

        div.innerHTML = instances_fragment
        this.appendChild(div)

        // Add the event listeners.
        div.children[0].classList.add("selected")
        this.displayInstanceInfos(this.globules[0])

        // Add the event listeners.
        for (let i = 0; i < div.children.length; i++) {
            let instance = div.children[i]
            instance.onclick = (evt) => {
                evt.stopPropagation();
                for (let j = 0; j < div.children.length; j++) {
                    div.children[j].classList.remove("selected")
                }
                instance.classList.add("selected")
                this.displayInstanceInfos(this.globules[i])
            }
        }

    }

    // Start the service on the given globule.
    startService(globule) {
        console.log("start service" + globule.config.Name, this.service.Id)
        if (globule.token == null) {
            displayAuthentication(`You need to authenticate to start </br>the service ${this.service.Name}</br>on ${globule.config.Name} `, globule,
                () => {
                    // So here I will stop the service.
                    let rqst = new StartServiceInstanceRequest
                    rqst.setServiceId(this.service.Id)

                    // Call the service manager service.
                    globule.servicesManagerService.startServiceInstance(rqst, { token: globule.token }).then(() => {

                        // display the success message
                        displaySuccess(`Service started ${this.service.Name}`)

                        let startBtn = this.querySelector("#start-btn")
                        startBtn.style.display = "none"

                        let stopBtn = this.querySelector("#stop-btn")
                        stopBtn.style.display = "block"

                    }).catch(err => {
                        displayError(err)
                    })

                },
                err => {
                    displayError(err)
                })
        }else{
            // So here I will stop the service.
            let rqst = new StartServiceInstanceRequest
            rqst.setServiceId(this.service.Id)

            // Call the service manager service.
            globule.servicesManagerService.startServiceInstance(rqst, { token: globule.token }).then(() => {

                // display the success message
                displaySuccess(`Service started ${this.service.Name}`)

                let startBtn = this.querySelector("#start-btn")
                startBtn.style.display = "none"

                let stopBtn = this.querySelector("#stop-btn")
                stopBtn.style.display = "block"

            }).catch(err => {
                displayError(err)
            })
        }
    }

    // Stop the service on the given globule.
    stopService(globule) {
       
        if (globule.token == null) {
            displayAuthentication(`You need to authenticate to stop </br>the service ${this.service.Name}</br>on ${globule.config.Name} `, globule,
                () => {
                    // So here I will stop the service.
                    let rqst = new StopServiceInstanceRequest
                    rqst.setServiceId(this.service.Id)

                    // Call the service manager service.
                    globule.servicesManagerService.stopServiceInstance(rqst, { token: globule.token }).then(() => {

                        // display the success message
                        displaySuccess(`Service stopped ${this.service.Name}`)

                        let startBtn = this.querySelector("#start-btn")
                        startBtn.style.display = "block"

                        let stopBtn = this.querySelector("#stop-btn")
                        stopBtn.style.display = "none"

                    }).catch(err => {
                        displayError(err)
                    })

                },
                err => {
                    displayError(err)
                })
        }else{
            // So here I will stop the service.
            let rqst = new StopServiceInstanceRequest
            rqst.setServiceId(this.service.Id)

            // Call the service manager service.
            globule.servicesManagerService.stopServiceInstance(rqst, { token: globule.token }).then(() => {

                // display the success message
                displaySuccess(`Service stopped ${this.service.Name}`)

                let startBtn = this.querySelector("#start-btn")
                startBtn.style.display = "block"

                let stopBtn = this.querySelector("#stop-btn")
                stopBtn.style.display = "none"

            }).catch(err => {
                displayError(err)
            })
        }
    }

    // Display the service instance for a given globule.
    displayInstanceInfos(globule) {
        let service = globule.config.Services[this.service.Id]

        let id = "_" + service.Id.replaceAll(":", "_") + "_" + globule.config.Mac.replaceAll(":", "_")
        if (this.querySelector("#" + id) != null) {
            return
        }

        let divs = this.querySelectorAll(".instance-infos")
        for (let i = 0; i < divs.length; i++) {
            divs[i].parentNode.removeChild(divs[i])
        }

        let div = document.createElement('div')
        div.className = "instance-infos section"
        div.slot = "instance"
        div.id = id

        let instance_fragment = `
            <div class="title"  style="display: flex;">
                <div style="flex-grow: 1;">Instance</div>
                <paper-button id="start-btn" style="font-size: .95rem; text-align: center; display:${service.State != 'running' ? 'block' : 'none'}">Start</paper-button>
                <paper-button id="stop-btn" style="font-size: .95rem; text-align: center; display:${service.State == 'running' ? 'block' : 'none'}">Stop</paper-button>
            </div>

            <div style="display: flex; flex-direction: column;">
        `

        // display the service state.
        instance_fragment += `
            <div class="sub-section">
                <div class="label">State</div>
                <div id="service-state-div" class="value">${service.State}</div>
            </div>
        `

        // display the service Pid.
        instance_fragment += `
            <div class="sub-section">
                <div class="label">Pid</div>
                <div id="service-pid-div" class="value">${service.Pid}</div>
            </div>
        `

        // display the service port.
        instance_fragment += `
            <div class="sub-section">
                <div class="label">Port</div>
                <div class="value">${service.Port}</div>
            </div>
        `

        // display service keep alive.
        instance_fragment += `
            <div class="sub-section">
                <div class="label">Keep Alive</div>
                <div class="value">${service.KeepAlive}</div>
            </div>
        `

        // display service keep up to date.
        instance_fragment += `
            <div class="sub-section">
                <div class="label">Keep Up To Date</div>
                <div class="value">${service.KeepUpToDate}</div>
            </div>
        `


        // display the service id.
        div.innerHTML = instance_fragment
        this.appendChild(div)

        // Add the event listeners.
        let start_btn = div.querySelector("#start-btn")
        let stop_btn = div.querySelector("#stop-btn")
        start_btn.onclick = (evt) => {
            evt.stopPropagation();
            this.startService(globule)
        }

        stop_btn.onclick = (evt) => {
            evt.stopPropagation();
            this.stopService(globule)
        }

    }


    // display service general informations.
    displayGeneralInfos() {
        let general_infos_fragment = `
            <div class="title">General</div>
            <div style="display: flex; flex-direction: column;">
        `

        // display the service name.
        general_infos_fragment += `
            <div class="sub-section">
                <div class="label">Name</div>
                <div class="value">${this.service.Name}</div>
            </div>
        `

        // display the service id.
        general_infos_fragment += `
            <div class="sub-section">
                <div class="label">Id</div>
                <div class="value">${this.service.Id}</div>
            </div>
        `

        // display the service description.
        general_infos_fragment += `
            <div class="sub-section">
                <div class="label">Description</div>
                <div class="value">${this.service.Description}</div>
            </div>
        `

        // display the service version.
        general_infos_fragment += `
            <div class="sub-section">
                <div class="label">Version</div>
                <div class="value">${this.service.Version}</div>
            </div>
        `

        // display the publisher id
        general_infos_fragment += `
            <div class="sub-section">
                <div class="label">Publisher Id</div>
                <div class="value">${this.service.PublisherId}</div>
            </div>
        `

        // Display the list of dependencies.
        general_infos_fragment += `
            <div class="sub-section">
                <div class="label">Dependencies</div>
                <div style="display: flex; flex-direction: column">
        `

        for (let i = 0; i < this.service.Dependencies.length; i++) {
            general_infos_fragment += `<div class="value">${this.service.Dependencies[i]}</div>`
        }

        if (this.service.Dependencies.length == 0) {
            general_infos_fragment += `<div class="value">None</div>`
        }

        general_infos_fragment += `
                </div>
            </div>
        `

        general_infos_fragment += `</div>`

        let div = document.createElement('div')
        div.classList.add("section")
        div.innerHTML = general_infos_fragment
        div.slot = "general-infos"
        this.appendChild(div)
    }
}

customElements.define('service-manager', ServiceManager)