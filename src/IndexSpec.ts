// This file is part of readts, copyright (c) 2018 Arttu Liimola.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './index';

/** Index signature. */

export class IndexSpec {

	/** @ignore internal use.
	  * @param signature Signature type.
	  * @param value Value type. */

	constructor(public signature?: readts.TypeSpec, public value?: readts.TypeSpec) {}

}
