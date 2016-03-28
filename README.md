readts
======

[![build status](https://travis-ci.org/charto/readts.svg?branch=master)](http://travis-ci.org/charto/readts)
[![npm version](https://img.shields.io/npm/v/readts.svg)](https://www.npmjs.com/package/readts)

This is a TypeScript exported class, function, type and documentation parser.
It outputs everything needed to automatically generate documentation and better understand a project's public API.

Usage
-----

```typescript
import * as readts from 'readts';

var parser = new readts.Parser();

// Read configuration used in the project we want to analyze.
var config = parser.parseConfig('tsconfig.json');

// Modify configuration as needed, for example to avoid writing compiler output to disk.
config.options.noEmit = true;

// Parse the project.
var tree = parser.parse(config);
```

The output is a list of [`ModuleSpec`](#api-ModuleSpec) objects, each with exported classes and interfaces ([`ClassSpec`](#api-ClassSpec)),
functions ([`FunctionSpec`](#api-FunctionSpec)) and variables ([`IdentifierSpec`](#api-IdentifierSpec)).
Types of variables and function parameters are parsed to [`TypeSpec`](#api-TypeSpec) objects,
pointing to correct [`ClassSpec`](#api-ClassSpec) objects if applicable.
This allows cross-linking types to their definitions in generated documentation.

See [charto/docts](https://github.com/charto/docts) for a documentation generator using this parser.

API
===

>
> <a name="api-IdentifierSpec"></a>
> ### Class [`IdentifierSpec`](#api-IdentifierSpec)
> <em>Property, function / method parameter or variable.</em>  
>  
> Properties:  
> > **.name** <sup><code>string</code></sup>  
> > &emsp;<em>Identifier name.</em>  
> > **.type** <sup><code>[TypeSpec](#api-TypeSpec)</code></sup>  
> > &emsp;<em>Type definition.</em>  
> > **.optional** <sup><code>boolean</code></sup>  
> > &emsp;<em>Interface members and function / method parameters may be optional.</em>  
> > **.doc** <sup><code>string</code></sup>  
> > &emsp;<em>JSDoc comment.</em>  
>
> <a name="api-SignatureSpec"></a>
> ### Class [`SignatureSpec`](#api-SignatureSpec)
> <em>Function or method signature defining input and output types.</em>  
>  
> Properties:  
> > **.paramList** <sup><code>[IdentifierSpec](#api-IdentifierSpec)[]</code></sup>  
> > &emsp;<em>List of parameters.</em>  
> > **.returnType** <sup><code>[TypeSpec](#api-TypeSpec)</code></sup>  
> > &emsp;<em>Return type definition.</em>  
> > **.doc** <sup><code>string</code></sup>  
> > &emsp;<em>JSDoc comment.</em>  
>
> <a name="api-FunctionSpec"></a>
> ### Class [`FunctionSpec`](#api-FunctionSpec)
> <em>Function or method with any number of overloaded signatures.</em>  
>  
> Properties:  
> > **.name** <sup><code>string</code></sup>  
> > &emsp;<em>Function name.</em>  
> > **.signatureList** <sup><code>[SignatureSpec](#api-SignatureSpec)[]</code></sup>  
> > &emsp;<em>List of signatures, one for each overload.</em>  
>
> <a name="api-ClassSpec"></a>
> ### Class [`ClassSpec`](#api-ClassSpec)
> <em>Class or interface and its members.</em>  
>  
> Properties:  
> > **.name** <sup><code>string</code></sup>  
> > &emsp;<em>Class name.</em>  
> > **.construct** <sup><code>[FunctionSpec](#api-FunctionSpec)</code></sup>  
> > &emsp;<em>Constructor function.</em>  
> > **.methodList** <sup><code>[FunctionSpec](#api-FunctionSpec)[]</code></sup>  
> > &emsp;<em>Public methods.</em>  
> > **.propertyList** <sup><code>[IdentifierSpec](#api-IdentifierSpec)[]</code></sup>  
> > &emsp;<em>Public properties.</em>  
> > **.doc** <sup><code>string</code></sup>  
> > &emsp;<em>JSDoc comment.</em>  
>
> <a name="api-ModuleSpec"></a>
> ### Class [`ModuleSpec`](#api-ModuleSpec)
> <em>Module or source file.</em>  
>  
> Methods:  
> > **new( )** <sup>&rArr; <code>[ModuleSpec](#api-ModuleSpec)</code></sup>  
> > **.isEmpty( )** <sup>&rArr; <code>boolean</code></sup>  
> > &emsp;<em>Test if nothing is exported.</em>  
>  
> Properties:  
> > **.classList** <sup><code>[ClassSpec](#api-ClassSpec)[]</code></sup>  
> > &emsp;<em>Definitions of exported classes.</em>  
> > **.interfaceList** <sup><code>[ClassSpec](#api-ClassSpec)[]</code></sup>  
> > &emsp;<em>Definitions of exported interfaces.</em>  
> > **.functionList** <sup><code>[FunctionSpec](#api-FunctionSpec)[]</code></sup>  
> > &emsp;<em>Definitions of exported functions.</em>  
> > **.variableList** <sup><code>[IdentifierSpec](#api-IdentifierSpec)[]</code></sup>  
> > &emsp;<em>Definitions of exported variables.</em>  
>
> <a name="api-FormatHooks"></a>
> ### Interface [`FormatHooks`](#api-FormatHooks)
> <em>Hooks to change how parts of type definitions are converted to strings.</em>  
>  
> Properties:  
> > **.ref**<sub>?</sub> <sup><code>(spec: TypeSpec, hooks: FormatHooks) => string</code></sup>  
> > **.array**<sub>?</sub> <sup><code>(spec: TypeSpec, hooks: FormatHooks) => string</code></sup>  
> > **.union**<sub>?</sub> <sup><code>(spec: TypeSpec, hooks: FormatHooks) => string</code></sup>  
>
> <a name="api-TypeSpec"></a>
> ### Class [`TypeSpec`](#api-TypeSpec)
> <em>Type definition.</em>  
>  
> Methods:  
> > **.format( )** <sup>&rArr; <code>string</code></sup>  
> > &emsp;<em>Convert to string, with optional hooks replacing default formatting code.</em>  
> > &emsp;&#x25ab; hooks<sub>?</sub> <sup><code>[FormatHooks](#api-FormatHooks)</code></sup>  
> > &emsp;&#x25ab; needParens<sub>?</sub> <sup><code>boolean</code></sup>  
>  
> Properties:  
> > **.name** <sup><code>string</code></sup>  
> > &emsp;<em>Name of the type, only present if not composed of other type or class etc.</em>  
> > **.ref** <sup><code>[RefSpec](#api-RefSpec)</code></sup>  
> > &emsp;<em>Definition of what the type points to, if available.</em>  
> > **.unionOf** <sup><code>[TypeSpec](#api-TypeSpec)[]</code></sup>  
> > &emsp;<em>If the type is a union, list of the possible types.</em>  
> > **.arrayOf** <sup><code>[TypeSpec](#api-TypeSpec)</code></sup>  
> > &emsp;<em>If the type is an array, its element type.</em>  
>
> <a name="api-RefSpec"></a>
> ### Interface [`RefSpec`](#api-RefSpec)
>  
> Properties:  
> > **.name**<sub>?</sub> <sup><code>string</code></sup>  
> > **.symbol**<sub>?</sub> <sup><code>Symbol</code></sup>  
> > **.class**<sub>?</sub> <sup><code>[ClassSpec](#api-ClassSpec)</code></sup>  
>
> <a name="api-Parser"></a>
> ### Class [`Parser`](#api-Parser)
> <em>Main parser class with public methods, also holding its internal state.</em>  
>  
> Methods:  
> > **new( )** <sup>&rArr; <code>[Parser](#api-Parser)</code></sup>  
> > **.parseConfig( )** <sup>&rArr; <code>ParsedCommandLine</code></sup>  
> > &emsp;<em>Parse a tsconfig.json file using TypeScript services API.</em>  
> > &emsp;&#x25aa; tsconfigPath <sup><code>string</code></sup>  
> > **.parse( )** <sup>&rArr; <code>[ModuleSpec](#api-ModuleSpec)[]</code></sup>  
> > &emsp;<em>Parse a TypeScript project using TypeScript services API and configuration.</em>  
> > &emsp;&#x25aa; config <sup><code>ParsedCommandLine</code></sup>  

License
=======

[The MIT License](https://raw.githubusercontent.com/charto/readts/master/LICENSE)

Copyright (c) 2016 BusFaster Ltd
