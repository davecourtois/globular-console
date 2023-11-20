import { GetAccountsRqst, Account as AccountInfo, SetAccountContactRqst, Contact, SetAccountContactRsp } from "globular-web-client/resource/resource_pb";
import { Account } from "../models/Account";
import { Backend, generatePeerToken } from "./Backend";
import { Application } from "src/models/Application";
import { Session } from "src/models/Session";
import { FindOneRqst, FindResp, FindRqst, ReplaceOneRsp } from "globular-web-client/persistence/persistence_pb";
import { mergeTypedArrays, uint8arrayToStringMethod } from "src/Utility";
import { Globular } from "globular-web-client";

export class AccountController {

    private static listeners: any;
    private static accounts: any;

    /**
     * Get an account with a given id.
     * @param id The id of the account to retreive
     * @param successCallback Callback when succed
     * @param errorCallback Error Callback.
     */
    public static getAccount(id: string, successCallback: (account: Account) => void, errorCallback: (err: any) => void) {
        
        if (id.length == 0) {
            errorCallback("No account id given to getAccount function!")
            return
        }

        if (AccountController.accounts == null) {
            // Set the accouts map
            AccountController.accounts = {}
        }

        // set the account id.
        let accountId = id
        let domain = Backend.domain

        if (accountId.indexOf("@") == -1) {
            accountId = id + "@" + domain
        } else {
            domain = accountId.split("@")[1]
            id = accountId.split("@")[0]
        }

        if (AccountController.accounts[accountId] != null) {
            if (AccountController.accounts[accountId].session != null) {
                successCallback(AccountController.accounts[accountId]);
                return
            }
        }

        let globule = Backend.getGlobule(domain)

        if (!globule) {
            let jsonStr = localStorage.getItem(accountId)
            if (jsonStr) {
                let account = AccountController.fromString(jsonStr)
                successCallback(account)
            } else {
                errorCallback("no globule was found at domain " + domain)
            }
            return
        }

        generatePeerToken(globule, token => {

            let rqst = new GetAccountsRqst
            rqst.setQuery(`{"$or":[{"_id":"${id}"},{"name":"${id}"} ]}`); // search by name and not id... the id will be retreived.
            rqst.setOptions(`[{"Projection":{"_id":1, "email":1, "name":1, "groups":1, "organizations":1, "roles":1, "domain":1}}]`);

            let globule = Backend.getGlobule(domain)
            if (globule) {

                if (globule.resourceService == null) {
                    errorCallback("Resource service not found")
                    throw `No resource service found for domain ${domain}`
                }

                let stream = globule.resourceService.getAccounts(rqst, { domain: domain, application: Application.name, token: token })
                let data: AccountInfo | undefined = undefined;

                stream.on("data", (rsp) => {
                    if (rsp.getAccountsList().length > 0) {
                        data = rsp.getAccountsList().pop()
                    }
                });

                stream.on("status", (status) => {
                    if (status.code == 0) {

                        // so here I will get the session for the account...
                        if (AccountController.accounts[accountId] != null) {
                            if (AccountController.accounts[accountId].session != null) {
                                successCallback(AccountController.accounts[accountId]);
                                return
                            }

                        }

                        // Initialyse the data...
                        if (!data) {
                            errorCallback("no account found with id " + accountId)
                            return
                        }

                        let account = new Account(data.getId(), data.getEmail(), data.getName(), data.getDomain(), data.getFirstname(), data.getLastname(), data.getMiddle(), data.getProfilepicture())
                        account.session = new Session(account)
                        AccountController.accounts[accountId] = account;

                        account.session.initData(() => {
                            // here I will initialyse groups...
                            if (data == undefined) {
                                errorCallback("no account found with id " + accountId)
                                return
                            }

                            // set the groups...
                            account.groups = data.getGroupsList();
                            account.initGroups(() => {
                                if (!Application.account) {
                                    successCallback(account)
                                    return
                                }
    
                                if (account.id == Application.account.id) {
                                    account.initData(() => {
                                        successCallback(account)
                                    }, errorCallback)
                                } else {
                                    // I will keep the account in the cache...
                                    localStorage.setItem(account.id + "@" + account.domain, account.toString())
                                    successCallback(account)
                                }
                            });

                        }, errorCallback)

                    } else {
                        let jsonStr = localStorage.getItem(accountId)
                        if (jsonStr) {
                            let account = AccountController.fromString(jsonStr)
                            successCallback(account)
                        } else {
                            errorCallback(status.details);
                        }
                    }
                })
            }
        }, err => console.log(err))
    }

