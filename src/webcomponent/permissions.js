
import { v4 as uuidv4 } from "uuid";
import { DeleteResourcePermissionsRqst, GetActionResourceInfosRqst, GetResourcePermissionsByResourceTypeRqst, GetResourcePermissionsRqst, Permissions, Permission, SetResourcePermissionsRqst } from "globular-web-client/rbac/rbac_pb";
import { SearchableAccountList, SearchableApplicationList, SearchableGroupList, SearchableOrganizationList, SearchablePeerList } from "./list.js";
import { getAllApplicationsInfo, getAllGroups } from "globular-web-client/api";
import { randomUUID } from "./utility";
import { getOrganizations, getOrganizationById } from "./organizations.js";
import '@polymer/iron-icons/av-icons'
import '@polymer/iron-icons/editor-icons'
import { GetApplicationsRqst, GetPackagesDescriptorRequest } from "globular-web-client/resource/resource_pb";
import * as getUuidByString from "uuid-by-string";
import { getAllPeers, getPeerById } from "./peers.js";
import { getRoleById } from "./roles.js";
import { FindOneRqst } from "globular-web-client/persistence/persistence_pb";
import { AppComponent } from "../app/app.component";
import { GetConversationRequest } from "globular-web-client/conversation/conversation_pb.js";
import { getApplicationsById } from "./applications.js";
import { ApplicationInfo } from "./informations.js";
import { getAccounts } from "./users.js";

/**
 * Sample empty component
 */
export class PermissionsManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(globule) {
        super()

        // Set the globule.
        this.globule = globule

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // the active permissions.
        this.permissions = null

        // the active path.
        this.path = ""

        // The listener
        this.savePermissionListener = ""

        // Keep the list of possible permissions.
        this.permissionsNames = ["read", "write", "delete"]

