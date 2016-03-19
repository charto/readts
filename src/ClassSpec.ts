// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './readts';

export class ClassSpec {
	constructor(name: string, doc: string) {
		this.name = name;
		if(doc) this.doc = doc;
	}

	addConstructor(spec: readts.SignatureSpec) {
		if(!this.construct) this.construct = new readts.FunctionSpec(null);

		this.construct.addSignature(spec);
	}

	addMethod(spec: readts.FunctionSpec) {
		if(!this.methodList) this.methodList = [];

		this.methodList.push(spec);
	}

	addProperty(spec: readts.IdentifierSpec) {
		if(!this.propertyList) this.propertyList = [];

		this.propertyList.push(spec);
	}

	name: string;
	construct: readts.FunctionSpec;
	methodList: readts.FunctionSpec[];
	propertyList: readts.IdentifierSpec[];
	/** JSDoc comment. */
	doc: string;
}
