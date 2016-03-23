// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './readts';

export class SignatureSpec {
	constructor(returnType: readts.TypeSpec, doc: string) {
		this.returnType = returnType;
		if(doc) this.doc = doc;
	}

	addParam(spec: readts.IdentifierSpec) {
		this.paramList.push(spec);
	}

	/** List of parameters. */
	paramList: readts.IdentifierSpec[] = [];
	/** Return type in TypeScript syntax. */
	returnType: readts.TypeSpec;
	/** JSDoc comment. */
	doc: string;
}
