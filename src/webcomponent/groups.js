import { GetAccountRqst, GetGroupsRqst, Group, RemoveGroupMemberAccountRqst } from "globular-web-client/resource/resource_pb";
import { AppComponent } from "../app/app.component";
import { displayAuthentication, displayError, displayQuestion } from "./utility";

function getUserById(id, callback) {
    let rqst = new GetAccountRqst
    rqst.setAccountid(id)

    let globule = AppComponent.globules[0]
    if (globule == null) {
        displayError("No globule is connected.")
        return
    }

    // get the user.
    globule.resourceService.getAccount(rqst, {})
        .then((rsp) => {
            callback(rsp.getAccount())
        }).catch((err) => {
            displayError(err)
        })
}

function getGroupById(id, callback) {
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
                min-height: 176px;
                margin-top: 1rem;
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
                    </div>
                    <div class="row">
                        <label>
                            <paper-icon-button id="add-organization-btn" icon="icons:add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                            Organizations
                        </label>
                        <div class="organizations">
                            <slot name="organizations"></slot>
                        </div>
                    </div>
                </div>
            </div>
            <div id="actions" style="display: flex; flex-direction: row; margin-top: 1rem;">
                <paper-button id="delete-btn" role="button" tabindex="0" aria-disabled="false" style="display:none;">Delete</paper-button>
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
            this.save()
        })

        this.cancelBtn.addEventListener('click', () => {
            this.cancel()
        })
    }

    // The connection callback.
    connectedCallback() {

    }

    // Save the group.
    save() {
        // save the group.
        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
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
                                this.removeMembers(member, group)
                                this.removeChild(userView)
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
     * 
     * @param {*} member 
     * @param {*} callback 
     */
    removeMember(member, callback) {


        question.toastElement.remove()
        let globule = AppComponent.globules[0]
        let rqst = new RemoveGroupMemberAccountRqst
        rqst.setGroupid(group.getId())
        rqst.setAccountid(member)

        // remove the member.
        globule.resourceService.removeGroupMemberAccount(rqst, {})
            .then((rsp) => {
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

    // Create the applicaiton view.
    constructor(group) {
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
                margin-left: .5rem;
                margin-right: .5rem;
                flex-grow: 1;
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
            
        </style>

        <div id="content">
           
            <span id="title">${group.getName()}</span>
            <span id="sub-title"> ${group.getDescription()}</span>
            <div style="display: flex; flex-direction: column; padding: .5rem;">
                <span>Members (${group.getMembersList().length})</span>
                <div class="members">
                    <slot name="members"></slot>
                </div>

                <span>Organizations (${group.getOrganizationsList().length})</span>
                <slot name="organizations"></slot>
            </div>
        </div>
        `

        // give the focus to the input.
        let content = this.shadowRoot.querySelector("#content")
        content.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('currentGroupIdChanged', { detail: group.getId() }))
        })

        // add the members...
        let members = group.getMembersList()
        members.forEach((member) => {
            getUserById(member, (user) => {
                let userView = new UserView(user)
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


/**
 * display the user.
 */
export class UserView extends HTMLElement {

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
    constructor(account) {
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
           
            <img src="${account.getProfilepicture()}"></img>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <paper-icon-button id="close-btn" icon="icons:close" style="display: none;" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <span id="name">${account.getName()}</span>
            </div>
        </div>
        `

        // Get the buttons.
        this.closeBtn = this.shadowRoot.getElementById('close-btn')

    }
}

customElements.define('globular-user-view', UserView)
