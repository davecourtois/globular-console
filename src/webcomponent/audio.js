
import WaveSurfer from "wavesurfer.js";
import { File } from "../models/File";
import { secondsToTime } from './utility';
import { displayMessage, fireResize } from '../Utility';
import { TitleController } from '../controllers/Title';
import { Application } from '../models/Application';
import { generatePeerToken, getUrl } from "../controllers/Backend"
import { PlayList } from "./playlist";
import { Dialog } from "./dialog"
import { Audio, Poster } from "globular-web-client/title/title_pb";

/**
 * Play a list of audio files.
 * @param {*} audios 
 * @param {*} name 
 */
export function playAudios(audios, name) {

    let audios_ = [...new Map(audios.map(v => [v.getId(), v])).values()]

    // ApplicationView.wait("loading audios playlist...")

    // here I will get the audi
    let audio_playList = "#EXTM3U\n"
    audio_playList += "#PLAYLIST: " + name + "\n\n"

    // Generate the playlist with found audio items.
    let generateAudioPlaylist = () => {
        let audio = audios_.pop();
        let globule = audio.globule;

        // set the audio info
        let indexPath = globule.config.DataPath + "/search/audios"

        // get the title file path...
        TitleController.getTitleFiles(audio.getId(), indexPath, globule, files => {

            if (files.length > 0) {
                audio_playList += `#EXTINF:${audio.getDuration()}, ${audio.getTitle()}, tvg-id="${audio.getId()}"\n`

                let url = getUrl(globule)

                let path = files[0].split("/")
                path.forEach(item => {
                    item = item.trim()
                    if (item.length > 0)
                        url += "/" + encodeURIComponent(item) //* fail to parse if the value is encoded...
                })

                audio_playList += url + "\n\n"
            }
            if (audios_.length > 0) {
                generateAudioPlaylist()
            } else {
                // ApplicationView.resume()
                playAudio(audio_playList, null, null, null, globule)
            }

        }, err => displayMessage(err, 3000))
    }

    generateAudioPlaylist()
}

/**
 * Play an audio file, or a playlist. This function will create an audio player 
 * and append it to the workspace, or use the existing one.
 * @param {*} path The path of the audio file.
 * @param {*} onplay Callback when the audio is played.
 * @param {*} onclose Callback when the audio player is closed.
 * @param {*} title The audio info, Title object.
 * @param {*} globule The globule where the audio file is located.
 * @returns 
 */
export function playAudio(path, onplay, onclose, title, globule) {

    // get the audio player...
    let audioPlayer = document.getElementById("audio-player-x")

    if (audioPlayer == null) {
        audioPlayer = new AudioPlayer()
        audioPlayer.id = "audio-player-x"
    } else {
        audioPlayer.stop()
        audioPlayer.playlist.clear()
    }

    audioPlayer.style.zIndex = 100


    if (onplay && !audioPlayer.onplay) {
        audioPlayer.onplay = onplay
    }

    if (onclose && !audioPlayer.onclose) {
        audioPlayer.onclose = onclose
    }

    if (audioPlayer.playlist)
        audioPlayer.playlist.clear()

    // play a given title.
    if (path.endsWith("audio.m3u") || path.startsWith("#EXTM3U")) {
        audioPlayer.loadPlaylist(path, globule)

    } else {
        if (File.hasLocal) {
            File.hasLocal(path, exists => {
                if (exists) {
                    audioPlayer.play(path, globule, title, true)
                } else {
                    audioPlayer.play(path, globule, title, false)
                }
            })
        } else {
            audioPlayer.play(path, globule, title, false)
        }
        audioPlayer.hidePlaylist()
    }

    // append to the workspace...
    document.body.appendChild(audioPlayer)

    return audioPlayer
}

// display the timeline and the wave of the mp3

/**
 * The audio player web component.
 */
