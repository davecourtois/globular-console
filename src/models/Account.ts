import {ReplaceOneRqst, ReplaceOneRsp } from "globular-web-client/persistence/persistence_pb";
import { Group } from "./Group";
import { Session } from "./Session"
import { Application } from "./Application";
import { IModel } from "./Model";
import { Backend } from "../controllers/Backend";
import { AccountController } from "src/controllers/Account";

/**
 * Basic account class that contain the user id and email.
 */
export class Account implements IModel {

    private groups_: Array<any> = [];
    public get groups(): Array<any> {
        return this.groups_;
    }
    
    public set groups(value: Array<any>) {
        this.groups_ = value;
    }

    // keep the session information.
    private session_!: Session;
    public get session(): Session {
        return this.session_;
    }

    public set session(value: Session) {
        this.session_ = value;
    }

    // The domain where the account came from.
    private _domain: string = "";
    public get domain(): string {
        return this._domain;
    }
    public set domain(value: string) {
        this._domain = value;
    }

    // Must be unique
    private _id: string;
    public get id(): string {
        return this._id;
    }
    public set id(value: string) {
        this._id = value;
    }

    // The name of the account.
    private name_: string;
    public get name(): string {
        return this.name_;
    }
    public set name(value: string) {
        this.name_ = value;
    }

    // Must be unique.
    private email_: string;
    public get email(): string {
        return this.email_;
    }
    public set email(value: string) {
        this.email_ = value;
    }

    // complementary information.
    private hasData: boolean;

    // The user profile picture.
    private profilePicture_: string;
    public get profilePicture(): string {
        return this.profilePicture_;
    }

    public set profilePicture(value: string) {
        this.profilePicture_ = value;
    }

    // The ringtone for that user...
    private ringtone_: string = "";
    public get ringtone(): string {
        return this.ringtone_;
    }

    public set ringtone(value: string) {
        this.ringtone_ = value;
    }

    // The user firt name
    private firstName_: string;
    public get firstName(): string {
        return this.firstName_;
    }
    public set firstName(value: string) {
        this.firstName_ = value;
    }

    // The user last name
    private lastName_: string;
    public get lastName(): string {
        return this.lastName_;
    }
    public set lastName(value: string) {
        this.lastName_ = value;
    }

    // The user middle name.
    private middleName_: string;
    public get middleName(): string {
        return this.middleName_;
    }
    public set middleName(value: string) {
        this.middleName_ = value;
    }

    public get userName(): string {
        let name = this.firstName;
        if (this.middleName.length > 0) {
            name += " " + this.middleName;
        }

        return name + " " + this.lastName;
    }

    constructor(id: string, email: string, name: string, domain: string, firstName: string, lastName: string, middleName: string, profilePicture: string) {
        this._id = id;
        this.name_ = name;
        this.domain = domain;
        this.email_ = email;
        this.hasData = false;
        this.firstName_ = firstName;
        this.lastName_ = lastName;
        this.middleName_ = middleName;
        this.profilePicture_ = profilePicture
    }


    /**
     * Initialyse account groups.
     * @param obj The account data from the persistence store.
     * @param successCallback 
     * @param errorCallback 
     */
    public initGroups(successCallback: (groups: Array<Group>) => void) {
        let groups_ = new Array<Group>();
        if (this.groups_ == undefined) {
            successCallback([])
            return
        }

        if (this.groups_.length == 0) {
            successCallback([])
            return
        }

        // Initi the group.
        let setGroup_ = (index: number) => {
            if (index < this.groups_.length) {
                let groupId = this.groups_[index]["$id"]
                Group.getGroup(groupId, (g: Group) => {
                    groups_.push(g)
                    index++
                    setGroup_(index);

                }, () => {
                    index++
                    if (index < this.groups_.length) {
                        setGroup_(index);
                    } else {
                        successCallback(groups_);
                    }
                })
            } else {
                successCallback(groups_);
            }
        }

        // start the recursion.
        setGroup_(0)
    }

    // Test if a account is member of a given group.
    isMemberOf(id: string): boolean {
        this.groups_.forEach((g: any) => {
            if (g._id == id) {
                // be sure the account is in the group reference list...
                return g.hasMember(this)
            }
        })
        return false;
    }

    /**
     * Set the user data.
     * @param data 
     */
    private setData(data: any) {

        this.hasData = true;
        this.firstName = data["firstName_"];
        if (this.firstName == undefined) {
            this.firstName = ""
        }
        this.lastName = data["lastName_"];
        if (this.lastName == undefined) {
            this.lastName = ""
        }
        this.middleName = data["middleName_"];
        if (this.middleName == undefined) {
            this.middleName = "";
        }
        if (data["profilePicture_"] != undefined) {
            this.profilePicture = data["profilePicture_"];

            // keep the user data into the localstore.
            localStorage.setItem(this.id + "@" + this.domain, JSON.stringify(data))
        }

    }

