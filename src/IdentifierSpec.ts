// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';

/** Property, function / method parameter or variable. */

export class IdentifierSpec {
	constructor(name: string, type: string, doc: string) {
		this.name = name;
		this.type = type;
		if(doc) this.doc = doc;
	}

	/** Identifier name. */
	name: string;
	/** Type in TypeScript syntax. */
	type: string;
	/** Interface members and function / method parameters may be optional. */
	optional: boolean;
	/** JSDoc comment. */
	doc: string;
}
