
(function(ns) {

    // June 6, 2013
    ns.ARCTIC_PROJECTION_CHANGE_DATE = new Date(Date.UTC(2013, 05, 06));

    // Width boundary in pixels where desktop mode switches to mobile.
    ns.TRANSITION_WIDTH = 720;

    ns.LAYER_TYPES = {
        baselayers: {
            id: "baselayers",
            camel: "BaseLayers",
            description: "Base Layers"
        },
        overlays: {
            id: "overlays",
            camel: "Overlays",
            description: "Overlays"
        }
    };

    /**
     * Defines a namespace under Worldview. Each argument is an object path
     * delimited by periods. For each path item, an empty object is created if
     * one does not yet exist. For example:
     *
     *      Worldview.namespace("foo.bar");
     *
     * If Worldview.foo does not exist, it wil be created with an empty object.
     * If Worldview.foo.bar does not exist, it will be created with an empty
     * object.
     *
     * @method namespace
     * @static
     *
     * @param [arguments]* {String} Object path, delimited by periods
     *
     * @return {Object} The newly created namespace object.
     */
    ns.namespace = function() {
        var obj;
        for ( var i = 0; i < arguments.length; i++ ) {
            var list=(""+arguments[i]).split(".");
            obj = Worldview;
            for ( var j = 0; j < list.length; j++ ) {
                obj[list[j]] = obj[list[j]] || {};
                obj = obj[list[j]];
            }
        }
        return obj;
    };

    /**
     * Worldview general error handler. The error is reported to the browser
     * console and, if the JavaScript library with YAHOO.widget.Panel is
     * found, opens a notification panel for the end user.
     *
     * @method error
     * @static
     *
     * @param message {string} Error message to display to the user.
     *
     * @param cause {exception|string} Description of the error that does not
     * need to be shown to the user, usually the exception that was caught.
     */
    ns.error = function(message, cause) {
        if ( cause ) {
            console.error(cause);
        } else {
            console.error(message);
        }

        if ( window.YAHOO && window.YAHOO.widget &&
                window.YAHOO.widget.Panel ) {
            o = new YAHOO.widget.Panel("WVerror", {
                width: "300px",
                zIndex: 1020,
                visible: false,
                constraintoviewport: true
            });
            o.setHeader('Warning');
            o.setBody("An unexpected error has occurred.<br/><br/>" + message +
                "<br/><br/>Please reload the page and try again. If you " +
                "continue to have problems, contact us at " +
                "<a href='mailto:support@earthdata.nasa.gov'>" +
                "support@earthdata.nasa.gov</a>");
            o.render(document.body);
            o.show();
            o.center();
            o.hideEvent.subscribe(function(i) {
                setTimeout(function() {o.destroy();}, 25);
            });
        }
    };

    /**
     * Asks the end user a yes or no question in a dialog box.
     *
     * @method ask
     * @static
     *
     * @param [spec.header="Notice"] {string} Header text to be displayed in
     * the dialog box.
     *
     * @param [spec.message="Are you sure?"] {string} Message text to be
     * displayed in the dialog box.
     *
     * @param [spec.okButton="OK"] {string} Text to be used in the no button.
     *
     * @param [spec.cancelButton="Cancel"] {string} Text to be used in the yes
     * button.
     *
     * @param [spec.onOk] {function} Function to execute when the OK button is
     * pressed. If not specified, the dialog box simply closes.
     *
     * @parma [spec.onCancel] {function} Function to execute when the Cancel
     * button is pressed. If not specified, the dialog box simply closes.
     */
    ns.ask = function(spec) {
        var dialog = new YAHOO.widget.SimpleDialog("dialog", {
            width: "20em",
            effect: {
                effect: YAHOO.widget.ContainerEffect.FADE,
                duration: 0.25
            },
            fixedcenter: true,
            modal: true,
            visible: false,
            draggable: false
        });

        var header = spec.header || "Notice";
        dialog.setHeader(header);
        dialog.setBody(spec.message || "Are you sure?");

        var handleOk = function() {
            try {
                this.hide();
                if ( spec.onOk) {
                    spec.onOk();
                }
            } catch ( error ) {
                Worldview.error("Internal error", error);
            }
        };
        var handleCancel = function() {
            try {
                this.hide();
                if ( spec.onCancel ) {
                    spec.onCancel();
                }
            } catch ( error ) {
                Worldview.error("Internal error", error);
            }
        };

        var buttons = [
            { text: spec.cancelButton || "Cancel", handler: handleCancel },
            { text: spec.okButton || "OK", handler: handleOk }
        ];
        dialog.cfg.queueProperty("buttons", buttons);
        dialog.render(document.body);
        dialog.show();
    };

    /**
     * Gets the number of properties in an object.
     *
     * @method size
     * @static
     *
     * @param size {object} Object to count the number of properties
     *
     * @return {integer} The number of properites where hasOwnPropery returns
     * true.
     */
    ns.size = function(object) {
        var size = 0;
        for ( key in object ) {
            if ( object.hasOwnProperty(key) ) {
                size++;
            }
        }
        return size;
    };

    /**
     * Returns the object specified by a string path.
     *
     * @method getObjectByPath
     * @static
     *
     * @param path {string} The path to the object, delimited by periods.
     *
     * @return {object} The object or undefined. Throws an exception
     * if any object leading up the leaf object is undefined.
     */
    ns.getObjectByPath = function(path) {
        var nodes = path.split(".");
        var parent = window;
        $.each(nodes, function(index, node) {
            if ( parent[node] === undefined ) {
                throw new Error("In " + path + ", " + node + " is undefined");
            }
            parent = parent[node];
        });
        return parent;
    };

    /**
     * Converts a query string into an object.
     *
     * @method queryStringToObject
     * @static
     *
     * @param queryString {string} The query string to convert
     *
     * @return An object where each property is one of the parameters found in
     * the query string.
     */
    ns.queryStringToObject = function(queryString) {
        if ( !queryString ) {
            return "";
        }
        if ( queryString[0] === "?" ) {
            queryString = queryString.substring(1);
        }
        var parameters = queryString.split("&");
        result = {};
        for ( var i = 0; i < parameters.length; i++ ) {
            var fields = parameters[i].split("=");
            result[fields[0]] = fields[1];
        }
        return result;
    };

    /**
     * Extracts the value of the given key from the querystring.
     *
     * @method extractFromQuery
     * @static
     *
     * @param key {string} Item to be extracted
     * @param qs {string} Query string to extract from
     *
     * @return {object} The value associated with the given key in the
     * querystring, or an empty string if not found.
     */
    ns.extractFromQuery = function(key, qs) {
        var regex = new RegExp("[\\?&#]*"+key+"=([^&#]*)");
        var val = regex.exec(qs);
        if(val == null)
            return "";
        else
            return val[1];
    };

    /**
     * Wrapper for handling AJAX errors when the XHR and status code is not
     * necessary.
     *
     * @method ajaxError
     * @static
     *
     * @param hanadler {function} Callback to be invoked on error that accepts
     * one argument, the error that was thrown.
     *
     * @return {function} The function wrapper.
     */
    ns.ajaxError = function(handler) {
        return function(jqXHR, textStatus, errorThrown) {
            handler(errorThrown);
        };
    };

    /**
     * Ensures a value is between an minimum and a maximum.
     *
     * @method clamp
     * @static
     *
     * @param min {number} Lower bound of the clamp range
     * @param max {number} Upper bound of the clamp range
     * @param value {number} The value to check.
     *
     * @return {number} min if the value is below min, max if the value is
     * above max, othewise returns value. Throws an exception if min is
     * greater than max.
     */
     ns.clamp = function(min, max, value) {
        if ( min > max ) {
            throw new Error("Invalid clamp range (" + min + " - " + max + ")");
        }
        if ( value < min ) { return min; }
        if ( value > max ) { return max; }
        return value;
    };

    /**
     * Clamps a value to a valid array index.
     *
     * @method clampIndex
     * @static
     *
     * @param array {Array} Clamp the index to this array
     * @param index {integer} Index value
     *
     * @return {number} Zero if the index is below zero, array.length - 1 if
     * the index is greater than the maximum array index, otherwise returns
     * index.
     */
    ns.clampIndex = function(array, index) {
        return ns.clamp(0, array.length - 1, index);
    };

    /**
     * Determines if the values of an array are equal to those of another
     * array. This was copied from Stack Overflow.
     *
     * @method arrayEquals
     * @static
     *
     * @param {Object} arr1 Array to compare
     * @param {Object} arr2 Array to compare
     *
     * @return {boolean} true if arr1 and arr2 have the same length, and all
     * values in arr1 are equal to those in arr2, otherwise returns false.
     */
    ns.arrayEquals = function(arr1, arr2) {
        return $(arr1).not(arr2).length == 0 && $(arr2).not(arr1).length == 0;
    };

    ns.id = function(value) {
        return value.replace(/:/g,"colon");
    };

})(window.Worldview = window.Worldview || {});


