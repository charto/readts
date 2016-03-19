// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './readts';

export class FunctionSpec {
	constructor(name: string) {
		if(name) this.name = name;
	}

	addSignature(spec: readts.SignatureSpec) {
		this.signatureList.push(spec);
	}

	name: string;
	signatureList: readts.SignatureSpec[] = [];
}
