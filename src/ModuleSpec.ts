// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './readts';

export class ModuleSpec {
	addClass(spec: readts.ClassSpec) {
		this.classList.push(spec);
	}

	isEmpty() {
		return(
			!this.classList.length &&
			!this.functionList.length &&
			!this.variableList.length
		);
	}

	classList: readts.ClassSpec[] = [];
	functionList: readts.FunctionSpec[] = [];
	variableList: readts.IdentifierSpec[] = [];
}
