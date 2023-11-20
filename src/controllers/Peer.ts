import { Application, GetPeersRqst, Peer } from "globular-web-client/resource/resource_pb";
import { Backend } from "./Backend";
import { Globular } from "globular-web-client";

/**
 * PeerController is a controller to get a peer by its id.
 */
export class PeerController {

    /**
     * Returns all peers from the backend.
     * @param callback  The callback function to call when the peers are retrieved.
     * @param errorCallback The callback function to call when an error occured.
     * @param globule  The globule backend to use. If null, the default backend is used.
     * @returns 
     */
    static getAllPeers(callback: (peers: Peer[]) => void, errorCallback: (err: any) => void, globule: Globular) {

        if (globule == null) {
            globule = Backend.globular
        }

        if (globule == null) {
            errorCallback("no globule backend found")
            return
        }

        if (globule.resourceService == null) {
            errorCallback("no resource service found")
            return
        }

        let rqst = new GetPeersRqst
        rqst.setQuery("{}")
        let peers: Peer[] = [];

        let token = localStorage.getItem("user_token")
        if (token == null) {
            errorCallback("no token found")
            return
        }

        let stream = globule.resourceService.getPeers(rqst, { domain: Backend.domain, application: Application.name, token: token });

        // Get the stream and set event on it...
        stream.on("data", (rsp) => {
            peers = peers.concat(rsp.getPeersList());
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                callback(peers);
            } else {
                errorCallback({ message: status.details });
            }
        });
    }

    /**
     * 
     * @param id The id of the peer to get.
     * @param callback The callback function to call when the peer is retrieved.
     * @param errorCallback  The callback function to call when an error occured.
     * @returns 
     */
    static getPeerById(id: string, callback: (peer: Peer) => void, errorCallback: (error: any) => void) {
        let rqst = new GetPeersRqst
        rqst.setQuery(`{"id":"${id}"}`)
        let token = localStorage.getItem("user_token")

        if (token == null) {
            errorCallback("no token found")
            return
        }

        if (Backend.globular == null) {
            errorCallback("no globular backend found")
            return
        }

        if (Backend.globular.resourceService == null) {
            errorCallback("no resource service found")
            return
        }

        let stream = Backend.globular.resourceService.getPeers(rqst, { domain: Backend.domain, application: Application.name, token: token });

        // Get the stream and set event on it...
        stream.on("data", (rsp) => {
            callback(rsp.getPeersList()[0]);
        });

        stream.on("status", (status) => {
            if (status.code != 0) {
                errorCallback({ message: status.details });
            }
        });
    }


}