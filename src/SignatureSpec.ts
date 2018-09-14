// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './index';

import { SymbolSpec } from './Parser';

/** Function or method signature defining input and output types. */

export class SignatureSpec {
	/** @ignore internal use. */

	constructor(pos: readts.SourcePos | undefined, returnType: readts.TypeSpec, doc: string) {
		this.pos = pos;
		this.returnType = returnType;
		if(doc) this.doc = doc;
	}

	/** Add a new parameter and type. @ignore internal use. */

	addParam(spec: readts.IdentifierSpec) {
		this.paramList.push(spec);
	}

	pos?: readts.SourcePos;
	/** List of parameters. */
	paramList: readts.IdentifierSpec[] = [];
	/** Return type definition. */
	returnType: readts.TypeSpec;
	/** JSDoc comment. */
	doc: string;
}
