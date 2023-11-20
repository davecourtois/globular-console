import { Globular } from "globular-web-client"
import { GetTitleFilesRequest, Video, Audio, GetVideoByIdRequest, GetAudioByIdRequest, GetFileTitlesRequest, GetFileVideosRequest } from "globular-web-client/title/title_pb"
import { Backend, generatePeerToken } from "./Backend"
import { Application } from "src/models/Application"

// this is a hack to store the videos and audios in memory
let __videos__: { [key: string]: any } = {};
let __audios__: { [key: string]: any } = {};


export class TitleController {

    static setVideo(video: Video) {
        __videos__[video.getId()] = video
    }

    static setAudio(audio: Audio) {
        __audios__[audio.getId()] = audio
    }

    // get files associated with the titles, audios or videos...
    static getTitleFiles(id: string, indexPath: string, globule: Globular, callback: (files: string[]) => void, errorCallback: (err: any) => void) {
        let rqst = new GetTitleFilesRequest
        rqst.setTitleid(id)
        rqst.setIndexpath(indexPath)
        generatePeerToken(globule, token => {
            if (globule.titleService == null) return errorCallback("Title service is not available")

            // get the files associated with the title
            globule.titleService.getTitleFiles(rqst, { application: Application.name, domain: Backend.domain, token: token })
                .then(rsp => {
                    callback(rsp.getFilepathsList())
                }).catch(err => {
                    callback([])
                })

        }, errorCallback)
    }

    static getFileVideos(path: string, globule: Globular, callback: (videos: Video[]) => void, errorCallback: (err: any) => void) {

        generatePeerToken(globule, token => {

            if (globule.titleService == null) return callback([])

            let rqst = new GetFileVideosRequest
            rqst.setIndexpath(globule.config.DataPath + "/search/videos")
            rqst.setFilepath(path)

            globule.titleService.getFileVideos(rqst, { application: Application.name, domain: Backend.domain, token: token })
                .then(rsp => {

                    let videos = rsp.getVideos()
                    if (!videos) return callback([])
                    // rsp.getVideos().getVideosList().forEach(v => v.globule = globule)

                    callback(videos.getVideosList())
                })
        }, errorCallback)
    }

    /**
     * Retrieve the video information from the backend
     * @param globule The globule instance
     * @param id The video id
     * @param callback The success callback
     * @param errorCallback The error callback
     * @returns 
     */
    static getVideoInfo(id: string, callback: (video?: Video) => void, errorCallback: (err: any) => void, globule?: Globular) {

        if (__videos__[id]) {
            callback(__videos__[id])
            return
        }

        if (globule == null) return callback(undefined)

        // get the video information from the backend
        generatePeerToken(globule, token => {
            if (globule.titleService == null) return errorCallback("Title service is not available")

            let rqst = new GetVideoByIdRequest
            rqst.setIndexpath(globule.config.DataPath + "/search/videos")
            rqst.setVidoeid(id)

            globule.titleService.getVideoById(rqst, { application: Application.name, domain: globule.domain, token: token })
                .then(rsp => {
                    let video = rsp.getVideo()
                    if (video == null) return callback(undefined)

                    callback(video)
                })
                .catch(errorCallback)
        }, errorCallback)
    }

    /**
     * Retrieve the audio information from the backend
     * @param globule The globule instance
     * @param id The audio id
     * @param callback The success callback
     * @param errorCallback The error callback
     * @returns 
     */
    static getAudioInfo(id: string, callback: (audio?: Audio) => void, errorCallback: (err: any) => void, globule?: Globular) {
        if (__audios__[id]) {
            callback(__audios__[id])
            return
        }

        if (globule == null) return callback(undefined)

        generatePeerToken(globule, token => {
            if (globule.titleService == null) return errorCallback("Title service is not available")

            let rqst = new GetAudioByIdRequest
            rqst.setIndexpath(globule.config.DataPath + "/search/audios")
            rqst.setAudioid(id)

            globule.titleService.getAudioById(rqst, { application: Application.name, domain: globule.domain, token: token })
                .then(rsp => {
                    let audio = rsp.getAudio()
                    if (audio == null) return callback(undefined)
                    callback(audio)
                })
                .catch(errorCallback)
        }, errorCallback)
    }

}