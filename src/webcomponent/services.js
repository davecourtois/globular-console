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
                    <slot name="descriptor"></slot>
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

                if (service.State == "running") {
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
        this.displayServiceDescription()
    }


    // Display the service description.
    displayServiceDescription() {
        if (this.service == null) {
            return
        }

        if (this.globules.length == 0) {
            return
        }

        // I will get the service descriptor from the first globule.
        let globule = this.globules[0]

        let id = "_" + this.service.Id.replaceAll(":", "_") + "_descriptor"

        if (this.querySelector("#" + id) != null) {
            return
        }

        let address = globule.config.Name + "." + globule.config.Domain
        if (window.location.protocol == "http:") {
            address = "http://" + address + ":" + globule.config.PortHttp
        } else {
            address = "https://" + address + ":" + globule.config.PortHttps
        }

        // I will get the service descriptor.
        address += "/get_service_descriptor?id=" + this.service.Id

        // I will get the service descriptor.

        let xttpRequest = new XMLHttpRequest();
        xttpRequest.open("GET", address, true);
        xttpRequest.responseType = "json";

        xttpRequest.onload = () => {
            let serviceDescriptor = xttpRequest.response
            // so from the descriptor I will display the service description.
            serviceDescriptor.ProtoBody.forEach(element => {
                if (this.service.Name.endsWith(element.ServiceName)) {

                    //  be sure that the descriptor is not already displayed.
                    if (this.querySelector("#" + id) != null) {
                        return
                    }

                    // Create a new service descriptor.
                    let descriptor = new ServiceDesciptor(element, serviceDescriptor)

                    // Add the descriptor to the service manager.
                    descriptor.id = id
                    descriptor.slot = "descriptor"

                    this.appendChild(descriptor)
                }
            });

        }

        xttpRequest.send();

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
        } else {
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
        } else {
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


/**
 * Display service method and messages. It also allow to configure
 * load balancing policy at method level. (round robin, random, ...)
 */
export class ServiceDesciptor extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(serviceDescriptor, descriptor) {
        super()

        this.descriptor = descriptor
        this.serviceDescriptor = serviceDescriptor

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

            .title {
                font-size: 1.2rem;
                margin-left: 1rem;
                margin-right: 1rem;
                flex-grow: 1;
            }

            .sub-title {
                font-size: 1rem;
                margin-left: 1.5rem;
                margin-right: 1rem;
                flex-grow: 1;
            }

        </style>

        <div id="content">
            <div class="title" style="display: flex; align-items:center;">API <span id="number-of-methods" style="font-size: .95rem; padding-left: .5rem;"></span></div>
            <div class="sub-title"></div>
            <div style="display: flex; flex-direction: column;"> 
                <slot name="api"></slot>
            </div>

        </div>
        `

        if (this.serviceDescriptor.ServiceBody != null) {
            let comment = this.displayComments(this.serviceDescriptor.Comments)
            if (comment != "") {
                comment = "<div style='display: flex; flex-direction: column;'>" + comment + "</div>"
                this.shadowRoot.querySelector(".sub-title").innerHTML = comment
            }
            this.displayAPI(this.serviceDescriptor.ServiceBody)
        }

        // display the number of methods.
        let number_of_methods = this.shadowRoot.querySelector("#number-of-methods")
        // the number of methods is the number of child with slot name api.
        let number = this.querySelectorAll("[slot='api']").length

        number_of_methods.innerHTML = "(" + number + ")"
    }

    // This will return the string with the comments.
    displayComments(comments) {
        let comment = ""
        if (comments) {
            comments.forEach((c, index) => {
                if (c.Raw) {
                    comment += c.Raw.replaceAll("//", "").replaceAll("/**", "").replaceAll("**/", "").replaceAll("/*", "").replaceAll("*/", "").trim()

                    // remove the leading * if any.
                    if (comment.startsWith("*")) {
                        comment = comment.substring(1).trim()
                    }

                    if (index < comments.length - 1) {
                        if (comment != "") {
                            comment += "</br>"
                        }
                    }
                }
            })
        }
        return comment
    }

    // This will display the enum.
    displayEnum(enumBody) {
        let fragment = `
        <div style= "display: table; padding-left: 1rem;">
            <div style="display: table-row">
                <div style="display: table-cell; padding-right: 1rem; font-size: .75rem;">Name</div>
                <div style="display: table-cell; padding-right: 1rem; font-size: .75rem;">Number</div>
            </div>
          `

        enumBody.forEach(element => {
            fragment +=
                `<div style="display: table-row">
            <div style="display: table-cell; padding-right: 1rem;">${element.Ident}</div>
            <div style="display: table-cell; padding-right: 1rem;">${element.Number}</div>`

            fragment += `</div>` // end of the table row.
        })

        return fragment + "</div>"
    }

    displayFieldType(type) {
        // Number types.
        if (type == "int32" || type == "int64" || type == "uint32" || type == "uint64" || type == "sint32" || type == "sint64" || type == "fixed32" || type == "fixed64" || type == "sfixed32" || type == "sfixed64" || type == "float" || type == "double") {
            return type
        }

        // String types.
        if (type == "string") {
            return "string"
        }

        // Boolean types.
        if (type == "bool") {
            return "boolean"
        }

        // Bytes types.
        if (type == "bytes") {
            return "bytes"
        }

        // So here I will test if the type is a message or an enum.
        let type_fragment = type

        // Here I will retreive the message from the descriptor.
        let message = null;
        this.descriptor.ProtoBody.forEach(element => {
            if (element.MessageName == type) {
                message = element
            }
        });

        if (message != null) {
            // So here I will check if the type is a message.
            type_fragment = `
            <style>
                iron-icon {
                    --iron-icon-width: 1.2rem;
                    --iron-icon-height: 1.2rem;
                    color: var(--secondary-color);
                    cursor: pointer;
                    padding-left: .5rem;
                }

                iron-icon:hover + paper-card {
                    display: block;
                }

                paper-card {
                    padding: 1rem;
                    background-color: var(--surface-color);
                    border-radius: 0.5rem;
                    box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.2);
                    z-index: 1;
                    display: none;
                    position: absolute; 
                    top: 24px; 
                    left: 12px;
                }

            </style>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <span>${type}</span>
                <div style="position: relative; display: flex; flex-direction: row; align-items: center;">
                    <iron-icon icon="icons:info-outline" style="padding-left: .5rem; cursor: pointer;"></iron-icon>
                    <paper-card style="">
                        ${this.displayFieldFields(message.MessageBody)}
                    </paper-card>
                </div>
            </div>
        `
        } else {

            // So here I will check if the type is an enum.
            let enumType = null;
            this.descriptor.ProtoBody.forEach(element => {
                if (element.EnumName == type) {
                    enumType = element
                }
            });

            if (enumType != null) {
                type_fragment = `
                <style>
    
                    paper-card {
                        padding: 1rem;
                        background-color: var(--surface-color);
                        border-radius: 0.5rem;
                        box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.2);
                        z-index: 1;
                        display: none;
                        position: absolute; 
                        top: 24px; 
                        left: 12px;
                    }
    
                </style>
                <div style="display: flex; flex-direction: column; align-items: flex-start;">
                    <span>${type}</span>
                    <div style="font-size: .85rem;">
                        ${this.displayEnum(enumType.EnumBody)}
                    </div>
                </div>
            `
            }
        }

        return type_fragment
    }

    displayFieldFields(fields) {
        if (!fields) {
            return ""
        }

        // Display the one of...
        if (fields[0].OneofFields) {
            let oneof = fields[0].OneofName
            fields = fields[0].OneofFields // one of fields.
            for (let i = 0; i < fields.length; i++) {
                fields[i].FieldName = oneof + " -> " + fields[i].FieldName
                fields[i].IsOptional = "false"
                fields[i].IsRepeated = "false"
                fields[i].IsRequired = "false"
            }
        }

        // options are IsReapeted, IsRequired, IsOptional
        // The options will be displayed as css table whit
        // the following columns: reapeated, required, optional,
        let fragment = `
        <div style= "display: table; padding-left: 1rem;">
            <div style="display: table-row">
                <div style="display: table-cell; padding-right: 1rem; font-size: .75rem;">Name</div>
                <div style="display: table-cell; padding-right: 1rem; font-size: .75rem;">Type</div>
                <div style="display: table-cell; padding-right: 1rem; font-size: .75rem;">Repeated</div>
                <div style="display: table-cell; padding-right: 1rem; font-size: .75rem;">Required</div>
                <div style="display: table-cell; padding-right: 1rem; font-size: .75rem;">Optional</div>
                <div style="display: table-cell; padding-right: 1rem; font-size: .75rem;">Comment</div>
            </div>
          `

        fields.forEach(field => {

            fragment +=
                `<div style="display: table-row">
            <div style="display: table-cell; padding-right: 1rem;">${field.FieldName}</div>
            <div style="display: table-cell; padding-right: 1rem;">${this.displayFieldType(field.Type)}</div>
            <div style="display: table-cell; padding-right: 1rem;">${field.IsRepeated}</div>
            <div style="display: table-cell; padding-right: 1rem;">${field.IsRequired}</div>
            <div style="display: table-cell; padding-right: 1rem;">${field.IsOptional}</div>`

            if (field.InlineComment) {
                let inlineComment = field.InlineComment.Raw.replaceAll("//", "").trim()
                if (inlineComment != "") {
                    inlineComment = "<div style='display: table-cell; font-style: italic; font-weight: 200; font-size: .9rem; min-width: 200px;'>" + inlineComment + "</div>"
                }
                fragment += inlineComment
            } else {
                fragment += `<div style="display: table-cell; padding-right: 1rem;"></div>`
            }

            fragment += `</div>` // end of the table row.
        })

        return fragment + "</div>"
    }

    // This will display the response information.
    displayResponse(response) {
        let rsp = null;

        // firt of all I will retreive the response from the descriptor.
        this.descriptor.ProtoBody.forEach(element => {
            if (element.MessageName == response.MessageType) {
                rsp = element
            }
        });

        if (rsp == null) {
            return ""
        }

        let response_fragment = `
            <div class="title" style="padding-top: 0.5rem; font-size: 1rem; padding-left: 1rem;">Response</div>
            <div style="display: flex; flex-direction: column; padding-left: 1rem;">
                <div class="sub-title" style="font-size: 1rem; padding-left: 1rem; display: flex; flex-direction: row; align-items: center;">${rsp.MessageName} <span style="padding-left: 1rem; color: var(--secondary-color); display: ${response.IsStream ? 'block' : 'none'};">(stream)</span></div>
        `

        // display the response fields.
        response_fragment += `
            <div class="sub-section" style="padding-left: 2rem;">
                <div class="label">Fields</div>
                <div style="display: flex; flex-direction: column">
        `

        if (rsp.MessageBody == null) {
            return response_fragment + `None</div> </div>`
        }

        response_fragment += this.displayFieldFields(rsp.MessageBody)

        return response_fragment + `
                </div> </div> </div>
                `
    }


    // This will return the string with the request information.
    displayRequest(request) {
        let rqst = null;

        // firt of all I will retreive the request from the descriptor.
        this.descriptor.ProtoBody.forEach(element => {
            if (element.MessageName == request.MessageType) {
                rqst = element
            }
        });

        if (rqst == null) {
            return ""
        }

        let request_fragment = `
            <div class="title" style="padding-top: 0.5rem; font-size: 1rem; padding-left: 1rem;">Request</div>
            <div style="display: flex; flex-direction: column; padding-left: 1rem;">
                <div class="sub-title" style="font-size: 1rem; padding-left: 1rem; display: flex; flex-direction: row; align-items: center;">${rqst.MessageName} <span style="padding-left: 1rem; color: var(--secondary-color); display: ${request.IsStream ? 'block' : 'none'};">(stream)</span></div>
        `

        // display the request fields.
        request_fragment += `
            <div class="sub-section" style="padding-left: 2rem;">
                <div class="label">Fields</div>
                <div style="display: flex; flex-direction: column">
        `

        if (rqst.MessageBody == null) {
            return request_fragment + `None</div> </div>`
        }

        request_fragment += this.displayFieldFields(rqst.MessageBody)

        return request_fragment + `
                </div> </div> </div>
        `
    }

    // display the service description.
    displayAPI(methods) {
        methods.forEach(method => {
            let comment = ""
            if (method) {
                let comments = this.displayComments(method.Comments)
                if (comments != "") {
                    comment = "<div style='display: flex; flex-direction: column;'>" + comments + "</div>"
                }


                let method_fragment = `

                <div style="display: flex; align-items: center;">
                    <paper-icon-button id="collapse-btn" icon="icons:expand-more" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                    <div class="title" style="font-size: 1rem;">${method.RPCName}</div>
                </div>
                
                <iron-collapse class="subitems" id="collapse-panel" style="display: flex; flex-direction: column; padding-left: 2rem;">
                    <div class="sub-title">${comment}</div>
                    <div style="display: flex; flex-direction: column;">
                `

                // display the request.
                method_fragment += this.displayRequest(method.RPCRequest)

                // display the response.
                method_fragment += this.displayResponse(method.RPCResponse)

                method_fragment += `
                    </iron-collapse>
                </div>
                `

                let div = document.createElement('div')
                div.innerHTML = method_fragment
                div.style.paddingTop = "0"
                div.style.paddingBottom = "0"
                div.slot = "api"
                this.appendChild(div)

                // now the colloapse button.
                let collapse_btn = div.querySelector("#collapse-btn")
                let collapse_panel = div.querySelector("#collapse-panel")
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
        })
    }

}

customElements.define('globular-service-descriptor', ServiceDesciptor)

