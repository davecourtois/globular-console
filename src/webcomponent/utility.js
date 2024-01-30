import { set } from '@polymer/polymer/lib/utils/path';
import { AuthenticateRqst } from 'globular-web-client/authentication/authentication_pb';
import Toastify from 'toastify-js';


/**
 * Format file size from bytes to Gb, Mb or Kb...
 * @param {*} f_size 
 * @returns 
 */
export function getFileSizeString(f_size) {

    // In case of already converted values...
    if (typeof f_size === 'string' || f_size instanceof String) {
        return f_size
    }

    let size = ""

    if (f_size > 1024) {
        if (f_size > 1024 * 1024) {
            if (f_size > 1024 * 1024 * 1024) {
                let fileSize = f_size / (1024 * 1024 * 1024);
                size = fileSize.toFixed(2) + " GB";
            } else {
                let fileSize = f_size / (1024 * 1024);
                size = fileSize.toFixed(2) + " MB";
            }
        } else {
            let fileSize = f_size / 1024;
            size = fileSize.toFixed(2) + " KB";
        }
    } else {
        size = f_size + " bytes";
    }

    return size
}

export function secondsToTime(secs) {
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}

export function getCoords(elem) {
    // crossbrowser version
    var box = elem.getBoundingClientRect();
    var body = document.body;
    var docEl = document.documentElement;
    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;
    var top = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;
    return {
        top: Math.round(top),
        left: Math.round(left)
    };
}

/**
 * Evaluates the color of the text to be used on a background color
 * @param {string} backgroundColor - The background color in hexadecimal format (e.g., "#RRGGBB")
 * @returns {string} - The color ("black" or "white") for better text visibility
 */
export function getTextColorForBackground(backgroundColor) {

    // Remove the '#' symbol if present
    if (backgroundColor.startsWith("rgba")) {
        backgroundColor = backgroundColor.replace(/[^\d,]/g, '').split(',');
        backgroundColor = rgbaToHex(parseInt(backgroundColor[0]), parseInt(backgroundColor[1]), parseInt(backgroundColor[2]), parseFloat(backgroundColor[3]));
    } else if (backgroundColor.startsWith("rgb")) {
        backgroundColor = backgroundColor.replace(/[^\d,]/g, '').split(',');
        backgroundColor = rgbToHex(parseInt(backgroundColor[0]), parseInt(backgroundColor[1]), parseInt(backgroundColor[2]));
    } else if (backgroundColor.startsWith("hsla")) {
        backgroundColor = backgroundColor.replace(/[^\d,]/g, '').split(',');
        backgroundColor = hslaToHex(parseInt(backgroundColor[0]), parseInt(backgroundColor[1]), parseInt(backgroundColor[2]), parseFloat(backgroundColor[3]));
    } else if (backgroundColor.startsWith("hsl")) {
        backgroundColor = backgroundColor.replace(/[^\d,]/g, '').split(',');
        backgroundColor = hslToHex(parseInt(backgroundColor[0]), parseInt(backgroundColor[1]), parseInt(backgroundColor[2]));
    } else {
        backgroundColor = namedColorToHex(backgroundColor);
    }

    if (backgroundColor.startsWith("#")) {
        backgroundColor = backgroundColor.slice(1);
    }
    // Convert the hexadecimal color to RGB components
    const red = parseInt(backgroundColor.substring(0, 2), 16);
    const green = parseInt(backgroundColor.substring(2, 4), 16);
    const blue = parseInt(backgroundColor.substring(4, 6), 16);

    // Calculate the relative luminance for the background color
    const L = 0.299 * red + 0.587 * green + 0.114 * blue;
    const brightness = L / 255;

    // Decide whether to use white or black text for better visibility
    return brightness > 0.5 ? "black" : "white";
}

/**
 * Gets the position of an element relative to the body
 * @param {HTMLElement} element - The element whose position is to be calculated
 * @returns {Object} - The position object with 'top' and 'left' properties
 */
export function getPositionRelativeToBody(element) {
    const rect = element.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    const position = {
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft
    };

    return position;
}

