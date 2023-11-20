import { IModel } from './Model';
import { Account } from './Account';


/**
 * Role are use to manage 
 */
export class Role implements IModel {

    private _id: string = "";
    public get id(): string {
        return this._id;
    }
    public set id(value: string) {
        this._id = value;
    }

    private _name: string = "";
    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }

    private _actions: Array<string> = [];
    public get actions(): Array<string> {
        return this._actions;
    }
    public set actions(value: Array<string>) {
        this._actions = value;
    }

    constructor(){
        
    }

    /**
     * Return the list of account that can play a given role.
     * @param callback 
     * @param errorCallback 
     */
    getMembers(callback:(members:Array<Account>)=>void, errorCallback:(err:any)=>void){
        
    }

    /**
     * 
     * @returns 
     */
    toString(): string {
       let json = { _id: this.id, name: this.name, actions: this.actions };
       return JSON.stringify(json);
    }

    /**
     * Intialize the object from a json object.
     */
    fromObject(obj: any): void {
        this.id = obj._id;
        this.name = obj.name;
        this.actions = obj.actions;
    }

    static fromObject(obj: any): Role {
        let role = new Role();
        role.fromObject(obj);
        return role;
    }

}