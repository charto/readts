// Copyright (c) 2016- readts authors, see AUTHORS.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './index';

import { SymbolSpec } from './Parser';

/** Module or source file. */

export class ModuleSpec {
	/** Add an exported enum. @ignore internal use. */

	addEnum(spec: readts.EnumSpec) {
		this.enumList.push(spec);
	}

	/** Add an exported class. @ignore internal use. */

	addClass(spec: readts.ClassSpec) {
		this.classList.push(spec);
	}

	/** Add an exported interface. @ignore internal use. */

	addInterface(spec: readts.ClassSpec) {
		this.interfaceList.push(spec);
	}

	/** Add an exported function. @ignore internal use. */

	addFunction(spec: readts.FunctionSpec) {
		this.functionList.push(spec);
	}

	/** Test if nothing is exported. */

	isEmpty() {
		return(
			!this.enumList.length &&
			!this.classList.length &&
			!this.interfaceList.length &&
			!this.functionList.length &&
			!this.variableList.length
		);
	}

	/** Definitions of exported enums. */
	enumList: readts.EnumSpec[] = [];
	/** Definitions of exported classes. */
	classList: readts.ClassSpec[] = [];
	/** Definitions of exported interfaces. */
	interfaceList: readts.ClassSpec[] = [];
	/** Definitions of exported functions. */
	functionList: readts.FunctionSpec[] = [];
	/** Definitions of exported variables. */
	variableList: readts.IdentifierSpec[] = [];
}
