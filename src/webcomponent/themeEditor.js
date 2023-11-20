import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-slider/paper-slider.js';
import '@polymer/paper-tooltip/paper-tooltip.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-button/paper-button.js';
import { get } from '@polymer/polymer/lib/utils/path';
import { getTextColorForBackground,  getPositionRelativeToBody, rgbToHex, getHexColor, getHexBackgroundColor} from './utility';


/** created from https://mui.com/material-ui/customization/color/ */

/** This contains all the shades of material desing from 50 to 900 */
let shades = ["900", "800", "700", "600", "500", "400", "300", "200", "100", "50", "A700", "A400", "A200", "A100"]

/** This contains all the colors of material desing with gradiant */
let colors = {
    "red": {
        "50": ["#b2a4a6", "#ffebee", "#ffeff1"],
        "100": ["#b28f93", "#ffcdd2", "#ffd7db"],
        "200": ["#a76b6b", "#ef9a9a", "#f2aeae"],
        "300": ["#aa2e25", "#e57373", "#f6685e"],
        "400": ["#a73a38", "#ef5350", "#f27573"],
        "500": ["#aa2e25", "#f44336", "#f6685e"],
        "600": ["#a02725", "#e53935", "#ea605d"],
        "700": ["#932020", "#d32f2f", "#db5858"],
        "800": ["#8a1c1c", "#c62828", "#d15353"],
        "900": ["#801313", "#b71c1c", "#c54949"],
        "A100": ["#b26059", "#ff8a80", "#ffa199"],
        "A200": ["#b23939", "#ff5252", "#ff7474"],
        "A400": ["#b2102f", "#ff1744", "#ff4569"],
        "A700": ["#950000", "#d50000", "#dd3333"]
    },
    "pink": {
        "50": ["#b09fa5", "#fce4ec", "#fce9ef"],
        "100": ["#ad8291", "#f8bbd0", "#f9c8d9"],
        "200": ["#aa647b", "#f48fb1", "#f6a5c0"],
        "300": ["#a84466", "#f06292", "#f381a7"],
        "400": ["#a52c55", "#ec407a", "#ef6694"],
        "500": ["#a31545", "#e91e63", "#ed4b82"],
        "600": ["#971243", "#d81b60", "#df487f"],
        "700": ["#87103f", "#c2185b", "#ce467b"],
        "800": ["#790e3c", "#ad1457", "#bd4378"],
        "900": ["#5f0937", "#880e4f", "#9f3e72"],
        "A100": ["#b25977", "#ff80ab", "#ff99bb"],
        "A200": ["#b22c5a", "#ff4081", "#ff669a"],
        "A400": ["#ab003c", "#f50057", "#f73378"],
        "A700": ["#890b44", "#c51162", "#d04081"]
    },
    "purple": {
        "50": ["#aaa0ab", "#f3e5f5", "#f5eaf7"],
        "100": ["#9d85a1", "#e1bee7", "#e7cbeb"],
        "200": ["#906697", "#ce93d8", "#d7a8df"],
        "300": ["#82488c", "#ba68c8", "#c786d3"],
        "400": ["#773183", "#ab47bc", "#bb6bc9"],
        "500": ["#6d1b7b", "#9c27b0", "#af52bf"],
        "600": ["#631976", "#8e24aa", "#a44fbb"],
        "700": ["#561571", "#7b1fa2", "#954bb4"],
        "800": ["#4a126b", "#6a1b9a", "#8748ae"],
        "900": ["#330e62", "#4a148c", "#6e43a3"],
        "A100": ["#a359b0", "#ea80fc", "#ee99fc"],
        "A200": ["#9c2caf", "#e040fb", "#e666fb"],
        "A400": ["#9500ae", "#d500f9", "#dd33fa"],
        "A700": ["#7600b2", "#aa00ff", "#bb33ff"]
    },
    "deepPurple": {
        "50": ["#a5a1ac", "#ede7f6", "#f0ebf7"],
        "100": ["#9289a3", "#d1c4e9", "#dacfed"],
        "200": ["#7d6d99", "#b39ddb", "#c2b0e2"],
        "300": ["#68518f", "#9575cd", "#aa90d7"],
        "400": ["#583c87", "#7e57c2", "#9778ce"],
        "500": ["#482880", "#673ab7", "#8561c5"],
        "600": ["#41257b", "#5e35b1", "#7e5dc0"],
        "700": ["#381f75", "#512da8", "#7357b9"],
        "800": ["#301b70", "#4527a0", "#6a52b3"],
        "900": ["#221266", "#311b92", "#5a48a7"],
        "A100": ["#7d5fb2", "#b388ff", "#c29fff"],
        "A200": ["#5635b2", "#7c4dff", "#9670ff"],
        "A400": ["#4615b2", "#651fff", "#834bff"],
        "A700": ["#4400a3", "#6200ea", "#8133ee"]
    },
    "indigo": {
        "50": ["#a2a3ac", "#e8eaf6", "#eceef7"],
        "100": ["#898da3", "#c5cae9", "#d0d4ed"],
        "200": ["#6f7598", "#9fa8da", "#b2b9e1"],
        "300": ["#545d8e", "#7986cb", "#939ed5"],
        "400": ["#404a86", "#5c6bc0", "#7c88cc"],
        "500": ["#2c387e", "#3f51b5", "#6573c3"],
        "600": ["#273377", "#3949ab", "#606dbb"],
        "700": ["#212c6f", "#303f9f", "#5965b2"],
        "800": ["#1c2566", "#283593", "#535da8"],
        "900": ["#121858", "#1a237e", "#474f97"],
        "A100": ["#626eb2", "#8c9eff", "#a3b1ff"],
        "A200": ["#3a4cb1", "#536dfe", "#758afe"],
        "A400": ["#2a3eb1", "#3d5afe", "#637bfe"],
        "A700": ["#2137b1", "#304ffe", "#5972fe"]
    },
    "blue": {
        "50": ["#9ea9b1", "#e3f2fd", "#e8f4fd"],
        "100": ["#829baf", "#bbdefb", "#c8e4fb"],
        "200": ["#648dae", "#90caf9", "#a6d4fa"],
        "300": ["#467eac", "#64b5f6", "#83c3f7"],
        "400": ["#2e73ab", "#42a5f5", "#67b7f7"],
        "500": ["#1769aa", "#2196f3", "#4dabf5"],
        "600": ["#155fa0", "#1e88e5", "#4b9fea"],
        "700": ["#115293", "#1976d2", "#4791db"],
        "800": ["#0e4686", "#1565c0", "#4383cc"],
        "900": ["#093170", "#0d47a1", "#3d6bb3"],
        "A100": ["#5b7bb2", "#82b1ff", "#9bc0ff"],
        "A200": ["#2f60b2", "#448aff", "#69a1ff"],
        "A400": ["#1c54b2", "#2979ff", "#5393ff"],
        "A700": ["#1c44b2", "#2962ff", "#5381ff"]
    },
    "lightBlue": {
        "50": ["#9dabb1", "#e1f5fe", "#e7f7fe"],
        "100": ["#7da0b0", "#b3e5fc", "#c2eafc"],
        "200": ["#5a94af", "#81d4fa", "#9adcfb"],
        "300": ["#3788ac", "#4fc3f7", "#72cff8"],
        "400": ["#1c7fac", "#29b6f6", "#53c4f7"],
        "500": ["#0276aa", "#03a9f4", "#35baf6"],
        "600": ["#026ca0", "#039be5", "#35afea"],
        "700": ["#015f92", "#0288d1", "#349fda"],
        "800": ["#015384", "#0277bd", "#3492ca"],
        "900": ["#003c6c", "#01579b", "#3378af"],
        "A100": ["#5997b2", "#80d8ff", "#99dfff"],
        "A200": ["#2c89b2", "#40c4ff", "#66cfff"],
        "A400": ["#007bb2", "#00b0ff", "#33bfff"],
        "A700": ["#0065a3", "#0091ea", "#33a7ee"]
    },
    "cyan": {
        "50": ["#9cacaf", "#e0f7fa", "#e6f8fb"],
        "100": ["#7ca4a9", "#b2ebf2", "#c1eff4"],
        "200": ["#599ba3", "#80deea", "#99e4ee"],
        "300": ["#35919d", "#4dd0e1", "#70d9e7"],
        "400": ["#1a8a98", "#26c6da", "#51d1e1"],
        "500": ["#008394", "#00bcd4", "#33c9dc"],
        "600": ["#007887", "#00acc1", "#33bccd"],
        "700": ["#006974", "#0097a7", "#33abb8"],
        "800": ["#005b64", "#00838f", "#339ba5"],
        "900": ["#004346", "#006064", "#337f83"],
        "A100": ["#5cb2b2", "#84ffff", "#9cffff"],
        "A200": ["#10b2b2", "#18ffff", "#46ffff"],
        "A400": ["#00a0b2", "#00e5ff", "#33eaff"],
        "A700": ["#008094", "#00b8d4", "#33c6dc"]
    },
    "teal": {
        "50": ["#9ca9a8", "#e0f2f1", "#e6f4f3"],
        "100": ["#7c9c99", "#b2dfdb", "#c1e5e2"],
        "200": ["#598e89", "#80cbc4", "#99d5cf"],
        "300": ["#357f78", "#4db6ac", "#70c4bc"],
        "400": ["#1a746b", "#26a69a", "#51b7ae"],
        "500": ["#00695f", "#009688", "#33ab9f"],
        "600": ["#005f56", "#00897b", "#33a095"],
        "700": ["#00544a", "#00796b", "#339388"],
        "800": ["#004940", "#00695c", "#33877c"],
        "900": ["#00352c", "#004d40", "#337066"],
        "A100": ["#74b2a4", "#a7ffeb", "#b8ffef"],
        "A200": ["#46b298", "#64ffda", "#83ffe1"],
        "A400": ["#14a37f", "#1de9b6", "#4aedc4"],
        "A700": ["#008573", "#00bfa5", "#33cbb7"]
    },
    "green": {
        "50": ["#a2aba3", "#e8f5e9", "#ecf7ed"],
        "100": ["#8ca18c", "#c8e6c9", "#d3ebd3"],
        "200": ["#739574", "#a5d6a7", "#b7deb8"],
        "300": ["#5a8b5c", "#81c784", "#9ad29c"],
        "400": ["#47824a", "#66bb6a", "#84c887"],
        "500": ["#357a38", "#4caf50", "#6fbf73"],
        "600": ["#2e7031", "#43a047", "#68b36b"],
        "700": ["#27632a", "#388e3c", "#5fa463"],
        "800": ["#205723", "#2e7d32", "#57975b"],
        "900": ["#124116", "#1b5e20", "#487e4c"],
        "A100": ["#81ac8d", "#b9f6ca", "#c7f7d4"],
        "A200": ["#49a879", "#69f0ae", "#87f3be"],
        "A400": ["#00a152", "#00e676", "#33eb91"],
        "A700": ["#008c3a", "#00c853", "#33d375"]
    },
    "lightGreen": {
        "50": ["#a8ada3", "#f1f8e9", "#f3f9ed"],
        "100": ["#9aa58c", "#dcedc8", "#e3f0d3"],
        "200": ["#899d73", "#c5e1a5", "#d0e7b7"],
        "300": ["#79955a", "#aed581", "#bedd9a"],
        "400": ["#6d8e46", "#9ccc65", "#afd683"],
        "500": ["#618833", "#8bc34a", "#a2cf6e"],
        "600": ["#567d2e", "#7cb342", "#96c267"],
        "700": ["#486f27", "#689f38", "#86b25f"],
        "800": ["#3b6120", "#558b2f", "#77a258"],
        "900": ["#234915", "#33691e", "#5b874b"],
        "A100": ["#8eb264", "#ccff90", "#d6ffa6"],
        "A200": ["#7cb23e", "#b2ff59", "#c1ff7a"],
        "A400": ["#52b202", "#76ff03", "#91ff35"],
        "A700": ["#469a10", "#64dd17", "#83e345"]
    },
    "lime": {
        "50": ["#aeafa1", "#f9fbe7", "#fafbeb"],
        "100": ["#a8aa88", "#f0f4c3", "#f3f6cf"],
        "200": ["#a1a66d", "#e6ee9c", "#ebf1af"],
        "300": ["#9aa151", "#dce775", "#e3eb90"],
        "400": ["#949d3c", "#d4e157", "#dce778"],
        "500": ["#8f9a27", "#cddc39", "#d7e360"],
        "600": ["#868d23", "#c0ca33", "#ccd45b"],
        "700": ["#7a7d1e", "#afb42b", "#bfc355"],
        "800": ["#6e6d19", "#9e9d24", "#b1b04f"],
        "900": ["#5b5310", "#827717", "#9b9245"],
        "A100": ["#aab25a", "#f4ff81", "#f6ff9a"],
        "A200": ["#a6b22d", "#eeff41", "#f1ff67"],
        "A400": ["#8ab200", "#c6ff00", "#d1ff33"],
        "A700": ["#79a300", "#aeea00", "#beee33"]
    },
    "yellow": {
        "50": ["#b2b1a1", "#fffde7", "#fffdeb"],
        "100": ["#b2ae89", "#fff9c4", "#fffacf"],
        "200": ["#b2ab6d", "#fff59d", "#fff7b0"],
        "300": ["#b2a852", "#fff176", "#fff391"],
        "400": ["#b2a63d", "#ffee58", "#fff179"],
        "500": ["#b2a429", "#ffeb3b", "#ffef62"],
        "600": ["#b19725", "#fdd835", "#fddf5d"],
        "700": ["#af861f", "#fbc02d", "#fbcc57"],
        "800": ["#ae7519", "#f9a825", "#fab950"],
        "900": ["#ab5810", "#f57f17", "#f79845"],
        "A100": ["#b2b262", "#ffff8d", "#ffffa3"],
        "A200": ["#b2b200", "#ffff00", "#ffff33"],
        "A400": ["#b2a300", "#ffea00", "#ffee33"],
        "A700": ["#b29500", "#ffd600", "#ffde33"]
    },
    "amber": {
        "50": ["#b2ad9d", "#fff8e1", "#fff9e7"],
        "100": ["#b2a57d", "#ffecb3", "#ffefc2"],
        "200": ["#b29c5b", "#ffe082", "#ffe69b"],
        "300": ["#b29537", "#ffd54f", "#ffdd72"],
        "400": ["#b28d1c", "#ffca28", "#ffd453"],
        "500": ["#b28704", "#ffc107", "#ffcd38"],
        "600": ["#b27d00", "#ffb300", "#ffc233"],
        "700": ["#b27000", "#ffa000", "#ffb333"],
        "800": ["#b26400", "#ff8f00", "#ffa533"],
        "900": ["#b24d00", "#ff6f00", "#ff8b33"],
        "A100": ["#b2a058", "#ffe57f", "#ffea98"],
        "A200": ["#b2962c", "#ffd740", "#ffdf66"],
        "A400": ["#b28900", "#ffc400", "#ffcf33"],
        "A700": ["#b27700", "#ffab00", "#ffbb33"]
    },
    "orange": {
        "50": ["#b2aa9c", "#fff3e0", "#fff5e6"],
        "100": ["#b29c7c", "#ffe0b2", "#ffe6c1"],
        "200": ["#b28e59", "#ffcc80", "#ffd699"],
        "300": ["#b28035", "#ffb74d", "#ffc570"],
        "400": ["#b2741a", "#ffa726", "#ffb851"],
        "500": ["#b26a00", "#ff9800", "#ffac33"],
        "600": ["#af6200", "#fb8c00", "#fba333"],
        "700": ["#ab5600", "#f57c00", "#f79633"],
        "800": ["#a74b00", "#ef6c00", "#f28933"],
        "900": ["#a13800", "#e65100", "#eb7333"],
        "A100": ["#b29259", "#ffd180", "#ffda99"],
        "A200": ["#b2772c", "#ffab40", "#ffbb66"],
        "A400": ["#b26500", "#ff9100", "#ffa733"],
        "A700": ["#b24c00", "#ff6d00", "#ff8a33"]
    },
    "deepOrange": {
        "50": ["#afa3a1", "#fbe9e7", "#fbedeb"],
        "100": ["#b28e83", "#ffccbc", "#ffd6c9"],
        "200": ["#b27765", "#ffab91", "#ffbba7"],
        "300": ["#b26046", "#ff8a65", "#ffa183"],
        "400": ["#b24e2e", "#ff7043", "#ff8c68"],
        "500": ["#b23c17", "#ff5722", "#ff784e"],
        "600": ["#aa3815", "#f4511e", "#f6734b"],
        "700": ["#a13311", "#e64a19", "#eb6e47"],
        "800": ["#972e0e", "#d84315", "#df6843"],
        "900": ["#852508", "#bf360c", "#cb5e3c"],
        "A100": ["#b26e59", "#ff9e80", "#ffb199"],
        "A200": ["#b24d2c", "#ff6e40", "#ff8b66"],
        "A400": ["#b22a00", "#ff3d00", "#ff6333"],
        "A700": ["#9a1e00", "#dd2c00", "#e35633"]
    }
}


