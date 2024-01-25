import { AddGroupMemberAccountRqst, CreateGroupRqst, DeleteGroupRqst, GetAccountRqst, GetAccountsRqst, GetGroupsRqst, Group, RemoveGroupMemberAccountRqst, UpdateGroupRqst } from "globular-web-client/resource/resource_pb";
import { AppComponent } from "../app/app.component";
import { displayAuthentication, displayError, displayQuestion } from "./utility";
import { UserView, getUserById } from "./users";



export function getGroupById(id, callback) {
    let rqst = new GetGroupsRqst
    rqst.setQuery(`{"id": "${id}"}`)

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
            callback(groups)
        } else {
            displayError(status.details)
        }
    })
}

/**
 * The groups manager, this component is used to manage the groups, it is used to create, update, delete and search groups.
 */
export class GroupsManager extends HTMLElement {
    // attributes.
    static get observedAttributes() {
        return ['current-group-id'];
    }

    // The connection callback.
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'current-group-id') {
            this.currentGroupId = newValue
            if (this.currentGroupId != newValue && AppComponent.globules[0] != null) {
                this.setCurrentGroup(newValue)
            }
        }
    }

    // Create the applicaiton view.
    constructor() {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // The current group id.
        this.currentGroupId = null

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

            #groups {
                display: flex;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

            #groups > globular-group-view {
                margin-right: 1rem;
                margin-bottom: 1rem;
            }

        </style>

        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <paper-icon-button id="add-btn" icon="icons:add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <span id="title">Groups</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
        </div>
                    
        <slot name="group"></slot>

        <div id="groups">
            <slot name="groups"></slot>
        </div>
        `

        // Get the buttons.
        this.addBtn = this.shadowRoot.getElementById('add-btn')
        this.infoBtn = this.shadowRoot.getElementById('info-btn')

        // Add the event listeners.
        this.addBtn.addEventListener('click', () => {
            this.addGroup()
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
        document.addEventListener('refresh-groups', () => {
            this.init()
        })

        // add current group id changed event listener.
        document.addEventListener('currentGroupIdChanged', (evt) => {
            this.currentGroupId = evt.detail
            if (this.currentGroupId == null) {
                // remove the group editor.
                let editor = this.querySelector('globular-group-editor')
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
        if (this.currentGroupId != null) {
            this.setCurrentGroup(this.currentGroupId)
        }

        // get the groups.
        // Get the users.
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
                this.displayGroups(groups)
            } else {
                displayError(status.details)
            }
        })
    }

    /**
     * Add a group to the list.
     */
    addGroup() {
        // display the group editor.
        let g = new Group()
        g.setName('New Group')

        let editor = this.querySelector('globular-group-editor')
        if (editor == null) {
            editor = new GroupEditor()
            editor.slot = 'group'
            this.appendChild(editor)
        }

        // I will dispatch event currentGroupIdChanged
        this.currentGroupId = "new-group"
        document.dispatchEvent(new CustomEvent('currentGroupIdChanged', { detail: this.currentGroupId }))

        editor.setGroup(g)
    }

    /**
     * Set the current group.
     * @param {*} groupId 
     */
    setCurrentGroup(groupId) {

        this.innerHTML = ""

        // I will dispatch event currentGroupIdChanged
        document.dispatchEvent(new CustomEvent('currentGroupIdChanged', { detail: this.currentGroupId }))

        // set the editor.
        let editor = this.querySelector('globular-group-editor')
        if (editor == null) {
            editor = new GroupEditor()
            editor.slot = 'group'
            this.appendChild(editor)
        }

        // set the group.
        if (groupId == "new-group") {
            let g = new Group()
            g.setName('New Group')
            editor.setGroup(g)
        } else {
            // here I will get the group from the globule and set it to the editor.
            getGroupById(groupId, (groups) => {
                if (groups.length == 0) {
                    displayError("Group not found.")
                    return
                }
                editor.setGroup(groups[0])
            })
        }
    }

    displayGroups(groups) {
        // remove all the groups.
        let groupsDiv = this.shadowRoot.getElementById('groups')
        groupsDiv.innerHTML = ""

        // display the groups.
        groups.forEach((group) => {
            let groupView = new GroupView(group)
            groupView.setAttribute('summary', 'false')
            groupView.slot = 'groups'
            groupsDiv.appendChild(groupView)
            // add the event listener.
            groupView.addEventListener('click', () => {
                this.currentGroupId = group.getId()
                this.setCurrentGroup(group.getId())
            })
        })
    }

    /**
     * Display the info of the group.
     */
    info() {
        // display the group info.
    }

}

customElements.define('globular-groups-manager', GroupsManager)


/**
 * The group editor, this component is used to edit a group.
 */
export class GroupEditor extends HTMLElement {
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

            .organizations, .members {
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

            .group-form {
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

        </style>

        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span id="title">Group Editor</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
            <div class="group-form">
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
                </div>
            </div>
            <div id="actions" style="display: flex; flex-direction: row; margin-top: 1rem;">
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
                displayAuthentication(`You need to be authenticated to save a group.`, globule,
                    () => {
                        this.save()
                    }, err => displayError(err));
            } else {
                this.save()
            }
        })

        this.deleteBtn.addEventListener('click', () => {
            // I will ask the user to confirm the deletion.
            let question = displayQuestion(`Are you sure you want to delete the ${this.group.getName()}?`,
                `<div style="display: flex; justify-content: center; margin-top: 1.5rem;">
                    <paper-button id="yes-btn" role="button" tabindex="0" aria-disabled="false">Yes</paper-button>
                    <paper-button id="no-btn" role="button" tabindex="0" aria-disabled="false">No</paper-button>
                </div>`)

            let yesBtn = question.toastElement.querySelector('#yes-btn')
            let noBtn = question.toastElement.querySelector('#no-btn')

            yesBtn.addEventListener("click", () => {
                question.toastElement.remove()
                this.deleteGroup()
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
            this.displayPotentialMembers()
        })
    }

    // The connection callback.
    connectedCallback() {

    }

    deleteGroup() {
        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        if (globule.token == null) {
            displayAuthentication(`You need to be authenticated to delete a group.`, globule,
                () => {
                    this.deleteGroup()
                    return;
                }, err => displayError(err));
        } else {
            let rqst = new DeleteGroupRqst
            rqst.setGroup(this.group.getId())

            // delete the group.
            globule.resourceService.deleteGroup(rqst, { token: globule.token })
                .then((rsp) => {
                    document.dispatchEvent(new CustomEvent('currentGroupIdChanged', { detail: null }))

                    // I will dispatch event refresh groups.
                    document.dispatchEvent(new CustomEvent('refresh-groups', { detail: null }))


                    // remove the component.
                    this.remove()

                }).catch((err) => {
                    displayError(err)
                })
        }
    }

    // Save the group.
    save() {
        // save the group.
        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        if (this.group.getId() == "") {
            let rqst = new CreateGroupRqst

            let name = this.shadowRoot.getElementById('name')
            this.group.setName(name.value)
            this.group.setId(name.value) // I will use the name as the id.

            let description = this.shadowRoot.getElementById('description')
            this.group.setDescription(description.value)
            rqst.setGroup(this.group)

            // create the group.
            globule.resourceService.createGroup(rqst, { token: globule.token })
                .then((rsp) => {
                    this.setGroup(this.group)
                    document.dispatchEvent(new CustomEvent('currentGroupIdChanged', { detail: this.group.getId() }))
                    document.dispatchEvent(new CustomEvent('refresh-groups', { detail: null }))
                }).catch((err) => {
                    displayError(err)
                })

        } else {

            // use the update group request.
            let rqst = new UpdateGroupRqst
            rqst.setGroupid(this.group.getId())
            let str = `{"$set":{"name": "${this.group.getName()}", "description": "${this.group.getDescription()}"}}`
            rqst.setValues(str)

            // update the group.
            globule.resourceService.updateGroup(rqst, { token: globule.token })
                .then((rsp) => {
                    // I will dispatch event refresh group.
                    let evt = new CustomEvent(`refresh_${this.group.getId()}`, { detail: this.group.getId() })
                    document.dispatchEvent(evt)
                }).catch((err) => {
                    displayError(err)
                })
        }


    }

    // Cancel the group.
    cancel() {
        // cancel the group.
        this.group = null

        document.dispatchEvent(new CustomEvent('currentGroupIdChanged', { detail: null }))


        // remove the component.
        this.remove()
    }

    // set the group.
    setGroup(group) {

        // I will get user view from the slot.
        let members = this.querySelectorAll('globular-user-view[slot="members"]')
        members.forEach((member) => {
            this.removeChild(member)
        })

        this.group = group

        // set the name.
        let name = this.shadowRoot.getElementById('name')
        name.value = group.getName()
        name.addEventListener('input', () => {
            this.group.setName(name.value)
        })

        // set the description.
        let description = this.shadowRoot.getElementById('description')
        description.value = group.getDescription()
        description.addEventListener('input', () => {
            this.group.setDescription(description.value)
        })

        // set the members.
        group.getMembersList().forEach((member) => {
            getUserById(member, (user) => {
                let userView = new UserView(user)
                userView.slot = 'members'
                userView.setAttribute('closeable', 'true')
                this.appendChild(userView)

                // add the event listener.
                userView.onClose = () => {
                    // I will ask the user to confirm the deletion.
                    let question = displayQuestion(`Are you sure you want to remove ${member} from the ${this.group.getName()}?`,
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
    }

    /**
     * That function display the list of potential group members.
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
                    if (this.group.getMembersList().indexOf(account.getId()) == -1) {
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
                                displayAuthentication(`You need to be authenticated to add a member to a group.`, globule, () => {
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

        let rqst = new AddGroupMemberAccountRqst
        rqst.setGroupid(this.group.getId())
        rqst.setAccountid(member)

        // add the member.
        globule.resourceService.addGroupMemberAccount(rqst, { token: globule.token })
            .then((rsp) => {
                let evt = new CustomEvent(`refresh_${this.group.getId()}`, { detail: member })
                document.dispatchEvent(evt)
                this.group.setMembersList(this.group.getMembersList().filter((m) => m != member))

                // push the member to the group.
                this.group.getMembersList().push(member)

                this.setGroup(this.group)
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
        let rqst = new RemoveGroupMemberAccountRqst
        rqst.setGroupid(this.group.getId())
        rqst.setAccountid(member)

        // remove the member.
        globule.resourceService.removeGroupMemberAccount(rqst, { token: globule.token })
            .then((rsp) => {

                let evt = new CustomEvent(`refresh_${this.group.getId()}`, { detail: member })
                document.dispatchEvent(evt)
                this.group.setMembersList(this.group.getMembersList().filter((m) => m != member))

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
                                displayAuthentication(`You need to be authenticated to add a member to a group.`, globule, () => {
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



}

customElements.define('globular-group-editor', GroupEditor)


/**
 * The group view, this component is used to display the group.
 */
export class GroupView extends HTMLElement {
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
    constructor(group) {
        super()

        this.group = group

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
            }

            #sub-title {
                font-size: 0.8rem;
                margin-left: .5rem;
                margin-right: .5rem;
            }

            .members {
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
                    ${group.getName()}
                </span>
            </div>
            <iron-collapse id="details">
                <span id="sub-title"> ${group.getDescription()}</span>
                <div style="display: flex; flex-direction: column; padding: .5rem;">
                    <span id="members-count">Members (${group.getMembersList().length})</span>
                    <div class="members">
                        <slot name="members"></slot>
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
            document.dispatchEvent(new CustomEvent('currentGroupIdChanged', { detail: group.getId() }))
        })

        // Now I will subscribe to the memberAdded event.
        document.addEventListener(`refresh_${group.getId()}`, (evt) => {

            getGroupById(group.getId(), (groups) => {
                if (groups.length == 0) {
                    displayError("Group not found.")
                    return
                }
                this.group = groups[0]
                let membersCount = this.shadowRoot.getElementById('members-count')
                membersCount.innerHTML = `Members (${this.group.getMembersList().length})`
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
        let name = this.shadowRoot.getElementById('title')
        name.innerHTML = this.group.getName()

        // set the description.
        let description = this.shadowRoot.getElementById('sub-title')
        description.innerHTML = this.group.getDescription()

        // add the members...
        let members = this.group.getMembersList()
        members.forEach((member) => {
            getUserById(member, (user) => {
                let userView = new UserView(user)
                userView.id = member + "_view"
                userView.slot = 'members'
                this.appendChild(userView)
            })
        })
    }

    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-group-view', GroupView)


