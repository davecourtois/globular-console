import { set } from "@polymer/polymer/lib/utils/path";
import { AppComponent } from "../app/app.component";

export function getBase64FromImageUrl(url) {
  return fetch(url)
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          return response.blob();
      })
      .then(blob => {
          return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
          });
      });
}

export class AvatarChanger extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    // Create the template
    const template = document.createElement('template');
    template.innerHTML = `
            <style>
              /* Any custom styling for your code block */
              @import url('./styles.css');

              /* Your CSS styles go here */
              .container{
                position: relative;
              }

              .wrap{
                text-align: center;
                width: 600px;
              }

              .profile{
                margin: auto;
                width: 95%;
                max-width: 600px;
                background: var(--surface-color);
                border-radius: 10px;
                padding: 15px 10px 5px 10px;
                position: relative;
                box-shadow: 0px 1px 7px rgba(2,2,2,0.2);
              }
              .profile__options{
                display: flex;
                flex-wrap: nowrap;
                width: 90%;
                margin: auto;
                justify-content: space-between;
                padding-bottom: 10px;
                color: #666;
              }
              .upload-btn{
                font-size:13px;
                text-transform: uppercase;
                color: #888;
              }
              #upload_label{
                cursor: pointer;
                position: absolute;
                left: 15px;
                top: 12px;
                font-size: 14px;
              }
              #upload_label:hover, #upload_label:focus{
                color: #222;
              }
              .last-btn, .next-btn{
                top: 110px;
                position: relative;
                font-size: 22px;
              }
              .btn{
                cursor: pointer;
              }
              .btn:focus,.btn:hover{
                color:rgba(44,105, 1  51, 1);
              }
              .avatar{
                width: 96px;
                height: 96px;
                border-radius: 5px;
                border: 2px solid #fff;
                margin: 10px auto;
                position: relative;
                overflow: hidden;
                z-index: 2;
                transform: translateZ(0);
                transition: border-color 200ms;
              }
              .avatar--upload-error{
                border-color: #F73C3C;
                animation: shakeNo 300ms 1 forwards;
              }
              @keyframes shakeNo{
                20%, 60%{
                  transform: translateX(6px);
                }
                40%, 80%{
                  transform: translate(-6px);
                }
              }
              .avatar:hover .avatar_upload, .avatar--hover .avatar_upload{
                opacity: 1;
              }
              .avatar:hover .upload_label, .avatar--hover .upload_label{
                display: block;
              }
              #preview::after{
                content: 'Loading...';
                display: block;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                text-align: center;
                z-index: -1;
                line-height: 96px;
                color: #999;
              }
              #preview.hide-after::after {
                display: none;
              }
              .avatar_img--loading{
                opacity: 0;
              }
              .avatar_img{
                width: 100%;
                height: auto;
                animation: inPop 250ms 150ms 1 forwards cubic-bezier(0.175, 0.885, 0.32, 1.175);
                transform: scale(0);
                opacity: 0;
              }
              @keyframes inPop {
                100%{
                  transform: scale(1);
                  opacity: 1;
                }
              }
              .avatar_img--rotate90{
                transform: rotate(90deg);
              }
              .avatar_upload{
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                text-align: center;
                height: 100%;
                background: rgb(116 123 125 / 60%);
                display: flex;
                align-items: center;
                opacity: 0;
                transition: opacity 500ms;
              }
              .upload_label{
                color: #111;
                text-transform: uppercase;
                font-size: 14px;
                cursor: pointer;
                white-space: nowrap;
                padding: 4px;
                border-radius: 3px;
                min-width: 60px;
                width: 100%;
                max-width: 80px;
                margin: auto;
                font-weight: 400;
                -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                background: #fff;
                animation: popDown 300ms 1 forwards;
                transform: translateY(-10px);
                opacity: 0;
                display: none;
                transition: background 200ms, color 200ms;
              }
              @keyframes popDown{
                100%{
                  transform: translateY(0);
                  opacity: 1;
                }
              }
              .upload_label:hover{
                color: #fff;
                background: #222;
              }
              #upload{
                width: 100%;
                opacity: 0;
                height: 0;
                overflow: hidden;
                display: block;
                padding: 0;
                text-align: center;
              }
              .nickname{
                text-align: center;
                font-weight: 400;
                font-size: 20px;
                color: #666;
                position: relative;
                
              }

              #name{
                outline: none;
              }

              #name:hover{
                
                outline: var(--divider-color) auto 10px;
                
              }

              #selector{
                display: flex;
                flex-wrap: wrap;
                padding: 15px;
                justify-content: center;
              }

              #selector > img {
                width: 50px;
                height: 50px;
                padding: 3px;
                border: 2px solid transparent;
              }

              #selector > img:hover {
                border: 2px solid var(--divider-color);
                border-radius: 5px;
                cursor: pointer;
              }

              .actions{
                display: flex;
                justify-content: flex-end;
                padding: 10px;
              }

            </style>
            <div class="container">
              <div class="wrap">
                <div class="profile">
                  <div class="profile__options">
                     <label for="upload" onkeydown="handleAriaUpload(event, this)" id="upload_label" title="Upload New File" tabindex="2" class="aria-upload">upload new</label>
                    <a class="last-btn btn fa fa-caret-left" tabindex="2"></a>
                    <a class="next-btn btn fa fa-caret-right" tabindex="3"></a>
                  </div>
                  <div class="avatar" id="avatar">
                    <div id="preview">
                      <img src="" id="avatar-image" class="avatar_img">
                    </div>
                    <div class="avatar_upload" >
                      <label class="upload_label">Upload
                        <input type="file" id="upload">
                      </label>
                    </div>
                  </div>
                  <div class="nickname">
                    <span id="name" tabindex="4" data-key="1" contenteditable="true"></span>
                  </div>
                  <div id="selector">
                  </div>
                  <div class="actions">
                    <paper-button id="set-btn" class="btn">Set</paper-button>
                    <paper-button id="cancel-btn" class="btn">Cancel</paper-button>
                  </div>
                </div>
              </div>
            </div>
        `;

    // Append the template content to the shadow root
    shadow.appendChild(template.content.cloneNode(true));

    this.preview = this.shadowRoot.querySelector("#preview");
    this.avatar_name = this.shadowRoot.querySelector("#name");

    // The default avatar
    this.srcList = []

    // The current avatar
    this.activeKey = 1

    // Now the action.
    this.shadowRoot.querySelector(".next-btn").addEventListener("click", () => {
      this.changeAvatar('next');
    });

    this.shadowRoot.querySelector(".next-btn").addEventListener("keyup", (event) => {
      if (event.keyCode !== 13) return; this.changeAvatar('next');
    });

    this.shadowRoot.querySelector(".last-btn").addEventListener("click", () => {
      this.changeAvatar('last')
    });

    this.shadowRoot.querySelector(".last-btn").addEventListener("keyup", (event) => {
      if (event.keyCode !== 13) return; this.changeAvatar('last');
    });

    this.shadowRoot.querySelector("#name").addEventListener("blur", (e) => {
      this.changeAvatarName('blur', e.target.dataset.key, e.target.textContent);
    });

    this.shadowRoot.querySelector("#name").addEventListener("keyup", (e) => {
      this.changeAvatarName(e, e.target.dataset.key, e.target.textContent);
    });

    this.shadowRoot.querySelector("#set-btn").addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent('image-changed', { detail: { name: this.avatar_name.textContent, src: this.srcList[this.activeKey].src } }));
    });

    this.shadowRoot.querySelector("#cancel-btn").addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent('cancel'));
    });
    
    this.shadowRoot.querySelector("#upload").addEventListener("change", (evt) => {

      // Init required variables
      var avatar = this.shadowRoot.querySelector("#avatar");
      var avatar_name = this.shadowRoot.querySelector("#name");
      var preview = this.shadowRoot.querySelector("#preview");

      var files = evt.target.files;
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var imageType = /^image\//;

        if (!imageType.test(file.type)) {
          avatar.classList.add("avatar--upload-error");
          setTimeout(() => {
            avatar.classList.remove("avatar--upload-error");
          }, 1200);
          continue;
        }

        avatar.classList.remove("avatar--upload-error");

        while (preview.firstChild) {
          preview.removeChild(preview.firstChild);
        }

        var img = document.createElement("img");
        img.file = file;
        img.src = window.URL.createObjectURL(file);
        img.onload = () => {
          // window.URL.revokeObjectURL(this.src);
        }

        img.className = "avatar_img";

        /* Clear focus and any text editing mode */
        document.activeElement.blur();
        window.getSelection().removeAllRanges();

        var _avatarKey = this.add(file.name, img.src);
        avatar_name.textContent = file.name;
        avatar_name.setAttribute("data-key", _avatarKey);
        preview.appendChild(img);
      }
    }, false);

    this.loadImages('globular-console/assets/pixmaps/faces');

  }

  loadImages(path) {
    //  The image will be on the same domain, so we can use relative paths
    let globule = AppComponent.globules[0]
    if (globule) {
      let url = window.location.protocol + '//' + globule.config.Name + "." + globule.config.Domain

      if (globule.config.Protocol == 'https') {
        url = 'https://' + globule.config.Name + "." + globule.config.Domain + ":" + globule.config.PortHttps
      } else {
        if (window.location.protocol == 'https:') {
          url += ":" + globule.config.PortHttps
        } else {
          url += ":" + globule.config.PortHttp
        }
      }


      // Create a new request
      let request = new XMLHttpRequest();

      // Get the path from the form
      request.open('GET', url + "/get_images?path=" + path, true);

      // Set up a handler for when the task for the request is complete
      request.onload = () => {
        if (request.status === 200) {
          // The request was successful!
          // console.log(request.responseText)
          let result = JSON.parse(request.responseText)
          result.images.forEach((image) => {
            if(image.startsWith('/')){
              image = image.substring(1)
            }

            let src = url + "/" + image
            const filename = image.split('/').pop();

            // Split the string by underscore and then split the second part by dot
            const parts = filename.split('_');
            const nameWithExtension = parts.length > 1 ? parts[1] : '';
            const nameParts = nameWithExtension.split('.');

            const name = nameParts[0];
            this.srcList.push({ name: name, src: encodeURIComponent(src) })

            // Now I will add the image to the selector
            let img = document.createElement("img");
            img.src = decodeURIComponent(src);
            img.className = "avatar_img--loading";
            img.onload = function () {
              img.classList.add("avatar_img");
              img.classList.remove("avatar_img--loading");
            }

            let selector = this.shadowRoot.querySelector("#selector");
            selector.appendChild(img);
            let index = selector.children.length - 1;

            img.addEventListener("click", () => {
              this.showByKey(index);
            });
          })

          this.showByKey(0);
        } else {
          // The request failed!
          console.log('The request failed!');
        }
      };

      request.onerror = () => {
        console.log('There was an error!');
      }

      // Send the request
      request.send();

    }
  }

  // You can add methods, properties, and event listeners here
  add(_name, _src) {
    this.activeKey = this.srcList.length;
    return (this.srcList.push({ name: _name, src: encodeURIComponent(_src) }) - 1);
  }

  // Change the avatar name
  changeName(key, _name) {

    if (!Number.isInteger(key)) {
      return false;
    }
    this.srcList[key].name = _name;
    if (this.avatar_name.dataset.key == key) {
      this.avatar_name.textContent = _name;
    }
    return _name;

  }

  // Change the avatar image
  showNext() {

    var _next = this.activeKey + 1;
    if (_next >= this.srcList.length) {
      _next = 0;
    }
    this.showByKey(_next);
  }

  // show the last avatar
  showLast() {
    var _next = this.activeKey - 1;
    if (_next < 0) {
      _next = this.srcList.length - 1;
    }
    this.showByKey(_next);
  }

  // show the avatar by key
  showByKey(_next) {
    var _on = this.srcList[_next];
    if (!_on.name) return;

    while (this.preview.firstChild) {
      this.preview.removeChild(this.preview.firstChild);
    }

    var img = document.createElement("img");
    img.src = decodeURIComponent(_on.src);
    img.className = "avatar_img--loading";
    this.preview.classList.remove('hide-after');

    img.onload =  () =>{
      setTimeout(() => {
        img.classList.add("avatar_img");
        this.preview.classList.add('hide-after');
        img.classList.remove("avatar_img--loading");
      }, 200);
    }

    this.avatar_name.textContent = _on.name;
    this.avatar_name.setAttribute("data-key", _next);
    this.preview.appendChild(img);
    this.activeKey = _next;
  }

  showAvatar(key) {
    if (!key) {
      key = this.activeKey;
    }

  }

  changeAvatarName(event, key, name) {
    if (event.keyCode != 13 && event != 'blur') return;
    key = parseInt(key);
    if (!name) return;
    var change = this.changeName(key, name);
    document.activeElement.blur();

    // remove selection abilities
    window.getSelection().removeAllRanges();

  };

  changeAvatar(dir) {
    if (dir === 'next') {
      this.showNext();
    }
    else {
      this.showLast();
    }
  }


}

// Define the new element
customElements.define('avatar-changer', AvatarChanger);