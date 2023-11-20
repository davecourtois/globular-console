import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-header-layout/app-header-layout.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/iron-collapse/iron-collapse.js';
import '@polymer/paper-ripple/paper-ripple.js';

// This is the backend
import '../controllers/Backend'
import { Backend } from '../controllers/Backend';
import { Application } from '../models/Application';

// Create a class for the element
export class AppLayout extends HTMLElement {
  // attributes.

  // Create the application view.
  constructor() {
    super();

    // Set the shadow dom.
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {

    // Retrieve saved theme data from local storage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      const themeData = JSON.parse(savedTheme);
      const root = document.documentElement;

      // Apply saved theme data to CSS variables
      root.style.setProperty('--primary-color', themeData['primary-color']);
      root.style.setProperty('--secondary-color', themeData['secondary-color']);
      root.style.setProperty('--error-color', themeData['error-color']);
      root.style.setProperty('--on-surface-color', themeData['on-surface-color']);
      root.style.setProperty('--on-primary-color', themeData['on-primary-color']);
      root.style.setProperty('--on-secondary-color', themeData['on-secondary-color']);
      root.style.setProperty('--on-error-color', themeData['on-error-color']);
      root.style.setProperty('--background-color', themeData['background-color']);
      root.style.setProperty('--surface-color', themeData['surface-color']);
      root.style.setProperty('--primary-light-color', themeData['primary-light-color']);
      root.style.setProperty('--secondary-light-color', themeData['secondary-light-color']);
      root.style.setProperty('--primary-dark-color', themeData['primary-dark-color']);
      root.style.setProperty('--secondary-dark-color', themeData['secondary-dark-color']);

      // ... set other CSS variables using saved values
    }

    // Get the application name and url.
    const applicationName = this.getAttribute('application-name') || 'Default Application Name';
    const applicationURL = this.getAttribute('application-url') || '';

    // Initialization of the layout.
    this.shadowRoot.innerHTML = `
        <style>
          @import url('./styles.css');

          app-drawer-layout:not([narrow]) [drawer-toggle] {
            display: none;
          }
        
          app-header {
            background-color: var(--primary-color);
            color: var(--text-primary-color);
            display: flex;
            flex-direction: column;
            flex-wrap: nowrap;
            justify-content: flex-start;
            box-sizing: border-box;
            flex-shrink: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none;
            min-height: 64px;
            max-height: 1000px;
            z-index: 3;
            box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14), 0 3px 1px -2px rgba(0, 0, 0, .2), 0 1px 5px 0 rgba(0, 0, 0, .12);
            transition: max-height 0.2s cubic-bezier(.4, 0, .2, 1), box-shadow 0.2s cubic-bezier(.4, 0, .2, 1);
          }

          app-header-layout {
            background-color: var(--background-color); 
          }

          #toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }
        
          #toolbar div {
            padding: 0 1rem;
          }
        
          #contextual-action-bar {
            align-items: flex-end;
            justify-content: flex-end;
            display: flex;
            flex-grow: 1;
          }
      </style>
      
      <app-drawer-layout>
        <app-drawer slot="drawer">
            <slot name="app-side-menu"></slot>
        </app-drawer>
        <app-header-layout>
          <app-header style="display: block;" class="mdl-layout__header is-casting-shadow" slot="header" reveals
            effects="waterfall">
            <app-toolbar>
              <paper-icon-button icon="menu" drawer-toggle></paper-icon-button>
              <div id="toolbar" style="display: flex;">
                <div id="main-title">
                  <slot name="app-title"></slot>
                </div>
                <div id="contextual-action-bar">
                  <slot name="contextual-action-bar"></slot>
                </div>
                <div id="overflow-menu">
                  <iron-icon icon="more-vert"></iron-icon>
                  <slot name="overflow-menu"></slot>
                </div>
              </div>
            </app-toolbar>
          </app-header>
          <slot name="app-content" style=""></slot>
        </app-header-layout>
      </app-drawer-layout>
    `

    // Create the application.
    new Application(applicationName, applicationURL, () => {
      // Subscribe to the application info event.
      Backend.eventHub.subscribe('application_info_evt',
        (uuid) => { },
        applicationInfo => {

          // Set the icon, alias and version from the applaication.
          this.querySelector("globular-sidebar").setHeaderIcon(applicationInfo.getIcon())
          this.querySelector("globular-sidebar").setHeaderTitle(applicationInfo.getAlias())
          this.querySelector("globular-sidebar").setHeaderSubtitle(`v${applicationInfo.getVersion()}`)

          // Dispatch the loaded event.
          const event = new Event('loaded', { bubbles: true, composed: true });
          this.dispatchEvent(event);

        }, true)
    }, err => console.log(err));
  }

}

