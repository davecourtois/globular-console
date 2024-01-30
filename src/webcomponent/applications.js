import { AddApplicationActionsRqst, DeleteApplicationRqst, GetApplicationsRqst, RemoveApplicationActionRqst, UpdateApplicationRqst } from "globular-web-client/resource/resource_pb"
import { AppComponent } from "../app/app.component"
import { ActionView } from "./roles"
import { GetAllActionsRequest } from "globular-web-client/services_manager/services_manager_pb"
import { displayError, displayAuthentication, displayQuestion } from "./utility"
import { getBase64FromImageUrl } from "./image"
import getUuidByString from "uuid-by-string"

export function getApplicationsById(id, callback) {

    let rqst = new GetApplicationsRqst

    if (id == "{}") {
        rqst.setQuery("{}")
    } else {
        rqst.setQuery(`{"id": "${id}"}`)
    }

    let globule = AppComponent.globules[0]
    if (globule == null) {
        displayError("No globule is connected.")
        return
    }

    let stream = globule.resourceService.getApplications(rqst, {})
    let applications = []

    stream.on('data', (rsp) => {
        applications = applications.concat(rsp.getApplicationsList())


    })

    stream.on("status", (status) => {
        if (status.code == 0) {
            callback(applications)
        } else {
            displayError(status.details)
        }
    })
}



/**
 * The applications manager, this component is used to manage the applications, it is used to create, update, delete and search applications.
 */
export class ApplicationsManager extends HTMLElement {
    // attributes.
    static get observedAttributes() {
        return ['current-application-id'];
    }

    // The connection callback.
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'current-application-id') {
            this.currentApplicationId = newValue
            if (this.currentApplicationId != newValue && AppComponent.globules[0] != null) {
                this.setCurrentApplication(newValue)
            }
        }
    }

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

            #applications {
                display: flex;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }


        </style>
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span id="title">Applications</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
        </div>

        <slot name="application"></slot>

        <div id="applications">
            
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
    }

    init() {
        // Get the buttons.
        this.infoBtn = this.shadowRoot.getElementById('info-btn')
        this.infoBtn.addEventListener('click', () => {
            this.showInfo()
        })

        // Get the users.
        if (this.currentApplicationId != null && this.currentApplicationId != "") {
            this.setCurrentApplication(this.currentApplicationId)
        }

        // Get the applications.
        getApplicationsById("{}", (applications) => {

            applications.forEach((application) => {
                let applicationView = new ApplicationView(application)
                applicationView.setAttribute('closeable', 'false')
                applicationView.setAttribute('summary', 'true')
                applicationView.slot = "applications"

                // Set the on close callback.
                applicationView.onClose = () => {
                    this.removeApplication(application)
                }

                this.shadowRoot.getElementById('applications').appendChild(applicationView)

                // Add the event listener.
                applicationView.addEventListener('click', () => {
                    this.setCurrentApplication(application.getId())
                    this.currentApplicationId = application.getId()

                    // dispatch the event currentOrganizationIdChanged
                    document.dispatchEvent(new CustomEvent('currentApplicationIdChanged', { detail: this.currentApplicationId }))
                }
                )
            })
        })

    }


    setCurrentApplication(id) {
        this.currentApplicationId = id

        getApplicationsById(id, (applications) => {
            let editor = this.querySelector("globular-application-editor")
            if (editor == null) {
                editor = new ApplicationEditor()
            }

            editor.slot = "application"
            this.appendChild(editor)
            editor.setApplication(applications[0])
        })
    }
}

customElements.define('globular-applications-manager', ApplicationsManager)


/**
 * The application editor, this component is used to edit an application.
 */