        this.onclose = null

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                display: flex;
                flex-direction: column;
                padding: 8px;
                /*background-color: var(--palette-background-paper);*/
            }

            #header {
                display: flex;
            }

            .title{
                align-items: center;
                display: flex;
                flex-grow: 1;
                font-weight: 400;
                color: var(--palette-text-secondary);
                border-bottom: 2px solid;
                border-color: var(--palette-divider);
            }

            .permissions{
                padding: 10px;
            }

            ::slotted(globular-permissions-viewer){
                padding-bottom: 20px; 
                padding-right: 40px;
            }

        </style>
        <div id="container">
            <div id="header">
                <div id="path" class="title"> </div>
                <paper-icon-button icon="close"></paper-icon-button>
                
            </div>
            <slot name="permission-viewer"></slot>
            <div style="padding-right: 40px;">
                <div  class="title">
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="owner-collapse-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
                    Owner(s)
                </div>
                <iron-collapse class="permissions" id="owner">
                    <slot name="owner"> </slot>
                </iron-collapse>
            </div>
            <div>
                <div style="display: flex; position: relative;">
                    <div class="title" style="flex-grow: 1;">
                    <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                        <iron-icon  id="allowed-collapse-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                        <paper-ripple class="circle" recenters=""></paper-ripple>
                    </div>
                        Allowed(s)
                    </div>
                    <paper-icon-button  id="add-allowed-btn" icon="icons:add"></paper-icon-button>
                </div>
                <iron-collapse class="permissions" id="allowed">
                    <slot name="allowed"> </slot>
                </iron-collapse>
            </div>
            <div>
                <div style="display: flex; position: relative;">
                    <div class="title" style="flex-grow: 1;">
                    <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                        <iron-icon  id="denied-collapse-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                        <paper-ripple class="circle" recenters=""></paper-ripple>
                    </div>
                        Denied(s)
                    </div>
                    <paper-icon-button id="add-denied-btn" icon="icons:add"></paper-icon-button>
                </div>
                <iron-collapse class="permissions" id="denied">
                    <slot name="denied"> </slot>
                </iron-collapse>
            </div>
        </div>
        `

        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")


        this.pathDiv = this.shadowRoot.querySelector("#path")
        this.style.overflowY = "auto"

        // The tree sections.
        this.owners = this.shadowRoot.querySelector("#owner")
        this.alloweds = this.shadowRoot.querySelector("#allowed")
        this.denieds = this.shadowRoot.querySelector("#denied")

        // Now the collapse panels...
        this.owners_collapse_btn = this.shadowRoot.querySelector("#owner-collapse-btn")
        this.owners_collapse_btn.onclick = () => {
            if (!this.owners.opened) {
                this.owners_collapse_btn.icon = "unfold-more"
            } else {
                this.owners_collapse_btn.icon = "unfold-less"
            }
            this.owners.toggle();
        }

        this.alloweds_collapse_btn = this.shadowRoot.querySelector("#allowed-collapse-btn")
        this.alloweds_collapse_btn.onclick = () => {
            if (!this.alloweds.opened) {
                this.alloweds_collapse_btn.icon = "unfold-more"
            } else {
                this.alloweds_collapse_btn.icon = "unfold-less"
            }
            this.alloweds.toggle();
        }

        this.denieds_collapse_btn = this.shadowRoot.querySelector("#denied-collapse-btn")
        this.denieds_collapse_btn.onclick = () => {
            if (!this.denieds.opened) {
                this.denieds_collapse_btn.icon = "unfold-more"
            } else {
                this.denieds_collapse_btn.icon = "unfold-less"
            }
            this.denieds.toggle();
        }

        this.addDeniedBtn = this.shadowRoot.querySelector("#add-denied-btn")
        this.addDeniedBtn.onclick = () => {
            this.addPermission(this.addDeniedBtn, "denied")
        }

        this.addAllowedBtn = this.shadowRoot.querySelector("#add-allowed-btn")
        this.addAllowedBtn.onclick = () => {
            this.addPermission(this.addAllowedBtn, "allowed")
        }


        // The close button...
        let closeButton = this.shadowRoot.querySelector("paper-icon-button")
        closeButton.onclick = () => {
            if (this.onclose) {
                this.onclose()
            }
            // remove it from it parent.
            this.parentNode.removeChild(this)
        }

    }

    hideHeader() {
        this.shadowRoot.querySelector("#header").style.display = "none"
    }

    showHeader() {
        this.shadowRoot.querySelector("#header").style.display = ""
    }

    // Add the list of available permissions.
    addPermission(parent, type) {

        let addPermissionPanel = parent.parentNode.querySelector("#add-permission-panel")

        if (addPermissionPanel == null && this.permissionsNames.length > 0) {
            let html = `
            <style>
               
                #add-permission-panel{
                    position: absolute;
                    right: 20px;
                    top: ${parent.offsetTop + 20}px;
                    z-index: 100;
                    background-color: var(--palette-background-paper);
                    color: var(--palette-text-primary);
                }

                .card-content{
                    overflow-y: auto;
                    min-width: 200px;
                }

                paper-card{
                    background-color: var(--palette-background-paper);
                    color: var(--palette-text-primary);
                }

            </style>
            <paper-card id="add-permission-panel">
                <div style="display: flex; align-items: center;">
                    <div style="flex-grow: 1; padding: 5px;">
                        Add Permission
                    </div>
                    <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                </div>
                <div class="card-content">
                    <paper-radio-group>
                    </paper-radio-group>
                </div>
            </paper-card>
            `

            // Add the fragment.
            parent.parentNode.appendChild(document.createRange().createContextualFragment(html))

            let buttonGroup = parent.parentNode.querySelector("paper-radio-group")
            this.permissionsNames.sort()
            this.permissionsNames.forEach(p => {
                let radioBtn = document.createElement("paper-radio-button")
                radioBtn.name = p
                radioBtn.innerHTML = p
                buttonGroup.appendChild(radioBtn)
                radioBtn.onclick = () => {
                    this.createPermission(p, type)
                    let popup = parent.parentNode.querySelector("paper-card")
                    popup.parentNode.removeChild(popup)
                }
            })

            // Remove the popup...
            parent.parentNode.querySelector("#cancel-btn").onclick = () => {
                let popup = parent.parentNode.querySelector("paper-card")
                popup.parentNode.removeChild(popup)
            }
        }
    }

    // Create the permission.
    createPermission(name, type) {
        // So here I will try to find if the permission already exist in the interface.
        let id = "permission_" + name + "_" + type + "_panel"
        let panel = this.querySelector("#" + id)
        if (panel == null) {
            // create the panel.
            panel = new PermissionPanel(this)

            panel.setAttribute("id", id)
            let permission = new Permission
            permission.setName(name)
            panel.setPermission(permission)

            // set the permission in the permissions object.
            if (type == "allowed") {
                this.permissions.getAllowedList().push(permission)
                panel.slot = "allowed"

            } else if (type == "denied") {
                this.permissions.getDeniedList().push(permission)
                panel.slot = "denied"
            }

            this.appendChild(panel)

        } else {
            ApplicationView.displayMessage("Permission " + name + " already exist", 3000)
        }

        if (type == "allowed") {
            // display the panel
            if (!this.alloweds.opened) {
                this.alloweds.toggle()
            }
        } else if (type == "denied") {
            if (!this.denieds.opened) {
                this.denieds.toggle()
            }
        }
    }

    // Save permissions
    savePermissions(callback) {
        let rqst = new SetResourcePermissionsRqst


        rqst.setPermissions(this.permissions)
        rqst.setPath(this.path)

        if (!this.permissions.getResourceType()) {
            this.permissions.setResourceType("file")
        }

        rqst.setResourcetype(this.permissions.getResourceType())

        this.globule.rbacService.setResourcePermissions(rqst, {
            token: localStorage.getItem("user_token"),
            domain: this.globule.config.Domain,
            address: this.globule.config.Address
        }).then(rsp => {
            // reload the interface.
            this.setPath(this.path)

            Backend.publish(Application.account.id + "_change_permission_event", {}, false)
            if (callback) {
                callback()
            }
        }).catch(err => {
            ApplicationView.displayMessage(err, 3000);
            this.setPath(this.path)
            // force reload the interfce...
        })
    }

    setPermissions(permissions) {
        if (permissions == null) {
            console.log("permissions is null")
            return;
        }

        this.permissions = permissions

        // clear the panel values.
        this.pathDiv.innerHTML = this.path;
        this.innerHTML = ""

        // set the permssion viewer
        this.permissionsViewer = new PermissionsViewer(["read", "write", "delete", "owner"])
        this.permissionsViewer.slot = "permission-viewer"
        this.permissionsViewer.setPermissions(this.permissions)
        this.permissionsViewer.permissionManager = this;
        this.appendChild(this.permissionsViewer)

        // Here I will display the owner's
        let ownersPermissionPanel = new PermissionPanel(this)
        ownersPermissionPanel.id = "permission_owners_panel"


        ownersPermissionPanel.setPermission(this.permissions.getOwners(), true)
        ownersPermissionPanel.slot = "owner"
        this.appendChild(ownersPermissionPanel)

        // The list of denied and allowed permissions.
        this.permissions.getAllowedList().forEach(p => {
            let panel = new PermissionPanel(this)
            panel.id = "permission_" + p.getName() + "_allowed_panel"
            panel.slot = "allowed"
            panel.setPermission(p)
            this.appendChild(panel)
        })

        this.permissions.getDeniedList().forEach(p => {
            let panel = new PermissionPanel(this)
            panel.id = "permission_" + p.getName() + "_denied_panel"
            panel.slot = "denied"
            panel.setPermission(p)
            this.appendChild(panel)
        })
    }

    // retreive the permissions from the backeend and set it in the interface.
    setPath(path) {
        // Keep the path in memory
        this.path = path;

        // So here I will get the actual permissions.
        let rqst = new GetResourcePermissionsRqst
        rqst.setPath(path)

        this.globule.rbacService.getResourcePermissions(rqst, {
            domain: this.globule.config.Domain,
        }).then(rsp => {
            let permissions = rsp.getPermissions()
            this.setPermissions(permissions)
        }).catch(err => {
            // ApplicationView.displayMessage(err, 3000)
            console.log("permissions not define for ", path, "new permissions will be created.")
            let permissions = new Permissions
            permissions.setPath(path)
            let owners = new Permission
            owners.setName("owner")
            permissions.setOwners(owners)
            this.setPermissions(permissions)

        })
    }

    // Set the resource type.
    setResourceType(resource_type) {
        if (this.permissions) {
            this.permissions.setResourceType(resource_type)
        }
    }
}

customElements.define('globular-permissions-manager', PermissionsManager)


/**
 * Search Box
 */
export class PermissionPanel extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(permissionManager) {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.permissionManager = permissionManager;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            .title{
                flex-grow: 1;
                font-size: 1.2rem;
                font-weight: 400;
                color: var(--palette-text-secondary);
                border-color: var(--palette-divider);
            }

            .members{
                display: flex;
                flex-direction: column;
            }

            .header{
                position: relative;
            }

        </style>
        <div>
            <div class="title">
            </div>
            <div class="members">

            </div>
        </div>
        `

        // test create offer...
    }

    // Set Permission infos...
    setPermission(permission, hideTitle) {

        this.permission = permission;

        if (hideTitle == undefined) {
            this.shadowRoot.querySelector(".title").innerHTML = permission.getName()
        } else {
            this.shadowRoot.querySelector(".title").style.display = "none";
        }

        // Set's account permissions.
        if (permission.getAccountsList().length > 0)
            this.setAccountsPermissions(permission.getAccountsList());
        else
            this.setAccountsPermissions([]);

        // Set's groups permissions
        if (permission.getGroupsList().length > 0)
            this.setGroupsPermissions(permission.getGroupsList());
        else
            this.setGroupsPermissions([]);

        // Set's Applications permissions
        if (permission.getApplicationsList().length > 0)
            this.setApplicationsPermissions(permission.getApplicationsList());
        else
            this.setApplicationsPermissions([]);

        // Set's Orgnanization permissions
        if (permission.getOrganizationsList().length > 0)
            this.setOrgnanizationsPermissions(permission.getOrganizationsList());
        else
            this.setOrgnanizationsPermissions([]);

        // Set's Peer permissions
        if (permission.getPeersList().length > 0)
            this.setPeersPermissions(permission.getPeersList());
        else
            this.setPeersPermissions([]);
    }

    // Create a collapseible panel.
    createCollapsible(title) {
        let uuid = "_" + randomUUID()
        let html = `
        <style>
            .header {
                display: flex;
                align-items: center;
            }

            .title{
                flex-grow: 1;
            }

            iron-icon:hover{
                cursor: pointer;
            }

        </style>
        <div style="padding-left: 10px; width: 100%">
            <div class="header">
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="${uuid}-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
                <span class="title">${title}</span>
            </div>
            <iron-collapse id="${uuid}-collapse-panel"  style="margin: 5px;">
                
            </iron-collapse>
        </div>
        `

        this.shadowRoot.querySelector(".members").appendChild(document.createRange().createContextualFragment(html))
        let content = this.shadowRoot.querySelector(`#${uuid}-collapse-panel`)
        this.hideBtn = this.shadowRoot.querySelector(`#${uuid}-btn`)

        this.hideBtn.onclick = () => {
            let button = this.shadowRoot.querySelector(`#${uuid}-btn`)
            if (button && content) {
                if (!content.opened) {
                    button.icon = "unfold-more"
                } else {
                    button.icon = "unfold-less"
                }
                content.toggle();
            }
        }
        // return the collapse panel.
        return this.shadowRoot.querySelector(`#${uuid}-collapse-panel`)
    }

    // The organization permissions
    setPeersPermissions(peers_) {

        let content = this.createCollapsible(`Peers(${peers_.length})`)
        getAllPeers(
            this.permissionManager.globule,
            peers => {
                let list = []
                this.permission.getPeersList().forEach(peerId => {
                    let p_ = peers.find(p => p.getMac() === peerId);
                    if (p_ != undefined) {
                        list.push(p_)
                    }
                })

                let peersList = new SearchablePeerList("Peers", list,
                    p => {
                        let index = this.permission.getPeersList().indexOf(p.getMac())
                        if (index != -1) {
                            this.permission.getPeersList().splice(index, 1)
                            this.permissionManager.savePermissions()
                            peersList.removeItem(p)
                        }
                    },
                    p => {
                        let index = this.permission.getPeersList().indexOf(p.getMac())
                        if (index == -1) {
                            this.permission.getPeersList().push(p.getMac())
                            this.permissionManager.savePermissions()
                            peersList.appendItem(p)
                        }
                    })

                // Do not display the title again...
                peersList.hideTitle()
                content.appendChild(peersList)
            }, err => ApplicationView.displayMessage(err, 3000))

    }

    // The organization permissions
    setOrgnanizationsPermissions(organizations_) {

        let content = this.createCollapsible(`Organizations(${organizations_.length})`)
        getOrganizations(
            organizations => {
                let list = []
                this.permission.getOrganizationsList().forEach(organizationId => {
                    let o_ = organizations.find(o => o.getId() === organizationId);
                    if (o_ == undefined) {
                        o_ = organizations.find(o => o.getId() + "@" + o.getDomain() === organizationId);
                    }
                    if (o_ != undefined) {
                        list.push(o_)
                    }
                })

                let organizationList = new SearchableOrganizationList("Organizations", list,
                    o => {
                        let index = this.permission.getOrganizationsList().indexOf(o.getId())
                        if (index == -1) {
                            index = this.permission.getOrganizationsList().indexOf(o.getId() + "@" + o.getDomain())
                        }
                        if (index != -1) {
                            this.permission.getOrganizationsList().splice(index, 1)
                            this.permissionManager.savePermissions()
                            organizationList.removeItem(o)
                        }
                    },
                    o => {
                        let index = this.permission.getOrganizationsList().indexOf(o.getId())
                        if (index == -1) {
                            index = this.permission.getOrganizationsList().indexOf(o.getId() + "@" + o.getDomain())
                        }
                        if (index == -1) {
                            this.permission.getOrganizationsList().push(o.getId() + "@" + o.getDomain())
                            this.permissionManager.savePermissions()
                            organizationList.appendItem(o)
                        }
                    })

                // Do not display the title again...
                organizationList.hideTitle()
                content.appendChild(organizationList)
            }, err => ApplicationView.displayMessage(err, 3000), this.permissionManager.globule)

    }

    // The group permissions
    setApplicationsPermissions(applications_) {

        let content = this.createCollapsible(`Applications(${applications_.length})`)
        getAllApplicationsInfo(this.permissionManager.globule,
            applications => {
                // I will get the account object whit the given id.
                let list = []

                this.permission.getApplicationsList().forEach(applicationId => {
                    let a_ = applications.find(a => a.getId() + "@" + a.getDomain() === applicationId);
                    if (a_ == undefined) {
                        a_ = applications.find(a => a.getId() === applicationId);
                    }
                    if (a_ != undefined) {
                        list.push(a_)
                    }
                })

                let applicationList = new SearchableApplicationList("Applications", list,
                    a => {
                        let index = this.permission.getApplicationsList().indexOf(a.getId())
                        if (index == -1) {
                            index = this.permission.getApplicationsList().indexOf(a.getId() + "@" + a.getDomain())
                        }
                        if (index != -1) {
                            this.permission.getApplicationsList().splice(index, 1)
                            this.permissionManager.savePermissions()
                            applicationList.removeItem(a)
                        }
                    },
                    a => {
                        let index = this.permission.getApplicationsList().indexOf(a.getId())
                        if (index == -1) {
                            index = this.permission.getApplicationsList().indexOf(a.getId() + "@" + a.getDomain())
                        }
                        if (index == -1) {
                            this.permission.getApplicationsList().push(a.getId() + "@" + a.getDomain())
                            this.permissionManager.savePermissions()
                            applicationList.appendItem(a)
                        }
                    })

                // Do not display the title again...
                applicationList.hideTitle()
                content.appendChild(applicationList)

            }), err => ApplicationView.displayMessage(err, 3000)

    }

    // The group permissions
    setGroupsPermissions(groups_) {

        let content = this.createCollapsible(`Groups(${groups_.length})`)

        getAllGroups(this.permissionManager.globule,
            groups => {
                // I will get the account object whit the given id.
                let list = []

                this.permission.getGroupsList().forEach(groupId => {

                    let g_ = groups.find(g => g.getId() === groupId);
                    if (g_ == undefined) {
                        g_ = groups.find(g => g.getId() + "@" + g.getDomain() === groupId);
                    }

                    if (g_ != undefined) {
                        list.push(g_)
                    }

                })

                let groupsList = new SearchableGroupList("Groups", list,
                    g => {
                        let index = this.permission.getGroupsList().indexOf(g.getId())
                        if (index == -1) {
                            index = this.permission.getGroupsList().indexOf(g.getId() + "@" + g.getDomain())
                        }
                        if (index != -1) {
                            this.permission.getGroupsList().splice(index, 1)
                            this.permissionManager.savePermissions()
                            groupsList.removeItem(g)
                        }
                    },
                    g => {
                        let index = this.permission.getGroupsList().indexOf(g.getId())
                        if (index == -1) {
                            index = this.permission.getGroupsList().indexOf(g.getId() + "@" + g.getDomain())
                        }
                        if (index == -1) {
                            this.permission.getGroupsList().push(g.getId() + "@" + g.getDomain())
                            this.permissionManager.savePermissions()
                            groupsList.appendItem(g)
                        }
                    })

                // Do not display the title again...
                groupsList.hideTitle()
                content.appendChild(groupsList)

            }), err => ApplicationView.displayMessage(err, 3000)

    }

    // Each permission can be set for applications, peers, accounts, groups or organizations
    setAccountsPermissions(accounts_) {

        let content = this.createCollapsible(`Account(${accounts_.length})`)

        // Here I will set the content of the collapse panel.
        // Now the account list.
        getAccounts("{}",
            accounts => {

                // I will get the account object whit the given id.
                let list = []
                accounts_.forEach(accountId => {
                    let a_ = accounts.find(a => a._id + "@" + a.domain === accountId);
                    if (a_ == undefined) {
                        a_ = accounts.find(a => a._id === accountId);
                    }

                    if (a_ != undefined) {
                        list.push(a_)
                    }
                })

                let accountsList = new SearchableAccountList("Accounts", list,
                    a => {
                        let index = this.permission.getAccountsList().indexOf(a._id)
                        if (index == -1) {
                            index = this.permission.getAccountsList().indexOf(a._id + "@" + a.domain)
                        }
                        if (index != -1) {
                            this.permission.getAccountsList().splice(index, 1)
                            this.permissionManager.savePermissions()
                            accountsList.removeItem(a)
                        }
                    },
                    a => {
                        let index = this.permission.getAccountsList().indexOf(a._id)
                        if (index == -1) {
                            index = this.permission.getAccountsList().indexOf(a._id + "@" + a.domain)
                        }
                        if (index == -1) {
                            this.permission.getAccountsList().push(a._id + "@" + a.domain)
                            this.permissionManager.savePermissions()
                            accountsList.appendItem(a)
                        }
                    })

                // Do not display the title again...
                accountsList.hideTitle()

                content.appendChild(accountsList)
            }, err => {
                ApplicationView.displayMessage(err, 3000)
            })

    }

}

