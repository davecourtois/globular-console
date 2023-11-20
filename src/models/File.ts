import { Backend, generatePeerToken, getUrl } from '../controllers/Backend';
import { Globular } from 'globular-web-client';
import { Application } from './Application';
import { displayMessage } from "../Utility";

/**
 * Server side file accessor. That 
 */
export class File {

    // Must be implemented by the application level.
    public static saveLocal: (f: File, b: Blob) => void

    // Test if a local copy exist for the file.
    public static hasLocal: (path: String, callback: (exists: boolean) => void) => void;

    // Remove the local file copy
    public static removeLocal: (path: String, callback: () => void) => void;

    // The underlying globular instance.
    private _globule!: Globular;
    public get globule(): Globular {
        return this._globule;
    }

    public set globule(value: Globular) {
        this._globule = value;
    }

    // If the file is a .lnk file the lnk will contain a 
    // reference to the linked file...
    private _lnk!: File;
    public get lnk(): File {
        return this._lnk;
    }
    
    public set lnk(value: File) {
        this._lnk = value;
    }

    // return the file domain.
    public get domain(): string {
        return this.globule.domain;
    }

    private _metadata: any = {};
    public get metadata(): any {
        return this._metadata;
    }
    public set metadata(value: any) {
        this._metadata = value;
    }

    /** A file image preview */
    private _thumbnail!: string
    public get thumbnail(): string {
        return this._thumbnail;
    }
    public set thumbnail(value: string) {
        this._thumbnail = value;
    }

    /** The file path */
    private _path: string;
    public get path(): string {
        return this._path;
    }
    public set path(value: string) {
        this._path = value;
    }

    /** The name */
    private _name: string;
    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }

    /** The size */
    private _size: number = 0;
    public get size(): number {
        return this._size;
    }
    public set size(value: number) {
        this._size = value;
    }

    /** The Mode */
    private _mode: number = 0;
    public get mode(): number {
        return this._mode;
    }
    public set mode(value: number) {
        this._mode = value;
    }

    /** The mode time */
    private _modeTime!: Date;
    public get modeTime(): Date {
        return this._modeTime;
    }
    public set modeTime(value: Date) {
        this._modeTime = value;
    }

    /** The Mime type */
    private _mime!: string;
    public get mime(): string {
        return this._mime;
    }
    public set mime(value: string) {
        this._mime = value;
    }

    /** The file checksum */
    private _checksum!: string;
    public get checksum(): string {
        return this._checksum;
    }
    public set checksum(value: string) {
        this._checksum = value;
    }

    /** is dir */
    private _isDir: boolean = false;
    public get isDir(): boolean {
        return this._isDir;
    }
    public set isDir(value: boolean) {
        this._isDir = value;
    }

    private _files: File[] = [];
    public get files(): File[] {
        return this._files;
    }
    public set files(value: File[]) {
        this._files = value;
    }

    /** The file  */
    constructor(name: string, path: string, local: boolean = false, globule = Backend.globular) {

        // keep track of the origine
        this.globule = globule;

        this._name = name;
        this._path = path.split("//").join("/");

        /** Here I will initialyse the resource. */
        this.files = new Array<File>();
    }

    /**
     * Set back the file to JSON object.
     */
    toObject(): any {
        let obj = {
            isDir: this.isDir,
            mime: this.mime,
            modeTime: this.modeTime.toISOString(),
            mode: this.mode,
            name: this.name,
            path: this.path,
            size: this.size,
            domain: this.domain,
            checksum: this.checksum,
            thumbnail: this.thumbnail,
            metadata: this.metadata,

            files: new Array<any>()
        }

        for (let f of this.files) {
            obj.files.push(f.toObject())
        }

        return obj
    }

    /**
     * Stringnify a file.
     */
    toString(): string {
        let obj = this.toObject()
        return JSON.stringify(obj)
    }

    /**
     * Return the file path.
     */
    get filePath(): string {
        if (this.name == "") {
            return "/"
        }
        return this.path + "/" + this.name
    }

    /**
     * Save file local copy
     */
    keepLocalyCopy(callback: () => void) {

        let globule = this.globule
        let toast = displayMessage(`
        <style>
           
        </style>
        <div id="create-file-local-copy">
            <div>Your about to create a local copy of file </div>
            <span style="font-style: italic;" id="file-path"></span>
            <div style="display: flex; flex-direction: column; justify-content: center;">
                <img style="width: 185.31px; align-self: center; padding-top: 10px; padding-bottom: 15px;" id="thumbnail"> </img>
            </div>
            <div>Is that what you want to do? </div>
            <div style="display: flex; justify-content: flex-end;">
                <paper-button id="ok-button">Ok</paper-button>
                <paper-button id="cancel-button">Cancel</paper-button>
            </div>
        </div>
        `, 60 * 1000)


        let cancelBtn = <any>(toast.querySelector("#cancel-button"))
        cancelBtn.onclick = () => {
            toast.dismiss();
        }

        let thumbnailImg = <any>(toast.querySelector("#thumbnail"))
        thumbnailImg.src = this.thumbnail

        toast.querySelector("#file-path").innerHTML = this.name

        let okBtn = <any>(toast.querySelector("#ok-button"))
        okBtn.onclick = () => {

            // simply download the file.
            generatePeerToken(globule, (token: string) => {
                let path = this.path
                let url = getUrl(globule)

                path.split("/").forEach(item => {
                    item = item.trim()
                    if (item.length > 0) {
                        url += "/" + encodeURIComponent(item)
                    }
                })


                const req = new XMLHttpRequest();

                // Set the values also as parameters...
                url += "?domain=" + globule.domain
                url += "&application=" + Application.name
                url += "&token=" + token

                req.open("GET", url, true);

                // Set the token to manage downlaod access.
                req.setRequestHeader("token", token);
                req.setRequestHeader("application", globule.domain);
                req.setRequestHeader("domain", globule.domain);

                req.responseType = "blob";
                req.onload = (event: any) => {
                    const blob = req.response;
                    if (File.saveLocal) {
                        File.saveLocal(this, blob)
                        callback()
                    }

                };

                req.send();

            }, err => displayMessage(err, 3000))

            toast.dismiss();
        }
    }

    /**
     * remove file local copy
     */
    removeLocalCopy(callback: () => void) {

        let toast = displayMessage(`
        <style>
           
        </style>
        <div id="create-file-local-copy">
            <div>Your about to remove a local copy of file </div>
            <span style="font-style: italic;" id="file-path"></span>
            <div style="display: flex; flex-direction: column; justify-content: center;">
                <img style="width: 185.31px; align-self: center; padding-top: 10px; padding-bottom: 15px;" id="thumbnail"> </img>
            </div>
            <div>Is that what you want to do? </div>
            <div style="display: flex; justify-content: flex-end;">
                <paper-button id="ok-button">Ok</paper-button>
                <paper-button id="cancel-button">Cancel</paper-button>
            </div>
        </div>
        `, 60 * 1000)

        if(!toast){
            return;
        }

        let cancelBtn = <any>(toast.querySelector("#cancel-button"))
        cancelBtn.onclick = () => {
            toast.dismiss();
        }

        let thumbnailImg = <any>(toast.querySelector("#thumbnail"))
        thumbnailImg.src = this.thumbnail

        toast.querySelector("#file-path").innerHTML = this.name

        let okBtn = <any>(toast.querySelector("#ok-button"))
        okBtn.onclick = () => {
            if (File.removeLocal) {
                File.removeLocal(this.path, () => {
                    displayMessage(`local copy of ${this.path} was removed`, 3000)
                    callback()
                })
            }
            toast.dismiss();
        }
    }

}