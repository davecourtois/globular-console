import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import "@polymer/iron-icons/av-icons";

export class Countdown extends HTMLElement {
    constructor(delay, diameter, stroke) {
        super();

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        // Set default values...
        this.countdown = 10;
        if (this.hasAttribute("countdown")) {
            this.countdown = parseInt(this.getAttribute("countdown"))
        }

        if (delay != undefined) {
            this.countdown = delay;
        }

        this.diameter = 40;
        if (this.hasAttribute("diameter")) {
            this.diameter = parseInt(this.getAttribute("diameter"))
        }
        if (diameter != undefined) {
            this.diameter = diameter
        }

        this.stroke = 3;
        if (this.hasAttribute("stroke")) {
            this.stroke = parseInt(this.getAttribute("stroke"))
        }

        if (stroke != undefined) {
            this.stroke = stroke
        }

        this.color = "var(--secondary-color)"
        if (this.hasAttribute("color")) {
            this.stroke = parseInt(this.getAttribute("color"))
        }

        // Connect to event.
        this.shadowRoot.innerHTML = `
       <style>
       @import url('./styles.css');

          #countdown {
             position: relative;
             margin: auto;
             height:  ${this.diameter}px;
             width: ${this.diameter}px;
             text-align: center;
           }
           
           #countdown-number {
             color: ${this.color};
             display: inline-block;
             line-height: ${this.diameter}px;
           }
 
           svg {
             position: absolute;
             top: 0;
             right: 0;
             width: ${this.diameter}px;
             height: ${this.diameter}px;
             transform: rotateY(-180deg) rotateZ(-90deg);
           }
           
           svg circle {
             stroke-dasharray: 113px;
             stroke-dashoffset: 0px;
             stroke-linecap: round;
             stroke-width: ${this.stroke}px;
             stroke: ${this.color};
             fill: none;
             animation: countdown ${this.countdown}s linear infinite forwards;
           }
           
           @keyframes countdown {
             from {
               stroke-dashoffset: 0px;
             }
             to {
               stroke-dashoffset: 113px;
             }
           }
       </style>
 
       <div id="countdown">
         <div id="countdown-number"></div>
         <svg>
             <circle id="circle" r="${(this.diameter - this.stroke) / 2}" cx="${this.diameter / 2}" cy="${this.diameter / 2}"></circle>
         </svg>
       </div>
       `;

        this.div = this.shadowRoot.querySelector("#countdown")
        this.interval = null;

        // listener's
        this.oncountdone = null;
        this.container = null;
    }

    connectedCallback() {

    }

    start() {
        this.div.style.display = ""
        var countdownNumberEl = this.shadowRoot.getElementById('countdown-number');
        let countdown = this.countdown;
        countdownNumberEl.innerHTML = countdown;
        if (this.interval != null) {
            clearInterval(this.interval);
        }
        this.interval = setInterval(() => {
            countdown--
            if (countdown == 0) {
                countdownNumberEl.textContent = "";
                this.stop();
                if (this.oncountdone != undefined) {
                    this.oncountdone();
                }

            } else {
                countdownNumberEl.textContent = countdown + ""
            }
        }, 1000);
    }

    setColor(color) {
        var countdownNumberEl = this.shadowRoot.getElementById('countdown-number');
        countdownNumberEl.style.color = color;
        var circle = this.shadowRoot.getElementById('circle');
        circle.style.stroke = color;
    }

    stop() {
        clearInterval(this.interval);
        this.div.style.display = "none"
    }

    setCountdown(countdown) {
        this.countdown = countdown;
    }

}

customElements.define("globular-count-down", Countdown);


export class SlideShow extends HTMLElement {

