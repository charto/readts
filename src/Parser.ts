// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as path from 'path';
import * as ts from 'typescript';
import * as readts from './index';

const hasExports = (ts.SymbolFlags.Class | ts.SymbolFlags.Enum | ts.SymbolFlags.Module | ts.SymbolFlags.Variable);

export interface SourcePos {
	sourcePath: string;
	firstLine: number;
	lastLine: number;
}

/** @ignore internal use. */

export interface SymbolSpec {
	name: string;
	symbol: ts.Symbol;
	declaration?: ts.Declaration;
	type?: ts.Type;
	pos?: SourcePos;
	doc: string;
}

export interface RefSpec {
	[key: string]: any;

	name?: string;
	symbol?: ts.Symbol;
	class?: readts.ClassSpec;
	enum?: readts.EnumSpec;
}

/** Main parser class with public methods, also holding its internal state. */

export class Parser {
	/** Parse a tsconfig.json file using TypeScript services API. */

	parseConfig(tsconfigPath: string) {
		const txt = ts.sys.readFile(tsconfigPath);
		if(!txt) return({});

		const configJson = ts.parseConfigFileTextToJson(tsconfigPath, txt).config;
		const config = ts.parseJsonConfigFileContent(configJson, ts.sys, tsconfigPath.replace(/[^/]+$/, ''), {}, tsconfigPath);

		return(config);
	}

	/** Parse a TypeScript project using TypeScript services API and configuration. */

	parse(
		config: ts.ParsedCommandLine,
		nameFilter?: (pathName: string) => boolean,
		extension?: string
	): readts.ModuleSpec[] {
		let sourceNum = 0;

		this.program = ts.createProgram(config.fileNames, config.options);
		this.checker = this.program.getTypeChecker();
		this.moduleList = [];
		this.symbolTbl = {};

		for(let source of this.program.getSourceFiles()) {
			// Skip contents of the default library.
			if(sourceNum++ == 0) continue;

			// Call optional filter to check if file should be parsed.
			if(
				!nameFilter ||
				!extension ||
				nameFilter(this.getOwnEmitOutputFilePath(source, this.program, extension))
			) {
				this.parseSource(source);
			}
		}

		return(this.moduleList);
	}

	/** Convert an otherwise unrecognized type to string. @ignore internal use. */

	typeToString(type: ts.Type) {
		return(this.checker.typeToString(type));
	}

	/** Get or change reference for a symbol. @ignore internal use. */

	getRef(symbol: ts.Symbol, ref?: RefSpec) {
		const name = symbol.getName();
		let symbolList = this.symbolTbl[name];

		if(!ref) ref = {};

		if(!symbolList) {
			symbolList = [];
			this.symbolTbl[name] = symbolList;
		} else {
			for(let match of symbolList) {
				if(symbol == match.symbol) {
					for(let key of Object.keys(ref)) {
						match[key] = ref[key];
					}

					return(match);
				}
			}
		}

		ref.name = name;
		ref.symbol = symbol;
		symbolList.push(ref);

		return(ref);
	}

	private parseType(type: ts.Type) {
		const spec = new readts.TypeSpec(type, this);

		return(spec);
	}

	private parseSource(source: ts.SourceFile) {
		const symbol = this.checker.getSymbolAtLocation(source);
		if(!symbol || !symbol.exports) return;

		const exportTbl = symbol.exports;

		for(let name of this.getKeys(exportTbl).sort()) {
			let spec = this.parseSymbol(exportTbl.get(name)!);

			// Resolve aliases.
			while(1) {
				const symbolFlags = spec.symbol.getFlags();

				if(symbolFlags & ts.SymbolFlags.Alias) {
					spec = this.parseSymbol(this.checker.getAliasedSymbol(spec.symbol));
				} else break;
			}

			if(spec.declaration) {
				const module = new readts.ModuleSpec();

				this.parseDeclaration(spec, module);

				this.moduleList.push(module);
			}
		}
	}

	/** Extract declared function, class or interface from a symbol. */

