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
// Debugging tools
// ///////////////////////////////////////////////////////////////////////////////
com.broceliand.Log = {
    bro :com.broceliand,

    _consoleService :null,

    init : function () {
        this._consoleService = Components.classes['@mozilla.org/consoleservice;1']
                .getService(Components.interfaces.nsIConsoleService);
    },

    /**
     * Log messages into the javascript console
     * 
     * @param string message
     */
    log : function ( msg) {
        if (!this._consoleService)
            this.init();
        this._consoleService.logStringMessage('[pearltrees] ' + msg);
    },

    /**
     * Critical error
     * 
     * @param string msg
     */
    error : function ( msg) {
        this.log('Critical error - ' + msg);

        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Components.interfaces.nsIPromptService);
        prompts.alert(null, this.bro.Locale.getString('popup.error.title'), msg);
    },

    warning : function ( msg) {
        this.log('Warning - ' + msg);

        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Components.interfaces.nsIPromptService);
        prompts.alert(null, this.bro.Locale.getString('popup.error.title'), msg);
    },

    info : function ( msg) {
        this.log('Warning - ' + msg);

        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Components.interfaces.nsIPromptService);
        prompts.alert(null, "", msg);
    }
};
