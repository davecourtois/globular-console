

import { generatePeerToken, getUrl, Backend } from '../controllers/Backend';
import { TitleController } from '../controllers/Title';
import { File } from "../models/File"
import { FileController } from "../controllers/File"
import { fireResize } from "../Utility"
import { displayMessage } from '../Utility';
import { PlayList } from "./playlist"
import { Dialog } from "./dialog"

// external libraries
import Plyr from 'plyr';
import Hls from "hls.js";
import { Poster, Video } from 'globular-web-client/title/title_pb';
import { Application } from 'globular-web-client/resource/resource_pb';

Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get: function () {
        return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
    }
})

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};



export function playVideos(videos, name) {

    let videos_ = [...new Map(videos.map(v => [v.getId(), v])).values()]

    // here I will get the audi
    let video_playList = "#EXTM3U\n"
    video_playList += "#PLAYLIST: " + name + "\n\n"

    // Generate the playlist with found video items.
    let generateVideoPlaylist = () => {
        let video = videos_.pop();
        let globule = video.globule;

        // set the video info
        let indexPath = globule.config.DataPath + "/search/videos"

        // get the title file path...
        TitleController.getTitleFiles(video.getId(), indexPath, globule, files => {

            if (files.length > 0) {
                video_playList += `#EXTINF:${video.getDuration()}, ${video.getDescription()}, tvg-id="${video.getId()}"\n`

                let url = getUrl(globule)

                if (!files[0].endsWith(".mp4")) {
                    files[0] += "/playlist.m3u8"
                }
                let path = files[0].split("/")
                path.forEach(item => {
                    item = item.trim()
                    if (item.length > 0)
                        url += "/" + encodeURIComponent(item) //* fail to parse if the item is encoded...
                })

                video_playList += url + "\n\n"
            }
            if (videos_.length > 0) {
                generateVideoPlaylist()
            } else {

                playVideo(video_playList, null, null, null, globule)
            }
        })
    }

    generateVideoPlaylist()
}


/**
 * Function to play a video on the same player.
 * @param {*} path 
 * @param {*} onplay 
 * @param {*} onclose 
 */
export function playVideo(path, onplay, onclose, title, globule) {

    if (title) {
        if (title.globule) {
            globule = title.globule
        } else if (globule != null) {
            title.globule = globule
        }
    }

    let menus = document.body.querySelectorAll("globular-dropdown-menu")
    for (var i = 0; i < menus.length; i++) {
        menus[i].close()
        if (menus[i].classList.contains("file-dropdown-menu")) {
            menus[i].parentNode.removeChild(menus[i])
        }
    }

    let videoPlayer = document.getElementById("video-player-x")

    if (videoPlayer == null) {
        videoPlayer = new VideoPlayer()
        videoPlayer.id = "video-player-x"
    } else {
        videoPlayer.stop()
    }

    videoPlayer.hide()
    videoPlayer.resume = false;
    videoPlayer.style.zIndex = 100

    if (onplay && !videoPlayer.onplay) {
        videoPlayer.onplay = onplay
    }

    // keep the title
    videoPlayer.titleInfo = title;
    videoPlayer.globule = globule;

    if (onclose && !videoPlayer.onclose) {
        videoPlayer.onclose = onclose
    }

    // clear the playlist...
    if (videoPlayer.playlist)
        videoPlayer.playlist.clear()

    // play a given title.
    if (path.endsWith("video.m3u") || path.startsWith("#EXTM3U")) {
        videoPlayer.loadPlaylist(path, globule)
    } else {
        // make sure the player is not show before the video is loaded.
        videoPlayer.play(path, globule)
    }

    return videoPlayer
}


function getSubtitlesFiles(globule, path, callback) {
    let subtitlesPath = path.substr(0, path.lastIndexOf("."))
    subtitlesPath = subtitlesPath.substring(0, subtitlesPath.lastIndexOf("/") + 1) + ".hidden" + subtitlesPath.substring(subtitlesPath.lastIndexOf("/")) + "/__subtitles__"
    FileController.readDir(subtitlesPath, false, callback, err => console.log(err), globule)
}

function getThumbnailFiles(globule, path, callback) {
    let subtitlesPath = path.substr(0, path.lastIndexOf("."))
    subtitlesPath = subtitlesPath.substring(0, subtitlesPath.lastIndexOf("/") + 1) + ".hidden" + subtitlesPath.substring(subtitlesPath.lastIndexOf("/")) + "/__thumbnail__"
    FileController.readDir(subtitlesPath, false, callback, err => console.log(err), globule)
}

/**
 * The video player web component.
 */
