
import { v4 as uuidv4 } from "uuid";
import { fireResize } from "./utility"
import getUuidByString from "uuid-by-string"

export class EditableStringList extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(list) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            .string-list{
                display: flex;
                flex-wrap: wrap;
                min-height: 25px;
            }

            .string-list div{
                align-items: center;
                justify-content: center;
                padding: 0px 4px 0px 4px;
                margin-right: 5px;
                margin-top: 5px;
                border: 1px solid var(--palette-action-disabled);
            }

            iron-icon {
                width: 16px;
                height: 16px;
                margin-left: 2px;
                
            }

            paper-input {
                display: none; 
            }

            iron-icon:hover {
                cursor: pointer;
            }

        </style>
       
        <div style="position: relative; display: flex; align-items: center;">
            <paper-icon-button id="add-item-btn" icon="icons:add" style="position: absolute; left: -40px;"></paper-icon-button>
            <div class="string-list">
            </div>
        </div>
       
        `
        // give the focus to the input.
        let stringListDiv = this.shadowRoot.querySelector(".string-list")
        let range = document.createRange()
        stringListDiv.onclick = () => {
            this.blur()
        }


        this.shadowRoot.querySelector("#add-item-btn").onclick = () => {
            this.addItem("New value", stringListDiv, range, true)
        }

        if (list != undefined) {
            list.forEach(item => {
                this.addItem(item, stringListDiv, range)
            })
        }
    }

    // Add item to the list.
    addItem(item, stringListDiv, range, edit) {
        let uuid = "_" + getUuidByString(item)
        let itemDiv = stringListDiv.querySelector(`#${uuid}`)
        if (itemDiv) {
            itemDiv.children[0].click()
            return
        }

        let html = `
            <div id=${uuid} style="display: flex;">
                <span class="items">${item}</span>
                <paper-input no-label-float style="display: none;"></paper-input>
                <iron-icon id="remove-btn" icon="icons:close"></iron-icon>
            </div>
        `

        let index = stringListDiv.children.length
        stringListDiv.appendChild(range.createContextualFragment(html))

        // I will set edit event...
        itemDiv = stringListDiv.children[index]
        let itemSpan = itemDiv.children[0]
        let itemInput = itemDiv.children[1]
        let removeBtn = itemDiv.children[2]

        // Delete the item.
        removeBtn.onclick = (evt) => {
            evt.stopPropagation()
            itemDiv.parentNode.removeChild(itemDiv)
        }

        itemSpan.onclick = (evt) => {
            evt.stopPropagation()
            for (var i = 0; i < stringListDiv.children.length; i++) {
                stringListDiv.children[i].children[0].style.display = "block"
                stringListDiv.children[i].children[1].style.display = "none"
            }
            itemInput.style.display = "block"
            itemInput.value = itemSpan.innerHTML
            itemSpan.style.display = "none"
            setTimeout(() => {
                itemInput.focus()
                itemInput.inputElement.inputElement.select()
            }, 100)
            fireResize()
        }

        itemInput.onkeyup = (evt) => {
            evt.stopPropagation()
            let key = evt.key;
            if (key == "Escape") {
                itemSpan.innerHTML = itemInput.value = item // set back to item...
                itemInput.style.display = "none"
                itemSpan.style.display = "block"
            }
            if (key == "Enter") {
                let uuid = "_" + getUuidByString(itemInput.value)
                itemDiv.id = uuid
                let count = 0;
                for (var i = 0; i < stringListDiv.children.length; i++) {
                    if (stringListDiv.children[i].id == uuid) {
                        count++
                    }
                }

                if (count >= 1) {
                    let itemDiv_ = stringListDiv.querySelector("#" + uuid)
                    itemDiv_.children[1].value = itemInput.value
                    if (count > 1) {
                        itemDiv.parentNode.removeChild(itemDiv)
                        itemDiv_.children[0].click()
                        return
                    }
                }

                // save value
                itemSpan.innerHTML = itemInput.value
                itemInput.style.display = "none"
                itemSpan.style.display = "block"
            }
        }

        itemInput.onblur = () => {
            // make sure there not repetead values...
            let uuid = "_" + getUuidByString(itemInput.value)
            itemDiv.id = uuid
            itemSpan.innerHTML = itemInput.value
            let count = 0;
            for (var i = 0; i < stringListDiv.children.length; i++) {
                if (stringListDiv.children[i].id == uuid) {
                    count++
                }
            }

            if (count >= 1) {
                let itemDiv_ = stringListDiv.querySelector("#" + uuid)
                itemDiv_.children[1].value = itemInput.value
                if (count > 1) {
                    itemDiv.parentNode.removeChild(itemDiv)
                    itemDiv_.children[0].click()
                    return
                }
            }
        }

        if (edit) {
            itemSpan.click()
        }

    }

    blur() {
        let inputs = this.shadowRoot.querySelectorAll("paper-input")
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].style.display = "none"
            inputs[i].parentNode.children[0].style.display = "block"
        }
    }

    getItems() {
        let spans = this.shadowRoot.querySelectorAll(".items")
        let items = []
        for (var i = 0; i < spans.length; i++) {
            items.push(spans[i].innerHTML)
        }

        return items;
    }

    setItems(items) {
        let stringListDiv = this.shadowRoot.querySelector(".string-list")
        stringListDiv.innerHTML = ""
        items.forEach(item => {
            this.addItem(item, stringListDiv, document.createRange())
        })
    }
}

