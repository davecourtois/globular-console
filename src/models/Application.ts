import { Backend } from "../controllers/Backend";
import { Account } from "./Account";
import { Application as ApplicationInfo } from "globular-web-client/resource/resource_pb";
import { IModel } from "./Model";
import { ApplicationController } from "src/controllers/Application";

/**
 * The application model. It contain information about the application.
 */
export class Application implements IModel {

    /**
     * The application name.
     */
    public name: string = "";

    /**
     * The application url.
     */
    public url: string = "";

    /**
     * The application version.
     */
    public version: string = "";

    /**
     * The application description.
     */
    public description: string = "";

    /**
     * The application alias.
     */
    public alias: string = "";

    /**
     * The application icon.
     */
    public icon: string = "";

    /**
     * the application creation date.
     */
    public creationDate!: Date;

    /**
     * The application publisher id.
     */
    public publisherId: string = "";

    /**
     * The current logged in account.
     */
    public static account: Account;

    /**
     * The backend.
     */
    private backend!: Backend;

    /**
     * Create a new application.
     * @param name the application name.
     */
    constructor(name: string, url: string, callback: () => void, errorCallback: (err: any) => void) {

        // keep the application name.
        this.name = name;
        this.url = url;

        // Init the backend.
        this.init(url, () => {
            // Keep application info up to date.
            ApplicationController.getApplicationInfo(this.name, (infos: ApplicationInfo) => {
                this.description = infos.getDescription();
                this.version = infos.getVersion();
                this.alias = infos.getAlias();
                this.icon = infos.getIcon();
                this.publisherId = infos.getPublisherid();
                this.creationDate = new Date(infos.getCreationDate()! * 1000);

                // Publish the application info.
                callback()

                // Publish the application info.
                Backend.eventHub.publish("application_info_evt", infos, true);

                // In case of update, update the application info.
                Backend.eventHub.subscribe(`update_application_${infos.getId()}_settings_evt`,
                    (uuid: string) => {
                        /** nothing here */
                    },
                    (__application_info__: string) => {

                        // Set the icon...
                        let infos = JSON.parse(__application_info__)
                        this.description = infos.description;
                        this.version = infos.version;
                        this.alias = infos.alias;
                        this.icon = infos.icon;
                        this.publisherId = infos.publisherid;
                        this.creationDate = new Date(infos.creation_date * 1000);

                        // Publish the application info.
                        Backend.eventHub.publish("application_info_evt", infos, true);

                    }, false);

            }, errorCallback);

        }, errorCallback);
    }

    /**
     * Connect the listner's and call the initcallback.
     * @param url the backend url.
     * @param initCallback
     * @param errorCallback
     * @param configurationPort
     */
    init(
        url: string,
        initCallback: () => void,
        errorCallback: (err: any) => void
    ) {
        // Init the backend.
        this.backend = new Backend();
        this.backend.init(url, initCallback, errorCallback);
    }



    /**
     * @returns 
     */
    toString(): string {
        let json = { _id: this.name, name: this.name, url: this.url, version: this.version, description: this.description, alias: this.alias, icon: this.icon, creationDate: this.creationDate, publisherId: this.publisherId };
        return JSON.stringify(json);
    }

    /**
     * Return the application info as a json object.
     * @param obj 
     */
    fromObject(obj: any): void {
        this.name = obj.name;
        this.url = obj.url;
        this.version = obj.version;
        this.description = obj.description;
        this.alias = obj.alias;
        this.icon = obj.icon;
        this.creationDate = obj.creationDate;
        this.publisherId = obj.publisherId;
    }
}
