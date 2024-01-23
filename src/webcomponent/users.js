import { Account, DeleteAccountRqst, GetAccountRqst, GetAccountsRqst, RegisterAccountRqst, SetAccountRqst } from "globular-web-client/resource/resource_pb";
import { AvatarChanger, getBase64FromImageUrl } from "./image";
import { displayAuthentication, displayError, displayQuestion, displaySuccess } from "./utility";
import { AppComponent } from "../app/app.component";
import { Table } from "./table";


export function getUserById(id, callback) {
    let rqst = new GetAccountRqst
    rqst.setAccountid(id)

    let globule = AppComponent.globules[0]
    if (globule == null) {
        displayError("No globule is connected.")
        return
    }

    // get the user.
    globule.resourceService.getAccount(rqst, {})
        .then((rsp) => {
            callback(rsp.getAccount())
        }).catch((err) => {
            displayError(err)
        })
}

// override the the id field to display the profile picture.
function displayAccountId(a) {
    //return a.id // on image
    return `<div class="user-selector" style="display: flex; align-items: center;"><img style="height: 32px; width: 32px;" src="${a["profilePicture"]}"/><span style="margin-left: 1rem; text-decoration: underline;">${a["id"]}</span></div>`
}

// keep the account id.
window["displayAccountId"] = displayAccountId



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
            if (this.currentUserId != newValue && AppComponent.globules[0] != null) {
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
        this.currentUserId = null

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

            #table-container {
                display: flex;
                width: fit-content;
                overflow: hidden;
                position: relative;
                padding-bottom: 1px;
                margin-left: 1rem;
            }

            td {
                padding: 0.5rem;
                max-height: 60px;
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

        <div id="table-container">
            <globular-table width="800px" display-index="true" visible-data-count="10" row-height="50px"
            header-background-color="var(--primary-light-color)" 
            header-text-color="var(--on-primary-light-color)">
                <span id="title" slot="title">Accounts</span>
                <span class="field" slot="fields" field="displayAccountId">Id</span>
                <span class="field" slot="fields" field="firstName">First Name</span>
                <span class="field" slot="fields" field="lastName">Last Name</span>
                <span class="field" slot="fields" field="userEmail">Email</span>
            </globular-table>
        </div>
        `

        // Action on the add button.
        this.shadowRoot.querySelector("#add-btn").addEventListener("click", () => {
            // Create a new user.
            let a = new Account()
            a.setProfilepicture("https://www.w3schools.com/howto/img_avatar.png")
            this.currentUserId = "new-user"

            // test if user editor is already present.
            let userEditor = this.querySelector("globular-user-editor")
            if (userEditor == null) {
                // just focus on the user editor.
                userEditor = new UserEditor(a)
                userEditor.slot = "user"
                userEditor.id = "user-editor"
            } else {
                userEditor.setAccount(a)
            }

            // Dispatch a custom event when the property changes
            document.dispatchEvent(new CustomEvent('currentUserIdChanged', { detail: this.currentUserId }));

            this.appendChild(userEditor)
            userEditor.setFocus()
        })

        // add the reload users event listener.
        document.addEventListener("reloadUsers", (e) => {
            this.init()
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
        if (this.currentUserId != null && this.currentUserId != "") {
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

        let stream = globule.resourceService.getAccounts(rqst, {})

        let accounts = []

        stream.on('data', (rsp) => {
            accounts = accounts.concat(rsp.getAccountsList())
        })

        stream.on("status", (status) => {
            if (status.code == 0) {
                this.displayUsers(accounts)
            } else {
                displayError(status.details)
            }
        })
    }

    // Display the users.
    displayUsers(accounts) {

        // I will set the users in the table.
        let table = this.shadowRoot.querySelector("globular-table")

        let data = []

        accounts.forEach(account => {
            let d = {}
            d.id = account.getName() // the id will never change...       
            d.firstName = " "
            if (account.getFirstname()) {
                d.firstName = account.getFirstname()
            }
            d.lastName = " "
            if (account.getLastname()) {
                d.lastName = account.getLastname()
            }
            d.userEmail = account.getEmail()

            if (account.getProfilepicture() != "") {
                d.profilePicture = account.getProfilepicture()
            } else {
                d.profilePicture = "https://www.w3schools.com/howto/img_avatar.png"
            }

            data.push(d)

        })

        // Here I sort the data.
        data.sort((a, b) => {
            if (a.firstName < b.firstName) {
                return -1
            } else if (a.firstName > b.firstName) {
                return 1
            }

            return 0
        })

        table.setData(data)

        // i will add the listener to row-click event.
        table.addEventListener("row-click", (e) => {
            let user = e.detail
            this.currentUserId = user.id
            // Dispatch a custom event when the property changes
            document.dispatchEvent(new CustomEvent('currentUserIdChanged', { detail: this.currentUserId }));
            this.setCurrentUser(user.id)
        })

    }


    // Set the current user.
    setCurrentUser(userId) {
        if (AppComponent.globules[0] == null) {
            return
        }

        if (userId === "new-user") {
            let a = new Account()
            a.setProfilepicture("https://www.w3schools.com/howto/img_avatar.png")

            let userEditor = this.querySelector("globular-user-editor")
            if (userEditor != null) {
                // just focus on the user editor.
                userEditor.setAccount(a)
                userEditor.setFocus()
                return
            }

            // Create a new user.
            userEditor = new UserEditor(a)
            userEditor.slot = "user"
            userEditor.id = "user-editor"

            this.appendChild(userEditor)
            userEditor.setFocus()

        } else if (userId != null && userId != "") {
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
                z-index: 100;
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

            input, textarea {
                font-family: Arial, Helvetica, sans-serif; /* Primary font */
                font-size: 16px; /* Readable size */
                color: #333; /* Font color */
                /* Add other styles like padding, borders as needed */
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
                <span id="title">User Editor</span>
                <paper-icon-button id="info-btn" icon="icons:info-outline" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
            </div>

            <div class="user-form">
                <div id="avatar-div">
                    <img id="avatar" src="https://www.w3schools.com/howto/img_avatar.png" alt="Avatar">
                    <avatar-changer id="avatar-changer" style="position: absolute; top: 60px; left: 0px; display: none; z-index: 100;"></avatar-changer>
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

            <div id="actions" style="display: flex; flex-direction: row; margin-top: 1rem;">
                <paper-button id="delete-btn" role="button" tabindex="0" aria-disabled="false" style="display:none;">Delete</paper-button>
                <span style="flex-grow: 1;"></span>
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

        // Action on the cancel button.
        this.shadowRoot.querySelector("#cancel-btn").addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent('currentUserIdChanged', { detail: null }));
            this.remove()
        })

        // Action on the delete button.
        this.shadowRoot.querySelector("#delete-btn").addEventListener("click", () => {
            // Here I will ask the the user if he is sure to delete the account.
            let question = displayQuestion(`Are you sure to delete the account ${this.account.getName()} ?`,
                `<div style="display: flex; justify-content: center; margin-top: 1.5rem;">
                    <paper-button id="yes-btn" role="button" tabindex="0" aria-disabled="false">Yes</paper-button>
                    <paper-button id="no-btn" role="button" tabindex="0" aria-disabled="false">No</paper-button>
            </div>`)


            question.toastElement.querySelector("#yes-btn").addEventListener("click", () => {
                question.toastElement.remove()
                this.deleteAccount(this.account)
            })

            question.toastElement.querySelector("#no-btn").addEventListener("click", () => {
                question.toastElement.remove()
            })
        })

        // Set the account.
        if (account) {
            this.setAccount(account)
        }
    }

    // Delete the account.
    deleteAccount(account) {
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
                this.deleteAccount(account)
            }, err => {
                displayError(err)
            })

            return
        }

        // Here I will delete the account.
        let rqst = new DeleteAccountRqst
        rqst.setId(this.account.getId())

        AppComponent.globules[0].resourceService.deleteAccount(rqst, { token: globule.token }).then((response) => {
            displaySuccess(`Account ${this.account.getName()} was deleted.`)
            this.parentNode.currentUserId = null // set the current user id to null.
            document.dispatchEvent(new CustomEvent('currentUserIdChanged', { detail: null }));
            document.dispatchEvent(new CustomEvent('reloadUsers', { detail: null }));
            this.remove()
        }).catch((error) => {
            displayError(error)
        });

    }

    // Save the account.
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

                // I will dispatch an event to refresh the users.
                document.dispatchEvent(new CustomEvent('reloadUsers', { detail: null }));

            }).catch((error) => {
                displayError(error)
            });

        } else {
            // update the account.
            let rqst = new SetAccountRqst
            rqst.setAccount(account)

            AppComponent.globules[0].resourceService.setAccount(rqst, { token: globule.token }).then((response) => {
                displaySuccess(`Account ${account.getName()} was updated.`)
                document.dispatchEvent(new CustomEvent('reloadUsers', { detail: null }));
            }).catch((error) => {
                displayError(error)
            });
        }
    }

    setAccount(account) {
        this.account = account

        // Set the values in the form.
        if (account.getId() != "") {
            this.shadowRoot.querySelector("#name").value = account.getName()
            this.shadowRoot.querySelector("#email").value = account.getEmail()
            this.shadowRoot.querySelector("#first-name").value = account.getFirstname()
            this.shadowRoot.querySelector("#last-name").value = account.getLastname()
            this.shadowRoot.querySelector("#middle").value = account.getMiddle()
            this.shadowRoot.querySelector("#password").value = "**********"
            this.shadowRoot.querySelector("#password").setAttribute("disabled", "true")
            this.shadowRoot.querySelector("#confirm-password").parentNode.style.display = "none"
            this.shadowRoot.querySelector("#confirm-password").value = "**********"
            this.shadowRoot.querySelector("#password").setAttribute("disabled", "true")
            this.shadowRoot.querySelector("#avatar").src = account.getProfilepicture()
            if (account.getId() != "sa") {
                this.shadowRoot.querySelector("#delete-btn").style.display = "block"
            }else{
                this.shadowRoot.querySelector("#delete-btn").style.display = "none"
            }
        } else {
            this.shadowRoot.querySelector("#name").value = ""
            this.shadowRoot.querySelector("#email").value = ""
            this.shadowRoot.querySelector("#first-name").value = ""
            this.shadowRoot.querySelector("#last-name").value = ""
            this.shadowRoot.querySelector("#middle").value = ""
            this.shadowRoot.querySelector("#password").value = ""
            this.shadowRoot.querySelector("#password").removeAttribute("disabled")
            this.shadowRoot.querySelector("#confirm-password").parentNode.style.display = "flex"
            this.shadowRoot.querySelector("#confirm-password").value = ""
            this.shadowRoot.querySelector("#password").removeAttribute("disabled")
            this.shadowRoot.querySelector("#avatar").src = "https://www.w3schools.com/howto/img_avatar.png"
            this.shadowRoot.querySelector("#delete-btn").style.display = "none"
        }

    }

    setFocus() {
        this.shadowRoot.querySelector("#name").focus()
    }
}

customElements.define('globular-user-editor', UserEditor)


/**
 * display the user.
 */
export class UserView extends HTMLElement {

    // attributes.
    static get observedAttributes() {
        return ['closeable'];
    }

    // The connection callback.
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'closeable') {
            if (newValue == "true") {
                this.closeBtn.style.display = "block"
                this.closeBtn.addEventListener('click', () => {
                    if (this.onClose != null) {
                        this.onClose()
                    }
                })
            } else {
                this.closeBtn.style.display = "none"
            }
        }
    }

    // Create the applicaiton view.
    constructor(account) {
        super()
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
                padding: .5rem;
                border-radius: 0.5rem;
                flex-direction: column;
                align-items: center;
            }

            #content > img {
                width: 48px;
                height: 48px;
                border-radius: 50%;
            }

            #name {
                font-size: 1rem;
                flex-grow: 1;
            }

            #close-btn {
                width: 30px;        /* Width of the button */
                height: 30px;       /* Height of the button */
                --iron-icon-width: 10px;  /* Width of the icon */
                --iron-icon-height: 10px; /* Height of the icon */
            }

        </style>
        <div id="content">
            <img src="${account.getProfilepicture()}"></img>
            <div style="display: flex; flex-direction: row; align-items: center;">
                <paper-icon-button id="close-btn" icon="icons:close" style="display: none;" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                <span id="name">${account.getName()}</span>
            </div>
        </div>
        `

        // Get the buttons.
        this.closeBtn = this.shadowRoot.getElementById('close-btn')

    }
}

customElements.define('globular-user-view', UserView)

