import { setResizeable } from "./resizeable";
import getUuidByString from "uuid-by-string";
import { formatDateTimeCustom } from "./utility";
import jmespath from 'jmespath'; // Import the JMESPath library
import orderBy from 'lodash/orderBy';

// Function to export and download JSON data as a file
function exportToJsonFile(data, filename) {
    const jsonDataStr = JSON.stringify(data, null, 4); // 4 spaces for formatting
    const blob = new Blob([jsonDataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}

// Function to export and download CSV data as a file
function exportToCsvFile(data, filename) {
    const csvContent = "data:text/csv;charset=utf-8," +
        data.map(obj => Object.values(obj).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
}

function deepCloneSpan(originalSpan) {
    const clonedSpan = document.createElement('span');

    // Copy attributes
    for (const attr of originalSpan.attributes) {
        clonedSpan.setAttribute(attr.name, attr.value);
    }

    // Clone child nodes recursively
    for (const childNode of originalSpan.childNodes) {
        if (childNode.nodeType === Node.ELEMENT_NODE) {
            const clonedChild = deepCloneSpan(childNode);
            clonedSpan.appendChild(clonedChild);
        } else if (childNode.nodeType === Node.TEXT_NODE) {
            const clonedText = document.createTextNode(childNode.nodeValue);
            clonedSpan.appendChild(clonedText);
        }
        // Handle other node types as needed
    }

    return clonedSpan;
}

/**
 * The table filter.
 */
export class TableFilter extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
          <style>
            @import url('./styles.css');
            :host {
              display: block;
            }

            #container{
                position: relative;
                display: flex;
                flex-direction: column;
            }

            div[contenteditable] {
                margin: 5px;
                border: 1px solid var(--divider-color);
                padding: 10px;
                font-family: monospace;
                white-space: pre-wrap;
                min-height: 50px;
                transition: border-color 0.3s; /* Add a transition for smooth animation */
              }
      
              div[contenteditable].focus {
                border-color: var(--primary-light-color); /* Change the border color when focused */
                outline: none; /* Remove default focus outline */
                border-radius: 5px;
              }

              #infos{
                width: 1.1rem;
                height: 1.1rem;
                color: var(--disabled-text-color);
                /* position: absolute;*/
                right: 7px;
                top: 2px;
                align-self: end;
              }

              #infos:hover{
                cursor: pointer;
                color: var(--primary-color);
              }

              .infos-panel{
                width: 300px;
                padding: 10px;
                margin: 10px;
                background-color: var(--surface-color);
                color: var(--palette-text-primary);
                border-radius: 5px;
                box-shadow: var(--shadow-elevation-2dp_-_box-shadow);
                position: absolute;
                right: 0px;
                top: 20px;
                z-index: 2;
              }

              #properties{
                display: table;
                width: 100%;
                cell-spacing: 0px;
                cell-padding: 0px;
                border-collapse: collapse;
              }

          </style>
          <div id="container">
            <iron-icon id="infos" icon="icons:info-outline"></iron-icon>
            <div contenteditable id="editor"></div>
          </div>
        `;

        this.editor = this.shadowRoot.getElementById('editor');

        this.infos = this.shadowRoot.getElementById('infos');
        this.infos.onclick = () => {
            if (this.shadowRoot.querySelector(".infos-panel").style.display == "block") {
                this.infos.style.color = "var(--disabled-text-color)"
                this.shadowRoot.querySelector(".infos-panel").style.display = "none"
            } else {
                this.infos.style.color = "var(--primary-color)"
                this.shadowRoot.querySelector(".infos-panel").style.display = "block"
            }
        }

        this.setupEditor();
    }

    setupEditor() {
        // Add event listener to update highlighting
        this.editor.addEventListener('focus', () => {
            this.editor.classList.add('focus');
        });

        this.editor.addEventListener('blur', () => {
            this.editor.classList.remove('focus');
        });

        this.editor.oninput = (evt) => {
            evt.stopPropagation();
            this.update()
        }

    }

    setTable(table, data) {
        if (this.table) {
            return
        }

        this.table = table
        let id = this.table.getAttribute("id")
        if (localStorage.getItem(id + "_query")) {
            this.editor.innerText = localStorage.getItem(id + "_query")
        }else if(this.table.query){
            this.editor.innerText = this.table.query
        }

        // Now i will setup the infos panel.
        let infosPane = `
        <paper-card id="${id}_query_editor_infos" class="infos-panel" style="display: none;">
            <h3>Filtering</h3>
            <p>
                The table filtering is based on the <a href="https://jmespath.org/" target="_blank">JMESPath</a> query language.
            </p>
            <p>
                The JMESPath language is a query language for JSON. You can use it to filter and transform JSON data.
            </p>
            <p>
                Here is a list available fields you can use in your query:
            </p>
            <div id="properties">
                <div style="display: table-row">
                    <div style="display: table-cell; padding: 5px; font-weight: bold;">Property</div>
                    <div style="display: table-cell; padding: 5px; font-weight: bold;">Type</div>
                </div>
            </div>
        </paper-card>
        `

        let range = document.createRange();
        let fragment = range.createContextualFragment(infosPane);
        let container = this.shadowRoot.getElementById("container")
        container.appendChild(fragment)

        let properties = this.shadowRoot.getElementById("properties")

        // Now i will list all the properties.
        for (var property in data) {

            if (!property.startsWith("_")) {
                let row = document.createElement("div")
                row.style.display = "table-row"

                // the property name.
                let div = document.createElement("div")
                div.innerHTML = property
                div.style.display = "table-cell"
                div.style.padding = "5px"
                row.appendChild(div)

                // the property type.
                div = document.createElement("div")
                let propertyType = typeof data[property]
                if (propertyType == "object") {
                    if (data[property] instanceof Date) {
                        propertyType = "date"
                    } else if (data[property] instanceof Array) {
                        propertyType = "array"
                    } else if (data[property] instanceof Object) {
                        propertyType = "object"
                    }
                }
                div.innerHTML = propertyType
                div.style.display = "table-cell"
                div.style.padding = "5px"
                row.appendChild(div)


                properties.appendChild(row)
            }
        }
    }

    update() {
        // Get the current selection
        let query = this.editor.innerText

        if (query == "") {
            let id = this.table.getAttribute("id")
            localStorage.removeItem(id + "_query")
            this.table.setFiltredData(null)
            return
        }

        try {
            let q = query
            if (q.indexOf(".{") != -1) {
                q = q.replace(".{", ".{ _index:_index,")
            }

            let id = this.table.getAttribute("id")
            localStorage.setItem(id + "_query", query)

            const result = jmespath.search(this.table._data, q);

            this.table.setFiltredData(result)


        } catch (e) {
            console.log(e)
            this.table.setFiltredData(null)

        }


    }

    connectedCallback() {

    }

}

customElements.define('globular-table-filter', TableFilter)



/**
 * The table sorter.
 */
export class TableSorter extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(table, field) {
        super()

        // Set the id of the element.
        this.id = "_" + getUuidByString(field)

        // keep the table and the field.
        this.table = table
        this.field = field
        this.sortIndex = -1

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                display: inline;
                vertical-align: middle;
                height: 24px;
                color: var(--disabled-text-color);
            }

            iron-icon{

                width: 1rem;
                height: 1rem;
            }

            #container:hover{
                color: var(--primary-color);
                cursor: pointer;
            }

            #index{
                font-size: .65rem;
                display: none;
            }

        </style>
        <div id="container">
            <iron-icon icon="icons:swap-vert"></iron-icon>
            <span id="index"></span>
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")
        let sortBtn = this.shadowRoot.querySelector("iron-icon")
        let indexSpan = this.shadowRoot.querySelector("#index")

        this.sortOrder = ""
        this.sortIndex = -1

        sortBtn.onclick = () => {

            if (this.sortOrder == "") {
                this.sortOrder = "asc"
                sortBtn.setAttribute("icon", "icons:arrow-upward")
                container.style.color = "var(--primary-color)"
                indexSpan.style.display = "inline"
            } else if (this.sortOrder == "asc") {
                this.sortOrder = "desc"
                sortBtn.setAttribute("icon", "icons:arrow-downward")
                container.style.color = "var(--primary-color)"
                indexSpan.style.display = "inline"
            } else if (this.sortOrder == "desc") {
                this.sortOrder = ""
                sortBtn.setAttribute("icon", "icons:swap-vert")
                container.style.color = "var(--disabled-text-color)"
                indexSpan.style.display = "none"
                this.sortIndex = -1
            }

            // sort the table.
            this.table.sort(this.sortOrder, this.field)
        }
    }

    setIndex(index) {
        let sortBtn = this.shadowRoot.querySelector("iron-icon")
        let indexSpan = this.shadowRoot.querySelector("#index")
        let container  = this.shadowRoot.querySelector("#container")

        if(index == -1){
            this.sortOrder = ""
            sortBtn.setAttribute("icon", "icons:swap-vert")
            container.style.color = "var(--disabled-text-color)"
            this.sortIndex = -1
            indexSpan.innerHTML =""
            indexSpan.style.display = "none"
        }else{
            this.sortIndex = index
            indexSpan.innerHTML = index + 1
            indexSpan.style.display = "inline"
        }
    }
}

customElements.define('globular-table-sorter', TableSorter)


/**
 * The table
 */
export class Table extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(data) {

        super()

        // if data is not defined, create an empty array.
        if (data === undefined) {
            this._data = []
        } else {
            this._data = data
        }

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
    }

    // The connection callback.
    connectedCallback() {

        this.displayIndex = false

        this.width = "100%"
        if (this.hasAttribute("width")) {
            this.width = this.getAttribute("width")
        }

        if (this.hasAttribute("display-index")) {
            this.displayIndex = true
        }

        this.headerBackgroundColor = "var(--background-color)"
        if (this.hasAttribute("header-background-color")) {
            this.headerBackgroundColor = this.getAttribute("header-background-color")
        }

        this.headerTextColor = "var(--text-primary-color)"
        if (this.hasAttribute("header-text-color")) {
            this.headerTextColor = this.getAttribute("header-text-color")
        }

        if(this.hasAttribute("query")){
            this.query = this.getAttribute("query")
        }

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            
            @import url('./styles.css');

            #table-container{
                display: flex;
                width: fit-content;
                overflow: hidden;
                position: relative;
                padding-bottom: 1px;
            }

            #fake-scroll{
                overflow-y: auto; /* Enable vertical scrolling */
                flex-grow: 1;
                height: 100%;
            }

            #fake-scroll-div{
                width: 1px;
                padding-top: 1px;
            }

            table {
                width: ${this.width};
                table-layout: fixed; /* Lock the table layout */
                border-collapse: collapse;
            }
          
            th, td {
                padding: 8px; /* Add padding to your table cells */
                max-height: 60px; /* Set the maximum height for cells */
                overflow: hidden; /* Hide content that exceeds cell height */
                text-overflow: ellipsis; /* Show ellipsis (...) for hidden content */
                white-space: nowrap; /* Prevent content from wrapping */
                border: 1px solid #ddd;
            }

            th {
                position: relative;
                overflow: visible; /* Allow resize handle to be visible */
                padding-left: 24px; /* Remove padding for header cells */
            }


            globular-table-sorter{
                position: absolute;
                left: 2px;
                top: 2px;
                bottom: 0;
                width: 10px;
                cursor: col-resize;
                z-index: 2;
            }



            th::after {
                content: "";
                position: absolute;
                top: 0;
                right: -5px;
                bottom: 0;
                width: 10px;
                cursor: col-resize;
                z-index: 1;
            }
            
            thead {
                position: sticky;
                top: 0;
                background-color: white; /* Set the desired background color for the header */
                z-index: 1; /* Ensure the header is above the table body */
                user-select: none; /* Disable user selecting text */
            }

            tbody {
                /* Add styles for the table body */
                user-select: none; /* Disable user selecting text */
            }

            #menu {
                z-index: 2;
            }

            #header {
                background-color: ${this.headerBackgroundColor};
                color: ${this.headerTextColor};
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 8px;
                border-top-left-radius: 5px;
                border-top-right-radius: 5px;
            }

            #container {
                display: flex; 
                flex-direction: column;
                background-color: var(--surface-color);
                color: var(--palette-text-primary);
                width: fit-content;
            }

            #title {
                flex-grow: 1;
                text-align: center;
            }

            #filter-btn{
                color: var(--disabled-text-color);
            }

        </style>
        <div id="container">
            <div id="header">            
                <globular-dropdown-menu id="menu" icon="icons:more-vert">
                    <globular-dropdown-menu-item id="export-json" icon="icons:file-download" text="Export as JSON"></globular-dropdown-menu-item>
                    <globular-dropdown-menu-item id="export-csv" icon="icons:file-download" text="Export as CSV"></globular-dropdown-menu-item>
                    <globular-dropdown-menu-item id="clear-sorters" icon="icons:sort" text="Clear Sort"></globular-dropdown-menu-item>
                   
                </globular-dropdown-menu>
                <div id="title">
                    <slot name="title"></slot>
                </div>
                <paper-icon-button id="filter-btn" icon="icons:filter-list" title="set filter"></paper-icon-button>
            </div>
            <iron-collapse id="filter-panel">
                <globular-table-filter></globular-table-filter>
            </iron-collapse>
            <div id="table-container">
                
                <table>
                    <thead>
                        <tr id="table-header"> </tr>
                    </thead>
                    <tbody id="table-body"></tbody>
                </table>

                <div id="fake-scroll">
                    <div id="fake-scroll-div">
                    </div>
                </div>
                
            </div>
            <slot name="fields" style="display: none;"></slot>
        </div>
        `

        // Calculate the maximum scroll position based on the data
        this.tableContainer = this.shadowRoot.getElementById('table-container');
        this.table = this.shadowRoot.querySelector('table');

        /**
         * Export the data as json file
         */
        this.shadowRoot.querySelector("#export-json").onclick = () => {

            let filename = this.getTitle()
            if (filename == "") {
                filename = "data"
            }
            filename = filename.replace(/ /g, "_")
            filename = filename.toLowerCase()
            filename += ".json"

            exportToJsonFile(this.getData(), filename)
        }

        /**
         * Export the data as csv file
         */
        this.shadowRoot.querySelector("#export-csv").onclick = () => {
            let filename = this.getTitle()
            if (filename == "") {
                filename = "data"
            }
            filename = filename.replace(/ /g, "_")
            filename = filename.toLowerCase()
            filename += ".csv"

            exportToCsvFile(this.getData(), filename)
        }

        /**
         * Clear the sorters
         */
        this.shadowRoot.querySelector("#clear-sorters").onclick = () => {
            this.clearSorters()
        }

        this.filterPanel = this.shadowRoot.getElementById('filter-panel');
        this.filterBtn = this.shadowRoot.getElementById('filter-btn');
        this.filter = this.shadowRoot.querySelector('globular-table-filter');

        // give the focus to the input.
        this.filterBtn.onclick = () => {
            this.filterPanel.toggle();
        }


        if (this.hasAttribute("width")) {
            setResizeable(this.tableContainer, (width, height) => {
                this.width = width + "px"
                this.table.style.width = this.width

                // set the height of the fake scroll and the table body
                this.visibleDataCount = Math.floor(height / this.rowHeight) - 1

                // so here i will set the size from the local storage.
                if (this.hasAttribute("id")) {
                    let id = this.getAttribute("id")
                    localStorage.setItem(id + "_width", this.width)
                    localStorage.setItem(id + "_visible_data_count", this.visibleDataCount)
                }

                this.resize()
            })
        }


        this.tableBody = this.shadowRoot.getElementById('table-body');
        this.tableHeader = this.shadowRoot.getElementById('table-header');

        // Those will be used to determine when to load the next batch of data
        this.fakeScrool = this.shadowRoot.getElementById('fake-scroll');
        this.fakeScroolDiv = this.shadowRoot.getElementById('fake-scroll-div');

        this.fakeScrool.onscroll = (evt) => {
            var scrollPosition = evt.target.scrollTop;

            // Calculate the index of the first visible row based on the scroll position
            var firstVisibleRowIndex = Math.floor(scrollPosition / this.rowHeight);

            // Update the table with the new data
            if (firstVisibleRowIndex + this.visibleDataCount > this.getTotalDataCount()) {
                this.loadDataInRange(firstVisibleRowIndex, this.getTotalDataCount() - 1);
            } else {
                this.loadDataInRange(firstVisibleRowIndex, firstVisibleRowIndex + this.visibleDataCount);
            }
        };

        // transform the mouse wheel event into a scroll event.
        this.tableBody.onmousewheel = (event) => {
            // Cross-browser compatibility for scroll delta
            const scrollDelta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

            // Adjust the scroll position of the target div
            this.fakeScrool.scrollTop += scrollDelta * 30; // You can adjust the scrolling speed here

            // Prevent the default scroll behavior of the source div
            event.preventDefault();
        };

        this.visibleDataCount = 20; // Number of rows visible at a time
        if (this.hasAttribute("visible-data-count")) {
            this.visibleDataCount = parseInt(this.getAttribute("visible-data-count"))
        }

        // set the data if it is already defined.
        if (this._data.length > 0) {
            this.setData(this._data)
        }
    }

    getTitle() {
        let slot = this.shadowRoot.querySelector('slot[name="title"]');
        let nodes = slot.assignedNodes();
        if (nodes.length > 0) {
            return nodes[0].textContent
        } else {
            return ""
        }
    }

    resize() {

        if (this.hasAttribute("id")) {
            let id = this.getAttribute("id")
            let width = localStorage.getItem(id + "_width")
            if (width !== null) {
                this.width = width
                this.table.style.width = this.width
            }
            let visibleDataCount = localStorage.getItem(id + "_visible_data_count")
            if (visibleDataCount !== null) {
                this.visibleDataCount = parseInt(visibleDataCount)
            }
        }

        let visibleDataCount = this.visibleDataCount
        if (this.getTotalDataCount() < visibleDataCount) {
            visibleDataCount = this.getTotalDataCount()
        }

        this.loadDataInRange(this.currentIndex, this.currentIndex + this.visibleDataCount)
        this.fakeScroolDiv.style.height = `${(this.getTotalDataCount() + 1) * this.rowHeight}px`

        // I will get the number of actual rows.
        let rows = this.tableBody.querySelectorAll("tr")
        if (rows.length >= this.visibleDataCount) {
            this.tableContainer.style.height = `${(this.visibleDataCount + 1) * this.rowHeight}px`;
        }

    }

    getTotalDataCount() {
        return this.getData().length
    }

    loadRow(index) {
        let newRow = document.createElement('tr')
        newRow.setAttribute("index", index)
        let data = this.getData()[index]
        if (!data) {
            console.log("fail to read data at index " + index)
            return
        }

        // now i will get the list of fields from the header.
        let headers = this.tableHeader.querySelectorAll("th")

        for (var i = 0; i < headers.length; i++) {
            let property = headers[i].field
            let cell = document.createElement('td')
            if (data[property] != undefined) {
                let value = data[property]
                if (typeof value === 'object') {
                    if (value instanceof Date) {
                        if (headers[i].firstChild.hasAttribute("format")) {
                            let format = headers[i].firstChild.getAttribute("format")
                            value = formatDateTimeCustom(value, format)
                        } else {
                            value = value.toLocaleString()
                        }
                    } else {
                        value = JSON.stringify(value)
                    }
                }
                if (property == "_index") {
                    value = data[property] + 1
                }
                cell.innerHTML = value

            } else {
                const functionName = property;
                const functionToCall = window[functionName]; // If the function is in the global scope
                if (typeof functionToCall === 'function') {
                    const person = data;
                    data[property] = functionToCall(person);
                    cell.innerHTML = data[property].toString()
                } else {
                    console.error(`${functionName} is not a valid function.`);
                }
            }
            newRow.appendChild(cell)
            
            cell.addEventListener('click', (event) => {
                let data = this.getData()[index]
                this.dispatchEvent(new CustomEvent('row-click', { detail: data }));
            })
        }
        this.tableBody.appendChild(newRow);
    }

    initHeader(data) {
        this.tableHeader.innerHTML = ""
        let id = ""

        // set the id of the table
        if (!this.hasAttribute("id")) {
            for (var property in data) {
                id += property + " "
            }
            id = "_" + getUuidByString(id)
            this.setAttribute("id", id)
        } else {
            id = this.getAttribute("id")
        }

        // the index column.
        if (this.displayIndex) {
            let cell = document.createElement('th')
            cell.innerHTML = "<span>#</span>"
            cell.field = "_index"
            this.tableHeader.appendChild(cell)
            cell.setAttribute("id", id + "_index")
            if (localStorage.getItem(id + "_index_width")) {
                cell.style.width = localStorage.getItem(id + "_index_width")
            }

            let sorter = new TableSorter(this, "_index")
            cell.appendChild(sorter)
        }

        // Now add the other columns.     
        let fields = []
        // Select the slot and retrieve its assigned nodes (child elements)
        const fieldsSlot = this.shadowRoot.querySelector('slot[name="fields"]');

        // Filter out the actual elements from the assigned nodes
        const fields_ = Array.from(fieldsSlot.assignedNodes()).filter(node => node instanceof Element);

        if ((fields_.length == 0)) {
            for (var property in data) {
                let span = document.createElement('span')
                span.setAttribute("field", property)
                span.innerHTML = property
                fields.push(span)
            }
        } else {
            if (fields_.length > 0) {
                for (var i = 0; i < fields_.length; i++) {
                    let field = fields_[i].getAttribute("field")
                    if (data[field]) {
                        fields.push(deepCloneSpan(fields_[i]))
                    } else if (window[field]) {
                        if (this._data.filter(d => d._visible == false).length == 0)
                            fields.push(deepCloneSpan(fields_[i]))
                    }
                }
            }
        }

        // Now add the other columns.
        for (var i = 0; i < fields.length; i++) {
            let property = fields[i].getAttribute("field")
            let cell = document.createElement('th')

            cell.setAttribute("id", id + "_" + property)
            cell.field = property

            cell.appendChild(fields[i])
            this.tableHeader.appendChild(cell)
            if (localStorage.getItem(id + "_" + property + "_width")) {
                cell.style.width = localStorage.getItem(id + "_" + property + "_width")
            }

            let sorter = new TableSorter(this, property)
            cell.appendChild(sorter)
        }

        // Add the resize handles
        let isResizing = false;
        let startX, startWidth, header;
        const headers = this.tableHeader.querySelectorAll('th');

        // set the row height from actual table header.
        if (this.hasAttribute("row-height")) {
            this.rowHeight = parseInt(this.getAttribute("row-height"))
        } else {
            this.rowHeight = this.tableHeader.offsetHeight
        }

        this.tableHeader.style.height = this.rowHeight + "px"

        headers.forEach((th) => {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            th.appendChild(resizeHandle);
            th.onmousedown = (event) => {
                const threshold = 5; // Adjust this value as needed
                const distanceFromRight = th.getBoundingClientRect().right - event.clientX;
                if (distanceFromRight <= threshold) {
                    header = th;
                    startX = event.clientX;
                    startWidth = th.clientWidth;
                    isResizing = true;
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                    this.style.cursor = 'col-resize';
                }
            };
        });

        const handleMouseMove = (event) => {
            if (!isResizing) return;
            const width = startWidth + (event.clientX - startX);
            header.style.width = width + 'px';

            // so here will set the width in the local storage.
            if (header.hasAttribute("id")) {
                let id = header.getAttribute("id")
                localStorage.setItem(id + "_width", width + "px")
            }
        };

        const handleMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            this.style.cursor = 'default';
        };

        this.resize()

    }

    loadDataInRange(firstVisibleRowIndex, lastVisibleRowIndex) {
        this.currentIndex = firstVisibleRowIndex;

        if (this.tableHeader.querySelectorAll("th").length == 0) {
            // init the header.
            this.initHeader(this.getData()[0])

            // get the last visible row index from the local storage.
            let id = this.getAttribute("id")
            if (localStorage.getItem(id + "_visible_data_count")) {
                lastVisibleRowIndex = parseInt(localStorage.getItem(id + "_visible_data_count"))
            }
        }

        // Check if the data is already loaded for the visible rows
        this.tableBody.innerHTML = ""
        lastVisibleRowIndex = Math.min(lastVisibleRowIndex, this.getData().length);
        for (var i = firstVisibleRowIndex; i <= lastVisibleRowIndex - 1; i++) {
            this.loadRow(i);
        }
    }

    getData() {
        let data = this._data.filter(d => d._visible)

        return data
    }

    setFiltredData(data) {
        if (data == null) {
            this._data.forEach(d => {
                d._visible = true
            })
            this.initHeader(this._data[0])
            this.shadowRoot.querySelector("#filter-btn").style.color = ""
        } else if (data.length == 0) {
            this._data.forEach(d => {
                d._visible = false
            })
            this.initHeader(this._data[0])
            this.shadowRoot.querySelector("#filter-btn").style.color = ""
        } else {

            this._data.forEach(d => {
                d._visible = false
            })

            data.forEach(d => {
                this._data[d._index]._visible = true
            })
            this.initHeader(data[0])
            this.shadowRoot.querySelector("#filter-btn").style.color = "var(--on-primary-color)"
        }

        this.tableBody.innerHTML = ""
        this.currentIndex = 0

        this.loadDataInRange(this.currentIndex, this.visibleDataCount)
        this.resize()
    }

    setData(data) {

        this._data = data

        if (data.length > 0) {
            this.initHeader(this._data[0])
        }

        this._data.forEach((d, index) => {
            d._index = index
            d._visible = true

            // so here i must initialyze computed fields.
            let headers = this.tableHeader.querySelectorAll("th")
            for (var i = 0; i < headers.length; i++) {
                let property = headers[i].field
                if (window[property]) {
                    d[property] = window[property](d)
                }
            }
        })

        this.filter.setTable(this, data[0])

        this.tableBody.innerHTML = ""
        this.currentIndex = 0
        this.loadDataInRange(this.currentIndex, this.visibleDataCount)
        this.resize()
        this.filter.update()
    }

    clearSorters() {
        let sorters = Array.from(this.tableHeader.querySelectorAll("globular-table-sorter"))
        sorters.forEach(s => {
            s.setIndex(-1)
        })
        this._data = orderBy(this._data, ["_index"], ["asc"])
        this.resize()
    }

    // Now i will sort the table.
    sort(order, field) {

        // Here i will list of active filters...
        let sorters = Array.from(this.tableHeader.querySelectorAll("globular-table-sorter")).filter(item => item.sortIndex != -1);
        let sorter = this.shadowRoot.querySelector("#_" + getUuidByString(field))

        if (order != "") {
            // here i will test if the sorter is already in the list.
            let index = sorters.findIndex(s => s.id == sorter.id)
            if (index == -1) {
                sorters.push(sorter)
            }
            sorter.setIndex(sorters.length - 1)
        } else {
            if (sorters.length == 0) {
                this._data = orderBy(this._data, ["_index"], ["asc"])
                this.resize()
                return
            }
        }

        sorters.sort((a, b) => {
            return a.sortIndex - b.sortIndex
        })

        // set the index.
        sorters.forEach((s, index) => {
            s.setIndex(index)
        })

        // Now i will sort the table.
        this._data = orderBy(this._data, sorters.map(s => s.field), sorters.map(s => s.sortOrder))
        this.resize()

    }
}

customElements.define('globular-table', Table)