import * as GlobularWebClient from "globular-web-client";
import { GeneratePeerTokenRequest, GeneratePeerTokenResponse } from "globular-web-client/authentication/authentication_pb";
import { Application } from "../models/Application";
import { Peer } from "globular-web-client/resource/resource_pb";
import { LogInfo, LogLevel, LogRqst, LogRsp } from "globular-web-client/log/log_pb";
import { getAllPeersInfo } from "globular-web-client/api";


// Map to store generated tokens
let tokens: Record<string, string> = {};

/**
 * Returns the URL for the given globule.
 * @param globule - The globule object.
 * @returns The URL of the globule.
 */
export function getUrl(globule: GlobularWebClient.Globular): string {
    let url = globule.config.Protocol + "://" + globule.domain;

    if (window.location.hostname !== globule.domain) {
        const hasMatchingPeer = globule.config.Peers.some(p => p.Domain === window.location.hostname);
        const isAlternateDomain = globule.config.AlternateDomains.includes(window.location.host);

        if (!hasMatchingPeer && isAlternateDomain) {
            url = globule.config.Protocol + "://" + window.location.host;
        }
    }

    if (globule.config.Protocol === "https") {
        if (globule.config.PortHttps !== 443) {
            url += ":" + globule.config.PortHttps;
        }
    } else {
        if (globule.config.PortHttp !== 80) {
            url += ":" + globule.config.PortHttp;
        }
    }

    return url;
}

/**
 * Generates a peer token for the given globule.
 * @param globule - The globule object.
 * @param callback - The success callback function.
 * @param errorCallback - The error callback function.
 */
export function generatePeerToken(
    globule: GlobularWebClient.Globular,
    callback: (token: string) => void,
    errorCallback: (err: any) => void
) {
    // Check if the provided globule is initialized
    if (!globule) {
        errorCallback("The globule was not initialized.");
        return;
    }

    const mac = globule.config.Mac;

    // Retrieve token from localStorage or use an empty string
    const storedToken = localStorage.getItem("user_token");
    const token = storedToken !== null ? storedToken : "";

    // If the application is running on the same globule and token is available, use it directly
    if (Backend.globular.config.Mac === mac && storedToken) {
        callback(token);
        return;
    }

    // If token is cached, use it
    if (tokens[mac]) {
        callback(tokens[mac]);
        return;
    }

    const request = new GeneratePeerTokenRequest();
    request.setMac(mac);

    // Check if the authentication service is available
    if (!Backend.globular.authenticationService) {
        errorCallback("The authentication service is not available.");
        return;
    }

    Backend.globular.authenticationService
        .generatePeerToken(request, { domain: Backend.globular.domain, application: Application.name, token: token })
        .then((rsp: GeneratePeerTokenResponse) => {
            const generatedToken = rsp.getToken();
            tokens[mac] = generatedToken;

            // Remove the token before it becomes invalid
            setTimeout(() => {
                delete tokens[mac];
            }, (globule.config.SessionTimeout * 60 * 1000) - 15000);

            callback(generatedToken);
        })
        .catch(errorCallback);
}



export class Backend {

    private static globule: GlobularWebClient.Globular;

    /**
     * The domain of the application.
     */
    public static domain: string;

    /**
     * The address of the application.
     */
    public static address: string;

    /**
     * The event controller for the application.
     */
    public static eventHub: GlobularWebClient.EventHub;


    /**
     * A map of connected globules, indexed by their addresses.
     */
    public static globules: Map<string, GlobularWebClient.Globular>;

    /**
     * Returns the globule associated with the given address.
     * @param address - The address of the desired globule.
     * @returns The globule with the provided address.
     */
    public static getGlobule(address: string): GlobularWebClient.Globular {
        if (address === "localhost") {
            return Backend.globular;
        }

        let globule = Backend.globules.get(address);
        if (globule) {
            return globule;
        }

        // No globule found, throw an error
        throw new Error("The globule with the address '" + address + "' was not found.");
    }

    /**
     * Returns an array of unique connected globules.
     * @returns An array of connected globules without duplicates.
     */
    public static getGlobules(): Array<GlobularWebClient.Globular> {
        const connections_ = Array.from(Backend.globules.values());
        const connections = new Array<GlobularWebClient.Globular>();

        // Remove duplicate connections based on config Name and Domain
        connections_.forEach(c => {
            const isDuplicate = connections.some(c_ => {
                return c.config.Name === c_.config.Name && c_.config.Domain === c_.config.Domain;
            });

            if (!isDuplicate) {
                connections.push(c);
            }
        });

        return connections;
    }

