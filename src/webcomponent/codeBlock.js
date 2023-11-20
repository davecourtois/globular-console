// Using ES6 import syntax
import hljs from 'highlight.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import { getTextColorForBackground } from './utility';


/**
 * A custom element that renders a code block with syntax highlighting.
 */
class CodeBlock extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const language = this.getAttribute('language') || 'markup';
        const theme = this.getAttribute('theme') || '';
        const backgroundColor = this.getAttribute('background-color') || '#f5f2f0';
        const codeBackgroundColor = this.getAttribute('code-background-color') || '#f5f2f0';
        const description = this.getAttribute('description') || '';

        this.shadowRoot.innerHTML = `
            <style>
                /* Any custom styling for your code block */
                @import url('./styles.css');
                @import url('https://cdn.jsdelivr.net/npm/highlight.js/styles/default.min.css');
                @import url('${theme}');

                #container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    position: relative;
                    
                }

                #content {
                    padding-top: 2rem;
                    padding-left: 1rem;
                    padding-right: 1rem;
                    background-color: ${backgroundColor};
                    border-radius: 0.5rem;
                    border: 1px solid var(--divider-color, #eae7e3);
                    overflow: auto;
                }

                #description {
                    font-color: var(--text-color, #000);
                    padding-top: 0.5rem;
                    padding-bottom: 0.5rem;
                }

                #copyButton {
                    position: absolute;
                    right: 1.5rem;
                    top: 0.5rem;
                    background-color: ${backgroundColor};
                    color: ${getTextColorForBackground(backgroundColor)};
                }

                paper-icon-button {
                    width: 36px;
                    height: 36px;
                  }

                pre {
                    padding: 0;
                    margin:  0px;
                    margin-bottom: -37px;
                }

            </style>

            <div id="container">
                <span style="position: absolute; top: 1rem; left: 2rem; color: ${getTextColorForBackground(backgroundColor)};">${language}</span>
                <div id="content">
                    <pre>
                        <code class="hljs language-${language}" style="background-color: ${codeBackgroundColor}"></code>
                   </pre>
                    <div id="description" style="display:${description.length > 0 ? "block" : "none"}">${description}</div>
                </div>
               
                <paper-icon-button icon="icons:content-copy" id="copyButton" title="copy code">Copy Code</paper-icon-button>
            </div>

            <slot></slot>
        `;

        // copy the code block to the clipboard
        let copyButton = this.shadowRoot.getElementById('copyButton');
        copyButton.setAttribute('icon', 'content-copy');
        copyButton.setAttribute('title', 'Copy to clipboard');
        copyButton.setAttribute('class', 'copy-button');
        copyButton.addEventListener('click', () => {
            const codeBlock = this.shadowRoot.querySelector('code');
            const code = codeBlock.textContent.trim();
            navigator.clipboard.writeText(code).then(() => {
                copyButton.setAttribute('icon', 'check');
                setTimeout(() => {
                    copyButton.setAttribute('icon', 'content-copy');
                }, 1000);
            });
        });

        // read the code block.
        const slot = this.shadowRoot.querySelector('slot');

        slot.addEventListener('slotchange', () => {
            const assignedNodes = slot.assignedNodes();
            let code = ""
            Array.from(assignedNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeName === "CODE" || node.nodeName === "PRE")
                .forEach(node => {
                    if (node.textContent)
                        code += node.textContent;
                    else
                        code += node.innerText;
                });

            // no code, no highlight
            if (code === "") {
                return
            }
            this.shadowRoot.querySelector('code').innerHTML = hljs.highlight(code, { language }).value;
            this.innerHTML = ""
        });
    }
}

customElements.define('globular-code-block', CodeBlock);