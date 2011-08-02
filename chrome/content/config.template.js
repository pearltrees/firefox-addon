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

// Configuration file
// 
// You should copy this file in a new file config.js and then update
// the following parameters in order to match your local configuration.
//
// ///////////////////////////////////////////////////////////////////////////////
/**
 * Namespace function submitted by Mark A. Ziesemer to ECMAScript
 * http://blogger.ziesemer.com/2008/05/javascript-namespace-function.html
 */
var BROCELIAND_namespace = function ( c, f, b) {
    var e = c.split(f || "."), g = b || window, d, a;
    for (d = 0, a = e.length; d < a; d++) {
        g = g[e[d]] = g[e[d]] || {};
    }
    return g;
};

BROCELIAND_namespace("com.broceliand");

com.broceliand.sourceTypes = {
    ADDON_SOURCE_SELFHOSTED :1,
    ADDON_SOURCE_AMO :2
};

/**
 * CONFIG PARAMETERS
 * 
 * server: Pearltrees server address. ex: xxx.broceliand.fr source: Addon source ex:
 * com.broceliand.config.ADDON_SOURCE_SELFHOSTED
 */
com.broceliand.configParams = {
    server :'@SERVER@',
    source :com.broceliand.sourceTypes.ADDON_SOURCE_SELFHOSTED
};

com.broceliand.config = {
    bro :com.broceliand,

    PUBLIC_URL :null,
    SERVICE_URL :null,
    SERVICE_FF_URL :null,
    ADDON_SOURCE :null,
    AMO_FILE_URL :'https://addons.mozilla.org/downloads/latest/11255/addon-11255-latest.xpi',
    AMO_SOURCE :'external-selfhost',
    AMO_VERSION_CHECK :'https://versioncheck.addons.mozilla.org/update/VersionCheck.php',
    CODE_URL :'http://www.gnu.org/licenses/gpl.txt',
    ADDON_ID :'collector@broceliand.fr',
    PREF_BRANCH :'extensions.bro_toolbar.',
    DEFAULT_HOME_URL : 'http://www.google.com/firefox',
    
    init : function ( server, source) {
        var privateServices = 's';
        var selfhostedService = 'collectorFirefox';
        var amoService = 'collectorAmo';

        this.PUBLIC_URL = 'http://' + server;
        this.SERVICE_URL = 'http://' + server + '/' + privateServices + '/';

        this.ADDON_SOURCE = source;
        if (this.ADDON_SOURCE == this.bro.sourceTypes.ADDON_SOURCE_AMO) {
            this.SERVICE_FF_URL = this.SERVICE_URL + amoService + '/';
        }
        else {
            this.SERVICE_FF_URL = this.SERVICE_URL + selfhostedService + '/';
        }
    }
};
com.broceliand.config.init(com.broceliand.configParams.server, com.broceliand.configParams.source);