customElements.define('globular-app-layout', AppLayout);

/**
 * This is the application sidebar.
 */
export class SideBar extends HTMLElement {
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
            background-color: var(--surface-color);
            color: var(on-surface-color);
            height: 100vh;
        }

        #sidebar_main {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        #side-bar-content {
          flex-grow: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }

        #sidebar_main .sidebar_main_header {
          height: 89px;
          border-bottom: 1px solid rgba(0,0,0,.12);
          background-image: url(../img/sidebar_head_bg.png);
          background-repeat: no-repeat;
          background-position: 0 0;
          position: relative;
        }

        #sidebar_main .sidebar_main_header .sidebar_logo {
          height: 48px;
          line-height: 1rem;
          overflow: hidden;
        }

        #sidebar_main .sidebar_main_header .sidebar_actions {
          margin: 0 20px;
        }

        .sidebar_logo{
          display: flex;
          align-items: center;
        }

        img#logo {
          height: 48px;
          width: auto;
          margin-left: 10px;
          margin-right: 10px;
        }

        span#title {
          font-size: 20px;
          font-weight: 400;
          font-family: "Segoe UI",Arial,sans-serif;
          text-transform: uppercase;
        }

        span#subtitle {
          font-size: 12px;
          font-weight: 400;
          font-family: "Segoe UI",Arial,sans-serif;
        }

      </style>
      <div id="container">
        <div id="sidebar_main">
            <div class="sidebar_main_header" >
              <div class="sidebar_logo">
                <img id="logo"/>
                <div style="display: flex; flex-direction: column;">
                  <span id="title">Application Name</span>
                  <span id="subtitle">Subtitle</span>
                </div>
              </div>
            </div>
            <div id="side-bar-content">
              <slot></slot>
            </div>
        </div>
      </div>
      `

    // give the focus to the input.
    if (this.hasAttribute("header-background-colour")) {
      this.setHeaderBackgroundColour(this.getAttribute("header-background-colour"))
    }

    if (this.hasAttribute("header-background-image")) {
      this.setHeaderBackgroundImage(this.getAttribute("header-background-image"))
    }

    if (this.hasAttribute("header-icon")) {
      this.setHeaderIcon(this.getAttribute("header-icon"))
    }

    if (this.hasAttribute("header-title")) {
      this.setHeaderTitle(this.getAttribute("header-title"))
    }

    if (this.hasAttribute("header-subtitle")) {
      this.setHeaderSubtitle(this.getAttribute("header-subtitle"))
    }

  }

  /**
   * Set the header icon.
   * @param {*} icon 
   */
  setHeaderIcon(icon) {
    // be sure to not override the icon if attribute is set.
    if (!this.hasAttribute("header-icon")) {
      this.shadowRoot.querySelector("#logo").src = icon
    } else {
      this.shadowRoot.querySelector("#logo").src = this.getAttribute("header-icon")
    }
  }

  /**
   * Set the header background colour.
   * @param {*} colour 
   */
  setHeaderBackgroundColour(colour) {
    this.shadowRoot.querySelector("#sidebar_main .sidebar_main_header").style.backgroundColor = colour
  }

  /**
   * Set the header background image.
   */
  setHeaderBackgroundImage(image) {
    this.shadowRoot.querySelector("#sidebar_main .sidebar_main_header").style.backgroundImage = `url(${image})`
  }

  /**
   * Set the header title.
   * @param {*} title
   */
  setHeaderTitle(title) {
    title = title || "Application Name"
    this.shadowRoot.querySelector("#title").innerText = title
  }

  /**
   * Set the header subtitle.
   * @param {*} subtitle 
   */
  setHeaderSubtitle(subtitle) {
    subtitle = subtitle || "Subtitle"
    this.shadowRoot.querySelector("#subtitle").innerText = subtitle
  }

}

customElements.define('globular-sidebar', SideBar)

/**
 * This is the sidebar menu item.
 */
export class SideBarMenuItem extends HTMLElement {
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
          /* import the font awesome stylesheet.*/
          @import url('./styles.css');

          #container{
              transition: background 0.8s ease,padding 0.8s linear;
              background-color: var(--surface-color);
              color: var(on-surface-color);
              font: 500 14px/25px Roboto,sans-serif;
              color: #212121;
              display: flex;
              flex-direction: column;
              padding-left: 8px;
              padding-top: 8px;
              padding-right: 8px;
              position: relative;
          }

          #container:hover {
            cursor: pointer;
            -webkit-filter: invert(10%);
            filter: invert(10%);
          }

          #icon {
            font-size: 24px;
            vertical-align: top;
            margin-right: 25px;
            margin-left: 10px;
          }

          #text {
            flex-grow: 1;

          }

          #collapse-btn {
            display: none;
            align-self: end;
          }

          #collapse-panel {
            margin-top: 8px;
            display: none;
          }

          :slotted(globular-sidebar-menu-item) {
              font-size: .5rem;
          }

      </style>
      <div id="container">
          <div style="display: flex; flex-direction: row; position: relative;">
            <i id="icon"></i>
            <span id="text"></span>
            <div style="display: flex;">
                <div style="position: relative;">
                    <iron-icon  id="collapse-btn"  icon="icons:expand-more" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            
          </div>
          <iron-collapse class="subitems" id="collapse-panel" style="display: flex; flex-direction: column;">
              <slot></slot>
          </iron-collapse>
          <paper-ripple id="mr-ripple"></paper-ripple>
      </div>

      `
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', this.handleSlotChange.bind(this));

    let collapse_btn = this.shadowRoot.querySelector("#collapse-btn")
    let collapse_panel = this.shadowRoot.querySelector("#collapse-panel")
    collapse_btn.onclick = (evt) => {
      evt.stopPropagation();
      if (!collapse_panel.opened) {
        collapse_btn.icon = "expand-less"
      } else {
        collapse_btn.icon = "expand-more"
      }
      collapse_panel.toggle();
    }

    // give the focus to the input.
    let container = this.shadowRoot.querySelector("#container")
    if (this.hasAttribute("icon")) {
      console.log(this.innerHTML)
      this.shadowRoot.querySelector("#icon").className = this.getAttribute("icon")
    }

    if (this.hasAttribute("text")) {
      this.shadowRoot.querySelector("#text").innerText = this.getAttribute("text")
    }
  }

  /**
   * So here I will try to get the text content of the slot.
   * @param {*} event 
   */
  handleSlotChange(event) {
    const slot = event.target;
    const assignedNodes = slot.assignedNodes();

    const assignedElements = slot.assignedNodes({ flatten: true });

    const elementCount = assignedElements.length;
    if (elementCount > 0) {
      this.shadowRoot.querySelector("#collapse-btn").style.display = "block"
      this.shadowRoot.querySelector("#collapse-panel").style.display = "block"
      this.shadowRoot.querySelector("#mr-ripple").style.display = "none"

      assignedElements.forEach(element => {
        element.setSubitem()
      });
    }
  }

  // Call search event.
  setSubitem() {
    this.shadowRoot.querySelector("#text").style.fontSize = ".9rem"
    this.shadowRoot.querySelector("#text").style.fontWeight = "400"
    this.shadowRoot.querySelector("#text").style.fontFamily = "Roboto, sans-serif"
    this.shadowRoot.querySelector("#icon").style.fontSize = "20px"
  }
}

customElements.define('globular-sidebar-menu-item', SideBarMenuItem)


/**
 * Sample empty component
 */
export class SideBarMenu extends HTMLElement {
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
          #container{
            background-color: var(--palette-background-paper);
            color: var(--palette-text-primary);
            display: flex;
            flex-direction: column;
          }
      </style>
      <div id="container">
        <slot></slot>
      </div>
      `
    // give the focus to the input.
    let container = this.shadowRoot.querySelector("#container")

  }
}

customElements.define('globular-sidebar-menu', SideBarMenu)

