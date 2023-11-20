
import * as getUuid from 'uuid-by-string'
import { getCoords } from './utility';


/**
 * This class where use to display minized window.
 */
export class DialogHandle extends HTMLElement {

    // Create the applicaiton view.
    constructor(dialog, height = 200) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // keep the height of the dialog.
        this.height = height

        // display the dialog.
        this.dialog = dialog

        // if the dialog is focused.
        this.isFocused = false

        // if the dialog is docked.
        this.isDocked = false

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            @import url('./styles.css');
            #container{
                position: relative;
                display: flex;
                flex-direction: column;
                background-color: var(--surface-color);
                border: 1px solid var(--divider-color);

                height:${height + 10}px; /* Initial height of 0, adjusted by padding-bottom */
                width: ${height}px; /* Initial width of 0, adjusted by padding-right */

                overflow: hidden; /* Hide scrollbars */
            }

            #close-btn, #minimize-btn{
                /* Reduce width and height */
                width: 24px;
                height: 24px;
                margin-right: 2px;
              
                /* Adjust padding for a smaller button appearance */
                padding: 5px;
            }

            span{
                white-space: nowrap;
                display: inline; /* This is the default for spans, but adding it for clarity */
                flex-grow: 1;
            }
        }

        </style>
        <div id="container">
            <div style="display: flex; align-items: center; z-index: 1000;">
                <paper-icon-button id="close-btn" icon="close"></paper-icon-button>
                <span></span>
                <paper-icon-button id="minimize-btn" icon="icons:remove"></paper-icon-button>
            </div>
            <div class="zoomed-div">
                <slot></slot>
            </div>
           
        </div>
        `
        this.shadowRoot.querySelector("#close-btn").onclick = (evt) => {
            evt.stopPropagation()
            this.undock()
            this.dialog.close()
        }

        this.shadowRoot.querySelector("#minimize-btn").onclick = (evt) => {
            evt.stopPropagation()
            this.dialog.minimize()
        }


        this.dialog.addEventListener("dialog-focused", (evt) => {
            this.focus()
        });

        this.dialog.addEventListener("refresh-preview", (evt) => {
            this.refreshPreview()
        });
    }

    connectedCallback() {

    }

    getCoords() {
        let container = this.shadowRoot.querySelector("#container")
        let coords = getCoords(container)
        return coords
    }

    getRect() {
        let coords = this.getCoords()

        // so here i must calculate the width and height of the dialog.
        let container = this.shadowRoot.querySelector("#container")
        return { top: coords.top, left: coords.left, width: this.dialog.div.getBoundingClientRect().width, height: this.dialog.div.getBoundingClientRect().height + container.offsetHeight }
    }

    refreshPreview() {

        this.innerHTML = ""
        let preview = this.dialog.getPreview()
        preview.classList.add("text-preview")

        this.appendChild(preview)
    }

    dock() {
        this.dialog.style.display = "none"
        this.isDocked = true
        this.dialog.classList.add("minimized")
        this.shadowRoot.querySelector("#minimize-btn").style.display = "none"
    }

    undock() {
        /** restore the dialog */
        this.dialog.style.display = ""
        this.focus()
        this.isDocked = false
        this.dialog.classList.remove("minimized")
        this.shadowRoot.querySelector("#minimize-btn").style.display = "block"
    }

    /**
     * Remove the focus on the dialog handle.
     */
    blur() {
        this.isFocused = false
        let container = this.shadowRoot.querySelector("#container")
        container.style.border = "1px solid var(--divider-color)"
    }

    /**
     * 
     * @returns Set the focus on the dialog handle.
     */
    focus() {

        if (this.isFocused) {
            return
        }

        let handles = document.querySelectorAll("globular-dialog-handle")
        for (let i = 0; i < handles.length; i++) {
            handles[i].blur()
        }

        this.isFocused = true
        this.dialog.focus()

        let container = this.shadowRoot.querySelector("#container")
        container.style.border = "1px solid var(--primary-color)"

    }

    /**
     * 
     * @returns true if the dialog has focus.
     */
    hasFocus() {
        return this.isFocused
    }

}

customElements.define('globular-dialog-handle', DialogHandle)


/**
 * This class where use to display minized window.
 */
export class DialogHandles extends HTMLElement {
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
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-right: 10px;
            }

            img{
                width: 40px;
                height: 40px;
            }

            span{
                position: absolute;
                top: -5px;
                left: -5px;
                background-color: var(--primary-dark-color);
                color: var(on-primary-dark-color);
                border-radius: 50%;
                width: 20px;
                height: 20px;
                text-align: center;
                font-size: 12px;
                line-height: 20px;
            }

            .handles{
                display: none;
                flex-direction: row;
                align-items: center;
                justify-content: flex-start;
                position: fixed;
                top:  -212px;
                left: 0px;
            }

            .handles:hover{
                cursor: pointer;
            }

        </style>
       
        <div id="container">
            <img id="icon"></img>
            <span id="count"></span>
            <div class="handles">
                <slot></slot>
            </div>
        </div>
        `

        let icon = this.shadowRoot.querySelector("#container")
        let handles = this.shadowRoot.querySelector(".handles")

        icon.onmouseenter = (evt) => {
            evt.stopPropagation()
            if (handles.style.display == "flex") {
                return
            }

            let globularHandles = document.querySelectorAll("globular-dialog-handles")
            for (let i = 0; i < globularHandles.length; i++) {
                globularHandles[i].hideHandles()
            }
            handles.style.display = "flex"

            // refresh the preview.
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].refreshPreview()
            }
        }

        handles.onmouseleave = (evt) => {
            evt.stopPropagation()
            if (handles.style.display == "flex") {
                return
            }

            handles.style.display = "none"
        }


        document.addEventListener("mousemove", (evt) => {

            if (handles.style.display != "flex") {
                return
            }

            let rect = handles.getBoundingClientRect()
            let x = evt.clientX
            let y = evt.clientY

            // compensate for the icon position.
            let right = rect.right
            if (right < icon.offsetLeft + icon.offsetWidth) {
                right = icon.offsetLeft + icon.offsetWidth
            }

            if (x < rect.left || x > right || y < rect.top || y > rect.bottom + icon.offsetHeight + 10) {
                handles.style.display = "none"
            }
        })


    }

    hideHandles() {
        let handles = this.shadowRoot.querySelector(".handles")
        handles.style.display = "none"
    }

    appendHandle(handle) {
        if (this.querySelector(handle.id)) {
            console.log("handle already exist")
            return
        }

        this.appendChild(handle)
        let icon = this.shadowRoot.querySelector("#icon")
        icon.src = handle.dialog.getIcon()
        this.shadowRoot.querySelector("#container").style.display = "flex"
        this.shadowRoot.querySelector("#count").innerHTML = this.children.length
        this.appendChild(handle)
        handle.onclick = (evt) => {
            evt.stopPropagation()
            handle.undock()
        }

        handle.onmouseover = (evt) => {
            evt.stopPropagation()
            handle.style.boxShadow = "0px 0px 5px 0px var(--primary-light-color)"
            handle.dialog.div.style.boxShadow = "0px 0px 5px 0px var(--primary-light-color)"
        }

        handle.onmouseout = (evt) => {
            evt.stopPropagation()
            handle.style.boxShadow = ""
            handle.dialog.div.style.boxShadow = ""
        }
    }

    removeHandle(handle) {

        this.removeChild(handle)
        this.shadowRoot.querySelector(".handles").style.display = "none"
        if (this.children.length > 0) {
            let icon = this.shadowRoot.querySelector("#icon")
            icon.src = this.children[this.children.length - 1].dialog.getIcon()
            this.shadowRoot.querySelector("#container").style.display = "flex"
        } else {
            let icon = this.shadowRoot.querySelector("#icon")
            icon.src = ""
            this.shadowRoot.querySelector("#container").style.display = "none"
        }

        this.shadowRoot.querySelector("#count").innerHTML = this.children.length
    }

}

