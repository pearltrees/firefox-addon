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
// Miscellaneous tools
// ///////////////////////////////////////////////////////////////////////////////
com.broceliand.Tools = {
    bro :com.broceliand,

    trim : function ( myString) {
        if (!myString) {
            return "";
        }
        return myString.replace(/^\s+/g, '').replace(/\s+$/g, '');
    },

    removeFirefoxNameFromTitle : function (title) {
        var mozillaFirefoxSuffixIndex = title.lastIndexOf(" - Mozilla Firefox");
        if(mozillaFirefoxSuffixIndex != -1) {
           title = title.substring(0, mozillaFirefoxSuffixIndex);
        }
        else if(title == "Mozilla Firefox") {
           title = ""; 
        }
        return title;
    },

    /**
     * Open a tab with a specific domain or create a new one
     * 
     * @param string url
     */
    openAndReuseOneTabPerDomain : function ( url, domain) {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService(Components.interfaces.nsIWindowMediator);
        var browserEnumerator = wm.getEnumerator("navigator:browser");

        // Check each browser instance for our URL
        var found = false;
        while (domain && !found && browserEnumerator.hasMoreElements()) {
            var browserWindow = browserEnumerator.getNext();
            var browserInstance = browserWindow.getBrowser();

            // Check each tab of this browser instance
            var numTabs = browserInstance.tabContainer.childNodes.length;
            for ( var index = 0; index < numTabs; index++) {
                var currentBrowser = browserInstance.getBrowserAtIndex(index);
                if (currentBrowser && currentBrowser.currentURI
                    && currentBrowser.currentURI.spec.lastIndexOf(domain) != -1) {

                    // The URL is already opened. Select this tab.
                    browserInstance.selectedTab = browserInstance.tabContainer.childNodes[index];

                    // Focus browser
                    browserWindow.focus();
                    browserInstance.focus();
                    // Update url
                    if(currentBrowser.contentDocument.location != url) {
                        currentBrowser.contentDocument.location = url;
                    }

                    found = true;
                    break;
                }
            }
        }
        // Our URL isn't open. Open it now.
        if (!found) {
            this.openURLinNewTab(url);
        }

        this.bro.Log.log('navigate to: ' + url);
    },

    openURLinNewTab : function ( url) {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService(Components.interfaces.nsIWindowMediator);
        var recentWindow = wm.getMostRecentWindow("navigator:browser");
        if (recentWindow) {
            // Use an existing browser window
            recentWindow.delayedOpenTab(url, null, null, null, null);
        }
        else {
            // No browser windows are open, so open a new one.
            window.open(url);
        }
    },

    openURLinDomainTabOrNew : function ( url, domain, delay) {
        if (!delay) {
            com.broceliand.Tools.openAndReuseOneTabPerDomain(url, domain);
        }
        else {
            com.broceliand.Tools.callWithDelay("com.broceliand.Tools.openAndReuseOneTabPerDomain('"
                                               + url + "','" + domain + "')", delay);
        }
    },

    /**
     * Set the browser window's location to the incoming URL
     * 
     * @param string URL to show
     */
    openURLinCurrentTab : function ( url, delay, browserID) {
        if (!delay) {
            var selectedBrowser = null;
            if (browserID) {
                selectedBrowser = this.bro.BrowserManager.getBrowserByID(browserID);
            }
            if (!selectedBrowser) {
                selectedBrowser = this.bro.BrowserManager.getSelectedBrowser();
            }
            selectedBrowser.contentDocument.location = url;

            this.bro.Log.log('navigate to: ' + url);
        }
        else {
            browserID = this.bro.BrowserManager.getSelectedBrowserID();
            com.broceliand.Tools.callWithDelay("com.broceliand.Tools.openURLinCurrentTab('" + url
                                               + "',null,'" + browserID + "')", delay);
        }
    },

    callWithDelay : function ( code, time, param) {
        // Having an issue with nsITimer, thus we use setTimeout
        setTimeout(code, time, param);
    },

    getTime : function () {
        var date = new Date();
        return date.getTime();
    },

    randomID : function ( size) {
        var str = "";
        for ( var i = 0; i < size; i++) {
            str += this.getRandomChar();
        }
        return str;
    },

    getRandomChar : function () {
        var chars = "0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ";
        return chars.substr(this.getRandomNumber(62), 1);
    },

    getRandomCharWithSpace : function () {
        var chars = "0123456789 abcdefghijklmnop qur stuvwxyz ABCDEFGHIJ KLMNOPQURSTUVW XYZ";
        return chars.substr(this.getRandomNumber(68), 1);
    },

    getRandomNumber : function ( range) {
        return Math.floor(Math.random() * range);
    },

    /**
     * Return a random string with a specified chars lnumber.
     * 
     * @param integer num Number of chars
     * @return string
     */
    getRandomString : function ( num) {
        var string = '';
        for ( var i = 0; i < num; i++) {
            string = string + com.broceliand.Tools.getRandomCharWithSpace();
        }
        return string;
    },
    
    stringToMd5Hash : function (str) {
        var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
                        createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

        converter.charset = "UTF-8";

        var result = {};
        var data = converter.convertToByteArray(str, result);
        var ch = Components.classes["@mozilla.org/security/hash;1"]
                           .createInstance(Components.interfaces.nsICryptoHash);
        ch.init(ch.MD5);
        ch.update(data, data.length);
        var hash = ch.finish(false);

        function toHexString(charCode) {
          return ("0" + charCode.toString(16)).slice(-2);
        }

        // convert the binary hash data to a hex string.
        var s = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");
        return s;  
    },
    
    addStyleSheet : function(path) {
        var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
                                     .getService(Components.interfaces.nsIStyleSheetService);
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
                            .getService(Components.interfaces.nsIIOService);
        var uri = ios.newURI(path, null, null);
        if(!sss.sheetRegistered(uri, sss.USER_SHEET)) {
            sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
        }
    }
};
