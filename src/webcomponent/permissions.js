/**
 * The permission manager, this component is used to manage the permissions, it is used to create, update, delete and search permissions.
 */
export class PermissionsManager extends HTMLElement {
    // attributes.
    static get observedAttributes() {
        return ['current-permission-id'];
    }

    // The connection callback.
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'current-permission-id') {
            this.currentpermission = newValue
            if (this.currentpermission != newValue && AppComponent.globules[0] != null) {
                this.setcurrentpermission(newValue)
            }
        }
    }

    // Create the applicaiton view.
    constructor() {
        super()

        // The current permission.
        this.currentpermission = null;

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

            #permissions {
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

        </style>
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <paper-icon-button id="add-btn" icon="icons:add" permission="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <span id="title">permissions</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" permission="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
        </div>

        <slot name="permission"></slot>

        <div id="permissions">
            <slot name="permissions"></slot>
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

customElements.define('globular-permissions-manager', PermissionsManager)


/**
 * The permission editor, this component is used to edit an permission.
 */
export class PermissionEditor extends HTMLElement {
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

customElements.define('globular-permission-editor', PermissionEditor)

/**
 * The permission view, this component is used to view an permission.
 */
export class PermissionView extends HTMLElement {
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

customElements.define('globular-permission-view', PermissionView)