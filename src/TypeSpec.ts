// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './index';

export type FormatHook = (spec: TypeSpec, output?: string, hooks?: FormatHooks) => string;

/** Hooks to change how parts of type definitions are converted to strings. */

export interface FormatHooks {
	[name: string]: FormatHook;

	unknown?: FormatHook;
	ref?: FormatHook;
	array?: FormatHook;
	union?: FormatHook;
	intersection?: FormatHook;
	generic?: FormatHook;
}

/** Type definition. */

export class TypeSpec {
	/** Parse a type from TypeScript services. @ignore internal use. */

	constructor(type: ts.Type, parser: readts.Parser) {
		var tf = ts.TypeFlags;
		var oFlags = ts.ObjectFlags;

		// console.log(Object.keys(tf).map((name: string) => type.flags & tf[name] ? name : null).filter((name) => !!name).join(' | '));

		if(type.flags & tf.EnumLiteral){
			if(type.flags & tf.Union) {
				this.ref = parser.getRef(type.symbol);
			} else {
				this.parseEnum(type);
			}
		} else if(this.isSimpleType(type)) {
			this.name = parser.typeToString(type);
		} else if (this.isTypeReference(type)) {
			this.parseReference(type, parser);
		} else if (this.isClassLikeType(type)) {
			this.parseClass(type, parser);
		} else if (this.isObjectType(type) && (type.objectFlags & oFlags.Tuple)) {
		} else if (type.flags & tf.Union) {
			this.unionOf = this.parseList((type as ts.UnionOrIntersectionType).types, parser);
		} else if (type.flags & tf.Intersection) {
			this.intersectionOf = this.parseList((type as ts.UnionOrIntersectionType).types, parser);
		}
	}

	private parseEnum(type: ts.Type) {
		this.name = type.flags & ts.TypeFlags.NumberLiteral ? 'number' : 'string';
		this.value = (<ts.LiteralType>type).value;
	}

	private parseClass(type: ts.Type, parser: readts.Parser) {
		if(type.symbol) this.ref = parser.getRef(type.symbol);
	}

	private parseReference(type: ts.TypeReference, parser: readts.Parser) {
		// Hack to recognize arrays, TypeScript services doesn't seem to export
		// the array symbol it uses internally to detect array types
		// so just check the name.
		if(type.target.symbol && type.target.symbol.getName() == 'Array' && type.typeArguments) {
			this.arrayOf = new TypeSpec(type.typeArguments[0], parser);
		} else {
			this.parseClass(type, parser);
			if(type.typeArguments) this.argumentList = this.parseList(type.typeArguments, parser);
		}
	}

	private parseList(typeList: ReadonlyArray<ts.Type>, parser: readts.Parser) {
		return(typeList.map((type: ts.Type) => new TypeSpec(type, parser)));
	}

	private isSimpleType(type: ts.Type): boolean {
		if (!!(type.flags & ((ts.TypeFlags as any).Intrinsic | ts.TypeFlags.StringLiteral))) {
			return true;
		}
		if ((type as any).isThisType) {
			return true;
		}
		if (this.isObjectType(type) && !!(type.objectFlags & ts.ObjectFlags.Anonymous)) {
			return true;
		}
		return false;
	}

	private isClassLikeType(type: ts.Type): boolean {
		return !!(type.flags & (ts.TypeFlags.Enum | ts.TypeFlags.TypeParameter))
			|| (this.isObjectType(type) && !!(type.objectFlags & ts.ObjectFlags.ClassOrInterface));
	}

	private isObjectType(type: ts.Type): type is ts.ObjectType {
		return !!(type.flags & ts.TypeFlags.Object);
	}

	private isTypeReference(type: ts.Type): type is ts.TypeReference {
		return this.isObjectType(type) && !!(type.objectFlags & ts.ObjectFlags.Reference);
	}

	/** Convert to string, with optional hooks replacing default formatting code. */

	format(hooks?: FormatHooks, needParens?: boolean): string {
		var output: string;
		var hook: FormatHook;

		if(!hooks) hooks = {};

		if(this.name) {
			hook = hooks.unknown;
			output = this.name;
		}

		if(this.ref) {
			output = this.ref.name;
			if(hooks.ref) output = hooks.ref(this, output, hooks);

			if(this.argumentList) {
				hook = hooks.generic;
				output += '<' + this.argumentList.map((spec: TypeSpec) => spec.format(hooks, false)).join(', ') + '>';
			}
		}

		if(this.arrayOf) {
			hook = hooks.array;
			output = this.arrayOf.format(hooks, true) + '[]';
		}

		if(output) return(hook ? hook(this, output, hooks) : output);

		if(this.unionOf) {
			hook = hooks.union;
			output = this.unionOf.map((spec: TypeSpec) => spec.format(hooks, true)).join(' | ');
		}

		if(this.intersectionOf) {
			hook = hooks.intersection;
			output = this.intersectionOf.map((spec: TypeSpec) => spec.format(hooks, true)).join(' & ');
		}

		if(needParens) output = '(' + output + ')';

		return(hook ? hook(this, output, hooks) : output);
	}

	/** Name of the type, only present if not composed of other type or class etc. */
	name: string;
	/** Value of the type, only present if literal type */
	value?: string | number;
	/** Definition of what the type points to, if available. */
	ref: readts.RefSpec;
	/** If the type is a union, list of the possible types. */
	unionOf: TypeSpec[];
	/** If the type is an intersection, list of the possible types. */
	intersectionOf: TypeSpec[];
	/** If the type is an array, its element type. */
	arrayOf: TypeSpec;
	/** Arguments of a generic type. */
	argumentList: TypeSpec[];
}
