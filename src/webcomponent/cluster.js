import { flatMap } from "rxjs";
import { displayError } from "./utility";

/**
 * Sample empty component
 */
export class ClusterManager extends HTMLElement {
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

        #hosts {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
        }

        #cluster-domain {
            font-weight: 400;
            font-size: 1.1rem;
            font-style: italic;
        }

        #master-icon {
            color: var(--primary-color);
            margin-right: 0.5rem;
            position: absolute;
            top: 24px;
            left: 70px;
        }

        </style>
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span id="title">Cluster <span id="cluster-domain"></span></span>
                
                <paper-icon-button id="info-btn" icon="icons:info-outline"></paper-icon-button>
            </div>
            <div id="hosts">
                <slot name="hosts"></slot>
            </div>
        </div>
        `
       
        // Keep a reference to the globules.
        this.globules = {}

        // The master will be the globule with it DNS name pointing to itself.
        this.master = null
    }

    // Called when the element is inserted in a document, including into a shadow tree
    setGlobule(globule) {
        this.globules[globule.config.Mac] = globule
        
        // If the DNS name is the same as the name of the globule, then it is the master.
        if (globule.config.DNS == globule.config.Name + "." + globule.config.Domain) {
            if (this.master != null) {
                displayError("There are two masters in the cluster: " + this.master.config.Name + " and " + globule.config.Name)
                return
            }

            // Set the master.
            this.master = globule

            let id = "_" + globule.config.Mac.replace(/:/g, "-")
            let hostPanel = document.getElementById(id)

            this.shadowRoot.getElementById("cluster-domain").innerHTML = globule.config.Domain

            hostPanel.style.position = "relative"

            let masterIcon = document.createElement("iron-icon")
            masterIcon.setAttribute("icon", "icons:star")
            masterIcon.setAttribute("id", "master-icon")
            masterIcon.style.position = "absolute"
            masterIcon.style.top = "24px"
            masterIcon.style.left = "70px"
            masterIcon.style.color = "var(--google-yellow-300)"

            hostPanel.appendChild(masterIcon)

            this.appendChild(hostPanel)
            
        }

        

    }

}

customElements.define('globular-cluster-manager', ClusterManager)