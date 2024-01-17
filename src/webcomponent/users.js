import { Account, GetAccountRqst, GetAccountsRqst, RegisterAccountRqst, SetAccountRqst } from "globular-web-client/resource/resource_pb";
import { AvatarChanger } from "./image";
import { displayAuthentication, displayError, displaySuccess } from "./utility";
import { AppComponent } from "../app/app.component";

function getBase64FromImageUrl(url) {
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

/**
 * The user manager, this component is used to manage the users, it is used to create, update, delete and search users.
 */
export class UsersManager extends HTMLElement {

    static get observedAttributes() {
        return ['current-user-id'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'current-user-id') {
            this.currentUserId = newValue
            if (this.currentUserId != newValue &&  AppComponent.globules[0] != null) {
                this.setCurrentUser(newValue)
            }
        }
    }

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Test if the current user id is set.
        this.currentUserId = this.getAttribute("current-user-id")

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            /* Any custom styling for your code block */
            @import url('./styles.css');

            #content {
                display: flex;
                background-color: var(--surface-color);
                padding: 1rem;
                border-radius: 0.5rem;
                margin: 1rem;

                flex-direction: column;
            }

            #title {
                font-size: 1.2rem;
                margin-left: 1rem;
                margin-right: 1rem;
                flex-grow: 1;
            }

            #users {
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

        </style>
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <div style="display: flex; flex-direction: row; flex-grow: 1; align-items: center;">
                    <paper-icon-button id="add-btn" icon="icons:add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                    <span id="title">Users</span>
                </div>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>

        </div>

        <slot name="user"></slot>

        <slot name="users"></slot>
        `

        // Action on the add button.
        this.shadowRoot.querySelector("#add-btn").addEventListener("click", () => {

            // test if user editor is already present.
            let userEditor = this.querySelector("globular-user-editor")
            if (userEditor != null) {
                // just focus on the user editor.
                userEditor.setFocus()
                return
            }

            // Create a new user.
            let a = new Account()
            a.setProfilepicture("https://www.w3schools.com/howto/img_avatar.png")

            userEditor = new UserEditor(a)
            userEditor.slot = "user"
            userEditor.id = "user-editor"
            this.currentUserId = "new-user"

            // Dispatch a custom event when the property changes
            this.dispatchEvent(new CustomEvent('currentUserIdChanged', { detail: this.currentUserId }));

            this.appendChild(userEditor)
            userEditor.setFocus()
        })

        // try to get the globule.
        let nbTry = 10;
        let interval = setInterval(() => {
            if (AppComponent.globules[0] != null) {
                clearInterval(interval)
                this.init()
            }
            nbTry--
            if (nbTry == 0) {
                clearInterval(interval)
            }
        }, 1000)
    }


    // the connected callback
    connectedCallback() {
        console.log('Custom square element added to page.');
    }

    // int the component.
    init() {

        // Get the users.
        if(this.currentUserId != null && this.currentUserId != "") {
            this.setCurrentUser(this.currentUserId)
        }

        // Get the users.
        let rqst = new GetAccountsRqst
        rqst.setQuery("{}")

        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        let stream = globule.resourceService.getAccounts(rqst, { })

        stream.on('data', (rsp) => {
            console.log(rsp.getAccountsList())
        })

        stream.on("status", (status) => {
            if (status.code == 0) {

            } else {
                displayError(status.details)
            }
        })
    }


    // Set the current user.
    setCurrentUser(userId) {
        if( AppComponent.globules[0] == null) {
            return
        }
 
        if (userId === "new-user") {
            let userEditor = this.querySelector("globular-user-editor")
            if (userEditor != null) {
                // just focus on the user editor.
                userEditor.setFocus()
                return
            }

            // Create a new user.
            let a = new Account()
            a.setProfilepicture("https://www.w3schools.com/howto/img_avatar.png")
            userEditor = new UserEditor(a)
            userEditor.slot = "user"
            userEditor.id = "user-editor"

            this.appendChild(userEditor)
            userEditor.setFocus()

        } else {
            this.currentUserId = userId
            // Get the user.
            let rqst = new GetAccountRqst()
            rqst.setAccountid(userId)
            AppComponent.globules[0].resourceService.getAccount(rqst, {}).then((response) => {
                let account = response.getAccount()
                let userEditor = this.querySelector("globular-user-editor")
                if (userEditor != null) {
                    // just focus on the user editor.
                    userEditor.setAccount(account)
                    userEditor.setFocus()
                } else {
                    let userEditor = new UserEditor(account)
                    userEditor.slot = "user"
                    userEditor.id = "user-editor"
                    this.appendChild(userEditor)
                    userEditor.setFocus()
                }

               

            }).catch((error) => {
                displayError(error)
            });
        }
    }


}

customElements.define('globular-users-manager', UsersManager)


/**
 * This compoent is to display a user informations. It can be use to create, update or delete a user.
 */
export class UserEditor extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(account) {
        super()

        this.account = account

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            /* Any custom styling for your code block */
            @import url('./styles.css');

            #content {
                display: flex;
                background-color: var(--surface-color);
                padding: 1rem;
                border-radius: 0.5rem;
                margin: 1rem;

                flex-direction: column;
            }

            #title {
                font-size: 1.2rem;
                margin-left: 1rem;
                margin-right: 1rem;
                flex-grow: 1;
            }

            #user-infos {
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                margin-left: 1rem;
                margin-right: 1rem;
            }

            #avatar-div {
                position: relative;
            }

            #avatar {
                width: 48px;
                height: 48px;
                border-radius: 5px;
                border: 1px solid var(--divider-color);
                margin-left: 1rem;
            }

            #avatar:hover {
                cursor: pointer;
                border: 1px solid var(--divider-color);
            }

            input {
                margin-top: 1rem;
                margin-bottom: 1rem;
                border: none;
                border-bottom: 1px solid var(--divider-color);
                background-color: var(--surface-color);
            }

            input:focus {
                outline: none;
                border: none;
                border-bottom: 1px solid var(--secondary-color);
            }

            input:valid {
                background-color: white; /* Or transparent */
            }
            
            input:invalid {
                background-color: aliceblue;
            }

            .user-form {
                display: flex;
                flex-direction: row;
            }

            .table {
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                padding-left: 1rem;
                padding-right: 1rem;
            }

            .row {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                align-items: center;
            }

            .row > label {
                width: 150px;
                margin-right: 1rem;
            }

            .row > input {
                flex-grow: 1;
                background-color: var(--surface-color);
            }

            label {
                font: 500 14px/25px Roboto,sans-serif
            }

            @media only screen and (max-width: 640px) {
                .user-form {
                    flex-direction: column;
                }
            }


        </style>
        <div id="content">
            <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                <span id="title">User Informations</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>

            <div class="user-form">
                <div id="avatar-div">
                    <img id="avatar" src="https://www.w3schools.com/howto/img_avatar.png" alt="Avatar">
                    <avatar-changer id="avatar-changer" style="position: absolute; top: 60px; left: 0px; display: none;"></avatar-changer>
                </div>
                <div class="table">
                    <div class="row">
                        <label for="name"><span style="color: red; margin-right: .5rem;">*</span>User Name</label>
                        <input id="name" label="name" value="${this.account.getName()}"></input>
                    </div>

                    <div class="row">
                        <label for="email"><span style="color: red; margin-right: .5rem;">*</span>Email</label>
                        <input id="email" type="email" label="email" value="${this.account.getEmail()}"></input>
                    </div>
                    <div class="row">
                        <label for="password"><span style="color: red; margin-right: .5rem;">*</span>Password</label>
                        <input id="password" type="password" label="password" value=""></input>
                    </div>

                    <div class="row">
                        <label for="password"><span style="color: red; margin-right: .5rem;">*</span>Confirm Password</label>
                        <input id="confirm-password" type="password" label="confirm-password" value=""></input>
                    </div>
                </div>
                <div class="table">
                    <div class="row">
                        <label for="name">First Name</label>
                        <input id="first-name" label="first-name" value="${this.account.getFirstname()}"></input>
                    </div>

                    <div class="row">
                        <label for="email">Last Name</label>
                        <input id="last-name" label="last-name" value="${this.account.getLastname()}"></input>
                    </div>

                    <div class="row">
                        <label for="middle">Middle Name</label>
                        <input id="middle" label="middle" value="${this.account.getMiddle()}"></input>
                    </div>
                </div>
            </div>

            <div id="actions" style="display: flex; flex-direction: row; justify-content: flex-end; margin-top: 1rem;">
                <paper-button id="save-btn" role="button" tabindex="0" aria-disabled="false">Save</paper-button>
                <paper-button id="cancel-btn" role="button" tabindex="0" aria-disabled="false">Cancel</paper-button>
            </div>

        </div>`

        // here I will set the action on avatar-changer when the image is changed.
        let avatarChanger = this.shadowRoot.querySelector("#avatar-changer")
        avatarChanger.addEventListener("image-changed", (e) => {
            // set the image.
            let avatar = this.shadowRoot.querySelector("#avatar")
            let url = decodeURIComponent(e.detail.src)

            // I will read the image and set the image url to the account.
            getBase64FromImageUrl(url)
                .then(base64 => avatar.src = base64)
                .catch(error => console.error('Error:', error));

            avatarChanger.style.display = "none"
        })

        // here I will set the cancel action on avatar-changer.
        avatarChanger.addEventListener("cancel", (e) => {
            avatarChanger.style.display = "none"
        })

        // Now we can set the avatar changer.
        let avatar = this.shadowRoot.querySelector("#avatar")
        avatar.onclick = () => {
            let avatarChanger = this.shadowRoot.querySelector("#avatar-changer")
            avatarChanger.style.display = "block"
        }

        // reset the border color.
        let nameInput = this.shadowRoot.querySelector("#name")
        let emailInput = this.shadowRoot.querySelector("#email")
        let confirmPasswordInput = this.shadowRoot.querySelector("#confirm-password")
        let passwordInput = this.shadowRoot.querySelector("#password")

        nameInput.onkeydown = emailInput.onkeydown = confirmPasswordInput.onkeydown = passwordInput.onkeydown = () => {
            nameInput.style.borderBottom = "1px solid var(--secondary-color)"
            emailInput.style.borderBottom = "1px solid var(--secondary-color)"
            confirmPasswordInput.style.borderBottom = "1px solid var(--secondary-color)"
            passwordInput.style.borderBottom = "1px solid var(--secondary-color)"
        }


        // Action on the save button.
        this.shadowRoot.querySelector("#save-btn").addEventListener("click", () => {

            // reset the border color.
            nameInput.style.borderBottom = "1px solid var(--secondary-color)"
            emailInput.style.borderBottom = "1px solid var(--secondary-color)"
            confirmPasswordInput.style.borderBottom = "1px solid var(--secondary-color)"
            passwordInput.style.borderBottom = "1px solid var(--secondary-color)"

            // Get the values.
            let name = nameInput.value

            // test if the name is empty.
            if (name.length === 0) {
                displayError("Name is empty.")

                // the the underline color to red.
                nameInput.style.borderBottom = "1px solid red"

            }

            let email = emailInput.value
            // test if the email is empty.
            if (email.length === 0) {
                displayError("Email is empty.")

                // the the underline color to red.
                emailInput.style.borderBottom = "1px solid red"
            }

            let confirmPassword = confirmPasswordInput.value
            let firstName = this.shadowRoot.querySelector("#first-name").value
            let lastName = this.shadowRoot.querySelector("#last-name").value
            let middle = this.shadowRoot.querySelector("#middle").value
            let password = passwordInput.value

            if (password.length === 0) {
                displayError("Password is empty.")

                // the the underline color to red.
                passwordInput.style.borderBottom = "1px solid red"

            }

            // test if the confirm password is empty.
            if (confirmPassword.length === 0) {
                displayError("Confirm password is empty.")

                // the the underline color to red.
                confirmPasswordInput.style.borderBottom = "1px solid red"

            }

            // test if the password and the confirm password are the same.
            if (password !== confirmPassword) {
                displayError("Password and confirm password are not the same.")
                this.shadowRoot.querySelector("#confirm-password").focus()

                // the the underline color to red.
                this.shadowRoot.querySelector("#confirm-password").style.borderBottom = "1px solid red"

            }

            // test if there is an error.
            if (name.length === 0) {
                nameInput.focus()
                return
            }

            if (email.length === 0) {
                emailInput.focus()
                return
            }

            // test if the email is valid
            if (!email.includes("@")) {
                displayError("Email is not valid.")
                emailInput.style.borderBottom = "1px solid red"
                emailInput.focus()
                return
            }

            if (password.length === 0) {
                passwordInput.focus()
                return
            }

            if (confirmPassword.length === 0) {
                confirmPasswordInput.focus()
                return
            }

            if (password !== confirmPassword) {
                this.shadowRoot.querySelector("#confirm-password").focus()
                return
            }

            // Set the values.
            this.account.setName(name)
            this.account.setEmail(email)
            this.account.setFirstname(firstName)
            this.account.setLastname(lastName)
            this.account.setMiddle(middle)
            this.account.setPassword(password)
            this.account.setProfilepicture(avatar.src)

            // Save the account.
            this.saveAccount(this.account)

        })


        // Set the account.
        if (account) {
            this.setAccount(account)
        }
    }

    saveAccount(account) {
        if (AppComponent.globules.length === 0) {
            displayError("No globule is connected.")
            return
        }

        let globule = AppComponent.globules[0]
        if (globule == null) {
            displayError("No globule is connected.")
            return
        }

        // Here I will test if a token is prensent on the globule
        if (globule.token == null) {
            displayAuthentication(`Please authenticate on ${globule.config.Name}`, globule, () => {
                this.saveAccount(account)
            }, err => {
                displayError(err)
            })

            return
        }

        // save the account.
        if (account.getId() === "") {
            // create the account.
            if (AppComponent.globules[0] == null) {
                displayError("No globule is connected.")
                return
            }

            // Set the account domain.
            account.setDomain(AppComponent.globules[0].config.Domain)

            // Set the account id.
            account.setId(account.getName())

            let rqst = new RegisterAccountRqst()
            rqst.setAccount(account)

            let confirmPasswordInput = this.shadowRoot.querySelector("#confirm-password")
            rqst.setConfirmPassword(confirmPasswordInput.value)

            AppComponent.globules[0].resourceService.registerAccount(rqst, { token: globule.token }).then((response) => {
                displaySuccess(`Account ${account.getName()} was created.`)
            }).catch((error) => {
                displayError(error)
            });

        } else {
            // update the account.
            let rqst = new SetAccountRqst
            rqst.setAccount(account)

            AppComponent.globules[0].resourceService.setAccount(rqst, { token: globule.token }).then((response) => {
                displaySuccess(`Account ${account.getName()} was updated.`)
            }).catch((error) => {
                displayError(error)
            });
        }
    }

    setAccount(account) {
        this.account = account

        // Set the values in the form.
        this.shadowRoot.querySelector("#name").value = account.getName()
        this.shadowRoot.querySelector("#email").value = account.getEmail()
        this.shadowRoot.querySelector("#first-name").value = account.getFirstname()
        this.shadowRoot.querySelector("#last-name").value = account.getLastname()
        this.shadowRoot.querySelector("#middle").value = account.getMiddle()
        this.shadowRoot.querySelector("#password").value = ""
        this.shadowRoot.querySelector("#confirm-password").value = ""
        this.shadowRoot.querySelector("#avatar").src = account.getProfilepicture()

    }

    setFocus() {
        this.shadowRoot.querySelector("#name").focus()
    }
}

customElements.define('globular-user-editor', UserEditor)

