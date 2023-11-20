import { v4 as uuidv4 } from "uuid";

export class Carousel extends HTMLElement {

  constructor(itemsWidth = "150px", itemsHeight = "150px", editable = false) {
    super()
    // Set the shadow dom.
    this.attachShadow({ mode: 'open' });

    this.itemsHeight = itemsHeight;
    this.itemsWidth = itemsWidth;
    this.editable = editable;

  }

  connectedCallback() {

    if (this.hasAttribute("items-height")) {
      this.itemsHeight = this.getAttribute("items-height");
    } else {
      this.setAttribute("items-height", "var(--carousel-item-height, 200px)");
    }

    if (this.hasAttribute("items-width")) {
      this.itemsWidth = this.getAttribute("items-width");
    } else {
      this.setAttribute("items-width", "var(--carousel-item-width, 200px)");
    }

    // Innitialisation of the layout.
    this.shadowRoot.innerHTML = `
        <style>
        @import url('./styles.css');

        /* page styles */
        .ax-hidden {
          visibility: hidden;
          position: absolute;
        }
        
        /* carousel styles */
        .carousel {
          --carousel-height: 400px;
          --carousel-width: 1000px;
          --carousel-item-height: ${this.itemsHeight};
          --carousel-item-width: ${this.itemsWidth};
          width: 100%;
        }
        
        .carousel-container {
          align-items: center;
          display: flex;
          min-height: var(--carousel-height);
          margin: 0 auto;
          max-width: var(--carousel-width);
          position: relative;
          background: radial-gradient(circle, rgb(170 170 170 / 0%) 0%, rgb(66 66 66 / 0%) 44%, var(--palette-background-default) 100%);
        }
        
        .carousel-item {
          position: relative;
          overflow: hidden;
          height: var(--carousel-item-height);
          width: var(--carousel-item-width);
          opacity: 0;
          position: absolute;
          transform: translateX(-50%);
          transition: all 0.3s ease-in-out;
          z-index: 0;
          background-color: var(--palette-background-paper);
          color: var(--palette-text-primary);
        }

        .carousel-item img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover; /* Maintain aspect ratio and cover container */
        }
        
        .carousel-item-1 {
          left: 15%;
          opacity: 0.4;
        }
        
        .carousel-item-2,
        .carousel-item-4 {
          height: calc(var(--carousel-item-height) * 1.5);
          opacity: 1;
          width: calc(var(--carousel-item-width) * 1.5);
          z-index: 1;
        }
        
        .carousel-item-2 {
          left: 30%;
        }
        
        .carousel-item-3 {
          box-shadow: 0px 6px 14px -1px rgba(0,0,0,0.75);
          -webkit-box-shadow: 0px 6px 14px -1px rgba(0,0,0,0.75);
          -moz-box-shadow: 0px 6px 14px -1px rgba(0,0,0,0.75);
          height: calc(var(--carousel-item-height) * 2);
          opacity: 1;
          left: 50%;
          width: calc(var(--carousel-item-width) * 2);
          z-index: 2;
        }
        
        .carousel-item-4 {
          left: 70%;
        }
        
        .carousel-item-5 {
          left: 85%;
          opacity: 0.4;
        }
        
        .carousel-controls {
          display: flex;
          justify-content: center;
          margin: 30px 0;
        }
        
        /* carousel button styles */
        .carousel-control {  
          background-color: transparent;
          border: 2px solid;
          border-radius: 4px;
          color: #aaa;
          cursor: pointer;
          height: 22px;
          margin: 0 20px;
          position: relative;
          transform: scale(1.5);
          transition: transform 0.5s ease-out;
          width: 22px;
        }
        
        .carousel-control:hover {
          transform: scale(1.3);
        }
        
        /* previous button */
        .carousel-control-previous::after,
        .carousel-control-previous::before {
          box-sizing: border-box; 
          content: '';
          display: block;
          height: 8px;
          position: absolute;
          top: 5px
        }
        .carousel-control-previous::before {
          background: currentColor;
          border-radius: 2px;
          right: 11px;
          width: 2px;
        }
        .carousel-control-previous::after {
          border-bottom: 4px solid transparent;
          border-right: 5px solid;
          border-top: 4px solid transparent;
          right: 5px;
          width: 0;
        }
        
        /* next button */
        .carousel-control-next::after,
        .carousel-control-next::before {
          box-sizing: border-box;
          content: "";
          display: block;
          height: 8px;
          position: absolute;
          top: 5px
        }
        .carousel-control-next::before {
          background: currentColor;
          border-radius: 2px;
          left: 11px;
          width: 2px;
        }
        .carousel-control-next::after {
          border-bottom: 4px solid transparent;
          border-left: 5px solid;
          border-top: 4px solid transparent;
          left: 5px;
          width: 0;
        }
        
        /* play button */
        .carousel-control-play::before {
          border-bottom: 5px solid transparent;
          border-left: 6px solid;
          border-top: 5px solid transparent;
          box-sizing: border-box;
          content: "";
          display: block;
          height: 10px;
          position: absolute;
          left: 7px;
          top: 4px;
          width: 0;
        }
        
        /* pause button */
        .carousel-control-play.playing::before {
          border-bottom: 0;
          border-left: 2px solid;
          border-right: 2px solid;
          border-top: 0;
          box-sizing: border-box;
          content: "";
          display: block;
          height: 6px;
          position: absolute;
          left: 6px;
          top: 6px; 
          width: 6px;
        }
        
        /* add button */
        .carousel-control-add::after,
        .carousel-control-add::before {
          background: currentColor;
          border-radius: 5px;
          box-sizing: border-box;
          content: "";
          display: block;
          height: 2px;
          position: absolute;
          left: 4px;
          top: 8px;
          width: 10px;
        }
        .carousel-control-add::after {
          height: 10px;
          left: 8px;
          top: 4px;
          width: 2px;
        }
        .carousel-position {
          font-size: 1.4rem;
          font-weight: 600;
          color: #aaa;
        }
        </style>
        <div id="container" class="carousel">
            <div class="carousel-container">
              
            </div>
            <div style="display:flex; flex-direction: column; align-items: center;  justify-content: center;">
              <div class="carousel-controls">
              </div>
              <div class="carousel-position">
                <span class="carousel-index"></span>/<span class="carousel-total"></span>
              </div>
            </div>
        </div>

        <slot style="display: none;"></slot>
        `

    this.el = this.shadowRoot.querySelector("#container");

    this.carouselIndex = this.shadowRoot.querySelector(".carousel-index")
    this.carouselTotal = this.shadowRoot.querySelector(".carousel-total")

    // Here I will not display the add option...
    this.carouselOptions = ['previous', /*'add',*/ 'play', 'next'];
    this.carouselData = [];

    // The number of card visible.
    this.carouselContainer = this.shadowRoot.querySelector(".carousel-container");
    this.carouselPlayState;

    // Set editable
    this.editable = false;
    if (this.hasAttribute("editable")) {
      if (this.getAttribute("editable") == "true") {
        this.setEditable(true);
      }
    }

    this.carouselData = Array.from(this.children)
    this.carouselTotal.innerHTML = this.carouselData.length

    let inView = 5;
    this.carouselInView = [];

    if (this.getAttribute("in-view")) {
      inView = parseInt(this.getAttribute("in-view"));
    }

    // populate the carousel IN index's
    for (var i = 0; i < inView; i++) {
      this.carouselInView.push(i + 1);
    }

    this.setupCarousel();
  }


