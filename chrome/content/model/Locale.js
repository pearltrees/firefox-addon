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
// Localisation
// ///////////////////////////////////////////////////////////////////////////////
com.broceliand.Locale = {
    bro :com.broceliand,

    _strings :null,

    init : function () {
        this._strings = document.getElementById("toolbar-strings");
    },

    getString : function ( stringId) {
        if (!this._strings) {
            this.init();
            if (!this._strings)
                return;
        }
        return this._strings.getString(stringId);
    }
};
