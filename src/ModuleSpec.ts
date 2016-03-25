// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './readts';

/** Module or source file. */

export class ModuleSpec {
	/** Add an exported class. @ignore internal use. */

	addClass(spec: readts.ClassSpec) {
		this.classList.push(spec);
	}

	/** Add an exported interface. @ignore internal use. */

	addInterface(spec: readts.ClassSpec) {
		this.interfaceList.push(spec);
	}

	/** Test if nothing is exported. */

	isEmpty() {
		return(
			!this.classList.length &&
			!this.interfaceList.length &&
			!this.functionList.length &&
			!this.variableList.length
		);
	}

	/** Definitions of exported classes. */
	classList: readts.ClassSpec[] = [];
	/** Definitions of exported interfaces. */
	interfaceList: readts.ClassSpec[] = [];
	/** Definitions of exported functions. */
	functionList: readts.FunctionSpec[] = [];
	/** Definitions of exported variables. */
	variableList: readts.IdentifierSpec[] = [];
}
