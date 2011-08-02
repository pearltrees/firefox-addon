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
// Button Effect Helpers
// ///////////////////////////////////////////////////////////////////////////////
com.broceliand.buttonEffectHelper = {
    bro :com.broceliand,

    START_RECORDING_EFFECT_TIME :1320,
    STOP_RECORDING_EFFECT_TIME :300,
    REVEAL_EFFECT_TIME :2160,

    HELP_EFFECT_TIME :900, // total effect time
    HELP_TIME_HIDDEN :300, // included in HELP_EFFECT_TIME
    HELP_TIME_BEFORE_LOOP :300, // pause before loop
    HELP_OPACITY_STEPS :0.1, // change opacity 0.1 by 0.1
    HELP_MAX_OPACITY :1, // css property

    _isRunningHelpEffects :false,
    _runningEffects : [],

    runHelpEffects : function () {
        this._isRunningHelpEffects = true;
        this.runToolbarButtonHelpEffect('BRO_recordButton');
        this.runToolbarButtonHelpEffect('BRO_newButton');
        this.runToolbarButtonHelpEffect('BRO_homeButton');
    },
    stopHelpEffects : function () {
        this._isRunningHelpEffects = false;
    },

    stopIsRecordingEffect : function () {
        this.stopToolbarButtonEffect('BRO_recordButton');
        this.setButtonClass('BRO_recordButton', 'BRO_recordButtonDefault');
    },

    runIsRecordingEffect : function () {
        var recordButtonEffect = new BRO_ButtonEffect("BRO_recordButton", "BRO_recordButtonEffect",
                                                      [ 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1 ],
                                                      "BRO_recordButtonIsRecording", 120);
        this.runToolbarButtonEffect(recordButtonEffect);
    },

    runRevealEffect : function () {
        var homeButtonEffect = new BRO_ButtonEffect("BRO_homeButton", "BRO_homeButtonEffect",
                                                    [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 9,
                                                     4, 3, 2, 1 ], "BRO_homeButton", 120);
        this.runToolbarButtonEffect(homeButtonEffect);
    },

    runToolbarButtonEffect : function ( newEffect) {
        if (!newEffect)
            return;
        var buttonId = newEffect.getButtonId();
        var startingIndex = 0;

        // If there is already an active effect on this button
        if (this.isButtonRunningEffect(buttonId)) {
            var currentEffect = this.getButtonRunningEffect(buttonId);
            // If the current running effect is using the same className
            // then we will try to merge effects
            if (currentEffect.getClassName() == newEffect.getClassName()) {
                startingIndex = this.getSyncIndex(currentEffect, newEffect);
            }
            // We stop the current effect
            currentEffect.stop();
        }
        // We register the new effect as the current effect
        this.setButtonRunningEffect(buttonId, newEffect);
        newEffect.start(startingIndex);
    },

    runToolbarButtonHelpEffect : function ( buttonId) {
        if (!this._isRunningHelpEffects)
            return;
        var button = document.getElementById(buttonId);
        var image = this.getButtonImage(buttonId);
        if (!button || !image)
            return;
    
        var effectTime = this.HELP_EFFECT_TIME; // ms
        var opacitySteps = this.HELP_OPACITY_STEPS;
        var maxOpacity = this.HELP_MAX_OPACITY;
        var stepsNum = maxOpacity / opacitySteps; // Thus we adjust opacity
        // 0.1 by 0.1
        var timeBetweenSteps = effectTime / 2 / stepsNum;
        for ( var i = 1; i < stepsNum + 1; i++) {
            var opacity = maxOpacity - (i * opacitySteps);
            opacity = Math.round(opacity * 10) / 10;
            var delay = i * timeBetweenSteps;
            this.bro.Tools.callWithDelay("com.broceliand.buttonEffectHelper.setButtonImageOpacity('"
                                         + buttonId + "','" + opacity + "')", delay);
        }
        for ( var i = 1; i < stepsNum + 1; i++) {
            var opacity = i * opacitySteps;
            opacity = Math.round(opacity * 10) / 10;
            var delay = this.HELP_TIME_HIDDEN + (effectTime / 2) + (i * timeBetweenSteps);
            this.bro.Tools.callWithDelay("com.broceliand.buttonEffectHelper.setButtonImageOpacity('"
                                         + buttonId + "','" + opacity + "')", delay);
        }
        var timeBeforeLoop = this.HELP_TIME_BEFORE_LOOP;
        this.bro.Tools.callWithDelay("com.broceliand.buttonEffectHelper.runToolbarButtonHelpEffect('"
                                     + buttonId + "')", effectTime + timeBeforeLoop);
    },

    stopToolbarButtonEffect : function ( buttonId) {
        if (!this.isButtonRunningEffect(buttonId))
            return;
    
        var currentEffect = this.getButtonRunningEffect(buttonId);
        currentEffect.stop();
    },

    getSyncIndex : function ( currentEffect, newEffect) {
        var currentClassNameIds = currentEffect.getClassNameIds();
        var currentClassNameId = currentClassNameIds[currentEffect.getCurrentIndex()];
        var newClassNameIds = newEffect.getClassNameIds();
    
        for ( var i = 0; i < newClassNameIds.length; i++) {
            if (newClassNameIds[i] == currentClassNameId) {
                return i;
            }
        }
        return 0;
    },

    isButtonRunningEffect : function ( buttonId) {
        return (this._runningEffects[buttonId] && this._runningEffects[buttonId].isRunning());
    },

    getButtonRunningEffect : function ( buttonId) {
        return this._runningEffects[buttonId];
    },

    setButtonRunningEffect : function ( buttonId, buttonEffect) {
        this._runningEffects[buttonId] = buttonEffect;
    },

    setButtonClass : function ( buttonId, className) {
        var button = document.getElementById(buttonId);
        if (!button)
            return;
        button.className = className;
    },

    getButtonImage : function ( buttonId) {
        var button = document.getElementById(buttonId);
        return (button) ? button.boxObject.firstChild : null;
    
        /*
         * @todo remove ? var children = button.boxObject.childNodes; var image =
         * null; for(var i = 0; i < children.length; i++) { var tagName =
         * children[i].tagName; if(tagName=="image" || tagName=="xul:image") {
         * return child; } } return image;
         */
    },

    setButtonImageOpacity : function ( buttonId, opacity) {
        var image = this.getButtonImage(buttonId);
        image.style.opacity = opacity;
    }
};