    /**
     * Returns the globule where the application is running.
     */
    public static get globular(): GlobularWebClient.Globular {
        return Backend.globule;
    }

    // Pulish event on all globules...
    public static publish(name: string, data: any, local: boolean): void {
        let globules = Backend.getGlobules()
        globules.forEach(g => {
            g.eventHub.publish(name, data, local)
        })
    }


    constructor() {

        Backend.globules = new Map<string, GlobularWebClient.Globular>();

        // Set the application name.
        // The domain will be set with the hostname.
        if (window.location.protocol != "files:") {
            Backend.domain = window.location.hostname
            Backend.address = Backend.domain + ":" + window.location.port
            if (Backend.address.endsWith(":")) {
                if (window.location.protocol.toLocaleLowerCase() == "https:") {
                    Backend.address += "443"
                } else {
                    Backend.address += "80"
                }
            }
        }
    }

    /**
     * Connect with the backend and get the initial configuration.
     * @param url The url of the backend
     * @param initCallback On success callback
     * @param errorCallback On error callback
     */
    init(url: string, initCallback: () => void, errorCallback: (err: any) => void) {

        // If the url is not set, I will use the current url.
        Backend.globule = new GlobularWebClient.Globular(url, () => {

            // set the event hub.
            Backend.eventHub = Backend.globule.eventHub;

            Backend.eventHub.subscribe("start_peer_evt", uuid => { }, evt => {

                let obj = JSON.parse(evt)
                let peer = new Peer
                peer.setDomain(obj.domain)
                peer.setHostname(obj.hostname)
                peer.setMac(obj.mac)
                peer.setPorthttp(obj.portHttp)
                peer.setPorthttps(obj.portHttps)

                this.initPeer(peer, () => {
                    // dispatch the event locally...
                    Backend.eventHub.publish("start_peer_evt_", peer, true)
                }, err => console.log(err))

            }, false)

            Backend.eventHub.subscribe("stop_peer_evt", uuid => { }, evt => {

                let obj = JSON.parse(evt)
                let peer = new Peer
                peer.setDomain(obj.domain)
                peer.setHostname(obj.hostname)
                peer.setMac(obj.mac)
                peer.setPorthttp(obj.portHttp)
                peer.setPorthttps(obj.portHttps)

                // remove the peer from the map.
                this.removePeer(peer)

                // dispatch the event locally...
                Backend.eventHub.publish("stop_peer_evt_", peer, true)

            }, false)

            // If a new peers is connected...
            Backend.eventHub.subscribe("update_peers_evt", uuid => { },
                evt => {
                    let obj = JSON.parse(evt)
                    if (obj) {
                        let peer = new Peer
                        peer.setDomain(obj.domain)
                        peer.setHostname(obj.hostname)
                        peer.setMac(obj.mac)
                        peer.setPorthttp(obj.portHttp)
                        peer.setPorthttps(obj.portHttps)

                        let actions = new Array<string>()

                        if (obj.actions) {
                            obj.actions.forEach((a: string) => {
                                actions.push(a)
                            })
                        }

                        peer.setActionsList(actions)

                        this.initPeer(peer, () => {
                            // dispatch the event locally...
                            Backend.eventHub.publish("update_peers_evt_", peer, true)
                        }, err => console.log(err))

                    } else {
                        console.log("fail to parse ", evt)
                    }
                }, false)

            // So here I will create connection to peers know by globular...
            Backend.globules = new Map<string, GlobularWebClient.Globular>();
            Backend.globules.set(Backend.address, Backend.globule)
            Backend.domain = Backend.globular.domain;
            Backend.globules.set(Backend.domain, Backend.globular)
            Backend.globules.set(Backend.domain + ":" + Backend.globular.config.PortHttp, Backend.globular)
            Backend.globules.set(Backend.domain + ":" + Backend.globular.config.PortHttps, Backend.globular)
            Backend.globules.set(Backend.globular.config.Mac, Backend.globular)

            // I will also set the globule to other address...
            Backend.globular.config.AlternateDomains.forEach(alternateDomain => {
                // I will set alternate domain only if no peer has it domain.
                if (Backend.globular.config.Peers.filter((p) => { return p.Domain === alternateDomain; }).length == 0) {
                    Backend.globules.set(alternateDomain, Backend.globular)
                    let address = alternateDomain + ":" + window.location.port
                    if (address.endsWith(":")) {
                        if (Backend.globular.config.Protocol == "https") {
                            address += "443"
                        } else {
                            address += "80"
                        }
                    }
                    Backend.globules.set(address, Backend.globular)
                }
            });

            // init the log
            this.initLog()

            // Retreive peer's infos and register peers.
            getAllPeersInfo(Backend.globular, (peers: Peer[]) => {
                let index = 0;
                let connectToPeers = () => {
                    let peer = peers[index]
                    if (index < peers.length) {
                        index++
                        this.initPeer(peer, () => {
                            if (index < peers.length) {
                                connectToPeers()
                            } else {
                                initCallback();
                            }
                        },
                            err => {
                                console.log(err)
                                if (index < peers.length) {
                                    connectToPeers()
                                } else {
                                    initCallback();
                                }
                            })
                    } else {
                        initCallback();
                    }
                }

                // call onces
                connectToPeers()
            }, (err: any) => {
                initCallback();
            });
        }, err => { console.log(err); errorCallback(err); });

    }

