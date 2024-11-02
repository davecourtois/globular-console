// Polymer dependencies
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-icons/communication-icons'
import '@polymer/iron-icons/editor-icons'

/**
 * Dropdown menu item, it be used inside a dropdown menu.
 */
export class DropdownMenuItem extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(icon, text, shortcut) {
        super()

        this.action = null;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        if (icon) {
            this.icon = icon
            this.setAttribute("icon", icon)
        }

        if (text) {
            this.text = text
            this.setAttribute("text", text)
        }

        if (shortcut) {
            this.shortcut = shortcut
            this.setAttribute("shortcut", shortcut)
        }

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.3.1/css/all.min.css');

            @import url('./styles.css');

            #container{
              display: flex;
              flex-direction: column;
            }
  
            #container div{
              background-color: var(--surface-color);
              color: var(--on-surface-color);
              display: flex;
              min-width: 150px;
              padding: 3px;
              transition: background 0.2s ease,padding 0.8s linear;
              position: relative;
            }
  
            #container div:hover{
              background-color: var(--hover-color);
              cursor: pointer;
            }
  
            paper-card  {
              background: transparent;
              display: none;
              flex-direction: column;
              position: absolute;
              top: 0px;
            }
  
            #icon-i, iron-icon {
              width: 20px;
              padding-right: 10px;
            }

            #icon-i {
                display: none;
                font-size: 1.2rem;
            }
  
            #text-span{
                flex-grow: 1;
                font-size: 1rem;
                min-width: 140px;
            }

            #shortcut{
                font-size: 0.8rem;
                color: var(--on-surface-color);
                padding-right: 5px;
            }
  
            .separator{
              display: none;
              border-top: 1px solid var(--palette-divider);
              margin-top: 2px;
              padding-top:2px;
            }
  
        </style>
        
        <div id="container">
          <span class="separator"></span>
          <div style="display: flex; justify-content: center; align-items: center;">
            <paper-ripple recenters></paper-ripple>
            <iron-icon id="icon" icon="${this.icon}"> </iron-icon>
            <i id="icon-i" class="${this.icon}"></i>
            <span id="text-span">${this.text}</span>
            <span id="shortcut"></span>
            <slot><slot>
          </div>
        </div>
  
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")
        container.onclick = (evt) => {

            // if action was defined, call it.
            if (this.action != undefined) {
                this.action()
            }

            // otherwise, dispatch an event.
            const onActionEvent = new CustomEvent('on-action', {
                bubbles: true, // Whether the event should bubble up through the DOM
                cancelable: true, // Whether the event is cancelable
                detail: {
                    // You can provide additional data in the 'detail' property
                }
            });

            this.dispatchEvent(onActionEvent);

            // close it parent.
            if (this.parentNode != undefined) {
                if (this.parentNode.close != undefined) {
                    this.parentNode.close();
                }
            }
        }

        // Add an event listener to the document to handle clicks outside the menu item
        document.addEventListener('click', (event) => {
            const menuItem = this.shadowRoot.querySelector('#container div');

            // Check if the clicked element is outside the menu item
            if (!menuItem.contains(event.target)) {
                this.parentNode.close(); // Close the parent menu if applicable
            }
        });
    }

    connectedCallback() {

        if (this.hasAttribute("separator")) {
            this.shadowRoot.querySelector(".separator").style.display = "block"
        }

        if (this.hasAttribute("icon")) {
            this.icon = this.getAttribute("icon")
        } else if (!this.icon) {
            this.icon = ""
        }

        if (this.hasAttribute("text")) {
            this.text = this.getAttribute("text")
        } else if (!this.text) {
            this.text = ""
        }

        if (this.hasAttribute("shortcut")) {
            this.shortcut = this.getAttribute("shortcut")
        } else if (!this.shortcut) {
            this.shortcut = ""
        }

        this.shadowRoot.querySelector("#text-span").innerHTML = this.text
        this.shadowRoot.querySelector("#icon").icon = this.icon
        this.shadowRoot.querySelector("#shortcut").innerHTML = this.shortcut

        // Set the icon, if it is a font awesome icon.
        if (this.icon.startsWith("fa")) {
            this.shadowRoot.querySelector("#icon-i").style.display = "block"
            this.shadowRoot.querySelector("#icon-i").className = this.icon
            this.shadowRoot.querySelector("iron-icon").style.display = "none"
        }
    }

    hideIcon() {
        this.shadowRoot.querySelector("#icon").style.display = "none";
    }


}

customElements.define('globular-dropdown-menu-item', DropdownMenuItem)

/**
 * Menu used to display a list of items.
 */
export class DropdownMenu extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(icon, text) {

        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.isopen = false;
        this.icon = icon;
        this.action = null;
        this.onopen = null;
        this.onclose = null;
        this.text = text;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            @import url('./styles.css');

