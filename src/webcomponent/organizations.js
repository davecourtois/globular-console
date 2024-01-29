import { AddOrganizationAccountRqst, AddOrganizationGroupRqst, CreateOrganizationRqst, DeleteOrganizationRqst, GetAccountsRqst, GetGroupsRqst, GetOrganizationsRqst, Organization, RemoveOrganizationAccountRqst, RemoveOrganizationGroupRqst } from "globular-web-client/resource/resource_pb";
import { AppComponent } from "../app/app.component";
import { displayAuthentication, displayError, displayQuestion } from "./utility.js";
import { AvatarChanger, getBase64FromImageUrl } from "./image.js";
import { UserView, getUserById } from "./users";
import { GroupView, getGroupById } from "./groups.js";


/**
 * Get the organization by id.
 * @param {*} organizationId 
 * @param {*} callback 
 * @returns 
 */
export function getOrganizationById(organizationId, callback) {

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
                organizationView.setAttribute("summary", "false")
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

            input {
                font-family: Arial, Helvetica, sans-serif; /* Primary font */
                font-size: 16px; /* Readable size */
                color: #333; /* Font color */
                /* Add other styles like padding, borders as needed */
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

            #potential-members > globular-user-view:hover {
                cursor: pointer;
            }

            .groups, .roles, .applications, .members {
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
                    <div class="row">
                        <label>
                            <paper-icon-button id="add-member-btn" icon="icons:add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                            Accounts
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
                            <paper-icon-button id="add-group-btn" icon="icons:add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                            Groups
                        </label>
                        <div class="groups">
                            <slot name="groups"></slot>
                        </div>
                        <div id="potential-groups" class="groups" style="margin-left: 1rem; display: none;">
                            <span style="margin-left: 1rem; margin-right: 1rem;">Potential Groups</span>
                        </div>
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

        // Add members button.
        this.addMemberBtn = this.shadowRoot.getElementById('add-member-btn')
        this.addMemberBtn.addEventListener('click', () => {
            this.displayPotentialMembers()
        })

        // Add groups button.
        this.addGroupBtn = this.shadowRoot.getElementById('add-group-btn')
        this.addGroupBtn.addEventListener('click', () => {
            this.displayPotentialGroups()
        })
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

        // I will remove the user views.
        let members = this.querySelectorAll("globular-user-view")
        members.forEach(member => {
            member.remove()
        });

        // I will remove the group views.
        let groups = this.querySelectorAll("globular-group-view")
        groups.forEach(group => {
            group.remove()
        });

        // set the members.
        this.organization.getAccountsList().forEach((member) => {
            getUserById(member, (user) => {
                let userView = new UserView(user)
                userView.slot = 'members'
                userView.setAttribute('closeable', 'true')
                userView.setAttribute('summary', 'true')
                this.appendChild(userView)

                // add the event listener.
                userView.onClose = () => {
                    // I will ask the user to confirm the deletion.
                    let question = displayQuestion(`Are you sure you want to remove ${member} from the ${this.organization.getName()}?`,
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
                            displayAuthentication(`You need to be authenticated to remove a member from a group.`, globule, () => {
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

        // set the groups.
        this.organization.getGroupsList().forEach((group) => {
            getGroupById(group, (g) => {
                let groupView = new GroupView(g[0])
                groupView.slot = 'groups'
                groupView.setAttribute('closeable', 'true')
                groupView.setAttribute('addable', 'false')
                groupView.setAttribute('summary', 'true')
                this.appendChild(groupView)

                // add the event listener.
                groupView.onClose = () => {
                    // I will ask the user to confirm the deletion.
                    let question = displayQuestion(`Are you sure you want to remove ${group} from the ${this.organization.getName()}?`,
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
                                this.removeGroup(group, () => {
                                    this.removeChild(groupView)
                                })
                            }, err => displayError(err));
                        } else {
                            this.removeGroup(group, () => {
                                this.removeChild(groupView)
                            })
                        }
                    })

                    noBtn.addEventListener("click", () => {
                        question.toastElement.remove()
                    })
                }
            })
        })

    }

    /**
     * That function display the list of potential organizations members.
     */
    displayPotentialMembers() {
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
                    if (this.organization.getAccountsList().indexOf(account.getId()) == -1) {
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
                                displayAuthentication(`You need to be authenticated to add a member to an organization.`, globule, () => {
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

        let rqst = new AddOrganizationAccountRqst
        rqst.setOrganizationid(this.organization.getId())
        rqst.setAccountid(member)

        // add the member.
        globule.resourceService.addOrganizationAccount(rqst, { token: globule.token })
            .then((rsp) => {
                let evt = new CustomEvent(`refresh_${this.organization.getId()}`, { detail: member })
                document.dispatchEvent(evt)
                this.organization.setAccountsList(this.organization.getAccountsList().filter((m) => m != member))

                // push the member to the group.
                this.organization.getAccountsList().push(member)

                // Set back the organization.
                this.setOrganization(this.organization)

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
        let rqst = new RemoveOrganizationAccountRqst
        rqst.setOrganizationid(this.organization.getId())
        rqst.setAccountid(member)

        // remove the member.
        globule.resourceService.removeOrganizationAccount(rqst, { token: globule.token })
            .then((rsp) => {

                let evt = new CustomEvent(`refresh_${this.organization.getId()}`, { detail: member })
                document.dispatchEvent(evt)
                this.organization.setAccountsList(this.organization.getAccountsList().filter((m) => m != member))

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
                                displayAuthentication(`You need to be authenticated to add a member to an organization.`, globule, () => {
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
     * That function display the list of potential group members.
     */
    displayPotentialGroups() {
        // first of all i need to get the list of all accounts.
        let rqst = new GetGroupsRqst
        rqst.setQuery("{}")

        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        let stream = globule.resourceService.getGroups(rqst, {})
        let groups = []

        stream.on('data', (rsp) => {
            groups = groups.concat(rsp.getGroupsList())
        })

        stream.on("status", (status) => {
            if (status.code == 0) {

                let potentialGroups = this.shadowRoot.getElementById('potential-groups')
                potentialGroups.innerHTML = ""
                potentialGroups.style.display = "flex"

                // display the potential members.
                groups.forEach((group) => {
                    if (this.organization.getGroupsList().indexOf(group.getId()) == -1) {
                        let groupView = new GroupView(group)
                        groupView.slot = 'groups'
                        groupView.id = group.getId() + "_potential"
                        groupView.setAttribute('closeable', 'false')
                        groupView.setAttribute('addable', 'true')
                        potentialGroups.appendChild(groupView)

                        // add the event listener.
                        groupView.addEventListener('click', () => {
                            // I will be sure the a token is available.
                            let globule = AppComponent.globules[0]
                            if (globule == null) {
                                displayError("No globule is connected.")
                                return
                            }

                            if (globule.token == null) {
                                displayAuthentication(`You need to be authenticated to add a member to an organization.`, globule, () => {
                                    this.addGroup(group.getId(), () => {
                                        potentialGroups.removeChild(groupView)
                                    })

                                }, err => displayError(err));
                            } else {
                                this.addGroup(group.getId(), () => {
                                    potentialGroups.removeChild(groupView)
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

    addGroup(group, callback) {

        let globule = AppComponent.globules[0]

        let rqst = new AddOrganizationGroupRqst
        rqst.setOrganizationid(this.organization.getId())
        rqst.setGroupid(group)

        // add the member.
        globule.resourceService.addOrganizationGroup(rqst, { token: globule.token })
            .then((rsp) => {
                let evt = new CustomEvent(`refresh_${this.organization.getId()}`, { detail: group })
                document.dispatchEvent(evt)
                this.organization.setGroupsList(this.organization.getGroupsList().filter((m) => m != group))

                // push the member to the group.
                this.organization.getGroupsList().push(group)

                // Set back the organization.
                this.setOrganization(this.organization)

                callback()
            }).catch((err) => {
                displayError(err)
            })

    }

    /**
     * 
     * @param {*} group 
     * @param {*} callback 
     */
    removeGroup(group, callback) {

        let globule = AppComponent.globules[0]
        let rqst = new RemoveOrganizationGroupRqst
        rqst.setOrganizationid(this.organization.getId())
        rqst.setGroupid(group)

        // remove the member.
        globule.resourceService.removeOrganizationGroup(rqst, { token: globule.token })
            .then((rsp) => {

                let evt = new CustomEvent(`refresh_${this.organization.getId()}`, { detail: group })
                document.dispatchEvent(evt)
                this.organization.setGroupsList(this.organization.getGroupsList().filter((m) => m != group))

                // if the potential groups is displayed, I will append the group to the potential groups.
                let potentialGroups = this.shadowRoot.getElementById('potential-groups')
                if (potentialGroups.style.display == "flex") {
                    getGroupById(group, (g) => {

                        if (potentialGroups.querySelector(`globular-group-view[id="${group}_potential"]`) != null) {
                            return
                        }

                        let groupView = new GroupView(g[0])
                        groupView.slot = 'groups'
                        groupView.id = group + "_potential"
                        groupView.setAttribute('closeable', 'false')
                        groupView.setAttribute('addable', 'true')


                        potentialGroups.appendChild(groupView)

                        // add the event listener.
                        groupView.addEventListener('click', () => {
                            // I will be sure the a token is available.
                            let globule = AppComponent.globules[0]
                            if (globule == null) {
                                displayError("No globule is connected.")
                                return
                            }

                            if (globule.token == null) {
                                displayAuthentication(`You need to be authenticated to add a member to an organization.`, globule, () => {
                                    this.addGroup(group, () => {
                                        potentialGroups.removeChild(groupView)
                                    })

                                }, err => displayError(err));
                            } else {
                                this.addGroup(group, () => {
                                    potentialGroups.removeChild(groupView)
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

}

customElements.define('globular-organization-editor', OrganizationEditor)


/**
 * display the organization.
 */
export class OrganizationView extends HTMLElement {

    // attributes.
    static get observedAttributes() {
        return ['closeable', 'summary', 'addable'];
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
                text-decoration: underline;
            }

            #close-btn {
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

            #close-btn, #add-btn {
                width: 30px;
                height: 30px;
                --iron-icon-width: 10px;
                --iron-icon-height: 10px;
            }

            .groups, .members {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                padding-left: 1rem;
                padding-right: 1rem;
            }
            

        </style>
        <div id="content">
            
            <img src="${organization.getIcon()}"></img>
            <div style="display: flex; flex-direction: row; align-items: flex-start;">
                <paper-icon-button id="close-btn" icon="icons:close" style="display: none;" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <paper-icon-button id="add-btn" icon="icons:add" style="display: none;" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <span id="name">${organization.getName()}</span>
            </div>

            <iron-collapse id="details">
                <div style="margin-top: 1rem; margin-bottom: 1rem;">
                    <span style="font-size: 0.8rem;">${organization.getDescription()}</span>
                </div>
                <div style="display: flex; flex-direction: column; padding: .5rem;">
                    <span id="members-count">Members (${organization.getAccountsList().length})</span>
                    <div class="members">
                        <slot name="members"></slot>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; padding: .5rem;">
                <span id="group-count">Groups (${organization.getGroupsList().length})</span>
                    <div class="groups">
                        <slot name="groups"></slot>
                    </div>
                </div>
            </iron-collapse>
        </div>
        `

        this.organization = organization

        // Get the buttons.
        this.closeBtn = this.shadowRoot.getElementById('close-btn')
        this.addBtn = this.shadowRoot.getElementById('add-btn')


        // When the user click on the title span i will display the details.
        let collapse_btn = this.shadowRoot.querySelector("#name")
        let collapse_panel = this.shadowRoot.querySelector("#details")
        collapse_btn.onclick = (evt) => {
            evt.stopPropagation();
            collapse_panel.toggle();
        }

        // give the focus to the input.
        let content = this.shadowRoot.querySelector("#content")
        content.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('currentGroupIdChanged', { detail: this.organization.getId() }))
        })

        // Now I will subscribe to the memberAdded event.
        document.addEventListener(`refresh_${organization.getId()}`, (evt) => {

            getOrganizationById(organization.getId(), (organization) => {
    
                this.organization = organization
                let membersCount = this.shadowRoot.getElementById('members-count')
                membersCount.innerHTML = `Members (${this.organization.getAccountsList().length})`
                this.refresh()
            })

        })

        // Get the buttons.
        this.closeBtn = this.shadowRoot.getElementById('close-btn')
        this.addBtn = this.shadowRoot.getElementById('add-btn')



        this.refresh()
    }

    refresh() {

        this.innerHTML = ""

        // set the name.
        let name = this.shadowRoot.getElementById('name')
        name.innerHTML = this.organization.getName()

        // add the members...
        let members = this.organization.getAccountsList()
        members.forEach((member) => {
            getUserById(member, (user) => {
                let userView = new UserView(user)
                userView.id = member + "_view"
                userView.slot = 'members'
                this.appendChild(userView)
            })
        })

        // add the groups...
        let groups = this.organization.getGroupsList()
        groups.forEach((group) => {
            getGroupById(group, (g) => {
                let groupView = new GroupView(g[0])
                groupView.id = group + "_view"
                groupView.slot = 'groups'
                this.appendChild(groupView)
            })
        })
    }

}

customElements.define('globular-organization-view', OrganizationView)