export class VideoPlayer extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        let hideheader = this.getAttribute("hideheader") != undefined
        this.titleInfo = null; // movie, serie title, video
        this.globule = null;
        this.skipPresiousBtn = null;
        this.stopBtn = null;
        this.skipNextBtn = null;
        this.loopBtn = null;
        this.shuffleBtn = null;
        this.trackInfo = null;
        this.loop = true;
        this.shuffle = false;
        this.resume = false;

        // HLS for streamming...
        this.hls = null;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            @import url('./styles.css')    
            @import url('https://cdn.plyr.io/3.5.6/plyr.css');
                
            #container{
                position: relative;
                user-select: none;
                background-color: black;
            }

            #content{
                display: flex;
                background-color: black;
                justify-items: center;
                align-items: center;
                background-color: black;
                color: var(--palette-text-primary);
                width: 100%;
                height: 100%;
            }

            .header{
                display: flex;
                align-items: center;
                color: var(--palette-text-accent);
                background-color: var(--palette-primary-accent);
                border-top: 1px solid var(--palette-action-disabled);
                border-left: 1px solid var(--palette-action-disabled);
            }

            .header span{
                flex-grow: 1;
                text-align: center;
                font-size: 1.1rem;
                font-weight: 500;
                display: inline-block;
                white-space: nowrap;
                overflow: hidden !important;
                text-overflow: ellipsis;
            }

            .header paper-icon-button {
                min-width: 40px;
            }

            .header select {
                background: var(--palette-background-default); 
                color: var(--palette-text-accent);
                border:0px;
                outline:0px;
            }

            .header paper-icon-button {
                min-width: 40px;
            }

            video {
                display: block;
                width:100%;
                position: "absolute";
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
               
                
            }
            
            @media (max-width: 600px) {
                #container{
                    width: 100vw;
                }

                #content{
                    flex-direction: column-reverse;
                }

                globular-playlist {
                    min-width: 450px;
                }
            }

            @media (min-width: 600px) {
                globular-playlist {
                    min-width: 450px;
                }
            }

            paper-card {
                background: black; 
            }

        </style>
        <globular-dialog name="video-player" id="container" name="video-player" background-color="black" is-moveable="true" is-resizeable="true" show-icon="true" is-minimizeable="true">
                <select  slot="header" id="audio-track-selector" style="display: none"></select>
                <paper-icon-button slot="header" id="title-info-button" icon="icons:arrow-drop-down-circle"></paper-icon-button>
                <img slot="icon" src="assets/icons/play-flat.svg"/>
                <span id="title-span" slot="title">Video Player</span>
                <div id="content">
                    <slot name="playlist"></slot>
                    <slot name="tracks"></slot>
                    <slot></slot>
                </div>
        </globular-dialog>
        `

        this.container = this.shadowRoot.querySelector("#container")
        this.container.getPreview = this.getPreview.bind(this);


        this.container.addEventListener("dialog-resized", evt => {
            evt.stopPropagation()

            // set the container to fit the video height.
            this.container.setHeight("auto")
            if (this.video.offsetHeight > 0)
                this.playlist.style.height = this.video.offsetHeight + "px"

        })

        this.container.onclick = (evt) => {
            evt.stopPropagation()
            // not interfere with plyr click event... do not remove this line.
        }

        this.shadowRoot.querySelector("#title-span").innerHTML = "video player"
        this.content = this.shadowRoot.querySelector("#content")
        this.shadowRoot.querySelector("#title-info-button").onclick = (evt) => {
            evt.stopPropagation()
            if (this.titleInfo) {
                if (this.titleInfo.clearActorsList != undefined) {
                    this.showTitleInfo(this.titleInfo)
                } else {
                    this.showVideoInfo(this.titleInfo)
                }
            } else {
                displayMessage("no title information found", 3000)
            }
        }

        // give the focus to the input.
        this.video = document.createElement("video")
        this.video.id = "player"
        this.video.autoplay = true
        this.video.controls = true
        this.video.playsinline = true

        this.onclose = null
        this.onplay = null
        this.path = ""
        this.container.name = "video_player"

        if (localStorage.getItem("__video_player_dimension__")) {

            let dimension = JSON.parse(localStorage.getItem("__video_player_dimension__"))
            if (!dimension) {
                dimension = { with: 600, height: 400 }
            }

            // be sure the dimension is no zeros...
            if (dimension.width < 600) {
                dimension.width = 600
            }

            this.container.style.width = dimension.width + "px"
            localStorage.setItem("__notification_editor_dimension__", JSON.stringify({ width: dimension.width, height: dimension.height }))
        } else {
            this.container.style.width = "600px"
            localStorage.setItem("__notification_editor_dimension__", JSON.stringify({ width: 600, height: 400 }))
        }

        // Set the video to full screen when orientation change.
        window.addEventListener("orientationchange", (event) => {
            var orientation = (screen.orientation || {}).type || screen.mozOrientation || screen.msOrientation;

            if (["landscape-primary", "landscape-secondary"].indexOf(orientation) != -1) {
                this.becomeFullscreen();
            }

            else if (orientation === undefined) {
                console.log("The orientation API isn't supported in this browser :(");
            }
        });

        // set the initial size of the video player to fit the played video...
        this.video.onplaying = (evt) => {

            if (this.resume) {
                this.show()
                return
            }

            this.resume = true
            let w = window.innerWidth;
            if (w < 500) {
                this.container.style.width = "100vw"
            } else {
                if (this.video.videoHeight > 0 && this.video.videoWidth > 0) {

                    let height = this.video.videoHeight
                    let maxWidth = this.video.videoWidth

                    if (maxWidth > screen.width) {
                        maxWidth = screen.width
                        height = maxWidth * (this.video.videoHeight / this.video.videoWidth)
                    }

                    if (this.video.videoHeight > screen.height - 250) {
                        height = screen.height - 250
                        maxWidth = height * (this.video.videoWidth / this.video.videoHeight)
                    }

                    if (this.playlist.style.display != "none") {
                        if (maxWidth + this.playlist.offsetWidth < screen.width) {
                            this.playlist.__width__ = this.playlist.offsetWidth
                            maxWidth += this.playlist.offsetWidth
                        }
                    } else if (this.playlist.count() > 1) {
                        maxWidth += this.playlist.__width__
                    }

                    this.container.setMaxWidth(maxWidth)

                }

                this.container.setHeight("auto")
                this.container.hideVerticalResize()

                // event resize the video only if the video is new...
                this.playlist.style.height = this.content.offsetHeight + "px"
            }

            this.show()
        }

        // toggle full screen when the user double click on the header.
        /*this.header.ondblclick = () => {
            var type = this.player.media.tagName.toLowerCase(),
                toggle = document.querySelector("[data-plyr='fullscreen']");

            if (type === "video" && toggle) {
                toggle.addEventListener("click", this.player.toggleFullscreen, false);
            }
            toggle.click()
        }*/


        this.container.onclose = () => {
            this.close()
        }

        // https://www.tomsguide.com/how-to/how-to-set-chrome-flags
        // you must set enable-experimental-web-platform-features to true
        // chrome://flags/ 
        this.video.onloadeddata = () => {

            getSubtitlesFiles(this.globule, this.path, subtitles_files => {

                let globule = this.globule
                let url = getUrl(globule)

                subtitles_files.files.forEach(f => {
                    let track = document.createElement("track")
                    //   <track kind="captions" label="English captions" src="/path/to/captions.vtt" srclang="en" default />
                    track.kind = "captions"

                    // ex. View_From_A_Blue_Moon_Trailer-576p.fr.vtt
                    let language_id = f.name.split(".")[f.name.split.length - 1]
                    const languageNames = new Intl.DisplayNames([language_id], {
                        type: 'language'
                    });

                    track.label = languageNames.of(language_id)// todo set the true language.

                    let url_ = f.path

                    url_ = f.path
                    if (url_.startsWith("/")) {
                        url_ = url + url_
                    } else {
                        url_ = url + "/" + url_
                    }

                    track.src = url_

                    track.srclang = language_id

                    this.player.media.appendChild(track)

                })
            })

            if (this.video.audioTracks) {

                // This will set the video langual...
                if (this.video.audioTracks.length > 1) {
                    let audioTrackSelect = this.shadowRoot.querySelector("#audio-track-selector")
                    audioTrackSelect.style.display = "block"
                    for (let i = 0; i < this.video.audioTracks.length; i++) {
                        let track = this.video.audioTracks[i]
                        let option = document.createElement("option")
                        option.innerHTML = track.language
                        option.value = i
                        audioTrackSelect.appendChild(option)
                    }

                    // Set the language with the browser
                    let browser_language = navigator.language || navigator.userLanguage; // IE <= 10
                    for (let i = 0; i < this.video.audioTracks.length; i++) {
                        let track_language = this.video.audioTracks[i].language.substr(0, 2);

                        // +++ Set the enabled audio track language +++
                        if (track_language) {
                            // When the track language matches the browser language, then enable that audio track
                            if (track_language === browser_language) {
                                // When one audio track is enabled, others are automatically disabled
                                this.video.audioTracks[i].enabled = true;
                                audioTrackSelect.value = i
                                this.player.rewind(0)
                            } else {
                                this.video.audioTracks[i].enabled = false;
                            }
                        }
                    }

                    audioTrackSelect.onchange = (evt) => {
                        evt.stopPropagation()
                        if (this.player) {

                            var selectElement = evt.target;
                            var value = selectElement.value;
                            for (let i = 0; i < this.video.audioTracks.length; i++) {
                                let track = this.video.audioTracks[i]
                                if (i == value) {
                                    track.enabled = true

                                    this.player.forward(0)
                                } else {
                                    track.enabled = false
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    connectedCallback() {


        if (this.skipPresiousBtn) {
            return
        }

        this.appendChild(this.video)


        // Plyr give a nice visual to the video player.
        // TODO set the preview and maybe quality bitrate if possible...
        // So here I will get the vtt file if one exist...
        this.player = new Plyr(this.video, {
            captions: {
                active: true,
                update: true,// THAT line solved my problem
            }
        });


        // hide plyr function not us
        let items = this.querySelectorAll(".plyr__controls__item")
        for (var i = 0; i < items.length; i++) {
            if (items[i].getAttribute("data-plyr") == "pip") {
                items[i].style.display = "none"
            }
        }

        let controls = this.querySelector(".plyr__controls")
        controls.style.flexWrap = "wrap"
        controls.style.justifyContent = "flex-start"

        let plyrVideo = this.querySelector(".plyr--video")
        plyrVideo.style.backgroundColor = "black"

        // add the playlist...
        this.playlist = new PlayList() //this.querySelector("globular-playlist")
        this.playlist.slot = "playlist"
        this.playlist.videoPlayer = this
        this.appendChild(this.playlist)

        this.playlist.slot = "playlist"
        this.playlist.style.display = "none"
        this.playlist.style.alignSelf = "flex-start"
        this.playlist.overflow = "hidden"

        // add additional button for the playlist...
        let html = `
            <div style="flex-basis: 100%; height: 5px;"></div>
            <iron-icon style="--iron-icon-height: 32px; --iron-icon-width: 32px; fill: #424242;" class="plyr__controls__item plyr__control" title="Shuffle Playlist" id="shuffle" icon="av:shuffle"></iron-icon>
            <iron-icon style="--iron-icon-height: 32px; --iron-icon-width: 32px;" class="plyr__controls__item plyr__control" id="skip-previous" title="Previous Track" icon="av:skip-previous"></iron-icon>
            <iron-icon style="--iron-icon-height: 32px; --iron-icon-width: 32px;" class="plyr__controls__item plyr__control" id="skip-next" title="Next Track" icon="av:skip-next"></iron-icon>
            <iron-icon style="--iron-icon-height: 32px; --iron-icon-width: 32px;" class="plyr__controls__item plyr__control" id="stop" title="Stop" icon="av:stop"></iron-icon>
            <iron-icon style="--iron-icon-height: 32px; --iron-icon-width: 32px;" class="plyr__controls__item plyr__control" title="Loop Playlist" id="repeat" icon="av:repeat"></iron-icon>
            <div id="track-info"></div>
        `

        let range = document.createRange()
        controls.appendChild(range.createContextualFragment(html))

        // Now the buttons actions.
        this.skipPresiousBtn = this.querySelector("#skip-previous")
        this.stopBtn = this.querySelector("#stop")
        this.skipNextBtn = this.querySelector("#skip-next")
        this.loopBtn = this.querySelector("#repeat")
        this.shuffleBtn = this.querySelector("#shuffle")
        this.trackInfo = this.querySelector("#track-info")
        if (this.playlist.count() <= 1) {
            this.hidePlaylist()
        }

        let playPauseBtn = controls.children[0]
        playPauseBtn.addEventListener("click", evt => {

            let state = evt.target.getAttribute("aria-label")
            if (state == "Play") {
                this.playlist.resumePlaying()
            } else if (state == "Pause") {
                this.playlist.pausePlaying()
            }

        }, true)

        plyrVideo.addEventListener("click", evt => {
            let state = playPauseBtn.getAttribute("aria-label")
            if (state == "Play") {
                this.playlist.resumePlaying()
            } else if (state == "Pause") {
                this.playlist.pausePlaying()
            }

        }, true)

        this.loop = false
        if (localStorage.getItem("video_loop")) {
            this.loop = localStorage.getItem("video_loop") == "true"
        }

        if (this.loop) {
            this.loopBtn.style.fill = "white"
        } else {
            this.loopBtn.style.fill = "gray"
        }

        this.shuffle = false
        if (localStorage.getItem("video_shuffle")) {
            this.shuffle = localStorage.getItem("video_shuffle") == "true"
        }

        if (this.shuffle) {
            this.shuffleBtn.style.fill = "white"
        } else {
            this.shuffleBtn.style.fill = "#424242"
        }

        // stop the audio player....
        this.stopBtn.onclick = () => {
            this.stop()
            if (this.playlist) {
                this.playlist.stop()
            }
            this.trackInfo.innerHTML = ""
        }

        this.skipNextBtn.onclick = () => {
            this.stop()
            if (this.playlist) {
                this.playlist.playNext()
            }
        }

        this.skipPresiousBtn.onclick = () => {
            this.stop()
            if (this.playlist) {
                this.playlist.playPrevious()
            }
        }

        // loop...
        this.loopBtn.onclick = () => {

            if (this.loop) {
                localStorage.setItem("video_loop", "false");
                this.loop = false;
            } else {
                localStorage.setItem("video_loop", "true")
                this.loop = true;
            }

            if (this.loop) {
                this.loopBtn.style.fill = "white"
            } else {
                this.loopBtn.style.fill = "#424242"
            }

        }

        this.shuffleBtn.onclick = () => {
            if (this.shuffle) {
                localStorage.setItem("video_shuffle", "false");
                this.shuffle = false;
            } else {
                localStorage.setItem("video_shuffle", "true")
                this.shuffle = true;
            }

            if (this.shuffle) {
                this.shuffleBtn.style.fill = "white"
            } else {
                this.shuffleBtn.style.fill = "#424242"
            }

            this.playlist.orderItems()
        }


        // Now I will test if there are some tracks to play...
        const trackSlot = this.shadowRoot.querySelector('slot[name="tracks"]');
        if (trackSlot.assignedNodes().length > 0) {

            // Now I will generate the playlist...
            let video_playList = "#EXTM3U\n"
            video_playList += "#PLAYLIST: " + name + "\n\n"
            let videos = []

            let setTrackDuration = (a, callback) => {
                console.log("play video " + a.getUrl())
                this.video.src = a.getUrl()
                this.video.onloadedmetadata = () => {
                    a.setDuration(this.video.duration)
                    callback(a)
                };
            }

            for (var i = 0; trackSlot.assignedNodes().length > i; i++) {
                let node = trackSlot.assignedNodes()[i]
                if (node.nodeName == "GLOBULAR-VIDEO-TRACK") {
                    let video = node.getVideo()
                    videos.push(video)

                    // keep the audio track in memory
                    TitleController.setVideo(video)
                }
            }

            let setvideos = (videos, callback) => {
                if (videos.length > 0) {
                    let video = videos.shift()
                    setTrackDuration(video, (v) => {
                        video_playList += `#EXTINF:${v.getDuration()}, ${v.getDescription()}, tvg-id="${v.getId()}"\n`
                        video_playList += v.getUrl() + "\n\n"
                        if (videos.length > 0) {
                            setvideos(videos, callback)
                        } else {
                            this.video.onloadedmetadata = null
                            this.video.src = ""
                            callback()
                        }
                    })
                }
            }

            if (videos.length > 0) {
                setvideos(videos, () => {
                    this.loadPlaylist(video_playList, null)
                })
            }
        }
    }

    loadPlaylist(path, globule) {
        this.playlist.clear()
        this.playlist.load(path, globule, this, () => {
            // show playlist after loading it... (hide it if number of item is less than one)
            this.showPlaylist()
        })

        // set the css value to display the playlist correctly...
        window.addEventListener("resize", (evt) => {
            let w = window.innerWidth;
            if (w < 500) {
                this.content.style.height = "calc(100vh - 100px)"
                this.content.style.overflowY = "auto"
            } else {
                this.content.style.overflowY = ""
                this.playlist.style.height = this.content.offsetHeight + "px"
            }
        })

        setTimeout(fireResize(), 500)
    }

    showPlaylist() {
        if (this.playlist.count() > 1) {
            this.playlist.style.display = "block"
            let playlistButtons = this.querySelectorAll("iron-icon")
            for (var i = 0; i < playlistButtons.length; i++) {
                playlistButtons[i].style.display = "block"
            }
        } else {
            this.hidePlaylist()
        }
    }

    hidePlaylist() {

        this.playlist.style.display = "none"
        this.shuffleBtn.style.display = "none"
        this.skipNextBtn.style.display = "none"
        this.skipPresiousBtn.style.display = "none"
        this.stopBtn.style.display = "none"
        this.loopBtn.style.display = "none"
        this.trackInfo.style.display = "none"
    }

    setTarckInfo(index, total) {
        // display the position on the list...
        console.log("set " + index + " of " + total)
    }

    showVideoInfo(video) {
        let uuid = video.getId()
        let html = `
        <paper-card id="video-info-box-dialog-${uuid}" style="background: var(--palette-background-default); ">
            <globular-informations-manager id="video-info-box"></globular-informations-manager>
        </paper-card>
        `
        let videoInfoBox = document.getElementById("video-info-box")

        if (videoInfoBox == undefined) {
            let range = document.createRange()
            document.body.appendChild(range.createContextualFragment(html))
            videoInfoBox = document.getElementById("video-info-box")
            let parent = videoInfoBox.parentNode
            if (parent) {
                parent.style.position = "fixed"
                parent.style.top = "75px"
                parent.style.left = "50%"
                parent.style.transform = "translate(-50%)"
                videoInfoBox.onclose = () => {
                    parent.parentNode.removeChild(parent)
                }
            }
        }
        videoInfoBox.setVideosInformation([video])
    }

    showTitleInfo(title) {
        let uuid = title.getId()
        let html = `
        <paper-card id="video-info-box-dialog-${uuid}" style="background-color: var(--palette-background-default);">
            <globular-informations-manager id="title-info-box"></globular-informations-manager>
        </paper-card>
        `
        let titleInfoBox = document.getElementById("title-info-box")
        if (titleInfoBox == undefined) {
            let range = document.createRange()
            document.body.appendChild(range.createContextualFragment(html))
            titleInfoBox = document.getElementById("title-info-box")
            let parent = document.getElementById("video-info-box-dialog-" + uuid)
            parent.style.position = "fixed"
            parent.style.top = "75px"
            parent.style.left = "50%"
            parent.style.transform = "translate(-50%)"

            titleInfoBox.onclose = () => {
                parent.parentNode.removeChild(parent)
            }
        }
        titleInfoBox.setTitlesInformation([title])
    }

    play(path, globule, titleInfo) {

        if (titleInfo) {
            this.titleInfo = titleInfo
        }

        if (globule) {
            generatePeerToken(globule, token => {
                let url = path;
                if (!url.startsWith("http")) {
                    url = getUrl(globule)

                    path.split("/").forEach(item => {
                        item = item.trim()
                        if (item.length > 0) {
                            url += "/" + encodeURIComponent(item)
                        }
                    })


                    url += "?application=" + Application.name
                    url += "&token=" + token

                } else {
                    var parser = document.createElement('a');

                    url += "?application=" + Application.name
                    url += "&token=" + token

                    parser.href = url
                    path = decodeURIComponent(parser.pathname)
                }

                if (this.path == path) {
                    this.resume = true;
                    this.video.play()
                    return
                } else {
                    // keep track of the current path
                    this.path = path
                    this.resume = false;
                }

                // validate url access.
                fetch(url, { method: "HEAD" })
                    .then((response) => {
                        if (response.status == 401) {
                            displayMessage(`unable to read the file ${path} Check your access privilege`, 3500)
                            this.close()
                            return
                        } else if (response.status == 200) {
                            if (FileController.hasLocal) {
                                FileController.hasLocal(path, exists => {
                                    if (exists) {
                                        // local-media
                                        this.play_(path, globule, true, token)
                                    } else {
                                        this.play_(path, globule, false, token)
                                    }
                                })
                            } else {
                                this.play_(path, globule, false, token)
                            }
                        } else {
                            throw new Error(response.status)
                        }
                    })
                    .catch((error) => {

                        displayMessage("fail to read url " + url + "with error " + error, 4000)
                        if (this.parentNode) {
                            this.parentNode.removeChild(this)
                        }
                    });

            }, err => displayMessage(err, 4000))

        } else {

            let url = titleInfo.getUrl()
            if (titleInfo) {
                this.titleInfo = titleInfo
            }

            this.play_(url, null, false, "")

        }

    }

    play_(path, globule, local = false, token) {

        this.hide()

        // replace separator...
        path = path.split("\\").join("/")

        this.style.zIndex = 100
        // Set the title...
        let thumbnailPath = path.replace("/playlist.m3u8", "")
        this.shadowRoot.querySelector("#title-span").innerHTML = thumbnailPath.substring(thumbnailPath.lastIndexOf("/") + 1)
        this.shadowRoot.querySelector("#container").style.display = ""

        // Now I will test if imdb info are allready asscociated.
        let getTitleInfo = (path, callback) => {
            // The title info is already set...
            if (this.titleInfo) {
                if (this.titleInfo.getName != undefined) {
                    this.titleInfo.isVideo = false;
                    callback([this.titleInfo])
                    return
                } else {
                    this.titleInfo.isVideo = true;
                    callback([])
                    return
                }
            }

            TitleController.getFileTitles(path, globule, (titles) => {
                callback(titles)
            })
        }


        let getVideoInfo = (path, callback) => {
            if (this.titleInfo) {
                if (this.titleInfo.getDescription != undefined) {
                    this.titleInfo.isVideo = true;
                    callback([this.titleInfo])
                    return
                } else {
                    this.titleInfo.isVideo = false;
                    callback([])
                    return
                }
            }

            TitleController.getFileVideos(path, globule, (videos) => {
                callback(videos)
            }, err => displayMessage(err, 4000))
        }

        getVideoInfo(path, videos => {
            if (videos.length > 0) {
                let video = videos.pop()
                this.titleInfo = video
                this.titleInfo.isVideo = true
                this.shadowRoot.querySelector("#title-span").innerHTML = video.getDescription().replace("</br>", " ")
                // Start where the video was stop last time... TODO 
                if (this.titleInfo) {
                    if (localStorage.getItem(this.titleInfo.getId())) {
                        let currentTime = parseFloat(localStorage.getItem(this.titleInfo.getId()))
                        this.video.currentTime = currentTime
                    }

                    this.video.onended = () => {
                        this.resume = false;
                        if (this.titleInfo)
                            localStorage.removeItem(this.titleInfo.getId())

                        if (this.playlist.items.length > 1) {
                            this.playlist.playNext()
                        } else if (this.loop) {
                            if (File.hasLocal) {
                                File.hasLocal(this.path, exists => {
                                    if (this.titleInfo) {
                                        this.play(this.path, this.titleInfo.globule)
                                    } else {
                                        this.play(this.path)
                                    }
                                })
                            } else {
                                if (this.titleInfo)
                                    this.play(this.path, this.titleInfo.globule)
                                else
                                    this.play(this.path)
                            }
                        } else {
                            this.stop()
                        }
                    }

                    let customEvent = new CustomEvent("play_video", { detail: { _id: this.titleInfo.getId(), isVideo: this.titleInfo.isVideo, currentTime: this.video.currentTime, date: new Date() } })
                    this.dispatchEvent(customEvent)
                }

            }
        })

        getTitleInfo(path, tittles => {
            if (tittles.length > 0) {
                let title = tittles.pop()
                this.titleInfo = title
                this.titleInfo.isVideo = false
                this.shadowRoot.querySelector("#title-span").innerHTML = title.getName()
                if (title.getYear()) {
                    this.shadowRoot.querySelector("#title-span").innerHTML += " (" + title.getYear() + ") "
                }
                if (title.getType() == "TVEpisode") {
                    this.shadowRoot.querySelector("#title-span").innerHTML += " S" + title.getSeason() + "E" + title.getEpisode()
                }

                if (this.onplay != null) {
                    this.onplay(this.player, title)
                }

                // Start where the video was stop last time... TODO 
                if (this.titleInfo) {
                    if (localStorage.getItem(this.titleInfo.getId())) {
                        let currentTime = parseFloat(localStorage.getItem(this.titleInfo.getId()))
                        this.video.currentTime = currentTime
                    }
                    let customEvent = new CustomEvent("play_video", { detail: { _id: this.titleInfo.getId(), isVideo: this.titleInfo.isVideo, currentTime: this.video.currentTime, date: new Date() } })
                    this.dispatchEvent(customEvent)
                }
            }
        })

        // Only HLS and MP4 are allow by the video player so if is not one it's the other...
        if (thumbnailPath.lastIndexOf(".mp4") != -1 || thumbnailPath.lastIndexOf(".MP4") != -1) {
            thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("."))
        } else if (!path.endsWith("/playlist.m3u8")) {
            path += "/playlist.m3u8"
        } else {
            if (!(path.endsWith("/playlist.m3u8") || path.endsWith(".mp4") || path.endsWith(".webm"))) {
                displayMessage("the file cannot be play by the video player", 3000)
                return
            }
        }

        thumbnailPath = thumbnailPath.substring(0, thumbnailPath.lastIndexOf("/") + 1) + ".hidden" + thumbnailPath.substring(thumbnailPath.lastIndexOf("/")) + "/__timeline__/thumbnails.vtt"

        // set the complete url.
        // Get image from the globule.
        let url = ""
        if (globule)
            url = getUrl(globule)

        if (thumbnailPath.startsWith("/")) {
            thumbnailPath = url + thumbnailPath
        } else {
            thumbnailPath = url + "/" + thumbnailPath
        }

        this.player.setPreviewThumbnails({ enabled: "true", src: thumbnailPath })

        if (!this.video.paused && this.video.currentSrc.endsWith(path)) {
            // Do nothing...
            return
        } else if (this.video.paused && this.video.currentSrc.endsWith(path)) {
            // Resume the video...
            this.video.src = this.video.currentSrc
            this.video.play()
            return
        }

        path.split("/").forEach(item => {
            item = item.trim()
            if (item.length > 0) {
                url += "/" + encodeURIComponent(item)
            }
        })


        url += "?application=" + Application.name
        url += "&token=" + token
        if (local) {
            url = "local-media://" + path
        }

        // Set the path and play.
        this.video.src = url

        if (path.endsWith(".m3u8")) {
            if (Hls.isSupported()) {
                this.hls = new Hls(
                    {
                        xhrSetup: xhr => {
                            xhr.setRequestHeader('application', Application.name)
                            xhr.setRequestHeader('token', token)
                        }
                    }
                );

                this.hls.attachMedia(this.video);

                this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                    this.hls.loadSource(url);
                    this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                        this.video.play();
                    });
                });
            }
        }


    }

    becomeFullscreen() {
        if (this.video.requestFullscreen) {
            this.video.requestFullscreen();
        } else if (this.video.mozRequestFullScreen) {
            /* Firefox */
            this.video.mozRequestFullScreen();
        } else if (this.video.webkitRequestFullscreen) {
            /* Chrome, Safari and Opera */
            this.video.webkitRequestFullscreen();
        } else if (this.video.msRequestFullscreen) {
            /* IE/Edge */
            this.video.msRequestFullscreen();
        }
    }

    getPreview() {

        let preview = document.createElement("div");
        preview.style.position = "absolute";
        preview.style.top = "24px";
        preview.style.left = "0px";
        preview.style.width = "100%";
        preview.style.height = "100%";
        preview.style.display = "flex";
        preview.style.alignItems = "center";
        preview.style.flexDirection = "column";
        preview.style.justifyContent = "flex-start";
        preview.style.userSelect = "none";

        preview.style.background = "rgba(0, 0, 0, .5)"

        let html = `
        <style>
            #container {
                position: relative;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: calc(100% - 24px);
                width: 100%;
                background-color: black;
                color: white;
            }

            </style>
            <div id="container">
                <video id="video" style="width: 100%; height: 100%;"></video>
                <div style="position: absolute; top: 10px; left: 0px; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">  
                    <iron-icon id="play-pause-btn" style="width: 64px; height: 64px; fill: white;" icon="av:pause-circle-outline"></iron-icon>
                </div>
                <div style="position: absolute; top: 5px; left: 5px; right: 5px; height: 24px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
                    <iron-icon id="skip-previous-btn" style="width: 24px; height: 24px; fill: white;" icon="av:skip-previous"></iron-icon>
                    <iron-icon id="skip-next-btn" style="width: 24px; height: 24px; fill: white;" icon="av:skip-next"></iron-icon>
                </div>
                <div style="position: absolute; bottom: 5px; left: 5px; right: 5px; height: 24px; display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
                    <paper-slider id="volume-slider" style="flex-grow: 1; height: 24px; --paper-slider-active-color: white; --paper-slider-knob-color: white; --paper-slider-knob-start-color: white; --paper-slider-pin-color: white; --paper-slider-height: 4px; --paper-slider-knob-start-border-color: white; --paper-slider-knob-start-color: white; --paper-slider-knob-start-border-color: white; --paper-slider-knob-start-color: white; --paper-slider-knob-start-border-color: white; --paper-slider-knob-start-color: white; --paper-slider-knob-start-border-color: white; --paper-slider-knob-start-color: white; --paper-slider-knob-start-border-color: white; --paper-slider-knob-start-color: white; --paper-slider-knob-start-border-color: white; --paper-slider-knob-start-color: white; --paper-slider-knob-start-border-color: white; --paper-slider-knob-start-color: white; --paper-slider-knob-start-border-color: white;" min="0" max="100" value="100" step="1"></paper-slider>
                    <iron-icon id="mute-btn" style="width: 24px; height: 24px; fill: white;" icon="av:volume-mute"></iron-icon>
                </div>
            </div>
        `

        let range = document.createRange()
        let container = range.createContextualFragment(html)
        preview.appendChild(container)

        let skipPreviousBtn = preview.querySelector("#skip-previous-btn")

        skipPreviousBtn.onclick = (evt) => {
            evt.stopPropagation()
            this.stop()
            if (this.playlist) {
                this.playlist.playPrevious()
            }
        }

        let skipNextBtn = preview.querySelector("#skip-next-btn")
        skipNextBtn.onclick = (evt) => {
            evt.stopPropagation()
            this.stop()
            if (this.playlist) {
                this.playlist.playNext()
            }
        }

        let muteBtn = preview.querySelector("#mute-btn")
        muteBtn.onclick = (evt) => {
            evt.stopPropagation()
            if (this.video.muted) {
                this.video.muted = false
                muteBtn.icon = "av:volume-up"
            } else {
                this.video.muted = true
                muteBtn.icon = "av:volume-mute"
            }
        }

        let volumeSlider = preview.querySelector("#volume-slider")
        volumeSlider.onchange = (evt) => {
            evt.stopPropagation()
            this.video.volume = volumeSlider.value / 100
        }

        let video = preview.querySelector("#video")
        video.style.width = "100%"
        video.style.height = "100%"
        video.style.objectFit = "contain"
        video.src = this.video.src

        let playPauseBtn = preview.querySelector("#play-pause-btn")
        playPauseBtn.onclick = (evt) => {
            evt.stopPropagation()

            if (video.paused) {
                video.play()
                this.video.play()
                playPauseBtn.icon = "av:pause-circle-outline"
            } else {
                video.pause()
                this.video.pause()
                playPauseBtn.icon = "av:play-circle-outline"
            }
        }

        // Add an event listener to one of the videos to handle synchronization
        this.video.ontimeupdate = () => {
            // Set the current time of the second video to match the first video
            if (!video.paused && video.currentTime != this.video.currentTime)
                video.currentTime = this.video.currentTime;
        };

        this.video.onpause = () => {
            // Pause the second video when the first video pauses
            playPauseBtn.icon = "av:play-circle-outline"
            video.pause();
        };

        this.video.onplay = () => {
            // Play the second video when the first video plays
            playPauseBtn.icon = "av:pause-circle-outline"
            video.play();
        };

        this.video.onvolumechange = () => {
            // Play the second video when the first video plays
            volumeSlider.value = this.video.volume * 100
            if (this.video.muted) {
                muteBtn.icon = "av:volume-mute"
            }
        };

        this.video.onended = () => {
            // Play the second video when the first video plays
            playPauseBtn.icon = "av:play-circle-outline"
            video.pause();
        };

        volumeSlider.value = this.video.volume * 100
        video.muted = true;

        video.currentTime = this.video.currentTime;
        if (!this.video.paused) {
            playPauseBtn.icon = "av:pause-circle-outline"
            video.play()
        } else {
            playPauseBtn.icon = "av:play-circle-outline"
            video.pause()
        }

        if (this.video.muted) {
            muteBtn.icon = "av:volume-mute"
        } else {
            muteBtn.icon = "av:volume-up"
        }

        if (!this.playlist) {
            skipNextBtn.style.display = "none"
            skipPreviousBtn.style.display = "none"
        }

        return preview
    }

    /**
     * Close the player...
     */
    close() {
        this.hide()
        this.stop()
        if (this.parentNode)
            this.parentElement.removeChild(this)

        if (this.onclose) {
            this.onclose()
        }
    }

    /**
     * Stop the video.
     */
    stop() {
        this.video.pause();
        // keep the current video location
        if (this.titleInfo != null) {
            // Stop the video
            if (this.video.duration != this.video.currentTime) {
                let customEvent = new CustomEvent('stop_video', { detail: { _id: this.titleInfo.getId(), domain: Backend.domain, isVideo: this.titleInfo.isVideo, currentTime: this.video.currentTime, date: new Date() } });
                this.dispatchEvent(customEvent);
            } else {
                let customEvent = new CustomEvent('close_video_player', { detail: { _id: this.titleInfo.getId(), domain: Backend.domain, isVideo: this.titleInfo.isVideo, currentTime: this.video.currentTime, date: new Date() } });
                this.dispatchEvent(customEvent);
            }
            // keep video info in the local storage...
            localStorage.setItem(this.titleInfo.getId(), this.video.currentTime)
        }
    }

    hide() {
        this.container.style.display = "none"
        let plyrVideo = this.querySelector(".plyr--video")
        plyrVideo.style.display = "none";
    }

    show() {
        if (this.container.classList.contains("minimized")) {
            return
        }
        this.container.style.display = ""
        let plyrVideo = this.querySelector(".plyr--video")
        plyrVideo.style.display = ""

    }

    setHeight(h) {
        this.querySelector("video").style.height = h + "px"
    }

    resetHeight() {
        this.querySelector("video").style.height = ""
    }
}

customElements.define('globular-video-player', VideoPlayer)


/**
 * The video track element...
 */
class VideoTrack extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

    }

    // The connection callback.
    connectedCallback() {

        // Create the shadow DOM content
        this.shadowRoot.innerHTML = `
        <style>
          /* Add your custom styles here */
        </style>
      `;
    }

    // return minimal audio object...
    getVideo() {
        // Create the audio object...
        let video = new Video()
        video.setId(this.getAttribute('id'))
        video.setUrl(this.getAttribute('src'))
        //video.setTitle(this.getAttribute('title'))
        video.setDescription(this.getAttribute('description'))
        let poster = new Poster
        poster.setContenturl(this.getAttribute('cover'))
        poster.setUrl(this.getAttribute('cover'))
        video.setPoster(poster)
        return video
    }
}

customElements.define('globular-video-track', VideoTrack);