import { CreateRoleRqst, DeleteRoleRqst, GetAccountsRqst, Role, UpdateRoleRqst, AddAccountRoleRqst, RemoveAccountRoleRqst, GetRolesRqst, GetOrganizationsRqst, AddOrganizationAccountRqst, AddOrganizationRoleRqst, RemoveOrganizationRoleRqst, RemoveRoleActionRqst, AddRoleActionsRqst } from "globular-web-client/resource/resource_pb";
import { AppComponent } from "../app/app.component";
import { displayAuthentication, displayError, displayQuestion } from "./utility";
import { UserView, getUserById } from "./users";
import { OrganizationView, getOrganizationById } from "./organizations";
import { GetAllActionsRequest } from "globular-web-client/services_manager/services_manager_pb";



export function getRoleById(id, callback) {
    let rqst = new GetRolesRqst
    rqst.setQuery(`{"id": "${id}"}`)

    let globule = AppComponent.globules[0]
    if (globule == null) {
        displayError("No globule is connected.")
        return
    }

    let stream = globule.resourceService.getRoles(rqst, {})
    let roles = []

    stream.on('data', (rsp) => {
        roles = roles.concat(rsp.getRolesList())


    })

    stream.on("status", (status) => {
        if (status.code == 0) {
            // remove the admin role and the guest role from the list.
            callback(roles)
        } else {
            displayError(status.details)
        }
    })
}

/**
 * The roles manager, this component is used to manage the roles, it is used to create, update, delete and search roles.
 */
export class RolesManager extends HTMLElement {
    // attributes.
    static get observedAttributes() {
        return ['current-role-id'];
    }

