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
// Buttons controller
// ///////////////////////////////////////////////////////////////////////////////
com.broceliand.ButtonsHandler = {
    bro :com.broceliand,

    DEFAULT_BAR_WIDTH :350,
    MODE_BUTTON_MAX_CHAR :7,
    restoreDefaultPostionOnLoad :false,

    init : function () {
        window.addEventListener("load", this.onViewLoad, false);
    },

    // @todo call this function when buttons come from the customize panel
    onButtonsCreated : function () {
        this.bro.RecordButtonController.fixButtonSize();

        // Button effects are using CSS. So we sent the src to null.
        var recordButton = document.getElementById("BRO_recordButton");
        var newButton = document.getElementById("BRO_newButton");
        var homeButton = document.getElementById("BRO_homeButton");

        if (recordButton)
            recordButton.image = null;
        if (newButton)
            newButton.image = null;
        if (homeButton)
            homeButton.image = null;

        // backup selected mode from preferences
        this.bro.RecordButtonController.refreshModeSelection();

        this.bro.InButtonController.initTreeList();
    },

    addPanels : function () {
        if (this.bro.Toolbar.isBrowserVersionGreaterOrEqual("3.0")) {
            var mainWindow = document.getElementById('main-window');

            // Add createNewTree panel
            var newTreePanel = document.createElement('panel');
            newTreePanel.setAttribute('id', "BRO_newTreePanel");
            newTreePanel.setAttribute('class', "BRO_menuPopup");
            newTreePanel.setAttribute('onpopupshowing',
                                      "com.broceliand.InButtonController.onNewTreePanelShowing();");
            var newTreePanelContent = document.createElement('vbox');
            newTreePanelContent.setAttribute('id', "BRO_newTreePanelContent");
            newTreePanelContent.setAttribute('class', "BRO_nameTreePopupContent");
            newTreePanelContent.setAttribute('onCancel',
                                  "com.broceliand.InButtonController.onClickCancelNewTreeTitle()");
            newTreePanelContent.setAttribute('onValidate',
                                  "com.broceliand.InButtonController.onClickValidateNewTreeTitle()");
            newTreePanel.appendChild(newTreePanelContent);
            mainWindow.appendChild(newTreePanel);

            // Add login panel
            var loginPanel = document.createElement('panel');
            loginPanel.setAttribute('id', "BRO_loginPanel");
            loginPanel.setAttribute('class', "BRO_menuPopup");
            loginPanel.setAttribute('onpopupshowing',
                                    "com.broceliand.LoginController.onLoginPanelShowing();");
            var loginPanelContent = document.createElement('vbox');
            loginPanelContent.setAttribute('id', "BRO_loginPanelContent");
            loginPanelContent.setAttribute('class', "BRO_loginPopupContent");
            loginPanelContent.setAttribute('onCancel',
                                           "com.broceliand.LoginController.onClickCancelLogin()");
            loginPanelContent.setAttribute('onValidate',
                                           "com.broceliand.LoginController.onClickValidateLogin()");
            loginPanel.appendChild(loginPanelContent);
            mainWindow.appendChild(loginPanel);

            // Add note panel
            var notePanel = document.createElement('panel');
            notePanel.setAttribute('id', "BRO_notePanel");
            notePanel.setAttribute('class', "BRO_menuPopup");
            notePanel.setAttribute('onpopupshowing',
                                   "com.broceliand.NoteController.onPanelShowing();");
            var notePanelContent = document.createElement('vbox');
            notePanelContent.setAttribute('id', "BRO_notePanelContent");
            notePanelContent.setAttribute('class', "BRO_notePopupContent");
            notePanelContent.setAttribute('onCancel',
                                          "com.broceliand.NoteController.onClickCancelNote()");
            notePanelContent.setAttribute('onValidate',
                                          "com.broceliand.NoteController.onClickValidateNote()");
            notePanel.appendChild(notePanelContent);
            mainWindow.appendChild(notePanel);
            
            // Help panel
            var helpPanel = document.createElement('panel');
            helpPanel.setAttribute('id', "BRO_helpPanel");
            helpPanel.setAttribute('class', "BRO_menuPopup");                      
            var helpPanelContent = document.createElement('vbox');
            helpPanelContent.setAttribute('id', "BRO_helpPanelContent");
            helpPanelContent.setAttribute('class', "BRO_helpPopupContent");                              
            helpPanel.appendChild(helpPanelContent);
            mainWindow.appendChild(helpPanel);
            // Workaround for FF3, force XBL to initialize
            helpPanel.openPopup();
            helpPanel.hidePopup();
            
            // Name tree done panel
            var nameTreeDonePanel = document.createElement('panel');
            nameTreeDonePanel.setAttribute('id', "BRO_nameTreeDonePanel");
            nameTreeDonePanel.setAttribute('class', "BRO_menuPopup");                      
            var nameTreeDonePanelContent = document.createElement('vbox');
            nameTreeDonePanelContent.setAttribute('id', "BRO_nameTreeDonePanelContent");
            nameTreeDonePanelContent.setAttribute('class', "BRO_nameTreeDonePopupContent"); 
            nameTreeDonePanelContent.setAttribute('onValidate',
                                                  "document.getElementById('BRO_nameTreeDonePanel').hidePopup()");
            nameTreeDonePanelContent.setAttribute('onCancel',
                                                  "document.getElementById('BRO_nameTreeDonePanel').hidePopup()");
            nameTreeDonePanel.appendChild(nameTreeDonePanelContent);
            mainWindow.appendChild(nameTreeDonePanel);
            // Workaround for FF3, force XBL to initialize
            nameTreeDonePanel.openPopup();
            nameTreeDonePanel.hidePopup();
        }
    },

    closeButtonPopups : function () {
        this.bro.InButtonController.closePopup();
        this.bro.RecordButtonController.closePopup();
        this.bro.NoteController.closePopup();
        this.bro.LoginController.closePopup();
    },

    onViewLoad : function () {
        var d = new Date();
        var timeToLoad = d.getTime() - this.bro.Toolbar.initTime;
        this.bro.Log.log("view loaded (" + timeToLoad + " ms)");
        this.bro.Toolbar.viewLoaded = true;

        if (((this.bro.Toolbar.isFirstInstall)||(this.bro.Toolbar.isUpdate))&&(this.bro.Model._currentUser)){
            this.bro.Log.log("select root tree");
            this.bro.InButtonController.selectTree(this.bro.Model._currentUser.rootTreeID,false,false,false);
        }

        if (this.bro.Toolbar.isFirstInstall) {
            this.bro.Toolbar.performFirstInstallActions();
        }
        else if (this.bro.Toolbar.isUpdate) {
            this.bro.Toolbar.performUpdateActions();
        }
        if(this.bro.Toolbar.isTimeToShowReminder) {
            this.bro.Toolbar.performReminder();
        }

        this.bro.ButtonsHandler.onButtonsCreated();
        this.bro.ButtonsHandler.addPanels();

        var d = new Date();
        var timeToLoad = d.getTime() - this.bro.Toolbar.initTime;
        this.bro.Log.log("creation complete (" + timeToLoad + " ms)");
    },

    startRecording : function () {
        // Update record button
        this.bro.RecordButtonController.refreshRecordButtonLabel();
        this.bro.buttonEffectHelper.setButtonClass('BRO_recordButton', 'BRO_recordButtonIsRecording');

        // Update new button
        this.bro.InButtonController.refreshTreeListTextHeader();
        this.bro.InButtonController.refreshTreeListHeight();
    },

    stopRecording : function () {
        // Update record button
        this.bro.RecordButtonController.refreshRecordButtonLabel();
        this.bro.buttonEffectHelper.stopIsRecordingEffect();

        // Update new button
        this.bro.InButtonController.refreshTreeListTextHeader();
        this.bro.InButtonController.refreshTreeListHeight();
    },

    // called when selecting an item in the list
    addPearlIfPossible : function () {
        this.bro.Toolbar.alertedForManyPearls = false;
        var isLink = com.broceliand.ContextMenuItemController._isLink;
        if (isLink) {
            var url = this.bro.ContextMenuItemController._clickedLinkUrl;
        }
        
        // The current page can be recorded
        if ((!this.bro.NavListener.urlLoading) || url) {
            var playRecordEffect = false; 
            if (url) {
                playRecordEffect = this.recordClickedLink(url);
            }
            else {
                playRecordEffect = this.recordCurrentPage();
            }
            if(playRecordEffect) {
                this.startRecording();
                this.bro.Tools.callWithDelay('com.broceliand.ButtonsHandler.stopRecording()',
                                       this.bro.buttonEffectHelper.START_RECORDING_EFFECT_TIME);
            }
        }
    },

    /**
     * Try to record the current page
     */
    recordCurrentPage : function () {
        var url = this.bro.BrowserManager.getSelectedBrowserUrl();
        var title = com.broceliand.Tools.removeFirefoxNameFromTitle(window.document.title);
        var time = com.broceliand.Tools.getTime();

        var selectedTree = this.bro.InButtonController.getSelectedTree();

        if (selectedTree) {
            var treeID = selectedTree.treeID;
            var isStartNew = selectedTree.isNewTree;
            if (selectedTree.isNewTree) {
                var newTreeTitle = selectedTree.title;
                var newTreeParentID = selectedTree.parentTreeID;
            }
        }
        else {
            var isStartNew = false;
        }

        // The current page can be recorded
        if (!this.bro.NavListener.urlLoading && this.bro.Model.isValidUrl(url)
            && !this.bro.Toolbar.isCurrentTreeFull()) {
            this.bro.Model.addPearl(url, title, time, isStartNew, treeID,
                                    newTreeTitle, newTreeParentID);
            this.bro.Toolbar.setRevealed(false);
            return true;
        }else{
            return false;
        }
        this.bro.Toolbar.addUrlRecorded(url, treeID);
    },

    /**
     * Try to record link
     */
    recordClickedLink : function (url) {
        var title = null;
        var time = com.broceliand.Tools.getTime();

        var isInPearltrees = this.bro.Toolbar.isInPearltrees();
        if (!isInPearltrees)
            var selectedTree = this.bro.InButtonController.getSelectedTree();

        var treeID = null;
        if (selectedTree) {
            treeID = selectedTree.treeID;
            var isStartNew = selectedTree.isNewTree;
            if (selectedTree.isNewTree) {
                var newTreeTitle = selectedTree.title;
                var newTreeParentID = selectedTree.parentTreeID;
            }
        }
        else {
            treeID = this.bro.Model.getCurrentUser().dropZoneID;
            var isStartNew = false;
        }

        // The link can be recorded
        if (this.bro.Model.isValidUrl(url) && (isInPearltrees || !this.bro.Toolbar.isCurrentTreeFull())) {
            this.bro.Model.addPearl(url, title, time, isStartNew, treeID,
                                    newTreeTitle, newTreeParentID);
            this.bro.Toolbar.setRevealed(false);
            return true;
        }else{
            return false;
        }
        this.bro.Toolbar.addUrlRecorded(url, treeID);
    },

    /**
     * Try to record pearltrees browser page
     */
    recordCurrentPageInPearltrees : function () {
        var url = this.bro.BrowserManager.getPearltreesBrowserUrl();
        var title = this.bro.BrowserManager.getPearltreesBrowserTitle();;
        var time = com.broceliand.Tools.getTime();

        var treeID = this.bro.Model.getCurrentUser().dropZoneID;

        // The link can be recorded
        if (this.bro.Model.isValidUrl(url)) {
            this.bro.Model.addPearl(url, title, time, false, treeID,
                                    null, null);
            this.bro.Toolbar.setRevealed(false);
        }
        this.bro.Toolbar.addUrlRecorded(url, treeID);
    },

    onClickToolbar : function () {
        if (this.bro.Toolbar.helpStartupWindow) {
            this.bro.Toolbar.helpStartupWindow.close();
        }
    },

    addFirstInstallButtonInNavBar : function () {
        var navbar = document.getElementById('nav-bar');
        // Show navbar
        if (navbar) {
            navbar.collapsed = false;
        }

        this.appendButtonInNavbar("BRO_firstInstallButton", "urlbar-container");

        // Make sure other buttons are in the customize palette
        this.removeButton("BRO_homeButton");
        this.removeButton("BRO_newButton");
        this.removeButton("BRO_recordButton");
    },

    restoreDefaultPositionInNavbar : function () {
        var navbar = document.getElementById('nav-bar');
        // Show navbar
        if (navbar) {
            navbar.collapsed = false;
        }

        // Remove the firstInstall button
        this.removeButton("BRO_firstInstallButton");

        // Install buttons
        this.appendButtonInNavbar("BRO_homeButton", "urlbar-container");
        this.appendButtonInNavbar("BRO_newButton", "BRO_homeButton");
        this.appendButtonInNavbar("BRO_recordButton", "BRO_newButton");
    },

    removeAllButtons : function () {
        this.removeButton("BRO_firstInstallButton");
        this.removeButton("BRO_homeButton");
        this.removeButton("BRO_newButton");
        this.removeButton("BRO_recordButton");
    },

    removeButton : function ( buttonId) {
        var palette = document.getElementById("navigator-toolbox").palette;

        var button = document.getElementById(buttonId);
        if (!button)
            return;
        var parentBar = button.parentNode;

        while (button && parentBar) {

            if (parentBar) {
                this.removeButtonFromToolbarCurrentSet(parentBar, buttonId);
            }

            // Move item to the toolbar palette
            if (palette) {
                // @todo check the item is not already in the palette
                palette.appendChild(button);
            }
            else {
                parentBar.removeChild(button);
            }
            this.bro.Log.log("Button removed: " + buttonId);

            // If the button has been duplicated we remove other instances
            button = document.getElementById(buttonId);
            if (button) {
                parentBar = button.parentNode;
            }
        }
    },

    appendButtonInNavbar : function ( buttonId, beforeElementId) {
        if (this.bro.Toolbar.isBrowserVersionGreaterOrEqual("3.0")) {
            try {
                var toolbar = document.getElementById("nav-bar");
                var curSet = toolbar.currentSet;

                if (curSet.indexOf(buttonId) == -1) {
                    var set;
                    if (curSet.indexOf(beforeElementId) != -1)
                        set = curSet.replace(beforeElementId, buttonId+","+beforeElementId);
                    else
                        set = curSet + "," + buttonId;

                    toolbar.setAttribute("currentset", set);
                    toolbar.currentSet = set;
                    document.persist("nav-bar", "currentset");

                    // If you don't do the following call, funny things happen
                    try {
                        BrowserToolboxCustomizeDone(true);
                    } catch (e) {  this.bro.Log.log("Error on automatic adding (inner try):\n" + e.name + ", " + e.message); }
                    this.appendButtonInToolbarCurrentSet(toolbar, buttonId, beforeElementId);
                }
            }
            catch(e) {this.bro.Log.log("Error on automatic adding:\n" + e.name + ", " + e.message); }
        }
        else {
            var toolbar = document.getElementById("nav-bar");
            var button = document.getElementById(buttonId);
            var beforeElement = document.getElementById(beforeElementId);

            // Remove button if exist
            if (button) {
                this.removeButton(buttonId);
            }

            // Insert the button at the right position
            toolbar.insertItem(buttonId, beforeElement);
            this.appendButtonInToolbarCurrentSet(toolbar, buttonId, beforeElementId);
        }

        this.bro.Log.log("Button added: " + buttonId);
    },

    appendButtonInToolbarCurrentSet : function ( toolbar, buttonId, beforeElementId) {
        var oldset = toolbar.getAttribute("currentset");
        if (!oldset) {
            oldset = toolbar.getAttribute("defaultset");
        }
        if (oldset.indexOf(buttonId) != -1) {
            this.removeButtonFromToolbarCurrentSet(toolbar, buttonId);
        }
        var newset = "";
        if (!beforeElementId || oldset.indexOf(beforeElementId) == -1) {
            if (oldset && oldset != "") {
                newset = oldset + ",";
            }
            newset += buttonId;
        }
        else {
            var beforeElementIndex = oldset.indexOf(beforeElementId);
            var setBefore = oldset.substring(0, beforeElementIndex);
            var setAfter = oldset.substring(beforeElementIndex, oldset.length);
            newset = setBefore + buttonId + "," + setAfter;
        }

        toolbar.setAttribute("currentset", newset);
        document.persist(toolbar.id, "currentset");
        return newset;
    },

    removeButtonFromToolbarCurrentSet : function ( toolbar, buttonId) {
        var oldset = toolbar.getAttribute("currentset");
        if (!oldset || oldset == "" || oldset.indexOf(buttonId) == -1)
            return oldset;
        var reg = new RegExp(buttonId + ",?", "gi");
        var newset = oldset.replace(reg, "");
        if (newset.charAt(newset.length - 1) == ",") {
            newset = newset.substring(0, newset.length - 1);
        }

        toolbar.setAttribute("currentset", newset);
        document.persist(toolbar.id, "currentset");
        return newset;
    }
};