export class AudioPlayer extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.wavesurfer = null;
        this.onMinimize = null;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            .header{
                display: flex;
                align-items: center;
                color: var(--palette-text-accent);
                background-color: var(--palette-primary-accent);
            }

            .header paper-icon-button {
                min-width: 40px;
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
                max-width: calc(100vw - 50px);
            }

            ::-webkit-scrollbar {
                width: 5px;
                height: 5px;
            }
                
            ::-webkit-scrollbar-track {
                background: var(--palette-background-default);
            }
            
            ::-webkit-scrollbar-thumb {
                background: var(--palette-divider); 
            }

            #content{
                height: 100%; /** 600px **/
                width: 100%;
                display: flex;
                background: #000000;
                justify-items: center;
                overflow: hidden;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            @media (max-width: 600px) {
                .header{
                    width: 100vw; 
                }
                
                #content{
                    overflow-y: auto;
                    width: 100vw;
                    max-width: 100vw;
                    min-width: 0px;
                    background: black;
                    flex-direction: column-reverse;
                    height: 410px;
                    overflow: hidden;
                }
            }

        </style>
        <globular-dialog name="audio-player" height="644px" id="container" is-moveable="true" show-icon="true" is-minimizeable="true">
            <span id="title-span" slot="title">no select</span>
            <img slot="icon" src="assets/icons/music-quavers-flat.svg"/>
            <div id="content">
                <slot name="playlist"></slot>
                <slot name="tracks" style="display: none;"></slot>
                <slot></slot>
            </div>
            
        </globular-dialog>
        `

        this.container = this.shadowRoot.querySelector("#container")

        this.container.onclick = (evt) => {
            evt.stopPropagation()
            // not interfere with plyr click event... do not remove this line.
        }

        // override the minimize function...
        this.container.getPreview = this.getPreview.bind(this);
        this.container.onclose = () => {
            this.close()
        }
    
        this.content = this.shadowRoot.querySelector("#content")
        this.titleSpan = this.shadowRoot.querySelector("#title-span")
    }

    // The connection callback.
    connectedCallback() {

        if (this.querySelector("audio")) {
            return;
        }

        // so here I will use the ligth dom...
        let content = `
        <style>
            /** Audio vizualizer **/
            .vz-wrapper {
                width: 100%;
                max-height: calc(100vh - 100px);
                overflow-y: auto;
                max-width: 100vw;
                padding: 0px 5px 0px 5px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background: -webkit-gradient(radial, center center, 0, center center, 460, from(#39668b), to(#000000));
                background: -webkit-radial-gradient(circle, #39668b, #000000);
                background: -moz-radial-gradient(circle, #39668b, #000000);
                background: -ms-radial-gradient(circle, #39668b, #000000);
                box-shadow: inset 0 0 160px 0 #000;
                cursor: pointer;
            }

            .vz-wrapper img {
                max-width: 300px;
                max-height: 300px;
            }

            .vz-wrapper.-canvas {
                height: initial;
                width: initial;
                background: transparent;
                box-shadow: none;
            }

            iron-icon {
                fill: white;
            }

            @media screen and (min-width: 420px) {
                .vz-wrapper { box-shadow: inset 0 0 200px 60px #000; }
            }

            .buttons{
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                margin-bottom: 10px;
            }

            .buttons iron-icon{
                transition: 0.3s;
                height: 20px;
                width: 20px;
            }

            .buttons span{
                color: white;
                font-size: .75rem;
                padding-left: 2px;
                padding-right: 2px;
            }

            .buttons iron-icon:hover{
                cursor: pointer;
                height: 24px;
                width: 24px;
            }

            .toolbar iron-icon{
                transition: 0.3s;
                height: 28px;
                width: 28px;
            }

            .toolbar iron-icon:hover{
                cursor: pointer;
                height: 32px;
                width: 32px;
            }

            .toolbar #pause, #play-arrow{
                transition: 0.3s;
                height: 40px;
                width: 40px;
            }

            .toolbar #pause:hover, #play-arrow:hover{
                cursor: pointer;
                height: 42px;
                width: 42px;
            }

            #shuffle, #skip-previous{
                padding-right: 20px;
            }

            #repeat, #skip-next{
                padding-left: 20px;
            }

            #skip-previous{
                padding-right: 10px;
            }

            #skip-next{
                padding-left: 10px;
            }

            #volume-up{
                
            }

            #controls{
                flex-grow: 1; 
                display: flex; 
                align-items: 
                center; 
                width: 100%;
                margin-right: 10px;
            }

            #waveform{
                width: 100%;
                align-self: center;
            }

            audio {
                display: none;
            }

            .album-name {
                font-size: 1.5rem;
                font-weight: 500;
                color: white;
                white-space: nowrap;
                overflow: hidden !important;
                text-overflow: ellipsis;
                text-align: center;
            }

            .album-year {
                font-size: 1.5rem;
                padding-left: 20px;
                color: white;
            }

            .album-cover {
                margin-top: 10px;
                margin-bottom: 10px;
                border: 1px solid black;
                -webkit-box-shadow: 5px 5px 15px 5px #152635;
                box-shadow: 5px 5px 15px 5px #152635;
            }

            .track-title {
                margin-top: 10px;
                font-size: 1.6rem;
                flex-grow: 1;
                color: white;
                display: inline-block;
                white-space: nowrap;
                overflow: hidden !important;
                text-overflow: ellipsis;
                text-align: center;
                white-space: initial;
            }

            #track-info{
                position: absolute;
                bottom: 10px;
                left: 20px;
                color: white;
                font-size: 1.6rem;
            }

            @media (max-width: 600px) {

                .album-year {
                    display: none;
                }

                .track-title {
                    font-size: 1.25rem;
                }

                #track-info {
                    bottom: 50px;
                    font-size: 1rem;
                }

                .vz-wrapper {
                    height: auto;
                    padding: 0px;
                    min-width: 0px;
                    overflow-y: inherit;
                }

                .vz-wrapper img {
                    max-width: 180px;
                    max-height: 180px;
                }
            }
        </style>

        <audio></audio>

        <div class="vz-wrapper" style="display: flex; justify-content: center; position: relative;">
            <div id="track-info"> </div>
            <div style="display: flex; margin-top: 10px;">
                <span class="album-name"></span>
                <span class="album-year"></span>
            </div>

            <img class="album-cover"> </img>
            <span class="track-title"> </span>

            <div id="waveform"></div>
            <div class="buttons">
                <div id="controls">
                    <paper-slider style="flex-grow: 1;"></paper-slider>
                    <div  style="display: flex; align-items: center; padding-right: 10px;">
                        <span id="current-time"></span> <span>/</span> <span id="total-time"></span>
                    </div>
                    <div style="position: relative;">
                        <iron-icon id="volume-up" icon="av:volume-up"></iron-icon>
                    </div>
                </div>
                <div class="toolbar" style="display: flex; padding-left: 10px; padding-right: 10px; align-items: center; height: 40px; margin-top: 20px;">
                    <iron-icon title="Shuffle Playlist" id="shuffle" icon="av:shuffle"></iron-icon>
                    <iron-icon id="skip-previous" title="Previous Track" icon="av:skip-previous"></iron-icon>
                    <iron-icon id="fast-rewind" title="Rewind" icon="av:fast-rewind"></iron-icon>
                    <iron-icon id="play-arrow" title="Play" icon="av:play-circle-outline"></iron-icon>
                    <iron-icon id="pause" title="Pause" style="display: none;" icon="av:pause-circle-outline"></iron-icon>
                    <iron-icon id="fast-forward" title="Foward" icon="av:fast-forward"></iron-icon>
                    <iron-icon id="skip-next" title="Next Track" icon="av:skip-next"></iron-icon>
                    <iron-icon id="stop" title="Stop" icon="av:stop"></iron-icon>
                    <iron-icon title="Loop Playlist" id="repeat" icon="av:repeat"></iron-icon>
                </div>
            </div>
        </div>
        `

        let range = document.createRange()
        this.appendChild(range.createContextualFragment(content))

        // The audio element.
        this.audio = this.querySelector("audio")

        // The current file path
        this.path = ""

        // The presentation elements...
        this.albumName = this.querySelector(".album-name")
        this.albumYear = this.querySelector(".album-year")
        this.ablumCover = this.querySelector(".album-cover")
        this.trackTitle = this.querySelector(".track-title")
        this.trackInfo = this.querySelector("#track-info")

        // Now the buttons actions.
        this.controls = this.querySelector("#controls")
        this.waveform = this.querySelector("#waveform")
        this.skipPresiousBtn = this.querySelector("#skip-previous")
        this.fastRewindBtn = this.querySelector("#fast-rewind")
        this.playBtn = this.querySelector("#play-arrow")
        this.pauseBtn = this.querySelector("#pause")
        this.stopBtn = this.querySelector("#stop")
        this.fastForwardBtn = this.querySelector("#fast-forward")
        this.skipNextBtn = this.querySelector("#skip-next")
        this.playSlider = this.querySelector("paper-slider")
        this.loopBtn = this.querySelector("#repeat")
        this.shuffleBtn = this.querySelector("#shuffle")
        this.volumeBtn = this.querySelector("#volume-up")
        this.currentTimeSpan = this.querySelector("#current-time")
        this.totalTimeSpan = this.querySelector("#total-time")

        this.playlist = new PlayList() //this.querySelector("globular-playlist")
        this.playlist.slot = "playlist"
        this.appendChild(this.playlist)

        this.playlist.audioPlayer = this

        this.loop = false
        if (localStorage.getItem("audio_loop")) {
            this.loop = localStorage.getItem("audio_loop") == "true"
        }

        if (this.loop) {
            this.loopBtn.style.fill = "white"
        } else {
            this.loopBtn.style.fill = "gray"
        }

        this.shuffle = false
        if (localStorage.getItem("audio_shuffle")) {
            this.shuffle = localStorage.getItem("audio_shuffle") == "true"
        }

        if (this.shuffle) {
            this.shuffleBtn.style.fill = "white"
        } else {
            this.shuffleBtn.style.fill = "#424242"
        }

        this.container.name = "audio_player"
        this.querySelector(".vz-wrapper").onclick = () => {
            let volumePanel = this.volumeBtn.parentNode.querySelector("#volume-panel")
            if (volumePanel) {
                volumePanel.parentNode.removeChild(volumePanel)
            }
        }

        // Actions...
        this.playBtn.onclick = (evt) => {
            evt.stopPropagation()
            this.wavesurfer.play()
            this.playBtn.style.display = "none"
            this.pauseBtn.style.display = "block"
            if (this.playlist) {
                this.playlist.resumePlaying()
            }
        }

        this.ablumCover.onclick = (evt) => {
            evt.stopPropagation()
            if (this.playBtn.style.display == "none") {
                this.pauseBtn.click()
            } else {
                this.playBtn.click()
            }

        }

        this.pauseBtn.onclick = (evt) => {
            evt.stopPropagation()
            if (this.playlist) {
                this.playlist.pausePlaying()
            }
            this.pause()
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
                localStorage.setItem("audio_loop", "false");
                this.loop = false;
            } else {
                localStorage.setItem("audio_loop", "true")
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
                localStorage.setItem("audio_shuffle", "false");
                this.shuffle = false;
            } else {
                localStorage.setItem("audio_shuffle", "true")
                this.shuffle = true;
            }

            if (this.shuffle) {
                this.shuffleBtn.style.fill = "white"
            } else {
                this.shuffleBtn.style.fill = "#424242"
            }

            this.playlist.orderItems()
        }

        // The volume button...
        this.volumeBtn.onclick = (evt) => {
            evt.stopPropagation()

            let volumePanel = this.volumeBtn.parentNode.querySelector("#volume-panel")
            if (volumePanel) {
                volumePanel.parentNode.removeChild(volumePanel)
                return
            }

            let html = `
            <paper-card id="volume-panel" style="position: absolute; top:24px; right: 0px; z-index:100">
                <div style="display: flex; align-items: center;">
                    <iron-icon id="volume-down-btn" icon="av:volume-down" style="fill: white;" ></iron-icon>
                    <paper-slider style=""></paper-slider>
                    <iron-icon id="volume-up-btn" icon="av:volume-up" style="fill: white;"></iron-icon>
                </div>
            </paper-card>
            `

            let range = document.createRange()
            this.volumeBtn.parentNode.appendChild(range.createContextualFragment(html))
            volumePanel = this.volumeBtn.parentNode.querySelector("#volume-panel")
            volumePanel.querySelector("paper-slider").max = 100

            if (this.wavesurfer.getVolume() == 0) {
                volumePanel.querySelector("#volume-down-btn").icon = "av:volume-off"
            } else {
                volumePanel.querySelector("#volume-down-btn").icon = "av:volume-down"
            }


            // set the slider position.
            volumePanel.querySelector("paper-slider").value = this.wavesurfer.getVolume() * 100

            volumePanel.querySelector("paper-slider").onclick = (evt) => {
                evt.stopPropagation()
            }

            volumePanel.querySelector("paper-slider").onchange = () => {
                let volume = Number(volumePanel.querySelector("paper-slider").value / 100)
                this.wavesurfer.setVolume(volume)
                localStorage.setItem("audio_volume", volume)

                if (volume == 0) {
                    this.volumeBtn.icon = volumePanel.querySelector("#volume-down-btn").icon = "av:volume-off"
                } else {
                    volumePanel.querySelector("#volume-down-btn").icon = "av:volume-down"
                    this.volumeBtn.icon = "av:volume-up"
                }
            }

            volumePanel.querySelector("#volume-down-btn").onclick = (evt) => {
                evt.stopPropagation()

                let volume = volumePanel.querySelector("paper-slider").value

                volume -= 10
                if (volume <= 0) {
                    this.volumeBtn.icon = volumePanel.querySelector("#volume-down-btn").icon = "av:volume-off"
                    this.wavesurfer.setVolume(0)
                    volumePanel.querySelector("paper-slider").value = 0
                } else {
                    volumePanel.querySelector("#volume-down-btn").icon = "av:volume-down"
                    this.volumeBtn.icon = "av:volume-up"
                    volumePanel.querySelector("paper-slider").value = volume
                    this.wavesurfer.setVolume(Number(volume / 100))
                }
            }

            volumePanel.querySelector("#volume-up-btn").onclick = (evt) => {
                evt.stopPropagation()

                let volume = volumePanel.querySelector("paper-slider").value
                volumePanel.querySelector("#volume-down-btn").icon = "av:volume-down"
                this.volumeBtn.icon = "av:volume-up"

                if (volume < 100) {
                    volume += 10
                    volumePanel.querySelector("paper-slider").value = volume
                    this.wavesurfer.setVolume(Number(volume / 100))
                }
            }
        }

        this.fastForwardBtn.onclick = () => {
            if (!this.wavesurfer.isPlaying()) {
                return
            }

            let position = this.playSlider.value / this.playSlider.max;
            position += .1
            if (position < 1) {
                this.wavesurfer.seekAndCenter(position)
            } else {
                this.stop()
            }
        }

        this.fastRewindBtn.onclick = () => {
            if (!this.wavesurfer.isPlaying()) {
                return
            }

            let position = this.playSlider.value / this.playSlider.max;
            position -= .1
            if (position > 0) {
                this.wavesurfer.seekAndCenter(position)
            } else {
                this.stop()
            }
        }

        this.playSlider.onmousedown = () => {
            this.playSlider.busy = true
        }

        this.playSlider.onmouseup = () => {
            this.wavesurfer.seekTo(this.playSlider.value / this.playSlider.max)
            this.playSlider.busy = false
        }

        if (this.wavesurfer) {
            return
        }

        this.wavesurfer = WaveSurfer.create({
            container: '#waveform',
            scrollParent: true,
            waveColor: '#93a1ad',
            progressColor: '#172a39',
            background: 'transparent',
            height: 70,
            cursorColor: "#1976d2",
            hideScrollbar: true,
            xhr: { cache: 'default', mode: 'no-cors' }
        });

        this.wavesurfer.on("seek", () => {
            if (!this.wavesurfer.backend.source) {
                return
            }

            if (this.wavesurfer.isPlaying()) {
                this.playBtn.style.display = "none"
                this.pauseBtn.style.display = "block"
            } else {
                this.playBtn.style.display = "block"
                this.pauseBtn.style.display = "none"
            }
        })


        this.wavesurfer.on("ready", () => {

            this.playSlider.max = this.wavesurfer.getDuration();
            if (localStorage.getItem("audio_volume")) {
                this.wavesurfer.setVolume(parseFloat(localStorage.getItem("audio_volume")))
            }

            // display the track lenght...
            let obj = secondsToTime(this.wavesurfer.getDuration())
            var hours = obj.h
            var min = obj.m
            var sec = obj.s
            let hours_ = (hours < 10) ? '0' + hours : hours;
            let minutes_ = (min < 10) ? '0' + min : min;
            let seconds_ = (sec < 10) ? '0' + sec : sec;

            this.totalTimeSpan.innerHTML = hours_ + ":" + minutes_ + ":" + seconds_;

            this.wavesurfer.play();
            this.playBtn.style.display = "none"
            this.pauseBtn.style.display = "block"

            fireResize()
        })

        // Connect the play process...
        this.wavesurfer.on("audioprocess", (position) => {

            let percent = position / this.wavesurfer.getDuration();
            if (!this.playSlider.busy)
                this.playSlider.value = position

            this.playSlider.title = parseFloat(percent * 100).toFixed(2) + "%"

            // display the track lenght...
            let obj = secondsToTime(position)
            var hours = obj.h
            var min = obj.m
            var sec = obj.s
            let hours_ = (hours < 10) ? '0' + hours : hours;
            let minutes_ = (min < 10) ? '0' + min : min;
            let seconds_ = (sec < 10) ? '0' + sec : sec;

            this.currentTimeSpan.innerHTML = hours_ + ":" + minutes_ + ":" + seconds_;
        })

        this.wavesurfer.on("finish", () => {

            if (this.playlist.items.length > 1) {
                this.playlist.playNext()
            } else if (this.loop) {
                if (File.hasLocal) {
                    File.hasLocal(this.path, exists => {
                        if (exists) {
                            this.play(this.path, this._audio_.globule, this._audio_, true)
                        } else {
                            this.play(this.path, this._audio_.globule, this._audio_, false)
                        }
                    })
                } else {
                    this.play(this.path, this._audio_.globule, this._audio_)
                }
            } else {
                this.stop()
            }
        })

        // Now I will test if there are some tracks to play...
        const trackSlot = this.shadowRoot.querySelector('slot[name="tracks"]');
        if (trackSlot.assignedNodes().length > 0) {

            // Now I will generate the playlist...
            let audio_playList = "#EXTM3U\n"
            audio_playList += "#PLAYLIST: " + name + "\n\n"
            let audios = []

            let setTrackDuration = (a, callback) => {
                this.audio.src = a.getUrl()
                this.audio.onloadedmetadata = () => {
                    a.setDuration(this.audio.duration)
                    callback(a)
                };
            }

            for (var i = 0; trackSlot.assignedNodes().length > i; i++) {
                let node = trackSlot.assignedNodes()[i]
                if (node.nodeName == "GLOBULAR-AUDIO-TRACK") {
                    let audio = node.getAudio()
                    audios.push(audio)

                    // keep the audio track in memory
                    TitleController.setAudio(audio)
                }
            }

            let setAudios = (audios, callback) => {
                if (audios.length > 0) {
                    let audio = audios.shift()
                    setTrackDuration(audio, (a) => {
                        audio_playList += `#EXTINF:${a.getDuration()}, ${a.getTitle()}, tvg-id="${a.getId()}"\n`
                        audio_playList += a.getUrl() + "\n\n"
                        if (audios.length > 0) {
                            setAudios(audios, callback)
                        } else {
                            this.audio.onloadedmetadata = null
                            this.audio.src = ""
                            callback()
                        }
                    })
                }
            }

            if (audios.length > 0) {
               
                setAudios(audios, () => {
                    this.loadPlaylist(audio_playList, null)
                })
            }
        }

        // set the css value to display the playlist correctly...
        window.addEventListener("resize", (evt) => {
            let content = this.shadowRoot.querySelector("#content")
            let w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            if (w < 500) {
                content.style.height = "calc(100vh - 100px)"
                content.style.overflowY = "auto"
                this.querySelector(".vz-wrapper").style.minWidth = "0px"
            } else if(content) {
                content.style.height = ""
                content.style.overflowY = ""
                this.querySelector(".vz-wrapper").style.minWidth = "600px"
            }
        })
    }

    // Return the preview of the dialog...
    getPreview() {
  
        let preview = document.createElement("div");
        preview.style.position = "absolute";
        preview.style.top = "0px";
        preview.style.left = "0px";
        preview.style.width = "100%";
        preview.style.height = "100%";
        preview.style.display = "flex";
        preview.style.alignItems = "center";
        preview.style.flexDirection = "column";
        preview.style.justifyContent = "flex-start";
        preview.style.userSelect = "none";

        preview.style.background = "rgba(0, 0, 0, .5)"

        if(this._audio_){
            // set the backgpound image...
            preview.style.backgroundImage = `url('${this._audio_.getPoster().getContenturl()}')`;
            preview.style.backgroundSize = "cover" /* This makes the image cover the entire container */
            preview.style.backgroundPosition = "center center" /* This centers the image */
            preview.style.backgroundBlendMode = "overlay"

            // set the title...
            let title = document.createElement("span")
            title.style.color = "white"
            title.style.fontSize = "1rem"
            title.style.fontWeight = "500"
            title.style.whiteSpace = "nowrap"
            title.style.overflow = "hidden"
            title.style.textOverflow = "ellipsis"
            title.innerHTML = this._audio_.getTitle()
            preview.appendChild(title)

            // set the artist...
            let artist = document.createElement("span")
            artist.style.color = "white"
            artist.style.fontSize = ".75rem"
            artist.style.fontWeight = "500"
            artist.style.whiteSpace = "nowrap"
            artist.style.overflow = "hidden"
            artist.style.textOverflow = "ellipsis"
            artist.innerHTML = this._audio_.getArtist()

            preview.appendChild(artist)

            // set the album...
            let album = document.createElement("span")
            album.style.color = "white"
            album.style.fontSize = ".75rem"
            album.style.fontWeight = "500"
            album.style.whiteSpace = "nowrap"
            album.style.overflow = "hidden"
            album.style.textOverflow = "ellipsis"
            album.innerHTML = this._audio_.getAlbum()
            preview.appendChild(album)

            let buttons = document.createElement("div")
            buttons.style.display = "flex"
            buttons.style.justifyContent = "center"
            buttons.style.alignItems = "center"
            buttons.style.flexDirection = "row"
            buttons.style.flexGrow = "1"

            let skipPreviousBtn = document.createElement("iron-icon")
            skipPreviousBtn.style.fill = "white"
            skipPreviousBtn.style.height = "32px"
            skipPreviousBtn.style.width = "32px"
            skipPreviousBtn.icon = "av:skip-previous"
            skipPreviousBtn.onclick = (evt) => {
                evt.stopPropagation()
                this.skipPresiousBtn.click()
                let event = new CustomEvent('refresh-preview', { bubbles: true, composed: true });
                this.container.dispatchEvent(event)
            }

            buttons.appendChild(skipPreviousBtn)
            

            let playBtn = document.createElement("iron-icon")
            playBtn.style.fill = "white"
            playBtn.style.height = "48px"
            playBtn.style.width = "48px"
            playBtn.icon = "av:play-circle-outline"
            playBtn.style.display = this.playBtn.style.display

            buttons.appendChild(playBtn)

            let pauseBtn = document.createElement("iron-icon")
            pauseBtn.style.fill = "white"
            pauseBtn.style.height = "48px"
            pauseBtn.style.width = "48px"
            pauseBtn.style.display = "none"
            pauseBtn.icon = "av:pause-circle-outline"
            pauseBtn.style.display = this.pauseBtn.style.display

            pauseBtn.onclick = (evt) => {  
                evt.stopPropagation()
                this.pauseBtn.click()
                playBtn.style.display = this.playBtn.style.display
                pauseBtn.style.display = this.pauseBtn.style.display
            }

            playBtn.onclick = (evt) => {
                evt.stopPropagation()
                this.playBtn.click()
                playBtn.style.display = this.playBtn.style.display
                pauseBtn.style.display = this.pauseBtn.style.display
            }

            buttons.appendChild(pauseBtn)

            let skipNextBtn = document.createElement("iron-icon")
            skipNextBtn.style.fill = "white"
            skipNextBtn.style.height = "32px"
            skipNextBtn.style.width = "32px"
            skipNextBtn.icon = "av:skip-next"
            skipNextBtn.onclick = (evt) => {
                evt.stopPropagation()
                this.skipNextBtn.click()
                let event = new CustomEvent('refresh-preview', { bubbles: true, composed: true });
                this.container.dispatchEvent(event)
            }

            buttons.appendChild(skipNextBtn)

            let trackInfo = document.createElement("span")
            trackInfo.style.color = "white"
            trackInfo.style.fontSize = "1rem"
            trackInfo.style.fontWeight = "500"
            trackInfo.style.whiteSpace = "nowrap"
            trackInfo.style.overflow = "hidden"
            trackInfo.style.textOverflow = "ellipsis"
            trackInfo.style.marginBottom = "16px"
            trackInfo.innerHTML = this.trackInfo.innerHTML

    
            let currentTimeSpan = document.createElement("span")
            currentTimeSpan.style.color = "white"
            currentTimeSpan.style.fontSize = ".75rem"
            currentTimeSpan.style.fontWeight = "500"
            currentTimeSpan.style.whiteSpace = "nowrap"
            currentTimeSpan.style.overflow = "hidden"
            currentTimeSpan.style.textOverflow = "ellipsis"
            currentTimeSpan.innerHTML = this.currentTimeSpan.innerHTML + " / " + this.totalTimeSpan.innerHTML

            setInterval(() => {
                currentTimeSpan.innerHTML = this.currentTimeSpan.innerHTML + " / " + this.totalTimeSpan.innerHTML
            }, 1000)

            preview.appendChild(buttons)
            preview.appendChild(trackInfo)
            preview.appendChild(currentTimeSpan)
   
        }

        return preview
    }

    setTarckInfo(index, total) {
        this.trackInfo.innerHTML = `${index + 1} / ${total}`
    }

    play(path, globule, audio, local = false) {

        if (this._audio_ && audio) {
            if (this._audio_.getId() == audio.getId() && this.wavesurfer.isPlaying()) {
                // be sure the audio player is visible...
                return
            } else if (this._audio_.getId() == audio.getId()) {

                this.wavesurfer.play()

                // Resume the audio...
                this.playBtn.style.display = "none"
                this.pauseBtn.style.display = "block"

                return
            }
        }

        if(!this.container.classList.contains("minimized")){
            this.container.style.display = "block"
        }

        this.stop()
        this.playBtn.style.display = "block"
        this.pauseBtn.style.display = "none"


        if (audio) {
            if (audio.getArtist()) {
                this.shadowRoot.querySelector("#title-span").innerHTML = audio.getArtist() + " : "
            }
            // TODO see how to get the featuring info...
            this.shadowRoot.querySelector("#title-span").innerHTML += audio.getTitle()

            this.albumName.innerHTML = audio.getAlbum()
            this.albumYear.innerHTML = ""

            if (audio.getYear() > 0)
                this.albumYear.innerHTML = audio.getYear()
            this.ablumCover.src = audio.getPoster().getContenturl()
            this.trackTitle.innerHTML = audio.getTitle()

        } else {
            let end = path.lastIndexOf("?")
            if (end == -1) {
                end = path.length
            }
        }

        if (globule) {
            generatePeerToken(globule, token => {
                let url = ""
                if (path.startsWith("http")) {
                    url = path;
                } else {

                    url = getUrl(globule)

                    //url += path
                    path.split("/").forEach(item => {
                        item = item.trim()
                        if (item.length > 0) {
                            url += "/" + encodeURIComponent(item)
                        }
                    })

                    url += "?application=" + Application.name

                }

                if (local) {
                    url = "local-media://" + path
                }

                url += "&token=" + token

                this.path = path;
                if (audio) {
                    this._audio_ = audio
                    this._audio_.globule = globule
                    this.audio.src = url
                }

                var xhr = new XMLHttpRequest();
                xhr.open('get', url, true);

                // Load the data directly as a Blob.
                xhr.responseType = 'blob';

                xhr.onload = (evt) => {
                    if (evt.target.status == 401) {
                        displayMessage(`unable to read the file ${path} Check your access privilege`, 3500)
                        this.close()
                        return
                    }
                    if (evt.target.response.size < 48000000) {
                        this.wavesurfer.loadBlob(evt.target.response);
                    } else {
                        displayMessage("this file is to large to be play by the audio player. The maximum size is 24MB for audio file", 3000)
                    }

                };

                xhr.send();
            })
        } else {
            
            let url = audio.getUrl()
            this.path = url;
            if (audio) {
                this._audio_ = audio
                this.audio.src = url
            }

            var xhr = new XMLHttpRequest();
            xhr.open('get', url, true);

            // Load the data directly as a Blob.
            xhr.responseType = 'blob';

            xhr.onload = (evt) => {
                if (evt.target.status == 401) {
                    displayMessage(`unable to read the file ${path} Check your access privilege`, 3500)
                    this.close()
                    return
                }
                if (evt.target.response.size < 48000000) {
                    this.wavesurfer.loadBlob(evt.target.response);
                } else {
                    displayMessage("this file is to large to be play by the audio player. The maximum size is 24MB for audio file", 3000)
                }
            };

            xhr.send();
        }

        // be sure the preview is updated...
        let event = new CustomEvent('refresh-preview', { bubbles: true, composed: true });
        this.container.dispatchEvent(event)
    }

    // load the playlist...
    loadPlaylist(path, globule) {
        this.playlist.clear()
        this.playlist.load(path, globule, this, () => this.showPlaylist())



    }

    // Pause the player...
    pause() {
        this.wavesurfer.pause()
        this.playBtn.style.display = "block"
        this.pauseBtn.style.display = "none"
    }

    /**
     * Close the player...
     */
    close() {
        this.stop()
        this.path = ""
        this._audio_ = null;
        this.parentElement.removeChild(this)
        if (this.onclose) {
            this.onclose()
        }
    }

    stop() {

        this.playSlider.value = 0;
        if (this.wavesurfer) {
            this.wavesurfer.stop()
            this.wavesurfer.seekAndCenter(0)
        }

        this.playBtn.style.display = "block"
        this.pauseBtn.style.display = "none"

    }

    hidePlaylist() {
        this.playlist.style.display = "none"
        this.shuffleBtn.style.display = "none"
        this.skipNextBtn.style.display = "none"
        this.skipPresiousBtn.style.display = "none"
        this.trackInfo.style.display = "none"
    }

    showPlaylist() {
        if (this.playlist.count() > 1) {
            this.playlist.style.display = ""
            this.shuffleBtn.style.display = ""
            this.skipNextBtn.style.display = ""
            this.skipPresiousBtn.style.display = ""
            this.trackInfo.style.display = ""
        } else {
            this.hidePlaylist()
        }
    }
}

