// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './readts';

/** Property, function / method parameter or variable. */

export class IdentifierSpec {
	/** @ignore internal use. */

	constructor(name: string, type: readts.TypeSpec, doc: string) {
		this.name = name;
		this.type = type;
		if(doc) this.doc = doc;
	}

	/** Identifier name. */
	name: string;
	/** Type definition. */
	type: readts.TypeSpec;
	/** Interface members and function / method parameters may be optional. */
	optional: boolean;
	/** JSDoc comment. */
	doc: string;
}
