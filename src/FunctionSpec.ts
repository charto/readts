// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './readts';

/** Function or method with any number of overloaded signatures. */

export class FunctionSpec {
	/** @ignore internal use. */

	constructor(name: string) {
		if(name) this.name = name;
	}

	/** Add a new signature. @ignore internal use. */

	addSignature(spec: readts.SignatureSpec) {
		this.signatureList.push(spec);
	}

	/** Function name. */
	name: string;
	/** List of signatures, one for each overload. */
	signatureList: readts.SignatureSpec[] = [];
}