    public static setAccount(a: Account) {
        if (AccountController.accounts == null) {
            AccountController.accounts = []
        }
        AccountController.accounts[a.id + "@" + a.domain] = a;
    }

    public static getListener(id: string) {
        if (AccountController.listeners == undefined) {
            return null;
        }
        return AccountController.listeners[id];
    }

    // Keep track of the listener.
    public static setListener(id: string, domain: string, uuid: string) {
        if (AccountController.listeners == undefined) {
            AccountController.listeners = {};
        }
        AccountController.listeners[id + "@" + domain] = uuid;
        return
    }

    public static unsetListener(id: string, domain: string) {
        let uuid = AccountController.getListener(id + "@" + domain);
        if (uuid != null) {
            Backend.getGlobule(domain).eventHub.unSubscribe(`update_account_${id + "@" + domain}_data_evt`, uuid);
        }
    }

    /**
     * Read user data one result at time.
     */
    public static readOneUserData(
        query: string,
        userName: string,
        userDomain: string,
        successCallback: (results: any) => void,
        errorCallback: (err: any) => void
    ) {

        let rqst = new FindOneRqst();

        // remove unwanted characters
        let id = userName.split("@").join("_").split(".").join("_")
        let db = id + "_db";

        // set the connection id.
        rqst.setId(id);
        rqst.setDatabase(db);

        let collection = "user_data";
        rqst.setCollection(collection);
        rqst.setQuery(query);
        rqst.setOptions("");

        let globule = Backend.getGlobule(userDomain)
        if (globule == null) {
            errorCallback("no globule was found at domain " + userDomain)
            return
        }

        generatePeerToken(globule, token => {

            if (globule.persistenceService == null) {
                errorCallback("Persistence service not found")
                throw `No persistence service found for domain ${userDomain}`
            }

            // call persist data
            globule.persistenceService
                .findOne(rqst, {
                    token: token,
                    application: Application.name,
                    domain: globule.domain // the domain at the origin of the request.
                })
                .then((rsp: any) => {
                    let data = rsp.getResult().toJavaScript();
                    successCallback(data);
                })
                .catch((err: any) => {
                    if (err.code == 13) {
                        if (Application.account == null) {
                            setTimeout(() => {
                                localStorage.removeItem("remember_me");
                                localStorage.removeItem("user_token");
                                localStorage.removeItem("user_id");
                                localStorage.removeItem("user_name");
                                localStorage.removeItem("user_email");
                                localStorage.removeItem("token_expired");
                                location.reload();
                                return;
                            }, 3000)
                        }

                        if (Application.account.id == id) {
                            if (err.message.indexOf("no documents in result") != -1) {
                                successCallback({});
                            } else {
                                setTimeout(() => {
                                    localStorage.removeItem("remember_me");
                                    localStorage.removeItem("user_token");
                                    localStorage.removeItem("user_id");
                                    localStorage.removeItem("user_name");
                                    localStorage.removeItem("user_email");
                                    localStorage.removeItem("token_expired");
                                    location.reload();
                                    return;
                                }, 3000)
                            }
                        } else {
                            successCallback({});
                        }
                    } else {
                        errorCallback(err);
                    }
                });
        }, err => console.log(err))
    }

