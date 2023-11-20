import { Globular } from "globular-web-client"
import { Backend, generatePeerToken, getUrl } from "./Backend"
import { GetFileInfoRequest, ReadFileRequest, FileInfo } from "globular-web-client/file/file_pb"
import { Application } from "globular-web-client/resource/resource_pb"
import { File } from "src/models/File"
import { mergeTypedArrays, uint8arrayToStringMethod } from "src/Utility"
import { readDir } from "globular-web-client/api"

export class FileController {

    // If the file does not really exist on the server It can be keep in that map.
    private static _local_files: any = {}

    /**
     * Retrun the file from a given path.
     * @param globule 
     * @param path 
     * @param callback 
     * @param errorCallback 
     */
    static getFile(globule: Globular, path: string, thumbnailWith: number, thumbnailHeight: number, callback: (f: File) => void, errorCallback: (err: string) => void) {
        // The globule must be defined.
        if (!globule) {
            return errorCallback("Globule must be defined.")
        }

        generatePeerToken(globule, token => {

            let rqst = new GetFileInfoRequest()
            rqst.setPath(path)
            rqst.setThumnailheight(thumbnailHeight)
            rqst.setThumnailwidth(thumbnailWith)

            if (!globule.fileService) {
                errorCallback("File service not initialized.")
                return
            }

            globule.fileService.getFileInfo(rqst, { application: Application.name, domain: globule.domain, token: token })
                .then(rsp => {
                    let info = rsp.getInfo()
                    if (info == null) {
                        errorCallback("File not found.")
                        return
                    }

                    let f = FileController.fromObject(info.toObject())
                    f.globule = globule;

                    callback(f);
                })
                .catch(e => {
                    errorCallback(e)
                })
        }, errorCallback)
    }

    /**
     * Static function's
     */
    static readDir(path: string, recursive: boolean, callback: (dir: File) => void, errorCallback: (err: any) => void, globule?: Globular) {
        // The globule must be defined.
        if (!globule) {
            return errorCallback("Globule must be defined.")
        }

        // So here I will get the dir of the current user...
        generatePeerToken(globule, token => {

            if (!globule) {
                return errorCallback("Globule must be defined.")
            }

            path = path.replace(globule.config.DataPath + "/files/", "/")

            let id = globule.domain + "@" + path
            if (FileController._local_files[id] != undefined) {
                callback(FileController._local_files[id])
                return
            }

            readDir(globule, path, recursive, (dir: FileInfo) => {
                if (!globule) {
                    globule = Backend.globular
                }
                let local = Backend.globular.domain == globule.domain
                let f = FileController.fromObject(dir.toObject(), local, globule)
                callback(f)
            }, errorCallback, 80, 80, token)
        }, errorCallback)
    }

    static readText(file: File, callback: (text: string) => void, errorCallback: (err: any) => void) {
        
        let globule = Backend.globular
        if (!file.globule) {
            globule = file.globule
        }

        // Read the file...
        let url = getUrl(globule)

        file.path.split("/").forEach(item => {
            url += "/" + encodeURIComponent(item.trim())
        })

        // Generate peer token.
        generatePeerToken(globule, token => {

            let rqst = new ReadFileRequest
            rqst.setPath(file.path)
            let data: any = []

            // do nothing if no file service was initialized.
            if (!globule.fileService) {
                errorCallback("File service not initialized.")
                return
            }

            let stream = globule.fileService.readFile(rqst, { application: Application.name, domain: globule.domain, token: token })
            // Here I will create a local event to be catch by the file uploader...
            stream.on("data", (rsp) => {
                data = mergeTypedArrays(data, rsp.getData());
            })

            stream.on("status", (status) => {
                if (status.code == 0) {
                    uint8arrayToStringMethod(data, (str) => {
                        callback(str);
                    });
                } else {
                    // In case of error I will return an empty array
                    errorCallback(status.details)
                }
            });

        }, errorCallback)
    }

    /**
    * Create instance of File class from JSON object.
    * @param obj The JSON object.
    */
    static fromObject(obj: any, local?: boolean, globule?: Globular): any {

        // If the globule is not defined I will use the default one.
        if (obj.domain) {
            globule = Backend.getGlobule(obj.domain)
        } else {
            globule = Backend.globular
        }

        const file = new File(obj.name, obj.path, local, globule)
        file.isDir = obj.isDir
        file.mime = obj.mime
        file.modeTime = new Date(obj.modeTime * 1000)
        file.mode = obj.mode
        file.size = obj.size
        file.thumbnail = obj.thumbnail
        file.checksum = obj.checksum
        file.metadata = obj.metadata

        // Now the sub-file.
        if (file.isDir && obj.filesList != null) {
            for (let o of obj.filesList) {
                let g = globule
                if (o.domain) {
                    g = Backend.getGlobule(o.domain)
                }

                let f = <File>FileController.fromObject(o, local, g)
                file.files.push(f)
            }
        }

        if (local) {
            let id = globule.domain + "@" + obj.path
            FileController._local_files[id] = this
        }

        return file
    }

    /**
     * Create instance of File from string.
     * @param str 
     */
    static fromString(str: string): any {
        let file = FileController.fromObject(JSON.parse(str))
        return file
    }

}