/**
 * Converts RGB color values to a hexadecimal color string
 * @param {number} r - Red color value (0-255)
 * @param {number} g - Green color value (0-255)
 * @param {number} b - Blue color value (0-255)
 * @returns {string} - Hexadecimal color string (e.g., "#RRGGBB")
 */
export function rgbToHex(r, g, b) {
    const redHex = r.toString(16).padStart(2, '0');
    const greenHex = g.toString(16).padStart(2, '0');
    const blueHex = b.toString(16).padStart(2, '0');
    return `#${redHex}${greenHex}${blueHex}`;
}

export function rgbaToHex(r, g, b, a) {
    const hex = ((r << 16) | (g << 8) | b).toString(16);
    const alphaHex = Math.round(a * 255).toString(16).padStart(2, "0");
    return "#" + hex.padStart(6, "0") + alphaHex;
}

export function namedColorToHex(namedColor) {
    const element = document.createElement("div");
    element.style.color = namedColor;

    document.body.appendChild(element);
    const computedColor = getComputedStyle(element).color;

    document.body.removeChild(element);

    const rgbComponents = computedColor.match(/\d+/g);
    const hexColor = rgbToHex(parseInt(rgbComponents[0]), parseInt(rgbComponents[1]), parseInt(rgbComponents[2]));

    return hexColor;
}

/**
 * Gets the hexadecimal color of an element's text color
 * @param {HTMLElement} element - The element whose text color is to be retrieved
 * @returns {string} - Hexadecimal color string (e.g., "#RRGGBB")
 */
export function getHexColor(element) {
    const style = getComputedStyle(element);
    const rgbString = style.getPropertyValue('color');
    const rgbValues = rgbString.match(/\d+/g);
    const red = parseInt(rgbValues[0], 10);
    const green = parseInt(rgbValues[1], 10);
    const blue = parseInt(rgbValues[2], 10);

    return rgbToHex(red, green, blue);
}

function hslaToHex(h, s, l, a) {
    h = (h % 360 + 360) % 360; // Ensure h is within [0, 360)
    s = Math.max(0, Math.min(100, s)); // Clamp s within [0, 100]
    l = Math.max(0, Math.min(100, l)); // Clamp l within [0, 100]
    a = Math.max(0, Math.min(1, a)); // Clamp a within [0, 1]

    const hueToRgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    const q = l < 50 ? l * (1 + s / 100) : l + s - l * s / 100;
    const p = 2 * l - q;
    const r = Math.round(hueToRgb(p, q, h / 360 + 1 / 3) * 255);
    const g = Math.round(hueToRgb(p, q, h / 360) * 255);
    const b = Math.round(hueToRgb(p, q, h / 360 - 1 / 3) * 255);

    const alphaHex = Math.round(a * 255).toString(16).padStart(2, "0");

    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1) + alphaHex;
}

export function hslToHex(h, s, l) {
    h = (h % 360 + 360) % 360; // Ensure h is within [0, 360)
    s = Math.max(0, Math.min(100, s)); // Clamp s within [0, 100]
    l = Math.max(0, Math.min(100, l)); // Clamp l within [0, 100]

    const hueToRgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    const q = l < 50 ? l * (1 + s / 100) : l + s - l * s / 100;
    const p = 2 * l - q;
    const r = Math.round(hueToRgb(p, q, h / 360 + 1 / 3) * 255);
    const g = Math.round(hueToRgb(p, q, h / 360) * 255);
    const b = Math.round(hueToRgb(p, q, h / 360 - 1 / 3) * 255);

    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}


/**
 * Gets the hexadecimal background color of an element
 * @param {HTMLElement} element - The element whose background color is to be retrieved
 * @returns {string} - Hexadecimal color string (e.g., "#RRGGBB")
 */
export function getHexBackgroundColor(element) {
    const style = getComputedStyle(element);
    const rgbString = style.getPropertyValue('background-color');
    const rgbValues = rgbString.match(/\d+/g);
    const red = parseInt(rgbValues[0], 10);
    const green = parseInt(rgbValues[1], 10);
    const blue = parseInt(rgbValues[2], 10);

    return rgbToHex(red, green, blue);
}

