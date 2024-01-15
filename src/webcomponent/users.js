import { Account } from "globular-web-client/resource/resource_pb";
import { AvatarChanger } from "./image";

/**
 * The user manager, this component is used to manage the users, it is used to create, update, delete and search users.
 */
export class UsersManager extends HTMLElement {
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

            #users {
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

        </style>
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <div style="display: flex; flex-direction: row; flex-grow: 1; align-items: center;">
                    <paper-icon-button id="add-btn" icon="icons:add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                    <span id="title">Users</span>
                </div>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>

        </div>

        <slot name="user"></slot>

        <slot name="users"></slot>
        `

        // Action on the add button.
        this.shadowRoot.querySelector("#add-btn").addEventListener("click", () => {

            // test if user editor is already present.
            let userEditor = this.querySelector("globular-user-editor")
            if (userEditor) {
                // just focus on the user editor.
                userEditor.setFocus()
                return
            }

            // Create a new user.
            let a = new Account()
            userEditor = new UserEditor(a)
            userEditor.slot = "user"

            this.appendChild(userEditor)
        })


    }

}

customElements.define('globular-users-manager', UsersManager)


/**
 * This compoent is to display a user informations. It can be use to create, update or delete a user.
 */
export class UserEditor extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(account) {
        super()

        this.account = account

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

            #user-infos {
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

            #avatar-div {
                display: flex;
                flex-direction: row;
                flex-grow: 1;
                align-items: center;
                justify-content: center;
                position: relative;
            }


        </style>
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span id="title">${this.account.getId().length == 0 ? "New User" : ""}</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
            <div id="user-infos">
                <div id="avatar-div">
                    <avatar-changer id="avatar-changer" style="position: absolute; top: 0px; left: 0px;"></avatar-changer>
                </div>
            </div>
        </div>`
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

    }

    setAccount(account) {
        this.account = account

    }

    setFocus() {

    }
}

customElements.define('globular-user-editor', UserEditor)

