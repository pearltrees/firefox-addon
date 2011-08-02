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
// Windows manager
// ///////////////////////////////////////////////////////////////////////////////
com.broceliand.WindowManager = {
    bro :com.broceliand,

    BRO_WINDOW_STORAGE_MODE_FUEL :1, // Firefox 3+
    BRO_WINDOW_STORAGE_MODE_HACK :2, // Firefox 2-

    _storage :null,
    _storageMode :null, // 1='FUEL' or 2='HACK'

    init : function () {
        var hiddenWindow = Components.classes["@mozilla.org/appshell/appShellService;1"]
                .getService(Components.interfaces.nsIAppShellService).hiddenDOMWindow;

        // Firefox 3 use FUEL storage
        if (typeof (Application) != 'undefined' && Application.storage) {
            this.bro.WindowManager._storage = Application.storage;
            this.bro.WindowManager._storageMode = this.BRO_WINDOW_STORAGE_MODE_FUEL;
        }
        // Firefox 2 use hidden window hack
        else if (hiddenWindow) {
            hiddenWindow.setBroData = function ( name, value) {
                this[name] = value;
            };
            hiddenWindow.getBroData = function ( name, defaultValue) {
                return (this[name]) ? this[name] : defaultValue;
            };
            this.bro.WindowManager._storage = hiddenWindow;
            this.bro.WindowManager._storageMode = this.BRO_WINDOW_STORAGE_MODE_HACK;
        }
        else {
            this.bro.Log.error("Can't find a storage manager.\n"+
                               " We won't be able to syncronize state between windows");
        }
        this.bro.WindowManager.setListMode(this.bro.InButtonController.getMode());
    },

    /**
     * Synchronize this window with the data stored globally.
     */
    synchronize : function () {
        this.bro = com.broceliand;
        // TODO remove
        //if (!this.bro.Toolbar.isInit || !this.bro.Model.getTreeList()) {
        if (!this.bro.Toolbar.isInit) {
            return;
        }

        // Backup user
        if (this.bro.Model.getCurrentUser() != this.bro.WindowManager.getCurrentUser()) {
            this.bro.Model.setCurrentUser(this.bro.WindowManager.getCurrentUser());
        }

        // Backup tree list
        var treeListsEquals = this.bro.Model.areTreeListsEquals(this.bro.Model.getTreeList(),
                                                                this.bro.WindowManager
                                                                        .getTreeList());
        if (!treeListsEquals) {
            this.bro.Model.setTreeList(this.bro.WindowManager.getTreeList());
        }

        // Backup selected tree
        var globalSelectedTree = this.bro.WindowManager.getSelectedTree();
        var globalSelectedTreeID = (globalSelectedTree) ? globalSelectedTree.treeID : null;
        var localSelectedTreeID = (this.bro.InButtonController.getSelectedTree()) ? this.bro.InButtonController
                                                                                         .getSelectedTree().treeID
                                                                                 : null;
        var selectedTreeChanged = (globalSelectedTree && globalSelectedTreeID != localSelectedTreeID);
        if (selectedTreeChanged) {
            this.bro.InButtonController.selectTree(globalSelectedTreeID,false,false,false);
        }

        // Rebuild list if changed
        if (!treeListsEquals || selectedTreeChanged) {
            this.bro.InButtonController.rebuildTreeListAndBackupSelection();
        }

        // Backup list mode
        if (this.bro.WindowManager.getListMode()
            && this.bro.InButtonController.getMode() != this.bro.WindowManager.getListMode()) {
            this.bro.InButtonController.setMode(this.bro.WindowManager.getListMode());
        }
    },

    isNewWindow : function () {
        return (this.bro.WindowManager.getWindowOpenerID()) ? true : false;
    },

    /**
     * This is the BrowserID of the the new window opener.
     * 
     * @param string browserID
     */
    setWindowOpenerID : function (browserID) {
        this.bro.WindowManager.setData('windowOpenerID', browserID);
    },

    /**
     * Return the BrowserID of the opener.
     * 
     * @return string browserID
     */
    getWindowOpenerID : function () {
        return this.bro.WindowManager.getData('windowOpenerID', null);
    },

    /**
     * @param integer value
     */
    setListMode : function (value) {
        this.bro.WindowManager.setData('listMode', value);
    },

    /**
     * @return integer
     */
    getListMode : function () {
        return this.bro.WindowManager.getData('listMode', 0);
    },

    /**
     * user treeList
     * 
     * @param array treeList
     */
    setTreeList : function (treeList) {
        this.bro.WindowManager.setData('treeList', treeList);
    },

    /**
     * user treeList
     * 
     * @return array treeList
     */
    getTreeList : function () {
        return this.bro.WindowManager.getData('treeList', null);
    },

    /**
     * current user
     * 
     * @param currentUser
     */
    setCurrentUser : function (currentUser) {
        this.bro.WindowManager.setData('currentUser', currentUser);
    },

    /**
     * currentUser
     * 
     * @return currentUser
     */
    getCurrentUser : function () {
        return this.bro.WindowManager.getData('currentUser', null);
    },

    /**
     * selected tree in the list
     * 
     * @param object selectedTree
     */
    setSelectedTree : function (selectedTree) {
        this.bro.WindowManager.setData('selectedTree', selectedTree);
    },

    /**
     * selected tree in the list
     * 
     * @return object
     */
    getSelectedTree : function () {
        return this.bro.WindowManager.getData('selectedTree', null);
    },

    /**
     * Set data in the storage
     * 
     * @param string name
     * @param object value
     */
    setData : function ( name, value) {
        if (this.bro.WindowManager._storageMode == this.BRO_WINDOW_STORAGE_MODE_FUEL) {
            this.bro.WindowManager._storage.set(name, value);
        }
        else if (this.bro.WindowManager._storageMode == this.BRO_WINDOW_STORAGE_MODE_HACK) {
            this.bro.WindowManager._storage.setBroData(name, value);
        }
    },

    /**
     * Get data from the storage
     * 
     * @param string name
     * @param object defaultValue
     * @return object
     */
    getData : function ( name, defaultValue) {
        if (this.bro.WindowManager._storageMode == this.BRO_WINDOW_STORAGE_MODE_FUEL) {
            return this.bro.WindowManager._storage.get(name, defaultValue);
        }
        else if (this.bro.WindowManager._storageMode == this.BRO_WINDOW_STORAGE_MODE_HACK) {
            return this.bro.WindowManager._storage.getBroData(name, defaultValue);
        }
    },

    /**
     * Count the number of windows opened.
     * 
     * @return integer
     */
    countWindows : function () {
        if (typeof (Application) != 'undefined' && Application.windows) {
            return Application.windows.length;
        }
        else {
            var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                    .getService(Components.interfaces.nsIWindowMediator);
            var enumerator = wm.getEnumerator('navigator:browser');
            for ( var i = 0; enumerator.hasMoreElements(); i++) {
                // Fix bug on reloading FF2 through chrome extension
                // nsISimpleEnumerator does not seem stable
                // TODO find a better way to do this
                if (i > 50) {
                    break;
                }
            }
            return i;
        }
    }
};
