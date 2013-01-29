
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


# Supported schema constructs


