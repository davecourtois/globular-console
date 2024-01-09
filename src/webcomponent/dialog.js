// Polymer dependencies
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';

import { setResizeable } from "./resizeable.js";
import { setMoveable } from './moveable.js';
import { dockbar } from './dockbar.js';
import { getCoords } from './utility.js';

/*
 * Menu item represent element contain inside a menu.
 */
export class Dialog extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.div = null;
        this.titleDiv = null; // btn actions.

        this.cancelBtn = null;
        this.okBtn = null;

        this.closeBtn = null;
        this.buttonsDiv = null;

        /* Property used to move the dialog **/
        this.isMoving = false;
        this.offsetX = 0;
        this.offsetY = 0;

        // keep the dialog time...
        this.time = new Date().getTime();
    }

    /**
     * That function is call when the table is ready to be diplay.
     */
    connectedCallback() {
        // Set the dialog id.
        if (this.hasAttribute("id")) {
            this.id = this.getAttribute("id");
        } else {
            this.id = "_" + this.time;
        }

        // test if the dialog id is unique.
        if (document.getElementById(this.id) != null && this.modalDiv != null) {
            return;
        }

        this.backgroundColor = "var(--surface-color)";
        if (this.hasAttribute("background-color"))
            this.backgroundColor = this.getAttribute("background-color");

        this.color = "var(--on-surface-color)";
        if (this.hasAttribute("color")) {
            this.color = this.getAttribute("color");
        }


        this.shadowRoot.innerHTML = `
        <style>
        
        @import url('./styles.css');

        @keyframes minimize {
            0% {
              transform:  transform: scale(1) translate(0,0);
            }
            50% {
                height: 40px;
                transform: translate( var(--offset-left), var(--offset-top));
            }
            75% {
                height: 40px;
                width: 250px;
                transform: translate( var(--offset-left), var(--offset-top));
            }
            100% {
                height: 0px;
                width: 250px;
                transform: translate( var(--offset-left), calc(var(--offset-top) + 40px));
            }
          }

        @keyframes implode {
            0% {
                transform: scale(1);
                opacity: 1;
            }
            100% {
                transform: scale(0.5);
                opacity: 0;
            }
        }

        .dialog.open {
            /* ... your existing styles ... */
            transform-origin: top left; /* Set the origin for the scaling */
            opacity: 0; /* Start with full opacity */
        }

        .minimizing {
            animation: minimize 1s ease-in-out forwards; /* Apply the animation only when closing */
            pointer-events: none; /* Disable interactions during animation */
        }

        .closing {
            animation: implode 0.2s ease-in-out forwards; /* Apply the animation only when closing */
            pointer-events: none; /* Disable interactions during animation */
        }

        /** Dialog style **/
        .dialog{
            border: solid 1px var(--divider-color);
            border-top: solid 1px var(--primary-color);

            /* ... your existing styles ... */
            transform-origin: top left; /* Set the origin for the scaling */
            opacity: 1; /* Start with full opacity */

            background-color: ${this.backgroundColor};
            color: ${this.color};
            border-radius: 4px;
            position: absolute;
            display: flex;
            flex-direction: column;
            top: 0px;
            left: 0px;
            z-index: 100;
            overflow: hidden;
            user-select: none;
        }

        .dialog_content{
            flex-grow: 1;
            /*overflow: auto;*/
            width: 100%;
            height: 100%;
        }

        /** The title **/
        .dialog_title{
            width: 100%;
            height: 40px;
            padding: 1px;
            text-align: center;
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        /** The delete button **/
        .dialog_delete_button{
            /*color: gainsboro;*/
            display: flex;
            justify-content: center;
            align-items: center;
            min-width: 16px;
            z-index: 10;
        }
        
        .dialog_delete_button i:hover {
            cursor: pointer;
            transition: all .2s ease;
        }
        
        .unselectable{
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        
        .dialog_footer{
            display: flex;
            position: relative;
            text-align: center;
            vertical-align: middle;
            justify-content: flex-end;
            padding: 1px;
        }
        
        /** Buttons of the dialog **/
        .diablog_button{
            
        }
        
        .diablog_button:hover{
            cursor: pointer;
            border-color: white;
        }
        
        .diablog_button:active{
            border: solid 1px lightblue;
        }

        .dialog_buttons{
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            width: 100%;
        }

        .dialog_icon{
            display: flex;
            justify-content: center;
            align-items: center;
            padding-left: 8px;
            width: 40px;
            height: 40px;
            z-index: 10;
        }

        .dialog_icon img{
            width: 32px;
            height: 32px;
        }
    
        .dialog_header{
            background-color: var(--primary-light-color);
            color: var(--on-primary-color);
            display: flex;
            align-items: center;

            flex-direction: row;
            width: 100%;
        }

        .dialog_header_buttons{
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            align-items: center;
            flex-grow: 1;
        }

        </style>

        <paper-card id="dialog_div" class="dialog modal-content">
            <div class="dialog_header unselectable">
                <div id="icon" class="dialog_icon">
                    <slot name="icon"></slot>
                </div>

                <div id="title" class="dialog_title">
                    <slot name="title"></slot>
                </div>
                
                <div class="dialog_header_buttons">
                    <slot name="header"></slot>
                    <paper-icon-button id="minimize_btn"  style="display: none;" icon="icons:remove" class="diablog_button"></paper-icon-button>
                    <paper-icon-button id="enter_max_btn"  style="display: none;" icon="icons:fullscreen" class="diablog_button"></paper-icon-button>
                    <paper-icon-button id="exit_max_btn" style="display: none;" icon="icons:fullscreen-exit" class="diablog_button"></paper-icon-button>
                    <paper-icon-button id="close_btn" icon="clear" class="diablog_button"></paper-icon-button>
                </div>
            </div>

            <div class="dialog_content">
                <slot></slot>
            </div>

            <div class="card-actions modal-footer unselectable">
                <slot name="actions"></slot>
                <div id="ok_cancel_buttons_div" class="dialog_buttons">
                    <paper-button id="ok_btn">Ok</paper-button>
                    <paper-button id="cancel_btn">Cancel</paper-button>
                </div>
            </div>
        </paper-card>
        `;

        // the dialog div.
        this.div = this.shadowRoot.getElementById("dialog_div"); // Set it reziable.
        this.div.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.focus();
        });

        if (this.hasAttribute("name"))
            this.div.setAttribute("name", this.getAttribute("name"));

        // set the is resizeable attribute.
        if (this.hasAttribute("is-resizeable")) {
            this.isresizeable = this.getAttribute("is-resizeable") == "true";
        } else {
            this.isresizeable = false;
        }

        if (this.isresizeable) {

            setResizeable(this.div, (width, height) => {
                /** nothing here... */
                this.width = width;
                this.height = height;
                let event = new CustomEvent("dialog-resized", {
                    detail: {
                        width: width, height: height
                    },
                    bubbles: true,
                    composed: true
                });
                this.dispatchEvent(event);
            });
        }

        this.header = this.shadowRoot.querySelector(".dialog_header");
        this.header.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.focus();
        });

        if (this.hasAttribute("ok-cancel")) {
            this.shadowRoot.querySelector("#ok_cancel_buttons_div").style.display = "flex";
        } else {
            this.shadowRoot.querySelector("#ok_cancel_buttons_div").style.display = "none";
            const actionsSlot = this.shadowRoot.querySelector('slot[name="actions"]');
            if (actionsSlot.assignedNodes().length === 0) {
                this.shadowRoot.querySelector(".card-actions").style.display = "none";
            }
        }

        // test if the is modal or not.
        if (this.hasAttribute("is-modal")) {
            this.ismodal = this.getAttribute("is-modal") == "true";
        } else {
            this.ismodal = false;
        }

        if (this.hasAttribute("show-icon")) {
            this.showIcon = this.getAttribute("show-icon") == "true";
        } else {
            this.showIcon = false;
        }

        if (this.showIcon) {
            this.shadowRoot.getElementById("icon").style.display = "flex";
        } else {
            this.shadowRoot.getElementById("icon").style.display = "none";
        }

        if (this.ismodal) {
            this.modalDiv = document.createElement("div");
            this.modalDiv.style.position = "fixed";
            this.modalDiv.style.top = "0px";
            this.modalDiv.style.left = "0px";
            this.modalDiv.style.height = "100%";
            this.modalDiv.style.width = "100%";
            this.modalDiv.style.backgroundColor = "rgba(0,0,0,.25)";
            this.modalDiv.style.zIndex = "1000";
            this.modalDiv.style.display = "block";
            document.body.appendChild(this.modalDiv);
            this.parent = this.modalDiv;
            this.modalDiv.appendChild(this);
        } else {
            this.parent = this.parentNode;
        } // The dialog div.


        if (this.hasAttribute("width")) {
            this.div.style.width = this.getAttribute("width");
        }

        if (this.hasAttribute("height")) {
            this.div.style.height = this.getAttribute("height");
        }

        // Mutation Observer setup
        const mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    this.height = this.div.offsetHeight;
                    this.width = this.div.offsetWidth;
                }
            });
        });

        mutationObserver.observe(this.div, { attributes: true });

        if (this.hasAttribute("is-maximizeable")) {
            this.ismaximizeable = this.getAttribute("is-maximizeable") == "true";
        } else {
            this.ismaximizeable = false;
        }

        if (this.hasAttribute("is-minimizeable")) {
            this.isminimizeable = this.getAttribute("is-minimizeable") == "true";
        } else {
            this.isminimizeable = false;
        }

        if (this.ismaximizeable) {

            this.shadowRoot.getElementById("enter_max_btn").style.display = "block";
            const dialogDiv = this.shadowRoot.querySelector("#dialog_div");
            const enterMaxBtn = this.shadowRoot.querySelector("#enter_max_btn");
            const exitMaxBtn = this.shadowRoot.querySelector("#exit_max_btn");
            let originalWidth, originalHeight, originalTop, originalLeft;

            let enterMaximizeListener = (e) => {
                e.stopPropagation();
                originalWidth = dialogDiv.offsetWidth;
                originalHeight = dialogDiv.offsetHeight;
                originalTop = dialogDiv.offsetTop;
                originalLeft = dialogDiv.offsetLeft;

                if (this.ismodal) {
                    dialogDiv.style.position = "fixed";
                    dialogDiv.style.top = "0px";
                    dialogDiv.style.left = "0px";
                    dialogDiv.style.height = "100%";
                } else {
                    dialogDiv.style.position = "absolute";
                    dialogDiv.style.top = `${this.offset}px`;
                    dialogDiv.style.left = "0px";
                    dialogDiv.style.height = `calc(100% - ${this.offset}px)`;
                }

                dialogDiv.style.width = "100%";
                exitMaxBtn.style.display = "inline-block";
                enterMaxBtn.style.display = "none";
            }


            enterMaxBtn.addEventListener("click", enterMaximizeListener);

            let exitMaximizeListener = (e) => {
                e.stopPropagation();
                dialogDiv.style.top = originalTop + "px";
                dialogDiv.style.left = originalLeft + "px";
                dialogDiv.style.position = ""; // set to default
                dialogDiv.style.width = originalWidth + "px";
                dialogDiv.style.height = originalHeight + "px";
                enterMaxBtn.style.display = "inline-block";
                exitMaxBtn.style.display = "none";
            }

            exitMaxBtn.addEventListener("click", exitMaximizeListener);

            let header = this.shadowRoot.querySelector(".dialog_header");
            header.addEventListener("dblclick", (e) => {
                e.stopPropagation(); dialog_header
                if (dialogDiv.style.position == "fixed") {
                    exitMaximizeListener(e);
                } else {
                    enterMaximizeListener(e);
                }
            });

        } else {
            this.shadowRoot.getElementById("enter_max_btn").style.display = "none";
        }

        if (this.isminimizeable) {
            this.shadowRoot.getElementById("minimize_btn").style.display = "block";
            dockbar.appendDialog(this);
            this.shadowRoot.getElementById("minimize_btn").addEventListener("click", (e) => {
                e.stopPropagation();

                let dockbar = document.querySelector("globular-dockbar");
                let dockbarCoord = dockbar.getCoords();
                let dockbarTop = dockbarCoord.top;
                let dockbarLeft = dockbarCoord.left;

                let divCoord = getCoords(this.div);
                let divTop = divCoord.top;
                let divLeft = divCoord.left;

                let offsetLeft = dockbarLeft - divLeft + 2;
                let offsetTop = dockbarTop - divTop;

                this.style.setProperty("--offset-left", `${offsetLeft}px`);
                this.style.setProperty("--offset-top", `${offsetTop - 40}px`);

                // hide the dialog...
                this.div.classList.add('minimizing'); // Add animation class
            });
        } else {
            this.shadowRoot.getElementById("minimize_btn").style.display = "none";
        }

        this.buttonsDiv = this.shadowRoot.getElementById("ok_cancel_buttons_div");
        this.closeBtn = this.shadowRoot.getElementById("close_btn");
        this.okBtn = this.shadowRoot.getElementById("ok_btn");
        this.cancelBtn = this.shadowRoot.getElementById("cancel_btn"); // Set the title

        // Set the dialog moveable.
        if (this.hasAttribute("is-moveable")) {
            this.ismoveable = this.getAttribute("is-moveable") == "true";

        } else {
            this.ismoveable = false;
        }

        this.offset = 0
        if (this.hasAttribute("offset")) {
            this.offset = parseInt(this.getAttribute("offset"));
        }

        if (this.ismoveable) {
            setMoveable(this.shadowRoot.querySelector("#title"), this.div, (left, top) => {

            }, this, this.offset)
        } // Close handler function.

        // Animation is complete, remove the "closing" class
        this.div.addEventListener('animationend', (evt) => {
            if (evt.animationName == "implode") {
                if (this.ismodal) {
                    this.modalDiv.parentNode.removeChild(this.modalDiv);
                }

                if (this.onclose != undefined) {
                    this.onclose();
                }

                // remove the div.
                this.parentNode.removeChild(this);

                this.div.classList.remove('closing');
                let event = new CustomEvent("dialog-closed", {
                    detail: {
                        message: "dialog-closed"
                    },
                    bubbles: true,
                    composed: true
                });

                this.dispatchEvent(event);
            } else if (evt.animationName == "minimize") {
                this.div.classList.remove('minimizing');
                let event = new CustomEvent("dialog-minimized", {
                    detail: {
                        message: "dialog-minimized"
                    },
                    bubbles: true,
                    composed: true
                });
                this.dispatchEvent(event);
            }
        });

        let closeHandler = (evt) => {
            evt.stopPropagation();
            // Closing the dialog
            this.div.classList.add('closing');
        };

        /* The button action **/
        this.cancelBtn.onclick = closeHandler;
        this.closeBtn.onclick = closeHandler;

        this.okBtn.onclick = (evt) => {
            if (this.onok != undefined) {
                this.onok();
            }
            closeHandler(evt);
        };

        // Position the new dialog
        let dialogs = document.querySelectorAll("globular-dialog");
        if (dialogs.length > 1) {

            // Convert the NodeList to an array and sort based on the time attribute
            let sortedDialogs = Array.from(dialogs).sort((dialogA, dialogB) => {
                // Parse the time attributes of the dialogs
                let timeA = parseInt(dialogA.getAttribute("time"));
                let timeB = parseInt(dialogB.getAttribute("time"));

                // Compare the time attributes for sorting
                return timeA - timeB;
            });

            let lastDialog = sortedDialogs[dialogs.length - 2];
            let lastDialogCoord = lastDialog.getCoords();
            let lastDialogTop = lastDialogCoord.top;
            let lastDialogLeft = lastDialogCoord.left;

            let offsetLeft = lastDialogLeft + 40;
            let offsetTop = lastDialogTop + 40;

            this.setPosition(offsetLeft, offsetTop);
        } else {
            // if the dialog is not moveable, I will set it at the center of the screen.
            if (!this.hasAttribute("is-moveable"))
                this.setCentered();
        }

        this.focus();
    }

    hideHorizontalResize() {
        this.div.querySelector("#resize-width-div").style.display = "none";
    }

    showHorizontalResize() {
        this.div.querySelector("#resize-width-div").style.display = "block";
    }

    hideVerticalResize() {
        this.div.querySelector("#resize-height-div").style.display = "none";
    }

    showVerticalResize() {
        this.div.querySelector("#resize-height-div").style.display = "block";
    }

    // set the height of the dialog.
    setHeight(height) {
        if (isNaN(height)) {
            this.div.style.height = height;
            return;
        }

        this.div.style.height = height + "px";
        this.height = height;
    }

    setWidth(width) {
        if (isNaN(width)) {
            this.div.style.width = width;
            return;
        }
        this.div.style.width = width + "px";
        this.width = width;
    }

    setMaxWidth(maxWidth) {
        this.div.style.maxWidth = maxWidth + "px";
        this.maxWidth = maxWidth;
    }

    getCoords() {
        return getCoords(this.div);
    }

    /** Return the icon of the dialog. */
    getIcon() {
        const iconSlot = this.shadowRoot.querySelector('slot[name="icon"]');

        if (iconSlot) {

            // Get the assigned nodes within the slot
            const assignedNodes = iconSlot.assignedNodes();

            // Filter assigned nodes to get only image elements
            const imageElements = assignedNodes.filter(node => node.nodeName === 'IMG');

            // Retrieve src attributes from image elements
            const imageSrcs = imageElements.map(imgElement => imgElement.getAttribute('src'));
            return imageSrcs[0];
        }
        return "";
    }


    /** Return the tile of the dialog */
    getTitle() {
        const titleSlot = this.shadowRoot.querySelector('slot[name="title"]');

        if (titleSlot) {
            const nodes = titleSlot.assignedNodes();

            if (nodes) {
                return nodes[0].textContent;
            }
        }
        return "";
    }

    /**
     * Close the window.
     */
    close() {
        this.shadowRoot.querySelector("#close_btn").click();
    }

    /**
     * Minimize the window.
     */
    minimize() {
        this.shadowRoot.querySelector("#minimize_btn").click();
    }

    /**
     * Open the dialog.
     **/
    open() {
        if (this.modalDiv != undefined) {
            document.body.appendChild(this.modalDiv);
            this.parent = this.modalDiv;
            this.modalDiv.appendChild(this);
        } else {
            this.parent.appendChild(this);
        }

        let event = new CustomEvent("dialog-opened", {
            detail: {
                message: "dialog-opened"
            },
            bubbles: true,
            composed: true
        });

        this.dispatchEvent(event);

        // set the dialog at center.
        this.focus();
    }

    /**
     * Center the dialog with it parent.
     */
    setCentered() {
        var docEl = document.documentElement;
        var body = document.body;
        var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft; // I will set the position of the dialog 

        this.x = (this.parent.offsetWidth - scrollLeft - this.div.offsetWidth) / 2 + scrollLeft;
        this.div.style.left = this.x + "px";
        this.y = (window.innerHeight - this.div.offsetHeight) / 2;
        this.div.style.top = this.y + "px";
    }

    /**
     * Set the dialog position in the screen
     * @param {*} x The horizontal postion
     * @param {*} y The vertical position
     */
    setPosition(x, y) {
        /* I will set the position of the dialog **/
        this.x = x;
        this.div.style.left = this.x + "px";
        this.y = y;
        this.div.style.top = this.y + "px";
    } //////////////// Getter //////////////////

    /**
     * Return a preview of the dialog...
     */
    getPreview() {

        let preview = document.createElement("div");
        preview.style.userSelect = "none";

        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].slot == "") {
                preview.appendChild(this.children[i].cloneNode(true));
            }
        }

        return preview;
    }

    /**
     * Set the dialog focus.
     */
    focus() {
        let dialogs = document.querySelectorAll("globular-dialog");
        for (var i = 0; i < dialogs.length; i++) {
            dialogs[i].div.style.zIndex = "100";
            dialogs[i].div.style.border = "solid 1px var(--divider-color)";
            dialogs[i].header.style.backgroundColor = "var(--primary-light-color)";
        }

        this.div.style.zIndex = "1000";
        this.div.style.border = "solid 1px var(--primary-light-color)";
        this.header.style.backgroundColor = "var(--primary-color)";

        let event = new CustomEvent("dialog-focused", {
            detail: {
                message: "dialog-focused"
            },
            bubbles: true,
            composed: true
        });

        this.header.click();

        this.dispatchEvent(event);
    }
}

customElements.define('globular-dialog', Dialog);