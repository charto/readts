// This file is part of readts, copyright (c) 2018 Arttu Liimola.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './index';

import { SymbolSpec } from './Parser';

/** Enum and its members. */

export class EnumSpec {
	/** @ignore internal use. */

	constructor(spec: SymbolSpec) {
		this.name = spec.name;
		this.pos = spec.pos;
		this.symbol = spec.symbol;

		if(spec.doc) this.doc = spec.doc;
	}

	addMember(spec: readts.IdentifierSpec) {
		if(!this.memberList) this.memberList = [];

		this.memberList.push(spec);
	}

	/** Class name. */
	name: string;
	pos?: readts.SourcePos;
	/** Symbol from TypeScript services. @ignore internal use. */
	symbol: ts.Symbol;
	/** Public properties. */
	memberList: readts.IdentifierSpec[];
	/** JSDoc comment. */
	doc: string;
}
