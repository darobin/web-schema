
# Overview

`json-validate` is a small library that performs, shockingly enough, validation of
JSON documents. It supports a limited subset of JSON Schema.

# Installing

The usual simple:

    npm install json-validate

In order to run in a browser, you simply need to include the `json-validate.js` file,
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
resolved into `json-validate`.

# API

The API is very simple, the following example probably tells you all you need to know:

```javascript
var jv = new JSONValidate();
var result = jv.validate(object, schema);
if (result.ok) {
    // victory \o/
}
else {
    console.log("JSON has the following errors: " + result.errors.join(", ") + " at path " + result.path);
}
```

#### var jv = new JSONValidate()

A simple constructor that takes no arguments.

#### var result = jv.validate(object, schema);

This takes an object that is parsed JSON (or any in-memory equivalent) and a schema that
corresponds to the subset of JSON Schema described in the following section. Note that 
`validate()` will throw if you schema is invalid.

The return value is an object with the following fields:

* `ok`: true if the JSON is valid, false otherwise.
* `errors`: a list of human-readable strings describing the errors that were encountered. In
  most cases `json-validate` will only return one single error as it does not currently try
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


### boolean


### string


### number


### object


### array


### union types
