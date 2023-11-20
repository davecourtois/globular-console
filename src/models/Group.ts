import { FindOneRqst, ReplaceOneRqst, ReplaceOneRsp } from "globular-web-client/persistence/persistence_pb";
import { IModel } from "./Model";
import { Account } from "./Account"
import * as resource from "globular-web-client/resource/resource_pb";
import { getAllGroups } from "globular-web-client/api";
import { Globular } from "globular-web-client";
import { Backend } from "../controllers/Backend";
import { Application } from "./Application";
import { AccountController } from "src/controllers/Account";

/**
 * Group are use to aggregate accounts.
 */
export class Group implements IModel {

    private static groups: any;

    // The id
    private _id: string;
    public get id(): string {
        return this._id;
    }

    // the name
    private _name: string="";
    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }

    private _domain: string="";
    public get domain(): string {
        return this._domain;
    }
    public set domain(value: string) {
        this._domain = value;
    }

    // keep the list members references.
    private members: Array<any>=[];

    // The model...
    constructor(id: string) {
        this._id = id;
    }


    initData(initCallback: () => void, errorCallback: (err: any) => void) {

        let domain = Backend.domain
        if (this._id.indexOf("@") > 0) {
            domain = this._id.split("@")[1]
            this._id = this._id.split("@")[0]
        }

        let rqst = new resource.GetGroupsRqst
        rqst.setQuery(`{"_id":"${this._id}"}`)

        let globule = Backend.getGlobule(domain)
        if(globule == null){
            errorCallback("Domain not found")
            throw `No globule found for domain ${domain}`
        }

        if(globule.resourceService == null){
            errorCallback("Resource service not found")
            throw `No resource service found for domain ${domain}`
        }

        let token = localStorage.getItem("user_token")
        if(token == null){
            errorCallback("User not logged in")
            throw `User not logged in`
        }

        let stream = globule.resourceService.getGroups(rqst, { domain: globule.domain, application: Application.name, token: token })
        let groups_ = new Array<resource.Group>();

        stream.on("data", (rsp) => {
            groups_ = groups_.concat(rsp.getGroupsList())
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                let obj = groups_[0]
                this.fromObject(obj)

                // keep in the local map.
                Group.groups[this._id] = this

                // Here I will connect local event to react with interface element...
                initCallback()
            } else {
                errorCallback(status.details)
            }
        })
    }


    static getGroups(callback: (groups: Array<Group>) => void, errorCallback: (err: any) => void) {
        let groups_ = new Array<Group>()
        let connections = Backend.getGlobules()

        let _getGroups_ = () => {
            let globule = connections.pop()
            if (connections.length == 0 && globule != undefined) {
                Group._getGroups(globule, (groups: Array<Group>) => {
                    for (var i = 0; i < groups.length; i++) {
                        let g = groups[i]
                        if (groups_.filter(g_ => { return g.id == g_.id && g.domain == g_.domain; }).length == 0) {
                            groups_.push(g)
                        }
                    }
                    callback(groups_)
                }, errorCallback)
            } else if(globule != undefined) {
                Group._getGroups(globule, (groups: Array<Group>) => {
                    for (var i = 0; i < groups.length; i++) {
                        let g = groups[i]
                        if (groups_.filter(g_ => { return g.id == g_.id && g.domain == g_.domain; }).length == 0) {
                            groups_.push(g)
                        }
                    }
                    _getGroups_() // get the account from the next globule.
                }, errorCallback)
            }
        }

        // get account from all register peers.
        _getGroups_()
    }

    // Return the list of all groups.
    static _getGroups(globule:Globular, callback: (callback: Group[]) => void, errorCallback: (err: any) => void){
        let groups = new Array<Group>();
        getAllGroups(globule, groups_ =>{
            groups_.forEach(g=>{
                let g_ = new Group(g.getId())
                g_.fromObject(g)
                groups.push(g_)
                callback(groups)
            })
        }, errorCallback);
    }

    // Retreive a given group.
    static getGroup(id: string, successCallback: (g: Group) => void, errorCallback: (err: any) => void) {
        if (Group.groups == undefined) {
            Group.groups = {};
        }
        if (Group.groups[id] != null) {
            successCallback(Group.groups[id])
        }

        // Here I will get the group.
        let g = new Group(id);

        g.initData(() => {
            Group.groups[id] = g;
            successCallback(g)
        }, errorCallback)

    }

    // Save the group.
    save(successCallback: (g: Group) => void, errorCallback: (err: any) => void) {

        let domain = this.domain
        if (this._id.indexOf("@") > 0) {
            domain = this._id.split("@")[1]
            this._id = this._id.split("@")[0]
        }

        let rqst = new resource.UpdateGroupRqst
        rqst.setGroupid(this._id)
        let data = this.toString();
        rqst.setValues(data)

        let globule = Backend.getGlobule(domain)
        if(globule == null){
            errorCallback("Domain not found")
            throw `No globule found for domain ${domain}`
        }

        if(globule.resourceService == null){
            errorCallback("Resource service not found")
            throw `No resource service found for domain ${domain}`
        }

        let token = localStorage.getItem("user_token")
        if(token == null){
            errorCallback("User not logged in")
            throw `User not logged in`
        }

        globule.resourceService.updateGroup(rqst, {
            token: token,
            application: Application.name,
            domain: this.domain
        })
            .then((rsp: ReplaceOneRsp) => {
                // Here I will return the value with it
                globule.eventHub.publish(`update_group_${this._id}_data_evt`, data, false)

                successCallback(this);
            })
            .catch((err: any) => {
                errorCallback(err);
            });

    }

    // Return the list of members as Account objects.
    getMembers(successCallback: (members: Array<Account>) => void, errorCallback: () => void) {
        let members = new Array<Account>();
        if (this.members.length == 0) {
            successCallback([])
            return
        }

        // Initi the group.
        let setAccount_ = (index: number) => {
            if (index < this.members.length) {
                let memberId = this.members[index]
                AccountController.getAccount(memberId, (a: Account) => {
                    members.push(a)
                    index++
                    setAccount_(index);

                }, errorCallback)
            } else {
                successCallback(members);
            }
        }

        // start the recursion.
        let index = 0;
        setAccount_(index)
    }

    // Return true if an account if member of a given group.
    hasMember(account: Account): boolean {
        this.members.forEach((m: any) => {
            if (m == account.id + "@" + account.domain) {
                return true;
            }
            return false;
        })
        return false;
    }

    // Stringnify to save into db.
    toString(): string {
        // return the basic infomration to be store in the database.
        return `{"_id":"${this._id}", "name":"${this.name}", "members":${JSON.stringify(this.members)}}`
    }

    // Initialyse it from object.
    fromObject(obj: any): any{
        if (obj != undefined) {
            this._id = obj.getId();
            this.name = obj.getName();
            this.domain = obj.getDomain();
            this.members = obj.getMembersList();
        }
    }

}