            #container {
                display: flex;
                align-items: center;
                width: fit-content;
                justify-content: center;
                position: relative;
                transition: background 0.2s ease, padding 0.8s linear;
                user-select: none;
                margin-right: 10px;

            }

            .card-content {
                display: flex;
                flex-direction: column;
                padding: 0px;
            }

            .menu-items {
                position: absolute;
            }

            #icon-i:hover,
            iron-icon:hover {
                cursor: pointer;
            }

            #icon-i,
            iron-icon {
                display: none;
                font-size: 1.2rem;
            }DropdownMenu

            #text {
                padding-left: 10px;
                padding-right: 10px;
                background-color: var(--background-color);
                color: var(--on-background-color);
                transition: background 0.2s ease, padding 0.8s linear;
            }

            #text:hover {
                cursor: pointer;
                background-color: var(--hover-color);
            }

        </style>
        <div id="container">
            <iron-icon icon="${this.icon}"></iron-icon>
            <i id="icon-i" class="${this.icon}"></i>
            <span id="text"></span>
            <paper-card class="menu-items" style="display: none;">
                <div class="card-content">
                    <slot></slot>
                </div>
            </paper-card>
        </div>`


        // give the focus to the input.
        let menuItems = this.shadowRoot.querySelector("paper-card")
        this.shadowRoot.querySelector("iron-icon").onclick =
        this.shadowRoot.querySelector("#text").onclick = (evt) => {
            evt.stopPropagation()

            if (menuItems.style.display == "none") {
                this.open()
            } else {
                this.close()
            }
        }

        // Add an event listener to the document to handle clicks outside the menu
        document.addEventListener('click', (event) => {
            const container = this.shadowRoot.querySelector('#container');
            const menuItems = this.shadowRoot.querySelector('paper-card');

            // Check if the clicked element is outside the menu's container or items
            if (!container.contains(event.target) && !menuItems.contains(event.target)) {
                this.close();
            }
        });
    }

    connectedCallback() {
        if (this.hasAttribute("icon")) {
            this.shadowRoot.querySelector("iron-icon").icon = this.getAttribute("icon")
        }

        if (this.hasAttribute("icon")) {
            this.icon = this.getAttribute("icon")
        } else if (!this.icon) {
            this.icon = ""
        }

        if (this.hasAttribute("text")) {
            this.text = this.getAttribute("text")
        } else {
            this.text = ""
        }

        // Set the menu text.
        this.shadowRoot.querySelector("#text").innerHTML = this.text

        if (this.icon.startsWith("fa")) {
            this.menuBtn = this.shadowRoot.querySelector("#icon-i")
            this.menuBtn.style.display = "block"
            this.shadowRoot.querySelector("iron-icon").style.display = "none"
        } else if (this.icon.length > 0) {
            this.menuBtn = this.shadowRoot.querySelector("iron-icon")
            this.menuBtn.style.display = "block"
            this.shadowRoot.querySelector("#icon-i").style.display = "none"
        }

        if (this.parentNode.tagName == "GLOBULAR-DROPDOWN-MENU-ITEM") {
            let menuItems = this.shadowRoot.querySelector("paper-card")
            menuItems.style.top = "0px"
            menuItems.style.left = "28px"
            menuItems.style.backgroundColor = "transparent"
            this.icon = "icons:chevron-right"
            this.shadowRoot.querySelector("iron-icon").setAttribute("icon", this.icon)
            this.shadowRoot.querySelector("iron-icon").style.display = "block"
            this.shadowRoot.querySelector("#icon-i").style.display = "none"
            this.shadowRoot.querySelector("#text").style.display = "none"

            // keep a reference to the parent menu item.
            this.parentMenuItem = this.parentNode

        } else {
            let menuItems = this.shadowRoot.querySelector("paper-card")
            menuItems.style.top = "25px"
            menuItems.style.left = "0px"
        }

    }

    close() {
        this.shadowRoot.querySelector("#text").style.textDecoration = "none"
        this.shadowRoot.querySelector("#text").style.backgroundColor = "var(--background-color)"
        let menuItems = this.shadowRoot.querySelector("paper-card")
        menuItems.style.display = "none"

        if (this.onclose != undefined) {
            this.onclose()
        }

        const evt = new CustomEvent('on-close', {
            bubbles: true, // Whether the event should bubble up through the DOM
            cancelable: true, // Whether the event is cancelable
            detail: {
                // You can provide additional data in the 'detail' property
            }
        });

        this.dispatchEvent(evt);
    }

    open() {
        this.shadowRoot.querySelector("#text").style.textDecoration = "underline"
        this.shadowRoot.querySelector("#text").style.backgroundColor = "var(--surface-color)"
        let menuItems = this.shadowRoot.querySelector("paper-card")
        menuItems.style.display = "block"

        if (this.onopen != undefined) {
            this.onopen()
        }

        if (this.text.length > 0) {
            const onShowEvent = new CustomEvent('on-open', {
                bubbles: true, // Whether the event should bubble up through the DOM
                cancelable: true, // Whether the event is cancelable
                detail: {
                    // You can provide additional data in the 'detail' property
                }
            });

            this.dispatchEvent(onShowEvent);
        }
    }

    // Return true if the menu is open.
    isOpen() {
        let menuItems = this.shadowRoot.querySelector("paper-card")
        return menuItems.style.display != "none"
    }
}

customElements.define('globular-dropdown-menu', DropdownMenu);

/**
 * @class MenuBar 
 */
export class MenuBar extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            @import url('./styles.css');

            #container{
                background-color: var(--background-color);
                color: var(--on-background-color);
                display: flex;
            }

        </style>
        <div id="container">
            <slot></slot>
        </div>
        `

        this.querySelectorAll("globular-dropdown-menu").forEach((menu) => {

            // react to the on-show event.
            menu.addEventListener("on-open", (evt) => {
                this.querySelectorAll("globular-dropdown-menu").forEach((menu) => {
                    if (menu != evt.target) {
                        if (menu.parentMenuItem != undefined) {
                        } else {
                            menu.close()
                        }
                    }
                })
            })

        })

    }
}

customElements.define('globular-menu-bar', MenuBar)