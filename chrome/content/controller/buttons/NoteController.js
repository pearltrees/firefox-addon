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
// Note Controller
// ///////////////////////////////////////////////////////////////////////////////
com.broceliand.NoteController = {
    bro :com.broceliand,

    numCommentsOnCurrentUrl :0,
    defaultText :"",

    init : function () {
        this.numCommentsOnCurrentUrl = 0;
    },

    onClickCancelNote : function () {
        this.cancelNote();
    },

    onClickValidateNote : function () {
        var noteText = document.getElementById('BRO_notePanelContent').text;
        this.closePopup();
        this.saveNoteAndPearl(noteText);
    },

    onPanelShowing : function () {
        // Use small timeout whereas XBL setters don't work...
        // Don't know why yet :(
        com.broceliand.Tools.callWithDelay('this.bro.NoteController.initPanel()', 20);
    },

    initPanel : function () {
        var panelContent = document.getElementById('BRO_notePanelContent');
        panelContent.focus();
        var defaultText = this.getDefaultText();
        if (panelContent.text != defaultText) {
            panelContent.text = "";
            panelContent.defaultText = defaultText;
        }
    },

    getDefaultText : function () {
        if (this.numCommentsOnCurrentUrl == 0) {
            this.defaultText = this.bro.Locale.getString('comment.textbox.defaultValue');
        }
        else {
            this.defaultText = this.bro.Locale.getString('comment.textbox.addValue');
        }
        return this.defaultText;
    },

    closePopup : function () {
        var notePanel = document.getElementById('BRO_notePanel');
        if (notePanel) {
            notePanel.hidePopup();
        }
    },

    cancelNote : function () {
        this.closePopup();
    },

    saveNoteAndPearl : function ( noteText) {
        var tools = com.broceliand.Tools;
        if (!noteText || tools.trim(noteText) == ""
            || tools.trim(noteText) == this.getDefaultText()) {
            this.bro.RecordButtonController._recordButtonMenuItemCommandFired = false;
            this.bro.RecordButtonController.onClickRecordButton(null);
            return;
        }

        var url = this.bro.BrowserManager.getSelectedBrowserUrl();

        if (this.bro.NavListener.urlLoading || !this.bro.Model.isValidUrl(url)
            || (this.bro.Toolbar.isCurrentTreeFull() && this.bro.Toolbar.lastUrlRecorded != url)) {
            return;
        }

        this.bro.buttonEffectHelper.runIsRecordingEffect();
        tools.callWithDelay('this.bro.ButtonsHandler.stopRecording()',
                            this.bro.buttonEffectHelper.START_RECORDING_EFFECT_TIME);

        var title = tools.removeFirefoxNameFromTitle(window.document.title);
        var treeID = this.bro.InButtonController.getSelectedTree().treeID;
        var time = tools.getTime();
        var comment = tools.trim(noteText);

        this.numCommentsOnCurrentUrl++;
        this.bro.Toolbar.setRevealed(false);
        this.bro.Model.addCommentAndPearl(url, title, treeID, time, comment);
        this.bro.Toolbar.addUrlRecorded(url, treeID);
    }
};
