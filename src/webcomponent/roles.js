/**
 * The role manager, this component is used to manage the roles, it is used to create, update, delete and search roles.
 */
export class RolesManager extends HTMLElement {
    // attributes.
    static get observedAttributes() {
        return ['current-role-id'];
    }

    // The connection callback.
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'current-role-id') {
            this.currentRole = newValue
            if (this.currentRole != newValue && AppComponent.globules[0] != null) {
                this.setcurrentRole(newValue)
            }
        }
    }

    // Create the applicaiton view.
    constructor() {
        super()

        // The current role.
        this.currentRole = null;

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

            #roles {
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
                <span id="title">roles</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
        </div>

        <slot name="role"></slot>

        <div id="roles">
            <slot name="roles"></slot>
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

    // the code to execute when the globule is ready.
    init() {
        
    }

}

customElements.define('globular-roles-manager', RolesManager)


/**
 * The role editor, this component is used to edit an role.
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
        </div>
        `

    }

    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-role-editor', RoleEditor)

/**
 * The role view, this component is used to view an role.
 */
export class RoleView extends HTMLElement {
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
        </div>
        `
    }

    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-role-view', RoleView)