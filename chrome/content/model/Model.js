/* ***** BEGIN LICENSE BLOCK
 * 
 * Pearltrees add-on AMO, Copyright(C), 2009, Broceliand SAS, Paris, France (company in charge of
 * developing Pearltrees)
 * 
 * This file is part of “Pearltrees add-on AMO”.
 * 
 * Pearltrees add-on AMO is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License version 3 as published by the Free Software Foundation.
 * 
 * Pearltrees add-on AMO is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 * PURPOSE. See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with Pearltrees add-on
 * AMO. If not, see <http://www.gnu.org/licenses/>
 * 
 * ***** END LICENSE BLOCK *****
 */

// ///////////////////////////////////////////////////////////////////////////////
// Model class
// Handle server connections and password managers
//
// Classes:
//
// BRO_model Communication with the server
// BRO_JSON Handle JSON objects
//
// ///////////////////////////////////////////////////////////////////////////////
com.broceliand.Model = {
    bro :com.broceliand,

    _json :null,
    _serviceUrl :null,

    _treeList :null, // treeItem: treeID, title, pearlCount, lastUpdate, depth, collapsed, assoId
    _treeListVisible :null, // treeItem: treeID, depth, hasChild, showCollapsed
    _currentUser :null, // user: userID, userDB, username, rootTreeID, dropZoneID

    _skipNotificationIfNotLoggedOnNextValidation :false,
    
    TITLE_NOT_AVAILABLE_TOKEN:"not_available",

    getServiceUrl : function () {
        return this._serviceUrl;
    },

    getTreeList : function () {
        return this._treeList;
    },

    setTreeList : function (value) {
        this._treeList = value;
    },

    getTreeListVisible : function () {
        return this._treeListVisible;
    },

    setTreeListVisible : function (value) {
        this._treeListVisible = value;
    },

    getTreeByID : function (treeID) {
        if (!this._treeList)
            return null;

        for ( var i = 0; i < this._treeList.length; i++) {
            if (this._treeList[i].treeID == treeID) {
                return this._treeList[i];
            }
        }
        return null;
    },

    addNewTreeToList : function ( newTreeTitle, parentTreeID) {
        var newTree = new Object;
        newTree.title = newTreeTitle;
        newTree.parentTreeID = parentTreeID;
        newTree.depth = this.getTreeByID(parentTreeID).depth + 1;
        newTree.isNewTree = true;
        newTree.treeID = -1 * com.broceliand.Tools.getRandomNumber(1000); // tmp ID

        this._treeList[this._treeList.length] = newTree;

        return newTree;
    },

    getCurrentUser : function () {
        return this._currentUser;
    },

    setCurrentUser : function ( value) {
        this._currentUser = value;
    },

    getRootTree : function () {
        if (!this._treeList || !this._currentUser)
            return null;

        var treeListLength = this._treeList.length;

        for ( var i = 0; i < treeListLength; i++) {
            if (this._treeList[i].treeID == this._currentUser.rootTreeID) {
                return this._treeList[i];
            }
        }
        return null;
    },

    ADD_SUCCESS :0,
    ADD_SUCCESS_ON_SWITCH :1,
    ADD_ERROR_INVALID_TREE :2,
    ADD_ERROR_TREE_DELETED :3,
    ADD_ERROR_IS_NOT_OWNER :4,

    LOGIN_SUCCESS :0,
    LOGIN_ERROR :1,

    TWITT_SUCCESS :0,
    TWITT_ERROR_CREATING_PEARL :5,
    TWITT_INVALID_TREE :6,

    skipNextRequestValidation :false,

    /**
     * Init server connection parameters
     * 
     * @todo Should be moved in a config file
     */
    init : function () {
        this._treeList = null;
        this._currentUser = null;
        this._serviceUrl = com.broceliand.config.SERVICE_FF_URL;

        // Try to use FF3 native json component
        if (Components.classes["@mozilla.org/dom/json;1"]) {
            this._json = Components.classes["@mozilla.org/dom/json;1"]
                    .createInstance(Components.interfaces.nsIJSON);
        }
        else {
            this._json = JSONFF2;
        }
    },

    /**
     * Create a GET XMLHttpRequest object with a valid cookie.
     * 
     * @param string url
     * @return XMLHttpRequest
     */
    createXMLHttpRequest : function (url,type) {
        var req = new XMLHttpRequest();
        if (type)
            req.open(type, url, true);
        else
            req.open('GET', url, true);

        return req;
    },

    notifyDownloadToAMO : function () {
        var url = com.broceliand.config.AMO_FILE_URL + "?src=" + com.broceliand.config.AMO_SOURCE;

        var req = this.createXMLHttpRequest(url);

        req.onreadystatechange = function ( e) {
            this.bro = com.broceliand;
            if (req.readyState == 4) {
                this.bro.Toolbar.onDownloadNotifiedToAMO();
            }
        };
        req.send(null);
    },

    notifyActiveUserToAMO : function (extension) {
        var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
                .getService(Components.interfaces.nsIXULAppInfo);
        var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"]
                .getService(Components.interfaces.nsIXULRuntime);

        var reqVersion = "%";             // request last version
        var version = extension.version;  // current addon version (e.g: 5.0.9)
        var id = extension.id;            // addon id (e.g: collector@broceliand.fr)
        var appID = appInfo.ID;           // Firefox Application ID
        var appVersion = appInfo.version; // Firefox version (e.g: 3.6b4)
        var locale = "";                  // lang (e.g: en_US). Removed because accessing useragent raised a warning in AMO
        var appOS = xulRuntime.OS;        // OS family (e.g: WINNT)
        var appABI = xulRuntime.XPCOMABI; // compiler info
        var maxAppVersion = extension.maxAppVersion; // addon max version supported
        var status = "userEnabled";       // is the addon enabled

        if (this.bro.Toolbar.extension) {
            if (extension.id == id) {
                status = (extension.enabled) ? "userEnabled" : "userDisabled";
            }
        }

        var url = com.broceliand.config.AMO_VERSION_CHECK + "?reqVersion=" + reqVersion + "&version="
                  + version + "&id=" + id + "&appID=" + appID + "&appVersion=" + appVersion
                  + "&locale=" + locale + "&appOS=" + appOS + "&appABI=" + appABI
                  + "&maxAppVersion=" + maxAppVersion + "&status=" + status;

        var req = com.broceliand.Model.createXMLHttpRequest(url);

        req.onreadystatechange = function ( e) {
            this.bro = com.broceliand;
            if (req.readyState == 4) {
                this.bro.Toolbar.onActiveUserNotifiedToAMO();
            }
        };
        req.send(null);
    },

    /**
     * Login in pearltrees
     */
    login : function ( username, password) {
        var action = 'loguser';

        password = this.bro.Tools.stringToMd5Hash(password);
        
        var params = '?username=' + encodeURIComponent(username) + 
                     '&password=' + encodeURIComponent(password) + 
                     '&isEncoded=1' +
                     '&time=' + com.broceliand.Tools.getTime() +
                     '&version='+ this.bro.Toolbar.addonVersion;

        this.bro.Log.log('login request (' + username + ')');

        var req = this.createXMLHttpRequest(this._serviceUrl + action + params);

        req.onreadystatechange = function ( e) {
            this.bro = com.broceliand;
            if (req.readyState == 4) {
                if (this.bro.Model.validateResponse(req, true)) {
                    if (req.responseText == this.bro.Model.LOGIN_ERROR) {
                        this.bro.LoginController.displayError();
                    }
                    else {
                        this.bro.LoginController.performSuccessAction();
                    }
                }
            }
            ;
        };
        req.send(null);
    },

    /**
     * Create a new tree
     */
    createTree : function (newTreeTitle, parentTreeID) {
        var action = 'start';
        var params = '?newTreeName=' + encodeURIComponent(newTreeTitle) + 
                     '&parentTreeID=' + parentTreeID + 
                     '&time=' + com.broceliand.Tools.getTime() +
                     '&version='+ this.bro.Toolbar.addonVersion;

        this.bro.Log.log('create a new tree (' + newTreeTitle + ', ' + parentTreeID + ')');

        var req = this.createXMLHttpRequest(this._serviceUrl + action + params);

        req.onreadystatechange = function ( e) {
            this.bro = com.broceliand;
            if (req.readyState == 4) {
                if (this.bro.Model.validateResponse(req, true)) {
                    if (req.responseText) {
                        var selectedTree = this.bro.InButtonController.getSelectedTree();
                        if (selectedTree.isNewTree) {
                            selectedTree.treeID = req.responseText;
                            selectedTree.isNewTree = false;
                        }
                    }
                }
            }
            ;
        };
        req.send(null);
    },

    addCommentAndPearl : function ( url, title, treeID, time, comment) {
        var action = 'addcomment';
        var comment = encodeURIComponent(comment);
        var canDuplicatePearl = (this.bro.Toolbar.isPearlCanBeDuplicated(url, treeID)) ? 1 : 0;

        var params = '?url=' + encodeURIComponent(url)
                     + '&time=' + time + '&comment=' + comment + '&dup=' + canDuplicatePearl;
        
        if (treeID) {
            params += '&treeID=' + treeID;
        }
        if(title) {
            title = encodeURIComponent(title.replace(/^\s*|\s*$/g, ''));
            params += '&title=' + title;
        }
        params += '&version='+ this.bro.Toolbar.addonVersion;
        
        this.bro.Log.log('comment and pearl (' + url + ', ' + title + ', ' + treeID + ', ' + time
                         + ', ' + comment + ', ' + canDuplicatePearl + ')');

        var req = this.createXMLHttpRequest(this._serviceUrl + action + params);

        req.onreadystatechange = function ( e) {
            this.bro = com.broceliand;
            if (req.readyState == 4) {
                this.bro.Model.validateResponse(req, true);
            }
            ;
        };
        req.send(null);
    },

    addPearlAndTwitt : function ( url, title, time, treeID) {
        var action = 'twitt';
        var canDuplicatePearl = (this.bro.Toolbar.isPearlCanBeDuplicated(url, treeID)) ? 1 : 0;

        var params = '?url=' + encodeURIComponent(url)
                     + '&time=' + time + '&dup=' + canDuplicatePearl;
        
        if (treeID) {
            params += '&treeID=' + treeID;
        }
        if(title) {
            title = encodeURIComponent(title.replace(/^\s*|\s*$/g, ''));
            params += '&title=' + title;
        }
        params += '&version='+ this.bro.Toolbar.addonVersion;
        
        this.bro.Log.log('twitt and pearl (' + url + ', ' + title + ', ' + time + ', ' + treeID
                         + ', ' + canDuplicatePearl + ')');

        var req = this.createXMLHttpRequest(this._serviceUrl + action + params);

        req.onreadystatechange = function ( e) {
            this.bro = com.broceliand;
            if (req.readyState == 4) {
                if (this.bro.Model.validateResponse(req) && req.responseText) {
                    var result = req.responseText;

                    // If the twitt has been sent by the server successfully
                    if (result == this.bro.Model.TWITT_SUCCESS) {
                        this.bro.RecordButtonController.onTwittSentByServer();
                    }
                    else if (result == this.bro.Model.TWITT_ERROR_CREATING_PEARL) {
                        // Ignore the error. @todo do a special action
                        this.bro.RecordButtonController.onErrorSendingTwitt();
                    }
                    else if (result == this.bro.Model.TWITT_INVALID_TREE) {
                        // Ignore the error. @todo do a special action
                        this.bro.RecordButtonController.onErrorSendingTwitt();
                    }
                    // If a server error occurred, we send the twitt through the client
                    else if (com.broceliand.Tools.trim(req.responseText) != '') {
                        this.bro.RecordButtonController.sendTwittByClient(req.responseText);
                    }
                }
                else {
                    this.bro.RecordButtonController.onErrorSendingTwitt();
                }
            }
            ;
        };
        req.send(null);
    },

    /**
     * Add a new pearl
     */
    addPearl : function ( url, title, time, isStart, treeID, newTreeName, parentTreeID) {
        this.bro.ContextMenuItemController._isLink = false;
        var action = 'add';
        var canDuplicatePearl = (this.bro.Toolbar.isPearlCanBeDuplicated(url, treeID)) ? 1 : 0;

        var params = '?url=' + encodeURIComponent(url)
                     + '&time=' + time + '&dup=' + canDuplicatePearl;
        if (isStart) {
            params += '&isStart=' + isStart;
            params += '&newTreeName=' + encodeURIComponent(newTreeName);
        }
        if (treeID) {
            params += '&treeID=' + treeID;
        }
        if (parentTreeID) {
            params += '&parentTreeID=' + parentTreeID;
        }
        if(title != null) {
            title = encodeURIComponent(title.replace(/^\s*|\s*$/g, ''));
            if(title == "") {
                title = this.TITLE_NOT_AVAILABLE_TOKEN;
            }
            params += '&title=' + title;
        }
        params += '&version='+ this.bro.Toolbar.addonVersion;

        // If the method sent will create a pearl we run an effect
        // @todo run the effect on server response
        this.bro.buttonEffectHelper.runIsRecordingEffect();

        this.bro.Log.log('add pearl (' + url + ', ' + title + ', ' + time + ', ' + canDuplicatePearl
                         + ', ' + isStart + ', ' + treeID + ', ' + newTreeName + ', ' + parentTreeID + ')');

        var req = this.createXMLHttpRequest(this._serviceUrl + action + params);

        req.onreadystatechange = function (e) {
            this.bro = com.broceliand;
            if (req.readyState == 4) {
                if (this.bro.Model.validateResponse(req, true) && req.responseText) {
                    var result = req.responseText.split(",");
                    var code = result[0];
                    var newTreeID = (result.length > 0) ? result[1] : null;

                    // If recording in a deleted tree
                    if (code == this.bro.Model.ADD_ERROR_TREE_DELETED) {
                        this.bro.Toolbar.showTreeDeletedMessage();
                    }
                    // If a server error occurred
                    else if (code != this.bro.Model.ADD_SUCCESS
                             && code != this.bro.Model.ADD_SUCCESS_ON_SWITCH) {
                        this.bro.Toolbar.errorAddingPearl(req.responseText);
                    }

                    // If has created a new tree, we get the new treeID
                    if (newTreeID) {
                        var selectedTree = this.bro.InButtonController.getSelectedTree();
                        if (selectedTree.isNewTree) {
                            selectedTree.treeID = newTreeID;
                            selectedTree.isNewTree = false;
                            this.bro.Log.log("change selected tree ID to: " + newTreeID);
                        }
                    }
                }
            }
            ;
        };
        req.send(null);
    },

    /**
     * Validate URLs for inserts
     * 
     * @param string url
     */
    isValidUrl : function ( url) {
        if (!url
            || url == ''
            || url == 'about:blank'
            || url.lastIndexOf(com.broceliand.config.PUBLIC_URL) == 0
            || url.lastIndexOf('http://www.broceliand.fr') == 0
            || (url.lastIndexOf('http://www.pearltrees.com') == 0
                && url.lastIndexOf('http://www.pearltrees.com/blog') == -1
                && url.lastIndexOf('http://www.pearltrees.com/forum') == -1
                && url.lastIndexOf('play=1') == -1)
            || url.lastIndexOf('http://localhost') == 0 || url.lastIndexOf('http://127.0.0.1') == 0
            || url.substring(0, 4) != 'http') {
            return false;
        }
        return true;
    },

    getTreesAndCurrentUser : function ( skipNotificationIfNotLogged) {
        var action = 'gettreesandcurrentuser';
        var params = '?version='+this.bro.Toolbar.addonVersion;

        this._skipNotificationIfNotLoggedOnNextValidation = skipNotificationIfNotLogged;
        this.bro.Log.log('load trees and current user');

        var req = this.createXMLHttpRequest(this._serviceUrl + action + params);

        req.onreadystatechange = function (e) {
            this.bro = com.broceliand;
            if (req.readyState == 4) {
                if (this.bro.Model.validateResponse(req)) {
                    if (req.responseText) {

                        var response = this.bro.Model._json.decode(req.responseText);

                        var currentUserResponse = response.currentUser;
                        this.bro.Model.updateCurrentUser(currentUserResponse);

                        var listChanged = false;
                        var treeListResponse = this.bro.CollapsibleListController.init(response.treeList);

                        if (!this.bro.Model._treeList
                            || !this.bro.Model.areTreeListsEquals(treeListResponse,
                                                                  this.bro.Model._treeList)) {
                            this.bro.Model._treeList = this.bro.Model
                                    .mergeLocalTreeListWithServerList(treeListResponse);
                            this.bro.WindowManager.setTreeList(this.bro.Model._treeList);
                            // must be called after currentUser being set
                            this.bro.Toolbar.saveRootTreeIntoPreferences(this.bro.Model
                                    .getRootTreeFromTreeList());
                            this.bro.Toolbar.saveDropZoneIntoPreferences(this.bro.Model
                                    .getDropZoneFromTreeList());
                            listChanged = true;
                        }

                        if (listChanged) {
                            this.bro.CollapsibleListController.createTreeListVisible();
                            this.bro.InButtonController.onTreeListLoaded();
                        }
                        else {
                            this.bro.InButtonController.onTreeListNotChanged();
                        }
                    }
                }
            }
        };
        req.send(null);
    },

    getRootTreeFromTreeList : function () {
        var treeList = this.bro.Model.getTreeList();
        var currentUser = this.bro.Model.getCurrentUser();
        if (!treeList || !currentUser)
            return;

        for ( var i = 0; i < treeList.length; i++) {
            if (treeList[i].treeID == currentUser.rootTreeID) {
                return treeList[i];
            }
        }
        return null;
    },

    getDropZoneFromTreeList : function () {
        var treeList = this.bro.Model.getTreeList();
        var currentUser = this.bro.Model.getCurrentUser();
        if (!treeList || !currentUser)
            return;

        for ( var i = 0; i < treeList.length; i++) {
            if (treeList[i].treeID == currentUser.dropZoneID) {
                return treeList[i];
            }
        }
        return null;
    },

    updateCurrentUser : function ( value) {
        if (!this.bro.Model.areUserEquals(value, this.bro.Model._currentUser)) {
            this.bro.Model._currentUser = value;
            this.bro.WindowManager.setCurrentUser(this.bro.Model._currentUser);
            if (this.bro.Model._currentUser) {
                this.bro.Toolbar.saveCurrentUserIntoPreferences(this.bro.Model._currentUser);
            }
        }
        if (this.bro.Toolbar.getOptionWindow() && this.bro.Toolbar.getOptionWindow().document) {
            var statusDescription = this.bro.Toolbar.getOptionWindow().document
                    .getElementById('BRO_statusDescription');
            if (statusDescription) {
                if (this.bro.Toolbar.isUserLogged && this.bro.Model._currentUser) {
                    statusDescription.value = "signed as " + this.bro.Model._currentUser.username;
                }
                else {
                    statusDescription.value = "signed out";
                }
            }
        }
    },

    areTreeListsEquals : function ( list1, list2) {
        if (!list1 && !list2)
            return true;
        if ((!list1 && list2) || (list1 && !list2))
            return false;
        var list1Length = list1.length;
        var list2Length = list2.length;
        if (list1Length != list2Length)
            return false;

        for ( var i = 0; i < list1Length; i++) {
            if (list1[i].treeID != list2[i].treeID) {
                return false;
            }
            else if (list1[i].title != list2[i].title) {
                return false;
            }
            else if (list1[i].lastUpdate != list2[i].lastUpdate) {
                return false;
            }
            else if (list1[i].collapsed != list2[i].collapsed) {
                return false;
            }
            else if (list1[i].depth != list2[i].depth) {
                return false;
            }
            else if (list1[i].assoId != list2[i].assoId) {
                return false;
            }
        }
        return true;
    },

    mergeLocalTreeListWithServerList : function (serverTreeList) {
        var localTreeList = this.bro.Model._treeList;

        if (!localTreeList)
            return serverTreeList;
        if (!serverTreeList)
            return null;
        var serverTreeListLength = serverTreeList.length;
        var localTreeListLength = localTreeList.length;

        // Don't update trees if we don't need to
        for ( var i = 0; i < serverTreeListLength; i++) {
            for ( var j = 0; j < localTreeListLength; j++) {
                if (serverTreeList[i].treeID == localTreeList[j].treeID
                    && serverTreeList[i].title == localTreeList[j].title
                    && serverTreeList[i].lastUpdate == localTreeList[j].lastUpdate
                    && serverTreeList[i].collapsed == localTreeList[j].collapsed
                    && serverTreeList[i].depth == localTreeList[j].depth
                    && serverTreeList[i].assoId == localTreeList[j].assoId) {

                    serverTreeList[i] = localTreeList[j];
                    break;
                }
            }
        }

        // We add new trees which are not yet in the server list
        for ( var j = 0; j < localTreeListLength; j++) {
            if (localTreeList[j].isNewTree) {
                serverTreeList[serverTreeList.length] = localTreeList[j];
            }
        }

        return serverTreeList;
    },

    areUserEquals : function ( user1, user2) {
        if (!user1 && !user2)
            return true;
        if ( (!user1 && user2) || (user1 && !user2))
            return false;
        return (user1.userID == user2.userID) ? true : false;
    },

    /**
     * Validate XMLHttpRequest response and handle errors
     * 
     * @param resp XMLHttpRequest response
     */
    validateResponse : function ( resp, retryOnError) {
        if (!resp)
            return false;
        var status = null;
        var responseText = null;
        try {
            status = resp.status;
            responseText = resp.responseText;
        }
        catch (e) {
        }

        // Valid
        if (status == 200 || this.skipNextRequestValidation) {
            this.skipNextRequestValidation = false;
            this.bro.Toolbar.isUserLogged = true;
            return true;
        }
        // No session auth is opened.
        else if (status == 303) {
            this.bro.Log.log("server 303 Not Logged");
            this.bro.Toolbar.isUserLogged = false;
            if (!this.bro.Toolbar.isThirdPartyCookiesEnabled()) {
                if (this.bro.Toolbar.isUserWantToEnableThirdPartyCookies()) {
                    this.bro.Toolbar.enableThirdPartyCookies();
                    if (retryOnError)
                        this.bro.ButtonsHandler.startRecording();
                }
            }
            else if (!this._skipNotificationIfNotLoggedOnNextValidation) {
                this.bro.Toolbar.showLoginPopup();
            }
            this.bro.Model.resetModel();
        }
        // Unauthorized WWW-Authenticate
        else if (status == 401) {
            // do nothing
        }
        else {
            this.bro.Log.log("Invalid server response. HTTP status: " + status + " " + responseText);
            this.bro.Log.error(this.bro.Locale.getString('popup.error.responseError'));
        }
        this.skipNextRequestValidation = false;
        return false;
    },

    // @todo refactor
    resetModel : function () {
        // update model
        this.bro.Model.updateCurrentUser(null);

        this.bro.Model.setTreeList(null);
        this.bro.WindowManager.setTreeList(null);

        // update ButtonsHandler
        this.bro.InButtonController._selectedTree = null;

        this.bro.InButtonController.initTreeList();
        this.bro.Toolbar.lastUrlRecorded = null;
        this.bro.RecordButtonController.refreshRecordButtonLabel();
    },

    /**
     * Send collapse state change request 
     */
    updateCollapsedInServer : function (treeChangedList) {
        var action = 'updatetreecollapsed';

        var req = this.createXMLHttpRequest(this._serviceUrl + action,'POST');
        req.send(this._json.encode(treeChangedList));
    }
};