    constructor(delay) {
        super()

        // Set the default delay values...
        if (delay == undefined) {
            delay = 15
        }

        this.attachShadow({ mode: 'open' });
        this.interval = null;
        this.isRunning = false;
        this.countdown = null;
        this.startBtn = null;
        this.lastActiveSlide = null;

        // default is fiteen seconds.
        this.delay = 1000 * delay // transform it in milisecond.
        if (this.hasAttribute("delay")) {
            this.delay = parseInt(this.getAttribute("delay")) * 1000
        }
    }

    connectedCallback() {
        // get the delay from the attribute.
        if (this.hasAttribute("delay")) {
            this.delay = parseInt(this.getAttribute("delay")) * 1000
        } else {
            this.delay = 15000
        }

        if (this.hasAttribute("slide-container-height")) {
            this.slideContainerHeight = parseInt(this.getAttribute("slide-container-height"))
        } else {
            this.slideContainerHeight = 1920
        }

        if (this.hasAttribute("slide-width")) {
            this.slideWidth = parseInt(this.getAttribute("slide-width"))
        } else {
            this.slideWidth = 1080
        }

        if (this.hasAttribute("footer-height")) {
            this.footerHeight = parseInt(this.getAttribute("footer-height"))
        } else {
            this.footerHeight = 40
        }


        // Set the shadow dom.
        this.shadowRoot.innerHTML = `
        <style>
       
            @import url('./styles.css');


            :host {
                --slidewidth: ${this.slideWidth}px;
                --footerHeight: ${this.footerHeight}px;
                --slideContainerHeight: ${this.slideContainerHeight}px; 
                --slideHeight: calc(var(--slideContainerHeight) - var(--footerHeight));
                --inScreen: 0px;
                --offScreen: -1080px;
                --offScreenRight: var(--slidewidth);
            }

            .slides-container {
                position: relative;
                width: var(--slidewidth);
                height: var(--slideContainerHeight);
                overflow: hidden;
                margin: 0 auto;
            }
            
            footer {
                display: flex;
                justify-content: center;
                align-items: center;
                position: absolute;
                bottom: 20px;
                left: 0;
                width: 100%;
                height: var(--footerHeight);
                z-index: 99;
            }
            
            footer > span {
                position: relative;
                border-radius: 2rem;
                border: solid white;
                border-width: 3px;
                margin: 0 1rem;
            }
            
            #container{
                display: flex;
                flex-direction: column;
            }

            #countdown{
                position: absolute;
                top: 1px;
                left: 1px;
            }

            .marker{
                display: flex;
                justify-content: center;
                align-items: center;
                margin-right: 20px;
                min-width: ${ this.footerHeight}px;
                min-height: ${ this.footerHeight}px;
                border-radius: 50%;
                background-color: var(--secondary-color);
            }

            .marker:hover {
                cursor: pointer;
            }

            #start-btn{
                display: none;
                position: absolute;
                color: var(--on-secondary-color);
                --paper-icon-button-ink-color: var(--secondary-color);
            }

            #slides{
                position: relative;
            }
       
            paper-card{
                background-color: var(--surface-color);
                color: var(--on-surface-color);
            }
            
        </style>
        <paper-icon-button id="start-btn" icon="av:play-circle-filled"></paper-icon-button>
        <paper-card id="container" class="container slides-container">
            <div id="slides" >
                <slot></slot>
            </div>
            <footer id="footer">
            </footer>
        </paper-card>
        `
        // Here I will add each slides in order to create theire marker...
        for (var i = 0; i < this.childNodes.length; i++) {
            let slide = this.childNodes[i]
            slide.setAttribute("slide-height", this.slideContainerHeight - this.footerHeight)
            slide.setAttribute("slide-width", this.slideWidth)
            // That will create the slide marker
            this.createMarker(slide.id, i)
        }


        this.startBtn = this.shadowRoot.getElementById("start-btn")
        this.startBtn.parentNode.removeChild(this.startBtn)

        // equivalent to <globular-count-down id="countdown" countdown="${this.delay / 1000}" diameter="38" stroke="3" ></globular-count-down>
        this.countdown = new Countdown(this.delay / 1000, this.footerHeight - 2, 3)
        this.countdown.id = "countdown"
        this.countdown.oncountdone = () => {
            if (this.isRunning) {
                this.rotateSlide();
                this.start()
                // fire slide change event.
                let evt = new CustomEvent("slide-changed", {
                    detail: {
                        "slide": this.lastActiveSlide
                    }
                })
                this.dispatchEvent(evt)
            }
        }

        // display the play butto
        this.shadowRoot.querySelectorAll(".marker")[0].click()

        this.startBtn.onclick = (evt) => {
            evt.stopPropagation();
            this.startBtn.style.display = "none"
            this.startBtn.parentNode.removeChild(this.startBtn)
            this.start()
        }

        if (this.hasAttribute("backgroundColor")) {
            this.shadowRoot.getElementById("start-btn").getElementById("container").style.backgroundColor = this.getAttribute("backgroundColor")
        }
    }