customElements.define('globular-audio-player', AudioPlayer)

/**
 * The audio track element...
 */
class AudioTrack extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

    }

    // The connection callback.
    connectedCallback() {
        // Retrieve attributes

        const src = this.getAttribute('src');
        const title = this.getAttribute('title');
        const artist = this.getAttribute('artist');
        const album = this.getAttribute('album');
        const cover = this.getAttribute('cover');

        // Create the shadow DOM content
        this.shadowRoot.innerHTML = `
        <style>
          /* Add your custom styles here */
        </style>
        <div>
          <h2>${title}</h2>
          <p>Artist: ${artist}</p>
          <p>Album: ${album}</p>
          <audio controls style="width: 100%;">
            <source src="${src}" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>
          <img src="${cover}" alt="Album Cover" style="width: 100px; height: 100px;">
        </div>
      `;
    }

    // return minimal audio object...
    getAudio() {
        // Create the audio object...
        let audio = new Audio()
        audio.setId(this.getAttribute('id'))
        audio.setUrl(this.getAttribute('src'))
        audio.setTitle(this.getAttribute('title'))
        audio.setArtist(this.getAttribute('artist'))
        audio.setAlbum(this.getAttribute('album'))
        let poster = new Poster
        poster.setContenturl(this.getAttribute('cover'))
        poster.setUrl(this.getAttribute('cover'))
        audio.setPoster(poster)
        return audio
    }
}

customElements.define('globular-audio-track', AudioTrack);