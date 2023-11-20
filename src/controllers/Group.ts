import { getAllGroups } from "globular-web-client/api";
import { Group } from "globular-web-client/resource/resource_pb";
import { Backend } from "./Backend";

export class GroupController {
    /**
     * Simply return the list of all groups.
     * @param callback 
     * @param errorCallback 
     */
    static getAllGroups(callback: (groups: Group[]) => void, errorCallback: (err: any) => void) {
        getAllGroups(Backend.globular, callback, errorCallback)
    }
}