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

com.broceliand.Options = {
    bro :com.broceliand,

    _mode :'option',
    _browserWindow :null,

    getMode : function () {
        return this._mode;
    },

    init : function () {

        // We share some classes with the toolbar. Specially model
        // functionalities.
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                .getService(Components.interfaces.nsIWindowMediator);
        this._browserWindow = wm.getMostRecentWindow("navigator:browser");
        com.broceliand.Toolbar = this._browserWindow.com.broceliand.Toolbar;
        com.broceliand.Log = this._browserWindow.com.broceliand.Log;
        com.broceliand.Model = this._browserWindow.com.broceliand.Model;
        com.broceliand.Tools = this._browserWindow.com.broceliand.Tools;
        com.broceliand.Locale = this._browserWindow.com.broceliand.Locale;

        this.onLoad();
    },

    showError : function () {
    },

    getBrowserWindow : function () {
        return this._browserWindow;
    },

    onClickCustomize : function ( event) {
        var browserWindow = com.broceliand.Options.getBrowserWindow();
        browserWindow.document.getElementById("cmd_CustomizeToolbars").doCommand();
    },

    onClickLicence : function ( event) {
        com.broceliand.Tools.openURLinNewTab(com.broceliand.config.CODE_URL);
    },

    onLoad : function (event) {
        // Set server URL
        var serverDescription = document.getElementById('BRO_serverDescription');
        serverDescription.value = com.broceliand.config.PUBLIC_URL;

        // Set source
        var sourceDescription = document.getElementById('BRO_sourceDescription');
        if (com.broceliand.config.ADDON_SOURCE == com.broceliand.sourceTypes.ADDON_SOURCE_AMO) {
            sourceDescription.value = "AMO";
        }
        else {
            sourceDescription.value = "self hosted";
        }

        // Set version
        com.broceliand.Options.setVersion();

        // Fetch status
        document.getElementById('BRO_statusDescription').value = '...';
        com.broceliand.Options.getStatus();

        var prefWindow = document.getElementById("BRO_prefs");
        prefWindow.setAttribute('style', 'width:auto');
        prefWindow.setAttribute('style', 'height:auto');
    },

    setVersion : function () {
        var currentVersion = com.broceliand.Toolbar.extension.version;
        var versionDescription = document.getElementById('BRO_versionDescription');
        versionDescription.value = currentVersion;
    },

    getStatus : function () {
        this.bro.Model.getTreesAndCurrentUser(skipNotificationIfNotLogged = true);
    }
};
com.broceliand.Options.init();