    // The connection callback.
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'current-role-id') {
            this.currentRoleId = newValue
            if (this.currentRoleId != newValue && AppComponent.globules[0] != null) {
                this.setCurrentRole(newValue)
            }
        }
    }

    // Create the applicaiton view.
    constructor() {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // The current role id.
        this.currentRoleId = null

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

            #roles {
                display: flex;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

            #roles > globular-role-view {
                margin-right: 1rem;
                margin-bottom: 1rem;
            }

        </style>

        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <paper-icon-button id="add-btn" icon="icons:add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <span id="title">roles</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
        </div>
                    
        <slot name="role"></slot>

        <div id="roles">
            <slot name="roles"></slot>
        </div>
        `

        // Get the buttons.
        this.addBtn = this.shadowRoot.getElementById('add-btn')
        this.infoBtn = this.shadowRoot.getElementById('info-btn')

        // Add the event listeners.
        this.addBtn.addEventListener('click', () => {
            this.addRole()
        })

        this.infoBtn.addEventListener('click', () => {
            this.info()
        })

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

        // add refresh event listener.
        document.addEventListener('refresh-roles', () => {
            this.init()
        })

        // add current role id changed event listener.
        document.addEventListener('currentRoleIdChanged', (evt) => {
            this.currentRoleId = evt.detail
            if (this.currentRoleId == null) {
                // remove the role editor.
                let editor = this.querySelector('globular-role-editor')
                if (editor != null) {
                    this.removeChild(editor)
                }
            }
        })
    }


    /**
     * Initialise the component.
     */
    init() {
        if (this.currentRoleId != null) {
            this.setCurrentRole(this.currentRoleId)
        }

        // get the roles.
        // Get the users.
        let rqst = new GetRolesRqst
        rqst.setQuery("{}")

        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        let stream = globule.resourceService.getRoles(rqst, {})

        let roles = []

        stream.on('data', (rsp) => {
            roles = roles.concat(rsp.getRolesList())
        })

        stream.on("status", (status) => {
            if (status.code == 0) {
                // remove the admin role and the guest role from the list.
                roles = roles.filter((r) => {
                    return r.getName() != "admin" && r.getName() != "guest"
                })

                this.displayroles(roles)
            } else {
                displayError(status.details)
            }
        })
    }

    /**
     * Add a role to the list.
     */
    addRole() {
        // display the role editor.
        let g = new Role()
        g.setName('New Role')

        let editor = this.querySelector('globular-role-editor')
        if (editor == null) {
            editor = new RoleEditor()
            editor.slot = 'role'
            this.appendChild(editor)
        }



        // I will dispatch event currentRoleIdChanged
        this.currentRoleId = "new-role"
        document.dispatchEvent(new CustomEvent('currentRoleIdChanged', { detail: this.currentRoleId }))

        editor.setRole(g)
    }

    /**
     * Set the current role.
     * @param {*} RoleId 
     */
    setCurrentRole(roleId) {

        this.innerHTML = ""

        // I will dispatch event currentRoleIdChanged
        document.dispatchEvent(new CustomEvent('currentRoleIdChanged', { detail: this.currentRoleId }))

        // set the editor.
        let editor = this.querySelector('globular-role-editor')
        if (editor == null) {
            editor = new RoleEditor()
            editor.slot = 'role'
            this.appendChild(editor)
        }

        // set the role.
        if (roleId == "new-role") {
            let g = new Role()
            g.setName('New Role')
            editor.setRole(g)
        } else {
            // here I will get the role from the globule and set it to the editor.
            getRoleById(roleId, (roles) => {
                if (roles.length == 0) {
                    displayError("Role not found.")
                    return
                }
                editor.setRole(roles[0])
            })
        }
    }

    displayroles(roles) {
        // remove all the roles.
        let rolesDiv = this.shadowRoot.getElementById('roles')
        rolesDiv.innerHTML = ""

        // display the roles.
        roles.forEach((role) => {
            console.log(role)
            let roleView = new RoleView(role)
            roleView.setAttribute('summary', 'false')
            roleView.slot = 'roles'
            rolesDiv.appendChild(roleView)
            // add the event listener.
            roleView.addEventListener('click', () => {
                this.currentRoleId = role.getId()
                this.setCurrentRole(role.getId())
            })
        })
    }

    /**
     * Display the info of the role.
     */
    info() {
        // display the role info.
    }

}

customElements.define('globular-roles-manager', RolesManager)


/**
 * The role editor, this component is used to edit a role.
 */
export class RoleEditor extends HTMLElement {
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

            .role-form {
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
                .role-form {
                    flex-direction: column;
                }
            }

            #potential-members > globular-user-view:hover {
                cursor: pointer;
            }

            .Role-form{
                display: flex;
                flex-direction: row;
            }

            @media only screen and (max-width: 640px) {
                .Role-form{
                    flex-direction: column;

                }
            }

            

        </style>

        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span id="title">Role Editor</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
            <div class="Role-form">
                <div class="table">
                    <div class="row">
                        <label>Name</label>
                        <input type="text" id="name" name="name" required minlength="4"></input>
                    </div>
                    <div class="row">
                        <label>Description</label>
                        <input id="description" name="description"></input>
                    </div>
                    <div class="row">
                        <label>
                            <paper-icon-button id="add-member-btn" icon="icons:add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                            Members
                        </label>
                        <div class="members">
                            <slot name="members"></slot>
                        </div>
                        <div id="potential-members" class="members" style="margin-left: 1rem; display: none;">
                            <span style="margin-left: 1rem; margin-right: 1rem;">Potential Members</span>
                        </div>
                    </div>
                    <div class="row">
                        <label>
                            <paper-icon-button id="add-organization-btn" icon="icons:add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                            Organizations
                        </label>
                        <div class="organizations">
                            <slot name="organizations"></slot>
                        </div>
                        <div id="potential-organizations" class="organizations" style="margin-left: 1rem; display: none;">
                            <span style="margin-left: 1rem; margin-right: 1rem;">Potential Organization</span>
                        </div>
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

        // Add the event listeners.
        this.saveBtn.addEventListener('click', () => {
            let globule = AppComponent.globules[0]
            if (globule == null) {
                displayError("No globule is connected.")
                return
            }

            if (globule.token == null) {
                displayAuthentication(`You need to be authenticated to save a role.`, globule,
                    () => {
                        this.save()
                    }, err => displayError(err));
            } else {
                this.save()
            }
        })

        this.deleteBtn.addEventListener('click', () => {
            // I will ask the user to confirm the deletion.
            let question = displayQuestion(`Are you sure you want to delete the ${this.role_.getName()}?`,
                `<div style="display: flex; justify-content: center; margin-top: 1.5rem;">
                    <paper-button id="yes-btn" role="button" tabindex="0" aria-disabled="false">Yes</paper-button>
                    <paper-button id="no-btn" role="button" tabindex="0" aria-disabled="false">No</paper-button>
                </div>`)

            let yesBtn = question.toastElement.querySelector('#yes-btn')
            let noBtn = question.toastElement.querySelector('#no-btn')

            yesBtn.addEventListener("click", () => {
                question.toastElement.remove()
                this.deleteRole()
            })

            noBtn.addEventListener("click", () => {
                question.toastElement.remove()
            })
        })

        this.cancelBtn.addEventListener('click', () => {
            this.cancel()
        })

        // Add members button.
        this.addMemberBtn = this.shadowRoot.getElementById('add-member-btn')
        this.addMemberBtn.addEventListener('click', () => {
            if (this.role_.getId() == "") {
                displayError("You need to save the role before adding a member.")
                return
            }
            this.displayPotentialMembers()
        })

        // Add organizations button.
        this.addOrganizationBtn = this.shadowRoot.getElementById('add-organization-btn')
        this.addOrganizationBtn.addEventListener('click', () => {
            if (this.role_.getId() == "") {
                displayError("You need to save the role before adding an organization.")
                return
            }
            this.displayPotentialOrganizations()
        })

        // Add actions button.
        this.addActionBtn = this.shadowRoot.getElementById('add-action-btn')
        this.addActionBtn.addEventListener('click', () => {
            if (this.role_.getId() == "") {
                displayError("You need to save the role before adding an action.")
                return
            }
            this.displayPotentialActions()
        })

    }

    // The connection callback.
    connectedCallback() {

    }

    deleteRole() {
        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        if (globule.token == null) {
            displayAuthentication(`You need to be authenticated to delete a role.`, globule,
                () => {
                    this.deleteRole()
                    return;
                }, err => displayError(err));
        } else {
            let rqst = new DeleteRoleRqst
            rqst.setRoleid(this.role_.getId())

            // delete the role.
            globule.resourceService.deleteRole(rqst, { token: globule.token })
                .then((rsp) => {
                    document.dispatchEvent(new CustomEvent('currentRoleIdChanged', { detail: null }))

                    // I will dispatch event refresh roles.
                    document.dispatchEvent(new CustomEvent('refresh-roles', { detail: null }))


                    // remove the component.
                    this.remove()

                }).catch((err) => {
                    displayError(err)
                })
        }
    }

    // Save the role.
    save() {
        // save the role.
        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        if (this.role_.getId() == "") {
            let rqst = new CreateRoleRqst

            let name = this.shadowRoot.getElementById('name')
            this.role_.setName(name.value)
            this.role_.setId(name.value) // I will use the name as the id.

            let description = this.shadowRoot.getElementById('description')
            this.role_.setDescription(description.value)
            rqst.setRole(this.role_)

            // create the role.
            globule.resourceService.createRole(rqst, { token: globule.token })
                .then((rsp) => {
                    this.setRole(this.role_)
                    document.dispatchEvent(new CustomEvent('currentRoleIdChanged', { detail: this.role_.getId() }))
                    document.dispatchEvent(new CustomEvent('refresh-roles', { detail: null }))
                }).catch((err) => {
                    displayError(err)
                })

        } else {

            // use the update role request.
            let rqst = new UpdateRoleRqst
            rqst.setRoleid(this.role_.getId())
            let str = `{"$set":{"name": "${this.role_.getName()}", "description": "${this.role_.getDescription()}"}}`
            rqst.setValues(str)

            // update the role.
            globule.resourceService.updateRole(rqst, { token: globule.token })
                .then((rsp) => {
                    // I will dispatch event refresh role.
                    let evt = new CustomEvent(`refresh_${this.role_.getId()}`, { detail: this.role_.getId() })
                    document.dispatchEvent(evt)
                }).catch((err) => {
                    displayError(err)
                })
        }


    }

    // Cancel the role.
    cancel() {
        // cancel the role.
        this.role_ = null

        document.dispatchEvent(new CustomEvent('currentRoleIdChanged', { detail: null }))


        // remove the component.
        this.remove()
    }

    // set the role.
    setRole(role) {
        this.innerHTML = ""

        if (role.getId() == "") {
            this.shadowRoot.querySelector('#potential-actions').parentNode.style.display = "none"
        }

        // I will get user view from the slot.
        let members = this.querySelectorAll('globular-user-view[slot="members"]')
        members.forEach((member) => {
            this.removeChild(member)
        })

        // I will get organization view from the slot.
        let organizations = this.querySelectorAll('globular-organization-view[slot="organizations"]')
        organizations.forEach((organization) => {
            this.removeChild(organization)
        })

        this.role_ = role

        // set the name.
        let name = this.shadowRoot.getElementById('name')
        name.value = role.getName()
        name.addEventListener('input', () => {
            this.role_.setName(name.value)
        })

        // set the description.
        let description = this.shadowRoot.getElementById('description')
        description.value = role.getDescription()
        description.addEventListener('input', () => {
            this.role_.setDescription(description.value)
        })

        // set the members.
        role.getMembersList().forEach((member) => {
            getUserById(member, (user) => {
                let userView = new UserView(user)
                userView.slot = 'members'
                userView.setAttribute('closeable', 'true')
                this.appendChild(userView)

                // add the event listener.
                userView.onClose = () => {
                    // I will ask the user to confirm the deletion.
                    let question = displayQuestion(`Are you sure you want to remove ${member} from the ${this.role_.getName()}?`,
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
                            displayAuthentication(`You need to be authenticated to remove a member from a role.`, globule, () => {
                                this.removeMember(member, () => {
                                    this.removeChild(userView)
                                })
                            }, err => displayError(err));
                        } else {
                            this.removeMember(member, () => {
                                this.removeMember(member, () => {
                                    this.removeChild(userView)
                                })
                            })
                        }
                    })

                    noBtn.addEventListener("click", () => {
                        question.toastElement.remove()
                    })
                }
            })
        })

        // set the organizations.
        this.role_.getOrganizationsList().forEach((organization) => {
            getOrganizationById(organization, (o) => {
                let organizationView = new OrganizationView(o)
                organizationView.slot = 'organizations'
                organizationView.setAttribute('closeable', 'true')
                organizationView.setAttribute('addable', 'false')
                organizationView.setAttribute('summary', 'true')
                this.appendChild(organizationView)

                // add the event listener.
                organizationView.onClose = () => {
                    // I will ask the user to confirm the deletion.
                    let question = displayQuestion(`Are you sure you want to remove ${organization} from the ${this.role_.getName()}?`,
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
                            displayAuthentication(`You need to be authenticated to remove a group from an organization.`, globule, () => {
                                this.removeOrganization(organization, () => {
                                    this.removeChild(organizationView)
                                })
                            }, err => displayError(err));
                        } else {
                            this.removeOrganization(organization, () => {
                                this.removeChild(organizationView)
                            })
                        }
                    })

                    noBtn.addEventListener("click", () => {
                        question.toastElement.remove()
                    })
                }
            })
        })


        // set the actions.
        this.role_.getActionsList().sort().forEach((action) => {
            this.addActionView(action)
        })
    }

    /**
     * 
     * @param {*} action 
     */
    addActionView(action) {

        let actionView = new ActionView(action)
        actionView.slot = 'actions'
        actionView.setAttribute('closeable', 'true')
        actionView.id = action + "_action"
        this.appendChild(actionView)

        // add the event listener.
        actionView.onClose = () => {

            // I will ask the user to confirm the deletion.
            let question = displayQuestion(`Are you sure you want to remove</br><span style="font-style: italic;">${action}</span></br>from the ${this.role_.getName()}?`,
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
                    displayAuthentication(`You need to be authenticated to remove an action from a role.`, globule, () => {
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
        let rqst = new RemoveRoleActionRqst
        rqst.setRoleid(this.role_.getId())
        rqst.setAction(action)

        // remove the action.
        globule.resourceService.removeRoleAction(rqst, { token: globule.token })
            .then((rsp) => {

                let evt = new CustomEvent(`refresh_${this.role_.getId()}`, { detail: action })
                document.dispatchEvent(evt)
                this.role_.setActionsList(this.role_.getActionsList().filter((m) => m != action))

                // if the potential actions is displayed, I will append the action to the potential actions.
                let potentialActions = this.shadowRoot.getElementById('potential-actions')
                if (potentialActions.style.display == "flex") {
                    if (potentialActions.querySelector(`globular-action-view[id="${action}_action"]`) != null) {
                        return
                    }

                    this.addPotentialActionView(action)
                }

                callback()

            }).catch((err) => {
                displayError(err)
            })
    }

    /**
     * That function display the list of potential role members.
     * @param {*} members 
     */
    displayPotentialMembers(members) {
        // first of all i need to get the list of all accounts.
        let rqst = new GetAccountsRqst
        rqst.setQuery("{}")

        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        let stream = globule.resourceService.getAccounts(rqst, {})
        let accounts = []

        stream.on('data', (rsp) => {
            accounts = accounts.concat(rsp.getAccountsList())
        })

        stream.on("status", (status) => {
            if (status.code == 0) {

                let potentialMembers = this.shadowRoot.getElementById('potential-members')
                potentialMembers.innerHTML = ""
                potentialMembers.style.display = "flex"

                // display the potential members.
                accounts.forEach((account) => {
                    if (this.role_.getMembersList().indexOf(account.getId()) == -1) {
                        let userView = new UserView(account)
                        userView.slot = 'members'
                        userView.id = account.getId() + "_potential"
                        userView.setAttribute('closeable', 'false')
                        potentialMembers.appendChild(userView)

                        // add the event listener.
                        userView.addEventListener('click', () => {
                            // I will be sure the a token is available.
                            let globule = AppComponent.globules[0]
                            if (globule == null) {
                                displayError("No globule is connected.")
                                return
                            }

                            if (globule.token == null) {
                                displayAuthentication(`You need to be authenticated to add a member to a role.`, globule, () => {
                                    this.addMember(account.getId(), () => {
                                        potentialMembers.removeChild(userView)
                                    })

                                }, err => displayError(err));
                            } else {
                                this.addMember(account.getId(), () => {
                                    potentialMembers.removeChild(userView)
                                })
                            }
                        })
                    }
                })


            } else {
                displayError(status.details)
            }
        })
    }

    addMember(member, callback) {

        let globule = AppComponent.globules[0]

        let rqst = new AddAccountRoleRqst
        rqst.setRoleid(this.role_.getId())
        rqst.setAccountid(member)

        // add the member.
        globule.resourceService.addAccountRole(rqst, { token: globule.token })
            .then((rsp) => {
                let evt = new CustomEvent(`refresh_${this.role_.getId()}`, { detail: member })
                document.dispatchEvent(evt)
                this.role_.setMembersList(this.role_.getMembersList().filter((m) => m != member))

                // push the member to the role.
                this.role_.getMembersList().push(member)

                this.setRole(this.role_)
                callback()
            }).catch((err) => {
                displayError(err)
            })

    }

    /**
     * 
     * @param {*} member 
     * @param {*} callback 
     */
    removeMember(member, callback) {

        let globule = AppComponent.globules[0]
        let rqst = new RemoveAccountRoleRqst
        rqst.setRoleid(this.role_.getId())
        rqst.setAccountid(member)

        // remove the member.
        globule.resourceService.removeAccountRole(rqst, { token: globule.token })
            .then((rsp) => {

                let evt = new CustomEvent(`refresh_${this.role_.getId()}`, { detail: member })
                document.dispatchEvent(evt)
                this.role_.setMembersList(this.role_.getMembersList().filter((m) => m != member))

                // if the potential members is displayed, I will append the member to the potential members.
                let potentialMembers = this.shadowRoot.getElementById('potential-members')
                if (potentialMembers.style.display == "flex") {
                    getUserById(member, (user) => {

                        if (potentialMembers.querySelector(`globular-user-view[id="${member}_potential"]`) != null) {
                            return
                        }

                        let userView = new UserView(user)
                        userView.slot = 'members'
                        userView.id = member + "_potential"
                        userView.setAttribute('closeable', 'false')


                        potentialMembers.appendChild(userView)

                        // add the event listener.
                        userView.addEventListener('click', () => {
                            // I will be sure the a token is available.
                            let globule = AppComponent.globules[0]
                            if (globule == null) {
                                displayError("No globule is connected.")
                                return
                            }

                            if (globule.token == null) {
                                displayAuthentication(`You need to be authenticated to add a member to a role.`, globule, () => {
                                    this.addMember(member, () => {
                                        potentialMembers.removeChild(userView)
                                    })

                                }, err => displayError(err));
                            } else {
                                this.addMember(member, () => {
                                    potentialMembers.removeChild(userView)
                                })
                            }
                        })
                    })
                }

                callback()

            }).catch((err) => {
                displayError(err)
            })
    }

    /**
     * That function display the list of potential organizations.
     */
    displayPotentialOrganizations() {
        // first of all i need to get the list of all accounts.
        let rqst = new GetOrganizationsRqst
        rqst.setQuery("{}")

        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        let stream = globule.resourceService.getOrganizations(rqst, {})
        let organizations = []

        stream.on('data', (rsp) => {
            organizations = organizations.concat(rsp.getOrganizationsList())
        })

        stream.on("status", (status) => {
            if (status.code == 0) {

                let potentialOrganizations = this.shadowRoot.getElementById('potential-organizations')
                potentialOrganizations.innerHTML = ""
                potentialOrganizations.style.display = "flex"

                // display the potential members.
                organizations.forEach((organization) => {
                    if (this.role_.getOrganizationsList().indexOf(organization.getId()) == -1) {
                        let organizationView = new OrganizationView(organization)
                        organizationView.slot = 'organizations'
                        organizationView.id = organization.getId() + "_potential"
                        organizationView.setAttribute('closeable', 'false')
                        organizationView.setAttribute('addable', 'true')
                        potentialOrganizations.appendChild(organizationView)

                        // add the event listener.
                        organizationView.addEventListener('click', () => {
                            // I will be sure the a token is available.
                            let globule = AppComponent.globules[0]
                            if (globule == null) {
                                displayError("No globule is connected.")
                                return
                            }

                            if (globule.token == null) {
                                displayAuthentication(`You need to be authenticated to add a organization to a role.`, globule, () => {
                                    this.addOrganization(organization.getId(), () => {
                                        potentialOrganizations.removeChild(organizationView)
                                    })

                                }, err => displayError(err));
                            } else {
                                this.addOrganization(organization.getId(), () => {
                                    potentialOrganizations.removeChild(organizationView)
                                })
                            }
                        })
                    }
                })


            } else {
                displayError(status.details)
            }
        })
    }

    addOrganization(organization, callback) {

        let globule = AppComponent.globules[0]

        let rqst = new AddOrganizationRoleRqst
        rqst.setRoleid(this.role_.getId())
        rqst.setOrganizationid(organization)

        // add the member.
        globule.resourceService.addOrganizationRole(rqst, { token: globule.token })
            .then((rsp) => {
                let evt = new CustomEvent(`refresh_${this.role_.getId()}`, { detail: organization })
                document.dispatchEvent(evt)
                this.role_.setOrganizationsList(this.role_.getOrganizationsList().filter((m) => m != organization))

                // push the organization in the list of role.
                this.role_.getOrganizationsList().push(organization)

                // Set back the role.
                this.setRole(this.role_)

                callback()
            }).catch((err) => {
                displayError(err)
            })

    }

    /**
     * 
     * @param {*} organization 
     * @param {*} callback 
     */
    removeOrganization(organization, callback) {

        let globule = AppComponent.globules[0]
        let rqst = new RemoveOrganizationRoleRqst
        rqst.setRoleid(this.role_.getId())
        rqst.setOrganizationid(organization)

        // remove the member.
        globule.resourceService.removeOrganizationRole(rqst, { token: globule.token })
            .then((rsp) => {

                let evt = new CustomEvent(`refresh_${this.role_.getId()}`, { detail: organization })
                document.dispatchEvent(evt)
                this.role_.setOrganizationsList(this.role_.getOrganizationsList().filter((m) => m != organization))

                // if the potential organizations is displayed, I will append the organization to the potential organizations list.
                let potentialOrganizations = this.shadowRoot.getElementById('potential-organizations')
                if (potentialOrganizations.style.display == "flex") {
                    getOrganizationById(organization, (o) => {

                        if (potentialOrganizations.querySelector(`globular-organization-view[id="${organization}_potential"]`) != null) {
                            return
                        }

                        let view = new OrganizationView(o)
                        view.slot = 'organizations'
                        view.id = organization + "_potential"
                        view.setAttribute('closeable', 'false')
                        view.setAttribute('addable', 'true')


                        potentialOrganizations.appendChild(view)

                        // add the event listener.
                        view.addEventListener('click', () => {
                            // I will be sure the a token is available.
                            let globule = AppComponent.globules[0]
                            if (globule == null) {
                                displayError("No globule is connected.")
                                return
                            }

                            if (globule.token == null) {
                                displayAuthentication(`You need to be authenticated to remove an organization from a role.`, globule, () => {
                                    this.addOrganization(organization, () => {
                                        potentialOrganizations.removeChild(view)
                                    })

                                }, err => displayError(err));
                            } else {
                                this.addOrganization(organization, () => {
                                    potentialOrganizations.removeChild(view)
                                })
                            }
                        })
                    })
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
        actionView.addEventListener('click', () => {
            // I will be sure the a token is available.
            let globule = AppComponent.globules[0]
            if (globule == null) {
                displayError("No globule is connected.")
                return
            }

            if (globule.token == null) {
                displayAuthentication(`You need to be authenticated to add an action to a role.`, globule, () => {
                    this.addAction(action, () => {
                        div.removeChild(actionView)
                    })

                }, err => displayError(err));
            } else {
                this.addAction(action, () => {
                    div.removeChild(actionView)
                })
            }
        })
    }

    /**
     * Add action to a role.
     * @param {*} action 
     * @param {*} callback 
     */
    addAction(action, callback) {

        let globule = AppComponent.globules[0]

        let rqst = new AddRoleActionsRqst
        rqst.setRoleid(this.role_.getId())
        let actions = this.role_.getActionsList()
        actions.push(action)
        rqst.setActionsList(actions)

        // add the action.
        globule.resourceService.addRoleActions(rqst, { token: globule.token })
            .then((rsp) => {
                let evt = new CustomEvent(`refresh_${this.role_.getId()}`, { detail: action })
                document.dispatchEvent(evt)
                this.role_.setActionsList(this.role_.getActionsList().filter((m) => m != action))

                // push the action in the list of role.
                this.role_.getActionsList().push(action)

                // Set back the role.
                this.setRole(this.role_)



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
        div.innerHTML = ""
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
                let actions = rsp.getActionsList()
                actions.sort().forEach((action) => {
                    if (this.role_.getActionsList().indexOf(action) == -1) {
                        this.addPotentialActionView(action)
                    }
                })

            }).catch((err) => {
                displayError(err)
            })
    }
}

customElements.define('globular-role-editor', RoleEditor)


/**
 * The role view, this component is used to display the role.
 */
export class RoleView extends HTMLElement {
    // attributes.
    static get observedAttributes() {
        return ['closeable', 'addable', 'summary'];
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
        } else if (name === 'summary') {
            // I will display the summary.
            let details = this.shadowRoot.getElementById('details')
            if (newValue == "true") {
                details.opened = false
            } else {
                details.opened = true
            }
        } else if (name === 'addable') {
            if (newValue == "true") {
                this.addBtn.style.display = "block"
                this.addBtn.addEventListener('click', () => {
                    if (this.onAdd != null) {
                        this.onAdd()
                    }
                })
            } else {
                this.addBtn.style.display = "none"
            }
        }
    }

    // Create the applicaiton view.
    constructor(role) {
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

                flex-direction: column;
                z-index: 100;
            }

            #content:hover {
                cursor: pointer;
            }

            #title {
                font-size: 1rem;
                margin-right: .5rem;
                flex-grow: 1;
                text-decoration: underline;
                line-height: 1.5rem;
                text-align: center;
            }

            #sub-title {
                font-size: 0.8rem;
                margin-left: .5rem;
                margin-right: .5rem;
                text-align: center;
            }

            .organizations, .members {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                padding-left: 1rem;
                padding-right: 1rem;
            }
            
            #close-btn, #add-btn {
                width: 30px;        /* Width of the button */
                height: 30px;       /* Height of the button */
                --iron-icon-width: 10px;  /* Width of the icon */
                --iron-icon-height: 10px; /* Height of the icon */
            }

            #details {
                display: flex;
                flex-direction: column;
                padding-left: 1rem;
                padding-right: 1rem;
            }

            iron-collapse {
                --iron-collapse-transition-duration: 0.3s; /* Smooth transition */
            }
            
            /* When iron-collapse is closed */
           iron-collapse[aria-hidden="true"] {
                max-height: 0; /* Ensures it takes minimal space */
                width: 0; /* Ensures it takes minimal space */
                overflow: hidden; /* Ensures content does not overflow */
                padding: 0; /* Remove padding when closed */
            }

        </style>

        <div id="content">
            <div style="display: flex; flex-direction: row; align-items: center;">
                <paper-icon-button id="close-btn" icon="icons:close" style="display: none;" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <paper-icon-button id="add-btn" icon="icons:add" style="display: none;" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <span id="title">
                    ${role.getName()}
                </span>
            </div>
            <iron-collapse id="details">
                <span id="sub-title"> ${role.getDescription()}</span>
                <div style="display: flex; flex-direction: column; padding: .5rem;">
                    <span id="members-count">Members (${role.getMembersList().length})</span>
                    <div class="members">
                        <slot name="members"></slot>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; padding: .5rem;">
                <span id="members-count">Organizations (${role.getOrganizationsList().length})</span>
                <div class="organizations">
                    <slot name="organizations"></slot>
                </div>
            </div>
            </iron-collapse>
        </div>
        `

        // When the user click on the title span i will display the details.
        let collapse_btn = this.shadowRoot.querySelector("#title")
        let collapse_panel = this.shadowRoot.querySelector("#details")
        collapse_btn.onclick = (evt) => {
            evt.stopPropagation();
            collapse_panel.toggle();
        }

        // give the focus to the input.
        let content = this.shadowRoot.querySelector("#content")
        content.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('currentRoleIdChanged', { detail: role.getId() }))
        })

        // Now I will subscribe to the memberAdded event.
        document.addEventListener(`refresh_${role.getId()}`, (evt) => {

            getRoleById(role.getId(), (roles) => {
                if (roles.length == 0) {
                    displayError("Role not found.")
                    return
                }
                this.role_ = roles[0]
                let membersCount = this.shadowRoot.getElementById('members-count')
                membersCount.innerHTML = `Members (${this.role_.getMembersList().length})`
                this.refresh()
            })

        })

        // Get the buttons.
        this.closeBtn = this.shadowRoot.getElementById('close-btn')
        this.addBtn = this.shadowRoot.getElementById('add-btn')


        this.role_ = role


        console.log(this.role_, role)
        this.refresh()
    }

    refresh() {

        this.innerHTML = ""

        // set the name.
        let name = this.shadowRoot.getElementById('title')
        name.innerHTML = this.role_.getName()

        // set the description.
        let description = this.shadowRoot.getElementById('sub-title')
        description.innerHTML = this.role_.getDescription()

        // add the members...
        let members = this.role_.getMembersList()
        members.forEach((member) => {
            getUserById(member, (user) => {
                let userView = new UserView(user)
                userView.id = member + "_view"
                userView.slot = 'members'
                this.appendChild(userView)
            })
        })

        // add the organizations...
        let organizations = this.role_.getOrganizationsList()
        organizations.forEach((organization) => {
            getOrganizationById(organization, (organization) => {
                let organizationView = new OrganizationView(organization)
                organizationView.id = organization.getId() + "_view"
                organizationView.slot = 'organizations'
                organizationView.setAttribute('summary', 'true')
                this.appendChild(organizationView)
            })
        })
    }

    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-role-view', RoleView)