/**
 * Create a thumbnail from an url. The url can from from img.src...
 * @param {*} src The image url
 * @param {*} w The width of the thumnail
 * @param {*} callback The callback to be call
 */
export function createThumbmail(src, w, callback) {
    getImageFile(src, (img) => {
        if (img.width > w) {
            var oc = document.createElement('canvas'), octx = oc.getContext('2d');
            oc.width = img.width;
            oc.height = img.height;
            octx.drawImage(img, 0, 0);
            if (img.width > img.height) {
                oc.height = (img.height / img.width) * w;
                oc.width = w;
            } else {
                oc.width = (img.width / img.height) * w;
                oc.height = w;
            }
            octx.drawImage(oc, 0, 0, oc.width, oc.height);
            octx.drawImage(img, 0, 0, oc.width, oc.height);
            callback(oc.toDataURL());
        } else {
            callback(img.src);
        }

    })
}

export function createThumbmailFromImage(img, w, callback) {
    createThumbmail(img.src, w, callback)
}

export function formatDateTimeCustom(dateTime, format) {
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0'); // Adding 1 to month because it's zero-based
    const day = String(dateTime.getDate()).padStart(2, '0');
    const hours = String(dateTime.getHours()).padStart(2, '0');
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    const seconds = String(dateTime.getSeconds()).padStart(2, '0');

    const formattedDateTime = format
        .replace('yyyy', year)
        .replace('mm', month)
        .replace('dd', day)
        .replace('hh', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);

    return formattedDateTime;
}


// Authenticate the 'sa' user on the globule...
function authenticateSa(globule, password, callback, errorCallback) {
    let rqst = new AuthenticateRqst();
    rqst.setName('sa');
    rqst.setIssuer(globule.config.Mac)
    rqst.setPassword(password);

    globule.authenticationService.authenticate(rqst, {}).then((response) => {
        // Set the token
        globule.token = response.getToken();
        // Call the callback
        callback(response);
    })

        .catch((err) => {
            errorCallback(err);
        });
}

/**
 * This function display authentication error and prompt the user to login. 
 * @param {*} err 
 */
export function displayAuthentication(msg, globule, successCallback, errorCallback) {

    // Create a custom DOM element for the notification content
    // Create a container element with an error icon and text
    const container = document.createElement('div');
    container.innerHTML = `
<div id="authentication-message" style="display: flex; flex-direction: column;">
    <div style="display: flex; align-items: center;">
        <i class="fa fa-exclamation-triangle" style="color: var(--error-color); margin-right: 5px;"></i>
        <span>${msg}</span>
    </div>
    <div id="admin-login">
        <paper-input
            label="Password"
            type="password"
            id="sa-password-input"
        >
            <iron-icon icon="lock" slot="suffix" class="icon"></iron-icon>
        </paper-input>
    </div>
    <div style="display: flex; justify-content: end;">
        <paper-button --paper-button-flat style="font-size: .8rem; height: 24px;" id="sa-login-button" raised>Login</paper-button>
        <paper-button --paper-button-flat style="font-size: .8rem; height: 24px;" id="sa-cancel-button" raised>Cancel</paper-button>
    </div>
</div>
`;

    let autenticationMsg = document.getElementById('authentication-message');

    // Check if the authentication message is already displayed
    if (autenticationMsg != null) {
        return;
    }


    // Example notification with an error icon using the node option
    const authentication = Toastify({
        node: container, // Use the custom DOM element
        close: false,
        duration: 0, // Set duration to 0 to prevent auto-hide
        gravity: 'top',
        style: {
            background: 'var(--surface-color)',
            borderRadius: '.25rem',
            fontFamily: 'Roboto',
            fontSize: '1.1rem',
            color: 'var(--on-surface-color)',
        },
    });


    // Show the notification
    authentication.showToast();

    // Focus on the password input
    autenticationMsg = document.getElementById('authentication-message');
    let passwordInput = autenticationMsg.querySelector('#sa-password-input');

    setTimeout(() => {
        passwordInput.focus();
    }, 100);

    // Add event listener to the password input
    passwordInput.addEventListener('keyup', (e) => {
        if (e.keyCode === 13) {
            // Cancel the event
            e.preventDefault();

            // Here I will log the user...
            authenticateSa(globule, passwordInput.value, (response) => {
                // Remove the authentication message
                authentication.hideToast();
                // Display the success message
                displaySuccess('Authentication successful!');

                // Call the success callback
                successCallback();

            }, (err) => {
                // Display the error message
                displayError(err);
            });
        }
    });

    // Add event listener to the login button
    let loginButton = autenticationMsg.querySelector('#sa-login-button');
    loginButton.addEventListener('click', (e) => {
        // Cancel the event
        e.preventDefault();

        // Here I will log the user...
        authenticateSa(globule, passwordInput.value, (response) => {
            // Remove the authentication message
            authentication.hideToast();
            // Display the success message
            displaySuccess('Authentication successful!');

            // Call the success callback
            successCallback();

        }, (err) => {
            // Display the error message
            displayError(err);
        });
    });

    // Add event listener to the cancel button
    let cancelButton = autenticationMsg.querySelector('#sa-cancel-button');
    cancelButton.addEventListener('click', (e) => {
        // Cancel the event
        e.preventDefault();

        // Remove the authentication message
        authentication.hideToast();
    });

}