    /**
     * Initialyse the peer.
     * @param peer The peer to initialyse
     * @param callback The success callback
     * @param errorCallback The error callback
     */
    initPeer(peer: Peer, callback: () => void, errorCallback: (err: any) => void) {
        let port = 80
        if (Backend.globular.config.Protocol == "https") {
            port = 443
            if (peer.getProtocol() == "https") {
                port = peer.getPorthttps()
            }
        } else {
            port = peer.getPorthttps()
        }

        let url = Backend.globular.config.Protocol + "://" + peer.getDomain() + ":" + port + "/config"
        let globule = new GlobularWebClient.Globular(url, () => {

            // append the globule to the list.
            Backend.globules.set(Backend.globular.config.Protocol + "://" + peer.getDomain() + ":" + port, globule)
            Backend.globules.set(url, globule)

            Backend.globules.set(peer.getDomain(), globule)
            Backend.globules.set(peer.getMac(), globule)

            callback()

        }, (err: any) => {
            console.log(err)
            errorCallback(err)
        })
    }

    /**
     * Remove the peer from the list of active globule.
     * @param peer 
     */
    removePeer(peer: Peer) {
        let port = 80
        if (Backend.globular.config.Protocol == "https") {
            port = 443
            if (peer.getProtocol() == "https") {
                port = peer.getPorthttps()
            }
        } else {
            port = peer.getPorthttps()
        }

        let url = Backend.globular.config.Protocol + "://" + peer.getDomain() + ":" + port + "/config"

        // append the globule to the list.
        Backend.globules.delete(Backend.globular.config.Protocol + "://" + peer.getDomain() + ":" + port)
        Backend.globules.delete(url)
        Backend.globules.delete(peer.getDomain())
        Backend.globules.delete(peer.getMac())
    }


    initLog() {

        // So here I will intercept all error and log it on the server log.
        // This error will be available in the setting -> error(s)
        window.onerror = (message, source, lineno, colno, error) => {
            let info = new LogInfo
            info.setLevel(LogLevel.ERROR_MESSAGE)

            info.setLevel(LogLevel.ERROR_MESSAGE)

            if (error == undefined) {
              return
            }
    
            info.setMethod(error.name + " " + error.message)
            if (error.stack != undefined){
              info.setMessage(error.stack.toString())
            }

            info.setApplication(Application.name)
            info.setOccurences(0)

            if (error == undefined) {
                return
            }

            info.setMethod(error.name + " " + error.message)

            // set the error call stack in the message...
            if (error.stack != undefined)
                info.setMessage(error.stack.toString())

            let rqst = new LogRqst
            rqst.setInfo(info)
       
            if (Backend.globular == undefined) {
                throw new Error("Backend.globular is undefined")
            }

            if (Backend.globular.logService == undefined) {
                throw new Error("Backend.globular.logService is undefined")
            }

            let token = localStorage.getItem("user_token")
            if (token == undefined) {
                throw new Error("user_token is undefined")
            }

            Backend.globular.logService.log(rqst, {
                token: token,
                application: Application.name,
                domain: Backend.globular.domain
            }).then((rsp: LogRsp) => {

            }).catch((err: any) => {
                /* ApplicationView.displayMessage(err, 3000)*/
            })

        };
    }

}