// The action view component.
export class ActionView extends HTMLElement {
    // attributes.
    static get observedAttributes() {
        return ['closeable', 'addable'];
    }

    // the attribute changed callback.
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
        } else if (name === 'addable') {
            if (newValue == "true") {
                this.addBtn.style.display = "block"
                this.addBtn.addEventListener('click', () => {
                    if (this.onAdd != null) {
                        this.onAdd()
                    }
                })
            } else {
                this.addBtn.style.display = "none"
            }
        }
    }


    // Create the applicaiton view.
    constructor(action) {


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
            flex-direction: row;
            align-items: center;
        }

                    
        #close-btn, #add-btn {
            display: none;
            width: 30px;        /* Width of the button */
            height: 30px;       /* Height of the button */
            --iron-icon-width: 10px;  /* Width of the icon */
            --iron-icon-height: 10px; /* Height of the icon */
        }

        </style>

        <div id="content">
            <paper-icon-button id="close-btn" icon="icons:close" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            <paper-icon-button id="add-btn" icon="icons:add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            <span id="">${action}</span>
        </div>
        `

        // Get the buttons.
        this.closeBtn = this.shadowRoot.getElementById('close-btn')
        this.addBtn = this.shadowRoot.getElementById('add-btn')

        // Add the event listeners.
        this.closeBtn.addEventListener('click', () => {
            if (this.onClose != null) {
                this.onClose()
            }
        })

        this.addBtn.addEventListener('click', () => {
            if (this.onAdd != null) {
                this.onAdd()
            }
        })
    }

}


customElements.define('globular-action-view', ActionView)
