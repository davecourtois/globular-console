import { GetApplicationsRqst, Application as ApplicationInfo, GetApplicationsRsp, AddApplicationActionsRqst, RemoveApplicationActionRqst, DeleteApplicationRqst } from "globular-web-client/resource/resource_pb";
import { Backend } from "./Backend";
import { Application } from "src/models/Application";
import { UninstallApplicationRequest } from "globular-web-client/applications_manager/applications_manager_pb";
import { GetAllActionsRequest } from "globular-web-client/services_manager/services_manager_pb";

/**
 * Controller for application related actions.
 */
export class ApplicationController {

    static uninstallApplication(application: ApplicationInfo, callback: () => void, errorCallback: (err: any) => void) {
        if (!Backend.globular) {
            errorCallback("Backend not initialized.")
            return;
        }

        if (!Backend.globular.resourceService) {
            errorCallback("Resource service not initialized.")
            return;
        }

        let token = localStorage.getItem("user_token")
        if (!token) {
            errorCallback("User not logged in.")
            return;
        }

        /**
         * Delete the application.
         */
        let rqst = new UninstallApplicationRequest
        rqst.setApplicationid(application.getId() + "@" + application.getDomain())

        Backend.globular.applicationsManagerService?.uninstallApplication(rqst, { domain: Backend.domain, application: Application.name, token: token })
            .then(rsp => {
                callback()
            }).catch(errorCallback)
    }

    /**
     * Return all actions available on the platform.
     * @param callback 
     * @param errorCallback 
     * @returns 
     */
    static getAllActions(callback: (actions: string[]) => void, errorCallback: (err: any) => void) {
        if (!Backend.globular) {
            errorCallback("Backend not initialized.")
            return;
        }

        if (!Backend.globular.servicesManagerService) {
            errorCallback("Services Manager service not initialized.")
            return;
        }

        let token = localStorage.getItem("user_token")
        if (!token) {
            errorCallback("User not logged in.")
            return;
        }

        let rqst = new GetAllActionsRequest

        Backend.globular.servicesManagerService.getAllActions(rqst, { domain: Backend.domain, application: Application.name, token: token })
            .then(rsp => {
                callback(rsp.getActionsList())
            }).catch(errorCallback)
    }

    /**
     * Delete an application
     * @param application 
     * @param callback 
     * @param errorCallback 
     * @returns 
     */
    static deleteApplication(application: ApplicationInfo, callback: () => void, errorCallback: (err: any) => void) {
        if (!Backend.globular) {
            errorCallback("Backend not initialized.")
            return;
        }

        if (!Backend.globular.resourceService) {
            errorCallback("Resource service not initialized.")
            return;
        }

        let token = localStorage.getItem("user_token")
        if (!token) {
            errorCallback("User not logged in.")
            return;
        }

        /**
         * Delete the application.
         */
        let rqst = new DeleteApplicationRqst
        rqst.setApplicationid(application.getId() + "@" + application.getDomain())

        Backend.globular.resourceService.deleteApplication(rqst, { domain: Backend.domain, application: Application.name, token: token })
            .then(rsp => {
                callback()
            }).catch(errorCallback)
    }

    static removeApplicationAction(application: ApplicationInfo, action: string, callback: () => void, errorCallback: (err: any) => void) {
        if (!Backend.globular) {
            errorCallback("Backend not initialized.")
            return;
        }

        if (!Backend.globular.resourceService) {
            errorCallback("Resource service not initialized.")
            return;
        }

        let token = localStorage.getItem("user_token")
        if (!token) {
            errorCallback("User not logged in.")
            return;
        }

        if (application.getActionsList().indexOf(action) < 0) {
            errorCallback("Action does not exists.")
            return;
        }

        let rqst = new RemoveApplicationActionRqst
        rqst.setApplicationid(application.getId() + "@" + application.getDomain())
        rqst.setAction(action)

        Backend.globular.resourceService.removeApplicationAction(rqst, { domain: Backend.domain, application: Application.name, token: token })
            .then(rsp => {
                callback()

                // Refresh the application list.
                Backend.globular.eventHub.publish("refresh_application_evt", {}, true)

            }).catch(errorCallback)
    }

    /**
     * Add action to an application.
     * @param application The application to add the action to.
     * @param action The action to add.
     */
    static addApplicationAction(application: ApplicationInfo, action: string, callback: () => void, errorCallback: (err: any) => void) {
        if (!Backend.globular) {
            errorCallback("Backend not initialized.")
            return;
        }

        if (!Backend.globular.resourceService) {
            errorCallback("Resource service not initialized.")
            return;
        }

        let token = localStorage.getItem("user_token")
        if (!token) {
            errorCallback("User not logged in.")
            return;
        }

        if (application.getActionsList().indexOf(action) >= 0) {
            errorCallback("Action already exists.")
            return;
        }

        let actions = [...application.getActionsList()]
        actions.push(action)

        let rqst = new AddApplicationActionsRqst
        rqst.setApplicationid(application.getId() + "@" + application.getDomain())
        rqst.setActionsList(actions)

        Backend.globular.resourceService.addApplicationActions(rqst, { domain: Backend.domain, application: Application.name, token: token })
            .then(rsp => {
                callback()

                // Refresh the application list.
                Backend.globular.eventHub.publish("refresh_application_evt", {}, true)
                
            }).catch(errorCallback)
    }

    /**
     * Return application infos for a given application.
     * @param name 
     * @param callback 
     * @param errorCallback 
     * @returns 
     */
    static getApplicationInfo(name: string, callback: (info: ApplicationInfo) => void, errorCallback: (err: any) => void) {
        const rqst = new GetApplicationsRqst();
        rqst.setQuery(`{"_id":"${name}"}`);

        if (!Backend.globular) {
            console.error("Backend not initialized.")
            throw new Error("Backend not initialized.")
        }

        if (!Backend.globular.resourceService) {
            console.error("Resource service not initialized.")
            throw new Error("Resource service not initialized.")
        }

        const stream = Backend.globular.resourceService.getApplications(rqst, {
            application: name,
            domain: Backend.domain,
            address: Backend.address
        });

        let infos: ApplicationInfo | undefined;
        stream.on("data", (rsp: GetApplicationsRsp) => {
            if (rsp.getApplicationsList().length > 0) {
                infos = rsp.getApplicationsList()[0];
            }
        });

        stream.on("status", (status) => {
            if (status.code === 0) {
                if (infos) {
                    callback(infos);
                } else
                    errorCallback("Application not found.");
            } else {
                errorCallback(status.details);
            }
        });

    }

    /**
     * Return application infos for all applications.
     * @param callback 
     * @param errorCallback 
     */
    static getAllApplicationInfos(callback: (infos: ApplicationInfo[]) => void, errorCallback: (err: any) => void) {

        const rqst = new GetApplicationsRqst();
        rqst.setQuery(`{}`);

        if (!Backend.globular) {
            console.error("Backend not initialized.")
            throw new Error("Backend not initialized.")
        }

        if (!Backend.globular.resourceService) {
            console.error("Resource service not initialized.")
            throw new Error("Resource service not initialized.")
        }

        const stream = Backend.globular.resourceService.getApplications(rqst, {
            domain: Backend.domain,
            address: Backend.address
        });

        let infos: ApplicationInfo[] = [];
        stream.on("data", (rsp: GetApplicationsRsp) => {
            infos = infos.concat(rsp.getApplicationsList());
        });

        stream.on("status", (status) => {
            if (status.code === 0) {
                callback(infos);
            } else {
                errorCallback(status.details);
            }
        });

    }
}