customElements.define('globular-dialog-handles', DialogHandles)

/**
 * This class where use to display minized window.
 */
export class Dockbar extends HTMLElement {
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
                position: fixed;
                z-index: 10000;
                bottom: 0px;

                /* Center the container */
                margin-left: 50%;
                transform: translateX(-50%);

                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;

                user-select: none;

            }

            #dockbar{
                z-index: 1000;
                display: none;
                flex-direction: row;
                align-items: center;
                padding: 10px;
                border-radius: 5px;
                background-color: var(--surface-color);
                border: 1px solid var(--divider-color);
                color: var(on-surface-color);
                height: auto;
                min-width: 400px;
                margin-bottom: 10px;
            }

        </style>
        <div id="container">
            <paper-card id="dockbar">
                <slot></slot>
            </paper-card>
        </div>
        `

    }

    appendDialog(dialog) {


        // The group id is the name of the dialog.
        let groupId = dialog.getAttribute("name")

        // get the group id.
        if (!groupId) {
            groupId = "_" + getUuid(JSON.stringify(dialog.getTitle())) // regroup all the dialog with the same title.
        }

        let handles = this.querySelector("#" + groupId)
        if (!handles) {
            handles = new DialogHandles()
            handles.id = groupId
            this.appendChild(handles)
        }

        // append the handle to the group if not already exist.
        let handle = this.querySelector("#" + dialog.id + "-handle")
        if (!handle) {
            handle = new DialogHandle(dialog)
            handle.id = dialog.id + "-handle"
            handle.name = groupId
            handles.appendHandle(handle)

            let minimizeDialogListener = (evt) => {
                handle.dock()
            }

            let openDialogListener = (evt) => {
                handles.appendHandle(handle)
                this.shadowRoot.querySelector("#dockbar").style.display = "flex"
            }

            let closeDialogListener = (evt) => {
                handles.removeHandle(handle)

                if (handles.children.length == 0) {
                    this.removeChild(handles)
                }

                if (this.children.length == 0) {
                    this.shadowRoot.querySelector("#dockbar").style.display = "none"
                }

                // remove prevvious listener.
                dialog.removeEventListener("dialog-minimized", minimizeDialogListener);
                dialog.removeEventListener("dialog-opened", openDialogListener);
                dialog.removeEventListener("dialog-closed", closeDialogListener);
            }

            dialog.addEventListener("dialog-minimized", minimizeDialogListener);
            dialog.addEventListener("dialog-opened", openDialogListener);
            dialog.addEventListener("dialog-closed", closeDialogListener);


        } else {
            console.log("handle already exist")
        }

        this.shadowRoot.querySelector("#dockbar").style.display = "flex"
    }

    getCoords() {
        return this.shadowRoot.querySelector("#container").getBoundingClientRect()
    }
}

customElements.define('globular-dockbar', Dockbar)

// create the dockbar.
export let dockbar = new Dockbar()
document.body.appendChild(dockbar)
