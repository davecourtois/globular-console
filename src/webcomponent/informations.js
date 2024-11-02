
/**
 * Display basic application informations.
 */
export class ApplicationInfo extends HTMLElement {

    // Create the applicaiton view.
    constructor(application) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            #container {
                display: flex;
                /*background-color: var(--palette-background-paper)*/;
                color: var(--palette-text-primary);
            }

            img{
                height: 80px;
            }

        </style>
        <div id="container">
            <div>
                <img src="${application.getIcon()}"></img>
            </div>
            <div style="display: table; flex-grow: 1; padding-left: 20px;">
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Id:</div>
                    <div style="display: table-cell;">${application.getId()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Alias:</div>
                    <div style="display: table-cell;">${application.getAlias()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Publisher:</div>
                    <div style="display: table-cell;">${application.getPublisherid()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Description:</div>
                    <div style="display: table-cell;">${application.getDescription()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Version:</div>
                    <div style="display: table-cell;">${application.getVersion()}</div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; font-weight: 450;">Path:</div>
                    <div style="display: table-cell;">${application.getPath()}</div>
                </div>
            </div>
        </div>
        `
    }

}

customElements.define('globular-application-info', ApplicationInfo)