function BRO_ButtonEffect ( buttonId, className, classNameIds, endAnimationClassName,
                            animationDelay, loopDelay) {
    return {
        bro :com.broceliand,
        _buttonId :buttonId,
        _className :className,
        _endAnimationClassName :endAnimationClassName,
        _classNameIds :classNameIds,
        _animationDelay :animationDelay,
        _loopDelay :loopDelay,

        _currentIndex :0,
        _isRunning :false,

        getButtonId : function () {
            return this._buttonId;
        },

        getClassName : function () {
            return this._className;
        },

        getClassNameIds : function () {
            return this._classNameIds;
        },

        getCurrentIndex : function () {
            return this._currentIndex;
        },

        start : function ( startingIndex) {
            if (!startingIndex)
                startingIndex = 0;
            this._currentIndex = startingIndex;
            this._isRunning = true;
            this.displayClass(this._classNameIds[this._currentIndex]);
        },

        displayClass : function ( classNameId) {
            if (!this._isRunning)
                return;
            this.bro.buttonEffectHelper.setButtonClass(this._buttonId, this._className
                                                                       + classNameId);
            this.displayNextClass();
        },

        displayNextClass : function () {
            // If it was the last class, we mark the effect as stoped.
            if (!this._classNameIds[this._currentIndex + 1]) {
                this.bro.buttonEffectHelper.setButtonClass(this._buttonId, this._endAnimationClassName);
                // If a loopDelay is specifed we will run the effect again
                if (this._loopDelay) {
                    this._currentIndex = 0;
                    this.bro.Tools.callWithDelay( function ( thisObj) {
                        thisObj.displayClass(thisObj._classNameIds[thisObj._currentIndex]);
                    }, this._loopDelay, this);
                }
                else {
                    this.stop();
                }
            }
            // Else we will display the next class after the delay
            else {
                this._currentIndex = this._currentIndex + 1;
                this.bro.Tools.callWithDelay( function ( thisObj) {
                    thisObj.displayClass(thisObj._classNameIds[thisObj._currentIndex]);
                }, this._animationDelay, this);
            }
        },

        stop : function () {
            this._isRunning = false;
            this._loopDelay = null;
        },

        isRunning : function () {
            return this._isRunning;
        }
    };
};