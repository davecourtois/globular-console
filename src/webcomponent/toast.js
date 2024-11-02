// The web component
export class ToastNotification extends HTMLElement {

    constructor(message, removeAfter) {
        super();
        this.attachShadow({ mode: 'open' });

        if (message) {
            this.setAttribute('message', message);
        }

        if (removeAfter) {
            this.setAttribute('remove-after', removeAfter);
        }
    }

    connectedCallback() {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            @import url('./styles.css');

            .toast {
                position: absolute;
                top: 2rem;
                right: 2rem;
                max-width: 300px;
                background-color: white;
                padding: 1rem;
                border-radius: .25rem;
                box-shadow: 0px 2px 5px rgba(0,0,0,0.3);
            }

            :host([type="success"]) .toast {
                background-color: var(--background-color)
                color: var(--on-background-color);
            }

        </style>
        <div class="toast">
            <slot></slot>
        </div>
        `;

        // Set the message
        if (this.hasAttribute('message')) {
            this.message = this.getAttribute('message');
            this.innerHTML = this.message;
        }

        if (this.hasAttribute('remove-after')) {
            const time = this.getAttribute('remove-after');
            this.initRemove(time);
        } else {
            // display the delete button.
        }
    }

    initRemove(time) {
        const seconds = (time) ? time : 3000;
        setTimeout(() => {
            this.dismiss();
        }, seconds);
    }

    dismiss() {
        document.body.removeChild(this);
    }
}

window.customElements.define('globular-toast-notification', ToastNotification);
