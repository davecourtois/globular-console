import { flatMap } from "rxjs";
import { displayAuthentication, displayError, displaySuccess } from "./utility";
import { AcceptPeerRqst, GetPeersRqst, Peer, PeerApprovalState, RegisterPeerRqst, RejectPeerRqst, UpdatePeerRqst } from "globular-web-client/resource/resource_pb";

function removeDuplicates(array) {
    return Array.from(new Set(array));
}

/**
 * Sample empty component
 */
export class ClusterManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()


        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
        /* Any custom styling for your code block */
        @import url('./styles.css');

        #content {
            display: flex;
            background-color: var(--surface-color);
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem;

            flex-direction: column;
        }

        #title {
            font-size: 1.2rem;
            margin-left: 1rem;
            margin-right: 1rem;
            flex-grow: 1;
        }

        #hosts {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
        }

   
        #cluster-domain {
            font-weight: 400;
            font-size: 1.1rem;
            font-style: italic;
        }

        #master-icon {
            color: var(--primary-color);
            margin-right: 0.5rem;
            position: absolute;
            top: 24px;
            left: 70px;
        }

        </style>
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span id="title"><span id="cluster-domain"></span></span>
                
                <paper-icon-button id="info-btn" icon="icons:info-outline"></paper-icon-button>
            </div>
            <div id="hosts">
                <slot name="hosts"></slot>
            </div>
        </div>
        `

        // Keep a reference to the globules.
        this.globules = {}

        // The master will be the globule with it DNS name pointing to itself.
        this.master = null

        this.shadowRoot.querySelector("#hosts").addEventListener('dragover', (e) => {
            e.preventDefault();
            this.shadowRoot.querySelector("#content").style.backgroundColor = "var(--google-grey-300)"

        });

        this.shadowRoot.querySelector("#hosts").addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.shadowRoot.querySelector("#content").style.backgroundColor = "var(--surface-color)"

        });

        this.shadowRoot.querySelector("#hosts").addEventListener('drop', (e) => {
            e.preventDefault();
            this.shadowRoot.querySelector("#content").style.backgroundColor = "var(--surface-color)"

            let id = e.dataTransfer.getData("text");

            let hostPanel = document.getElementById(id)
            if (hostPanel == null) {
                return
            }

            let globule = this.globules[id]


            // be sure a token exist for the master.
            if (globule.token == null) {
                displayAuthentication("Enter the sa password of " + globule.config.Name, globule,
                    () => {

                        this.registerPeer(globule)
                    },
                    (error) => {
                        displayError(error)
                    })
            } else {
                // The token already exist, so I will register the peer.
                this.registerPeer(globule)
            }

        });


    }

    registerPeer(globule) {

        // so the first step is to register this globule as a peer of the master.
        let peer = new Peer()

        // ** do not set the mac address here it will be set in the backend and will not work if the mac address is not the one of the master.
        peer.setHostname(this.master.config.Name)
        peer.setProtocol(this.master.config.Protocol)
        peer.setDomain(this.master.config.Domain)
        peer.setPorthttp(this.master.config.PortHttp)
        peer.setPorthttps(this.master.config.PortHttps)
        peer.setLocalIpAddress(this.master.config.LocalIpAddress)
        peer.setExternalIpAddress(this.master.config.ExternalIpAddress)

        let rqst = new RegisterPeerRqst
        rqst.setPeer(peer)

        globule.resourceService.registerPeer(rqst, { domain: globule.config.Domain, application: "globular-console", token: globule.token })
            .then(() => {

                let peer = new Peer()

                // ** do not set the mac address here it will be set in the backend and will not work if the mac address is not the one of the master.
                peer.setHostname(globule.config.Name)
                peer.setProtocol(globule.config.Protocol)
                peer.setDomain(globule.config.Domain)
                peer.setPorthttp(globule.config.PortHttp)
                peer.setPorthttps(globule.config.PortHttps)
                peer.setLocalIpAddress(globule.config.LocalIpAddress)
                peer.setExternalIpAddress(globule.config.ExternalIpAddress)
                peer.setMac(globule.config.Mac)
                peer.setState(PeerApprovalState.PEER_PENDING)

                globule.peer = peer

                this.setAcceptRejectButtons(globule)

                // I will remove the host panel.
                if (!this.querySelector("#" + globule.hostPanel.id)) {
                    this.appendChild(globule.hostPanel)
                }
            })
            .catch((error) => {
                displayError(error)
            })

    }

    setAcceptRejectButtons(globule) {

        let hostPanel = globule.hostPanel

        // So here I will add a button to accept the peer or reject it.
        let acceptBtn = document.createElement("paper-button")
        if (hostPanel.querySelector("#accept-btn") != null) {
            return
        }

        acceptBtn.id = "accept-btn"
        acceptBtn.innerHTML = "Accept"
        acceptBtn.slot = "actions"

        hostPanel.appendChild(acceptBtn)

        let rejectBtn = document.createElement("paper-button")
        rejectBtn.innerHTML = "Reject"
        rejectBtn.slot = "actions"

        hostPanel.appendChild(rejectBtn)


        rejectBtn.addEventListener("click", () => {

            rejectBtn.parentNode.removeChild(rejectBtn)
            acceptBtn.parentNode.removeChild(acceptBtn)

            globule.peer.setState(PeerApprovalState.PEER_REJECTED)

            // I will reject the peer.
            this.rejectPeer(globule, () => {
                // I will add the host panel.
                //this.appendChild(globule.hostPanel)
            }, (error) => {
                displayError(error)
            })

        })

        acceptBtn.addEventListener("click", () => {

            // I will remove the buttons.
            rejectBtn.parentNode.removeChild(rejectBtn)
            acceptBtn.parentNode.removeChild(acceptBtn)

            globule.peer.setState(PeerApprovalState.PEER_ACCETEP)

            // I will accept the peer.
            this.acceptPeer(globule, () => {
                // I will add the host panel.
                displaySuccess(`Peer ${globule.config.Name} successfully accepted`)
                if (!this.querySelector("#" + globule.hostPanel.id)) {
                    this.appendChild(globule.hostPanel)
                }

            }, (error) => {
                displayError(error)
            })
        })
    }

    refresh() {


        // I will remove all the host panels.
        this.innerHTML = ""

        // I will add the master first.
        if (this.master != null) {

            this.shadowRoot.getElementById("cluster-domain").innerHTML = this.master.config.Domain

            this.master.hostPanel.style.position = "relative"

            let masterIcon = document.createElement("iron-icon")
            masterIcon.setAttribute("icon", "icons:star")
            masterIcon.setAttribute("id", "master-icon")
            masterIcon.style.position = "absolute"
            masterIcon.style.top = "24px"
            masterIcon.style.left = "70px"
            masterIcon.style.color = "var(--google-yellow-300)"

            this.master.hostPanel.appendChild(masterIcon)
            this.innerHTML = ""

            this.appendChild(this.master.hostPanel)

            this.master.config.Peers.forEach((peer) => {
                let globule = this.globules["_" + peer.Mac.replace(/:/g, "-")]

                if (globule != null) {
                    let hostPanel = globule.hostPanel
                    if (globule.peer == undefined) {

                        // I will add the host panel.
                        hostPanel.style.position = "relative"

                        // Now I will get the peer information from the master...
                        let rqst = new GetPeersRqst()
                        rqst.setQuery(`{"mac": "${globule.config.Mac}"}`)
                        let stream = this.master.resourceService.getPeers(rqst, { domain: this.master.config.Domain, application: "globular-console", token: "" })
                        stream.on("data", (rsp) => {

                            // I will set the peer.
                            globule.peer = rsp.getPeersList()[0]

                            if (globule.peer != null) {

                                // console.log("Peer found", peer.getState())
                                if (globule.peer.getState() == PeerApprovalState.PEER_ACCETEP) {
                                    if (!this.querySelector("#" + globule.hostPanel.id)) {
                                        this.appendChild(globule.hostPanel)
                                    }
                                    //console.log("append peer ", globule.config.Mac)
                                } else if (globule.peer.getState() == PeerApprovalState.PEER_PENDING) {


                                    this.setAcceptRejectButtons(globule)

                                    // I will remove the host panel.
                                    if (!this.querySelector("#" + globule.hostPanel.id)) {
                                        this.appendChild(globule.hostPanel)
                                    }


                                } else {
                                    // PEER_REJECTED
                                    /** Nothing for the moment... */
                                }
                            }
                        });

                        stream.on("status", (status) => {
                            if (status.code === 0) {
                                /** */
                            } else {
                                displayError(status.details)
                            }
                        })
                    }
                }

            })
        }
    }

    // save the peer configuration.
    saveConfig(globule, callback, errorCallback) {
        let httpRqst = new XMLHttpRequest();

        httpRqst.onreadystatechange = () => {
            if (httpRqst.readyState == 4) {
                if (httpRqst.status == 200) {
                    // I will set the token.
                    globule.token = httpRqst.responseText;
                    if (callback) {
                        callback();
                    }
                } else {
                    if (errorCallback) {
                        errorCallback(httpRqst.responseText);
                    }
                }
            }
        };

        let url = globule.config.Protocol + "://" + globule.config.Name;
        if (globule.config.Domain != "localhost") {
            url += "." + globule.config.Domain;
        }

        if (globule.config.Protocol === "https") {
            if (globule.config.PortHttps !== 443)
                url += ":" + globule.config.PortHttps;
        } else {
            if (globule.config.PortHttp !== 80)
                url += ":" + globule.config.PortHttp;
        }

        url += "/save_config";

        // Open the request before setting headers
        httpRqst.open("POST", url, true);

        // Set the headers after opening the request
        httpRqst.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        httpRqst.setRequestHeader("token", globule.token);

        // Send the request

        // set the new values...
        globule.config.Domain = this.master.config.Domain
        globule.config.Protocol = this.master.config.Protocol
        if (globule.config.AlternateDomains == null) {
            globule.config.AlternateDomains = []
        }

        // append wildcard domain if not already present.
        if (!globule.config.AlternateDomains.includes("*." + this.master.config.Domain))
            globule.config.AlternateDomains.push("*." + this.master.config.Domain)


        // remove duplicates.
        globule.config.AlternateDomains = removeDuplicates(globule.config.AlternateDomains)

        httpRqst.send(JSON.stringify(globule.config));
    }

    acceptPeer(globule, callback, errorCallback) {
        let rqst = new AcceptPeerRqst()
        rqst.setPeer(globule.peer)
        this.master.resourceService.acceptPeer(rqst, { domain: this.master.config.Domain, application: "globular-console", token: "" })
            .then(() => {
                if (callback) {
                    // Set the master as DNS.
                    globule.config.DNS = this.master.config.Name + "." + this.master.config.Domain

                    // so Here I will get the token for the peer...
                    if (globule.token == null) {
                        displayAuthentication("Enter the sa password of " + globule.config.Name, globule,
                            () => {
                                this.saveConfig(globule, callback, errorCallback)

                            },
                            (error) => {
                                displayError(error)
                            })
                    } else {
                        this.saveConfig(globule, callback, errorCallback)

                    }
                }
            })
            .catch((error) => {
                if (errorCallback) {
                    errorCallback(error)
                }
            })
    }


    rejectPeer(globule, callback, errorCallback) {
        let rqst = new RejectPeerRqst()
        rqst.setPeer(globule.peer)
        this.master.resourceService.rejectPeer(rqst, { domain: this.master.config.Domain, application: "globular-console", token: "" })
            .then(() => {
                if (callback) {
                    callback()
                }
            })
            .catch((error) => {
                if (errorCallback) {
                    errorCallback(error)
                }
            })
    }


    // Called when the element is inserted in a document, including into a shadow tree
    setGlobule(globule) {

        let id = "_" + globule.config.Mac.replace(/:/g, "-")
        this.globules[id] = globule

        // I will retreive the host panel...
        if (globule.hostPanel == null) {
            console.log("host panel not found for globule ", globule.config.Name )
            return
        }

        // If the DNS name is the same as the name of the globule, then it is the master.
        if (this.master == null) {
            if (globule.config.DNS == globule.config.Name + "." + globule.config.Domain) {
                if (this.master != null) {
                    displayError("There are two masters in the cluster: " + this.master.config.Name + " and " + globule.config.Name)
                    return
                }
                // Set the master.
                this.master = globule
            }
        }


        this.refresh()

    }

    clear() {
        this.shadowRoot.getElementById("cluster-domain").innerHTML = ""
        this.innerHTML = ""
        this.globules = {}
        this.master = null
    }

}

customElements.define('globular-cluster-manager', ClusterManager)