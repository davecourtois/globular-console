import { CreateOrganizationRqst, DeleteOrganizationRqst, GetOrganizationsRqst, Organization } from "globular-web-client/resource/resource_pb";
import { AppComponent } from "../app/app.component";
import { displayAuthentication, displayError, displayQuestion } from "./utility.js";
import { AvatarChanger, getBase64FromImageUrl } from "./image.js";
import { UserView } from "./users";


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
        organizations = organizations.concat(response.getOrganizationsList())
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
        organizations = organizations.concat(response.getOrganizationsList())
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
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

            ::slotted(globular-organization-view) {
                margin-right: 1rem;
                margin-bottom: 1rem;
            }

            ::slotted(globular-organization-view:hover) {
                cursor: pointer;
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

        // Add the event listeners to refresh-organizations.
        document.addEventListener("refresh-organizations", () => {
            // I will select all globular-organization-view and remove them.
            let organizations = this.querySelectorAll("globular-organization-view")
            organizations.forEach(organization => {
                organization.remove()
            });

            // display the organizations.
            this.displayOrganizations()
        })

    }

    // the code to execute when the globule is ready.
    init() {

        this.displayOrganizations()

        // set the current organization.
        if (this.currentOrganization != null) {
            this.setCurrentOrganization(this.currentOrganization)
        }


    }

    // display existing organizations.
    displayOrganizations() {

        getOrganizations((organizations) => {
            organizations.forEach(organization => {
                let organizationView = new OrganizationView(organization)
                organizationView.slot = "organizations"
                this.appendChild(organizationView)

                // set the event listener.
                organizationView.addEventListener("click", () => {
                    // set the current organization.
                    this.currentOrganization = organization.getId()

                    // set the current organization.
                    this.setCurrentOrganization(this.currentOrganization)

                    // dispatch the event currentOrganizationIdChanged
                    document.dispatchEvent(new CustomEvent('currentOrganizationIdChanged', { detail: this.currentOrganization }))
                })

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


            #avatar-div {
                position: relative;
            }

            #avatar {
                width: 48px;
                height: 48px;
                border-radius: 5px;
                border: 1px solid var(--divider-color);
                margin-left: 1rem;
            }

            #avatar:hover {
                cursor: pointer;
                border: 1px solid var(--divider-color);
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

            input {
                margin-top: 1rem;
                margin-bottom: 1rem;
                border: none;
                border-bottom: 1px solid var(--divider-color);
                background-color: var(--surface-color);
            }

            input:focus {
                outline: none;
                border: none;
                border-bottom: 1px solid var(--secondary-color);
            }

            input:valid {
                background-color: white; /* Or transparent */
            }
            
            input:invalid {
                background-color: aliceblue;
            }

            .organization-form {
                display: flex;
                flex-direction: row;
            }

            .table {
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                padding-left: 1rem;
                padding-right: 1rem;
            }

            .row {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                align-items: center;
            }

            .row > label {
                width: 150px;
                margin-right: 1rem;
            }

            .row > input {
                flex-grow: 1;
                background-color: var(--surface-color);
            }

            label {
                font: 500 14px/25px Roboto,sans-serif
            }

            @media only screen and (max-width: 640px) {
                .group-form {
                    flex-direction: column;
                }
            }

        </style>

        <div id="content">
            <div class="title">
                <span id="title">Organization Editor</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
            <div class="organization-form">
                <div id="avatar-div">
                    <img id="avatar" src="assets/icons/organization-icon-original.svg" alt="Avatar">
                    <avatar-changer id="avatar-changer" style="position: absolute; top: 60px; left: 0px; display: none; z-index: 100;"></avatar-changer>
                </div>
                <div class="table">
                    <div class="row">
                        <label for="name">Name</label>
                        <input id="name" type="text" name="name" required>
                    </div>
                    <div class="row">
                        <label for="email">Email</label>
                        <input id="email" type="email" name="email" required>
                    </div>
                    <div class="row">
                        <label for="description">Description</label>
                        <input id="description" type="text" name="description" required>
                    </div>
                </div>
            </div>
                <div id="actions" style="display: flex; flex-direction: row; margin-top: 1rem;">
                <paper-button id="delete-btn" role="button" tabindex="0" aria-disabled="false" >Delete</paper-button>
                <span style="flex-grow: 1;"></span>
                <paper-button id="save-btn" role="button" tabindex="0" aria-disabled="false">Save</paper-button>
                <paper-button id="cancel-btn" role="button" tabindex="0" aria-disabled="false">Cancel</paper-button>
            </div>
        </div>
        `

        // here I will set the action on avatar-changer when the image is changed.
        let avatarChanger = this.shadowRoot.querySelector("#avatar-changer")
        avatarChanger.addEventListener("image-changed", (e) => {
            // set the image.
            let avatar = this.shadowRoot.querySelector("#avatar")
            let url = decodeURIComponent(e.detail.src)

            // I will read the image and set the image url to the account.
            getBase64FromImageUrl(url)
                .then(base64 => avatar.src = base64)
                .catch(error => console.error('Error:', error));

            avatarChanger.style.display = "none"
        })

        // here I will set the cancel action on avatar-changer.
        avatarChanger.addEventListener("cancel", (e) => {
            avatarChanger.style.display = "none"
        })

        // Now we can set the avatar changer.
        let avatar = this.shadowRoot.querySelector("#avatar")
        avatar.onclick = () => {
            let avatarChanger = this.shadowRoot.querySelector("#avatar-changer")
            avatarChanger.style.display = "block"
        }

        // now the actions...
        let saveBtn = this.shadowRoot.querySelector("#save-btn")
        saveBtn.onclick = () => {
            let globule = AppComponent.globules[0]
            if (globule == null) {
                displayError("No globule available.")
                return
            }

            if (globule.token == null) {
                displayAuthentication(`You need to be authenticated to save an organization.`, globule,
                    () => {
                        this.saveOrganization()
                    }, err => {
                        displayError(err)
                    })
            } else {
                this.saveOrganization()
            }
        }

        let cancelBtn = this.shadowRoot.querySelector("#cancel-btn")
        cancelBtn.onclick = () => {
            // remove the editor.
            this.cancel()
        }

        let deleteBtn = this.shadowRoot.querySelector("#delete-btn")
        deleteBtn.onclick = () => {
            // I will ask the user to confirm the deletion.
            let question = displayQuestion(`Are you sure you want to delete the organizaton named ${this.organization.getName()}?`,
                `<div style="display: flex; justify-content: center; margin-top: 1.5rem;">
                            <paper-button id="yes-btn" role="button" tabindex="0" aria-disabled="false">Yes</paper-button>
                            <paper-button id="no-btn" role="button" tabindex="0" aria-disabled="false">No</paper-button>
                        </div>`)

            let yesBtn = question.toastElement.querySelector('#yes-btn')
            let noBtn = question.toastElement.querySelector('#no-btn')

            yesBtn.addEventListener("click", () => {
                question.toastElement.remove()
                this.deleteOrganization()
            })

            noBtn.addEventListener("click", () => {
                question.toastElement.remove()
            })
        }

    }

    cancel() {
        // cancel the group.
        this.organization = null

        document.dispatchEvent(new CustomEvent('currentOrganizationIdChanged', { detail: null }))


        // remove the component.
        this.remove()
    }

    deleteOrganization() {
        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        if (globule.token == null) {
            displayAuthentication(`You need to be authenticated to delete an organization.`, globule,
                () => {
                    this.deleteOrganization()
                    return;
                }, err => displayError(err));
        } else {
            let rqst = new DeleteOrganizationRqst
            rqst.setOrganization(this.organization.getId())

            // delete the organization.
            globule.resourceService.deleteOrganization(rqst, { token: globule.token })
                .then((rsp) => {
                    document.dispatchEvent(new CustomEvent('currentOrganizationIdChanged', { detail: null }))

                    // I will dispatch event refresh organizations.
                    document.dispatchEvent(new CustomEvent('refresh-organizations', { detail: null }))


                    // remove the component.
                    this.remove()

                }).catch((err) => {
                    displayError(err)
                })
        }
    }

    // save the organization.
    saveOrganization() {

        // do validation...
        if (this.shadowRoot.querySelector("#name").value == "") {
            displayError("The name of the organization is required.")
            // set the focus on the name.
            this.shadowRoot.querySelector("#name").focus()

            // set the error style.
            this.shadowRoot.querySelector("#name").style.borderBottom = "1px solid var(--error-color)"

            this.shadowRoot.querySelector("#name").onkeyup = () => {
                this.shadowRoot.querySelector("#name").style.borderBottom = "1px solid var(--success-color)"
                if (this.shadowRoot.querySelector("#name").value == "") {
                    this.shadowRoot.querySelector("#name").style.borderBottom = "1px solid var(--error-color)"
                }
            }

            return
        }


        if (this.organization.getId() == "") {

            let globule = AppComponent.globules[0]
            this.organization.setId(this.organization.getName().toLowerCase().replace(/ /g, "-"))

            // create the organization.
            let rqst = new CreateOrganizationRqst
            this.organization.setName(this.shadowRoot.querySelector("#name").value)
            this.organization.setId(this.organization.getName().toLowerCase().replace(/ /g, "-"))
            this.organization.setDescription(this.shadowRoot.querySelector("#description").value)
            this.organization.setDomain(globule.config.Domain)
            this.organization.setEmail(this.shadowRoot.querySelector("#email").value)

            let avatar = this.shadowRoot.querySelector("#avatar")
            this.organization.setIcon(avatar.src)
            rqst.setOrganization(this.organization)

            globule.resourceService.createOrganization(rqst, { token: globule.token })
                .then(rsp => {
                    // dispatch the event currentOrganizationIdChanged
                    document.dispatchEvent(new CustomEvent('currentOrganizationIdChanged', { detail: this.organization.getId() }))
                }).catch(err => {
                    displayError(err)
                });

        } else {

        }
    }

    // The connection callback.
    connectedCallback() {

    }

    // set the organization.
    setOrganization(o) {
        this.organization = o;

        // set the name.
        this.shadowRoot.querySelector("#name").value = this.organization.getName()
        this.shadowRoot.querySelector("#description").value = this.organization.getDescription()
        this.shadowRoot.querySelector("#email").value = this.organization.getEmail()

        // set the avatar.
        let avatar = this.shadowRoot.querySelector("#avatar")

        if (this.organization.getIcon() != "") {
            avatar.src = this.organization.getIcon()
        }

        // set the delete button.

    }
}

customElements.define('globular-organization-editor', OrganizationEditor)


/**
 * display the organization.
 */
export class OrganizationView extends HTMLElement {

    // attributes.
    static get observedAttributes() {
        return ['closeable'];
    }

    // The connection callback.
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'closeable') {
            if (newValue == "true") {
                this.closeBtn.style.display = "block"
                this.closeBtn.addEventListener('click', () => {
                    if (this.onClose != null) {
                        this.onClose()
                    }
                })
            } else {
                this.closeBtn.style.display = "none"
            }
        }
    }

    // Create the applicaiton view.
    constructor(organization) {
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
                padding: .5rem;
                border-radius: 0.5rem;
                flex-direction: column;
                align-items: center;
            }

            #content > img {
                width: 48px;
                height: 48px;
                border-radius: 50%;
            }

            #name {
                font-size: 1rem;
                flex-grow: 1;
            }

            #close-btn {
                width: 30px;        /* Width of the button */
                height: 30px;       /* Height of the button */
                --iron-icon-width: 10px;  /* Width of the icon */
                --iron-icon-height: 10px; /* Height of the icon */
            }

        </style>
        <div id="content">
            <img src="${organization.getIcon()}"></img>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <paper-icon-button id="close-btn" icon="icons:close" style="display: none;" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <span id="name">${organization.getName()}</span>
            </div>
        </div>
        `

        // Get the buttons.
        this.closeBtn = this.shadowRoot.getElementById('close-btn')

    }
}

customElements.define('globular-organization-view', OrganizationView)
