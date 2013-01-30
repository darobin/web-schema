
# Overview

`json-validation` is a small library that performs, shockingly enough, validation of
JSON documents. It supports a limited subset of JSON Schema.

# Installing

The usual simple:

    npm install json-validation

In order to run in a browser, you simply need to include the `json-validation.js` file,
after having included `underscore.js` on which it depends.

# Why not JSON Schema, one of the existing implementations?

The reason this library exists is because I initially needed JSON validation in a project.
I tried to use some of the JSON Schema implementations that exist, but most were out of
date. Those that weren't tended to break in the contexts in which I was using them, and
were generally rather larger and more complex than my needs. It turned out to be simpler
to just write a validator that matches my needs.

I release this library on the assumption that if I needed it, others might too. I may
add support for more of JSON Schema, and I will certainly take pull requests (so long as
they don't cause excessive bloat).

One notable difference is that JSON Schema support schema referencing one another. Doing
that is an explicit non-goal of this library. But it ought to be easy to implement JSON
referencing separately (in another small library) and feed schemata with references 
resolved into `json-validation`.

# API

The API is very simple, the following example probably tells you all you need to know:

```javascript
var jv = new JSONValidation();
var result = jv.validate(object, schema);
if (result.ok) {
    // victory \o/
}
else {
    console.log("JSON has the following errors: " + result.errors.join(", ") + " at path " + result.path);
}
```

#### var jv = new JSONValidation()

A simple constructor that takes no arguments.

#### var result = jv.validate(object, schema);

This takes an object that is parsed JSON (or any in-memory equivalent) and a schema that
corresponds to the subset of JSON Schema described in the following section. Note that 
`validate()` will throw if you schema is invalid.

The return value is an object with the following fields:

* `ok`: true if the JSON is valid, false otherwise.
* `errors`: a list of human-readable strings describing the errors that were encountered. In
  most cases `json-validation` will only return one single error as it does not currently try
  to keep processing the JSON when it finds a problem, but in some cases it can return several
  errors at once, and this is likely to increase going forward (though likely limited to finding
  several problems with just one item). If there were no errors this array is empty.
* `path`: a string indicating the path in the object at which the errors were found. It looks like
  `$root.field1.field2[5]`. The idea is that if you replace `$root` with the object you passed you
  will get to the problematic value (this is intended for human debugging though).

# Supported schema constructs

A schema is basically a nested structure of objects that describe the constraints on a JSON
instance at that nesting level. Each of these objects is keyed off a specific fundamental 
`type`, and the constraints that can be applied to the value depend on that fundamental type.

### null

The object is `null`.

Example schema:

    { "type": "null" }

No additional constraints.

### any

Absolutely anything goes here.

Example schema:

    { "type": "any" }

No additional constraints.

### boolean

The object is a boolean value (true or false). Note that this is strictly for booleans,
and not for values that are truthy or falsy.

Example schema:

    { "type": "boolean" }

Other example:    

    {
        "type": "boolean"
    ,   "enum": [true]
    }

Additional constraints:

* `enum`: The object must match one of the values in the `enum` array. Since the boolean
  type only takes two values this constraint is only ever useful if you wish to restrict
  a value to either always being true or always being false (as in the second example above).

### string

The object is a string. A number of constraints on length, patterns, and enumerations apply.
Note that these are strictly strings and not objects that stringify.

Example schemata:

    { "type": "string" }
    
    {
        "type": "string"
    ,   "enum": ["carrot", "banana", "donkey"]
    }
    
    {
        "type": "string"
    ,   "pattern": "a{3}\\d\\d"
    }
    
    {
        "type": "string"
    ,   "minLength": 2
    ,   "maxLength": 17
    }

Additional constraints:

* `enum`: The object must match one of the values in the `enum` array. All of these
  must be strings.
* `pattern`: A regular expression that the string must match. Note that since it is
  conveyed as a string you will need to escape backslashes.
  Additional constraints:
* `minLength` and `maxLength`: The minimal and maximal length of the string (inclusive).

### number

The object is a number. It can be further constrained on enumeration, minimum, and
maximum values.

Example schemata:

    { "type": "number" }
    
    {
        "type": "number"
    ,   "enum": [5, 17, 23, 42]
    }
    
    {
        "type": "number"
    ,   "minimum": 23
    ,   "exclusiveMaximum": 57.2
    }

Additional constraints:

* `enum`: The object must match one of the values in the `enum` array. All of these
  must be numbers.
* `minimum`, `maximum`, `exclusiveMinimum`, and `exclusiveMaximum`: minimal and
  maximal boundaries on the number's value, either inclusive or exclusive.


### object

The object is, well, an object. Its properties can be enumerated and themselves 
recursively defined and constrained.

Example schemata:

    { "type": "object" }
    
    {
        "type": "object"
    ,   "properties": {
            "fullName":  { "type": "string", "required": true }
        ,   "age":       { "type": "number", "minimum": 0 }
        ,   "superHeroIdentity": {
                "type": "object"
            ,   "coolName": { "type": "string" }
            ,   "superPower": {
                    "type": "string"
                ,   "enum": ["flying", "telekinesis", "parsing MIME"]
                }
            }
        }
    }

Additional constraint:

* `properties`: This is a simply an object the keys of which are those that are
  being constrained on the object (object keys not listed here are not only allowed
  but also unconstrained). The values for those keys are the types of the values
  for the matching fields in JSON instances.

In addition to its regular type information, each property value can also take a
boolean constraint called `required`. If set to true, then this field must be
present in the instance (the default is for it to be optional).

### array

The object is an array. This can be further constrained with minimal and maximal
lengths, as well as with constraints on the types of the objects contained in the
array.

Example schemata:

    { "type": "array" }
    
    {
        "type":         "array"
    ,   "minItems":     3
    ,   "maxItems":     200
    ,   "items":        { "type": "number" }
    ,   "uniqueItems":  true
    }
    
    {
        "type":             "array"
    ,   "items":            [ { "type": "number" }, { "type": "string" }, { "type": "string" } ]
    ,   "additionalItems":  true
    }

Additional constraints:

* `minItems` and `maxItems`: The minimal and maximal length of the array, inclusive.
* `items` (with a type): When `items` is a type definition, then all array members will be
  validated against that type.
* `items` (with an array): When `items` is an array of type definitions, then the array members
  at a given offset will be validated against the type definition at the same offset. The array
  instance is implicitly constrained to be of the same length as the `items` constraint, unless
  `additionalItems` is specified.
* `additionalItems`: In the case of an array-based `items`, a boolean that allows for additional array members
  after those constrained by the provided types. Those additional members are not validated.
* `uniqueItems`: If true, checks that the values in the array are unique (using ===, recursively).

### Union types

It is also possible to define union types, which is to say, cases in which validation will be
tried against multiple type definitions until one matches or the list of options in the union
is exhausted.

Example schemata:

    { "type": ["number", "string"] }
    
    {
        "type": [
            { "type": "string", "pattern": "^\\w+$" }
        ,   { "type": "array", "minItems": 3 }
        ,   "boolean"
        ]
    }

A union is defined by providing an array of options for the `type`. Each item in that array may
be either just the string name of a fundamental type, or a full-fledged type definition. If none
of the types match, then the validation fails.