customElements.define('globular-permission-panel', PermissionPanel)


/**
 * Display all permissions at once.
 */
export class PermissionsViewer extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(permissionsNames) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.permissionsNames = permissionsNames;
        this.permissionsViewer = null

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #subjects-div{
                vertical-align: middle;
                text-aling: center;
            }

            #permissions-div{
                display: table;
                width: 100%;
                vertical-align: middle;
                text-aling: center;
            }

            #permissions-header{
                display: table-row;
                font-size: 1.0rem;
                font-weight: 400;
                color: var(--palette-text-secondary);
                border-bottom: 2 px solid;
                border-color: var(--palette-divider);
                width: 100%;
            }

            #permissions-header div {
                display: table-cell;
            }

            .subject-div{
                vertical-align: middle;
                text-aling: center;
                max-width: 300px;
            }

            .permission-div{
                text-align: center;
                vertical-align: middle;
                text-aling: center;
            }

        </style>

        <div>
            <div id="subjects-div">
            </div>

            <div id="permissions-div">
            </div>

        </div>
        `

        this.subjectsDiv = this.shadowRoot.querySelector("#subjects-div")

        this.permissionsDiv = this.shadowRoot.querySelector("#permissions-div")

    }

    // Set the permission
    setPermission(subjects, name, permission) {

        if (!permission) {
            permission = new Permission
            permission.setName(name)
            permission.setAccountsList([])
            permission.setGroupsList([])
            permission.setApplicationsList([])
            permission.setOrganizationsList([])
        }

        // Accounts
        permission.getAccountsList().forEach(a => {
            let id = a + "_account"
            let subject = subjects[id]
            if (subject == null) {
                subject = {}
                subject.type = "account"
                subject.id = a
                subject.permissions = {}
                subjects[id] = subject
            }

            subject.permissions[permission.getName()] = name

        })

        // Groups
        permission.getGroupsList().forEach(g => {
            let id = g + "_group"
            let subject = subjects[id]

            if (subject == null) {
                subject = {}
                subject.type = "group"
                subject.id = g
                subject.permissions = {}
                subjects[id] = subject
            }

            subject.permissions[permission.getName()] = name
        })

        // Applications
        permission.getApplicationsList().forEach(a => {
            let id = a + "_application"
            let subject = subjects[id]
            if (subject == null) {
                subject = {}
                subject.type = "application"
                subject.id = a
                subject.permissions = {}
                subjects[id] = subject
            }

            subject.permissions[permission.getName()] = name
        })

        // Organizations
        permission.getOrganizationsList().forEach(o => {
            let id = o + "_organization"
            let subject = subjects[id]
            if (subject == null) {
                subject = {}
                subject.type = "organization"
                subject.id = o
                subject.permissions = {}
                subjects[id] = subject
            }

            subject.permissions[permission.getName()] = name
        })

        // Peers
        permission.getPeersList().forEach(p => {
            let id = p + "_peer"
            let subject = subjects[id]
            if (subject == null) {
                subject = {}
                subject.type = "peer"
                subject.id = p
                subject.permissions = {}
                subjects[id] = subject
            }

            subject.permissions[permission.getName()] = name
        })
    }

    createAccountDiv(account) {
        let uuid = "_" + uuidv4();
        let html = `
        <style>
        </style>
        <div id="${uuid}" class="item-div" style="">
            <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                <img style="width: 40px; height: 40px; display: ${account.profilePicture.length == 0 ? "none" : "block"};" src="${account.profile_picture}"></img>
                <iron-icon icon="account-circle" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display: ${account.profilePicture.length != 0 ? "none" : "block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:250px; font-size: .85em; padding-left: 8px;">
                    <span>${account.name}</span>
                    <span>${account.email_}</span>
                </div>
            </div>
            
        </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    createApplicationDiv(application) {
        if (application == undefined) {
            console.log("application is not defined")
            return
        }
        let uuid = "_" + uuidv4();
        let html = `
        <style>
        </style>
        <div id="${uuid}" class="item-div" style="">
            <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                <img style="width: 40px; height: 40px; display: ${application.getIcon() == undefined ? "none" : "block"};" src="${application.getIcon()}"></img>
                <iron-icon icon="account-circle" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display: ${application.getIcon() != undefined ? "none" : "block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:250px; font-size: .85em; padding-left: 8px;">
                    <span>${application.getAlias()}</span>
                    <span>${application.getVersion()}</span>
                </div>
            </div>
            
        </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    createOrganizationDiv(organization) {
        let uuid = "_" + uuidv4();
        let html = `
            <style>
            </style>
            <div id="${uuid}" class="item-div" style="">
                <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                    <iron-icon icon="social:domain" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display:block"};"></iron-icon>
                    <div style="display: flex; flex-direction: column; width:250px; font-size: .85em; padding-left: 8px;">
                        <span>${organization.getId() + "@" + organization.getDomain()}</span>
                    </div>
                </div>
            </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    createPeerDiv(peer) {
        let uuid = "_" + uuidv4();
        let html = `
            <style>
            </style>
            <div id="${uuid}" class="item-div" style="">
                <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                    <iron-icon icon="hardware:computer" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display:block"};"></iron-icon>
                    <div style="display: flex; flex-direction: column; width:250px; font-size: .85em; padding-left: 8px;">
                        <span>${peer.getHostname() + "." + peer.getDomain()} (${peer.getMac()})</span>
                    </div>
                </div>
            </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    createGroupDiv(group) {
        let uuid = "_" + uuidv4();
        let html = `
        <style>
        </style>
        <div id="${uuid}" class="item-div" style="">
            <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                <iron-icon icon="social:people" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display:block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:250px; font-size: .85em; padding-left: 8px;">
                    <span>${group.id + "@" + group.domain}</span>
                </div>
            </div>
            
        </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    setPermissionCell(row, value, permissions, name, subject) {

        // The delete permission
        let cell = document.createElement("div")
        cell.style.display = "table-cell"
        cell.className = "permission-div"

        let check = document.createElement("iron-icon")
        check.icon = "icons:check"

        let none = document.createElement("iron-icon")
        none.icon = "icons:remove"

        let denied = document.createElement("iron-icon")
        denied.icon = "av:not-interested"

        if (value != undefined) {
            if (value == "allowed") {
                cell.appendChild(check)
            } else if (value == "denied") {
                cell.appendChild(denied)
            } else if (value == "owner") {
                cell.appendChild(check)
            }
        } else {
            cell.appendChild(none)
        }


        check.onmouseover = none.onmouseover = denied.onmouseover = function (evt) {
            this.style.cursor = "pointer"
        }

        check.onmouseleave = none.onmouseleave = denied.onmouseleave = function (evt) {
            this.style.cursor = "default"
        }

        // Here I will append user interaction...
        check.onclick = () => {

            if (name == "owner") {
                // remove the owner from the column...
                let owner_permission = permissions.getOwners()
                if (!owner_permission) {
                    owner_permission = new Permission
                    owner_permission.setName(name)
                    owner_permission.setAccountsList([])
                    owner_permission.setApplicationsList([])
                    owner_permission.setOrganizationsList([])
                    owner_permission.setGroupsList([])
                    permissions.setOwners(owner_permission)
                }

                if (subject.type == "group") {
                    let lst = owner_permission.getGroupsList()
                    lst = lst.filter(g => g != subject.id)
                    owner_permission.setGroupsList(lst)
                } else if (subject.type == "account") {
                    let lst = owner_permission.getAccountsList()
                    lst = lst.filter(a => a != subject.id)
                    owner_permission.setAccountsList(lst)
                } else if (subject.type == "application") {
                    let lst = owner_permission.getApplicationsList()
                    lst = lst.filter(a => a != subject.id)
                    owner_permission.setApplicationsList(lst)
                } else if (subject.type == "organization") {
                    let lst = owner_permission.getOrganizationsList()
                    lst = lst.filter(o => o != subject.id)
                    owner_permission.setOrganizationsList(lst)
                }

                // set the icon...
                cell.appendChild(none)
                if (check.parentNode)
                    check.parentNode.removeChild(check)
            } else {
                // Remove previous allowed permission
                let allowed_permission = permissions.getAllowedList().filter(p_ => p_.getName() == name)[0]
                if (allowed_permission) {
                    // First I will remove the allowed permission.
                    if (subject.type == "group") {
                        let lst = allowed_permission.getGroupsList()
                        lst = lst.filter(g => g != subject.id)
                        allowed_permission.setGroupsList(lst)
                    } else if (subject.type == "account") {
                        let lst = allowed_permission.getAccountsList()
                        lst = lst.filter(a => a != subject.id)
                        allowed_permission.setAccountsList(lst)
                    } else if (subject.type == "application") {
                        let lst = allowed_permission.getApplicationsList()
                        lst = lst.filter(a => a != subject.id)
                        allowed_permission.setApplicationsList(lst)
                    } else if (subject.type == "organization") {
                        let lst = allowed_permission.getOrganizationsList()
                        lst = lst.filter(o => o != subject.id)
                        allowed_permission.setOrganizationsList(lst)
                    }

                }

                // Append in denied...
                let denied_permission = permissions.getDeniedList().filter(p_ => p_.getName() == name)[0]
                if (!denied_permission) {
                    denied_permission = new Permission
                    denied_permission.setName(name)
                    denied_permission.setAccountsList([])
                    denied_permission.setApplicationsList([])
                    denied_permission.setOrganizationsList([])
                    denied_permission.setGroupsList([])
                    let lst = permissions.getDeniedList()
                    lst.push(denied_permission)
                    permissions.getDeniedList(lst)
                }

                if (subject.type == "group") {
                    let lst = denied_permission.getGroupsList()
                    if (lst.filter(s => s == subject.id).length == 0) {
                        lst.push(subject.id)
                    }
                    denied_permission.setGroupsList(lst)
                } else if (subject.type == "account") {
                    let lst = denied_permission.getAccountsList()
                    if (lst.filter(s => s == subject.id).length == 0) {
                        lst.push(subject.id)
                    }
                    denied_permission.setAccountsList(lst)
                } else if (subject.type == "application") {
                    let lst = denied_permission.getApplicationsList()
                    if (lst.filter(s => s == subject.id).length == 0) {
                        lst.push(subject.id)
                    }
                    denied_permission.setApplicationsList(lst)
                } else if (subject.type == "organization") {
                    let lst = denied_permission.getOrganizationsList()
                    if (lst.filter(s => s == subject.id).length == 0) {
                        lst.push(subject.id)
                    }
                    denied_permission.setOrgnanizationsPermissions(lst)
                }

                // set the icon...
                cell.appendChild(denied)
                if (check.parentNode)
                    check.parentNode.removeChild(check)
                if (none.parentNode)
                    none.parentNode.removeChild(none)
            }


            this.permissionManager.savePermissions(() => {
                console.log("permission was save!")
            })
        }

        none.onclick = () => {

            if (name == "owner") {
                let owner_permission = permissions.getOwners()
                if (!owner_permission) {
                    owner_permission = new Permission
                    owner_permission.setName(name)
                    owner_permission.setAccountsList([])
                    owner_permission.setApplicationsList([])
                    owner_permission.setOrganizationsList([])
                    owner_permission.setGroupsList([])
                    permissions.setOwners(owner_permission)
                }
                if (subject.type == "group") {
                    let lst = owner_permission.getGroupsList()
                    if (lst.filter(s => s == subject.id).length == 0) {
                        lst.push(subject.id)
                    }
                    owner_permission.setGroupsList(lst)
                } else if (subject.type == "account") {
                    let lst = owner_permission.getAccountsList()
                    if (lst.filter(s => s == subject.id).length == 0) {
                        lst.push(subject.id)
                    }
                    owner_permission.setAccountsList(lst)
                } else if (subject.type == "application") {
                    let lst = owner_permission.getApplicationsList()
                    if (lst.filter(s => s == subject.id).length == 0) {
                        lst.push(subject.id)
                    }
                    owner_permission.setApplicationsList(lst)
                } else if (subject.type == "organization") {
                    let lst = owner_permission.getOrganizationsList()
                    if (lst.filter(s => s == subject.id).length == 0) {
                        lst.push(subject.id)
                    }
                    owner_permission.setOrgnanizationsPermissions(lst)
                }

                cell.appendChild(check)
                if (none.parentNode)
                    none.parentNode.removeChild(none)
            } else {

                // if the permission exist in denied...
                let denied_permission = permissions.getDeniedList().filter(p_ => p_.getName() == name)[0]
                if (denied_permission) {
                    if (subject.type == "group") {
                        let lst = denied_permission.getGroupsList()
                        lst = lst.filter(g => g != subject.id)
                        denied_permission.setGroupsList(lst)
                    } else if (subject.type == "account") {
                        let lst = denied_permission.getAccountsList()
                        lst = lst.filter(a => a != subject.id)
                        denied_permission.setAccountsList(lst)
                    } else if (subject.type == "application") {
                        let lst = denied_permission.getApplicationsList()
                        lst = lst.filter(a => a != subject.id)
                        denied_permission.setApplicationsList(lst)
                    } else if (subject.type == "organization") {
                        let lst = denied_permission.getOrganizationsList()
                        lst = lst.filter(o => o != subject.id)
                        denied_permission.setOrganizationsList(lst)
                    }
                }

                let allowed_permission = permissions.getAllowedList().filter(p_ => p_.getName() == name)[0]
                if (!allowed_permission) {
                    if (!allowed_permission) {
                        allowed_permission = new Permission
                        allowed_permission.setName(name)
                        allowed_permission.setAccountsList([])
                        allowed_permission.setApplicationsList([])
                        allowed_permission.setOrganizationsList([])
                        allowed_permission.setGroupsList([])
                        let lst = permissions.getAllowedList()
                        lst.push(allowed_permission)
                        permissions.setAllowedList(lst)
                    }
                }

                if (subject.type == "group") {
                    let lst = allowed_permission.getGroupsList()
                    if (lst.filter(s => s == subject.id).length == 0) {
                        lst.push(subject.id)
                    }
                    allowed_permission.setGroupsList(lst)
                } else if (subject.type == "account") {
                    let lst = allowed_permission.getAccountsList()
                    if (lst.filter(s => s == subject.id).length == 0) {
                        lst.push(subject.id)
                    }
                    allowed_permission.setAccountsList(lst)
                } else if (subject.type == "application") {
                    let lst = allowed_permission.getApplicationsList()
                    if (lst.filter(s => s == subject.id).length == 0) {
                        lst.push(subject.id)
                    }
                    allowed_permission.setApplicationsList(lst)
                } else if (subject.type == "organization") {
                    let lst = allowed_permission.getOrganizationsList()
                    if (lst.filter(s => s == subject.id).length == 0) {
                        lst.push(subject.id)
                    }
                    allowed_permission.setOrgnanizationsPermissions(lst)
                }

                cell.appendChild(check)
                if (none.parentNode)
                    none.parentNode.removeChild(none)
                if (denied.parentNode)
                    denied.parentNode.removeChild(denied)

            }


            this.permissionManager.savePermissions(() => {
                console.log("permission was save!")
            })
        }

        denied.onclick = () => {

            cell.appendChild(none)
            if (check.parentNode)
                check.parentNode.removeChild(check)
            if (denied.parentNode)
                denied.parentNode.removeChild(denied)

            let denied_permission = permissions.getDeniedList().filter(p_ => p_.getName() == name)[0]
            if (denied_permission) {
                if (subject.type == "group") {
                    let lst = denied_permission.getGroupsList()
                    lst = lst.filter(g => g != subject.id)
                    denied_permission.setGroupsList(lst)
                } else if (subject.type == "account") {
                    let lst = denied_permission.getAccountsList()
                    lst = lst.filter(a => a != subject.id)
                    denied_permission.setAccountsList(lst)
                } else if (subject.type == "application") {
                    let lst = denied_permission.getApplicationsList()
                    lst = lst.filter(a => a != subject.id)
                    denied_permission.setApplicationsList(lst)
                } else if (subject.type == "organization") {
                    let lst = denied_permission.getOrganizationsList()
                    lst = lst.filter(o => o != subject.id)
                    denied_permission.setOrganizationsList(lst)
                }
            }

            let allowed_permission = permissions.getAllowedList().filter(p_ => p_.getName() == name)[0]
            if (allowed_permission) {
                // First I will remove the allowed permission.
                if (subject.type == "group") {
                    let lst = allowed_permission.getGroupsList()
                    lst = lst.filter(g => g != subject.id)
                    allowed_permission.setGroupsList(lst)
                } else if (subject.type == "account") {
                    let lst = allowed_permission.getAccountsList()
                    lst = lst.filter(a => a != subject.id)
                    allowed_permission.setAccountsList(lst)
                } else if (subject.type == "application") {
                    let lst = allowed_permission.getApplicationsList()
                    lst = lst.filter(a => a != subject.id)
                    allowed_permission.setApplicationsList(lst)
                } else if (subject.type == "organization") {
                    let lst = allowed_permission.getOrganizationsList()
                    lst = lst.filter(o => o != subject.id)
                    allowed_permission.setOrganizationsList(lst)
                }

            }

            this.permissionManager.savePermissions(() => {
                console.log("permission was save!")
            })
        }

        row.appendChild(cell)
    }

    // Set permission and display it.
    setPermissions(permissions) {

        this.subjectsDiv.innerHTML = ""

        this.permissionsDiv.innerHTML = `
        <div id="permissions-header">
            <div class="subject-div">subject</div>
            <div class="permission-div">read</div>
            <div class="permission-div">write</div>
            <div class="permission-div">delete</div>
            <div class="permission-div">owner</div>
        </div>
        `

        // So here I will transform the values to be display in a table like view.
        let subjects = {}

        // be sure owner permission are set...
        let owner_permission = permissions.getOwners()
        if (!owner_permission) {
            owner_permission = new Permission
            owner_permission.setName("owner")
            owner_permission.setAccountsList([])
            owner_permission.setApplicationsList([])
            owner_permission.setOrganizationsList([])
            owner_permission.setGroupsList([])
            permissions.setOwners(owner_permission)
        }

        // Set the owner permissions.
        this.setPermission(subjects, "owner", permissions.getOwners())

        // Set the denied permissions
        permissions.getDeniedList().forEach(p => this.setPermission(subjects, "denied", p))

        // set the allowed permission.
        permissions.getAllowedList().forEach(p => this.setPermission(subjects, "allowed", p))

        // Now I will display the permission.
        for (var id in subjects) {
            let row = document.createElement("div")
            row.style.display = "table-row"
            let subjectCell = document.createElement("div")
            subjectCell.style.display = "table-cell"
            subjectCell.className = "subject-div"
            row.appendChild(subjectCell)

            let subject = subjects[id]
            if (subject.type == "account") {
                Account.getAccount(subject.id, (a) => {
                    let accountDiv = this.createAccountDiv(a)
                    subjectCell.innerHTML = ""
                    subjectCell.appendChild(accountDiv)
                }, e => {
                    ApplicationView.displayMessage(e, 3000)
                })
            } else if (subject.type == "application") {
                // Set application div.
                getApplicationsById(subject.id, application => {
                    let applicationDiv = this.createApplicationDiv(Application.getApplicationInfo(subject.id))
                    subjectCell.innerHTML = ""
                    subjectCell.appendChild(applicationDiv)
                })

            } else if (subject.type == "group") {
                Group.getGroup(subject.id, g => {
                    let groupDiv = this.createGroupDiv(g)
                    subjectCell.innerHTML = ""
                    subjectCell.appendChild(groupDiv)
                }, e => ApplicationView.displayMessage(e, 3000))
            } else if (subject.type == "organization") {
                getOrganizationById(subject.id, o => {
                    let organizationDiv = this.createOrganizationDiv(o)
                    subjectCell.innerHTML = ""
                    subjectCell.appendChild(organizationDiv)
                }, e => ApplicationView.displayMessage(e, 3000))
            } else if (subject.type == "peer") {
                getPeerById(subject.id, p => {
                    let peerDiv = this.createPeerDiv(p)
                    subjectCell.innerHTML = ""
                    subjectCell.appendChild(peerDiv)
                }, e => ApplicationView.displayMessage(e, 3000))
            }

            // Now I will set the value for other cells..
            this.permissionsNames.forEach(id => {
                this.setPermissionCell(row, subject.permissions[id], permissions, id, subject)
            })

            this.permissionsDiv.appendChild(row)
        }

    }

}

customElements.define('globular-permissions-viewer', PermissionsViewer)

/**
 * Return web page
 */
function getWebpage(id, application, globule, callback, errorCallback) {
    const collection = "WebPages";

    // save the user_data
    let rqst = new FindOneRqst();
    let db = application+ "_db";

    // set the connection infos,
    rqst.setId(application);
    rqst.setDatabase(db);
    rqst.setCollection(collection)
    rqst.setQuery(`{"_id":"${id}"}`)

    // So here I will set the address from the address found in the token and not 
    // the address of the client itself.
    let token = localStorage.getItem("user_token")
    let domain = globule.config.Domain

    // call persist data
    globule.persistenceService
        .findOne(rqst, {
            domain: domain
        })
        .then(rsp => {
            // Here I will return the value with it
            let webPage = rsp.getResult().toJavaScript();

            // the path that point to the resource
            webPage.getPath = () => {
                return webPage._id
            }

            // The brief description.
            webPage.getHeaderText = () => {
                return webPage.name
            }

            // return file information panel...
            webPage.getInfo = () => {
                return new WebpageInfo(webPage)
            }

            callback(webPage);
        })
        .catch(errorCallback);
}

/**
 * Return application info.
 */
function getApplication(id, globule, callback, errorCallback) {

    let rqst = new GetApplicationsRqst

    let path = id
    rqst.setQuery(`{"_id":"${id}"}`)

    let stream = globule.resourceService.getApplications(rqst, { domain: globule.config.Domain })
    let applications = [];

    stream.on("data", (rsp) => {
        applications = applications.concat(rsp.getApplicationsList());
    });

    stream.on("status", (status) => {
        if (status.code == 0) {
            let applicaiton = applications[0]

            // the path that point to the resource
            applicaiton.getPath = () => {
                return path
            }

            // The brief description.
            applicaiton.getHeaderText = () => {
                return applicaiton.getAlias() + " " + applicaiton.getVersion()
            }

            // return file information panel...
            applicaiton.getInfo = () => {
                return new ApplicationInfo(applicaiton)
            }

            callback(applicaiton);
        } else {
            errorCallback(status.details)
        }
    })
}

/**
 * Return blog info.
 */
function getBlog(id, globule, callback, errorCallback) {

    if (id.indexOf("@") != -1) {
        address = id.split("@")[1] // take the domain given with the id.
        id = id.split("@")[0]
    }

    let rqst = new GetBlogPostsRequest
    rqst.setUuidsList([id])

    let stream = globule.blogService.getBlogPosts(rqst, { domain: globule.config.Domain})
    let blogPosts = [];

    stream.on("data", (rsp) => {
        blogPosts.push(rsp.getBlogPost())
    });

    stream.on("status", (status) => {
        if (status.code == 0) {
            const b = blogPosts[0]
            b.getPath = () => {
                return id
            }

            // The brief description.
            b.getHeaderText = () => {
                return blogPosts[0].getTitle() + "</br><span style=\"font-style: italic; padding-right: 5px\">written by</span>" + b.getAuthor()
            }

            // return file information panel...
            b.getInfo = () => {
                return new BlogPostInfo(blogPosts[0])
            }

            callback(b);
        } else {
            errorCallback(status.details)
        }
    })
}

/**
 * Return domain info.
 */
function getDomain(domain, callback, errorCallback) {
    let d = { name: domain }
    // the path that point to the resource
    d.getPath = () => {
        return d.name
    }

    // The brief description.
    d.getHeaderText = () => {
        return d.name
    }

    // return file information panel...
    d.getInfo = () => {

        return new DomainInfo(d)
    }

    // callback
    callback(d)

}

/**
 * Return conversation info.
 */
function getConversation(id, globule, callback, errorCallback) {
    let rqst = new GetConversationRequest
    if (id.indexOf("@") != -1) {
        address = id.split("@")[1] // take the domain given with the id.
        id = id.split("@")[0]
    }

    rqst.setId(id)
    globule.conversationService.getConversation(rqst, { domain: globule.config.Domain })
        .then(rsp => {

            let c = rsp.getConversation()
            // the path that point to the resource
            c.getPath = () => {
                return id
            }

            // The brief description.
            c.getHeaderText = () => {
                return c.getName()
            }

            // return file information panel...
            c.getInfo = () => {
                return new ConversationInfo(c)
            }

            callback(c);

        })
        .catch(err => {
            errorCallback(err)
        })
}

/**
 * Return file info.
 */
function getFile(path, globule, callback, errorCallback) {


    File.getFile(globule, path, 100, 64, f => {

        // the path that point to the resource
        f.getPath = () => {
            return f.path
        }

        // The brief description.
        f.getHeaderText = () => {
            return f.path
        }

        // return file information panel...
        f.getInfo = () => {
            return new FileInfo(f)
        }

        callback(f);
    }, errorCallback)
}

/**
 * Return group info.
 */
function getGroup(id, callback, errorCallback) {
    Group.getGroup(id, (g) => {
        g.getPath = () => {
            return id
        }

        // The brief description.
        g.getHeaderText = () => {
            return id //g.name 
        }

        // return file information panel...
        g.getInfo = () => {
            return new GroupInfo(g)
        }

        callback(g)
    }, errorCallback)
}

/**
 * Return organization info.
 */
function getOrganization(id, callback, errorCallback) {
    getOrganizationById(id, o => {

        o.getPath = () => {
            return o.getId()
        }

        // The brief description.
        o.getHeaderText = () => {
            return o.getName()
        }

        // return file information panel...
        o.getInfo = () => {
            return new OrganizationInfo(o)
        }

        callback(o)
    }, errorCallback)
}


/**
 * Return package info.
 */
function getPackage(id, globule, callback, errorCallback) {

    // so here I will split the given path to retreive the actual 
    // package descriptor.
    let infos = id.split("|")
    let publisherid = infos[0]
    let name = infos[1]
    let version = infos[2]

    let rqst = new GetPackagesDescriptorRequest
    let q = `{"$and":[{"name":"${name}"},{"version":"${version}"},{"publisherid":"${publisherid}"}]}`
    console.log("get package with query: " + q)

    rqst.setQuery(q);

    let stream = globule.resourceService.getPackagesDescriptor(rqst, { domain: globule.config.Domain })

    let descriptors = [];

    stream.on("data", (rsp) => {
        descriptors = descriptors.concat(rsp.getResultsList());
    });

    stream.on("status", (status) => {
        if (status.code == 0) {
            let p = descriptors[0]
            // the path that point to the resource
            p.getPath = () => {
                return id
            }

            // The brief description.
            p.getHeaderText = () => {
                return p.getName() + " " + p.getVersion() + " from " + publisherid
            }

            // return file information panel...
            p.getInfo = () => {
                return new PackageInfo(p)
            }

            callback(p);
        } else {
            errorCallback(status.details)
        }
    })

}


/**
 * Return package info.
 */
function getRole(id, callback, errorCallback) {
    getRoleById(id, r => {

        r.getPath = () => {
            return id
        }

        // The brief description.
        r.getHeaderText = () => {
            return r.getName()
        }

        // return file information panel...
        r.getInfo = () => {
            return new RoleInfo(r)
        }

        callback(r)
    }, errorCallback)
}

/**
 * Manage resource 
 */
export class ResourcesPermissionsManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });


        this.globule = null



        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
        </style>

        <div>
            <slot></slot>
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

        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        this.globule = globule

        // append list of different resources by type.
        this.appendResourcePermissions("application", getApplication)
        //this.appendResourcePermissions("blog", getBlog)
        //this.appendResourcePermissions("conversation", getConversation)
        //this.appendResourcePermissions("domain", getDomain)
        //this.appendResourcePermissions("file", getFile) // to slow when the number of file is high...
        //this.appendResourcePermissions("group", getGroup)
        //this.appendResourcePermissions("organization", getOrganization)
        //this.appendResourcePermissions("package", getPackage)
        //this.appendResourcePermissions("role" getRole)
        //this.appendResourcePermissions("webpage", getWebpage)
    }



    // I will get it when the value are set...
    connectedCallback() {

        this.innerHTML = ""

    }

    appendResourcePermissions(typeName, fct) {
        if (!this.querySelector(`#${typeName}-permissions`)) {
            let resourcePermissions = new ResourcesPermissionsType(this.globule, typeName, fct)
            resourcePermissions.id = typeName + "-permissions"
            this.appendChild(resourcePermissions)
        }
    }

}