	private parseDeclaration(spec: SymbolSpec, moduleSpec: readts.ModuleSpec) {
		const node = spec.declaration as ts.Node;

		switch(node.kind) {
			case ts.SyntaxKind.FunctionDeclaration:
				if(spec) {
					const functionSpec = this.parseFunction(spec);
					if(functionSpec) moduleSpec.addFunction(functionSpec);
				}
				break;
			case ts.SyntaxKind.EnumDeclaration:
				if(spec) {
					const enumSpec = this.parseEnum(spec);
					if(enumSpec) moduleSpec.addEnum(enumSpec);
				}
				break;
			case ts.SyntaxKind.ClassDeclaration:
			case ts.SyntaxKind.InterfaceDeclaration:
				if(spec) {
					const classSpec = this.parseClass(spec);
					if(classSpec) {
						if(node.kind == ts.SyntaxKind.InterfaceDeclaration) {
							moduleSpec.addInterface(classSpec);
						} else moduleSpec.addClass(classSpec);
					}
				}
				break;
		}
	}

	private parseComment(symbol: ts.Symbol | ts.Signature) {
		return(ts.displayPartsToString(symbol.getDocumentationComment(this.checker)).trim());
	}

	private parsePos(node: ts.Declaration): SourcePos {
		const source = node.getSourceFile();

		return({
			sourcePath: source.fileName,
			firstLine: ts.getLineAndCharacterOfPosition(source, node.getStart()).line + 1,
			lastLine: ts.getLineAndCharacterOfPosition(source, node.getEnd()).line + 1
		});
	}

	private parseSymbol(symbol: ts.Symbol) {
		let declaration: ts.Declaration | undefined = symbol.valueDeclaration;
		let type: ts.Type | undefined;
		let pos: SourcePos | undefined;

		// Interfaces have no value declaration.
		// In a merged declaration with enums, valueDeclaration is ModuleDeclaration.
		if(!declaration || declaration.kind == ts.SyntaxKind.ModuleDeclaration) {
			const declarationList = symbol.getDeclarations();
			const first = declarationList && declarationList[0];

			if(!declaration || (first && first.kind == ts.SyntaxKind.InterfaceDeclaration)) {
				declaration = first;
			}
		}

		if(declaration) {
			pos = this.parsePos(declaration);
			type = this.checker.getTypeOfSymbolAtLocation(symbol, declaration);
		}

		var spec: SymbolSpec = {
			symbol: symbol,
			declaration: declaration,
			type: type,
			name: symbol.getName(),
			pos: pos,
			doc: this.parseComment(symbol)
		};

		return(spec);
	}

	private parseEnum(spec: SymbolSpec) {
		const enumSpec = new readts.EnumSpec(spec);

		this.getRef(spec.symbol, { enum: enumSpec });

		if(spec.symbol.getFlags() & hasExports) {
			const exportTbl = spec.symbol.exports;

			for(let key of this.getKeys(exportTbl)) {
				const symbol = exportTbl!.get(key);

				const spec = this.parseSymbol(exportTbl!.get(key)!);

				if(!spec) continue;

				if(spec.symbol.getFlags() & ts.SymbolFlags.EnumMember) {
					enumSpec.addMember(this.parseIdentifier(spec, false));
				}
			}
		}

		return(enumSpec);
	}

	private parseClass(spec: SymbolSpec) {
		const classSpec = new readts.ClassSpec(spec);

		this.getRef(spec.symbol, { class: classSpec });

		// Interfaces have no value type.
		if(spec.type) {
			for(let signature of spec.type.getConstructSignatures()) {
				classSpec.addConstructor(this.parseSignature(signature));
			}
		}

		const memberTbl = spec.symbol.members;

		for(let key of this.getKeys(memberTbl)) {
			const spec = this.parseSymbol(memberTbl!.get(key)!);

			if(!spec) continue;

			if(spec.declaration) {
				if(ts.getCombinedModifierFlags(spec.declaration) & ts.ModifierFlags.Private) continue;
			}

			const symbolFlags = spec.symbol.getFlags();

			if(symbolFlags & ts.SymbolFlags.Method) {
				classSpec.addMethod(this.parseFunction(spec));
			} else if(symbolFlags & ts.SymbolFlags.Property) {
				classSpec.addProperty(this.parseIdentifier(spec, !!(symbolFlags & ts.SymbolFlags.Optional)));
			} else if(spec.declaration && ts.isIndexSignatureDeclaration(spec.declaration)) {
				classSpec.index = this.parseIndex(spec);
			}
		}

		const heritageClauses = (<ts.ClassLikeDeclarationBase>spec.declaration).heritageClauses;

		if(heritageClauses) {
			for(let heritageClause of heritageClauses) {
				for(let type of heritageClause.types) {
					const symbol = this.checker.getSymbolAtLocation(type.expression);

					if(symbol && symbol.declarations.length) {
						const ref = this.getRef(symbol);

						if(ref.class) {
							classSpec.addExtend(ref.class);
						}
					}
				}
			}
		}

		if(spec.symbol.getFlags() & hasExports) {
			const exportTbl = spec.symbol.exports;

			for(let key of this.getKeys(exportTbl)) {
				const symbol = exportTbl!.get(key)!;

				if(!(symbol.getFlags() & ts.SymbolFlags.ClassMember)) {
					const spec = this.parseSymbol(symbol);

					if(!spec) continue;

					this.parseDeclaration(spec, classSpec.exports);
				}
			}
		}

		return(classSpec);
	}

