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
// Login Controller
// ///////////////////////////////////////////////////////////////////////////////
com.broceliand.LoginController = {
    bro :com.broceliand,

    NO_ACTION :0,
    ACTION_SHOW_TREE_LIST :1,
    ACTION_PEARL :2,
    ACTION_NOTE :3,
    
    _showErrorMessageOnOpen :false,
    _lastAction :this.NO_ACTION,

    openPopup : function ( buttonToAlignWith, showErrorMessage) {
        var loginPanel = document.getElementById('BRO_loginPanel');

        loginPanel.openPopup(buttonToAlignWith, "after_start");
        if (showErrorMessage) {
            var loginPanelContent = document.getElementById('BRO_loginPanelContent');
            loginPanelContent.displayError();
            this._showErrorMessageOnOpen = true;
        }
    },

    setLastAction : function ( value) {
        this._lastAction = value;
    },

    showErrorMessageOnOpen : function () {
        return this._showErrorMessageOnOpen;
    },

    onLoginPanelShowing : function () {
        this.bro.ButtonsHandler.closeButtonPopups();
        // Use small timeout whereas XBL setters don't work...
        // Don't know why yet :(
        com.broceliand.Tools.callWithDelay('this.bro.LoginController.initLoginPanel()', 20);
    },

    initLoginPanel : function () {
        var username = "";

        var loginPanelContent = document.getElementById('BRO_loginPanelContent');

        var currentUser = this.bro.Model.getCurrentUser();
        if (currentUser) {
            username = currentUser.username;
            loginPanelContent.focusPassword();
        }
        else {
            username = "";
            loginPanelContent.focusUsername();
        }

        loginPanelContent.username = username;
        loginPanelContent.password = "";

        if (!this._showErrorMessageOnOpen) {
            loginPanelContent.hideError();
        }
        else {
            loginPanelContent.displayError();
        }
        this._showErrorMessageOnOpen = false;
    },

    performSuccessAction : function () {
        if (this._lastAction == this.ACTION_SHOW_TREE_LIST) {
            this.bro.ButtonsHandler.closeButtonPopups();
            this.bro.InButtonController.openNewButtonPopup();
        }
        else if (this._lastAction == this.ACTION_PEARL) {
            this.bro.RecordButtonController.onClickRecordButton();
        }
        else if(this._lastAction == this.ACTION_NOTE) {
            this.bro.RecordButtonController.onClickAddNote();
        }
        this._lastAction = this.NO_ACTION;

        if (this.bro.Toolbar.isInPearltrees()) {
            gBrowser.reload();
        }
    },

    displayError : function () {
        this.bro.Toolbar.showLoginPopup(true);
    },

    onClickCancelLogin : function () {
        this.bro.LoginController.closePopup();
    },

    onClickValidateLogin : function () {
        var loginPanelContent = document.getElementById('BRO_loginPanelContent');
        var username = loginPanelContent.username;
        var password = loginPanelContent.password;
        loginPanelContent.hideError();
        this.bro.LoginController.performLogin(username, password);
    },

    performLogin : function ( username, password) {
        if (!username || com.broceliand.Tools.trim(username) == '' || !password
            || com.broceliand.Tools.trim(password) == '') {

            var loginPanelContent = document.getElementById('BRO_loginPanelContent');
            if (loginPanelContent) {
                loginPanelContent.displayError();
            }
            else {
                this.bro.Toolbar.showLoginPopup(true);
            }
        }
        else {
            this.bro.LoginController.closePopup();

            this.bro.Model.login(username, password);
        }
    },

    closePopup : function () {
        var loginPanel = document.getElementById("BRO_loginPanel");
        if (loginPanel) {
            loginPanel.hidePopup();
        }
    }
};