    /**
     * Must be called once when the session open.
     * @param account 
     */
    initData(callback: (account: Account) => void, onError: (err: any) => void) {
        let userName = this.name

        if (this.hasData == true) {
            callback(this);
            return
        }

        // Retreive user data... 
        AccountController.readOneUserData(
            `{"$or":[{"_id":"${this.id}"},{"name":"${this.id}"} ]}`, // The query is made on the user database and not local_ressource Accounts here so name is name_ here
            userName, // The database to search into 
            this.domain,
            (data: any) => {

                if (Object.keys(data).length == 0) {
                    let data_ = localStorage.getItem(this.id)
                    if (data_) {
                        data = JSON.parse(data_);
                        this.setData(data);
                    }
                } else {
                    this.setData(data);
                }

                // Here I will keep the Account up-to date.
                if (AccountController.getListener(this.id) == undefined) {
                    // Here I will connect the objet to keep track of accout data change.
                    Backend.getGlobule(this.domain).eventHub.subscribe(`update_account_${this.id + "@" + this.domain}_data_evt`,
                        (uuid: string) => {
                            AccountController.setListener(this.id, this.domain, uuid);
                        },
                        (str: string) => {
                            let data = JSON.parse(str);
                            this.setData(data); // refresh data.
                            // Here I will rethrow the event locally...
                            Backend.eventHub.publish(`__update_account_${this.id + "@" + this.domain}_data_evt__`, data, true);
                        }, false, this)
                }

                // Keep in the local map...
                AccountController.setAccount(this)

                // Call success callback ...
                callback(this);
            },
            (err: any) => {
                this.hasData = false;
                if (localStorage.getItem(this.id) != undefined) {
                    let data_ = localStorage.getItem(this.id)
                    if (!data_) {
                        callback(this);
                        return
                    }

                    // here I will set the data from the local storage.
                    this.setData(JSON.parse(data_))
                    callback(this);
                    return
                }
                // Call success callback ...
                if (callback != undefined && this.session != null) {
                    this.session.initData(() => {
                        callback(this);
                    }, onError)
                    callback(this);
                }
            }
        );
    }

    /**
     * Change the user profil picture...
     * @param dataUrl The data url of the new profile picture.
     * @param onSaveAccount The success callback
     * @param onError The error callback
     */
    changeProfilImage(
        dataUrl: string
    ) {
        this.profilePicture_ = dataUrl;
    }

    /**
     * Save user data into the user_data collection. Insert one or replace one depending if values
     * are present in the firstName and lastName.
     */
    save(
        callback: (account: Account) => void,
        onError: (err: any) => void
    ) {
        let userName = this.name;

        // save the user_data
        let rqst = new ReplaceOneRqst();
        let id = userName.split("@").join("_").split(".").join("_");
        let db = id + "_db";

        // set the connection infos,
        rqst.setId(id);
        rqst.setDatabase(db);
        let collection = "user_data";
        
        // save only user data and not the how user info...
        let data = this.toString();
        rqst.setCollection(collection);
        rqst.setQuery(`{"$or":[{"_id":"${this.id}"},{"name":"${this.id}"} ]}`);
        rqst.setValue(data);
        rqst.setOptions(`[{"upsert": true}]`);

        // So here I will set the address from the address found in the token and not 
        // the address of the client itself.
        let token = localStorage.getItem("user_token")
        if (token == null) {
            onError("User not logged in")
            throw `User not logged in`
            return
        }

        let globule = Backend.getGlobule(this.domain)
        if (globule == null) {
            onError("no globule was found at domain " + this.domain)
            return
        }

        if (globule.persistenceService == null) {
            onError("Persistence service not found")
            throw `No persistence service found for domain ${this.domain}`
        }

        // call persist data
        globule.persistenceService
            .replaceOne(rqst, {
                token: token,
                application: Application.name,
                domain: globule.domain
            })
            .then((rsp: ReplaceOneRsp) => {
                // Here I will return the value with it
                Backend.publish(`update_account_${this.id + "@" + this.domain}_data_evt`, data, false)
                callback(this);
            })
            .catch((err: any) => {
                onError(err);
            });
    }

    /**
     * @returns The string representation of the account.
     */
    toString(): string {
        return JSON.stringify({ _id: this.id, email_: this.email, firstName_: this.firstName, lastName_: this.lastName, middleName_: this.middleName, profilePicture_: this.profilePicture, domain_: this.domain });
    }

    /**
     * @param obj The object if the account object from the backend.
     */
    fromObject(obj: any): void {
        this._id = obj._id;
        this.email_ = obj.email_;
        this.firstName_ = obj.firstName_;
        this.lastName_ = obj.lastName_;
        this.middleName_ = obj.middleName_;
        this.profilePicture_ = obj.profilePicture_;
        this.domain = obj.domain_;

        // Set the account in the account map.
        AccountController.setAccount(this)
    }

    getId(): string {
        return this._id
    }

    getDomain(): string {
        return this.domain
    }

    getName(): string {
        return this.name_
    }

  
}
