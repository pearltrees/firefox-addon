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

// ///////////////////////////////////////////////////////////////////////////////
// Firefox listeners
// Each time a new window is created, we add our listeners.
// So we can register anything the user see on his screen.
//
// Classes:
//
// BrowserManager Managing the different browsers
// NavListener Listen window location changes and request states
// ListenerHandler Manage load/unload, focus and click listeners
//
// ///////////////////////////////////////////////////////////////////////////////
/**
 * This class is used for managing the different browsers. Browsers may be tabs
 * or windows. Basically we assign a unique ID to each new tab. Then we send this
 * ID with each page sent to the server.
 */
com.broceliand.BrowserManager = {
    bro :com.broceliand,

    init : function () {
        window.addEventListener("load", this.load, false);
    },

    /**
     * When firefox is started we assign IDs to the default browsers & tabs.
     */
    load : function () {
        for ( var i = 0; i < gBrowser.browsers.length; i++) {
            var browser = gBrowser.getBrowserAtIndex(i);
            try {
                com.broceliand.BrowserManager.initBrowser(browser);
            }
            catch (e) {
                Components.utils.reportError(e);
            }
        }
    },

    /**
     * Add a BRO_UID param to the browser object. This UID is generated with the
     * local time and a random number.
     * 
     * @param browser http://developer.mozilla.org/en/docs/XUL:browser
     * @param parent browser
     */
    initBrowser : function ( browser, parent) {
        var date = new Date();
        var time = date.getTime() + '';
        browser.BRO_UID = time + com.broceliand.Tools.randomID(1);
        if (parent) {
            browser.BRO_PARENT_UID = parent.BRO_UID;
        }
    },

    getBrowserByID : function ( browserID) {
        for ( var i = 0; i < gBrowser.browsers.length; i++) {
            var browser = gBrowser.getBrowserAtIndex(i);
            if (browser.BRO_UID == browserID) {
                return browser;
            }
        }
        return null;
    },

    /**
     * Return the selected browser object
     * 
     * @return browser http://developer.mozilla.org/en/docs/XUL:browser
     */
    getSelectedBrowser : function () {
        return (gBrowser) ? gBrowser.selectedBrowser : null;
    },

    /**
     * Getter for the selected browser unique ID.
     * 
     * @return int Browser ID
     */
    getSelectedBrowserID : function () {
        if (!this.getSelectedBrowser())
            return null;
        else if (!this.getSelectedBrowser().BRO_UID)
            this.initBrowser(this.getSelectedBrowser());
        return this.getSelectedBrowser().BRO_UID;
    },

    /**
     * Getter for the URL
     * 
     * @return string URL
     */
    getSelectedBrowserUrl : function () {
        var selectedBrowser = this.getSelectedBrowser();
        var url = (selectedBrowser && selectedBrowser.currentURI) ? selectedBrowser.currentURI.spec : null;
        if(url == "about:home" || url == "about:startpage") {
            url = this.bro.config.DEFAULT_HOME_URL;
        }
        return url;
    },
    getPearltreesBrowserUrl : function () {
        var selectedBrowser = this.getSelectedBrowser();
        var frame = selectedBrowser.contentWindow.document.getElementsByTagName('iframe');
        if (!frame || !frame[0])
            return null;
        return frame[0].contentWindow.document.baseURI;
    },
    getPearltreesBrowserTitle : function () {
        var selectedBrowser = this.getSelectedBrowser();
        var frame = selectedBrowser.contentWindow.document.getElementsByTagName('iframe');
        if (!frame || !frame[0])
            return null;
        var title = frame[0].contentWindow.document.title;
        return title;
    },

    getBrowserUrl : function (browser) {
        if (browser && browser.currentURI && browser.currentURI.spec) {
            return browser.currentURI.spec;
        }
        else {
            return null;
        }
    },

    getAllBrowserIDsWithPearltrees : function () {
        var browsersIDs = new Array();
        for ( var i = 0; i < gBrowser.browsers.length; i++) {
            var browser = gBrowser.getBrowserAtIndex(i);
            if (!browser)
                continue;
            var browserID = browser.BRO_UID;
            var browserUrl = this.getBrowserUrl(browser);
            var isPearltreesUrl = this.bro.Toolbar.isPearltreesPublicUrl(browserUrl);
            if (browserID && isPearltreesUrl) {
                browsersIDs.push(browser.BRO_UID);
            }
        }
        return browsersIDs;
    }
};