customElements.define('globular-resources-permissions-manager', ResourcesPermissionsManager)


/**
 * Display the list of resource for a given type.
 */
export class ResourcesPermissionsType extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(globule, resource_type, getResource) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Set the globule
        this.globule = globule

        // Set the resource type
        this.resource_type = resource_type;

        // The function use to get the actual resource.
        this.getResource = getResource

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            paper-card {
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                font-size: 1rem;
                text-align: left;
                border-radius: 2px;
                width: 100%;
            }

            .card-content {
                min-width: 728px;
                font-size: 1rem;
                padding: 0px;
            }

            @media (max-width: 800px) {
                .card-content{
                  min-width: 580px;
                }
              }
      
              @media (max-width: 600px) {
                .card-content{
                  min-width: 380px;
                }
              }

            #container {
                display: flex;
                flex-direction: column;
                align-items: center;
                border-bottom: 1px solid var(--palette-divider);
            }

            .title {
                flex-grow: 1;
                padding: 10px;
            }

            .title::first-letter {
                text-transform: uppercase;
            }

            .header:hover {
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }
            
            .header {
                display: flex;
                align-items: center;
                width: 100%;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
            }

            #content {
                margin: 10px;
                display: flex; 
                flex-direction: column;
 
            }

        </style>
       
        <div id="container">
            <paper-card>
                <div class="card-content">
                    <div class="header">
                        <span class="title" style="flex-grow: 1;">
                            ${resource_type + "(s)"}
                        </span>
                        <span id="counter"></span>
                        <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                            <iron-icon id="hide-btn" icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                            <paper-ripple class="circle" recenters=""></paper-ripple>
                        </div>
                    </div>
                    <iron-collapse id="collapse-panel" style="width: 100%; transition-property: max-height; max-height: 0px; transition-duration: 0s;" role="group" aria-hidden="true" class="iron-collapse-closed">
                        <div id="content" style="">
                            <slot></slot>
                        </div>
                    </iron-collapse>
                </div>
            </paper-card>
        </div>
        
        `

        let togglePanel = this.shadowRoot.querySelector("#collapse-panel")
        this.hideBtn = this.shadowRoot.querySelector("#hide-btn")


        // give the focus to the input.
        this.hideBtn.onclick = () => {
            let button = this.shadowRoot.querySelector("#hide-btn")
            if (button && togglePanel) {
                if (!togglePanel.opened) {
                    button.icon = "unfold-more"
                } else {
                    button.icon = "unfold-less"
                }
                togglePanel.toggle();
            }
        }


        this.getResourcePermissionsByResourceType(permissions => {
            let count = 0
            permissions.forEach(p => {
                if (this.getResource) {
                    this.getResource(p.getPath(), this.globule, (r) => {
                        let r_ = new ResourcePermissions(r, this.globule)
                        r_.id = "_" + getUuidByString(p.getPath())
                        this.appendChild(r_)
                        count++
                        this.shadowRoot.querySelector("#counter").innerHTML = count
                    }, err => {
                        console.log(err)
                        // delete the permissions if the resource dosent exist.
                        PermissionManager.deleteResourcePermissions(p.getPath(), () => {
                            console.log("resource permissions was deleted!")
                        }, err => ApplicationView.displayMessage(err, 3000))
                    })
                }
            })
        })
    }

    deletePermissions(p) {
        let uuid = "_" + getUuidByString(p.getPath())
        let r_ = this.querySelector("#" + uuid)
        if (r_ != null) {
            r_.parentNode.removeChild(r_)
        }
        this.shadowRoot.querySelector("#counter").innerHTML = this.childElementCount.toString()
    }

    setPermissions(p) {
        let id = "_" + getUuidByString(p.getPath())

        if (this.getResource) {
            this.getResource(p.getPath(), (r) => {
                if (this.querySelector("#" + id)) {
                    this.removeChild(this.querySelector("#" + id))
                }

                let r_ = new ResourcePermissions(r)
                r_.id = id
                this.appendChild(r_)
                this.shadowRoot.querySelector("#counter").innerHTML = this.childElementCount.toString()
            }, err => ApplicationView.displayMessage(err, 3000))
        }


    }

    // Get the list of permission by type...
    getResourcePermissionsByResourceType(callback) {
        let rqst = new GetResourcePermissionsByResourceTypeRqst
        rqst.setResourcetype(this.resource_type)
        let permissions = [];

        let stream = this.globule.rbacService.getResourcePermissionsByResourceType(rqst,
            {
                domain: this.globule.config.Domain
            });

        // Get the stream and set event on it...
        stream.on("data", (rsp) => {
            permissions = permissions.concat(rsp.getPermissionsList())
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                callback(permissions)
            } else {
                callback([])
            }
        });
    }

}

customElements.define('globular-resources-permissions-type', ResourcesPermissionsType)



/**
 * Search Box
 */
export class ResourcePermissions extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(resource, globule) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Set the globule
        this.globule = globule

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container {
                display: flex;
                flex-direction: column;
                align-items: center;
                /*border-bottom: 1px solid var(--palette-background-default);*/
            }

            .header:hover {
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }
            
            .header {
                display: flex;
                align-items: center;
                width: 100%;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
            }

            iron-icon{
                padding: 5px;
            }

            iron-icon:hover{
                cursor: pointer;
            }

            .resource-text {
                text-overflow: ellipsis;
                overflow: hidden; 
                max-width: 584px;
                white-space: nowrap;
            }

            #content {
                display: flex; 
                flex-direction: column;
                margin: 10px;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

        </style>
        <div id="container">
            <div class="header">
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon id="info-btn" icon="icons:info" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>

                <span class="resource-text" style="flex-grow: 1; padding: 5px;">
                    ${resource.getHeaderText()}
                </span>

                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon id="edit-btn" icon="editor:mode-edit" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
                
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon id="delete-btn" icon="delete" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse id="info-collapse-panel" style="width: 100%; transition-property: max-height; max-height: 0px; transition-duration: 0s;" role="group" aria-hidden="true" class="iron-collapse-closed">
                <div id="content" style="">
                    <slot name="resource-info"></slot>
                </div>
            </iron-collapse>
            <iron-collapse id="permissions-editor-collapse-panel" style="width: 100%; transition-property: max-height; max-height: 0px; transition-duration: 0s;" role="group" aria-hidden="true" class="iron-collapse-closed">
                <div id="content" style="">
                    <slot name="resource-permissions-editor"></slot>
                </div>
            </iron-collapse>
        </div>
        `

        let infoTogglePanel = this.shadowRoot.querySelector("#info-collapse-panel")
        let info = resource.getInfo()
        info.slot = "resource-info"
        this.appendChild(info)
        this.infoBtn = this.shadowRoot.querySelector("#info-btn")

        // give the focus to the input.
        this.infoBtn.onclick = () => {

            if (infoTogglePanel) {
                if (!infoTogglePanel.opened) {
                    // close
                } else {
                    // open
                }
                infoTogglePanel.toggle();
            }
        }

        let permissionsTogglePanel = this.shadowRoot.querySelector("#permissions-editor-collapse-panel")
        let permissionManager = new PermissionsManager(this.globule)
        permissionManager.hideHeader()
        permissionManager.slot = "resource-permissions-editor"
        this.appendChild(permissionManager)
        permissionManager.setPath(resource.getPath())
        this.editBtn = this.shadowRoot.querySelector("#edit-btn")

        // give the focus to the input.
        this.editBtn.onclick = () => {

            if (permissionsTogglePanel) {
                if (!permissionsTogglePanel.opened) {
                    // close
                } else {
                    // open
                }
                permissionsTogglePanel.toggle();
            }
        }

        let deleteBtn = this.shadowRoot.querySelector("#delete-btn")
        deleteBtn.onclick = () => {
            let toast = ApplicationView.displayMessage(`
            <style>
               
            </style>
            <div>
                <div>Your about to delete permission for resource ${resource.getHeaderText()}</div>
                <div>Is it what you want to do? </div>
                <div style="display: flex; justify-content: flex-end;">
                    <paper-button id="ok-button">Ok</paper-button>
                    <paper-button id="cancel-button">Cancel</paper-button>
                </div>
            </div>
            `, 60 * 1000)


            let cancelBtn = toast.el.querySelector("#cancel-button")
            cancelBtn.onclick = () => {
                toast.dismiss();
            }

            let okBtn = toast.el.querySelector("#ok-button")
            okBtn.onclick = () => {
                // So here I will delete the permissions..
                let rqst = new DeleteResourcePermissionsRqst
                rqst.setPath(resource.getPath())
               
                this.globule.rbacService.deleteResourcePermissions(rqst, { domain: this.globule.config.Domain, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        ApplicationView.displayMessage("Permission was removed", 3000)
                        this.parentNode.removeChild(this)
                    }).catch(err => ApplicationView.displayMessage(err, 3000))


                toast.dismiss();
            }
        }

    }

}

customElements.define('globular-resource-permissions', ResourcePermissions)