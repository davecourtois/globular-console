
import { Chart, registerables } from 'chart.js';
import { setResizeable } from "./resizeable";

Chart.register(...registerables);

class BaseChart extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.width = parseInt(this.getAttribute('width')) || 400;
        this.height = parseInt(this.getAttribute('height')) || 300;

        if (this.hasAttribute("id")) {
            let id = this.getAttribute("id")
            if (this.hasAttribute("width") && this.hasAttribute("height")) {
                let w = parseInt(localStorage.getItem(id + "_width"))
                if (!isNaN(w)) {
                    this.width = w
                }

                let h = parseInt(localStorage.getItem(id + "_height"))
                if (!isNaN(h)) {
                    this.height = h
                }
            }
        }


        if (this.hasAttribute('title-color')) {
            this.titleColor = this.getAttribute('title-color');
        } else {
            this.titleColor = 'black';
        }

        this.titleSize = 16;
        if (this.hasAttribute('title-size')) {
            this.titleSize = parseInt(this.getAttribute('title-size'));
        }

        if (this.hasAttribute('title-position')) {
            this.titlePosition = this.getAttribute('title-position');
        } else {
            this.titlePosition = 'top';
        }

        this.chartTitle = "";
        if (this.hasAttribute("chart-title")) {
            this.chartTitle = this.getAttribute("chart-title")
        }

        this.chartSubtitle = "";
        if (this.hasAttribute("chart-subtitle")) {
            this.chartSubtitle = this.getAttribute("chart-subtitle")
        }

        this.chartSubtitleSize = 12;
        if (this.hasAttribute("chart-subtitle-size")) {
            this.chartSubtitleSize = parseInt(this.getAttribute("chart-subtitle-size"))
        }

        // Additional setup for BaseChart-specific attributes
        this.chartContainer = document.createElement('div');
        this.chartContainer.style.width = this.width + 'px';
        this.chartContainer.style.height = this.height + 'px';
        this.chartContainer.style.position = 'relative';
        this.chartContainer.style.backgroundColor = 'var(--surface-color)';
        this.chartContainer.style.margin = '0px';
        this.chartContainer.style.padding = '0px';
        this.chartContainer.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)';
        this.chartContainer.style.border = '1px solid var(--divider-color)';
        this.chartContainer.style.borderRadius = '4px';

        if (this.hasAttribute('is-resizable')) {
            setResizeable(this.chartContainer, (width, height) => {
                // keep attributes up to date
                this.setAttribute('width', width);
                this.setAttribute('height', height);
                this.height = height;
                this.width = width;

                // set the height of the fake scroll and the table body
                this.visibleDataCount = Math.floor(height / this.rowHeight) - 1

                // so here i will set the size from the local storage.
                if (this.hasAttribute("id")) {
                    let id = this.getAttribute("id")
                    localStorage.setItem(id + "_width", this.width)
                    localStorage.setItem(id + "_height", this.height)
                }

                // Now i will resize the chart.
                this.resize();
            })
        }
    }

    setLabels(value) {
        this.labels = value;
    }

    setDatasets(value) {
        this.datasets = value;
    }

    render() {
    }

    resize() {
        /** must be implemented */
    }
}

/**
 * The chartjs web component is a simple wrapper around the chartjs library.
 * It is a simple web component that can be used to render charts.
 * With it you can display chart of type, bar, horizontalBar, line, pie, doughnut, radar, polarArea, bubble, scatter, area.
 */
class ChartJS extends BaseChart {

    constructor() {
        super();
        //this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {

        super.connectedCallback();

        this.type = this.getAttribute('type');
        if (this.type == null) {
            this.type = 'bar'; // default one is bar chart.
        }

        this.isHorizontal = false;
        this.isArea = false;

        if(this.type == 'area') {
            this.type = 'line';
            this.isArea = true;
        }else if(this.type == 'horizontalBar') {
            this.type = 'bar';
            this.isHorizontal = true;
        }

        this.shadowRoot.innerHTML = `
            <style>
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }
            </style>
            <slot></slot>
        `;


        this.shadowRoot.appendChild(this.chartContainer);
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.chartContainer.appendChild(this.canvas);
    }

    render() {

        const ctx = this.canvas.getContext('2d');
        this.chart = new Chart(ctx, {
            type: this.type,
            data: {
                labels: this.labels,
                datasets: this.datasets
            },
            options: {
                indexAxis: this.isHorizontal ? 'y' : 'x',
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: this.chartTitle.length > 0,
                        text: this.chartTitle,
                        color: this.titleColor,
                        position: this.titlePosition,
                        align: 'center',
                        font: {
                            weight: 'bold',
                            size: this.titleSize
                        },
                        padding: 8,
                        fullSize: true,
                    },
                    subtitle: {
                        display: this.chartSubtitle.length > 0,
                        text: this.chartSubtitle,
                        font: {
                            size: this.chartSubtitleSize,
                        },
                    }
                }
            }
        });
    }

    resize() {
        this.chart.resize();
    }
}

customElements.define('globular-chart-js', ChartJS);