/**
 * Navigation listener.
 * 
 * We listen to the window location and the request states. The location event
 * is fired when the URL changes. The progress event is fired when requests are
 * sent / received.
 * 
 * We notify the server with the page description when enough content is loaded.
 * This may happen immediately when the page is already in the cache (this is
 * the case when switching between tabs) or when the HTTP response is received.
 * Currently we wait for a valid URL and a valid title.
 * 
 * @type nsIWebProgressListener
 */
com.broceliand.NavListener = {
    bro :com.broceliand,

    BRO_STATE_START :Components.interfaces.nsIWebProgressListener.STATE_START,

    QueryInterface : function ( aIID) {
        if (aIID.equals(Components.interfaces.nsIWebProgressListener)
            || aIID.equals(Components.interfaces.nsISupportsWeakReference)
            || aIID.equals(Components.interfaces.nsISupports)) {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    },

    onLocationChange : function ( aProgress, aRequest, aURI) {
        var url = this.bro.BrowserManager.getSelectedBrowserUrl();
        this.bro.Toolbar.onLocationChange(url);
    },

    // For definitions of the remaining functions see XULPlanet.com
    onStateChange : function () { return 0; },
    onProgressChange : function () { return 0; },
    onStatusChange : function () { return 0; },
    onSecurityChange : function () { return 0; },
    onLinkIconAvailable : function () { return 0; }
};

/**
 * Addon listener.
 * 
 * Listen to changes in addon.
 * 
 * @type AddonListener
 */
com.broceliand.AddonListener = {
    // A listener only needs to implement the methods corresponding to the events it
    // cares about, missing methods will not cause any problems.
    bro :com.broceliand,

    onPropertyChanged : function (addon, properties){
        if (addon.id == com.broceliand.config.ADDON_ID) {
            this.bro.Toolbar.extension = addon;
            this.bro.Toolbar.addonVersion = addon.version;
            this.bro.Toolbar.loadPreferences();
        }
    },

    // Some of this Listeners could be used to send messages to the user when he ask for
    // disable the addon, or when he has cancelled this operation.
    onEnabling : function (addon, needsRestart){},
    onEnabled : function (addon){},
    onDisabling : function (addon, needsRestart){},
    onDisabled : function (addon){},
    onInstalling : function (addon, needsRestart){},
    onInstalled : function (addon){},
    onUninstalling : function (addon, needsRestart){},
    onUninstalled : function (addon){},
    onOperationCancelled : function (addon){}
};

/**
 * Manage load/unload, focus and click listeners
 */
com.broceliand.ListenerHandler = {
    bro :com.broceliand,

    BRO_NOTIFY_STATE_DOCUMENT :Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT,

    init : function () {
        // Listeners are started / stopped when the user clicks on the record button
        window.addEventListener("unload", this.bro.ListenerHandler.unloadHandler, false);
        window.addEventListener("load", this.bro.ListenerHandler.loadHandler, false);
        window.addEventListener("load", this.bro.WindowManager.synchronize, false);
        // It seems that focus works differently on win7
        // @todo remove click workaround
        window.addEventListener("focus", this.bro.WindowManager.synchronize, false);
        window.addEventListener("click", this.bro.WindowManager.synchronize, false);
    },

    loadHandler : function () {
        this.bro = com.broceliand;
        if (gBrowser) {
            if (this.bro.Toolbar.isBrowserVersionGreaterOrEqual("5.0")) {
                gBrowser.addProgressListener(this.bro.NavListener);
            }else{
                gBrowser.addProgressListener(this.bro.NavListener, this.BRO_NOTIFY_STATE_DOCUMENT);
            }
        }
    },

    unloadHandler : function () {
        if (gBrowser) {
            gBrowser.removeProgressListener(this.bro.NavListener);
        }
        var windows = this.bro.WindowManager.countWindows();
        if (windows == 0) {
            this.bro.Toolbar.onQuit();
        }
    }
};