/**
 * Display an error message to the user
 * @param {*} err 
 */
export function displayError(err) {

    // Create a custom DOM element for the notification content
    // Create a container element with an error icon and text
    const errorContainer = document.createElement('div');
    errorContainer.innerHTML = `
<i class="fa fa-exclamation-triangle" style="color: var(--error-color);"></i>
<span>${err}</span>
`;

    // Example notification with an error icon using the node option
    const errorNotification = Toastify({
        node: errorContainer, // Use the custom DOM element
        text: 'This is an error message!',
        duration: 3000,
        close: true,
        gravity: 'top',
        style: {
            background: 'var(--surface-color)',
            borderRadius: '.25rem',
            fontFamily: 'Roboto',
            fontSize: '1.1rem',
            color: 'var(--on-surface-color)',
        },
    });

    // Show the notification
    errorNotification.showToast();
}

/**
 * Display a success message to the user
 * @param {*} msg 
 */
export function displaySuccess(msg) {

    // Create a custom DOM element for the notification content
    // Create a container element with an error icon and text
    const msgContainer = document.createElement('div');
    msgContainer.innerHTML = `
<i class="fa fa-check-circle" style="color: var(--success-color);"></i>
<span>${msg}</span>
`;

    // Example notification with an error icon using the node option
    const successNotification = Toastify({
        node: msgContainer, // Use the custom DOM element
        text: 'This is an error message!',
        duration: 3000,
        close: true,
        gravity: 'top',
        style: {
            background: 'var(--surface-color)',
            borderRadius: '.25rem',
            fontFamily: 'Roboto',
            fontSize: '1.1rem',
            color: 'var(--on-surface-color)',
        },
    });

    // Show the notification
    successNotification.showToast();
}


/**
 * Display a success message to the user
 * @param {*} msg 
 */
export function displayQuestion(question, body) {

    // Create a custom DOM element for the notification content
    // Create a container element with an error icon and text
    const msgContainer = document.createElement('div');
    msgContainer.innerHTML = `
    <style>
    paper-button {
        font-size: .95rem; /* Smaller font size */
        padding: 4px 8px; /* Smaller padding */
        --paper-button: {
            /* If you need to adjust internal styles of the paper-button */
        };
    }
    </style>
    <div style="display: flex; flex-direction:column;">
        <div style="display: flex; align-items: center;">
            <i class="fa fa-question-circle" style="color: var(--info-color); margin-right: .5rem;"></i>
            <span>${question}</span>
        </div>
        <div>
            ${body}
        </div>
    </div>
`;

    // Example notification with an error icon using the node option
    const notification = Toastify({
        node: msgContainer, // Use the custom DOM element
        text: 'this is a question...',
        duration: 0,
        close: true,
        gravity: 'top',
        style: {
            background: 'var(--surface-color)',
            borderRadius: '.25rem',
            fontFamily: 'Roboto',
            fontSize: '1.1rem',
            color: 'var(--on-surface-color)',
        },
    });

    // Show the notification
    notification.showToast();

    return notification;
}
