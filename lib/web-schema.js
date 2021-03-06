
(function () {
    var global = typeof(window) === "undefined" ? exports : window
    ,   _
    ;
    
    if (typeof(window) === "undefined") {
        try {
            _ = require("underscore");
        }
        catch (e) {
            // this to work in CouchDB, assuming underscore is stored under "lib"
            // on the design document, as is the typical convention.
            _ = require("lib/underscore");
        }
    }
    else {
        _ = window._;
    }
    
    function WebSchema () {}
    WebSchema.prototype = {
        pushPath:   function (path) { this.path.push(path); }
    ,   popPath:    function () { this.path.pop(); }
    ,   curPath:    function () { return this.path.join(""); }
    ,   validate:   function (obj, schema) {
            var errors = [];
            this.path = ["$root"];
            return this.dispatchValidation(obj, schema, errors) ? { ok: true,  errors: [],     path: this.curPath() } :
                                                                  { ok: false, errors: errors, path: this.curPath() };
        }
    ,   dispatchValidation:   function (obj, schema, errors) {
            var type = schema.type;
            if (!type) return this.validateAny(obj, schema, errors);
            else if (_.isArray(type)) return this.validateUnionType(obj, schema, errors);
            else {
                type = "validate" + type.replace(/^./, function (c) { return c.toUpperCase(); })
                                        .replace(/-(.)/g, function (all, c) { return c.toUpperCase(); });
                if (!this[type]) return this.schemaError("Unknown type " + type);
                return this[type].call(this, obj, schema, errors);
            }
        }
    ,   validateObject: function (obj, schema, errors) {
            if (Object.prototype.toString.call(obj) !== "[object Object]") {
                errors.push("Object is not an object.");
                return false;
            }
            if (schema.properties) {
                for (var prop in schema.properties) {
                    var subSchema = schema.properties[prop];
                    if (subSchema.required && obj[prop] === undefined) {
                        this.pushPath("." + prop);
                        errors.push("Object is missing required property: " + prop);
                        return false;
                    }
                    if (!subSchema.required && obj[prop] === undefined) continue;
                    this.pushPath("." + prop);
                    if (!this.dispatchValidation(obj[prop], subSchema, errors)) return false;
                    this.popPath();
                }
            }
            return true;
        }
    ,   validateArray: function (obj, schema, errors) {
            if (!_.isArray(obj)) {
                errors.push("Object is not an array.");
                return false;
            }
            if (schema.items) {
                if (_.isArray(schema.items)) {
                    var additional = schema.additionalItems || false;
                    if (!additional && obj.length > schema.items.length) {
                        errors.push("Array contains too many elements.");
                        return false;
                    }
                    for (var i = 0, n = schema.items.length; i < n; i++) {
                        this.pushPath("[" + i + "]");
                        if (!this.dispatchValidation(obj[i], schema.items[i], errors)) return false;
                        this.popPath();
                    }
                }
                else {
                    for (var i = 0, n = obj.length; i < n; i++) {
                        this.pushPath("[" + i + "]");
                        if (!this.dispatchValidation(obj[i], schema.items, errors)) return false;
                        this.popPath();
                    }
                }
            }
            if (schema.minItems && obj.length < schema.minItems) {
                errors.push("Array is too small.");
                return false;
            }
            if (schema.maxItems !== undefined && obj.length > schema.maxItems) {
                errors.push("Array is too big.");
                return false;
            }
            if (schema.uniqueItems && obj.length != _.uniq(obj).length) {
                errors.push("Array contains duplicate items.");
                return false;
            }
            return true;
        }
    ,   validateString: function (obj, schema, errors) {
            if (!this.checkEnum(obj, schema)) {
                errors.push("Object not in enumeration, must be one of: " + schema["enum"].join(", "));
                return false;
            }
            if (!_.isString(obj)) {
                errors.push("Object is not a string.");
                return false;
            }
            if (schema.pattern) {
                var rex = new RegExp(schema.pattern);
                if (!rex.test(obj)) {
                    errors.push("String does not match pattern: " + schema.pattern);
                    return false;
                }
            }
            if (schema.minLength && obj.length < schema.minLength) {
                errors.push("String shorter than " + schema.minLength);
                return false;
            }
            if (schema.maxLength !== undefined && obj.length > schema.maxLength) {
                errors.push("String longer than " + schema.maxLength);
                return false;
            }
            return true;
        }
    ,   validateText:   function (obj, schema, errors) {
            return this.validateString(obj, schema, errors);
        }
    ,   validateDatetimeLocal:   function (obj, schema, errors) {
            if (!_.isString(obj)) {
                errors.push("Object is not a datetime string.");
                return false;
            }
            var match = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::(\d\d)(?:\.(\d{1,3}))?)?$/.exec(obj);
            if (!match) {
                errors.push("Object does not match the datetime pattern.");
                return false;
            }
            else {
                var year        = +match[1]
                ,   month       = +match[2]
                ,   day         = +match[3]
                ,   hours       = +match[4]
                ,   minutes     = +match[5]
                ,   seconds     = +match[6] || 0
                // ,   fragments   = +match[7] || 0
                ;
                // we can add more checks (days of month notably)
                this.checkYear(year, errors);
                this.checkMonth(month, errors);
                this.checkDay(day, errors);
                this.checkHours(hours, errors);
                this.checkMinutes(minutes, errors);
                this.checkSeconds(seconds, errors);
                if (errors.length) return false;
            }
            // we could add constraints here too, e.g min and max
            return true;
        }
    ,   validateDate:   function (obj, schema, errors) {
            if (!_.isString(obj)) {
                errors.push("Object is not a date string.");
                return false;
            }
            var match = /^(\d{4})-(\d\d)-(\d\d)$/.exec(obj);
            if (!match) {
                errors.push("Object does not match the date pattern.");
                return false;
            }
            else {
                var year        = +match[1]
                ,   month       = +match[2]
                ,   day         = +match[3]
                ;
                // we can add more checks (days of month notably)
                this.checkYear(year, errors);
                this.checkMonth(month, errors);
                this.checkDay(day, errors);
                if (errors.length) return false;
            }
            // we could add constraints here too, e.g min and max
            return true;
        }
    ,   validateTime:   function (obj, schema, errors) {
            if (!_.isString(obj)) {
                errors.push("Object is not a time string.");
                return false;
            }
            var match = /^(\d\d):(\d\d)(?::(\d\d)(?:\.(\d{1,3}))?)?$/.exec(obj);
            if (!match) {
                errors.push("Object does not match the time pattern.");
                return false;
            }
            else {
                var hours       = +match[1]
                ,   minutes     = +match[2]
                ,   seconds     = +match[3] || 0
                // ,   fragments   = +match[7] || 0
                ;
                this.checkHours(hours, errors);
                this.checkMinutes(minutes, errors);
                this.checkSeconds(seconds, errors);
                if (errors.length) return false;
            }
            // we could add constraints here too, e.g min and max
            return true;
        }
    ,   checkYear:  function (year, errors) {
            if (year < 1) errors.push("Year out of range.");
        }
    ,   checkMonth:  function (month, errors) {
            if (month < 1 || month > 12) errors.push("Month out of range.");
        }
    ,   checkDay:  function (day, errors) {
            if (day < 1 || day > 31) errors.push("Day out of range.");
        }
    ,   checkHours:  function (hours, errors) {
            if (hours < 0 || hours > 23) errors.push("Hours out of range.");
        }
    ,   checkMinutes:  function (minutes, errors) {
            if (minutes < 0 || minutes > 59) errors.push("Minutes out of range.");
        }
    ,   checkSeconds:  function (seconds, errors) {
            if (seconds < 0 || seconds > 59) errors.push("Seconds out of range.");
        }
    ,   validateNumber: function (obj, schema, errors) {
            if (!this.checkEnum(obj, schema)) {
                errors.push("Object not in enumeration, must be one of: " + schema["enum"].join(", "));
                return false;
            }
            if (!_.isNumber(obj) || _.isNaN(obj)) {
                errors.push("Object is not a number.");
                return false;
            }
            var exclMin = schema.exclusiveMinimum || false
            ,   exclMax = schema.exclusiveMaximum || false
            ;
            if (schema.minimum !== undefined) {
                if (exclMin) {
                    if (obj <= schema.minimum) {
                        errors.push("Number is not strictly greater than " + schema.minimum);
                        return false;
                    }
                }
                else {
                    if (obj < schema.minimum) {
                        errors.push("Number is not greater than " + schema.minimum);
                        return false;
                    }
                }
            }
            if (schema.maximum !== undefined) {
                if (exclMax) {
                    if (obj >= schema.maximum) {
                        errors.push("Number is not strictly smaller than " + schema.maximum);
                        return false;
                    }
                }
                else {
                    if (obj > schema.maximum) {
                        errors.push("Number is not smaller than " + schema.maximum);
                        return false;
                    }
                }
            }
            return true;
        }
    ,   validateBoolean: function (obj, schema, errors) {
            if (!this.checkEnum(obj, schema)) {
                errors.push("Object not in enumeration, must be one of: " + schema["enum"].join(", "));
                return false;
            }
            if (_.isBoolean(obj)) return true;
            errors.push("Object is not a boolean.");
            return false;
        }
    ,   validateNull: function (obj, schema, errors) {
            if (obj === null) return true;
            errors.push("Object is not null.");
            return false;
        }
    ,   validateAny: function () {
            return true;
        }
    ,   validateUnionType: function (obj, schema, errors) {
            var allSubErrors = [];
            for (var i = 0, n = schema.type.length; i < n; i++) {
                var type = schema.type[i]
                ,   subErrors = []
                ;
                if (_.isString(type)) type = { type: type };
                // console.log(obj, schema, type);
                this.dispatchValidation(obj, type, subErrors);
                // console.log(subErrors);
                if (subErrors.length === 0) return true;
                allSubErrors = allSubErrors.concat(subErrors);
            }
            errors.push("Object matches no type in union.");
            for (var i = 0, n = allSubErrors.length; i < n; i++) errors.push(allSubErrors[i]);
            return false;
        }
    ,   checkEnum:  function (obj, schema) {
            if (schema["enum"]) {
                for (var i = 0, n = schema["enum"].length; i < n; i++) if (schema["enum"][i] === obj) return true;
                return false;
            }
            return true;
        }
    ,   schemaError:    function (msg) {
            throw new Error(msg);
        }
    };
    global.WebSchema = WebSchema;
}());
