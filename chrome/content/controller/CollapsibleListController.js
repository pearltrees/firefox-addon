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

com.broceliand.CollapsibleListController = {
    bro :com.broceliand,

    BLUE_COLOR: "#009ee0",  // When the collapse item is selected, it should be blue
    WHITE_COLOR: "#ffffff", // Opened tree or tree of a selected item should have a white icon
    GRAY_COLOR: "#b2b2b2",  // Closed tree non selected should be gray

    MAX_VISIBLE_ITENS: 600, // Used to limit the max number of list elements, if it is too large,
                            // we don't synchronize the list of the server and the list of the extension
                            // and all trees will be closed by default

    init : function (treeList) {
        if(!treeList) {
            return;
        }
        
        var listLength = treeList.length;
        
        // Count visible trees
        var visibleTreeCount = 0;
        var currentDepth = 0;
        for ( var i = 0; i < listLength; i++) {
            var itemDepth = parseInt(treeList[i].depth);
            if(itemDepth > currentDepth) {
                continue;
            }
            else if(!treeList[i].collapsed) {                
                visibleTreeCount++;
                // Ignore dropzone
                if(i > 0) {
                    currentDepth = itemDepth + 1;
                }
            }
            else {
                visibleTreeCount++;
                currentDepth = itemDepth;
            }
            // this.bro.Log.log("i: "+i+" treeID: "+treeList[i].treeID+" collapsed: "+treeList[i].collapsed);
            // this.bro.Log.log("currentDepth: "+currentDepth);
        }
        // this.bro.Log.log("listLength: "+listLength+" visibleTrees: "+visibleTreeCount);
        
        // Update data types and default state
        for ( var i = 0; i < listLength; i++) {
            if (!treeList[i].collapsed) {
                treeList[i].collapsed = 0;
            }

            treeList[i].depth = parseInt(treeList[i].depth);
            
            if (visibleTreeCount > this.bro.CollapsibleListController.MAX_VISIBLE_ITENS) {
                treeList[i].collapsed = 1;
            }
        }
        return treeList;
    },

    createTreeListVisible : function () {
        var treeList = this.bro.Model.getTreeList();
        if (!treeList) {
            return;
        }

        var treeVisible = function () {
                treeID = 0;
                hasChild = false;
                depth = 0;
                showCollapsed = 0;
            };

        var treeListVisible = this.bro.Model.getTreeListVisible();
        if (!treeListVisible || treeListVisible.length != treeList.length) {
            treeListVisible = new Array();
        }

        for ( var i = 0; i < treeList.length; i++) {
            if (!treeListVisible[i]) {
                treeListVisible[i] = new treeVisible;
            }
            treeListVisible[i].treeID = treeList[i].treeID;
            treeListVisible[i].depth = treeList[i].depth;

            if (i+1<treeList.length) {
                treeListVisible[i].hasChild = treeList[i+1].depth > treeList[i].depth;
            }else{
                treeListVisible[i].hasChild = false;
            }
            treeListVisible[i].showCollapsed = treeList[i].collapsed;
            // @todo remove
//            if(treeListVisible[i].showCollapsed != 1) {
//                this.bro.Log.log("treeID: "+treeListVisible[i].treeID+" collapsed:"+treeListVisible[i].showCollapsed);
//            }
        }
        this.bro.Model.setTreeListVisible(treeListVisible);
    },
    
    draw : function (collapsed, container, hasChild) {
        if (hasChild == false)
            return;

        var canvas = this.bro.CollapsibleListController.createCanvas();
        if (collapsed == 1)
            canvas = this.bro.CollapsibleListController.drawClosed(this.bro.CollapsibleListController.GRAY_COLOR,
                                                          canvas, true);
        else
            canvas = this.bro.CollapsibleListController.drawOpened(this.bro.CollapsibleListController.GRAY_COLOR,
                                                          canvas, true);
        container.appendChild(canvas);

        // Mouse reaction for canvas should be different of the rest of the item
        canvas.addEventListener('mousedown', this.bro.CollapsibleListController.onMouseDownItem, false);
        canvas.addEventListener('mouseup', this.bro.CollapsibleListController.onMouseUpItem, false);
        canvas.addEventListener('mouseover', this.bro.CollapsibleListController.onMouseOverItem, false);
        canvas.addEventListener('mouseout', this.bro.CollapsibleListController.onMouseOutItem, false);

        return canvas;
    },

    changeColor: function(color,canvas) {
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = color;
        ctx.fill();
    },

    drawClosed : function (color,canvas,isFirstTime) {
        /* TODO remove
        var ctx = canvas.getContext("2d");
        if (isFirstTime)
            ctx.fillStyle = color;
        else
            ctx.clearRect(0,0,14,14);

        ctx.beginPath();
        ctx.moveTo(4,4.5);
        ctx.lineTo(10,8);
        ctx.lineTo(4,11.5);
        ctx.fill();
        */
        
        var ctx = canvas.getContext("2d");
        if (isFirstTime)
            ctx.fillStyle = color;
        else
            ctx.clearRect(0,0,14,14);

        ctx.beginPath();
        ctx.moveTo(2,2);
        ctx.lineTo(12,8);
        ctx.lineTo(2,14);
        ctx.fill();
        
        canvas.collapsed = true;
        return canvas;
    },

    drawOpened : function (color,canvas,isFirstTime) {
        /* TODO remove
        var ctx = canvas.getContext("2d");
        if (isFirstTime)
            ctx.fillStyle = color;
        else
            ctx.clearRect(0,0,14,14);

        ctx.beginPath();
        ctx.moveTo(3.5,5);
        ctx.lineTo(10.5,5);
        ctx.lineTo(7,11);
        ctx.fill();
        */
        
        var ctx = canvas.getContext("2d");
        if (isFirstTime)
            ctx.fillStyle = color;
        else
            ctx.clearRect(0,0,14,14);

        ctx.beginPath();
        ctx.moveTo(1,3);
        ctx.lineTo(13,3);
        ctx.lineTo(7,13);
        ctx.fill();
        
        canvas.collapsed = false;
        return canvas;
    },

    createCanvas : function () {
        var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
        canvas.style.width = 16 + "px";
        canvas.style.height = 16 + "px";
        canvas.width = 16;
        canvas.height = 16;
        return canvas;
    },

    /**
     * Select list element
     * Triangle color effects (white/gray)
     */
    refreshInListItemSelection : function (item,isSelected) {
        if (!item.canvas)
            return;
        if ((isSelected == true)||(item.canvas.isSelected)) {
            if (item.selected == true)
                item.canvas.isSelected = true;
            else
                item.canvas.isSelected = false;

            this.bro.CollapsibleListController.changeColor(this.bro.CollapsibleListController.WHITE_COLOR,
                                                       item.canvas);
        }
        else {
            this.bro.CollapsibleListController.changeColor(this.bro.CollapsibleListController.GRAY_COLOR,
                                                       item.canvas);
        }
    },

    /**
     * Collapse control selected
     * Triangle color effects (original/blue)
     */
    refreshCollapseItemSelection : function (item,isSelected) {
        if (!item.canvas)
            return;

        if (isSelected == true) {
            this.bro.CollapsibleListController.changeColor(this.bro.CollapsibleListController.BLUE_COLOR,
                                                           item.canvas);
            this.bro.CollapsibleListController.refreshVisibleList(item,true);
        }
        else {
            this.bro.CollapsibleListController.changeColor(this.bro.CollapsibleListController.GRAY_COLOR,
                                                           item.canvas);
            this.bro.CollapsibleListController.refreshVisibleList(item,false);
        }
    },

    /**
     * Refresh Visible List
     * Used do make the line under a open tree to change of color when their parent
     * tree is selected
     */
    refreshVisibleList : function (treeSourceOfEvent, isSelected) {
        if (!treeSourceOfEvent){
            return;
        }
        var treeListBox = document.getElementById('BRO_treeListBox');
        if (!treeListBox || treeListBox.getRowCount()>this.bro.CollapsibleListController.MAX_VISIBLE_ITENS) {
            return;
        }
        var treeIndex = treeSourceOfEvent.indexInList;
        var numVisibleRows = treeListBox.getNumberOfVisibleRows();
        var firstVisibleRow = treeListBox.getIndexOfFirstVisibleRow();
        treeSourceOfEvent = this.bro.Model._json.decode(treeSourceOfEvent.value);

        var tree = null;
        var found = false;
        var iMax = firstVisibleRow + numVisibleRows;

        for(var i = treeIndex; i < treeListBox.children.length; i++){
            tree = treeListBox.children[i];
            if ((found)&&(tree.childNodes[treeSourceOfEvent.depth -1])) {
                if((tree.depth <= treeSourceOfEvent.depth)||(i > iMax)){
                    found = false;
                    break;
                }
                if (isSelected)
                    tree.childNodes[treeSourceOfEvent.depth -1].className = 'BRO_treeListBoxItemIndentSelected';
                else
                    tree.childNodes[treeSourceOfEvent.depth -1].className = 'BRO_treeListBoxItemIndentVisible';
            }
            if (tree.treeID == treeSourceOfEvent.treeID){
                found = true;
            }
        }
    },

    onMouseDownItem : function (event) {
        event.stopPropagation();
        com.broceliand.CollapsibleListController.onMouseClickItem(event);
    },

    onMouseUpItem : function (event) {
        event.stopPropagation();
    },

    /**
     * When clicked: (this.switchState)
     *     opened -> closed
     *     closed -> opened
     * Rewrite the list at the end
     */
    onMouseClickItem : function (event) {
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
            this.bro.CollapsibleListController.switchState(item);
        }
    },

    onMouseOverItem : function (event) {
        event.stopPropagation();
        this.bro = com.broceliand;
        var item = null;

        if (event.target.nodeName == "richlistitem") {
            item = event.target;
        } else if (event.target.parentNode.nodeName == "richlistitem") {
            item = event.target.parentNode;
        } else if (event.target.parentNode.parentNode.nodeName == "richlistitem") {
            item = event.target.parentNode.parentNode;
        } else {
            this.bro.Log.log("Can't find richlistitem on event target: " + event.target.nodeName);
        }
        item.className = 'BRO_treeCollapseList';

        if (item.canvas) {
            this.bro.CollapsibleListController.refreshCollapseItemSelection(item,true);
        }
    },

    onMouseOutItem : function (event) {
        this.bro = com.broceliand;
        var item = null;

        if (event.target.nodeName == "richlistitem") {
            item = event.target;
        } else if (event.target.parentNode.nodeName == "richlistitem") {
            item = event.target.parentNode;
        } else if (event.target.parentNode.parentNode.nodeName == "richlistitem") {
            item = event.target.parentNode.parentNode;
        } else {
            this.bro.Log.log("Can't find richlistitem on event target: " + event.target.nodeName);
        }
        this.bro.InButtonController.refreshItemCSSClassName(item);

        if (item.canvas) {
            this.bro.CollapsibleListController.refreshCollapseItemSelection(item,false);
        }
    },

    /**
     * If it is opened, it should be closed;
     * If it is closed, it should be opened.
     */
    switchState : function (item) {
        var tree = this.bro.InButtonController.decodeListBoxItemValue(item);
        var treeListVisible = this.bro.Model.getTreeListVisible();

        for(var i = 0; i < treeListVisible.length; i++) {
            if (treeListVisible[i].treeID == tree.treeID)
                break;
        }

        // If the user asked to close a tree that is closed in the server
        var mustBeUpdatedInServer = true;
        if (tree.collapsed != treeListVisible[i].showCollapsed)
            mustBeUpdatedInServer = false;

        treeListVisible[i].showCollapsed = 1 - treeListVisible[i].showCollapsed;
        tree.collapsed = treeListVisible[i].showCollapsed;

        if(this.bro.InButtonController.getSelectedTree().treeID == tree.treeID){
            this.bro.InButtonController.notShowSelectedChildren = true;
        }

        // Update symbol
        if(item.canvas) {
            this.bro.CollapsibleListController.updateChildren(tree.treeID);
            if (tree.collapsed == 1) {
                this.bro.CollapsibleListController.drawClosed(this.bro.CollapsibleListController.SELECTED,item.canvas);
            }
            else {
                this.bro.CollapsibleListController.drawOpened(this.bro.CollapsibleListController.SELECTED,item.canvas);
            }
        }

        this.bro.CollapsibleListController.updateTreeInTreeList(tree);

        this.bro.InButtonController.onTreeListUpdated(true);

        var treeListBox = document.getElementById('BRO_treeListBox');
        var tooLargeList = treeListBox.getRowCount() > this.bro.CollapsibleListController.MAX_VISIBLE_ITENS;
        if (mustBeUpdatedInServer && !tooLargeList){
            var treeListChangedCollapsed = new function() {
                data = null;
            };
            treeListChangedCollapsed.data = new Array();
            treeListChangedCollapsed.data[0] = new Object();
            treeListChangedCollapsed.data[0]["treeID"] = parseInt(tree.treeID);
            treeListChangedCollapsed.data[0]["collapsed"] = tree.collapsed;
            this.bro.Model.updateCollapsedInServer(treeListChangedCollapsed);
        }
    },

    updateTreeInTreeList : function (tree){
        var treeList = this.bro.Model.getTreeList();

        var i;
        for(i = 0; i < treeList.length; i++){
            if(treeList[i].treeID == tree.treeID) {
                treeList[i] = tree;
                break;
            }
        }

        // See if selected list is one of the descendants of this tree
        // If yes, we should change the selected tree
        var depth = tree.depth;
        var selectedTree = this.bro.InButtonController.getSelectedTree();

        for (i=i+1; i < treeList.length; i++){
            if (treeList[i].depth <= depth)
                break;
            if (treeList[i].treeID == selectedTree.treeID) {
                this.bro.InButtonController.selectTree(tree.treeID,false,false,false);
                this.bro.InButtonController.notShowSelectedChildren=true;

                if ((this.bro.InButtonController.getMode() == this.bro.InButtonController.MODE_NAVIGATE)&&
                        (this.bro.Toolbar.isInPearltrees()))
                    this.bro.Toolbar.openSelectedTreeInPearltreesTabOrNew();
                break;
            }
        }
        this.bro.WindowManager.setTreeList(treeList);
    },

    /**
     * When a tree is closed all its descendants should also be closed
     * We close only the next level trees and only when we reopen their parent tree.
     */
    updateChildren : function (fatherId) {
        var treeList = this.bro.Model.getTreeList();
        var treeListVisible = this.bro.Model.getTreeListVisible();
        var treeListChangedCollapsed = new function() {
                            data = null;
                        };
        treeListChangedCollapsed.data = new Array();

        var i;
        for(i = 0; i < treeList.length; i++){
            if(treeList[i].treeID == fatherId){
                var depth = treeList[i].depth;
                break;
            }
        }

        i++;
        var j = 0;
        for (;i < treeList.length; i++){
            if(treeList[i].depth <= depth)
                break;
            if(treeList[i].depth > depth+1)
                continue;

            if(treeListVisible[i] && treeListVisible[i].hasChild && !treeList[i].collapsed){
                treeList[i].collapsed = 1;
                treeListVisible[i].showCollapsed = 1;

                treeListChangedCollapsed.data[j] = new Object();
                treeListChangedCollapsed.data[j]["treeID"] = parseInt(treeList[i].treeID);
                treeListChangedCollapsed.data[j]["collapsed"] = treeList[i].collapsed;
                j ++;
            }
        }
        if (j > 0)
            this.bro.Model.updateCollapsedInServer(treeListChangedCollapsed);
    }
};
