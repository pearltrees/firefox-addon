/* ***** BEGIN LICENSE BLOCK
 * 
 * Pearltrees add-on AMO, Copyright(C), 2009, Broceliand SAS, Paris, France
 * (company in charge of developing Pearltrees)
 * 
 * This file is part of “Pearltrees add-on AMO”.
 * 
 * Pearltrees add-on AMO is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published
 * by the Free Software Foundation.
 * 
 * Pearltrees add-on AMO is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * Pearltrees add-on AMO. If not, see <http://www.gnu.org/licenses/>
 * 
 * ***** END LICENSE BLOCK *****
 */

com.broceliand.Toolbar = {
    bro :com.broceliand,

    MAX_PEARLS_IN_TREE :100,

    TWITTER_URL :"http://twitter.com/home/",

    isOnline :false,
    isHidden :true,
    isRevealed :true,
    isFirstInstallMode :false,
    isUpdate :false,
    isUserLogged :false,
    isFirstRunAfterInstall :false,
    isTimeToShowReminder:false,
    lastUrlRecorded :null,
    lastUrlRecordedTreeID :null,
    browsersWithPearltreesOnLastRecord :null,
    isInit :false,
    showHelpOnRecording :false,
    helpStartupWindow :null,
    nameTreeWindow :null,
    optionWindow :null,
    initTime :null,
    viewLoaded :false,
    lastUrlChangeIsPearltrees :false,
    lastUrlTwitted :null,
    addonVersion :null,

    init : function () {
        this.isInit = true;

        // Log
        this.bro.Log.init();
        var d = new Date();
        this.bro.Toolbar.initTime = d.getTime();
        this.bro.Log.log("initializing");

        // Local
        this.bro.Locale.init();

        this.bro.Toolbar.validateEnv();

        // Model
        this.bro.Model.init();
        this.bro.WindowManager.init();

        // Listeners
        this.bro.BrowserManager.init();
        this.bro.ListenerHandler.init();
        this.bro.Toolbar.initFlexCommandListener();

        window.addEventListener("online", this.bro.Toolbar.onOnline, false);
        window.addEventListener("offline", this.bro.Toolbar.onOffline, false);

        // Detect installation / updates and load user stats
        this.getAddonVersionAndLoadPreferences();

        // UI
        this.bro.ButtonsHandler.init();
    },

    onUninstall : function () {
        this.bro.Log.log("Uninstalling");

        this.bro.Toolbar.resetPreferences();
        this.bro.ButtonsHandler.removeAllButtons();
    },

    onFirstInstall : function () {
        this.bro.Log.log("Installing");
        this.isFirstInstall = true;

        if (this.viewLoaded) {
            this.performFirstInstallActions();
        }
    },

    performFirstInstallActions : function () {
        if (!this.viewLoaded)
            return;
        this.bro.ButtonsHandler.addFirstInstallButtonInNavBar();
        this.bro.Model.getTreesAndCurrentUser(skipNotificationIfNotLogged = true);
        if (this.bro.config.ADDON_SOURCE == this.bro.sourceTypes.ADDON_SOURCE_AMO) {
            // Add some time before showing pearltrees
            this.bro.Tools.callWithDelay('com.broceliand.Toolbar.openCreateAccountPage()', 1000);
        }
    },

    onUpdate : function () {
        this.bro.Log.log("Updating");
        this.isUpdate = true;

        if (this.viewLoaded) {
            this.performUpdateActions();
        }
    },

    performUpdateActions : function () {
        if (!this.viewLoaded)
            return;
        if (this.bro.ButtonsHandler.restoreDefaultPostionOnLoad) {
            this.bro.ButtonsHandler.restoreDefaultPositionInNavbar();
            this.bro.ButtonsHandler.restoreDefaultPostionOnLoad = false;
        }
        this.bro.Model.getTreesAndCurrentUser(skipNotificationIfNotLogged = true);
    },
    
    performReminder : function () {
        this.bro.Tools.callWithDelay('com.broceliand.HomeButtonController.openPopup()', 2000);
    },
    
    updateReminderState : function (installTime, lastReminderTime, nextReminderTime) {
        if(!this.isFirstInstallMode || !installTime || !lastReminderTime || !nextReminderTime) return;
        
        installTime = parseInt(installTime);
        lastReminderTime = parseInt(lastReminderTime);
        nextReminderTime = parseInt(nextReminderTime);
        var currentTime = (new Date()).getTime();
        
        var day = 1000*60*60*24;
        var week = day*7;
        var month = day*30;
        
        if(currentTime >= nextReminderTime) {
            if((nextReminderTime - lastReminderTime) >= month) {
                this.saveReminderStateIntoPreferences(currentTime, currentTime+month);
                this.isTimeToShowReminder = true;
            }
            else if((nextReminderTime - lastReminderTime) >= week) {
                this.saveReminderStateIntoPreferences(currentTime, currentTime+month);
                this.isTimeToShowReminder = true;
            }
            else if((nextReminderTime - lastReminderTime) >= day) {
                this.saveReminderStateIntoPreferences(currentTime, currentTime+week);
                this.isTimeToShowReminder = true;
            }
        }
        
        this.isTimeToShowReminder = true;
                
        // this.bro.Log.log("installTime: "+installTime+" lastReminderTime: "+lastReminderTime+" nextReminderTime: "+nextReminderTime);
    },
    
    saveReminderStateIntoPreferences : function (lastReminderTime, nextReminderTime) {
        var prefs = this.getAddonPreferences();
        prefs.setCharPref("last_reminder_time", lastReminderTime);
        prefs.setCharPref("next_reminder_time", nextReminderTime);
    },

    getAddonPreferences : function () {
        return Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService)
                .getBranch(com.broceliand.config.PREF_BRANCH);
    },

    onDownloadNotifiedToAMO : function () {
        var prefs = this.getAddonPreferences();

        prefs.setBoolPref("amo_dl_notified", true);

        this.bro.Log.log("AMO notified of download");
    },

    onActiveUserNotifiedToAMO : function () {
        var prefs = this.getAddonPreferences();

        prefs.setCharPref("amo_active_date", this.bro.Toolbar.formatCurrentDayDate());

        this.bro.Log.log("AMO notified of being active");
    },

    formatCurrentDayDate : function () {
        var date = new Date();
        return date.getFullYear() + "" + (date.getMonth() + 1) + "" + date.getDate();
    },

    isThirdPartyCookiesEnabled : function () {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService).getBranch("network.cookie.");
        var cookieBehavior = prefs.getIntPref("cookieBehavior");

        return (cookieBehavior == 0) ? true : false;
    },

    enableThirdPartyCookies : function () {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService).getBranch("network.cookie.");
        prefs.setIntPref("cookieBehavior", 0);
    },

    /**
     * @todo create a custom dialog in order to remove the default image:
     * @see https://developer.mozilla.org/en/Code_snippets/Dialogs_and_Prompts
     * 
     * @return boolean
     */
    isUserWantToEnableThirdPartyCookies : function () {
        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Components.interfaces.nsIPromptService);
        return prompts.confirm(window, "", this.bro.Locale.getString('cookiesError.text'));
    },

    resetPreferences : function () {
        var prefs = this.getAddonPreferences();
        prefs.setBoolPref("firstrun", true);
        prefs.setBoolPref("firstuse", true);
        prefs.setBoolPref("isFirstInstallMode", true);
        prefs.setBoolPref("amo_dl_notified", false);
        prefs.setCharPref("amo_active_date", "");
        prefs.setCharPref("version", "");
        prefs.setCharPref("currentUser", "");
        prefs.setCharPref("rootTree", "");
        prefs.setCharPref("dropZone", "");
        prefs.setCharPref("install_time", "");
        prefs.setCharPref("last_reminder_time", "");
        prefs.setCharPref("next_reminder_time", "");
    },

    getAddonVersionAndLoadPreferences : function() {
        if (this.isBrowserVersionGreaterOrEqual("3.7")) {
            Components.utils.import("resource://gre/modules/AddonManager.jsm");  
            AddonManager.getAddonByID(com.broceliand.config.ADDON_ID, function(addon) {
                    com.broceliand.Toolbar.extension = addon;
                    com.broceliand.Toolbar.addonVersion = addon.version;
                    com.broceliand.Toolbar.loadPreferences();
                });
            AddonManager.addAddonListener(com.broceliand.AddonListener);
        }
        else {
            var gExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
                                                     .getService(Components.interfaces.nsIExtensionManager);
            this.extension = gExtensionManager.getItemForID(com.broceliand.config.ADDON_ID);
            this.addonVersion = this.extension.version;
            this.loadPreferences();
        }
    },

    loadPreferences : function () {
        var addonVersion = this.extension.version;
        var prefs = this.getAddonPreferences();

        var ver = -1;
        var firstrun = true;
        var firstuse = true;
        var isFirstInstallMode = true;
        var amoDownloadNotified = false;
        var amoLastActiveDate = "";
        var currentUser = null;
        var installTime = null;
        var lastReminderTime = null;
        var nextReminderTime = null;
        this.showHelpOnRecording = false;
        this.addonVersion = addonVersion;

        try {
            ver = prefs.getCharPref("version");
            firstrun = prefs.getBoolPref("firstrun");
            firstuse = prefs.getBoolPref("firstuse");
            isFirstInstallMode = prefs.getBoolPref("isFirstInstallMode");
            installTime = prefs.getCharPref("install_time");
            lastReminderTime = prefs.getCharPref("last_reminder_time");
            nextReminderTime = prefs.getCharPref("next_reminder_time");
            amoDownloadNotified = prefs.getBoolPref("amo_dl_notified");
            amoLastActiveDate = prefs.getCharPref("amo_active_date");
        }
        catch (e) {
            // nothing
        }
        finally {
            // if it is the first pearlbar installation
            if (firstrun) {
                prefs.setBoolPref("firstrun", false);
                firstuse = true;
                prefs.setBoolPref("firstuse", firstuse);
                isFirstInstallMode = true;
                prefs.setBoolPref("isFirstInstallMode", true);
                prefs.setCharPref("version", this.addonVersion);
                var curTime = (new Date()).getTime();
                prefs.setCharPref("install_time", curTime);
                prefs.setCharPref("last_reminder_time", curTime);
                prefs.setCharPref("next_reminder_time", curTime+(1000*60*60*24));
                
                com.broceliand.Toolbar.onFirstInstall();
            }
            // if this is a pearlbar update
            else if (ver != this.addonVersion) {
                var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
                        .getService(Components.interfaces.nsIVersionComparator);
                if (versionChecker.compare(ver, "5.2.1") < 0) {
                    this.bro.ButtonsHandler.restoreDefaultPostionOnLoad = true;
                    firstuse = true;
                    prefs.setBoolPref("firstuse", firstuse);
                }
                prefs.setCharPref("version", this.addonVersion);

                this.onUpdate();
                this.showHelpOnRecording = true;
            }
            this.isFirstRunAfterInstall = firstrun;
            this.isFirstInstallMode = isFirstInstallMode;
            this.showHelpOnRecording = firstuse;
            this.bro.InButtonController.setMode(this.bro.InButtonController.defaultMode);
            if(isFirstInstallMode) {
                //this.updateReminderState(installTime, lastReminderTime, nextReminderTime);
            }
            
            if (com.broceliand.Toolbar.bro.config.ADDON_SOURCE == this.bro.sourceTypes.ADDON_SOURCE_SELFHOSTED) {
                if (!amoDownloadNotified) {
                    this.bro.Model.notifyDownloadToAMO();
                }
                if (amoLastActiveDate != com.broceliand.Toolbar.formatCurrentDayDate()) {
                    this.bro.Model.notifyActiveUserToAMO(this.extension);
                }
            }

            this.bro.Model.updateCurrentUser(this.backupCurrentUserFromPreferences());
        }
    },

    backupCurrentUserFromPreferences : function () {
        var prefs = this.getAddonPreferences();
        var currentUser = null;
        try {
            currentUser = prefs.getCharPref("currentUser");
        }
        catch (e) {
        }
        return (currentUser && currentUser != '') ? this.bro.Model._json.decode(currentUser) : null;
    },

    saveCurrentUserIntoPreferences : function ( currentUser) {
        var prefs = this.getAddonPreferences();
        var encodedUser = (currentUser) ? this.bro.Model._json.encode(currentUser) : '';
        prefs.setCharPref("currentUser", encodedUser);
    },

    backupRootTreeFromPreferences : function () {
        var prefs = this.getAddonPreferences();
        var rootTree = null;
        try {
            rootTree = prefs.getCharPref("rootTree");
        }
        catch (e) {
        }
        return (rootTree && rootTree != '') ? this.bro.Model._json.decode(rootTree) : null;
    },

    saveRootTreeIntoPreferences : function ( rootTree) {
        var prefs = this.getAddonPreferences();
        var encodedRootTree = (rootTree) ? this.bro.Model._json.encode(rootTree) : '';
        prefs.setCharPref("rootTree", encodedRootTree);
    },

    backupDropZoneFromPreferences : function () {
        var prefs = this.getAddonPreferences();
        var dropZone = null;
        try {
            dropZone = prefs.getCharPref("dropZone");
        }
        catch (e) {
        }
        return (dropZone && dropZone != '') ? this.bro.Model._json.decode(dropZone) : null;
    },

    saveDropZoneIntoPreferences : function ( dropZone) {
        var prefs = this.getAddonPreferences();
        var encodedDropZone = (dropZone) ? this.bro.Model._json.encode(dropZone) : '';
        prefs.setCharPref("dropZone", encodedDropZone);
    },

    setFirstUse : function ( value) {
        var prefs = this.getAddonPreferences();
        prefs.setBoolPref("firstuse", value);
        this.showHelpOnRecording = value;
    },

    setFirstInstallMode : function (value) {
        if (this.isFirstInstallMode && !value) {
            this.bro.ButtonsHandler.restoreDefaultPositionInNavbar();
            // There is a bug while calculating the button width at this time
            // this.bro.ButtonsHandler.onButtonsCreated();
            this.bro.RecordButtonController.refreshModeSelection();
            this.bro.InButtonController.refreshTreeListVisualComponents();
        }
        this.isFirstInstallMode = value;

        var prefs = this.getAddonPreferences();
        prefs.setBoolPref("isFirstInstallMode", value);
    },

    onQuit : function () {
    },

    addUrlRecorded : function ( url, treeID) {
        this.bro.Toolbar.lastUrlRecorded = url;
        this.bro.Toolbar.lastUrlRecordedTreeID = treeID;
        this.bro.NoteController.init();
        this.bro.Toolbar.addPearlCountToSelection();
        this.bro.Toolbar.addUrlRecordedCountToSelection();

        var pearlCount = this.getSelectionPearlCount();
        var urlRecordedCount = this.getSelectionUrlRecordedCount();
        var isDropZoneSelected = this.bro.InButtonController.isDropZoneSelected();
    },

    isPearlCanBeDuplicated : function ( url, treeID) {
        return (this.lastUrlRecorded == url && this.isRevealed && this.lastUrlRecordedTreeID != treeID);
    },

    setRevealed : function (value) {
        this.bro.Toolbar.isRevealed = value;
        if (!value) {
            this.browsersWithPearltreesOnLastRecord = this.bro.BrowserManager.getAllBrowserIDsWithPearltrees();
        }
        else {
            this.browsersWithPearltreesOnLastRecord = new Array();
        }
    },

    isCurrentTreeFull : function () {
        var pearlCount = this.getSelectionPearlCount();
        var isDropZoneSelected = this.bro.InButtonController.isDropZoneSelected();

        if (pearlCount >= this.MAX_PEARLS_IN_TREE && !isDropZoneSelected) {
            this.bro.Toolbar.showTreeFullWindow();
            return true;
        }

        return false;
    },

    addPearlCountToSelection : function () {
        var selectedTree = this.bro.InButtonController.getSelectedTree();
        if (!selectedTree)
            return;

        var pearlCount = this.getSelectionPearlCount();
        selectedTree.pearlCount = pearlCount + 1;
    },

    addUrlRecordedCountToSelection : function () {
        var selectedTree = this.bro.InButtonController.getSelectedTree();
        if (!selectedTree)
            return;

        var urlRecordedCount = this.getSelectionUrlRecordedCount();
        selectedTree.urlRecordedCount = urlRecordedCount + 1;
    },

    getSelectionPearlCount : function () {
        var selectedTree = this.bro.InButtonController.getSelectedTree();
        if (!selectedTree)
            return 0;

        var pearlCount = parseInt(selectedTree.pearlCount);
        if (isNaN(pearlCount)) {
            return 0;
        }
        else {
            return pearlCount;
        }
    },

    getSelectionUrlRecordedCount : function () {
        var selectedTree = this.bro.InButtonController.getSelectedTree();
        if (!selectedTree)
            return 0;

        var urlRecordedCount = parseInt(selectedTree.urlRecordedCount);
        if (isNaN(urlRecordedCount)) {
            return 0;
        }
        else {
            return urlRecordedCount;
        }
    },

    isCurrentUrlRecorded : function () {
        return (this.lastUrlRecorded && this.lastUrlRecorded == this.bro.BrowserManager
                .getSelectedBrowserUrl());
    },

    showHelpOnFirstOver : function () {
        if (this.showHelpOnRecording) {
            this.bro.Toolbar.showFirstHelp();
            this.setFirstUse(false);
        }
    },

    treeSelectionChanged : function () {
        if (!this.bro.Toolbar.isCurrentUrlRecorded()) {
            this.bro.Toolbar.lastUrlRecorded = null;
            this.bro.Toolbar.lastUrlRecordedTreeID = null;
        }
    },

    openCreateAccountPage : function () {
        var domain = this.bro.Toolbar.getCurrentPearltreesPublicUrl();
        this.bro.Tools.openURLinDomainTabOrNew(com.broceliand.config.SERVICE_FF_URL
                                               + "createAccount", domain);
    },

    openLoginPage : function () {
        var domain = this.bro.Toolbar.getCurrentPearltreesPublicUrl();
        this.bro.Tools.openURLinDomainTabOrNew(com.broceliand.config.SERVICE_FF_URL + "login",
                                               domain);
    },
       
    openSocialSyncPage : function () {
        var domain = this.bro.Toolbar.getCurrentPearltreesPublicUrl();
        this.bro.Tools.openURLinDomainTabOrNew(domain+"#/DP-n=socialSync", domain);
    },

    reveal : function () {
        //this.bro.buttonEffectHelper.runRevealEffect();

        //var revealDelay = this.bro.buttonEffectHelper.REVEAL_EFFECT_TIME;
        var revealDelay = 0;
        
        var currentUser = this.bro.Model.getCurrentUser();
        var selectedTree = this.bro.InButtonController.getSelectedTree();
        var selectedTreeID = (selectedTree) ? selectedTree.treeID : null;

        // If there is a selected tree we reveal this tree
        if (currentUser && selectedTreeID) {
            var isInPearltrees = this.isInPearltrees();
            var flexSelectedTreeID = this.getFlexSelectedTreeIdFromAnchorParams();
            if (isInPearltrees && selectedTreeID == flexSelectedTreeID) {
                gBrowser.reload();
            }
            else {
                this.openSelectedTreeInPearltreesTabOrNew(revealDelay);
            }
        }
        // Else we reveal the current tree
        else {
            var domain = this.bro.Toolbar.getCurrentPearltreesPublicUrl();
            com.broceliand.Tools.openURLinDomainTabOrNew(com.broceliand.config.SERVICE_FF_URL
                                                         + "reveal", domain, revealDelay);
        }
    },

    getSelectedTreeNavigationUrl : function ( focusIfSelected) {
        var currentUser = this.bro.Model.getCurrentUser();
        if (!currentUser)
            return;

        var selectedTree = this.bro.InButtonController.getSelectedTree();
        var selectedTreeID = (selectedTree) ? selectedTree.treeID : null;

        var isDropZoneSelected = (selectedTreeID == currentUser.dropZoneID);

        if (isDropZoneSelected || !selectedTreeID || selectedTreeID < 0) {
            selectedTreeID = currentUser.rootTreeID;
        }

        var flexUrl = this.bro.Toolbar.getCurrentPearltreesPublicUrl();
        flexUrl += "#/N-u=" + currentUser.userDB + "_" + currentUser.userID;
        if (selectedTree.assoId) {
            flexUrl += "&N-fa=" + selectedTree.assoId;
        }
        flexUrl += "&N-f=" + currentUser.userDB + "_" + selectedTreeID;
        flexUrl += "&N-s=" + currentUser.userDB + "_" + selectedTreeID;
        flexUrl += "&N-reveal=1";

        return flexUrl;
    },

    openSelectedTreeInPearltreesTabOrNew : function ( delay, focusIfSelected) {
        var flexUrl = this.getSelectedTreeNavigationUrl(focusIfSelected);
        var domain = this.bro.Toolbar.getCurrentPearltreesPublicUrl();

        com.broceliand.Tools.openURLinDomainTabOrNew(flexUrl, domain, delay);
    },

    openSelectedTreeInCurrentTab : function ( delay, focusIfSelected) {
        var flexUrl = this.getSelectedTreeNavigationUrl(focusIfSelected);
        com.broceliand.Tools.openURLinCurrentTab(flexUrl, delay);
    },

    onUseToolbar : function () {
        this.bro.buttonEffectHelper.stopHelpEffects();
    },

    onLocationChange : function (url) {
        this.bro.ContextMenuItemController._isLink = false;
        // Is in pearltrees
        if (this.isInPearltrees()) {
            this.lastUrlChangeIsPearltrees = true;
            var params = this.getCurrentUrlAnchorParams();

            // Run & stop samba effect
            if (params['Pearlbar-samba'] == '1') {
                this.bro.buttonEffectHelper.runHelpEffects();
            }
            else {
                this.bro.buttonEffectHelper.stopHelpEffects();
            }

            this.bro.InButtonController.setMode(this.bro.InButtonController.MODE_NAVIGATE);
            this.bro.InButtonController.setModeSwitcherVisibility(false);

            var currentUser = this.bro.Model.getCurrentUser();
            var selectedTree = this.bro.InButtonController.getSelectedTree();
            var selectedTreeID = (selectedTree) ? selectedTree.treeID : null;
            var browserID = this.bro.BrowserManager.getSelectedBrowserID();
            var isBrowserWithPearltreeOnLastRecord = (this.browsersWithPearltreesOnLastRecord && this.browsersWithPearltreesOnLastRecord.indexOf(browserID) != -1);
            
            // If there is a pearl to reveal and a selected tree we reveal in this tree.
            // The tab must have been created before the last pearl was pearled.
            if (!this.isRevealed && currentUser && selectedTreeID && isBrowserWithPearltreeOnLastRecord) {

                this.setRevealed(true);

                if (selectedTreeID != currentUser.dropZoneID) {
                    this.openSelectedTreeInCurrentTab();
                }
            }
            // Sync with Flex navigation if the current user is in his account
            else if (this.isCurrentUserInHisPearltreesAccount()) {
                var flexSelectedTreeID = this.getFlexSelectedTreeIdFromAnchorParams();
                var flexFocusedTreeID = this.getFlexFocusedTreeIdFromAnchorParams();

                var treeIdToSelect = null;
                // First try to find the current Flex selected tree in the list
                if (flexSelectedTreeID) {
                    treeIdToSelect = flexSelectedTreeID;
                }
                // Else try to find the current Flex focused tree in the list
                else if (flexFocusedTreeID) {
                    treeIdToSelect = flexFocusedTreeID;
                }
                // We select the root
                else {
                    treeIdToSelect = currentUser.rootTreeID;
                }

                if (selectedTreeID != treeIdToSelect) {
                    this.bro.InButtonController.selectTree(treeIdToSelect,false,false,true);

                    // If the tree is not in the list, we refresh the list.
                    // (without alert if the user is not logged).
                    if (!this.bro.InButtonController.isTreeIdInTreeList(treeIdToSelect)) {
                        this.bro.Model.skipNextRequestValidation = true;
                        this.bro.Model.getTreesAndCurrentUser();
                    }
                }
            }
            
            // In any case, if we went in a tab with pearltrees we change the state to revealed
            this.setRevealed(true);
        }
        else {
            var isLeavingPearltrees = this.lastUrlChangeIsPearltrees;
            this.lastUrlChangeIsPearltrees = false;
            if (isLeavingPearltrees) {
                this.bro.InButtonController.setMode(this.bro.InButtonController.defaultMode);
            }
            this.bro.InButtonController.setModeSwitcherVisibility(true);
            this.bro.buttonEffectHelper.stopHelpEffects();
        }
        this.bro.RecordButtonController.refreshRecordButtonLabel();
    },

    isCurrentUserInHisPearltreesAccount : function () {
        if (!this.isInPearltrees())
            return false;
        var currentUser = this.bro.Model.getCurrentUser();
        var currentUserID = (currentUser) ? currentUser.userID : null;
        if (!currentUserID)
            return false;

        // Find the user id in the URL
        var urlParams = this.getCurrentUrlAnchorParams();
        var urlUserParam = urlParams['N-u'];
        var urlUserId = null;
        if (urlUserParam && urlUserParam.indexOf('_') != -1) {
            urlUserId = urlUserParam.split("_")[1];
        }

        return (urlUserId == currentUserID);
    },

    getFlexSelectedTreeIdFromAnchorParams : function () {
        var params = this.getCurrentUrlAnchorParams();
        var selectionParam = params['N-s'];
        if (selectionParam && selectionParam.indexOf('_') != -1) {
            return selectionParam.split("_")[1];
        }
        else {
            return null;
        }
    },

    getFlexFocusedTreeIdFromAnchorParams : function () {
        var params = this.getCurrentUrlAnchorParams();
        var focusParam = params['N-f'];
        if (focusParam && focusParam.indexOf('_') != -1) {
            return focusParam.split("_")[1];
        }
        else {
            return null;
        }
    },

    getCurrentPearltreesPublicUrl : function () {
        var currentUrl = this.bro.BrowserManager.getSelectedBrowserUrl();
        var pearltreesUrl = null;
        // If the current tab display pearltrees
        if (currentUrl && currentUrl.lastIndexOf(com.broceliand.config.PUBLIC_URL) == 0) {
            pearltreesUrl = currentUrl.substr(0, currentUrl.indexOf('#'));
        }

        if (!pearltreesUrl) {
            pearltreesUrl = com.broceliand.config.PUBLIC_URL + "/";
        }

        return pearltreesUrl;
    },

    getCurrentUrlAnchorParams : function () {
        var currentUrl = this.bro.BrowserManager.getSelectedBrowserUrl();
        var params = [];
        var paramsString = currentUrl.substr(currentUrl.indexOf('#/') + 2, currentUrl.length);

        if (paramsString.length == 0) {
            return params;
        }
        else if (paramsString.indexOf('&') != -1) {
            var nvPairs = paramsString.split("&");
            for (i = 0; i < nvPairs.length; i++) {
                var nvPair = nvPairs[i].split("=");
                var name = nvPair[0];
                var value = nvPair[1];
                params[name] = value;
            }
        }
        else {
            var nvPair = paramsString.split("=");
            var name = nvPair[0];
            var value = nvPair[1];
            params[name] = value;
        }

        return params;
    },

    isInPearltrees : function () {
        // If the current tab display pearltrees
        var currentUrl = this.bro.BrowserManager.getSelectedBrowserUrl();
        return this.isPearltreesPublicUrl(currentUrl);
    },

    isPearltreesPublicUrl : function (url) {
        if (!url) {
            return false;
        }
        else {
            return (url.lastIndexOf(com.broceliand.config.PUBLIC_URL) == 0);
        }
    },

    showOptions : function () {
        var win = window.openDialog("chrome://broceliand/content/view/options.xul", "PrefWindow",
                                    "chrome=yes," + "titlebar=yes," + "toolbar=yes,"
                                            + "centerscreen=yes," + "dialog=no");
        this.bro.Toolbar.setOptionWindow(win);
    },

    setOptionWindow : function ( value) {
        this.bro.Toolbar.optionWindow = value;
    },

    getOptionWindow : function () {
        return this.bro.Toolbar.optionWindow;
    },

    record : function () {
        this.bro.ButtonsHandler.startRecording();
    },

    isBrowserVersionGreaterOrEqual : function ( versionToCompare) {
        var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
                .getService(Components.interfaces.nsIXULAppInfo);
        var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
                .getService(Components.interfaces.nsIVersionComparator);
        return (versionChecker.compare(appInfo.version, versionToCompare) >= 0);
    },

    showLoginPopup : function ( showErrorMessage) {
        this.bro.ButtonsHandler.closeButtonPopups();

        var loginPanel = document.getElementById('BRO_loginPanel');

        // Use Panels if possible (firefox 3.0+ only).
        if (this.isBrowserVersionGreaterOrEqual("3.0") && loginPanel) {
            var newButton = document.getElementById('BRO_newButton');
            this.bro.LoginController.openPopup(newButton, showErrorMessage);
        }
        else {
            if (this.bro.Toolbar.loginWindow && !this.bro.Toolbar.loginWindow.closed) {
                return;
            }

            var popupX = 50;
            var popupY = 200;
            var newButton = document.getElementById('BRO_newButton');
            if (newButton) {
                popupX = newButton.boxObject.screenX;
                popupY = newButton.boxObject.screenY + newButton.boxObject.height;
            }

            var currentUser = this.bro.Model.getCurrentUser();
            var username = (currentUser) ? currentUser.username : "";

            // @see
            // https://developer.mozilla.org/en/Code_snippets/Dialogs_and_Prompts#Passing_arguments_and_displaying_a_dialog
            // @see
            // https://developer.mozilla.org/en/DOM/window.open#Window_functionality_features
            var args = {
                inn : {
                    username :username,
                    showErrorMessage :showErrorMessage
                },
                out :null
            };
            var win = window.openDialog("chrome://broceliand/content/view/popup/loginPopup.xul",
                                        "login", "titlebar=no," + "chrome=yes," + "toolbar=no,"
                                                 + "dialog=no," + "resizable=no," + "modal=yes,"
                                                 + "dependent=yes," + "top=" + popupY + "px,"
                                                 + "left=" + popupX + "px", args);

            if (args.out) {
                this.bro.Toolbar.loginWindow = win;
                if (args.out && args.out.confirm) {
                    var username = args.out.username;
                    var password = args.out.password;
                    this.bro.LoginController.performLogin(username, password);
                }
            }
        }
    },

    showFirstHelp : function () {
        this.bro.ButtonsHandler.closeButtonPopups();
        
        var helpPanel = document.getElementById('BRO_helpPanel');
        
        // Use Panels if possible (firefox 3.0+ only).
        if (this.isBrowserVersionGreaterOrEqual("3.0") && helpPanel) {
            var recordButton = document.getElementById('BRO_recordButton');
            helpPanel.openPopup(recordButton, "after_start");
            //document.getElementById('BRO_helpPanelContent').isStart = true;
            document.getElementById('BRO_helpPanelContent').setIsStart(true);
        }
        else{
            var popupX = 50;
            var popupY = 200;
            var recordButton = document.getElementById('BRO_recordButton');
            if (recordButton) {
                popupX = recordButton.boxObject.screenX;
                popupY = recordButton.boxObject.screenY + recordButton.boxObject.height;
            }
    
            // @see
            // https://developer.mozilla.org/en/DOM/window.open#Window_functionality_features
            var args = {
                isStart :true
            };
            var win = window.openDialog("chrome://broceliand/content/view/popup/helpPopup.xul",
                                        "helpStartup", "all=no," + "titlebar=no," + "chrome=yes,"
                                                       + "toolbar=no," + "dialog=no," + "resizable=no,"
                                                       + "modal=yes," + "dependent=yes," + "top="
                                                       + popupY + "px," + "left=" + popupX + "px,"
                                                       + "width=340," + "height=222", args);
            // height = image height + 113
    
            this.bro.Toolbar.helpStartupWindow = win;
        }
    },

    showHelp : function () {
        this.bro.ButtonsHandler.closeButtonPopups();
        
        var helpPanel = document.getElementById('BRO_helpPanel');
        
        // Use Panels if possible (firefox 3.0+ only).
        if (this.isBrowserVersionGreaterOrEqual("3.0") && helpPanel) {
            var recordButton = document.getElementById('BRO_recordButton');
            helpPanel.openPopup(recordButton, "after_start");
            //document.getElementById('BRO_helpPanelContent').isStart = false;
            document.getElementById('BRO_helpPanelContent').setIsStart(false);
        }
        else {
            var popupX = 50;
            var popupY = 200;
            var recordButton = document.getElementById('BRO_recordButton');
            if (recordButton) {
                popupX = recordButton.boxObject.screenX;
                popupY = recordButton.boxObject.screenY + recordButton.boxObject.height;
            }
    
            // @see
            // https://developer.mozilla.org/en/DOM/window.open#Window_functionality_features
            var args = {
                isStart :false
            };
            var win = window.openDialog("chrome://broceliand/content/view/popup/helpPopup.xul", "help",
                                        "all=no," + "titlebar=no," + "chrome=yes," + "toolbar=no,"
                                                + "dialog=no," + "resizable=no," + "modal=yes,"
                                                + "dependent=yes," + "top=" + popupY + "px," + "left="
                                                + popupX + "px," + "width=340," + "height=192", args);
            // height = image height + 73
    
            this.bro.Toolbar.helpStartupWindow = win;
        }
    },

    showNotePopup : function () {
        this.bro.ButtonsHandler.closeButtonPopups();

        var notePanel = document.getElementById('BRO_notePanel');

        // Use Panels if possible (firefox 3.0+ only).
        if (this.isBrowserVersionGreaterOrEqual("3.0") && notePanel) {
            var recordButton = document.getElementById('BRO_recordButton');
            notePanel.openPopup(recordButton, "after_start");
        }
        else {
            var popupX = 50;
            var popupY = 200;
            var recordButton = document.getElementById('BRO_recordButton');
            if (recordButton) {
                popupX = recordButton.boxObject.screenX;
                popupY = recordButton.boxObject.screenY + recordButton.boxObject.height;
            }

            // @see
            // https://developer.mozilla.org/en/DOM/window.open#Window_functionality_features
            var args = {
                inn : {
                    defaultText :this.bro.NoteController.getDefaultText()
                },
                out :null
            };
            var win = window.openDialog("chrome://broceliand/content/view/popup/notePopup.xul", "",
                                        "all=no," + "titlebar=no," + "chrome=yes," + "toolbar=no,"
                                                + "dialog=no," + "resizable=no," + "modal=yes,"
                                                + "dependent=yes," + "top=" + popupY + "px,"
                                                + "left=" + popupX + "px", args);

            var params = args.out;
            if (params && params.confirm) {
                this.bro.NoteController.saveNoteAndPearl(params.noteText);
            }
        }
    },

    showNewTreeWindow : function () {
        this.bro.ButtonsHandler.closeButtonPopups();

        var newTreePanel = document.getElementById('BRO_newTreePanel');

        // Use Panels if possible (firefox 3.0+ only).
        if (this.bro.Toolbar.isBrowserVersionGreaterOrEqual("3.0") && newTreePanel) {
            var newButton = document.getElementById('BRO_newButton');
            newTreePanel.openPopup(newButton, "after_start");
        }
        else {
            if (this.bro.Toolbar.nameTreeWindow && !this.bro.Toolbar.nameTreeWindow.closed) {
                return;
            }

            var popupX = 50;
            var popupY = 200;
            var newButton = document.getElementById('BRO_newButton');
            if (newButton) {
                popupX = newButton.boxObject.screenX;
                popupY = newButton.boxObject.screenY + newButton.boxObject.height;
            }

            // @see
            // https://developer.mozilla.org/en/Code_snippets/Dialogs_and_Prompts#Passing_arguments_and_displaying_a_dialog
            // @see
            // https://developer.mozilla.org/en/DOM/window.open#Window_functionality_features
            var args = {
                inn : {
                    confirm :'false',
                    treeName :null
                },
                out :null
            };
            var win = window.openDialog("chrome://broceliand/content/view/popup/nameTreePopup.xul",
                                        this.bro.Locale.getString('popup.nameTree.title'),
                                        "titlebar=no," + "chrome=yes," + "toolbar=no,"
                                                + "dialog=no," + "resizable=no," + "modal=yes,"
                                                + "dependent=yes," + "top=" + popupY + "px,"
                                                + "left=" + popupX + "px", args);

            if (args.out) {
                this.bro.Toolbar.nameTreeWindow = win;
                if (args.out && args.out.confirm) {
                    this.bro.InButtonController.selectNewTreeParent(args.out.treeName);
                }
            }
        }
    },

    showNameTreeDoneWindow : function () {
        this.bro.ButtonsHandler.closeButtonPopups();
        
        var nameTreeDonePanel = document.getElementById('BRO_nameTreeDonePanel');
        
        // Use Panels if possible (firefox 3.0+ only).
        if (this.isBrowserVersionGreaterOrEqual("3.0") && nameTreeDonePanel) {
            var recordButton = document.getElementById('BRO_newButton');
            nameTreeDonePanel.openPopup(recordButton, "after_start");
            document.getElementById('BRO_nameTreeDonePanelContent').isCurrentUrlRecorded = this.isCurrentUrlRecorded();
        }
        else {
            var popupX = 50;
            var popupY = 400;
            var newButton = document.getElementById('BRO_newButton');
            if (newButton) {
                popupX = newButton.boxObject.screenX;
                popupY = newButton.boxObject.screenY + newButton.boxObject.height;
            }
    
            var args = {
                inn : {
                    isCurrentUrlRecorded :this.isCurrentUrlRecorded()
                },
                out :null
            };
            var win = window.openDialog("chrome://broceliand/content/view/popup/nameTreeDonePopup.xul",
                                        "", "titlebar=no," + "chrome=yes," + "toolbar=no,"
                                            + "dialog=no," + "resizable=no," + "modal=yes,"
                                            + "dependent=yes," + "top=" + popupY + "px," + "left="
                                            + popupX + "px", args);
        }
    },

    showTreeFullWindow : function () {
        this.bro.ButtonsHandler.closeButtonPopups();

        var popupX = 50;
        var popupY = 200;
        var recordButton = document.getElementById('BRO_recordButton');
        if (recordButton) {
            popupX = recordButton.boxObject.screenX;
            popupY = recordButton.boxObject.screenY + recordButton.boxObject.height;
        }

        var args = {
            createNewTree :'false',
            pearlCount :this.bro.Toolbar.getSelectionPearlCount()
        };
        // @see
        // https://developer.mozilla.org/en/DOM/window.open#Window_functionality_features

        var win = window.openDialog("chrome://broceliand/content/view/popup/treeFullPopup.xul",
                                    "treeFull", "titlebar=no," + "chrome=yes," + "toolbar=no,"
                                                + "dialog=no," + "resizable=no," + "modal=yes,"
                                                + "dependent=yes," + "top=" + popupY + "px,"
                                                + "left=" + popupX + "px", args);

        if (args.createNewTree) {
            // Let the window closing before opening another
            com.broceliand.Tools.callWithDelay(this.bro.Toolbar.showNewTreeWindow, 20);
        }
        else {
            var selectedTree = this.bro.InButtonController.getSelectedTree();
            var rootTree = this.bro.Model.getRootTree();
            if (selectedTree && selectedTree.treeID == rootTree.treeID
                && selectedTree.pearlCount >= this.MAX_PEARLS_IN_TREE) {
                this.bro.InButtonController.selectDropZoneTree();
            }
        }
    },

    showTreeDeletedMessage : function () {
        // Refresh tree list
        this.bro.InButtonController.selectRootTree();
        this.bro.Model.getTreesAndCurrentUser();

        // Show message
        this.bro.Log.log("Can't add pearl in this tree. It has been deleted");
        this.bro.Loginfo(this.bro.Locale.getString('popup.error.treeDeleted'));
    },

    errorAddingPearl : function ( errorCode) {
        // Refresh tree list
        this.bro.Model.getTreesAndCurrentUser();

        // Show message
        this.bro.Log.log("Can't recording this pearl. Server error: " + errorCode);
    },

    onOnline : function () {
        this.bro.Toolbar.isOnline = true;
        var recordButton = document.getElementById("BRO_recordButton");
        var newButton = document.getElementById("BRO_newButton");
        if (recordButton)
            recordButton.disabled = false;
        if (newButton)
            newButton.disabled = false;
    },

    onOffline : function () {
        this.bro.Toolbar.isOnline = false;
        var recordButton = document.getElementById("BRO_recordButton");
        var newButton = document.getElementById("BRO_newButton");
        if (recordButton)
            recordButton.disabled = true;
        if (newButton)
            newButton.disabled = true;
    },

    /**
     * Because our extension must be used in certain environments.
     */
    validateEnv : function () {
        var platform = navigator.platform;
        var platformVersion = window.navigator.oscpu;
        
        if (platform == 'Linux i686' && !this.isBrowserVersionGreaterOrEqual("4.0")) {
            this.bro.Tools.addStyleSheet('chrome://broceliand/content/view/skinFix/removeBorderRadius.css');
        }
        else if(!this.isBrowserVersionGreaterOrEqual("3.0")) {
            this.bro.Tools.addStyleSheet('chrome://broceliand/content/view/skinFix/removeBorderRadius.css');
        }
        return; // No more environment validation
    },

    _lastFlexLoginTime :null,

    // @see
    // https://developer.mozilla.org/en/Code_snippets/Interaction_between_privileged_and_non-privileged_pages
    handleFlexCommand : function ( event) {
        if (!this.isInPearltrees()) {
            return;
        }

        var commandName = event.target.getAttribute("commandName");
        
        if (commandName == "login") {
            if (this.isFirstInstallMode) {
                this.setFirstInstallMode(false);
            }
            var curTime = this.bro.Tools.getTime();
            // Prevent multiple calls if the flex application raises multiple
            // login commands
            if (!this._lastFlexLoginTime || (curTime - this._lastFlexLoginTime) > 1000) {
                this._lastFlexLoginTime = curTime;
                this.bro.Model.getTreesAndCurrentUser();
            }
        }
        else if (commandName == "logout") {
            this.bro.Model.resetModel();
        }
        else if (commandName == "detectPearlbar") {
            var mainWindowDocument = content.document;

            var element = mainWindowDocument.createElement("pearlbarCommandEvent");
            element.setAttribute("commandName", "pearlbarIsInstalled");
            mainWindowDocument.documentElement.appendChild(element);

            var event = mainWindowDocument.createEvent("Events");
            event.initEvent("pearlbarCommandEvent", true, false);
            element.dispatchEvent(event);
        }
        else if (commandName == "getPearlbarVersion") {
            var mainWindowDocument = content.document;

            var element = mainWindowDocument.createElement("pearlbarCommandEvent");
            element.setAttribute("commandName", "returnPearlbarVersion");
            element.setAttribute("value", this.addonVersion);
            mainWindowDocument.documentElement.appendChild(element);

            var event = mainWindowDocument.createEvent("Events");
            event.initEvent("pearlbarCommandEvent", true, false);
            element.dispatchEvent(event);
        }
        else if(commandName == "pearlDeleted") {
            var pearlUrl = event.target.getAttribute("pearlUrl");
            if(this.lastUrlRecorded == pearlUrl) {
                this.lastUrlRecorded = null;
            }
        }
    },

    getMainWindowDocument : function () {
        return window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                .getInterface(Components.interfaces.nsIWebNavigation)
                .QueryInterface(Components.interfaces.nsIDocShellTreeItem).rootTreeItem
                .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                .getInterface(Components.interfaces.nsIDOMWindow).document;
    },

    initFlexCommandListener : function () {
        var mainWindowDocument = this.getMainWindowDocument();
        mainWindowDocument.addEventListener("flexCommandEvent", function ( e) {
            com.broceliand.Toolbar.handleFlexCommand(e);
        }, false, true);
    }
};
com.broceliand.Toolbar.init();
