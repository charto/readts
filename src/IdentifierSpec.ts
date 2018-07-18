// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './index';

import { SymbolSpec } from './Parser';

/** Property, function / method parameter or variable. */

export class IdentifierSpec {
	/** @ignore internal use. */

	constructor(spec: SymbolSpec, type: readts.TypeSpec, optional: boolean) {
		this.name = spec.name;
		this.type = type;
        this.value = type.value;
		this.optional = optional;
		this.pos = spec.pos;
		if(spec.doc) this.doc = spec.doc;
	}

	/** Identifier name. */
	name: string;
	pos: readts.SourcePos;
	/** Type definition. */
	type: readts.TypeSpec;
    /** Literal type value */
    value?: any;
	/** Interface members and function / method parameters may be optional. */
	optional: boolean;
	/** JSDoc comment. */
	doc: string;
}
