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
// Record button controller
// ///////////////////////////////////////////////////////////////////////////////
com.broceliand.RecordButtonController = {
    bro :com.broceliand,

    _recordButtonMenuItemCommandFired :false,
    _isSendingTwitt :false,

    /**
     * Start / Stop recording
     * 
     * @param event
     */
    onClickRecordButton : function (event,isLink) {
        this.bro.Toolbar.alertedForManyPearls = false;
        this.bro.ContextMenuItemController._isLink = false;
        this.bro.LoginController.setLastAction(this.bro.LoginController.ACTION_PEARL);

        if (this._recordButtonMenuItemCommandFired) {
            this._recordButtonMenuItemCommandFired = false;
            return;
        }

        // Don't allow multiple record on the same URL, just play the effect
        if (!isLink && this.bro.Toolbar.isCurrentUrlRecorded()) {
            // play fake recording effect
            this.bro.ButtonsHandler.startRecording();
            this.bro.RecordButtonController.refreshRecordButtonLabel(true);
            this.bro.buttonEffectHelper.runIsRecordingEffect();
            this.bro.Tools.callWithDelay('com.broceliand.ButtonsHandler.stopRecording()',
                                         this.bro.buttonEffectHelper.START_RECORDING_EFFECT_TIME);
        }
        else {
            this.bro.Toolbar.onUseToolbar();
    
            var url = this.bro.BrowserManager.getSelectedBrowserUrl();
            var isValidUrl = this.bro.Model.isValidUrl(url);
            var playRecordEffect = false;          
            
            if (!isLink && isValidUrl) {
                playRecordEffect = true;
                this.bro.ButtonsHandler.recordCurrentPage();
            }
            else if(isLink) {
                playRecordEffect = true;
                this.bro.ButtonsHandler.recordClickedLink(com.broceliand.ContextMenuItemController._clickedLinkUrl);
            }
            else if(this.bro.Toolbar.isPearltreesPublicUrl()) {
                this.bro.ButtonsHandler.recordCurrentPageInPearltrees();
                if(isValidUrl) {
                    playRecordEffect = true;
                }
            }
            
            if(playRecordEffect) {
                this.bro.ButtonsHandler.startRecording(); 
                this.bro.Tools.callWithDelay('com.broceliand.ButtonsHandler.stopRecording()',
                                           this.bro.buttonEffectHelper.START_RECORDING_EFFECT_TIME);
            }
        }
    },

    onShowRecordButtonPopup : function () {
        var noteButtonItem = document.getElementById("BRO_noteButtonItem");
        //var twittButtonItem = document.getElementById("BRO_twittButtonItem");
        var noteButtonText = document.getElementById("BRO_noteButtonText");
        //var twittButtonText = document.getElementById("BRO_twittButtonText");
        if(this.bro.Toolbar.isInPearltrees()) {
            noteButtonItem.className = 'BRO_treeListBoxSpecialItemDisabled';
            //twittButtonItem.className = 'BRO_treeListBoxSpecialItemDisabled';
        }else{
            noteButtonItem.className = 'BRO_treeListBoxSpecialItem';
            //twittButtonItem.className = 'BRO_treeListBoxSpecialItem';
            if (this.bro.Toolbar.isCurrentUrlRecorded()) {
                noteButtonText.value = this.bro.Locale.getString('record.button.note');
                //twittButtonText.value = this.bro.Locale.getString('record.button.twitt');
            }
            else {
                noteButtonText.value = this.bro.Locale.getString('record.button.noteAndPearl');
                //twittButtonText.value = this.bro.Locale.getString('record.button.twittAndPearl');
            }
        }
    },

    onMouseOver : function () {
        this.bro.Toolbar.showHelpOnFirstOver();
    },

    closePopup : function () {
        var recordButtonPopup = document.getElementById("BRO_recordButtonPopup");
        if (recordButtonPopup) {
            recordButtonPopup.hidePopup();
        }
    },

    getLabel : function () {
        var recordButton = document.getElementById("BRO_recordButton");

        // The label is located in XBL elements
        var anonymousChildren = document.getAnonymousNodes(recordButton);
        if (anonymousChildren) {
            for ( var i = 0; i < anonymousChildren.length; i++) {
                var anonymousChild = anonymousChildren[i];
                if (anonymousChild.localName == "toolbarbutton") {
                    var buttonChildren = document.getAnonymousNodes(anonymousChild);
                    for ( var j = 0; j < buttonChildren.length; j++) {
                        var child = buttonChildren[j];
                        if (child.localName == "label") {
                            return child;
                        }
                    }
                }
            }
        }
    },

    fixButtonSize : function () {
        var recordButton = document.getElementById("BRO_recordButton");
        var recordButtonLabel = this.getLabel();

        if (recordButton && recordButtonLabel) {
            var recordButtonBarMode = recordButton.parentNode.getAttribute('mode');
            if (recordButtonBarMode == 'icons') {
                return;
            }
            var labelWidth = recordButtonLabel.boxObject.width + 5;
            var charWidth = Math.round(labelWidth / recordButtonLabel.value.length);
            var newWidth = labelWidth + (3 * charWidth);
            if (newWidth == 0 || newWidth == null) {
                newWidth = 70;
            }
            recordButtonLabel.style.width = newWidth + "px";
            recordButtonLabel.style.textAlign = "center";
        }
    },

    refreshRecordButtonLabel : function () {
        var recordButtonLabel = this.getLabel();
        if (!recordButtonLabel)
            return;

        // Label showing this page has already been recorded
        if (this.bro.Toolbar.isCurrentUrlRecorded()) {
            recordButtonLabel.value = this.bro.Locale
                    .getString('record.button.label.recorded.oneByOne');
        }
        // Label showing we are not recording
        else {
            recordButtonLabel.value = this.bro.Locale.getString('record.button.label.record');
        }
    },

    setIsSendingTwitt : function ( value) {
        this._isSendingTwitt = value;
        var twitterLoader = document.getElementById('BRO_twittLoader');
        twitterLoader.hidden = !this._isSendingTwitt;
    },

    onClickTwitt : function (event) {
        this._recordButtonMenuItemCommandFired = true;
        var url = this.bro.BrowserManager.getSelectedBrowserUrl();

        if (!this.bro.Model.isValidUrl(url) || this.bro.Toolbar.lastUrlTwitted == url
            || this.bro.NavListener.urlLoading
            || (this.bro.Toolbar.isCurrentTreeFull() && this.bro.Toolbar.lastUrlRecorded != url)) {
            return;
        }

        var title = com.broceliand.Tools.removeFirefoxNameFromTitle(window.document.title);
        var time = com.broceliand.Tools.getTime();
        var treeID = this.bro.InButtonController.getSelectedTree().treeID;

        this.bro.buttonEffectHelper.runIsRecordingEffect();
        com.broceliand.Tools.callWithDelay('this.bro.ButtonsHandler.stopRecording()',
                                   this.bro.buttonEffectHelper.START_RECORDING_EFFECT_TIME);

        this.setIsSendingTwitt(true);
        this.bro.Toolbar.setRevealed(false);
        this.bro.Model.addPearlAndTwitt(url, title, time, treeID);
        this.bro.Toolbar.addUrlRecorded(url, treeID);
    },

    onTwittSent : function () {
        this.bro.Log.log("twitt sent successfully");

        this.setIsSendingTwitt(false);
        this.closePopup();
    },

    onTwittSentByServer : function () {
        var url = this.bro.BrowserManager.getSelectedBrowserUrl();
        this.bro.Toolbar.lastUrlTwitted = url;

        this.onTwittSent();
    },

    onErrorSendingTwitt : function () {
        this.onTwittSent();
    },

    sendTwittByClient : function ( twittMessage) {
        this.bro.Log.log("send the twitt client side: " + twittMessage);

        var url = this.bro.Toolbar.TWITTER_URL + "?status=" + encodeURIComponent(twittMessage);

        this.bro.Tools.openURLinDomainTabOrNew(url, this.bro.Toolbar.TWITTER_URL);

        this.onTwittSent();
    },

    refreshModeSelection : function () {
        this.bro.InButtonController.rebuildTreeListAndBackupSelection();
        this.bro.RecordButtonController.refreshRecordButtonLabel();
    },

    onClickHelp : function ( event) {
        this._recordButtonMenuItemCommandFired = true;
        this.bro.Toolbar.setFirstUse(false);
        this.bro.Toolbar.showHelp();
    },

    onClickAddNote : function (event) {
        this._recordButtonMenuItemCommandFired = true;
        this.bro.LoginController.setLastAction(this.bro.LoginController.ACTION_NOTE);
        if (!this.bro.Model.isValidUrl(this.bro.BrowserManager.getSelectedBrowserUrl()))
            return;
        this.bro.Toolbar.showNotePopup();
    },
    
    onClickSocialSync : function (event) {
        this._recordButtonMenuItemCommandFired = true;
        this.bro.Toolbar.openSocialSyncPage();
        this.closePopup();
    }
};
