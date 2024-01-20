import { GetOrganizationsRqst, Organization } from "globular-web-client/resource/resource_pb";
import { AppComponent } from "../app/app.component";
import { displayError } from "./utility.js";

/**
 * Get the organization by id.
 * @param {*} organizationId 
 * @param {*} callback 
 * @returns 
 */
function getOrganizationById(organizationId, callback) {

    let globule = AppComponent.globules[0]
    if (globule == null) {
        displayError("No globule available.")
        return
    }

    let rqst = new GetOrganizationsRqst()
    rqst.setQuery(`{"_id": "${organizationId}"}`)

    let stream = globule.resourceService.getOrganizations(rqst, {})
    let organizations = []
    stream.on('data', function (response) {
        organizations.concat(response.getOrganizationsList())
    })

    stream.on("status", (status) => {
        if (status.code == 0) {
            callback(organizations[0])
        } else {
            displayError(status.details)
        }
    })
}

/**
 * Get the organizations.
 * @param {*} callback 
 * @returns 
 */
function getOrganizations(callback) {

    let globule = AppComponent.globules[0]
    if (globule == null) {
        displayError("No globule available.")
        return
    }

    let rqst = new GetOrganizationsRqst()
    rqst.setQuery(`{}`)

    let stream = globule.resourceService.getOrganizations(rqst, {})
    let organizations = []
    stream.on('data', function (response) {
        organizations.concat(response.getOrganizationsList())
    })

    stream.on("status", (status) => {
        if (status.code == 0) {
            callback(organizations)
        } else {
            displayError(status.details)
        }
    })
}

/**
 * The organizations manager, this component is used to manage the organizations, it is used to create, update, delete and search organizations.
 */
export class OrganizationsManager extends HTMLElement {
    // attributes.
    static get observedAttributes() {
        return ['current-organization-id'];
    }

    // The connection callback.
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'current-organization-id') {
            this.currentOrganization = newValue
            if (this.currentOrganization != newValue && AppComponent.globules[0] != null) {
                this.setCurrentOrganization(newValue)
            }
        }
    }

    // Create the applicaiton view.
    constructor() {
        super()

        // The current organization.
        this.currentOrganization = null;

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
                display: flex;
                flex-direction: row;
                width: 100%;
                align-items: center;
            }

            #title {
                font-size: 1.2rem;
                margin-left: 1rem;
                margin-right: 1rem;
                flex-grow: 1;
            }

            #organizations {
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

        </style>
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <paper-icon-button id="add-btn" icon="icons:add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <span id="title">Organizations</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
        </div>

        <slot name="organization"></slot>

        <div id="organizations">
            <slot name="organizations"></slot>
        </div>
        `
        // try to get the globule.
        let nbTry = 10;
        let interval = setInterval(() => {
            if (AppComponent.globules[0] != null) {
                clearInterval(interval)
                this.init()
            }
            nbTry--
            if (nbTry == 0) {
                clearInterval(interval)
            }
        }, 1000)

        // Add the event listeners.
        this.shadowRoot.getElementById("add-btn").addEventListener("click", () => {

            let editor = this.querySelector("globular-organization-editor")
            if (editor == null) {
                editor = new OrganizationEditor()
            }

            // set the current organization to new-organization
            this.currentOrganization = "new-organization"
            editor.slot = "organization"
            this.appendChild(editor)

            let org = new Organization()
            org.setName("New Organization")

            // set the organization.
            editor.setOrganization(org)

            // dispatch the event currentOrganizationIdChanged
            document.dispatchEvent(new CustomEvent('currentOrganizationIdChanged', { detail: this.currentOrganization }))

        })

    }

    // the code to execute when the globule is ready.
    init() {

        this.displayOrganizations()

    }

    // display existing organizations.
    displayOrganizations() {

        getOrganizations((organizations) => {
            organizations.forEach(organization => {
                let organizationView = new OrganizationView(organization)
                organizationView.slot = "organizations"
                this.appendChild(organizationView)
            });
        })
    }

    // set the current organization.
    setCurrentOrganization(organizationId) {
        this.currentOrganization = organizationId

        getOrganizationById(organizationId, (organization) => {
            let editor = this.querySelector("globular-organization-editor")
            if (editor == null) {
                editor = new OrganizationEditor()
            }

            editor.slot = "organization"
            this.appendChild(editor)
            editor.setOrganization(organization)
        })


    }

}

customElements.define('globular-organizations-manager', OrganizationsManager)


/**
 * The organization editor, this component is used to edit an organization.
 */
export class OrganizationEditor extends HTMLElement {
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

            .title {
                display: flex;
                flex-direction: row;
                width: 100%;
                align-items: center;
            }

            #title {
                font-size: 1.2rem;
                margin-left: 1rem;
                margin-right: 1rem;
                flex-grow: 1;
            }

            #organizations {
                display: flex;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

            #organizations > globular-organization-view {
                margin-right: 1rem;
                margin-bottom: 1rem;
            }

            

        </style>

        <div id="content">
            <div class="title">
                <span id="title">Organization Editor</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
        </div>
        `

    }

    // The connection callback.
    connectedCallback() {

    }

    // set the organization.
    setOrganization(o) {
        this.organization = o;
    }
}

customElements.define('globular-organization-editor', OrganizationEditor)

/**
 * The organization view, this component is used to view an organization.
 */
export class OrganizationView extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(organization) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.organization = organization;

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

            #organizations {
                display: flex;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

            #organizations > globular-organization-view {
                margin-right: 1rem;
                margin-bottom: 1rem;
            }

        </style>

        <div id="content">
        </div>
        `

    }

    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-organization-view', OrganizationView)