export class ApplicationEditor extends HTMLElement {
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
                z-index: 100;
            }

            #title {
                font-size: 1.2rem;
                margin-left: 1rem;
                margin-right: 1rem;
                flex-grow: 1;
            }

            input {
                font-family: Arial, Helvetica, sans-serif; /* Primary font */
                font-size: 16px; /* Readable size */
                color: #333; /* Font color */
                /* Add other styles like padding, borders as needed */
            }

            .organizations, .members, .actions {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                border: 1px solid var(--divider-color);
                border-radius: 3px;
                min-width: 400px;
                height: 192px;
                margin-top: 1rem;
                overflow-y: auto;
            }

            .actions {
                margin-top: 1rem;
                margin-right: 1rem;
                height: 300px;
                flex-direction: column;
                position: relative;
                min-width: 500px;
            }

            #potential-actions, #actions {
                position: absolute;
                top: 0px;
                left: 0px;
                right: 0px;
                overflow-y: auto;
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

            .application-form {
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
                .application-form {
                    flex-direction: column;
                }
            }

            #potential-members > globular-user-view:hover {
                cursor: pointer;
            }

            .application-form{
                display: flex;
                flex-direction: row;
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

            @media only screen and (max-width: 640px) {
                .application-form{
                    flex-direction: column;

                }
            }

        </style>

        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span id="title">Application Editor</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
            <div id="avatar-div">
                <img id="avatar" src="assets/icons/organization-icon-original.svg" alt="Avatar">
                <avatar-changer id="avatar-changer" style="position: absolute; top: 60px; left: 0px; display: none; z-index: 100;"></avatar-changer>
            </div>
            <div class="application-form">
                <div class="table">
                    <div class="row">
                        <label>Name</label>
                        <input type="text" id="name" name="name" required minlength="4"></input>
                    </div>
                    <div class="row">
                        <label>Alias</label>
                        <input type="text" id="alias" name="alias" required minlength="4"></input>
                    </div>
                    <div class="row">
                        <label>Description</label>
                        <input id="description" name="description"></input>
                    </div>
                    <div class="row" >
                        <label>
                            <paper-icon-button id="add-action-btn" icon="icons:add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                            <span style="margin-left: 1rem; margin-right: 1rem;">Actions</span>
                        </label>
                        <div class="actions">
                            <div id="actions">
                                <slot name="actions"></slot>
                            </div>
                        </div>

                        <div class="actions" style="display: none;">
                            <div id="potential-actions">
                                <slot name="potential-actions"></slot>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="actions-buttons" style="display: flex; flex-direction: row; margin-top: 1rem;">
                <paper-button id="delete-btn" role="button" tabindex="0" aria-disabled="false">Delete</paper-button>
                <span style="flex-grow: 1;"></span>
                <paper-button id="save-btn" role="button" tabindex="0" aria-disabled="false">Save</paper-button>
                <paper-button id="cancel-btn" role="button" tabindex="0" aria-disabled="false">Cancel</paper-button>
            </div>
        </div>
        `

        // Get the buttons.
        this.saveBtn = this.shadowRoot.getElementById('save-btn')
        this.cancelBtn = this.shadowRoot.getElementById('cancel-btn')
        this.deleteBtn = this.shadowRoot.getElementById('delete-btn')
        this.infoBtn = this.shadowRoot.getElementById('info-btn')

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


        // Add the event listeners.
        this.saveBtn.addEventListener('click', () => {
            let globule = AppComponent.globules[0]
            if (globule == null) {
                displayError("No globule is connected.")
                return
            }

            if (globule.token == null) {
                displayAuthentication(`You need to be authenticated to save a application.`, globule,
                    () => {
                        this.save()
                    }, err => displayError(err));
            } else {
                this.save()
            }
        })

        this.deleteBtn.addEventListener('click', () => {
            // I will ask the user to confirm the deletion.
            let question = displayQuestion(`Are you sure you want to delete the ${this.application.getName()}?`,
                `<div style="display: flex; justify-content: center; margin-top: 1.5rem;">
                    <paper-button id="yes-btn" role="button" tabindex="0" aria-disabled="false">Yes</paper-button>
                    <paper-button id="no-btn" role="button" tabindex="0" aria-disabled="false">No</paper-button>
                </div>`)

            let yesBtn = question.toastElement.querySelector('#yes-btn')
            let noBtn = question.toastElement.querySelector('#no-btn')

            yesBtn.addEventListener("click", () => {
                question.toastElement.remove()
                this.deleteApplication()
            })

            noBtn.addEventListener("click", () => {
                question.toastElement.remove()
            })
        })

        this.cancelBtn.addEventListener('click', () => {
            this.cancel()
        })

        // Add actions button.
        this.addActionBtn = this.shadowRoot.getElementById('add-action-btn')
        this.addActionBtn.addEventListener('click', () => {
            if (this.application.getId() == "") {
                displayError("You need to save the application before adding an action.")
                return
            }
            this.displayPotentialActions()
        })

    }

    // The connection callback.
    connectedCallback() {

    }

    deleteApplication() {
        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        if (globule.token == null) {
            displayAuthentication(`You need to be authenticated to delete a application.`, globule,
                () => {
                    this.deleteApplication()
                    return;
                }, err => displayError(err));
        } else {
            let rqst = new DeleteApplicationRqst
            rqst.setApplicationid(this.application.getId())

            // delete the application.
            globule.resourceService.deleteApplication(rqst, { token: globule.token })
                .then((rsp) => {
                    document.dispatchEvent(new CustomEvent('currentApplicationIdChanged', { detail: null }))

                    // I will dispatch event refresh applications.
                    document.dispatchEvent(new CustomEvent('refresh-applications', { detail: null }))


                    // remove the component.
                    this.remove()

                }).catch((err) => {
                    displayError(err)
                })
        }
    }

    // Save the application.
    save() {
        // save the application.
        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }


        let avatar = this.shadowRoot.querySelector("#avatar")
        this.application.setIcon(avatar.src)

        // set tha name
        let name = this.shadowRoot.getElementById('name')
        this.application.setName(name.value)

        // set the description.
        let description = this.shadowRoot.getElementById('description')
        this.application.setDescription(description.value)

        // set the alias.
        let alias = this.shadowRoot.getElementById('alias')
        this.application.setAlias(alias.value)

        // use the update application request.
        let rqst = new UpdateApplicationRqst
        rqst.setApplicationid(this.application.getId())
        let str = `{"$set":{"name": "${this.application.getName()}", "description": "${this.application.getDescription()}", "alias": "${this.application.getAlias()}", "icon": "${this.application.getIcon()}"}}`
        rqst.setValues(str)

        // update the application.
        globule.resourceService.updateApplication(rqst, { token: globule.token })
            .then((rsp) => {
                // I will dispatch event refresh application.
                let evt = new CustomEvent(`refresh_${this.application.getId()}`, { detail: this.application.getId() })
                document.dispatchEvent(evt)
            }).catch((err) => {
                displayError(err)
            })
    }

    // Cancel the application.
    cancel() {
        // cancel the application.
        this.application = null

        document.dispatchEvent(new CustomEvent('currentApplicationIdChanged', { detail: null }))


        // remove the component.
        this.remove()
    }

    // set the application.
    setApplication(application) {
        this.innerHTML = ""

        if (application.getId() == "") {
            this.shadowRoot.querySelector('#potential-actions').parentNode.style.display = "none"
        }

        this.application = application

        // set the name.
        let name = this.shadowRoot.getElementById('name')
        name.value = application.getName()
        name.addEventListener('input', () => {
            this.application.setName(name.value)
        })

        // set the description.
        let description = this.shadowRoot.getElementById('description')
        description.value = application.getDescription()
        description.addEventListener('input', () => {
            this.application.setDescription(description.value)
        })

        // set the alias.
        let alias = this.shadowRoot.getElementById('alias')
        alias.value = application.getAlias()
        alias.addEventListener('input', () => {
            this.application.setAlias(alias.value)
        })

        // set the icon.
        let avatar = this.shadowRoot.querySelector("#avatar")
        avatar.src = application.getIcon()


        // set the actions.
        this.application.getActionsList().sort().forEach((action) => {
            console.log("action", action)
            this.addActionView(action)
        })
    }

    /**
     * 
     * @param {*} action 
     */
    addActionView(action) {

        let id = "_" + getUuidByString(action) + "_action"

        if (this.querySelector("#" + id) != null) {
            return
        }

        let actionView = new ActionView(action)
        actionView.slot = 'actions'
        actionView.setAttribute('closeable', 'true')
        actionView.id = id

        this.appendChild(actionView)

        // add the event listener.
        actionView.onClose = () => {

            // I will ask the user to confirm the deletion.
            let question = displayQuestion(`Are you sure you want to remove</br><span style="font-style: italic;">${action}</span></br>from the application <span style="font-style: italic;">${this.application.getName()}</span>?`,
                `<div style="display: flex; justify-content: center; margin-top: 1.5rem;">
                        <paper-button id="yes-btn" role="button" tabindex="0" aria-disabled="false">Yes</paper-button>
                        <paper-button id="no-btn" role="button" tabindex="0" aria-disabled="false">No</paper-button>
                    </div>`)

            let yesBtn = question.toastElement.querySelector('#yes-btn')
            let noBtn = question.toastElement.querySelector('#no-btn')

            yesBtn.addEventListener("click", () => {
                question.toastElement.remove()
                // I will be sure the a token is available.
                let globule = AppComponent.globules[0]
                if (globule == null) {
                    displayError("No globule is connected.")
                    return
                }

                if (globule.token == null) {
                    displayAuthentication(`You need to be authenticated to remove an action from a application.`, globule, () => {
                        this.removeAction(action, () => {
                            this.removeChild(actionView)
                        })
                    }, err => displayError(err));
                } else {
                    this.removeAction(action, () => {
                        this.removeChild(actionView)
                    })
                }
            })

            noBtn.addEventListener("click", () => {
                question.toastElement.remove()
            })
        }
    }

    removeAction(action, callback) {

        let globule = AppComponent.globules[0]
        let rqst = new RemoveApplicationActionRqst
        rqst.setApplicationid(this.application.getId())
        rqst.setAction(action)

        // remove the action.
        globule.resourceService.removeApplicationAction(rqst, { token: globule.token })
            .then((rsp) => {

                let evt = new CustomEvent(`refresh_${this.application.getId()}`, { detail: action })
                document.dispatchEvent(evt)
                this.application.setActionsList(this.application.getActionsList().filter((m) => m != action))

                // if the potential actions is displayed, I will append the action to the potential actions.
                let potentialActions = this.shadowRoot.getElementById('potential-actions')
                if (potentialActions.style.display == "") {
                    this.displayPotentialActions()
                }

                callback()

            }).catch((err) => {
                displayError(err)
            })
    }


    /**
     * 
     * @param {*} action 
     * @param {*} callback 
     */
    addPotentialActionView(action, callback) {
        let actionView = new ActionView(action)
        actionView.slot = 'actions'
        actionView.id = action + "_potential"
        actionView.setAttribute('closeable', 'false')
        actionView.setAttribute('addable', 'true')

        let div = this.shadowRoot.getElementById('potential-actions')
        div.appendChild(actionView)

        // add the event listener.
        actionView.onAdd =  () => {
            // I will be sure the a token is available.
            let globule = AppComponent.globules[0]
            if (globule == null) {
                displayError("No globule is connected.")
                return
            }

            if (globule.token == null) {
                displayAuthentication(`You need to be authenticated to add an action to an application.`, globule, () => {
                    this.addAction(action, () => {
                        div.removeChild(actionView)
                    })

                }, err => displayError(err));
            } else {
                this.addAction(action, () => {
                    div.removeChild(actionView)
                })
            }
        }
    }

    /**
     * Add action to a application.
     * @param {*} action 
     * @param {*} callback 
     */
    addAction(action, callback) {

        let globule = AppComponent.globules[0]

        let rqst = new AddApplicationActionsRqst
        rqst.setApplicationid(this.application.getId())
        let actions = this.application.getActionsList()
        actions.push(action)
        rqst.setActionsList(actions)

        // add the action.
        globule.resourceService.addApplicationActions(rqst, { token: globule.token })
            .then((rsp) => {
                let evt = new CustomEvent(`refresh_${this.application.getId()}`, { detail: action })
                document.dispatchEvent(evt)
               // this.application.setActionsList(this.application.getActionsList().filter((m) => m != action))

                // push the action in the list of application.
                // this.application.getActionsList().push(action)

                // Set back the application.
                this.setApplication(this.application)

                callback()
            }).catch((err) => {
                displayError(err)
            })
    }

    /**
     * Display the list of potential actions.
     */
    displayPotentialActions() {

        let div = this.shadowRoot.getElementById('potential-actions')
        div.parentNode.style.display = "flex"

        // Now i will get the list of all actions.
        let rqst = new GetAllActionsRequest

        let globule = AppComponent.globules[0]

        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        globule.servicesManagerService.getAllActions(rqst, {})
            .then((rsp) => {
                div.innerHTML = ""
                let actions = rsp.getActionsList()
                actions.sort().forEach((action) => {
                    if (this.application.getActionsList().indexOf(action) == -1) {
                        this.addPotentialActionView(action)
                    }
                })

            }).catch((err) => {
                displayError(err)
            })
    }

}

customElements.define('globular-application-editor', ApplicationEditor)



/**
 * display the application.
 */
export class ApplicationView extends HTMLElement {

    // attributes.
    static get observedAttributes() {
        return ['closeable', 'summary'];
    }

    // The connection callback.
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'closeable') {
            if (newValue == "true") {
                this.closeBtn.style.display = "block"
            } else {
                this.closeBtn.style.display = "none"
            }
        }

        if (name === 'summary') {

        }
    }

    // Create the applicaiton view.
    constructor(application) {
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
                border: 1px solid transparent;
            }

            #content > img {
                width: 48px;
                height: 48px;
                border-radius: 50%;

            }

            #content:hover {
                border: 1px solid var(--hover-color);
                cursor: pointer;
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
            <img src="${application.getIcon()}"></img>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <paper-icon-button id="close-btn" icon="icons:close" style="display: none;" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <span id="name">${application.getName()}</span>
            </div>
        </div>
        `

        // Get the buttons.
        this.closeBtn = this.shadowRoot.getElementById('close-btn')

    }
}

customElements.define('globular-application-view', ApplicationView)