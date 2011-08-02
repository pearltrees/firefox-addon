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
// Context Menu Items controller
// ///////////////////////////////////////////////////////////////////////////////

com.broceliand.ContextMenuItemController = {
    bro:com.broceliand,
    
    _clickedLinkUrl : null,
    _isLink : false,

    onClickRecordItem : function(event) {
        this.bro.RecordButtonController.onClickRecordButton(event);
    },

    onClickRecordLinkItem : function(event) {
        this.bro.RecordButtonController.onClickRecordButton(event,true);
    },

    onClickHomeItem : function(event) {
        this.bro.HomeButtonController.onClickHomeButton(event);
    },

    openPopup : function() {
        com.broceliand.ButtonsHandler.closeButtonPopups();
        com.broceliand.InButtonController.openNewButtonPopup();
    },

    onClickNewItem : function(event) {
        //If we don't put the delay it doesn't work
        this.bro.Tools.callWithDelay(com.broceliand.ContextMenuItemController.openPopup,20);
    },

    refreshRecordItemVisibility : function() {
        com.broceliand.ContextMenuItemController._isLink = gContextMenu.onLink;

        if ((gContextMenu.onLink)&&(gContextMenu.linkURL.lastIndexOf("javascript:") != 0)) {
            com.broceliand.ContextMenuItemController._clickedLinkUrl = com.broceliand.ContextMenuItemController.getUrl(gContextMenu.linkURL);
            gContextMenu.showItem("contextMenuRecordItem",false);
            gContextMenu.showItem("contextMenuRecordLinkItem",true);
        } else {
            gContextMenu.showItem("contextMenuRecordItem",true);
            gContextMenu.showItem("contextMenuRecordLinkItem",false);
        }
    },

    getUrl : function(originalUrl) {
        var url = originalUrl;
        if ((originalUrl.lastIndexOf('http://www.google') == 0)&&
                ((originalUrl.match(/url=([^# &]*)/g))||
                (originalUrl.match(/url\?q=([^# &]*)/g)))){
            if (originalUrl.match(/url=([^# &]*)/g))
                url = originalUrl.match(/url=([^# &]*)/g)[0];
            else if (originalUrl.match(/url\?q=([^# &]*)/g))
                url = originalUrl.match(/url\?q=([^# &]*)/g)[0];

            if (url.lastIndexOf("url=") == 0) {
                url = url.substring(4,url.length);
                url = decodeURIComponent(url.replace(/\+/g,  " "));
            }
            else if (url.lastIndexOf("url?q=") == 0) {
                url = url.substring(6,url.length);
                url = decodeURIComponent(url.replace(/\+/g,  " "));
            }
            else
                url = originalUrl;
        }
        return url;
    },

    refreshHomeItemVisibility : function() {
        gContextMenu.showItem("contextMenuHomeItem",!com.broceliand.Toolbar.isInPearltrees());
    },

    refreshNewItemVisibility : function() {
        var button = document.getElementById("BRO_newButton");
        if ((button)&&(!com.broceliand.Toolbar.isInPearltrees())) {
            if (com.broceliand.InButtonController.getMode() == com.broceliand.InButtonController.MODE_NAVIGATE) {
                gContextMenu.showItem("contextMenuNewItem",false);
                gContextMenu.showItem("contextMenuNewItemHome",true);
            }
            else {
                gContextMenu.showItem("contextMenuNewItem",true);
                gContextMenu.showItem("contextMenuNewItemHome",false);
            }
        }
        else {
            gContextMenu.showItem("contextMenuNewItem",false);
            gContextMenu.showItem("contextMenuNewItemHome",false);
        }
            
    },

    onContextMenuShown : function() {
      com.broceliand.ContextMenuItemController.refreshRecordItemVisibility();
      com.broceliand.ContextMenuItemController.refreshNewItemVisibility();
      com.broceliand.ContextMenuItemController.refreshHomeItemVisibility();
    }
};