	private parseFunction(spec: SymbolSpec) {
		const funcSpec = new readts.FunctionSpec(spec);

		if(spec.type) {
			for(let signature of spec.type.getCallSignatures()) {
				funcSpec.addSignature(this.parseSignature(signature));
			}
		}

		return(funcSpec);
	}

	private parseIndex(spec: SymbolSpec) {
		const declaration = spec.declaration as ts.IndexSignatureDeclaration;
		const parameter = declaration.parameters[0] as ts.ParameterDeclaration;

		// ParameterDeclaration does have symbol, even though it is not on interfaces.
		const signatureType = (
			parameter.type &&
			this.parseType(this.checker.getTypeOfSymbolAtLocation(
				(<any>parameter).symbol,
				parameter.type
			))
		);

		const valueType = (
			declaration.type &&
			this.parseType(this.checker.getTypeAtLocation(declaration.type))
		);

		const indexSpec = new readts.IndexSpec(signatureType, valueType);
		return(indexSpec);
	}

	/** Parse property, function / method parameter or variable. */

	private parseIdentifier(spec: SymbolSpec, optional: boolean) {
		const varSpec = (
			new readts.IdentifierSpec(spec, spec.type && this.parseType(spec.type), optional)
		);

		return(varSpec);
	}

	/** Parse function / method signature. */

	private parseSignature(signature: ts.Signature) {
		let pos: SourcePos | undefined;
		const declaration = signature.getDeclaration();

		if(declaration) pos = this.parsePos(declaration);

		const signatureSpec = new readts.SignatureSpec(
			pos,
			this.parseType(signature.getReturnType()),
			this.parseComment(signature)
		);

		for(let param of signature.parameters) {
			const spec = this.parseSymbol(param);

			signatureSpec.addParam(
				this.parseIdentifier(
					spec,
					this.checker.isOptionalParameter(spec.declaration as ts.ParameterDeclaration)
				)
			);
		}

		return(signatureSpec);
	}

	private getKeys<T>(map?: ts.ReadonlyUnderscoreEscapedMap<T>): ts.__String[] {
		const keys: ts.__String[] = [];

		if(map) {
			map.forEach((_, key) => keys.push(key));
		}

		return(keys);
	}

	private getOwnEmitOutputFilePath(sourceFile: ts.SourceFile, program: ts.Program, extension: string): string {
		const getCanonicalFileName = (ts as any).createGetCanonicalFileName(ts.sys.useCaseSensitiveFileNames);
		const host = {
			getCanonicalFileName,
			getCommonSourceDirectory: (program as any).getCommonSourceDirectory,
			getCompilerOptions: program.getCompilerOptions,
			getCurrentDirectory: program.getCurrentDirectory,
		};

		/** The internal getOwnEmitOutputFilePath function in TypeScript 2.7.x
		  * expects an object with a fileName property, 3.0.x expects a string.
		  * A string object can satisfy both. */
		const shim = new String(sourceFile.fileName || sourceFile);
		(shim as any).fileName = shim;

		const outPath = (ts as any).getOwnEmitOutputFilePath(shim, host, extension);
		return(path.resolve(program.getCurrentDirectory(), outPath));
	}

	/** TypeScript services API object. */
	private program: ts.Program;

	/** TypeScript services type checker. */
	private checker: ts.TypeChecker;

	/** List of modules found while parsing. */
	private moduleList: readts.ModuleSpec[];

	private symbolTbl: { [name: string]: RefSpec[] };
}
