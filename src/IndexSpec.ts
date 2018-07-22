// This file is part of readts, copyright (c) 2018 Arttu Liimola.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './index';

/** Index signature. */

export class IndexSpec {
	/** @ignore internal use. */

	constructor(signature: readts.TypeSpec, value: readts.TypeSpec) {
		this.signature = signature;
		this.value = value;
	}

	/** Singature type. */
	signature: readts.TypeSpec;
	/** Value type */
	value: readts.TypeSpec;
}