export class ThemeEditor extends HTMLElement {
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
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #content{
            display: flex;
            padding: 20px;
            flex-direction: column;
        }

        #actions{
            display: flex;
            flex-direction: row;
            width: 100%;
            justify-content: flex-end;
            padding-right: 20px;
            margin-bottom: 10px;
        }

        #primary-color-selector-div, #secondary-color-selector-div{
            margin-right: 20px;
        }

        paper-card{
            display: flex;
            background-color: var(--surface-color);
            color: var(--on-surface-color);
            width: fit-content;
            flex-direction: column;
            border-radius: 5px;
        }

        @media screen and (min-width: 768px) {
            /* Apply these styles for screens wider than 768px */
            #content {
                flex-direction: row; /* Arrange elements side by side on larger screens */
            }

            #container{
                align-items: flex-start;
                justify-content: flex-start;
            }
        }

        @media screen and (max-width: 768px) {
            #theme-selector-div, #primary-color-selector-div, #secondary-color-selector-div{
                margin-right: 0px;
                margin-bottom: 20px;
                display: flex;
                height: fit-content;
                align-items: center;
                justify-content: center;
            }
        }
        </style>

        <div id="container">
            <paper-card>
                <div id="content">
                    <div id="primary-color-selector-div">
                        <globular-theme-color-summary id="primary-color-selector"></globular-theme-color-summary>
                    </div>
                    <div id="theme-selector-div">
                        <globular-theme-preview></globular-theme-preview>
                    </div>
                </div>
                <div id="actions">
                    <paper-button id="apply-button">Apply</paper-button>
                </div>
            </paper-card>
        </div>

        `
        // give the focus to the input.
        let preview = this.shadowRoot.querySelector("globular-theme-preview")
        let summary = this.shadowRoot.querySelector("globular-theme-color-summary")

        // connect the event listeners.
        summary.addEventListener("theme-change", (evt) => {

            // set target color...
            preview.setAttribute("primary-color", evt.detail.target.getAttribute("primary-color"))
            preview.setAttribute("primary-light-color", evt.detail.target.getAttribute("primary-light-color"))
            preview.setAttribute("primary-dark-color", evt.detail.target.getAttribute("primary-dark-color"))
            preview.setAttribute("secondary-color", evt.detail.target.getAttribute("secondary-color"))
            preview.setAttribute("secondary-light-color", evt.detail.target.getAttribute("secondary-light-color"))
            preview.setAttribute("secondary-dark-color", evt.detail.target.getAttribute("secondary-dark-color"))
            preview.setAttribute("error-color", evt.detail.target.getAttribute("error-color"))
            preview.setAttribute("on-primary-color", evt.detail.target.getAttribute("on-primary-color"))
            preview.setAttribute("on-secondary-color", evt.detail.target.getAttribute("on-secondary-color"))
            preview.setAttribute("on-error-color", evt.detail.target.getAttribute("on-error-color"))
            preview.setAttribute("surface-color", evt.detail.target.getAttribute("surface-color"))
            preview.setAttribute("on-surface-color", evt.detail.target.getAttribute("on-surface-color"))
            preview.setAttribute("background-color", evt.detail.target.getAttribute("background-color"))
            preview.setAttribute("on-background-color", evt.detail.target.getAttribute("on-background-color"))
            
        })

        let saveBtn = this.shadowRoot.querySelector("#apply-button")
        saveBtn.addEventListener("click", (evt) => {

            // Get the document's root element
            const root = document.documentElement;
            let primaryColor = preview.getAttribute("primary-color")
            root.style.setProperty('--primary-color', primaryColor);

            let secondary = preview.getAttribute("secondary-color")
            root.style.setProperty('--secondary-color', secondary);

            let error = preview.getAttribute("error-color")
            root.style.setProperty('--error-color', error);

            let onPrimary = preview.getAttribute("on-primary-color")
            root.style.setProperty('--on-primary-color', onPrimary);

            let onSecondary = preview.getAttribute("on-secondary-color")
            root.style.setProperty('--on-secondary-color', onSecondary);

            let onError = preview.getAttribute("on-error-color")
            root.style.setProperty('--on-error-color', onError);

            let surface = preview.getAttribute("surface-color")
            root.style.setProperty('--surface-color', surface);

            let onSurface = preview.getAttribute("on-surface-color")
            root.style.setProperty('--on-surface-color', onSurface);

            let background = preview.getAttribute("background-color")
            root.style.setProperty('--background-color', background);

            let onBackground = preview.getAttribute("on-background-color")
            root.style.setProperty('--on-background-color', onBackground);

            let primaryLight = preview.getAttribute("primary-light-color")
            root.style.setProperty('--primary-light-color', primaryLight);

            let primaryDark = preview.getAttribute("primary-dark-color")
            root.style.setProperty('--primary-dark-color', primaryDark);

            let secondaryLight = preview.getAttribute("secondary-light-color")
            root.style.setProperty('--secondary-light-color', secondaryLight);

            let secondaryDark = preview.getAttribute("secondary-dark-color")
            root.style.setProperty('--secondary-dark-color', secondaryDark);

            // Save the theme.
            let theme = {
                "primary-color": primaryColor,
                "secondary-color": secondary,
                "error-color": error,
                "on-primary-color": onPrimary,
                "on-secondary-color": onSecondary,
                "on-error-color": onError,
                "surface-color": surface,
                "on-surface-color": onSurface,
                "background-color": background,
                "on-background-color": onBackground,
                "primary-light-color": primaryLight,
                "primary-dark-color": primaryDark,
                "secondary-light-color": secondaryLight,
                "secondary-dark-color": secondaryDark
            }

            // Save the theme.
            localStorage.setItem("theme", JSON.stringify(theme))
        })

    }
}

customElements.define('globular-theme-editor', ThemeEditor)


// Define the custom element "ThemePreview" that extends HTMLElement.
export class ThemePreview extends HTMLElement {
    // Constructor of the custom element.
    constructor() {
        super();
        // Set up the shadow DOM.
        this.attachShadow({ mode: 'open' });
    }

    // Called when the custom element is connected to the DOM.
    connectedCallback() {
        // Initialize the layout and styles within the shadow DOM.
        this.shadowRoot.innerHTML = `
        <style>
            /* Styling for the container element */
            #container {
                position: relative;
                height: 390px;
                width: 366px;
                border: 1px solid var(--divider-color);
                display: flex;
                flex-direction: column;
            }

            /* Styling for the header section */
            #header {
                transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
                box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px -1px, rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, rgba(0, 0, 0, 0.12) 0px 1px 10px 0px;
                background-image: linear-gradient(rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.09));
                display: flex;
                flex-direction: column;
                width: 100%;
                box-sizing: border-box;
                flex-shrink: 0;
                position: static;
                z-index: 100;
            }

            /* Styling for the top bar */
            #top-bar {
                background-color: var(--primary-dark-color);
                color: var(--on-primary-color);
                display: flex;
                height: 24px;
                width: 100%;
            }

            /* Styling for the app bar */
            #app-bar {
                background-color: var(--primary-color);
                color: var(--on-primary-color);
                display: flex;
                align-items: center;
                height: 64px;
                width: 100%;
            }

            /* Styling for the app menu */
            #app-menu {
                position: relative;
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 8px;
            }

            /* Styling for the app menu on hover */
            #app-menu:hover {
                cursor: pointer;
            }

            /* Styling for the iron icon within the app menu */
            #app-menu iron-icon {
                color: var(--on-primary-color);
            }

            /* Styling for the app title */
            #app-title {
                margin: 8px;
                font-family: "Roboto", "Helvetica", "Arial", sans-serif;
                font-weight: 500;
                font-size: 1.25rem;
                line-height: 1.6;
                letter-spacing: 0.0075em;
                color: inherit;
            }

            /* Styling for the content section */
            #content {
                background-color: var(--surface-color);
                color: var(--on-surface-color);
                flex-grow: 1;
                width: 100%;
                position: relative;
                display: flex;
                height: calc(100% - 88px);
            }

            /* Styling for the add button */
            #add-btn {
                position: absolute;
                bottom: 16px;
                right: 16px;
                background-color: var(--secondary-color);
                color: var(--on-secondary-color);
                height: 56px;
                width: 56px;
                padding: 16px;
                border-radius: 50%;
                z-index: 1050;
                box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 5px -1px, rgba(0, 0, 0, 0.14) 0px 6px 10px 0px, rgba(0, 0, 0, 0.12) 0px 1px 18px 0px;
                color: rgba(0, 0, 0, 0.87);
            }
            paper-card{
                width: 100%;
                flex-grow: 1;
                min-height: 100px;
            }

            #variables-display{
                padding: 10px;
                padding-bottom: 50px;
                overflow: auto;
                flex-grow: 1;
            }



        </style>
        <div id="container">
            <div id="header">
                <div id="top-bar"></div>
                <div id="app-bar">
                    <div id="app-menu">
                        <iron-icon icon="menu"></iron-icon>
                        <paper-ripple class="circle"></paper-ripple>
                    </div>
                    <div id="app-title">Color</div>
                </div>
            </div>
            <div id="content" style="background-color: var(--background-color);">
                <paper-card id="variables-display" style="background-color: var(--surface-color); color: var(--on-surface-color);"></paper-card>

                <paper-icon-button id="add-btn" icon="add"></paper-icon-button>
            </div>
        </div>
        `;

        // set the style sheet.
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', '../styles.css');

        // Append the <link> element to the shadow DOM
        this.shadowRoot.appendChild(linkElem);

        if (!this.hasAttribute("primary-color")) {
            this.setAttribute("primary-color", getComputedStyle(this).getPropertyValue("--primary-color"))
        }
        if (!this.hasAttribute("primary-light-color")) {
            this.setAttribute("primary-light-color", getComputedStyle(this).getPropertyValue("--primary-light-color"))
        }
        if (!this.hasAttribute("primary-dark-color")) {
            this.setAttribute("primary-dark-color", getComputedStyle(this).getPropertyValue("--primary-dark-color"))
        }
        if (!this.hasAttribute("secondary-color")) {
            this.setAttribute("secondary-color", getComputedStyle(this).getPropertyValue("--secondary-color"))
        }
        if (!this.hasAttribute("secondary-light-color")) {
            this.setAttribute("secondary-light-color", getComputedStyle(this).getPropertyValue("--secondary-light-color"))
        }
        if (!this.hasAttribute("secondary-dark-color")) {
            this.setAttribute("secondary-dark-color", getComputedStyle(this).getPropertyValue("--secondary-dark-color"))
        }
        if (!this.hasAttribute("error-color")) {
            this.setAttribute("error-color", getComputedStyle(this).getPropertyValue("--error-color"))
        }
        if (!this.hasAttribute("on-primary-color")) {
            this.setAttribute("on-primary-color", getComputedStyle(this).getPropertyValue("--on-primary-color"))
        }
        if (!this.hasAttribute("on-secondary-color")) {
            this.setAttribute("on-secondary-color", getComputedStyle(this).getPropertyValue("--on-secondary-color"))
        }
        if (!this.hasAttribute("on-error-color")) {
            this.setAttribute("on-error-color", getComputedStyle(this).getPropertyValue("--on-error-color"))
        }
        if (!this.hasAttribute("surface-color")) {
            this.setAttribute("surface-color", getComputedStyle(this).getPropertyValue("--surface-color"))
        }
        if (!this.hasAttribute("on-surface-color")) {
            this.setAttribute("on-surface-color", getComputedStyle(this).getPropertyValue("--on-surface-color"))
        }
        if (!this.hasAttribute("background-color")) {
            this.setAttribute("background-color", getComputedStyle(this).getPropertyValue("--background-color"))
        }
        if (!this.hasAttribute("on-background-color")) {
            this.setAttribute("on-background-color", getComputedStyle(this).getPropertyValue("--on-background-color"))
        }
        if (!this.hasAttribute("text-color")) {
            this.setAttribute("text-color", getComputedStyle(this).getPropertyValue("--text-color"))
        }
        if (!this.hasAttribute("text-on-primary-color")) {
            this.setAttribute("text-on-primary-color", getComputedStyle(this).getPropertyValue("--text-on-primary-color"))
        }
        if (!this.hasAttribute("text-on-secondary-color")) {
            this.setAttribute("text-on-secondary-color", getComputedStyle(this).getPropertyValue("--text-on-secondary-color"))
        }
        if (!this.hasAttribute("text-on-error-color")) {
            this.setAttribute("text-on-error-color", getComputedStyle(this).getPropertyValue("--text-on-error-color"))
        }
        if (!this.hasAttribute("divider-color")) {
            this.setAttribute("divider-color", getComputedStyle(this).getPropertyValue("--divider-color"))
        }
        if (!this.hasAttribute("shadow-color")) {
            this.setAttribute("shadow-color", getComputedStyle(this).getPropertyValue("--shadow-color"))
        }

        // Add any additional logic or event listeners if needed.
        // For example, you can add event listeners here for user interactions.
        this.displayVariables()
    }

    // Return the list of attributes to observe.
    static get observedAttributes() {
        return ['primary-color', "primary-light-color", "primary-dark-color", 'secondary-color', 'secondary-dark-color', 'secondary-light-color', 'on-primary-color', 'on-secondary-color', 'background-color', 'on-background-color', 'surface-color', 'on-surface-color'];
    }

    // Set the attribute value.
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'primary-color') {
            // set the primary-color
            this.shadowRoot.querySelector("#app-bar").style.backgroundColor = newValue

        } else if (name === 'primary-light-color') {
        } else if (name === 'primary-dark-color') {
            // the the variant primary color
            this.shadowRoot.querySelector("#top-bar").style.backgroundColor = newValue
        } else if (name === 'secondary-color') {
            this.shadowRoot.querySelector("#add-btn").style.backgroundColor = newValue
        } else if (name === 'secondary-dark-color') {
        } else if (name === 'secondary-light-color') {
        } else if (name === 'on-primary-color') {
        } else if (name === 'on-secondary-color') {
        } else if (name === 'background-color') {
            this.shadowRoot.querySelector("#content").style.backgroundColor = newValue
        } else if (name === 'on-background-color') {
            this.shadowRoot.querySelector("#content").style.color = newValue
        } else if (name === 'surface-color') {
        } else if (name === 'on-surface-color') {
        } else {
            // Handle other attributes. 
            console.log("--------> attribute changed...", name, oldValue, newValue)
        }

        this.displayVariables()
    }

    displayVariables() {
        let variableDisplay = this.shadowRoot.querySelector("#variables-display")
        variableDisplay.innerHTML = ""

        // so here I will display the variables...
        this.displayComment("/* Primary color */")
        this.displayVariable("primary-color", this.getAttribute("primary-color"))
        this.displayVariable("primary-light-color", this.getAttribute("primary-light-color"))
        this.displayVariable("primary-dark-color", this.getAttribute("primary-dark-color"))

        this.displayComment("/* Secondary color */")
        this.displayVariable("secondary-color", this.getAttribute("secondary-color"))
        this.displayVariable("secondary-light-color", this.getAttribute("secondary-light-color"))
        this.displayVariable("secondary-dark-color", this.getAttribute("secondary-dark-color"))

        this.displayComment("/* On color */")
        this.displayVariable("on-primary-color", this.getAttribute("on-primary-color"))
        this.displayVariable("on-secondary-color", this.getAttribute("on-secondary-color"))

        this.displayComment("/* Background color */")
        this.displayVariable("background-color", this.getAttribute("background-color"))
        this.displayVariable("on-background-color", this.getAttribute("on-background-color"))

        this.displayComment("/* Surface color */")
        this.displayVariable("surface-color", this.getAttribute("surface-color"))
        this.displayVariable("on-surface-color", this.getAttribute("on-surface-color"))

        this.displayComment("/* Error color */")
        this.displayVariable("error-color", this.getAttribute("error-color"))
        this.displayVariable("on-error-color", this.getAttribute("on-error-color"))

        this.displayComment("/* Divider color */")
        this.displayVariable("divider-color", this.getAttribute("divider-color"))

        this.displayComment("/* Shadow color */")
        this.displayVariable("shadow-color", this.getAttribute("shadow-color"))

        this.displayComment("/* Text color */")
        this.displayVariable("text-color", this.getAttribute("text-color"))
        this.displayVariable("text-on-primary-color", this.getAttribute("text-on-primary-color"))
        this.displayVariable("text-on-secondary-color", this.getAttribute("text-on-secondary-color"))
        this.displayVariable("text-on-error-color", this.getAttribute("text-on-error-color"))

    }

    displayComment(comment) {
        let variableDisplay = this.shadowRoot.querySelector("#variables-display")
        let div = document.createElement("div")
        div.style.paddingTop = "10px"
        div.innerHTML = comment
        div.style.color = "gray"
        variableDisplay.appendChild(div)
    }

    displayVariable(name, value) {
        let variableDisplay = this.shadowRoot.querySelector("#variables-display")
        let div = document.createElement("div")
        div.style.display = "flex"
        div.style.alignItems = "center"

        div.innerHTML = `-- ${name} : ${value}; <span style='width: 12px; height: 12px; margin-left: 10px; border: 1px solid var(--divider-color); background-color:${value};'></span>`
        variableDisplay.appendChild(div)
    }
}

// Define the custom element "globular-theme-preview" with the ThemePreview class.
customElements.define('globular-theme-preview', ThemePreview);

export class ThemeColorSummary extends HTMLElement {
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

        #container {
            background-color: var(--background-color);
            color: var(--on-background-color);
            border: 1px solid var(--divider-color);
            width: fit-content;
            height: 372px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        #background {
            width: 100%;
            flex-grow: 1;
        }

        #on-background-selector,
        #on-surface-selector {
            margin-right: 10px;
            text-decoration: underline;
        }

        #on-background-selector:hover,
        #on-surface-selector:hover {
            cursor: pointer;
        }

        label {
            /*text-decoration: underline;*/
        }

        input {
            width: 25px;
            min-width: 25px;
        }

        paper-card {
            width: 100%;
            flex-grow: 1;
            margin-top: 10px;
            padding: 10px;
        }

        #primary-color-div,
        #secondary-color-div {
            border: 1px solid var(--divider-color);
            margin-top: 10px;
            margin-right: 10px;
            width: 200px;
        }

        #secondary-label, #primary-label, #text-on-primary-label, #text-on-secondary-label{
            padding: 10px;
            text-decoration: underline;
            min-width: 80px;
        
        }

        #secondary-label:hover, #primary-label:hover, #text-on-primary-label:hover, #text-on-secondary-label:hover {
            cursor: pointer;
        }

        #primary-secondary-div{
            display: flex;
        }

        #text-on{
            display: flex; 
            flex-direction: column;
        }

        #text-on-primary, #text-on-secondary {
            position: relative;
            border: 1px solid var(--divider-color);
            margin-top: 10px;
            margin-right: 10px;
            display: flex;
            flex-direction: column;
            height: 50%;
        }


        /* Media query for screens wider than 768px */
        @media screen and (max-width: 768px) {
            #container {
                height: 100%;
            }

            #content {
                /* Additional or modified styles for wider screens... */
                flex-direction: column;
            }

            #text-on {
                flex-direction: row;
            }

            #secondary-color-div, #primary-color-div {
                width: 150px;
            }
 
            /* Additional or modified styles for wider screens... */
        }

        </style>

        <div id="container">
        <div style="display: flex; align-items: center;">
          <div id="background" style="position: relative;">
            <label id="on-background-selector" style="padding: 10px;">Text on Background</label>
            <input type="color" id="on-background-color-selector" value="#ffffff"
              style="visibility: hidden; flex-grow: 1; position: absolute; top: 0px; left: 0px;" />
          </div>
          <input type="color" id="background-color-selector" value="#ffffff" style="" title="background color" />
        </div>
      
        <paper-card style="display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center;">
            <div id="surface" style="position: relative; flex-grow: 1;">
              <label id="on-surface-selector">Text on Surface</label>
              <input type="color" id="on-surface-color-selector" value="#ffffff"
                style="visibility: hidden; flex-grow: 1; position: absolute; top: 0px; left: 0px;">
            </div>
            <input type="color" id="surface-color-selector" value="#ffffff" style="" title="surface color">
          </div>
      
          <div id="content" style="display: flex; flex-grow: 1;">
            <div id="primary-secondary-div" style="display: flex;">
                <div id="primary-color-div" style="display: flex; flex-direction: column;">
                <label id="primary-label" title="set primary color">Primary</label>
                <div
                    style="padding: 10px; height: 65%; background-color: var(--primary-color); display: flex; flex-direction: column;">
                    <label id="primary-color-label" style="color: var(--on-primary-color)">#3f51b5</label>
                    <span
                    style="color: var(--on-primary-color); flex-grow: 1; align-self: center; padding-top: calc(50% - .75rem); font-size: 1.5rem; display: flex; flex-direction: column; align-items: center;">
                    P
                    </span>
                </div>
                <div style="display: flex; flex-grow: 1;">
                    <div id="primary-light-color-div"
                    style="padding: 2px; display: flex; flex-direction: column; width: 50%; background-color: var(--primary-light-color)">
                    <span>P - Light</span>
                    <label></label>
                    </div>
                    <div id="primary-dark-color-div"
                    style="padding: 2px; display: flex; flex-direction: column; width: 50%; background-color: var(--primary-dark-color)">
                    <span>P - Dark</span>
                    <label></label>
                    </div>
                </div>
                </div>
                <div id="secondary-color-div" style="display: flex; flex-direction: column;">
                <label id="secondary-label" title="set secondary color">Secondary</label>
                <div
                    style="padding: 10px; height: 65%; background-color: var(--secondary-color); display: flex; flex-direction: column;">
                    <label id="secondary-color-label" style="color: var(--on-secondary-color)">#3f51b5</label>
                    <span
                    style="color: var(--on-secondary-color); flex-grow: 1; align-self: center; padding-top: calc(50% - .75rem); font-size: 1.5rem; display: flex; flex-direction: column; align-items: center;">
                    S
                    </span>
                </div>
                <div style="display: flex; flex-grow: 1;">
                    <div id="secondary-light-color-div"
                    style="padding: 2px; display: flex; flex-direction: column; width: 50%; background-color: var(--secondary-light-color)">
                    <span>S - Light</span>
                    <label></label>
                    </div>
                    <div id="secondary-dark-color-div"
                    style="padding: 2px; display: flex; flex-direction: column; width: 50%; background-color: var(--secondary-dark-color)">
                    <span>S - Dark</span>
                    <label></label>
                    </div>
                </div>
                </div>
            </div>
            <div id="text-on" style="">
              <div id="text-on-primary">
                <label id="text-on-primary-label" style="padding: 10px">Text on P</label>
                <input type="color" id="text-on-primary-selector" value="#ffffff"
                  style="visibility: hidden; flex-grow: 1; position: absolute; top: 10px; left: 0px;">
                <div
                  style="padding: 10px; height: 65%; background-color: var(--primary-color); display: flex; flex-direction: column;">
                  <label id="on-primary-color-label" style="color: var(--on-primary-color)"
                    title="set primary color">#3f51b5</label>
                  <span
                    style="color: var(--on-primary-color); flex-grow: 1; align-self: center; padding-top: calc(35% - .75rem); font-size: 1.5rem; display: flex; flex-direction: column; align-items: center;">
                    T
                  </span>
                </div>
              </div>
              <div id="text-on-secondary">
                <label id="text-on-secondary-label" style="padding: 10px">Text on S</label>
                <input type="color" id="text-on-secondary-selector" value="#ffffff"
                  style="visibility: hidden; flex-grow: 1; position: absolute; top: 10px; left: 0px;">
                <div
                  style="padding: 10px; height: 65%; background-color: var(--secondary-color); display: flex; flex-direction: column; ">
                  <label id="on-secondary-color-label" style="color: var(--on-secondary-color)"
                    title="set secondary color"></label>
                  <span
                    style="color: var(--on-secondary-color); flex-grow: 1; align-self: center; padding-top: calc(35% - .75rem);  font-size: 1.5rem; display: flex; flex-direction: column; align-items: center;">
                    T
                  </span>
                </div>
              </div>
            </div>
      
          </div>
        </paper-card>
      </div>
        `;
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        // Set the background text color.
        let onBackgroundColorSelector = this.shadowRoot.querySelector("#on-background-color-selector")
        let onBackgroundColor = getHexColor(container)
        onBackgroundColorSelector.value = onBackgroundColor

        // so here if the value change I will set the attribute...
        onBackgroundColorSelector.onchange = () => {
            let onBackgroundColorSelector = this.shadowRoot.querySelector("#on-background-color-selector")
            let onBackgroundColor = onBackgroundColorSelector.value
            this.setAttribute("on-background-color", onBackgroundColor)
            container.style.color = onBackgroundColor
            this.changeInternalState()
        }

        // so here I will create an attribute named on-background-color
        // and I will set the value of the attribute to the value of the color.
        this.setAttribute("on-background-color", onBackgroundColor)

        // Set background color
        let backgroundColorSelector = this.shadowRoot.querySelector("#background-color-selector")
        let backgroundColor = getHexBackgroundColor(container)
        backgroundColorSelector.value = backgroundColor

        // Set the background color...
        backgroundColorSelector.onchange = () => {
            let backgroundColorSelector = this.shadowRoot.querySelector("#background-color-selector")
            let backgroundColor = backgroundColorSelector.value
            this.setAttribute("background-color", backgroundColor)
            container.style.backgroundColor = backgroundColor
            this.changeInternalState()
        }

        // I will set the attribute background-color to the value of the color.
        this.setAttribute("background-color", backgroundColor)

        // Set the surface text color.
        let onSurfaceColorSelector = this.shadowRoot.querySelector("#on-surface-color-selector")
        let onSurfaceColor = getHexColor(container)
        onSurfaceColorSelector.value = onSurfaceColor

        onSurfaceColorSelector.onchange = () => {
            let onSurfaceColorSelector = this.shadowRoot.querySelector("#on-surface-color-selector")
            let onSurfaceColor = onSurfaceColorSelector.value
            this.setAttribute("on-surface-color", onSurfaceColor)
            let surface = container.querySelector("paper-card")
            surface.style.color = onSurfaceColor
            this.changeInternalState()
        }

        // so here I will create an attribute named on-surface-color
        // and I will set the value of the attribute to the value of the color.
        this.setAttribute("on-surface-color", onSurfaceColor)


        // Set surface color
        let surfaceColorSelector = this.shadowRoot.querySelector("#surface-color-selector")
        let surfaceColor = getHexBackgroundColor(container.querySelector("paper-card"))
        surfaceColorSelector.value = surfaceColor

        // Set the surface color...
        surfaceColorSelector.onchange = () => {
            let surfaceColorSelector = this.shadowRoot.querySelector("#surface-color-selector")
            let surfaceColor = surfaceColorSelector.value
            this.setAttribute("surface-color", surfaceColor)
            let surface = container.querySelector("paper-card")
            surface.style.backgroundColor = surfaceColor
            this.changeInternalState()
        }

        // I will set the attribute surface-color to the value of the color.
        this.setAttribute("surface-color", surfaceColor)

        // Primary text color.
        let onPrimaryColorSelector = this.shadowRoot.querySelector("#text-on-primary-selector")
        let onPrimaryColor = getHexColor(container)
        onPrimaryColorSelector.value = onPrimaryColor
        this.shadowRoot.querySelector("#on-primary-color-label").innerHTML = onPrimaryColor

        // so here if the value change I will set the attribute...
        onPrimaryColorSelector.onchange = () => {
            let onPrimaryColorSelector = this.shadowRoot.querySelector("#text-on-primary-selector")
            let onPrimaryColor = onPrimaryColorSelector.value
            this.setAttribute("on-primary-color", onPrimaryColor)
            let primaryColorLabel = this.shadowRoot.querySelector("#primary-color-label")
            primaryColorLabel.style.color = onPrimaryColor
            this.changeInternalState()
        }

        // so here I will create an attribute named on-primary-color
        // and I will set the value of the attribute to the value of the color.
        this.setAttribute("on-primary-color", onPrimaryColor)

        // primary selector.
        let primaryColorLabel = this.shadowRoot.querySelector("#primary-color-label")
        let primaryColor = getHexBackgroundColor(primaryColorLabel.parentElement)
        this.shadowRoot.querySelector("#primary-color-label").innerHTML = primaryColor
        this.setAttribute("primary-color", primaryColor)


        let primaryVariantLightColorDiv = this.shadowRoot.querySelector("#primary-light-color-div")
        let primaryVariantLightColor = getHexBackgroundColor(primaryVariantLightColorDiv)
        this.setAttribute("primary-light-color", primaryVariantLightColor)

        primaryVariantLightColorDiv.style.color = getTextColorForBackground(primaryVariantLightColor)
        let primaryVariantLightLabel = primaryVariantLightColorDiv.querySelector("label")
        primaryVariantLightLabel.innerHTML = primaryVariantLightColor

        let primaryVariantDarkColorDiv = this.shadowRoot.querySelector("#primary-dark-color-div")
        let primaryVariantDarkColor = getHexBackgroundColor(primaryVariantDarkColorDiv)
        this.setAttribute("primary-dark-color", primaryVariantDarkColor)

        primaryVariantDarkColorDiv.style.color = getTextColorForBackground(primaryVariantDarkColor)
        let primaryVariantDarkLabel = primaryVariantDarkColorDiv.querySelector("label")
        primaryVariantDarkLabel.innerHTML = primaryVariantDarkColor

        // secondary selector.

        // set secondary text color
        let onSecondaryColorSelector = this.shadowRoot.querySelector("#text-on-secondary-selector")
        let onSecondaryColor = getHexColor(container)
        onSecondaryColorSelector.value = onSecondaryColor
        this.shadowRoot.querySelector("#on-secondary-color-label").innerHTML = onSecondaryColor


        // so here if the value change I will set the attribute...
        onSecondaryColorSelector.onchange = () => {
            let onSecondaryColorSelector = this.shadowRoot.querySelector("#text-on-secondary-selector")
            let onSecondaryColor = onSecondaryColorSelector.value
            this.setAttribute("on-secondary-color", onSecondaryColor)
            let secondaryColorLabel = this.shadowRoot.querySelector("#secondary-color-label")
            secondaryColorLabel.style.color = onSecondaryColor
            this.changeInternalState()
        }

        // so here I will create an attribute named on-secondary-color
        // and I will set the value of the attribute to the value of the color.
        this.setAttribute("on-secondary-color", onSecondaryColor)

        let secondaryColorLabel = this.shadowRoot.querySelector("#secondary-color-label")
        let secondaryColor = getHexBackgroundColor(secondaryColorLabel.parentElement)
        this.setAttribute("secondary-color", secondaryColor)
        this.shadowRoot.querySelector("#secondary-color-label").innerHTML = secondaryColor

        let secondaryVariantLightColorDiv = this.shadowRoot.querySelector("#secondary-light-color-div")
        let secondaryVariantLightColor = getHexBackgroundColor(secondaryVariantLightColorDiv)
        this.setAttribute("secondary-light-color", secondaryVariantLightColor)

        secondaryVariantLightColorDiv.style.color = getTextColorForBackground(secondaryVariantLightColor)
        let secondaryVariantLightLabel = secondaryVariantLightColorDiv.querySelector("label")
        secondaryVariantLightLabel.innerHTML = secondaryVariantLightColor

        let secondaryVariantDarkColorDiv = this.shadowRoot.querySelector("#secondary-dark-color-div")
        let secondaryVariantDarkColor = getHexBackgroundColor(secondaryVariantDarkColorDiv)
        this.setAttribute("secondary-dark-color", secondaryVariantDarkColor)

        secondaryVariantDarkColorDiv.style.color = getTextColorForBackground(secondaryVariantDarkColor)
        let secondaryVariantDarkLabel = secondaryVariantDarkColorDiv.querySelector("label")
        secondaryVariantDarkLabel.innerHTML = secondaryVariantDarkColor

        // Set the background color.
        let onBackgroundSelector = this.shadowRoot.querySelector("#on-background-selector")
        onBackgroundSelector.onclick = () => {
            let onBackgroundSelector = this.shadowRoot.querySelector("#on-background-color-selector")
            onBackgroundSelector.click()
        }

        // Set the surface color.
        let onSurfaceSelector = this.shadowRoot.querySelector("#on-surface-selector")
        onSurfaceSelector.onclick = () => {
            let onSurfaceSelector = this.shadowRoot.querySelector("#on-surface-color-selector")
            onSurfaceSelector.click()
        }

        let onPrimarySelector = this.shadowRoot.querySelector("#text-on-primary-label")
        onPrimarySelector.onclick = () => {
            let onPrimarySelector = this.shadowRoot.querySelector("#text-on-primary-selector")
            onPrimarySelector.click()
        }

        let onSecondarySelector = this.shadowRoot.querySelector("#text-on-secondary-label")
        onSecondarySelector.onclick = () => {
            let onSecondarySelector = this.shadowRoot.querySelector("#text-on-secondary-selector")
            onSecondarySelector.click()
        }

        let primaryLabel = this.shadowRoot.querySelector("#primary-label")
        primaryLabel.onclick = () => {
            this.displayColorSelector(primaryLabel, "primary-color-selector", this.getAttribute("primary-color"), "primary")
        }

        let secondaryLabel = this.shadowRoot.querySelector("#secondary-label")
        secondaryLabel.onclick = () => {
            this.displayColorSelector(secondaryLabel, "secondary-color-selector", this.getAttribute("secondary-color"), "secondary")
        }
    }

    // Return the list of attributes to observe.
    static get observedAttributes() {
        return ['primary-color', "primary-light-color", "primary-dark-color", 'secondary-color', 'secondary-dark-color', 'secondary-light-color', 'on-primary-color', 'on-secondary-color', 'background-color', 'on-background-color', 'surface-color', 'on-surface-color'];
    }

    // Set the attribute value.
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'primary-color') {
            this.shadowRoot.querySelector("#primary-color-label").innerHTML = newValue
            this.shadowRoot.querySelector("#primary-color-div").children[1].style.backgroundColor = newValue
            this.shadowRoot.querySelector("#text-on-primary").children[2].style.backgroundColor = newValue
        } else if (name === 'primary-dark-color') {
            this.shadowRoot.querySelector("#primary-dark-color-div").style.backgroundColor = newValue
            this.shadowRoot.querySelector("#primary-dark-color-div").style.color = getTextColorForBackground(newValue)
        } else if (name === 'primary-light-color') {
            this.shadowRoot.querySelector("#primary-light-color-div").style.backgroundColor = newValue
            this.shadowRoot.querySelector("#primary-light-color-div").style.color = getTextColorForBackground(newValue)
        } else if (name === 'secondary-color') {
            this.shadowRoot.querySelector("#secondary-color-label").innerHTML = newValue
            this.shadowRoot.querySelector("#secondary-color-div").children[1].style.backgroundColor = newValue
            this.shadowRoot.querySelector("#text-on-secondary").children[2].style.backgroundColor = newValue
        } else if (name === 'secondary-dark-color') {
            this.shadowRoot.querySelector("#secondary-dark-color-div").style.backgroundColor = newValue
            this.shadowRoot.querySelector("#secondary-dark-color-div").style.color = getTextColorForBackground(newValue)
        } else if (name === 'secondary-light-color') {
            this.shadowRoot.querySelector("#secondary-light-color-div").style.backgroundColor = newValue
            this.shadowRoot.querySelector("#secondary-light-color-div").style.color = getTextColorForBackground(newValue)
        } else if (name === 'on-primary-color') {
            this.shadowRoot.querySelector("#text-on-primary-label").style.color = newValue
            this.shadowRoot.querySelector("#text-on-primary-selector").value = newValue
        } else if (name === 'on-secondary-color') {
            this.shadowRoot.querySelector("#text-on-secondary-label").style.color = newValue
            this.shadowRoot.querySelector("#text-on-secondary-selector").value = newValue
        } else if (name === 'background-color') {
            this.shadowRoot.querySelector("#background-color-selector").value = newValue
        } else if (name === 'on-background-color') {
            this.shadowRoot.querySelector("#on-background-color-selector").value = newValue
        } else if (name === 'surface-color') {
            this.shadowRoot.querySelector("#surface-color-selector").value = newValue
        } else if (name === 'on-surface-color') {
            this.shadowRoot.querySelector("#on-surface-color-selector").value = newValue
        } else {
            console.log("attributeChangedCallback: " + name + " " + oldValue + " " + newValue)
        }
    }

    changeInternalState() {
        // Emit the theme change event
        const evt = new CustomEvent('theme-change', {
            bubbles: true,
            composed: true,
            detail: {
                // Include any data relevant to the event
                target: this,
            }
        });
        this.dispatchEvent(evt);
    }

    displayColorSelector(parent, id, currentColor, type) {

        document.querySelectorAll(".globular-color-selector").forEach((element) => {
            element.remove()
        })

        let colorSelector = document.body.querySelector("#" + id)
        if (colorSelector) {
            colorSelector.style.zIndex = 1000
            return // already displayed.
        }

        let template = `
        <style>
            paper-card{
                position: absolute;
                top: 0px;
                padding: 20px;
                display: flex;
                flex-direction: column;
                background-color: var(--surface-color);
                color: var(--on-surface-color);
            }

            #actions{
                display: flex;
                justify-content: flex-end;
                padding-top: 20px;
            }
        </style>
        <paper-card class="globular-color-selector" id="${id}" style="z-index: 1000;">
            <globular-color-selector current-color="${currentColor}"></globular-color-selector>
            <div id="actions">
                <paper-button id="ok-btn">Ok</paper-button>
                <paper-button id="cancel-btn">Cancel</paper-button>
            </div>
        </paper-card>
        `

        /*parent.style.position = "relative"*/
        let range = document.createRange()
        colorSelector = range.createContextualFragment(template)

        let position = getPositionRelativeToBody(parent)

        document.body.appendChild(colorSelector)
        colorSelector = document.body.querySelector("#" + id)
        colorSelector.style.left = position.left + 10 + "px"
        colorSelector.style.top = position.top + parent.offsetHeight + "px"

        this.addEventListener('current-color-change', (event) => {
            let detail = event.detail
            let color = detail.color
            let lightColor = detail.lightColor
            let darkColor = detail.darkColor
            if (detail.type == "primary") {
                this.setAttribute("primary-color", color)
                this.setAttribute("primary-light-color", lightColor)
                this.setAttribute("primary-dark-color", darkColor)

            } else if (detail.type == "secondary") {
                this.setAttribute("secondary-color", color)
                this.setAttribute("secondary-light-color", lightColor)
                this.setAttribute("secondary-dark-color", darkColor)
            }
        })

        let okBtn = colorSelector.querySelector("#ok-btn")

        okBtn.onclick = () => {
            // Emit the custom event
            const evt = new CustomEvent('current-color-change', {
                bubbles: true,
                composed: true,
                detail: {
                    target: colorSelector.querySelector("globular-color-selector"),
                    color: colorSelector.querySelector("globular-color-selector").getAttribute("current-color"),
                    lightColor: colorSelector.querySelector("globular-color-selector").getAttribute("current-light-color"),
                    darkColor: colorSelector.querySelector("globular-color-selector").getAttribute("current-dark-color"),
                    type: type
                }
            });
            colorSelector.innerHTML = ""
            colorSelector.remove()
            this.dispatchEvent(evt);

            // also emit the theme change event.
            this.changeInternalState()
        }

        let cancelBtn = colorSelector.querySelector("#cancel-btn")
        cancelBtn.onclick = () => {
            colorSelector.remove()
        }

        let listener = (event) => {
            const colorSelector = document.body.querySelector("#" + id)
            if (!colorSelector) return

            const clickX = event.clientX;
            const clickY = event.clientY;

            const divRect = colorSelector.getBoundingClientRect();
            const divTop = divRect.top - parent.offsetHeight;
            const divLeft = divRect.left;
            const divRight = divRect.right;
            const divBottom = divRect.bottom;

            // Check if the click is inside the div's area
            if (clickX >= divLeft && clickX <= divRight && clickY >= divTop && clickY <= divBottom) {
                // Click is inside the div, do nothing or perform necessary actions
            } else {
                // Click is outside the div, close or hide the div here
                colorSelector.remove()
                document.removeEventListener('click', listener);
            }
        }

        document.addEventListener('click', listener);
    }
}

