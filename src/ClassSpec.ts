// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './index';

import { SymbolSpec } from './Parser';

/** Class or interface and its members. */

export class ClassSpec {
	/** @ignore internal use. */

	constructor(spec: SymbolSpec) {
		this.name = spec.name;
		this.pos = spec.pos;
		this.symbol = spec.symbol;
		this.exports = new readts.ModuleSpec();

		if(spec.doc) this.doc = spec.doc;
	}

	/** Add constructor signature. @ignore internal use. */

	addConstructor(spec: readts.SignatureSpec) {
		if(!this.construct) this.construct = new readts.FunctionSpec(null);

		this.construct.addSignature(spec);
	}

	/** Add method. @ignore internal use. */

	addMethod(spec: readts.FunctionSpec) {
		if(!this.methodList) this.methodList = [];

		this.methodList.push(spec);
	}

	/** Add property. @ignore internal use. */

	addProperty(spec: readts.IdentifierSpec) {
		if(!this.propertyList) this.propertyList = [];

		this.propertyList.push(spec);
	}

	 /** Add extend. @ignore internal use. */

	addExtend(spec: readts.ClassSpec) {
		if(!this.extendList) this.extendList = [];

		this.extendList.push(spec);
	}

	/** Class name. */
	name: string;
	pos: readts.SourcePos;
	/** Symbol from TypeScript services. @ignore internal use. */
	symbol: ts.Symbol;
	/** Constructor function. */
	construct: readts.FunctionSpec;
	/** Public methods. */
	methodList: readts.FunctionSpec[];
	/** Public properties. */
	propertyList: readts.IdentifierSpec[];
	/** Class extends */
	extendList: readts.ClassSpec[];
	/** Class exports */
	exports: readts.ModuleSpec;
	/** JSDoc comment. */
	doc: string;
}
