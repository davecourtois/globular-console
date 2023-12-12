import { GeneralConfigurationManager } from "./general_configuration.js"

/**
 * This class will display the globule manager panel.
 */
export class ConfigurationManager extends HTMLElement {
   // attributes.

   // Create the applicaiton view.
   constructor(globule) {
      super()

      // Set the globule.
      this.globule = globule

      // Set the shadow dom.
      this.attachShadow({ mode: 'open' });

      // Innitialisation of the layout.
      this.shadowRoot.innerHTML = `
        <style>
        #container {
            background-color: var(--background-color);
            color: var(--primary-text-color);
            border-radius: 0.5rem;
            height: 100%;
            display: flex;
        }
        .header-icon{
            width: 24px;
            height: 24px;
            margin-right: 10px;
            margin-left: 10px;
        }
        #left-panel {
            background-color: var(--surface-color);
            width: 200px;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: stretch;
        }
        #search-panel {
            height: 30px;
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            margin-top: .5rem;
        }
        #search-input {
            width: 100%;
            height: 100%;
            border-radius: 1px;
            border: 0px;
            background-color: var(--surface-color);
            color: var(--primary-text-color);
            padding-left: 5px;
            outline-width: 1px;
            outline-color: var(--primary-color);
            margin-left: 5px;
            margin-right: 5px;
        }
        #list-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: stretch;
            margin-top: .5rem;
        }
        #list-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: stretch;
            overflow-y: auto;
        }
        #list {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: stretch;
        }
        .list-item {
            height: 40px;
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            margin-bottom: .5rem;
            cursor: pointer;
        }
        .list-item:hover {
            background-color: var(--hover-color);
        }
        .list-item-icon {
            width: 50px;
            height: 100%;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
        }
        .list-item-text {
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
        }
        #main-panel {
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: stretch;
            margin-left: 1rem;
        }
        #main-panel > div {
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: stretch;
        }
     </style>
     <globular-dialog name="configuration-manager" height="644px" id="${this.globule.config.Name}-settings" is-resizeable="true" is-moveable="true" is-maximizeable="true" show-icon="true" is-minimizeable="true">
         <span class="title" id="title-span" slot="title">no select</span>
         <img class="header-icon" slot="icon" src="assets/icons/applications-system.svg" />
         <div id="container">
         <div id="left-panel">
            <div id="search-panel">
               <input id="search-input" type="text" placeholder="search" />
            </div>
            <div id="list-panel">
               <div id="list-container">
               <div id="list">
                  <div class="list-item">
                     <div class="list-item-icon">
                     <img class="header-icon" src="assets/icons/applications-system.svg" />
                     </div>
                     <div class="list-item-text">
                     <span>General</span>
                     </div>
                  </div>
                  <div class="list-item">
                     <div class="list-item-icon">
                     <img class="header-icon" src="assets/icons/applications-system.svg" />
                     </div>
                     <div class="list-item-text">
                     <span>Http(s)</span>
                     </div>
                  </div>
                  <div class="list-item">
                     <div class="list-item-icon">
                     <img class="header-icon" src="assets/icons/applications-system.svg" />
                     </div>
                     <div class="list-item-text">
                     <span>Security</span>
                     </div>
                  </div>
               </div>
               </div>
            </div>
         </div>
         <div id="main-panel">
            <slot></slot>
         </div>
      </globular-dialog>
        `
      // give the focus to the input.
      this.container = this.shadowRoot.querySelector("globular-dialog")

      // override the minimize function...
      this.container.getPreview = this.getPreview.bind(this);
      this.container.onclose = () => {
         // clear the interval...
         clearInterval(this.interval)

         // remove the dialog 
         this.parentNode.removeChild(this)
      }

      // Now the various manangers...
      this.generalConfigurationManager = new GeneralConfigurationManager(this.globule)

      // I will add the manager to the slot depending on the selected item.
      this.list = this.shadowRoot.querySelector("#list")
      this.list.addEventListener("click", (event) => {
         // get the selected item.
         let item = event.target.closest(".list-item")
         this.innerHTML = "" // clear the slot.

         if (item) {
            // get the text.
            let text = item.querySelector(".list-item-text").innerText
            // depending on the text.
            switch (text) {
               case "General":
                  // add the general manager.
                  this.appendChild(this.generalConfigurationManager)
                  break;
               default:
                  break;
            }
         }
      })

   }

   // The connection callback.
   connectedCallback() {
      this.shadowRoot.querySelector(`.title`).innerHTML = `Configuration ${this.globule.config.Name}@${this.globule.config.Domain} Globular ${this.globule.config.Version}`
   }

   getPreview() {
      let preview = document.createElement("div");
      preview.style.position = "absolute";
      preview.style.top = "0px";
      preview.style.left = "0px";
      preview.style.width = "100%";
      preview.style.height = "100%";
      preview.style.display = "flex";
      preview.style.alignItems = "center";
      preview.style.flexDirection = "column";
      preview.style.justifyContent = "flex-start";
      preview.style.userSelect = "none";

      let title = document.createElement("div");
      title.style.fontWeight = "bold";
      title.style.fontSize = "1.0rem";
      title.style.marginBottom = "1rem";
      title.style.color = "var(--primary-text-color)";
      title.innerHTML = `${this.globule.config.Name}`;
      preview.appendChild(title);

      let image = document.createElement("img");
      image.style.width = "100px";
      image.style.height = "100px";
      image.style.objectFit = "contain";
      image.src = "assets/icons/applications-system.svg";
      preview.appendChild(image);

      let description = document.createElement("div");
      description.style.marginTop = "1rem";
      description.style.color = "var(--secondary-text-color)";
      description.style.fontSize = "0.8rem";
      description.style.textAlign = "center";
      description.innerHTML = `configurations of ${this.globule.config.Name}`;

      preview.appendChild(description);

      return preview;

   }
}

customElements.define('globular-globule-manager', ConfigurationManager)
