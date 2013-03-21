
var WebSchema = typeof(WebSchema) === "undefined" ? require("..").WebSchema : WebSchema
,   expect = typeof(expect) === "undefined" ? require("expect.js") : expect
;

describe("Typing", function () {
    var ct = new WebSchema();
    describe("#validateNull", function () {
        var schema = { type: "null" };
        it("should accept null", function () {
            expect(ct.validate(null, schema).ok).to.be.ok;
        });
        it("should reject non-null", function () {
            expect(ct.validate(undefined, schema).ok).to.not.be.ok;
            expect(ct.validate(0, schema).ok).to.not.be.ok;
            expect(ct.validate("", schema).ok).to.not.be.ok;
            expect(ct.validate(false, schema).ok).to.not.be.ok;
            expect(ct.validate("zorglub", schema).ok).to.not.be.ok;
        });
        it("should flag error correctly", function () {
            expect(ct.validate("zorglub", schema).errors.length).to.equal(1);
            expect(ct.validate("zorglub", schema).errors[0]).to.equal("Object is not null.");
            expect(ct.validate("zorglub", schema).path).to.equal("$root");
        });
    });

    describe("#validateAny", function () {
        var schema = { type: "any" }
        ,   run = function (schema) {
                expect(ct.validate(null, schema).ok).to.be.ok;
                expect(ct.validate(undefined, schema).ok).to.be.ok;
                expect(ct.validate(0, schema).ok).to.be.ok;
                expect(ct.validate("", schema).ok).to.be.ok;
                expect(ct.validate(false, schema).ok).to.be.ok;
                expect(ct.validate("zorglub", schema).ok).to.be.ok;
                expect(ct.validate({ foo: "bar" }, schema).ok).to.be.ok;
                expect(ct.validate([1, 2, 3], schema).ok).to.be.ok;
            }
        ;
        it("should check accept anything for any", function () {
            run(schema);
        });
        it("should default to any", function () {
            run({});
        });
    });

    describe("#validateBoolean", function () {
        var schema = { type: "boolean" };
        it("should accept booleans", function () {
            expect(ct.validate(true, schema).ok).to.be.ok;
            expect(ct.validate(false, schema).ok).to.be.ok;
        });
        it("should reject non-booleans", function () {
            expect(ct.validate(0, schema).ok).to.not.be.ok;
            expect(ct.validate(1, schema).ok).to.not.be.ok;
            expect(ct.validate("", schema).ok).to.not.be.ok;
            expect(ct.validate("true", schema).ok).to.not.be.ok;
            expect(ct.validate(null, schema).ok).to.not.be.ok;
            expect(ct.validate(undefined, schema).ok).to.not.be.ok;
        });
        it("should report errors correctly", function () {
            expect(ct.validate("zorglub", schema).errors.length).to.equal(1);
            expect(ct.validate("zorglub", schema).errors[0]).to.equal("Object is not a boolean.");
            expect(ct.validate("zorglub", schema).path).to.equal("$root");
        });
        it("should handle enums", function () {
            schema["enum"] = [true, false];
            expect(ct.validate(true, schema).ok).to.be.ok;
            expect(ct.validate(false, schema).ok).to.be.ok;
            schema["enum"] = [false];
            expect(ct.validate(false, schema).ok).to.be.ok;
            expect(ct.validate(true, schema).ok).to.not.be.ok;
            expect(ct.validate("zorglub", schema).errors.length).to.equal(1);
            expect(ct.validate("zorglub", schema).errors[0]).to.equal("Object not in enumeration, must be one of: false");
            expect(ct.validate("zorglub", schema).path).to.equal("$root");
        });
    });

    function textualTester (type) {
        return function () {
            var schema = { type: type };
            it("should accept " + type + "s", function () {
                expect(ct.validate("", schema).ok).to.be.ok;
                expect(ct.validate("false", schema).ok).to.be.ok;
            });
            it("should reject non-" + type + "s", function () {
                expect(ct.validate(0, schema).ok).to.not.be.ok;
                expect(ct.validate(1, schema).ok).to.not.be.ok;
                expect(ct.validate(true, schema).ok).to.not.be.ok;
                expect(ct.validate(null, schema).ok).to.not.be.ok;
                expect(ct.validate(undefined, schema).ok).to.not.be.ok;
            });
            it("should report errors correctly", function () {
                expect(ct.validate(42, schema).errors.length).to.equal(1);
                expect(ct.validate(42, schema).errors[0]).to.equal("Object is not a string.");
                expect(ct.validate(42, schema).path).to.equal("$root");
            });
            it("should handle enums", function () {
                schema["enum"] = ["aaa", "bbb"];
                expect(ct.validate("aaa", schema).ok).to.be.ok;
                expect(ct.validate("bbb", schema).ok).to.be.ok;
                expect(ct.validate("zorglub", schema).ok).to.not.be.ok;
                expect(ct.validate("zorglub", schema).errors.length).to.equal(1);
                expect(ct.validate("zorglub", schema).errors[0]).to.equal("Object not in enumeration, must be one of: aaa, bbb");
                expect(ct.validate("zorglub", schema).path).to.equal("$root");
                delete schema["enum"];
            });
            it("should handle patterns", function () {
                schema.pattern = "a{3}\\d\\d";
                expect(ct.validate("aaa42", schema).ok).to.be.ok;
                expect(ct.validate("aaa17", schema).ok).to.be.ok;
                expect(ct.validate("-jhljaaa17jkh yt", schema).ok).to.be.ok;
                expect(ct.validate("zorglub", schema).ok).to.not.be.ok;
                expect(ct.validate("zorglub", schema).errors.length).to.equal(1);
                expect(ct.validate("zorglub", schema).errors[0]).to.equal("String does not match pattern: a{3}\\d\\d");
                expect(ct.validate("zorglub", schema).path).to.equal("$root");
                delete schema.pattern;
            });
            it("should handle minLength and maxLength", function () {
                schema.minLength = 2;
                schema.maxLength = 5;
                expect(ct.validate("aa", schema).ok).to.be.ok;
                expect(ct.validate("aaa", schema).ok).to.be.ok;
                expect(ct.validate("aaaaa", schema).ok).to.be.ok;
                expect(ct.validate("z", schema).ok).to.not.be.ok;
                expect(ct.validate("z", schema).errors.length).to.equal(1);
                expect(ct.validate("z", schema).errors[0]).to.equal("String shorter than 2");
                expect(ct.validate("z", schema).path).to.equal("$root");
                expect(ct.validate("zorglub", schema).ok).to.not.be.ok;
                expect(ct.validate("zorglub", schema).errors.length).to.equal(1);
                expect(ct.validate("zorglub", schema).errors[0]).to.equal("String longer than 5");
                expect(ct.validate("zorglub", schema).path).to.equal("$root");
                delete schema.minLength;
                delete schema.maxLength;
            });
        };
    }

    describe("#validateString", textualTester("string"));
    describe("#validateText", textualTester("text"));

    describe("#validateNumber", function () {
        var schema = { type: "number" };
        it("should accept numbers", function () {
            expect(ct.validate(4, schema).ok).to.be.ok;
            expect(ct.validate(98798.987986, schema).ok).to.be.ok;
            expect(ct.validate(Infinity, schema).ok).to.be.ok;
            expect(ct.validate(0, schema).ok).to.be.ok;
        });
        it("should reject non-numbers", function () {
            expect(ct.validate("0", schema).ok).to.not.be.ok;
            expect(ct.validate("1.876", schema).ok).to.not.be.ok;
            expect(ct.validate(true, schema).ok).to.not.be.ok;
            expect(ct.validate([], schema).ok).to.not.be.ok;
            expect(ct.validate(null, schema).ok).to.not.be.ok;
            expect(ct.validate(undefined, schema).ok).to.not.be.ok;
        });
        it("should report errors correctly", function () {
            expect(ct.validate("42", schema).errors.length).to.equal(1);
            expect(ct.validate("42", schema).errors[0]).to.equal("Object is not a number.");
            expect(ct.validate("42", schema).path).to.equal("$root");
            expect(ct.validate(NaN, schema).errors.length).to.equal(1);
            expect(ct.validate(NaN, schema).errors[0]).to.equal("Object is not a number.");
            expect(ct.validate(NaN, schema).path).to.equal("$root");
        });
        it("should handle enums", function () {
            schema["enum"] = [1, 2, 3];
            expect(ct.validate(1, schema).ok).to.be.ok;
            expect(ct.validate(3, schema).ok).to.be.ok;
            expect(ct.validate(4, schema).ok).to.not.be.ok;
            expect(ct.validate(4, schema).errors.length).to.equal(1);
            expect(ct.validate(4, schema).errors[0]).to.equal("Object not in enumeration, must be one of: 1, 2, 3");
            expect(ct.validate(4, schema).path).to.equal("$root");
            delete schema["enum"];
        });
        it("should handle minimum, maximum, and exclusive*", function () {
            schema.minimum = 2;
            schema.maximum = 5;
            expect(ct.validate(2, schema).ok).to.be.ok;
            expect(ct.validate(3, schema).ok).to.be.ok;
            expect(ct.validate(5, schema).ok).to.be.ok;
            expect(ct.validate(1, schema).ok).to.not.be.ok;
            expect(ct.validate(1, schema).errors.length).to.equal(1);
            expect(ct.validate(1, schema).errors[0]).to.equal("Number is not greater than 2");
            expect(ct.validate(1, schema).path).to.equal("$root");
            expect(ct.validate(-1, schema).ok).to.not.be.ok;
            expect(ct.validate(-1, schema).errors.length).to.equal(1);
            expect(ct.validate(-1, schema).errors[0]).to.equal("Number is not greater than 2");
            expect(ct.validate(-1, schema).path).to.equal("$root");
            expect(ct.validate(7, schema).ok).to.not.be.ok;
            expect(ct.validate(7, schema).errors.length).to.equal(1);
            expect(ct.validate(7, schema).errors[0]).to.equal("Number is not smaller than 5");
            expect(ct.validate(7, schema).path).to.equal("$root");
            schema.exclusiveMinimum = true;
            schema.exclusiveMaximum = true;
            expect(ct.validate(3, schema).ok).to.be.ok;
            expect(ct.validate(2, schema).ok).to.not.be.ok;
            expect(ct.validate(2, schema).errors.length).to.equal(1);
            expect(ct.validate(2, schema).errors[0]).to.equal("Number is not strictly greater than 2");
            expect(ct.validate(2, schema).path).to.equal("$root");
            expect(ct.validate(5, schema).ok).to.not.be.ok;
            expect(ct.validate(5, schema).errors.length).to.equal(1);
            expect(ct.validate(5, schema).errors[0]).to.equal("Number is not strictly smaller than 5");
            expect(ct.validate(5, schema).path).to.equal("$root");
            delete schema.minimum;
            delete schema.maximum;
            delete schema.exclusiveMinimum;
            delete schema.exclusiveMaximum;
        });
    });

    describe("#validateObject", function () {
        var schema = { type: "object" }
        ,   O = Object;
        it("should accept objects", function () {
            expect(ct.validate({}, schema).ok).to.be.ok;
            expect(ct.validate({ foo: "bar" }, schema).ok).to.be.ok;
            expect(ct.validate(new O(), schema).ok).to.be.ok;
        });
        it("should reject non-objects", function () {
            expect(ct.validate("0", schema).ok).to.not.be.ok;
            expect(ct.validate(0, schema).ok).to.not.be.ok;
            expect(ct.validate(true, schema).ok).to.not.be.ok;
            expect(ct.validate([], schema).ok).to.not.be.ok;
            expect(ct.validate(function () {}, schema).ok).to.not.be.ok;
            expect(ct.validate(null, schema).ok).to.not.be.ok;
            expect(ct.validate(undefined, schema).ok).to.not.be.ok;
        });
        it("should report errors correctly", function () {
            expect(ct.validate("42", schema).errors.length).to.equal(1);
            expect(ct.validate("42", schema).errors[0]).to.equal("Object is not an object.");
            expect(ct.validate("42", schema).path).to.equal("$root");
        });
        var numProps = {
            rnum:   {
                type:       "number"
            ,   required:   true
            }
        ,   cnum:       {
                type:       "number"
            ,   minimum:    5
            }
        };
        it("should validate properties", function () {
            schema.properties = numProps;
            expect(ct.validate({ rnum: 10, cnum: 5 }, schema).ok).to.be.ok;
            expect(ct.validate({ rnum: 10 }, schema).ok).to.be.ok;
            delete schema.properties;
        });
        it("should enforce required properties", function () {
            schema.properties = numProps;
            expect(ct.validate({}, schema).ok).to.not.be.ok;
            expect(ct.validate({ cnum: 10 }, schema).ok).to.not.be.ok;
            expect(ct.validate({}, schema).errors.length).to.equal(1);
            expect(ct.validate({}, schema).errors[0]).to.equal("Object is missing required property: rnum");
            expect(ct.validate({}, schema).path).to.equal("$root.rnum");
            delete schema.properties;
        });
        it("should enforce property constraints", function () {
            schema.properties = numProps;
            var inst = { rnum: 10, cnum: 2 };
            expect(ct.validate(inst, schema).ok).to.not.be.ok;
            expect(ct.validate(inst, schema).errors.length).to.equal(1);
            expect(ct.validate(inst, schema).errors[0]).to.equal("Number is not greater than 5");
            expect(ct.validate(inst, schema).path).to.equal("$root.cnum");
            delete schema.properties;
        });
        it("should recurse deeply", function () {
            schema.properties = {
                rsub:   {
                    type:       "object"
                ,   required:   true
                ,   properties: {
                        rsub:   {
                            type:       "object"
                        ,   required:   true
                        ,   properties: {
                                rsub:   {
                                    type:       "object"
                                ,   required:   true
                                ,   properties: {
                                        rnum:   {
                                            type:       "number"
                                        ,   required:   true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };
            var inst = { rsub: { rsub: { rsub: { rnum: 5 }}}};
            expect(ct.validate(inst, schema).ok).to.be.ok;
            delete inst.rsub.rsub.rsub.rnum;
            expect(ct.validate(inst, schema).ok).to.not.be.ok;
            expect(ct.validate(inst, schema).errors.length).to.equal(1);
            expect(ct.validate(inst, schema).errors[0]).to.equal("Object is missing required property: rnum");
            expect(ct.validate(inst, schema).path).to.equal("$root.rsub.rsub.rsub.rnum");
            delete inst.rsub.rsub.rsub;
            expect(ct.validate(inst, schema).ok).to.not.be.ok;
            expect(ct.validate(inst, schema).errors.length).to.equal(1);
            expect(ct.validate(inst, schema).errors[0]).to.equal("Object is missing required property: rsub");
            expect(ct.validate(inst, schema).path).to.equal("$root.rsub.rsub.rsub");
        });
    });

    describe("#validateArray", function () {
        var schema = { type: "array" }, A = Array;
        it("should accept arrays", function () {
            expect(ct.validate([], schema).ok).to.be.ok;
            expect(ct.validate([1, "2", true, {}], schema).ok).to.be.ok;
            expect(ct.validate(new A(), schema).ok).to.be.ok;
        });
        it("should reject non-arrays", function () {
            expect(ct.validate("0", schema).ok).to.not.be.ok;
            expect(ct.validate(0, schema).ok).to.not.be.ok;
            expect(ct.validate(true, schema).ok).to.not.be.ok;
            expect(ct.validate({}, schema).ok).to.not.be.ok;
            expect(ct.validate(function () {}, schema).ok).to.not.be.ok;
            expect(ct.validate(null, schema).ok).to.not.be.ok;
            expect(ct.validate(undefined, schema).ok).to.not.be.ok;
        });
        it("should report errors correctly", function () {
            expect(ct.validate("42", schema).errors.length).to.equal(1);
            expect(ct.validate("42", schema).errors[0]).to.equal("Object is not an array.");
            expect(ct.validate("42", schema).path).to.equal("$root");
        });
        it("should constrain size with minItems and maxItems", function () {
            schema.minItems = 2;
            schema.maxItems = 5;
            expect(ct.validate([1, 2], schema).ok).to.be.ok;
            expect(ct.validate([1, 2, 3], schema).ok).to.be.ok;
            expect(ct.validate([1, 2, 3, 4, 5], schema).ok).to.be.ok;
            expect(ct.validate([1, 2, 3, 4, 5, 6], schema).ok).to.not.be.ok;
            expect(ct.validate([1, 2, 3, 4, 5, 6], schema).errors.length).to.equal(1);
            expect(ct.validate([1, 2, 3, 4, 5, 6], schema).errors[0]).to.equal("Array is too big.");
            expect(ct.validate([1, 2, 3, 4, 5, 6], schema).path).to.equal("$root");
            expect(ct.validate([1], schema).ok).to.not.be.ok;
            expect(ct.validate([1], schema).errors.length).to.equal(1);
            expect(ct.validate([1], schema).errors[0]).to.equal("Array is too small.");
            expect(ct.validate([1], schema).path).to.equal("$root");
            expect(ct.validate([], schema).ok).to.not.be.ok;
            expect(ct.validate([], schema).errors.length).to.equal(1);
            expect(ct.validate([], schema).errors[0]).to.equal("Array is too small.");
            expect(ct.validate([], schema).path).to.equal("$root");
            delete schema.minItems;
            delete schema.maxItems;
        });
        it("should validate items", function () {
            schema.items = { type: "number" };
            expect(ct.validate([1, 2, 3], schema).ok).to.be.ok;
            expect(ct.validate([], schema).ok).to.be.ok;
            expect(ct.validate(["1"], schema).ok).to.not.be.ok;
            expect(ct.validate(["1"], schema).errors.length).to.equal(1);
            expect(ct.validate(["1"], schema).errors[0]).to.equal("Object is not a number.");
            expect(ct.validate(["1"], schema).path).to.equal("$root[0]");
            expect(ct.validate([1, 2, "1"], schema).ok).to.not.be.ok;
            expect(ct.validate([1, 2, "1"], schema).errors.length).to.equal(1);
            expect(ct.validate([1, 2, "1"], schema).errors[0]).to.equal("Object is not a number.");
            expect(ct.validate([1, 2, "1"], schema).path).to.equal("$root[2]");
            delete schema.items;
        });
        it("should enforce unique items", function () {
            schema.items = { type: "number" };
            schema.uniqueItems = true;
            expect(ct.validate([1, 2, 3], schema).ok).to.be.ok;
            expect(ct.validate([], schema).ok).to.be.ok;
            expect(ct.validate([3, 3], schema).ok).to.not.be.ok;
            expect(ct.validate([3, 3], schema).errors.length).to.equal(1);
            expect(ct.validate([3, 3], schema).errors[0]).to.equal("Array contains duplicate items.");
            expect(ct.validate([3, 3], schema).path).to.equal("$root");
            delete schema.items;
            delete schema.uniqueItems;
        });
        it("should validate arrays of schemata", function () {
            schema.items = [{ type: "number" }, { type: "string" }, { type: "boolean" }];
            expect(ct.validate([4, "ok", false], schema).ok).to.be.ok;
            expect(ct.validate([4, "ok", "false"], schema).ok).to.not.be.ok;
            expect(ct.validate([4, "ok", "false"], schema).errors.length).to.equal(1);
            expect(ct.validate([4, "ok", "false"], schema).errors[0]).to.equal("Object is not a boolean.");
            expect(ct.validate([4, "ok", "false"], schema).path).to.equal("$root[2]");
            expect(ct.validate([4, "ok", false, 5], schema).ok).to.not.be.ok;
            expect(ct.validate([4, "ok", false, 5], schema).errors.length).to.equal(1);
            expect(ct.validate([4, "ok", false, 5], schema).errors[0]).to.equal("Array contains too many elements.");
            expect(ct.validate([4, "ok", false, 5], schema).path).to.equal("$root");
            schema.additionalItems = true;
            expect(ct.validate([4, "ok", false, 5], schema).ok).to.be.ok;
            delete schema.items;
            delete schema.additionalItems;
        });
        it("should recurse deeply", function () {
            schema.items = [{
                    type:   "array"
                ,   items:  [{
                        type:   "array"
                    ,   items:  [{
                            type:   "array"
                        ,   items:  [{
                                type:   "number"
                            }]
                        }]
                    }]
            }];
            var inst = [[[[5]]]];
            expect(ct.validate(inst, schema).ok).to.be.ok;
            inst[0][0][0].pop();
            expect(ct.validate(inst, schema).ok).to.not.be.ok;
            expect(ct.validate(inst, schema).errors.length).to.equal(1);
            expect(ct.validate(inst, schema).errors[0]).to.equal("Object is not a number.");
            expect(ct.validate(inst, schema).path).to.equal("$root[0][0][0][0]");
            inst[0][0].pop();
            expect(ct.validate(inst, schema).ok).to.not.be.ok;
            expect(ct.validate(inst, schema).errors.length).to.equal(1);
            expect(ct.validate(inst, schema).errors[0]).to.equal("Object is not an array.");
            expect(ct.validate(inst, schema).path).to.equal("$root[0][0][0]");
        });
    });
    
    describe("#validateUnionType", function () {
        var schema = { type: ["number", { type: "string" }] };
        it("should accept numbers and strings", function () {
            expect(ct.validate(1, schema).ok).to.be.ok;
            expect(ct.validate("foo", schema).ok).to.be.ok;
        });
        it("should reject other things", function () {
            expect(ct.validate([], schema).ok).to.not.be.ok;
            expect(ct.validate(true, schema).ok).to.not.be.ok;
            expect(ct.validate({}, schema).ok).to.not.be.ok;
            expect(ct.validate(function () {}, schema).ok).to.not.be.ok;
            expect(ct.validate(null, schema).ok).to.not.be.ok;
            expect(ct.validate(undefined, schema).ok).to.not.be.ok;
        });
        it("should report errors correctly", function () {
            expect(ct.validate(true, schema).errors.length).to.equal(3);
            expect(ct.validate(true, schema).errors[0]).to.equal("Object matches no type in union.");
            expect(ct.validate(true, schema).errors[1]).to.equal("Object is not a number.");
            expect(ct.validate(true, schema).errors[2]).to.equal("Object is not a string.");
            expect(ct.validate(true, schema).path).to.equal("$root");
        });
    });

    describe("#validateDatetimeLocal", function () {
        var schema = { type: "datetime-local" };
        it("should accept datetimes", function () {
            expect(ct.validate("2013-03-21T21:21:42.123", schema).ok).to.be.ok;
            expect(ct.validate("2013-03-21T21:21:42.12", schema).ok).to.be.ok;
            expect(ct.validate("2013-03-21T21:21:42.1", schema).ok).to.be.ok;
            expect(ct.validate("2013-03-21T21:21:42", schema).ok).to.be.ok;
            expect(ct.validate("2013-03-21T21:21", schema).ok).to.be.ok;
        });
        it("should reject non-datetimes", function () {
            expect(ct.validate("2013-03-21T21:21:42.1235", schema).ok).to.not.be.ok;
            expect(ct.validate("2013-03-21T21:21:42.", schema).ok).to.not.be.ok;
            expect(ct.validate("0000-03-21T21:21", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-00-21T21:21", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-13-21T21:21", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-12-00T21:21", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-12-32T21:21", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-12-31T24:21", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-12-31T23:60", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-12-31T23:59:60", schema).ok).to.not.be.ok;
            expect(ct.validate(42, schema).ok).to.not.be.ok;
            expect(ct.validate(true, schema).ok).to.not.be.ok;
            expect(ct.validate([], schema).ok).to.not.be.ok;
            expect(ct.validate(null, schema).ok).to.not.be.ok;
            expect(ct.validate(undefined, schema).ok).to.not.be.ok;
        });
        it("should report errors correctly", function () {
            expect(ct.validate(42, schema).errors.length).to.equal(1);
            expect(ct.validate(42, schema).errors[0]).to.equal("Object is not a datetime string.");
            expect(ct.validate(42, schema).path).to.equal("$root");
            var bad = {
                "2013-03-21T21:21:42.1235": "Object does not match the datetime pattern."
            ,   "0000-03-21T21:21":         "Year out of range."
            ,   "1977-00-21T21:21":         "Month out of range."
            ,   "1977-13-21T21:21":         "Month out of range."
            ,   "1977-12-00T21:21":         "Day out of range."
            ,   "1977-12-32T21:21":         "Day out of range."
            ,   "1977-12-31T24:21":         "Hours out of range."
            ,   "1977-12-31T23:60":         "Minutes out of range."
            ,   "1977-12-31T23:59:60":      "Seconds out of range."
            };
            for (var k in bad) {
                expect(ct.validate(k, schema).errors.length).to.equal(1);
                expect(ct.validate(k, schema).errors[0]).to.equal(bad[k]);
                expect(ct.validate(k, schema).path).to.equal("$root");
            }
            expect(ct.validate("0000-13-47T62:77:99.217", schema).errors.length).to.equal(6);
            expect(ct.validate("0000-13-47T62:77:99.217", schema).errors[0]).to.equal("Year out of range.");
            expect(ct.validate("0000-13-47T62:77:99.217", schema).errors[1]).to.equal("Month out of range.");
            expect(ct.validate("0000-13-47T62:77:99.217", schema).errors[2]).to.equal("Day out of range.");
            expect(ct.validate("0000-13-47T62:77:99.217", schema).errors[3]).to.equal("Hours out of range.");
            expect(ct.validate("0000-13-47T62:77:99.217", schema).errors[4]).to.equal("Minutes out of range.");
            expect(ct.validate("0000-13-47T62:77:99.217", schema).errors[5]).to.equal("Seconds out of range.");
            expect(ct.validate("0000-13-47T62:77:99.217", schema).path).to.equal("$root");
        });
    });

    describe("#validateDate", function () {
        var schema = { type: "date" };
        it("should accept dates", function () {
            expect(ct.validate("2013-03-21", schema).ok).to.be.ok;
        });
        it("should reject non-dates", function () {
            expect(ct.validate("zorglub", schema).ok).to.not.be.ok;
            expect(ct.validate("0000-03-21", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-00-21", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-13-21", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-12-00", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-12-32", schema).ok).to.not.be.ok;
            expect(ct.validate(42, schema).ok).to.not.be.ok;
            expect(ct.validate(true, schema).ok).to.not.be.ok;
            expect(ct.validate([], schema).ok).to.not.be.ok;
            expect(ct.validate(null, schema).ok).to.not.be.ok;
            expect(ct.validate(undefined, schema).ok).to.not.be.ok;
        });
        it("should report errors correctly", function () {
            expect(ct.validate(42, schema).errors.length).to.equal(1);
            expect(ct.validate(42, schema).errors[0]).to.equal("Object is not a date string.");
            expect(ct.validate(42, schema).path).to.equal("$root");
            var bad = {
                "zorglub":      "Object does not match the date pattern."
            ,   "0000-03-21":   "Year out of range."
            ,   "1977-00-21":   "Month out of range."
            ,   "1977-13-21":   "Month out of range."
            ,   "1977-12-00":   "Day out of range."
            ,   "1977-12-32":   "Day out of range."
            };
            for (var k in bad) {
                expect(ct.validate(k, schema).errors.length).to.equal(1);
                expect(ct.validate(k, schema).errors[0]).to.equal(bad[k]);
                expect(ct.validate(k, schema).path).to.equal("$root");
            }
            expect(ct.validate("0000-13-47", schema).errors.length).to.equal(3);
            expect(ct.validate("0000-13-47", schema).errors[0]).to.equal("Year out of range.");
            expect(ct.validate("0000-13-47", schema).errors[1]).to.equal("Month out of range.");
            expect(ct.validate("0000-13-47", schema).errors[2]).to.equal("Day out of range.");
            expect(ct.validate("0000-13-47", schema).path).to.equal("$root");
        });
    });

    describe("#validateTime", function () {
        var schema = { type: "time" };
        it("should accept times", function () {
            expect(ct.validate("21:21:42.123", schema).ok).to.be.ok;
            expect(ct.validate("21:21:42.12", schema).ok).to.be.ok;
            expect(ct.validate("21:21:42.1", schema).ok).to.be.ok;
            expect(ct.validate("21:21:42", schema).ok).to.be.ok;
            expect(ct.validate("21:21", schema).ok).to.be.ok;
        });
        it("should reject non-times", function () {
            expect(ct.validate("21:21:42.1235", schema).ok).to.not.be.ok;
            expect(ct.validate("21:21:42.", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-12-31T24:21", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-12-31T23:60", schema).ok).to.not.be.ok;
            expect(ct.validate("1977-12-31T23:59:60", schema).ok).to.not.be.ok;
            expect(ct.validate(42, schema).ok).to.not.be.ok;
            expect(ct.validate(true, schema).ok).to.not.be.ok;
            expect(ct.validate([], schema).ok).to.not.be.ok;
            expect(ct.validate(null, schema).ok).to.not.be.ok;
            expect(ct.validate(undefined, schema).ok).to.not.be.ok;
        });
        it("should report errors correctly", function () {
            expect(ct.validate(42, schema).errors.length).to.equal(1);
            expect(ct.validate(42, schema).errors[0]).to.equal("Object is not a time string.");
            expect(ct.validate(42, schema).path).to.equal("$root");
            var bad = {
                "whevs":    "Object does not match the time pattern."
            ,   "24:21":    "Hours out of range."
            ,   "23:60":    "Minutes out of range."
            ,   "23:59:60": "Seconds out of range."
            };
            for (var k in bad) {
                expect(ct.validate(k, schema).errors.length).to.equal(1);
                expect(ct.validate(k, schema).errors[0]).to.equal(bad[k]);
                expect(ct.validate(k, schema).path).to.equal("$root");
            }
            expect(ct.validate("62:77:99.217", schema).errors.length).to.equal(3);
            expect(ct.validate("62:77:99.217", schema).errors[0]).to.equal("Hours out of range.");
            expect(ct.validate("62:77:99.217", schema).errors[1]).to.equal("Minutes out of range.");
            expect(ct.validate("62:77:99.217", schema).errors[2]).to.equal("Seconds out of range.");
            expect(ct.validate("62:77:99.217", schema).path).to.equal("$root");
        });
    });
});


