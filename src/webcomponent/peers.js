import { GetPeersRqst } from "globular-web-client/resource/resource_pb"

export function getPeerById(id, callback, errorCallback) {
    let p_ = null
    let globule = AppComponent.globules[0]

    getAllPeers(globule, peers => {
        peers.forEach(p => {
            if (p.getMac() == id) {
                p_ = p
            }
        })

        if (p_ != null) {
            callback(p_)
            return
        }
        errorCallback("no peer found with id " + id)
    }, errorCallback)
}

export function getAllPeers(globule, callback, errorCallback) {
    let rqst = new GetPeersRqst
    rqst.setQuery("{}")
    let peers = [];

    let stream = globule.resourceService.getPeers(rqst, { });

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
