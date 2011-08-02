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
// In button
// ///////////////////////////////////////////////////////////////////////////////
com.broceliand.InButtonController = {
    bro :com.broceliand,

    MAX_CHARS_IN_BUTTON_LABEL : 14,
    DEFAULT_DEPTH_PADDING_LEFT : 4,
    DEPTH_PADDING_LEFT : 17,
    SELECTION_EFFECT_STEP1_TIME : 200,
    SELECTION_EFFECT_STEP2_TIME : 400,
    POPUP_WIDTH : 340,
    MODE_PEARL : 1,
    MODE_NAVIGATE : 2,
    MODE_CREATE_TREE : 3,
    defaultMode : 1,
    _mode : 1,
    _selectedTree : null,
    _newTreeTitle : null,
    isPlayingSelectionEffect : false,
    notShowSelectedChildren : false,

    setMode : function (value) {
        if (value != this._mode) {
            this._mode = value;
            this.bro.WindowManager.setListMode(value);
            this.bro.Log.log("tree list mode changed to: " + this._mode);

            this.rebuildTreeListAndBackupSelection();
            this.refreshTreeListVisualComponents();
        }
    },

    getMode : function () {
        return this._mode;
    },

    setModeSwitcherVisibility : function (value) {
        var popupFooter = document.getElementById("BRO_newButtonPopupFooter");
        popupFooter.hidden = !value;
    },

    onMouseOver : function () {
        this.bro.Toolbar.showHelpOnFirstOver();
    },

    onClickSwitchMode : function () {
        if (this.getMode() == this.MODE_PEARL) {
            this.setMode(this.MODE_NAVIGATE);
        }
        else if (this.getMode() == this.MODE_NAVIGATE) {
            this.setMode(this.MODE_PEARL);
        }
    },

    cancelNewTree : function () {
        this._newTreeTitle = null;
        this.setMode(this.MODE_PEARL);
        this.closePopup();
    },

    validateNewTree : function () {
        var selectedTree = this.getSelectedTree();
        var parentTreeID = (selectedTree) ? selectedTree.treeID : null;
        this.createNewTree(this._newTreeTitle, parentTreeID);
        this.closePopup();
    },

    getSelectedTree : function () {
        if (!this._selectedTree)
            return null;

        // Return tree object from the tree list
        var treeList = this.bro.Model.getTreeList();
        if (!treeList || this._selectedTree.isNewTree || !this.bro.InButtonController.isTreeIdInTreeList(this._selectedTree.treeID)) {
            return this._selectedTree;
        }
        else {
            return this.bro.Model.getTreeByID(this._selectedTree.treeID);
        }
    },

    initTreeList : function () {
        // backup from preferences
        var rootTree = this.bro.Toolbar.backupRootTreeFromPreferences();
        var dropZone = this.bro.Toolbar.backupDropZoneFromPreferences();
        var currentUser = this.bro.Toolbar.backupCurrentUserFromPreferences();
        this.bro.Model.updateCurrentUser(currentUser);

        if (rootTree && !this.getSelectedTree()) {
            // In order to select the tree we create a treeList with only one
            // item
            var treeList = new Array(rootTree, dropZone);
            this.bro.Model.setTreeList(treeList);
            this.bro.WindowManager.setTreeList(treeList);
            // we rebuild the visual list
            this.onTreeListLoaded();
            // we add a loading... message to the list
            this.appendLoadingMessageToTreeList();
            // we select the root tree in the list
            this.selectTree(rootTree.treeID, false, true, true);
        }
        else {
            // will refresh tree list
            this.bro.InButtonController.refreshTreeListVisualComponents();
        }
    },

    closePopup : function () {
        var newButtonPopup = document.getElementById("BRO_newButtonPopup");
        if (newButtonPopup) {
            newButtonPopup.hidePopup();
        }
        var newTreePanel = document.getElementById('BRO_newTreePanel');
        if (newTreePanel) {
            newTreePanel.hidePopup();
        }
    },

    isDropZoneSelected : function () {
        var currentUser = this.bro.Model.getCurrentUser();
        var selectedTree = this.bro.InButtonController.getSelectedTree();
        return (selectedTree && selectedTree.treeID == currentUser.dropZoneID);
    },

    onNewTreePanelShowing : function () {
        this.closePopup();
        // Use small timeout whereas XBL setters don't work...
        // Don't know why yet :(
        com.broceliand.Tools.callWithDelay( function () {
            this.bro.InButtonController.initNewTreePanel('BRO_newTreePanelContent');
        }, 20);
    },

    initNewTreePanel : function ( newTreePanelContentId) {
        var newTreePanelContent = document.getElementById(newTreePanelContentId);
        newTreePanelContent.text = this.bro.Locale.getString('popup.nameTree.defaultText');
        newTreePanelContent.focus();
        newTreePanelContent.selectText();
    },

    onClickCancelNewTreeTitle : function () {
        this.bro.ContextMenuItemController._isLink = false;
        this.bro.InButtonController.closePopup();
    },

    onClickValidateNewTreeTitle : function () {
        var newTreePanelContent = document.getElementById('BRO_newTreePanelContent');
        var newTreeTitle = newTreePanelContent.text;
        if (newTreeTitle && com.broceliand.Tools.trim(newTreeTitle) != ""
            && newTreeTitle != this.bro.Locale.getString('popup.nameTree.defaultText')) {
            this.closePopup();
            this.bro.InButtonController.selectNewTreeParent(newTreeTitle);
        }
        else {
            newTreePanelContent.text = "";
            newTreePanelContent.focus();
        }
    },

    selectNewTreeParent : function ( newTreeTitle) {
        this._newTreeTitle = newTreeTitle;

        this.setMode(this.MODE_CREATE_TREE);
        this.openNewButtonPopup();
    },

    createNewTree : function ( newTreeTitle, parentTreeID) {
        // Reset list mode to default
        this.bro.InButtonController.setMode(this.bro.InButtonController.defaultMode);

        // Validate tree title
        if (!newTreeTitle || com.broceliand.Tools.trim(newTreeTitle) == "")
            return;

        // If no parentTree specified, we use the user root tree
        if (!parentTreeID) {
            var currentUser = this.bro.Model.getCurrentUser();
            parentTreeID = currentUser.rootTreeID;
        }

        // We add a new tree item in the treeList
        var newTree = this.bro.Model.addNewTreeToList(newTreeTitle, parentTreeID);

        // We update the selected tree
        this._selectedTree = newTree;
        this.bro.WindowManager.setSelectedTree(newTree);
        this.bro.Toolbar.treeSelectionChanged();
        this.refreshTreeListVisualComponents(true);

        // We save the current page if possible, the new tree will be created at
        // the same time
        if (!this.bro.NavListener.urlLoading
            && this.bro.Model.isValidUrl(this.bro.BrowserManager.getSelectedBrowserUrl())) {
            this.bro.ButtonsHandler.addPearlIfPossible();
        }
        else {
            this.bro.Model.createTree(newTreeTitle, parentTreeID);
        }

        this.bro.Toolbar.setRevealed(false);
        this.bro.Toolbar.showNameTreeDoneWindow();
    },
    
    onClickToolbarButton : function () {
        this.bro.ContextMenuItemController._clickedLinkUrl = null;
    },

    openNewButtonPopup : function () {
        var newButtonPopup = document.getElementById('BRO_newButtonPopup');
        var newButton = document.getElementById('BRO_newButton');

        if (this.bro.Toolbar.isBrowserVersionGreaterOrEqual("3.5")) {
            newButtonPopup.openPopup(newButton, "after_start");
        }
        else {
            newButtonPopup.showPopup(newButton, -1, -1, 'popup', 'bottomleft', 'topleft');
        }
    },

    selectTree : function ( treeID, addPearlAfterSelect, isInitializing, closePopup) {
        var treeList = this.bro.Model.getTreeList();
        if (!treeList) {
            return;
        }

        var newSelectedTree = null;
        for ( var i = 0; i < treeList.length; i++) {
            if (treeList[i].treeID == treeID) {
                newSelectedTree = treeList[i];
                break;
            }
        }

        var selectedTreeChanged = (!this.getSelectedTree() || !newSelectedTree
                                   || this.getSelectedTree().treeID != newSelectedTree.treeID
                                   || this.getSelectedTree().title != newSelectedTree.title
                                   || this.getSelectedTree().lastUpdate != newSelectedTree.lastUpdate
                                   || this.getSelectedTree().assoId != newSelectedTree.assoId);
        if (selectedTreeChanged) {
            if (newSelectedTree)
                this._selectedTree = newSelectedTree;
            else
                this._selectedTree = null;

            // If we don't find the tree in the list we create a temporary item
            if (!this._selectedTree) {
                var treeObject = {};
                treeObject.treeID = treeID;
                var currentUser = this.bro.Model.getCurrentUser();
                if (currentUser) {
                    treeObject.title = currentUser.username.toLowerCase();
                }
                else {
                    treeObject.title = this.bro.Locale.getString('new.button.label');
                }
                this._selectedTree = treeObject;
            }

            if(closePopup)
                this.closePopup();

            this.bro.Toolbar.treeSelectionChanged();
            this.rebuildTreeListAndBackupSelection(true);
        }

        if (!isInitializing) {
            this.bro.WindowManager.setSelectedTree(this._selectedTree);
        }

        this.refreshTreeListVisualComponents(addPearlAfterSelect);

        if (addPearlAfterSelect) {
            this.bro.ButtonsHandler.addPearlIfPossible();
        }
    },

    isTreeIdInTreeList : function ( treeID) {
        var treeList = this.bro.Model.getTreeList();
        if (!treeList)
            return false;
        for ( var i = 0; i < treeList.length; i++) {
            if (treeList[i].treeID == treeID) {
                return true;
            }
        }
        return false;
    },

    onClickRootTree : function () {
        var currentUser = this.bro.Model.getCurrentUser();
        var mode = this.bro.InButtonController.getMode();

        if (mode == this.bro.InButtonController.MODE_CREATE_TREE) {
            this.bro.InButtonController.createNewTree(this.bro.InButtonController._newTreeTitle,
                                                      currentUser.rootTreeID);
        }
        else {
            var addPearlAfterSelect = (mode == this.bro.InButtonController.MODE_PEARL);

            this.selectRootTree(addPearlAfterSelect);

            if (mode == this.bro.InButtonController.MODE_NAVIGATE
                || this.bro.Toolbar.isInPearltrees()) {
                this.bro.Toolbar.openSelectedTreeInCurrentTab();
            }
        }

        this.closePopup();
    },

    selectRootTree : function (addPearlAfterSelect) {
        var currentUser = this.bro.Model.getCurrentUser();
        if (currentUser) {
            this.selectTree(currentUser.rootTreeID, addPearlAfterSelect, false, true);
        }
    },

    onClickDropZoneTree : function () {
        var currentUser = this.bro.Model.getCurrentUser();
        var addPearlAfterSelect = (currentUser.dropZoneID != this.getSelectedTree());

        this.selectDropZoneTree(addPearlAfterSelect);

        this.closePopup();

        if (this.bro.Toolbar.isInPearltrees()) {
            this.bro.Toolbar.openSelectedTreeInCurrentTab();
        }
    },

    selectDropZoneTree : function (addPearlAfterSelect) {
        var currentUser = this.bro.Model.getCurrentUser();
        if (currentUser) {
            this.selectTree(currentUser.dropZoneID, addPearlAfterSelect, false, true);
        }
    },

    refreshTreeListVisualComponents : function () {
        var newButton = document.getElementById('BRO_newButton');
        if (!newButton)
            return;
        var currentUser = this.bro.Model.getCurrentUser();

        // Refresh title
        var label = "";
        if (this.getSelectedTree()) {
            if (currentUser && this.getSelectedTree().treeID == currentUser.dropZoneID) {
                label = this.bro.Locale.getString('treeList.dropzone.selected');
            }
            else {
                label = this.getSelectedTree().title;
            }
        }
        else if (currentUser) {
            var rootTreeName = currentUser.username.toLowerCase();
            label = rootTreeName;
        }
        else {
            label = this.bro.Locale.getString('new.button.label');
        }
        if (label.length > this.MAX_CHARS_IN_BUTTON_LABEL) {
            label = label.substr(0, this.MAX_CHARS_IN_BUTTON_LABEL) + "..";
        }
        newButton.label = label;

        var isInPearltrees = this.bro.Toolbar.isInPearltrees();
        var popupHeader = document.getElementById("BRO_newButtonPopupHeader");
        var popupFooter = document.getElementById("BRO_newButtonPopupFooter");
        var dropZoneButton = document.getElementById("BRO_dropZoneButton");
        var switchModeButton = document.getElementById("BRO_switchModeButton");
        var newTreeButtonContainer = document.getElementById("BRO_newTreeButtonContainer");

        // Refresh components visibility based on mode
        if (this._mode == this.MODE_NAVIGATE) {
            newTreeButtonContainer.hidden = true;
            popupHeader.hidden = true;
            popupFooter.hidden = isInPearltrees;
            dropZoneButton.hidden = true;
            switchModeButton.label = this.bro.Locale.getString('new.footer.mode.navigate');
            switchModeButton.hidden = isInPearltrees;
            newButton.className = "BRO_newButtonNavigateMode";
        }
        else if (this._mode == this.MODE_PEARL) {
            newTreeButtonContainer.hidden = false;
            popupHeader.hidden = false;
            popupFooter.hidden = false;
            dropZoneButton.hidden = false;
            switchModeButton.label = this.bro.Locale.getString('new.footer.mode.pearl');
            switchModeButton.hidden = false;
            newButton.className = "BRO_newButtonPearlMode";
        }
        else if (this._mode == this.MODE_CREATE_TREE) {
            newTreeButtonContainer.hidden = true;
            popupHeader.hidden = true;
            popupFooter.hidden = true;
            dropZoneButton.hidden = true;
            switchModeButton.hidden = true;
        }

        this.refreshTreeListTextHeader();
        this.refreshTreeListHeight();
    },

    refreshTreeListTextHeader : function () {
        var newButtonMenuPopupTitle = document.getElementById("BRO_newButtonMenuPopupTitle");
        if (!newButtonMenuPopupTitle)
            return;

        var headerText = "";
        var styleClass = "";
        if (this._mode == this.MODE_PEARL) {
            if (this.bro.Toolbar.isCurrentUrlRecorded()) {
                headerText = this.bro.Locale.getString('new.header.mode.movePearl');
                styleClass = 'BRO_menuPopupTitle';
            }
            else {
                headerText = this.bro.Locale.getString('new.header.mode.pearl');
                styleClass = 'BRO_menuPopupTitle';
            }
        }
        else if (this._mode == this.MODE_NAVIGATE) {
            headerText = this.bro.Locale.getString('new.header.mode.navigate');
            styleClass = 'BRO_menuPopupTitle';
        }
        else if (this._mode == this.MODE_CREATE_TREE) {
            headerText = this.bro.Locale.getString('new.header.mode.createTree');
            styleClass = 'BRO_menuPopupTitle';
        }

        newButtonMenuPopupTitle.value = headerText;
        newButtonMenuPopupTitle.className = styleClass;
    },

    onTreeListNotChanged : function () {
        this.backupSelection();
    },

    onTreeListLoaded : function () {
        this.replaceSelectedNewTreeIfNeed();
        this.rebuildTreeListAndBackupSelection();
    },

    onTreeListUpdated : function (notScroll) {
        this.rebuildTreeListAndBackupSelection(notScroll);
    },

    showSelectedTree : function(selectedTreeId){
        var treeListVisible = this.bro.Model.getTreeListVisible();
        var treeList = this.bro.Model.getTreeList();
        var depth = 0;
        var selectedTreeIndex = 0;

        if (selectedTreeId && treeListVisible && treeList) {
            var treeListVisibleLength = treeListVisible.length;
            if (!treeListVisibleLength)
                return;

            for (var i = treeListVisibleLength-1; i >= 0; i--) {
                if (!treeList[i]) {
                    continue;
                }

                // If a new tree was created we dont have it information
                // Its parent should also have it information changed
                if (!treeListVisible[i].showCollapsed) {
                    treeListVisible[i].showCollapsed = 0;
                    if (i > 0)
                        treeListVisible[i-1].hasChild = treeListVisible[i].depth > treeListVisible[i-1].depth;
                }

                // Looking for all the ancestors of the selected tree to open them
                if (selectedTreeId == treeListVisible[i].treeID) {
                    selectedTreeIndex = i;
                    depth = treeListVisible[i].depth;
                }
                if ((depth > 0) && (treeList[i].depth == depth-1)){
                    treeListVisible[i].showCollapsed = 0;
                    depth --;
                }
                else {
                    if (!treeList[i].collapsed) {
                        treeList[i].collapsed = 0;
                    }

                    treeListVisible[i].showCollapsed = treeList[i].collapsed;
                }
            }

            //The children of the selected pearl should also be visible
            if ((treeListVisible[selectedTreeIndex].showCollapsed == 1)&&(!this.notShowSelectedChildren)) {
                treeListVisible[selectedTreeIndex].showCollapsed = 0;
                for (var i = selectedTreeIndex+1; i < treeListVisibleLength; i++) {
                    if (treeList[i]) {
                        if (treeList[i].depth <= depth) {
                            break;
                        }
                    }
                }
            }
        }

        this.bro.Model.setTreeListVisible(treeListVisible);
    },

    replaceSelectedNewTreeIfNeed : function () {
        var treeList = this.bro.Model.getTreeList();

        if (this._selectedTree && this._selectedTree.isNewTree && treeList) {
            var treeListLength = treeList.length;
            for ( var i = treeListLength - 1; i >= 0; i--) {
                if (this._selectedTree.treeID == treeList[i].treeID) {
                    this._selectedTree = treeList[i];
                }
            }
        }
    },

    rebuildTreeListAndBackupSelection : function (noScroll) {
        if (!this.bro.Model.getTreeList())
            return;
        this.cleanTreeListBox();
        if(this._selectedTree)
            this.showSelectedTree(this._selectedTree.treeID);
        this.populateTreeListBox();
        this.backupSelection(noScroll);
    },

    backupSelection : function (noScroll) {
        var treeListBox = document.getElementById('BRO_treeListBox');
        if (!treeListBox)
            return;
        var currentUser = this.bro.Model.getCurrentUser();

        // Handle tree cases
        if (this.getSelectedTree()) {
            if (currentUser && this.getSelectedTree().treeID == currentUser.rootTreeID
                && this.getSelectedTree().pearlCount >= this.MAX_PEARLS_IN_TREE) {
                var selectedTreeID = currentUser.dropZoneID;
                this.selectDropZoneTree(false);
            }
            else {
                var selectedTreeID = this.getSelectedTree().treeID;
            }
        }
        // If there is no tree selected we select the root tree
        else if (currentUser) {
            var selectedTreeID = currentUser.rootTreeID;
            this.selectRootTree(false);
        }
        var isRootTreeSelected = selectedTreeID && currentUser
                                 && selectedTreeID == currentUser.rootTreeID;
        var isDropZoneSelected = selectedTreeID && currentUser
                                 && selectedTreeID == currentUser.dropZoneID;

        // Backup selection in the treeList
        treeListBox.selectItem(-1);
        if (!isRootTreeSelected && !isDropZoneSelected && selectedTreeID) {
            var itemCount = treeListBox.itemCount;
            for ( var i = 0; i < itemCount; i++) {
                var item = treeListBox.getItemAtIndex(i);
                var value = this.decodeListBoxItemValue(item);

                if (value && value.treeID == selectedTreeID) {
                    if (treeListBox.selectedItem != item) {
                        treeListBox.selectItem(item);
                        this.bro.CollapsibleListController.refreshInListItemSelection(item,true);
                    }
                    // Error raised by richtextbox in FF2 while using
                    // ensureIndexIsVisible & getNumberOfVisibleRows
                    if (this.bro.Toolbar.isBrowserVersionGreaterOrEqual("3.0")) {
                        if (!noScroll) {
                            this.bro.InButtonController.scrollToListIndex(i);
                            // Must scroll with delay because the list may not be
                            // fully built
                            com.broceliand.Tools.callWithDelay(
                                  'this.bro.InButtonController.scrollToListIndex(' + i + ')',20);
                        }
                    }
                    break;
                }
            }
        }

        // Backup dropZone selection
        var dropZoneButton = document.getElementById('BRO_dropZoneButton');
        if (isDropZoneSelected) {
            dropZoneButton.className = 'BRO_treeListBoxSpecialItemSelected';
        }
        else {
            dropZoneButton.className = 'BRO_treeListBoxSpecialItem';
        }
        // Backup rootTree selection
        var rootTreeButton = document.getElementById('BRO_rootTreeButton');

        if (isRootTreeSelected) {
            rootTreeButton.className = 'BRO_treeListBoxSpecialItemSelected';
        }
        else {
            rootTreeButton.className = 'BRO_treeListBoxSpecialItem';
        }
    },

    scrollToListIndex : function (index) {
        var treeListBox = document.getElementById('BRO_treeListBox');

        treeListBox.ensureIndexIsVisible(index);

        var numVisibleRows = treeListBox.getNumberOfVisibleRows();
        if (index > numVisibleRows) {
            var indexToScroll = index - Math.round(numVisibleRows / 2) + 2;

            treeListBox.scrollToIndex(indexToScroll);
        }
    },

    appendLoadingMessageToTreeList : function () {
        this.appendItemToListBox('loading...',null,false,1);
    },

    cleanTreeListBox : function () {
        var treeListBox = document.getElementById('BRO_treeListBox');
        if (!treeListBox)
            return;
        while (treeListBox.firstChild) {
            treeListBox.removeChild(treeListBox.firstChild);
        }
    },

    populateTreeListBox : function () {
        var treeListBox = document.getElementById('BRO_treeListBox');
        var currentUser = this.bro.Model.getCurrentUser();

        // Prepare fetching the list
        var treeList = this.bro.Model.getTreeList();
        var treeListVisible = this.bro.Model.getTreeListVisible();
        if (!treeList)
            return;
        var listLength = treeList.length;

        if ((!treeListVisible)||(treeListVisible.length != listLength)){
            this.bro.CollapsibleListController.createTreeListVisible();
            treeListVisible = this.bro.Model.getTreeListVisible();
        }

        // Find user root tree and refresh its title
        var rootTreeTitle = document.getElementById('BRO_rootTreeTitle');
        var addHomeLabel = (this._mode == this.MODE_NAVIGATE);

        if (currentUser && currentUser.rootTreeID && rootTreeTitle) {
            for ( var i = 0; i < listLength; i++) {
                if (treeList[i].treeID == currentUser.rootTreeID) {
                    var title = treeList[i].title;
                    if (addHomeLabel)
                        title += " (home)";
                    rootTreeTitle.value = title;
                    break;
                }
            }
        }

        listLength = treeList.length;
        if ((!treeListVisible)||(treeListVisible.length != listLength)){
            this.bro.CollapsibleListController.createTreeListVisible();
            treeListVisible = this.bro.Model.getTreeListVisible();
        }
        var isSelectedTreeInList = false;

        var lastLevelClosed = 0;
        var richlistIndex = 0;
        // Populate the rest of the list
        for ( var i = 0; i < listLength; i++) {
            var item = null;
            var tree = treeList[i];
            var treeVisible = treeListVisible[i];

            // Add items that are not the dropZone or the root tree
            if (tree.treeID == currentUser.rootTreeID || tree.treeID == currentUser.dropZoneID) {
                continue;
            }

            if (lastLevelClosed == 0 || treeVisible.depth <= lastLevelClosed) {
                
                if (treeVisible.depth <= lastLevelClosed) {
                    lastLevelClosed = 0;
                }

                var title = tree.title;

                if ((tree.assoId != currentUser.rootTreeID)&&(tree.assoId == tree.treeID)) {
                    title = "team " + title;
                }
                if (tree.pearlCount >= this.bro.Toolbar.MAX_PEARLS_IN_TREE) {
                    title = title + " (full)";
                }
                var indentDepth = parseInt(tree.depth);
                item = this.appendItemToListBox(title, tree, true, indentDepth,treeVisible.showCollapsed,treeVisible.hasChild,richlistIndex);
                item.addEventListener('mousedown', this.bro.InButtonController.onMouseDownItem, false);
                item.addEventListener('mouseup', this.bro.InButtonController.onMouseUpItem, false);
                item.addEventListener('mouseover', this.bro.InButtonController.onMouseOverItem, false);
                item.addEventListener('mouseout', this.bro.InButtonController.onMouseOutItem, false);

                this.bro.InButtonController.refreshItemCSSClassName(item, tree);

                item.style.paddingLeft = this.DEFAULT_DEPTH_PADDING_LEFT + 'px';
                
                if (treeVisible.showCollapsed == 1) {
                    lastLevelClosed = tree.depth;
                }
                
                richlistIndex++;
            }
        }

        this.refreshTreeListHeight();
    },

    refreshItemCSSClassName : function ( item, tree) {
        if (!tree) {
            var tree = this.bro.InButtonController.decodeListBoxItemValue(item);
        }
        if (!tree)
            return;

        // Set specific display if the item selected is full
        if (tree.pearlCount >= this.bro.Toolbar.MAX_PEARLS_IN_TREE) {
            item.className = 'BRO_treeFull';
        }
        else {
            item.className = null;
        }
    },

    onMouseDownItem : function ( event) {
        com.broceliand.InButtonController.onMouseClickItem(event);
    },

    onMouseUpItem : function (event) {
    },

    onMouseClickItem : function ( event) {
        this.bro = com.broceliand;
        var item = null;

        if (event.target.nodeName == "richlistitem") {
            item = event.target;
        }
        else if (event.target.parentNode.nodeName == "richlistitem") {
            item = event.target.parentNode;
        }
        else if (event.target.parentNode.parentNode.nodeName == "richlistitem") {
            item = event.target.parentNode.parentNode;
        }
        else {
            this.bro.Log.log("Can't find richlistitem on event target: " + event.target.nodeName);
        }

        if (item && !this.bro.InButtonController.isPlayingSelectionEffect) {
            this.bro.InButtonController.isPlayingSelectionEffect = true;
            this.bro.InButtonController.selectItemAfterEffect(item);
        }
    },

    onMouseOverItem : function ( event) {
        this.bro = com.broceliand;
        var item = null;

        if (event.target.nodeName == "richlistitem") {
            item = event.target;
        }
        else if (event.target.parentNode.nodeName == "richlistitem") {
            item = event.target.parentNode;
        }
        else if (event.target.parentNode.parentNode.nodeName == "richlistitem") {
            item = event.target.parentNode.parentNode;
        }
        else {
            this.bro.Log.log("Can't find richlistitem on event target: " + event.target.nodeName);
        }

        if (item) {
            this.bro.CollapsibleListController.refreshInListItemSelection(item,true);
        }
    },

    onMouseOutItem : function ( event) {
        this.bro = com.broceliand;
        var item = null;

        if (event.target.nodeName == "richlistitem") {
            item = event.target;
        }
        else if (event.target.parentNode.nodeName == "richlistitem") {
            item = event.target.parentNode;
        }
        else if (event.target.parentNode.parentNode.nodeName == "richlistitem") {
            item = event.target.parentNode.parentNode;
        }
        else {
            this.bro.Log.log("Can't find richlistitem on event target: " + event.target.nodeName);
        }

        if (item) {
            this.bro.CollapsibleListController.refreshInListItemSelection(item,false);
        }
    },

    selectItemAfterEffect : function ( item) {
        this.bro.InButtonController.setItemSelectionEffectStep1(item);
        var tools = com.broceliand.Tools;
        tools.callWithDelay(this.bro.InButtonController.setItemSelectionEffectStep2,
                            this.bro.InButtonController.SELECTION_EFFECT_STEP1_TIME, item);
        tools.callWithDelay(this.bro.InButtonController.setItemSelectionEffectStep3,
                            this.bro.InButtonController.SELECTION_EFFECT_STEP2_TIME, item);
        tools.callWithDelay(this.bro.InButtonController.selectItem,
                            this.bro.InButtonController.SELECTION_EFFECT_STEP2_TIME, item);
    },

    setItemSelectionEffectStep1 : function ( item) {
        item.className = 'BRO_treeSelectionStep1';
    },

    setItemSelectionEffectStep2 : function ( item) {
        item.className = 'BRO_treeSelectionStep2';
    },

    setItemSelectionEffectStep3 : function ( item) {
        this.bro.InButtonController.refreshItemCSSClassName(item);
        this.bro.InButtonController.isPlayingSelectionEffect = false;
    },

    selectItem : function (item) {
        var itemTree = this.bro.InButtonController.decodeListBoxItemValue(item);
        if (!itemTree || !itemTree.treeID)
            return;

        var treeID = itemTree.treeID;
        var mode = this.bro.InButtonController.getMode();

        if (mode == this.bro.InButtonController.MODE_CREATE_TREE) {
            this.bro.InButtonController.createNewTree(this.bro.InButtonController._newTreeTitle,
                                                      treeID);
        }
        else {
            var selectAndPearl = (mode == this.bro.InButtonController.MODE_PEARL);

            this.bro.InButtonController.selectTree(treeID, selectAndPearl, false, true);

            if (treeID && mode == this.bro.InButtonController.MODE_NAVIGATE) {
                this.bro.Toolbar.openSelectedTreeInCurrentTab(null, true);
            }
        }

        this.bro.InButtonController.closePopup();
    },

    sortTreeListItemByTitle : function ( a, b) {
        // a is a tree
        if (a.treeID) {
            var aTitle = a.title.toLowerCase();
        }
        else {
            return;
        }

        // b is a tree
        if (b.treeID) {
            var bTitle = b.title.toLowerCase();
        }
        else {
            return;
        }

        return ( (aTitle < bTitle) ? -1 : ( (aTitle > bTitle) ? 1 : 0));
    },

    appendItemToListBox : function ( title, value, encode, indent, collapsed, hasChild, index) {
        var treeListBox = document.getElementById('BRO_treeListBox');
        if (!treeListBox) {
            return null;
        }
        var treeID;
        if (value)
            treeID = value.treeID;

        if (encode) {
            value = this.bro.Model._json.encode(value);
        }
        var item = document.createElement('richlistitem');

        // createElementNS doesn’t have style properties, so we use createElement
        var itemDesc = document.createElement('description');

        itemDesc.className = 'BRO_treeListBoxItemDesc';
        itemDesc.setAttribute('crop', 'end');
        itemDesc.setAttribute('value', title);
        
        if (indent == 1) {
            itemDesc.style.width = (this.POPUP_WIDTH - 48 - 11) + 'px';
        }
        else if (indent > 1) {
            itemDesc.style.width = (this.POPUP_WIDTH - 48 - 11 - ( (indent - 1) * 19)) + 'px';
        }
        else {
            itemDesc.style.width = (this.POPUP_WIDTH - 48) + 'px';
        }

        item.value = value;
        item.depth = indent;
        item.treeID = treeID;
        if (index)
            item.indexInList = index;
        else
            item.indexInList = 0;
        if (indent && indent > 0) {
            for ( var i = 0; i < indent; i++) {
                var spacer = document.createElement('hbox');

                if (i<indent-1)
                    spacer.className = 'BRO_treeListBoxItemIndentVisible';
                else
                    spacer.className = 'BRO_treeListBoxItemIndent';

                // In the last spacer we add an open / close button if necessary
                if (i == indent-1){
                    item.canvas = this.bro.CollapsibleListController.draw(collapsed,spacer,hasChild);
                }
                item.appendChild(spacer);
            }
        }

        item.appendChild(itemDesc);
        treeListBox.appendChild(item);
        return item;
    },

    decodeListBoxItemValue : function (listItem) {
        if (!listItem || !listItem.value || listItem.value == 'undefined')
            return null;
        return this.bro.Model._json.decode(listItem.value);
    },

    /**
     * Fix the popup height if it is bigger than the window height
     * 
     * We calculate the popup size because Firefox does not do it well. TODO find a better way to
     * calculate the popup size.
     */
    refreshTreeListHeight : function () {
        var treeListBox = document.getElementById('BRO_treeListBox');
        if (!treeListBox)
            return;
        var newButton = document.getElementById('BRO_newButton');
        var newButtonPopup = document.getElementById('BRO_newButtonPopup');
        if (!newButton || !newButtonPopup)
            return;

        var treeList = this.bro.Model.getTreeList();
        var treeLength = (treeList) ? treeList.length : 0;

        var listLength = treeLength;
        var lineHeight = 19;
        var separatorHeight = 28;
        var borderWidth = 2;

        // var newButtonPopupHeader = document.getElementById('BRO_newButtonPopupHeader');
        var headerHeight = separatorHeight;
        // newButtonPopupHeader.setAttribute('style', 'height:' + headerHeight+ 'px');
        var listHeight = headerHeight + (lineHeight * (listLength + 2)) + separatorHeight
                         + (borderWidth * 2);

        var windowHeight = window.outerHeight;
        var listY = newButton.boxObject.height + newButton.boxObject.y;
        var maxHeight = windowHeight - listY - 55;
        var maxHeight = (listHeight > maxHeight) ? maxHeight : null;
        newButtonPopup.setAttribute('maxheight', maxHeight);
    },

    createTreeListSpacerSeparator : function ( spacerHeight) {
        if (!spacerHeight || spacerHeight < 1)
            spacerHeight = 15; // By default 1 line height
        var item = document.createElement('richlistitem');
        item.className = 'BRO_treeListSeparatorItem';
        item.setAttribute('selectable', 'false');
        var separator = document.createElement('spacer');
        separator.height = spacerHeight;
        item.appendChild(separator);
        return item;
    },

    createTreeListTextSeparator : function ( text) {
        var item = document.createElement('richlistitem');
        item.className = 'BRO_treeListSeparatorItem';
        item.setAttribute('selectable', 'false');
        item.style.fontWeight = 'bold';
        // var separator = document.createTextNode(text);

        // createElementNS doesn’t have style properties, so we use createElement
        var separator = document.createElement('description');

        var textNode = document.createTextNode(text);
        separator.appendChild(textNode);
        item.appendChild(separator);
        return item;
    },

    createTreeListLineSeparator : function () {
        var item = document.createElement('richlistitem');
        item.className = 'BRO_treeListSeparatorItem';
        item.setAttribute('selectable', 'false');
        var separator = document.createElement('image');
        separator.flex = 0;
        separator.className = 'BRO_treeListSeparator';
        item.appendChild(separator);
        return item;
    },

    onShowTreeList : function (event) {
        this.bro.InButtonController.notShowSelectedChildren = false;
        this.bro.LoginController.setLastAction(this.bro.LoginController.ACTION_SHOW_TREE_LIST);
        this.refreshTreeListTextHeader();

        this.bro.Toolbar.onUseToolbar();
        // Refresh the list
        this.bro.Model.getTreesAndCurrentUser();
        // Refresh list size when initialized (few ms after popup shown)
        com.broceliand.Tools.callWithDelay('this.bro.InButtonController.refreshTreeListHeight()', 10);
    },

    onHideTreeList : function (event) {
        if (this.getMode() == this.MODE_CREATE_TREE) {
            this.bro.InButtonController.validateNewTree();
        }
    },

    onKeyPress : function ( event) {
        var newButtonPopup = document.getElementById('BRO_newButtonPopup');
        if (!newButtonPopup)
            return;
    
        if (event.keyCode == event.DOM_VK_ESCAPE || event.keyCode == event.DOM_VK_CANCEL) {
            if (this.bro.InButtonController.getMode() == this.bro.InButtonController.MODE_CREATE_TREE) {
                this.bro.InButtonController.cancelNewTree();
            }
            else {
                newButtonPopup.hidePopup();
            }
        }
        else if (event.keyCode == event.DOM_VK_RETURN) {
            if (this.bro.InButtonController.getMode() == this.bro.InButtonController.MODE_CREATE_TREE) {
                this.bro.InButtonController.validateNewTree();
            }
        }
    }
};
window.addEventListener("keypress", com.broceliand.InButtonController.onKeyPress, true);
