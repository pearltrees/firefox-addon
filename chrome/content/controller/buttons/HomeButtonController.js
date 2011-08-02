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
// Home button controller
// ///////////////////////////////////////////////////////////////////////////////
com.broceliand.HomeButtonController = {
    bro :com.broceliand,

    onClickHomeButton : function ( event) {
        this.bro.Toolbar.onUseToolbar();
        this.bro.Toolbar.reveal();
    },

    onClickCreateAccount : function ( event) {
        this.closePopup();
        this.bro.Toolbar.openCreateAccountPage();
    },

    onClickLogin : function ( event) {
        this.closePopup();
        this.bro.Toolbar.openLoginPage();
    },

    onMouseOver : function () {
        this.bro.Toolbar.showHelpOnFirstOver();
    },
    
    closePopup : function () {
        document.getElementById('BRO_firstInstallButtonPopup').hidePopup();
    },
    
    openPopup : function () {
        var firstInstallButtonPopup = document.getElementById('BRO_firstInstallButtonPopup');
        var firstInstallButton = document.getElementById('BRO_firstInstallButton');

        if (this.bro.Toolbar.isBrowserVersionGreaterOrEqual("3.5")) {
            firstInstallButtonPopup.openPopup(firstInstallButton, "after_start");
        }
        else {
            firstInstallButtonPopup.showPopup(firstInstallButton, -1, -1, 'popup', 'bottomleft', 'topleft');
        }
    }
};