  setEditable(editable) {
    this.editable = editable;

    // Set editable on all children
    for (var i = 0; i < this.carouselData.length; i++) {
      this.carouselData[i].setAttribute("editable", editable)
    }

  }

  // Build carousel html
  setupCarousel() {

    // Create the container 
    const container = this.shadowRoot.querySelector(".carousel-container");
    this.carouselContainer.innerHTML = ""

    // Create the control div.
    const controls = this.shadowRoot.querySelector(".carousel-controls");
    controls.innerHTML = ""


    // Take dataset array and append items to container
    this.carouselData.forEach((data, index) => {
      data.index = index
      data.uuid = uuidv4()

      data.setAttribute("editable", this.editable)

      // Add item event listeners
      data.onclose = () => {
        this.removeItem(index, data)
      }

      if (index < 5) {
        const carouselItem = document.createElement('div');
        container.append(carouselItem);

        // Add item attributes
        carouselItem.className = `carousel-item carousel-item-${index + 1}`;
        carouselItem.appendChild(data)
        carouselItem.setAttribute('loading', 'lazy');

        // Used to keep track of carousel items, infinite items possible in carousel however min 5 items required
        carouselItem.setAttribute('data-index', `${index + 1}`);

        // Set height of container to height of tallest carousel item
        if (carouselItem.offsetHeight > container.offsetHeight) {
          container.style.height = carouselItem.offsetHeight + "px"
        }

        if (this.editable) {
          this.setDeleteButton(carouselItem, data)
        }

      }
    });

    this.carouselIndex.innerHTML = this.carouselData[0].index + 1

    this.carouselOptions.forEach((option) => {
      const btn = document.createElement('button');
      const axSpan = document.createElement('span');

      // Add accessibilty spans to button
      axSpan.innerText = option;
      axSpan.className = 'ax-hidden';
      btn.append(axSpan);

      // Add button attributes
      btn.className = `carousel-control carousel-control-${option}`;
      btn.setAttribute('data-name', option);

      // Add carousel control options
      controls.append(btn);
    });



    // After rendering carousel to our DOM, setup carousel controls' event listeners
    this.setControls([...controls.children]);

    // Set container property
    this.carouselContainer = container;
  }