    static getContacts(account: Account, query: string, callback: (contacts: Array<any>) => void, errorCallback: (err: any) => void) {

        // Insert the notification in the db.
        let rqst = new FindRqst();

        // set connection infos.
        let id = account.name.split("@").join("_").split(".").join("_")
        let db = id + "_db";

        rqst.setId(id);
        rqst.setDatabase(db);
        rqst.setCollection("Contacts");
        rqst.setQuery(query);

        let token = localStorage.getItem("user_token")
        if (token == null) {
            errorCallback("User not logged in")
            throw `User not logged in`
        }

        let globule = Backend.getGlobule(account.domain)
        if (globule == null) {
            errorCallback("no globule was found at domain " + account.domain)
            return
        }

        if (globule.persistenceService == null) {
            errorCallback("Persistence service not found")
            throw `No persistence service found for domain ${account.domain}`
        }

        let stream = globule.persistenceService.find(rqst, {
            token: token,
            application: Application.name,
            domain: globule.domain
        });

        let data: any;
        data = [];

        stream.on("data", (rsp: FindResp) => {
            data = mergeTypedArrays(data, rsp.getData());
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                uint8arrayToStringMethod(data, (str: string) => {
                    callback(JSON.parse(str));
                });
            } else {
                console.log("fail to retreive contacts with error: ", status.details)
                // In case of error I will return an empty array
                callback([]);
            }
        });
    }

    public static setContact(from: Account, status_from: string, to: Account, status_to: string, successCallback: () => void, errorCallback: (err: any) => void) {

        // So here I will save the contact invitation into pending contact invitation collection...
        let rqst = new SetAccountContactRqst
        rqst.setAccountid(from.id + "@" + from.domain)

        let contact = new Contact
        contact.setId(to.id + "@" + to.domain)
        contact.setStatus(status_from)
        contact.setInvitationtime(Math.round(Date.now() / 1000))

        // Set optional values...
        if (to.ringtone)
            contact.setRingtone(to.ringtone)

        if (to.profilePicture)
            contact.setProfilepicture(to.profilePicture)

        rqst.setContact(contact)

        let token = localStorage.getItem("user_token")
        if (token == null) {
            errorCallback("User not logged in")
            throw `User not logged in`
        }

        let globule = Backend.getGlobule(from.domain)
        if (globule == null) {
            errorCallback("no globule was found at domain " + from.domain)
            return
        }

        if (globule.resourceService == null) {
            errorCallback("Resource service not found")
            throw `No resource service found for domain ${from.domain}`
        }

        globule.resourceService.setAccountContact(rqst, {
            token: token,
            application: Application.name,
            domain: globule.domain
        })
            .then((rsp: SetAccountContactRsp) => {
                let sentInvitation = `{"_id":"${to.id + "@" + to.domain}", "invitationTime":${Math.floor(Date.now() / 1000)}, "status":"${status_from}"}`

                Backend.getGlobule(from.domain).eventHub.publish(status_from + "_" + from.id + "@" + from.domain + "_evt", sentInvitation, false)
                if (from.domain != to.domain) {
                    Backend.getGlobule(to.domain).eventHub.publish(status_from + "_" + from.id + "@" + from.domain + "_evt", sentInvitation, false)
                }

                // Here I will return the value with it
                let rqst = new SetAccountContactRqst
                rqst.setAccountid(to.id + "@" + to.domain)

                let contact = new Contact
                contact.setId(from.id + "@" + from.domain)
                contact.setStatus(status_to)
                contact.setInvitationtime(Math.round(Date.now() / 1000))
                rqst.setContact(contact)

                let token = localStorage.getItem("user_token")
                if (token == null) {
                    errorCallback("User not logged in")
                    throw `User not logged in`
                }

                let globule = Backend.getGlobule(to.domain)
                if (globule == null) {
                    errorCallback("no globule was found at domain " + to.domain)
                    return
                }

                if (globule.resourceService == null) {
                    errorCallback("Resource service not found")
                    throw `No resource service found for domain ${to.domain}`
                }

                // call persist data
                globule.resourceService
                    .setAccountContact(rqst, {
                        token: token,
                        application: Application.name,
                        domain: globule.domain
                    })
                    .then((rsp: ReplaceOneRsp) => {
                        // Here I will return the value with it
                        let receivedInvitation = `{"_id":"${from.id + "@" + from.domain}", "invitationTime":${Math.floor(Date.now() / 1000)}, "status":"${status_to}"}`
                        Backend.getGlobule(from.domain).eventHub.publish(status_to + "_" + to.id + "@" + to.domain + "_evt", receivedInvitation, false)
                        if (from.domain != to.domain) {
                            Backend.getGlobule(to.domain).eventHub.publish(status_to + "_" + to.id + "@" + to.domain + "_evt", receivedInvitation, false)
                        }
                        successCallback();
                    })
                    .catch(errorCallback);
            }).catch(errorCallback);
    }

    // Get all accounts from all globules... 
    static getAccounts(query: string, callback: (accounts: Array<Account>) => void, errorCallback: (err: any) => void) {
        let accounts_ = new Array<Account>()
        let connections = Backend.getGlobules()
        let _getAccounts_ = () => {
            let globule = connections.pop()
            if (globule) {
                if (connections.length == 0) {
                    AccountController._getAccounts(globule, query, (accounts: Array<Account>) => {
                        for (var i = 0; i < accounts.length; i++) {
                            let a = accounts[i]
                            if (accounts_.filter(a_ => { return a.id == a_.id && a.domain == a_.domain; }).length == 0) {
                                accounts_.push(a)
                            }
                        }
                        callback(accounts_)
                    }, errorCallback)
                } else {
                    AccountController._getAccounts(globule, query, (accounts: Array<Account>) => {
                        for (var i = 0; i < accounts.length; i++) {
                            let a = accounts[i]
                            if (accounts_.filter(a_ => { return a.id == a_.id && a.domain == a_.domain; }).length == 0) {
                                accounts_.push(a)
                            }
                        }
                        _getAccounts_() // get the account from the next globule.
                    }, errorCallback)
                }
            }
        }

        // get account from all register peers.
        _getAccounts_()
    }

    // Get all account data from a give globule...
    private static _getAccounts(globule: Globular, query: string, callback: (accounts: Array<Account>) => void, errorCallback: (err: any) => void) {

        if (globule.resourceService == null) {
            errorCallback("Resource service not found")
            throw `No resource service found for domain ${globule.domain}`
        }

        let token = localStorage.getItem("user_token")
        if (token == null) {
            errorCallback("User not logged in")
            throw `User not logged in`
        }

        let rqst = new GetAccountsRqst
        rqst.setQuery(query)

        let stream = globule.resourceService.getAccounts(rqst, { domain: globule.domain, application: Application.name, token: token })
        let accounts_ = new Array<AccountInfo>();

        stream.on("data", (rsp) => {
            accounts_ = accounts_.concat(rsp.getAccountsList())
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                let accounts = new Array<Account>();

                if (accounts_.length == 0) {
                    callback(accounts);
                    return;
                }

                // In that case I will return the list of account without init ther data
                if (query == "{}") {
                    accounts_.forEach(a_ => {
                        if (AccountController.accounts[a_.getId() + "@" + a_.getDomain()] != undefined) {
                            accounts.push(AccountController.accounts[a_.getId() + "@" + a_.getDomain()])
                        } else {
                            let account = new Account(a_.getId(), a_.getEmail(), a_.getName(), a_.getDomain(), a_.getFirstname(), a_.getLastname(), a_.getMiddle(), a_.getProfilepicture())
                            accounts.push(account)
                        }
                    })
                    callback(accounts)
                    return
                }

                let initAccountData = () => {
                    let a_ = accounts_.pop()
                    if (a_) {
                        if (AccountController.accounts[a_.getId() + "@" + a_.getDomain()] == undefined) {
                            let a = new Account(a_.getId(), a_.getEmail(), a_.getName(), a_.getDomain(), a_.getFirstname(), a_.getLastname(), a_.getMiddle(), a_.getProfilepicture())

                            if (accounts_.length > 0) {
                                a.initData(() => {
                                    accounts.push(a)
                                    initAccountData()
                                }, errorCallback)
                            } else {
                                a.initData(
                                    () => {
                                        accounts.push(a)
                                        callback(accounts)
                                    }, errorCallback)
                            }
                        } else {
                            accounts.push(AccountController.accounts[a_.getId() + "@" + a_.getDomain()])
                            if (accounts_.length > 0) {
                                initAccountData()
                            } else {
                                callback(accounts)
                            }
                        }
                    } else if (accounts_.length > 0) {
                        initAccountData()
                    } else {
                        callback(accounts)
                    }
                }

                // intialyse the account data.
                initAccountData();

            } else {
                // In case of error I will return an empty array
                errorCallback(status.details)
            }
        });
    }

    static fromObject(obj: any): any {
        let account = new Account(obj._id, obj.email_, obj.name_, obj.domain_, obj.firstName_, obj.lastName_, obj.middleName_, obj.profilePicture_)
        AccountController.setAccount(account)
        return account
    }

    static fromString(jsonStr: string): any {
        return AccountController.fromObject(JSON.parse(jsonStr))
    }
}