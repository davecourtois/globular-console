import { Application, GetOrganizationsRqst, Organization } from "globular-web-client/resource/resource_pb";
import { Backend } from "./Backend";
import { Globular } from "globular-web-client";

export class OrganizationController {

    static getAllOrganizations(callback: (organizations: Organization[])=>void, errorCallback: (err: any) => void, globule: Globular) {

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

        let rqst = new GetOrganizationsRqst
        rqst.setQuery("{}")
        let organizations: Organization[] = [];

        let token = localStorage.getItem("user_token")
        if (token == null) {
            errorCallback("no token found")
            return
        }

        let stream = globule.resourceService.getOrganizations(rqst, { domain: Backend.domain, application: Application.name, token: token });

        // Get the stream and set event on it...
        stream.on("data", (rsp) => {
            organizations = organizations.concat(rsp.getOrganizationsList());
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                callback(organizations);
            } else {
                errorCallback({ message: status.details });
            }
        });
    }

    static getOrganizationById(id:string, callback:(organization: Organization)=>void, errorCallback:(err:any)=>void) {
        let rqst = new GetOrganizationsRqst
        rqst.setQuery(`{"id":"${id}"}`)
        
        let token = localStorage.getItem("user_token")
        if (token == null) {
            errorCallback("no token found")
            return
        }

        if(Backend.globular == null) {
            errorCallback("no globular backend found")
            return
        }

        if(Backend.globular.resourceService == null) {
            errorCallback("no resource service found")
            return
        }

        let stream = Backend.globular.resourceService.getOrganizations(rqst, { domain: Backend.domain, application: Application.name, token: token });

        // Get the stream and set event on it...
        stream.on("data", (rsp) => {
            callback(rsp.getOrganizationsList()[0]);
        }
        );

        stream.on("status", (status) => {
            if (status.code != 0) {
                errorCallback({ message: status.details });
            }
        }
        );
    }
}