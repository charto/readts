// Copyright (c) 2018- readts authors, see AUTHORS.
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