customElements.define('globular-editable-string-list', EditableStringList)


/**
 * String seach listbox.
 */
export class SearchableList extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(title, list, ondeleteitem, onadditem, onadd) {
        super()

        // handler...
        this.ondeleteitem = ondeleteitem;
        this.onadditem = onadditem;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.list = list
        this.title = title

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            .header{
                position: relative;
                transition: background 0.2s ease,padding 0.8s linear;
                padding-left: 10px;
            }

            .item-div:hover{
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }

            .item-div{
                padding: 5px;
                display: flex; 
                align-items: center;
                font-size: 1.125rem;
            }

            .icon-button{
                cursor: pointer;
            }

            ::-webkit-scrollbar {
                width: 5px;
                height: 5px;
             }
             
             ::-webkit-scrollbar-track {
                background: var(--palette-background-default);
             }
             
             ::-webkit-scrollbar-thumb {
                background: var(--palette-divider);
             }

        </style>
        
        <div id="header-div" class="header">
            <span class="title">${title} (${list.length})</span>
            <div style="display:flex; flex-direction: row; align-items: center;">
                <div class="icon-button" style="display: flex; width: 24px; height: 24px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="action-add-btn"  icon="add" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
                <div style="flex-grow: 1;">
                    <paper-input style="padding-left: 15px; max-width: 300px;" type="text" label="Filter ${title}"></paper-input>
                </div>
            </div>
        </div>
        <div id="shadow-div" style="width: 100%; height: 5px;"></div>
        <div id="items-div" style="width: 100%;max-height: 200px; overflow-y: auto; margin-bottom: 5px; border: 1px solid var(--divider-color); border-radius: 5px;"></div>
        `

        this.listDiv = this.shadowRoot.querySelector("#items-div")
        let shadowDiv = this.shadowRoot.querySelector("#shadow-div")

        // set the header shadow...
        this.listDiv.onscroll = () => {
            if (this.listDiv.scrollTop == 0) {
                shadowDiv.style.boxShadow = ""
            } else {
                shadowDiv.style.boxShadow = "inset 0px 5px 6px -3px rgb(0 0 0 / 40%)"
            }
        }

        // Here I will display the filter input.
        let filterInput = this.shadowRoot.querySelector("paper-input")
        this.filter_ = ""
        filterInput.onkeyup = () => {
            this.filter_ = filterInput.value;
            this.displayItems()
        }

        // Call the on add function
        let addBtn = this.shadowRoot.querySelector("#action-add-btn")
        if (onadd != undefined) {
            addBtn.onclick = () => {
                onadd(this.list)
            }
        }

        // Here I will create the action list...
        this.displayItems()
    }

    // Return the header div.
    getHeader() {
        return this.shadowRoot.querySelector("#header-div")
    }

    // That function can be overide, assume a string by default
    filter(item) {
        return item.toUpperCase().indexOf(this.filter_.toUpperCase()) != -1
    }

    // The sort items function
    sortItems() {
        return this.list.sort()
    }


    hideTitle() {
        this.shadowRoot.querySelector(".title").style.display = "none";
    }

    // The function that display one item.
    displayItem(item) {
        let uuid = "_" + uuidv4();
        let html = `
        <div id="${uuid}" class="item-div" style="padding-top: 2px; padding-bottom: 2px;">
            <div style="flex-grow: 1; line-break: anywhere;">${item}</div>
            <paper-icon-button icon="delete"></paper-icon-button>
        </div>`

        let div = document.createRange().createContextualFragment(html)
        let deleteBtn = div.querySelector("paper-icon-button")

        if (this.ondeleteitem != undefined) {
            deleteBtn.onclick = () => {
                // remove the div...
                let div = this.shadowRoot.querySelector("#" + uuid)
                div.parentNode.removeChild(div)
                this.ondeleteitem(item)
            }
        } else {
            deleteBtn.style.display = "none"
        }

        return div
    }

    // That function display items.
    displayItems() {
        // clean up the list of items.
        this.listDiv.innerHTML = ""

        this.sortItems().forEach((item) => {

            let div = this.displayItem(item)

            if (this.filter(item) || this.filter_.length == 0) {
                this.listDiv.appendChild(div)
            }

        })
    }

    removeItem(str) {
        this.list = this.list.filter(el => el !== str)
        let titleDiv = this.shadowRoot.querySelector(".title")
        titleDiv.innerHTML = `${this.title} (${this.list.length})`
        this.displayItems()
    }

    appendItem(item) {
        this.list.push(item)
        let titleDiv = this.shadowRoot.querySelector(".title")
        titleDiv.innerHTML = `${this.title} (${this.list.length})`
        this.displayItems()
    }

}

customElements.define('globular-searchable-list', SearchableList)