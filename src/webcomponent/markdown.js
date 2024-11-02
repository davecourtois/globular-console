import '@polymer/marked-element/marked-element.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import { getTextColorForBackground } from './utility';
import MarkdownIt from 'markdown-it';

// Using ES6 import syntax
import hljs from 'highlight.js';


const md = new MarkdownIt();

/**
 * Markdown element. 
 */
export class Markdown extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor() {
    super()
    // Set the shadow dom.
    this.attachShadow({ mode: 'open' });
  }
  connectedCallback() {

    // Get the theme.
    const theme = this.getAttribute('theme') || '';

    // display the content.
    const backgroundColor = this.getAttribute('background-color') || '#f5f2f0';
    const codeBackgroundColor = this.getAttribute('code-background-color') || '#f5f2f0';
    const textColor = this.getAttribute('text-color') || getTextColorForBackground(backgroundColor);

    // Innitialisation of the layout.
    this.shadowRoot.innerHTML = `
     <style>

     @import url('https://cdn.jsdelivr.net/npm/highlight.js/styles/default.min.css');
     @import url('./styles.css');
     @import url('${theme}');

     paper-icon-button {
        width: 36px;
        height: 36px;
      }
     
     .copy-button {

          position: absolute;
          right:0.5rem;
          top: 0.5rem;
          background-color: ${backgroundColor};
          color: ${getTextColorForBackground(backgroundColor)};
          border-radius: 50%;
          --paper-icon-button: {
            width: 1rem;
            height: 1rem;
          }
     }

     code.hljs {
        background-color: ${codeBackgroundColor};
        margin-bottom: 1rem;
     }

     #content {
         padding-top: 1.5rem;
         padding-bottom: 1.5rem; 
         padding-left: 1rem;
         padding-right: 1rem;
         border-radius: 0.5rem;
         border: 1px solid var(--divider-color, #eae7e3);
         overflow: auto;
         margin-bottom: 10px;
     }
     </style>

     <div id="content">
     </div>
      <slot></slot>
      <slot name="test"></slot>
     `

    let content = this.shadowRoot.querySelector('#content')

    content.style.backgroundColor = backgroundColor;
    content.style.color = textColor;

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

      content.innerHTML = md.render(code);//marked.parse(code);

      // No I will highlight the code.
      const codeBlocks = this.shadowRoot.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        let code = block.textContent;
        hljs.highlightElement(block);

        let copyButton = document.createElement('paper-icon-button');
        copyButton.setAttribute('icon', 'content-copy');
        copyButton.setAttribute('title', 'Copy to clipboard');
        copyButton.setAttribute('class', 'copy-button');
        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(code).then(() => {
            copyButton.setAttribute('icon', 'check');
            setTimeout(() => {
              copyButton.setAttribute('icon', 'content-copy');
            }, 1000);
          });
        });

        block.parentElement.style.position = 'relative';
        block.parentElement.appendChild(copyButton);

      });

      this.innerHTML = ""
    });
  }

}

customElements.define('globular-markdown', Markdown)