    setDelay(delay) {
        this.delay = delay * 1000

        // The countdown must be recreate...
        let parentNode = this.countdown.parentNode;
        if (parentNode != null) {
            parentNode.removeChild(this.countdown)
        }
        this.countdown.stop();
        this.countdown = new Countdown(this.delay / 1000, 38, 3)
        this.countdown.id = "countdown"
        this.countdown.oncountdone = () => {
            if (this.isRunning) {
                this.rotateSlide();
                this.start()
            }
        }

        if (parentNode != null) {
            console.log(361)
            parentNode.appendChild(this.countdown)
            this.countdown.start()
        }

    }

    /**
     * Append a slide into the slideshow.
     * @param {*} html 
     */
    appendSlideFromHtml(html, index) {

        // Here I will create the slide.
        let range = document.createRange()
        let slide = range.createContextualFragment(html)
        let id = slide.children[0].id

        // In the case of existing slide I will only set 
        // the slide itself.
        if (this.querySelector("#" + id) != undefined) {
            let toDelete = this.querySelector("#" + id)
            this.replaceChild(slide, toDelete)
        } else {
            this.appendChild(slide)
        }

        // Create the marker.
        this.createMarker(id, index)

        // Set the slide order...
        this.orderSlides();
    }

    createMarker(id, index) {
        // if the marker already exist I will do nothing.
        if (this.shadowRoot.getElementById(id) != undefined) {
            return
        }

        let marker = document.createElement("div");
        let ripple = document.createElement("paper-ripple");
        marker.style.position = "relative"
        marker.className = "marker"
        ripple.classList.add("circle")
        ripple.setAttribute("recenters", "")
        marker.appendChild(ripple)
        marker.classList.add("marker")
        marker.id = id
        marker.index = index
        
        let label = document.createElement("span")
        label.className = "marker-label"
        label.innerHTML = index + 1
        marker.appendChild(label)

        marker.style.borderColor = this.lastChild.marker
        this.shadowRoot.getElementById("footer").appendChild(marker)

        marker.onclick = () => {
            this.stop();

            let markers = this.shadowRoot.querySelectorAll(".marker")
            for (var i = 0; i < markers.length; i++) {
                markers[i].style.backgroundColor = "";
                markers[i].querySelector(".marker-label").style.display = "block"
            }

            label.style.display = "none"

            // Here I will rotate the slide.
            while (this.childNodes[1].id != id) {
                let firstChild = this.firstChild
                this.removeChild(firstChild)
                this.appendChild(firstChild)
            }

            let marker = this.shadowRoot.getElementById(id)
            marker.style.backgroundColor = marker.style.borderColor

            // Here I will append the start button into the marker.
            marker.appendChild(this.startBtn)

            this.orderSlides();
        }
    }

    // set slice position
    orderSlides() {
        let slides = this.getSlides();
        for (var i = 0; i < slides.length; i++) {
            let s = slides[i]
            s.style.left = (i - 1) * s.offsetWidth + "px"
            let marker = this.shadowRoot.getElementById(s.id)
   
            if (i == 1) {
                this.countdown.setColor(marker.style.borderColor);
                marker.appendChild(this.countdown)
            }
        }

    }

