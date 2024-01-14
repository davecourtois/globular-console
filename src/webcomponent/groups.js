/**
 * The groups manager, this component is used to manage the groups, it is used to create, update, delete and search groups.
 */
export class GroupsManager extends HTMLElement {
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
                flex-direction: column;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

        </style>
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span id="title">Groups</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>
            <div id="groups">
                <slot name="groups"></slot>
            </div>
        </div>`

    }

}

customElements.define('globular-groups-manager', GroupsManager)