customElements.define('globular-theme-color-summary', ThemeColorSummary)


/**
 * Sample empty component
 */
export class ColorSelector extends HTMLElement {
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
                display: flex;
            }

            paper-slider{
                width: 135px;
            }

            label{
                margin: 0;
                font-family: "Roboto","Helvetica","Arial",sans-serif;
                font-weight: 400;
                font-size: 1rem;
                line-height: 1.5;
                letter-spacing: 0.00938em;
            }

            #colors{
                display: flex;
                flex-wrap: wrap;
                width: 200px;
                margin-top: 10px;
            }

            .color-selector-div:hover{
                cursor: pointer;
            }

            #current-color{
                padding-top: 20px;
                display: flex;
            }

            #current-color div{
                width: 66.66px;
                height: 66.66px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: .8rem;
            }

        </style>
        <div id="container">
            <div style="display: flex; flex-direction:column;">
                <div style="display: flex; align-items: center;">
                    <label>Shade: </label> 
                    <paper-slider min="0" max="13" value="5"></paper-slider>
                    <span id="current-shade">400</span>
                </div>

                <div id="colors"></div>
                <div id="current-color">
                    <div id="darker-color-div"></div>
                    <div id="current-color-div"></div>
                    <div id="ligther-color-div"></div>
                </div>
            </div>
        </div>
        `

        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        let slider = this.shadowRoot.querySelector("paper-slider")
        slider.ondraggingchanged = () => {
            console.log(slider.value)
        }

        slider.addEventListener('immediate-value-change', (e) => {
            this.displayColors(slider.immediateValue)
            let currentShade = this.shadowRoot.querySelector("#current-shade")
            currentShade.innerHTML = shades[slider.immediateValue]
        });

        slider.addEventListener('change', (e) => {
            this.displayColors(slider.value)
            let currentShade = this.shadowRoot.querySelector("#current-shade")
            currentShade.innerHTML = shades[slider.value]
        });

        if (this.hasAttribute("current-color")) {
            let currentColor = this.getAttribute("current-color")
            for (let colorName in colors) {
                let color = colors[colorName]
                for (let shade in color) {
                    if (color[shade][1] == currentColor) {
                        slider.value = shades.indexOf(shade)
                        this.currentColor = colorName
                        this.setAttribute("current-dark-color", color[shade][0])
                        this.setAttribute("current-light-color", color[shade][2])
                        slider.value = shades.indexOf(shade)
                        this.shadowRoot.querySelector("#current-shade").innerHTML = shade
                        break
                    }
                }
            }
        }
        this.displayColors(slider.value)
    }

    static get observedAttributes() {
        return ['current-color', "current-dark-color", "current-light-color"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'current-color') {
            // Update your component's behavior based on the new attribute value
        }
    }

    displayCurrentColor() {

        let shade = shades[this.shadowRoot.querySelector("paper-slider").value]

        // Now I will diplay the current color...
        let currentColorDiv = this.shadowRoot.querySelector("#current-color-div")
        let darkerColorDiv = this.shadowRoot.querySelector("#darker-color-div")
        let ligtherColorDiv = this.shadowRoot.querySelector("#ligther-color-div")

        if (this.currentColor == undefined) {
            this.currentColor = "red"
        }

        let checks = this.shadowRoot.querySelectorAll(".color-selector-check")
        for (let i = 0; i < checks.length; i++) {
            checks[i].style.display = "none"
        }

        let check = this.shadowRoot.querySelector("#" + this.currentColor + "_check")
        check.style.display = "block"

        let div = this.shadowRoot.querySelector("#" + this.currentColor + "_div")
        div.style.borderColor = "white"

        let currentColor = colors[this.currentColor][shade][1]
        currentColorDiv.style.backgroundColor = currentColor
        currentColorDiv.innerHTML = currentColor
        currentColorDiv.style.color = getTextColorForBackground(currentColor)

        let darkerColor = colors[this.currentColor][shade][0]
        darkerColorDiv.style.backgroundColor = darkerColor
        darkerColorDiv.innerHTML = darkerColor
        darkerColorDiv.style.color = getTextColorForBackground(darkerColor)

        let ligtherColor = colors[this.currentColor][shade][2]
        ligtherColorDiv.style.backgroundColor = ligtherColor
        ligtherColorDiv.innerHTML = ligtherColor
        ligtherColorDiv.style.color = getTextColorForBackground(ligtherColor)

        this.setAttribute("current-color", currentColor)
        this.setAttribute("current-dark-color", darkerColor)
        this.setAttribute("current-light-color", ligtherColor)
    }

    /** Display the color in with it shade... */
    displayColors(index) {

        let shade = shades[index]
        let container = this.shadowRoot.querySelector("#colors")
        container.innerHTML = ""
        let currentColor = this.getAttribute("current-color")

        for (let colorName in colors) {
            let color = colors[colorName]
            let div = document.createElement("div")
            div.style.backgroundColor = color[shade][1]
            div.style.width = "48px"
            div.style.height = "48px"
            div.style.border = "1px solid transparent"
            div.id = colorName + "_div"
            div.style.position = "relative"
            div.style.display = "flex"
            div.style.alignItems = "center"
            div.style.justifyContent = "center"
            div.className = "color-selector-div"

            // set the current color...
            if (color[shade][1] == currentColor) {
                this.currentColor = colorName
                this.setAttribute("current-color", color[shade][1])
                this.setAttribute("current-light-color", color[shade][2])
                this.setAttribute("current-dark-color", color[shade][0])
            }

            // set back the color to the current color.
            div.onclick = () => {
                this.currentColor = colorName
                this.setAttribute("current-color", color[shade][1])
                this.setAttribute("current-light-color", color[shade][2])
                this.setAttribute("current-dark-color", color[shade][0])

                let divs = this.shadowRoot.querySelectorAll(".color-selector-div")
                divs.forEach((div) => {
                    div.style.borderColor = "transparent"
                })

                this.displayCurrentColor()
            }

            container.appendChild(div)

            let tooltip = document.createElement("paper-tooltip")
            tooltip.innerHTML = colorName
            tooltip.for = colorName + "_div"
            container.appendChild(tooltip)

            let ripple = document.createElement("paper-ripple")
            ripple.classList.add("circle")
            ripple.recenters = true
            ripple.center = true

            let check = document.createElement("iron-icon")
            check.icon = "check"
            check.style.color = "white"
            check.style.height = "32px"
            check.style.width = "32px"
            check.style.display = "none"
            check.id = colorName + "_check"
            check.classList.add("color-selector-check")

            div.appendChild(check)
            div.appendChild(ripple)
        }

        this.displayCurrentColor()

    }
}

customElements.define('globular-color-selector', ColorSelector)