  // Set carousel controls' event listeners
  setDeleteButton(parentNode, data) {

    //carouselItem.style.position = "relative"
    const closeBtn = document.createElement("iron-icon")
    closeBtn.icon = "icons:close"
    closeBtn.style.position = "absolute"
    closeBtn.style.top = "10px"
    closeBtn.style.left = "10px"
    closeBtn.style.zIndex = "100"
    closeBtn.style.color = "white"
    closeBtn.style.backgroundColor = "black"
    closeBtn.style.border = "none"
    closeBtn.style.borderRadius = "50%"
    closeBtn.style.width = "24px"
    closeBtn.style.height = "24px"
    closeBtn.style.cursor = "pointer"
    closeBtn.style.display = "none"
    closeBtn.onclick = () => {
      this.removeItem(data.index, data)
    }
    parentNode.appendChild(closeBtn)
    parentNode.onmouseover = () => {
      closeBtn.style.display = "block"
    }
    parentNode.onmouseout = () => {
      closeBtn.style.display = "none"
    }

  }

  setControls(controls) {
    controls.forEach(control => {
      control.onclick = (event) => {
        event.preventDefault();

        // Manage control actions, update our carousel data first then with a callback update our DOM
        this.controlManager(control.dataset.name);
      };
    });
  }

  controlManager(control) {
    if (control === 'previous') return this.previous();
    if (control === 'next') return this.next();
    if (control === 'add') return this.add();
    if (control === 'play') return this.play();
    return;
  }

  previous() {
    // Update order of items in data array to be shown in carousel
    this.carouselData.unshift(this.carouselData.pop());

    // Push the first item to the end of the array so that the previous item is front and center
    this.carouselInView.push(this.carouselInView.shift());

    this.carouselIndex.innerHTML = this.carouselData[0].index + 1

    // Update the css class for each carousel item in view
    this.carouselInView.forEach((item, index) => {
      this.carouselContainer.children[index].className = `carousel-item carousel-item-${item}`;
    });

    // Using the first 5 items in data array update content of carousel items in view
    this.carouselData.slice(0, 5).forEach((data, index) => {
      this.el.querySelector(`.carousel-item-${index + 1}`).innerHTML = ""
      this.el.querySelector(`.carousel-item-${index + 1}`).appendChild(data)
      if (this.editable) {
        this.setDeleteButton(this.el.querySelector(`.carousel-item-${index + 1}`), data)
      }
    });
  }

  next() {
    // Update order of items in data array to be shown in carousel
    this.carouselData.push(this.carouselData.shift());

    // Take the last item and add it to the beginning of the array so that the next item is front and center
    this.carouselInView.unshift(this.carouselInView.pop());

    // Update the css class for each carousel item in view
    this.carouselInView.forEach((item, index) => {
      this.carouselContainer.children[index].className = `carousel-item carousel-item-${item}`;
    });

    this.carouselIndex.innerHTML = this.carouselData[0].index + 1

    // Using the first 5 items in data array update content of carousel items in view
    this.carouselData.slice(0, 5).forEach((data, index) => {
      this.el.querySelector(`.carousel-item-${index + 1}`).innerHTML = ""
      this.el.querySelector(`.carousel-item-${index + 1}`).appendChild(data)
      if (this.editable) {
        this.setDeleteButton(this.el.querySelector(`.carousel-item-${index + 1}`), data)
      }

    });
  }

  // Set the carousel items.
  setItems(items) {
    items.forEach((item, index) => {
      item.index = index;
    })

    this.carouselData = items
    this.carouselTotal.innerHTML = items.length
    this.carouselIndex.innerHTML = this.carouselData[0].index + 1
  }


  // Add a new item
  add(newItem) {

    const lastItem = this.carouselData.length;
    newItem.index = lastIndex;

    const lastIndex = this.carouselData.findIndex(item => item.id == lastItem);

    // Then add it to the "last" item in our carouselData
    this.carouselData.splice(lastIndex + 1, 0, newItem);

    // set the total of items.
    this.carouselTotal.innerHTML = this.carouselData.length

    // Shift carousel to display new item
    this.next();
  }

  // remove index from the carousel...
  removeItem(index, data) {
    this.carouselData = this.carouselData.filter(e => e.uuid !== data.uuid)
    this.carouselTotal.innerHTML = this.carouselData.length
    this.next();

    // Create a custom event
    const event = new CustomEvent("on-item-remove", {
      detail: { "item": data, "index": index }, // You can attach additional data using the 'detail' property
    });

    // Dispatch the custom event
    item.dispatchEvent(event);
  }

  play() {
    const playBtn = this.el.querySelector('.carousel-control-play');
    const startPlaying = () => this.next();

    if (playBtn.classList.contains('playing')) {
      // Remove class to return to play button state/appearance
      playBtn.classList.remove('playing');

      // Remove setInterval
      clearInterval(this.carouselPlayState);
      this.carouselPlayState = null;
    } else {
      // Add class to change to pause button state/appearance
      playBtn.classList.add('playing');

      // First run initial next method
      this.next();

      // Use play state prop to store interval ID and run next method on a 1.5 second interval
      let interval = 1500 
      if(this.hasAttribute('interval')) {
        interval = parseInt(this.getAttribute('interval'))
      }

      this.carouselPlayState = setInterval(startPlaying, interval);
    };
  }

}

customElements.define('globular-carousel', Carousel)