    getSlides() {
        return this.children; // empty array
    }


    // Rotate the slide to one position
    rotateSlide() {
        if (this.children.length == 0) {
            return
        }

        this.orderSlides();

        // rotate the slides.
        let w = this.firstElementChild.offsetWidth;
        this.shadowRoot.getElementById("slides").style.transition = "all 1s ease-out"
        this.shadowRoot.getElementById("slides").style.transform = `translateX(${-1 * w}px)`
           
        let markers = this.shadowRoot.querySelectorAll(".marker")
        for (var i = 0; i < markers.length; i++) {
            markers[i].style.backgroundColor = "var(--secondary-color)";
            markers[i].querySelector(".marker-label").style.display = "block"
        }

        // Wait the time of animation delay and set back the div at it start position.
        setTimeout(() => {

            if (this.children.length == 0) {
                return
            }

            this.countdown.style.display = "none";
            this.shadowRoot.getElementById("slides").style.transition = 'none';
            this.shadowRoot.getElementById("slides").style.transform = `none`;
            let firstChild = this.firstElementChild
            this.removeChild(firstChild)
            this.appendChild(firstChild)
            this.orderSlides();

            this.countdown.parentNode.querySelector(".marker-label").style.display = "none"
            this.countdown.parentNode.style.backgroundColor = "var(--surface-color)"

            this.countdown.start();
            this.countdown.style.display = "block";
        }, 1000)

    }

    /**
     * Start the slide show
     */
    start() {
        if (!this.isRunning) {
            if (this.startBtn.parentNode != undefined) {
                return;
            }

            this.countdown.style.display = "block"
            this.isRunning = true;
            if (this.countdown.parentNode == undefined && this.lastActiveSlide != undefined) {
                this.lastActiveSlide.appendChild(this.countdown);
            }

            this.countdown.parentNode.querySelector(".marker-label").style.display = "none"
            this.countdown.parentNode.style.backgroundColor = "var(--surface-color)"

            this.countdown.start();
        }
    }

    /**
     * Stop the slideshow
     */
    stop() {

        // Stop the running loop.
        this.countdown.stop()
        this.countdown.style.display = "none"
        if (this.countdown.parentNode != undefined) {
            this.lastActiveSlide = this.countdown.parentNode;
            this.countdown.parentNode.removeChild(this.countdown);
        }

        this.isRunning = false
        this.startBtn.style.display = "block";
    }


}

customElements.define('globular-slide-show', SlideShow);


/**
 * Accept contact button.
 */
export class Slide extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.marker = "";
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
       
        :host {
            --offWhite: white;
            --slidewidth: 1080px;
            --footerHeight: 40px;
            --slideContainerHeight: 1970px; 
            --slideHeight: var(--slideContainerHeight);
            --offScreen: -1080px;
            --offScreenRight: var(--slidewidth);
        }
           
        </style>

        <slot></slot>
        `

        if(this.hasAttribute("slide-height")) {
            this.style.setProperty("--slideHeight", this.getAttribute("slide-height") + "px")
        }

        if(this.hasAttribute("slide-width")) {
            this.style.setProperty("--slidewidth", this.getAttribute("slide-width") + "px")
            this.style.setProperty("--offScreenRight", this.getAttribute("slide-width") + "px")
            this.style.setProperty("--offScreen", "-" + this.getAttribute("slide-width") + "px")
        }

        this.style.position = "absolute";
        this.style.backgroundColor = "var(--offWhite)";
        this.style.boxSizing = "border-box";
        this.style.zIndex = "0"
        this.style.width = "var(--slidewidth)"
        this.style.height = "var(--slideHeight)"
        this.marker = this.getAttribute("marker")
    }
}

customElements.define('globular-slide', Slide)