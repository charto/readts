// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as path from 'path';
import * as ts from 'typescript';
import * as readts from './index';

export interface SourcePos {
	sourcePath: string;
	firstLine: number;
	lastLine: number;
}

/** @ignore internal use. */

export interface SymbolSpec {
	name: string;
	symbol: ts.Symbol;
	declaration: ts.Declaration;
	type: ts.Type;
	pos: SourcePos;
	doc: string;
}

export interface RefSpec {
	[key: string]: any;

	name?: string;
	symbol?: ts.Symbol;
	class?: readts.ClassSpec;
}

/** Main parser class with public methods, also holding its internal state. */

export class Parser {
	/** Parse a tsconfig.json file using TypeScript services API. */

	parseConfig(tsconfigPath: string) {
		var configJson = ts.parseConfigFileTextToJson(tsconfigPath, ts.sys.readFile(tsconfigPath)).config;
		var config = ts.parseJsonConfigFileContent(configJson, ts.sys, tsconfigPath.replace(/[^/]+$/, ''), {}, tsconfigPath);

		return(config);
	}

	/** Parse a TypeScript project using TypeScript services API and configuration. */

	parse(
		config: ts.ParsedCommandLine,
		nameFilter?: (pathName: string) => boolean,
		extension?: string
	): readts.ModuleSpec[] {
		var sourceNum = 0;

		this.program = ts.createProgram(config.fileNames, config.options);
		this.checker = this.program.getTypeChecker();
		this.moduleList = [];
		this.symbolTbl = {};

		for(var source of this.program.getSourceFiles()) {
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
		var name = symbol.getName();
		var symbolList = this.symbolTbl[name];

		if(!symbolList) {
			symbolList = [];
			this.symbolTbl[name] = symbolList;
		} else {
			for(var match of symbolList) {
				if(symbol == match.symbol) {
					if(ref) for(var key of Object.keys(ref)) match[key] = ref[key];

					return(match);
				}
			}
		}

		if(!ref) ref = {};

		ref.name = name;
		ref.symbol = symbol;
		symbolList.push(ref);

		return(ref);
	}

	private parseType(type: ts.Type) {
		var spec = new readts.TypeSpec(type, this);

		return(spec);
	}

	private parseSource(source: ts.SourceFile) {
		var symbol = this.checker.getSymbolAtLocation(source);
		if(!symbol) return;

		var exportTbl = symbol.exports;

		for(var name of this.getKeys(exportTbl).sort()) {
			var spec = this.parseSymbol(exportTbl.get(name));

			// Resolve aliases.
			while(1) {
				var symbolFlags = spec.symbol.getFlags();

				if(symbolFlags & ts.SymbolFlags.Alias) {
					spec = this.parseSymbol(this.checker.getAliasedSymbol(spec.symbol));
				} else break;
			}

			if(spec.declaration) {
				var module = new readts.ModuleSpec();

				this.parseDeclaration(spec, module);

				this.moduleList.push(module);
			}
		}
	}

	/** Extract declared function, class or interface from a symbol. */

	private parseDeclaration(spec: SymbolSpec, moduleSpec: readts.ModuleSpec) {
		var node = spec.declaration as ts.Node;

		switch(node.kind) {
			case ts.SyntaxKind.FunctionDeclaration:
				if(spec) {
					var functionSpec = this.parseFunction(spec);
					if(functionSpec) moduleSpec.addFunction(functionSpec);
				}
				break;
            case ts.SyntaxKind.EnumDeclaration:
                if (spec) {
                    var enumSpec = this.parseEnum(spec);
                    if(enumSpec) moduleSpec.addEnum(enumSpec);
                }
                break;

			case ts.SyntaxKind.ClassDeclaration:
			case ts.SyntaxKind.InterfaceDeclaration:
				if(spec) {
					var classSpec = this.parseClass(spec);
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
		var source = node.getSourceFile();

		return({
			sourcePath: source.fileName,
			firstLine: ts.getLineAndCharacterOfPosition(source, node.getStart()).line + 1,
			lastLine: ts.getLineAndCharacterOfPosition(source, node.getEnd()).line + 1
		});
	}

	private parseSymbol(symbol: ts.Symbol) {
		var declaration = symbol.valueDeclaration;
		var type: ts.Type = null;
		var pos: SourcePos = null;

		// Interfaces have no value declaration.
		if(!declaration) declaration = symbol.getDeclarations()[0];

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
		var enumSpec = new readts.EnumSpec(spec);

        if ( spec.symbol.getFlags() & ts.SymbolFlags.HasExports )
        {
            var exportTbl = spec.symbol.exports;

            for(let key of this.getKeys(exportTbl)) {
                const symbol = exportTbl.get(key);

                const spec = this.parseSymbol(exportTbl.get(key));

                if(!spec) continue;

                if(spec.symbol.getFlags() & ts.SymbolFlags.EnumMember) {
                    enumSpec.addMember(this.parseIdentifier(spec, false));
			    }
            }
        }

		return(enumSpec);
	}

	private parseClass(spec: SymbolSpec) {
		var classSpec = new readts.ClassSpec(spec);

		this.getRef(spec.symbol, { class: classSpec });

		// Interfaces have no value type.
		if(spec.type) {
			for(var signature of spec.type.getConstructSignatures()) {
				classSpec.addConstructor(this.parseSignature(signature));
			}
		}

		var memberTbl = spec.symbol.members;

		for(let key of this.getKeys(memberTbl)) {
			const spec = this.parseSymbol(memberTbl.get(key));

			if(!spec) continue;

			if(spec.declaration) {
				if(ts.getCombinedModifierFlags(spec.declaration) & ts.ModifierFlags.Private) continue;
			}

			const symbolFlags = spec.symbol.getFlags();

			if(symbolFlags & ts.SymbolFlags.Method) {
				classSpec.addMethod(this.parseFunction(spec));
			} else if(symbolFlags & ts.SymbolFlags.Property) {
				classSpec.addProperty(this.parseIdentifier(spec, !!(symbolFlags & ts.SymbolFlags.Optional)));
			}
		}

        if ( spec.symbol.getFlags() & ts.SymbolFlags.HasExports )
        {
            var exportTbl = spec.symbol.exports;

            for(let key of this.getKeys(exportTbl)) {
                const symbol = exportTbl.get(key);

                if ( !(symbol.getFlags() & ts.SymbolFlags.ClassMember) )
                {
                    const spec = this.parseSymbol(exportTbl.get(key));

                    if(!spec) continue;

                    this.parseDeclaration(spec, classSpec.exports);
                }
            }
        }

		return(classSpec);
	}

	private parseFunction(spec: SymbolSpec) {
		var funcSpec = new readts.FunctionSpec(spec);

		for(var signature of spec.type.getCallSignatures()) {
			funcSpec.addSignature(this.parseSignature(signature));
		}

		return(funcSpec);
	}

	/** Parse property, function / method parameter or variable. */

	private parseIdentifier(spec: SymbolSpec, optional: boolean) {
		var varSpec = new readts.IdentifierSpec(spec, this.parseType(spec.type), optional);
		return(varSpec);
	}

	/** Parse function / method signature. */

	private parseSignature(signature: ts.Signature) {
		var pos: SourcePos;
		var declaration = signature.getDeclaration();

		if(declaration) pos = this.parsePos(declaration);

		var signatureSpec = new readts.SignatureSpec(
			pos,
			this.parseType(signature.getReturnType()),
			this.parseComment(signature)
		);

		for(var param of signature.parameters) {
			var spec = this.parseSymbol(param);
			if(spec) signatureSpec.addParam(this.parseIdentifier(spec, this.checker.isOptionalParameter(spec.declaration as ts.ParameterDeclaration)));
		}

		return(signatureSpec);
	}

	private getKeys<T>(map: ts.ReadonlyUnderscoreEscapedMap<T>): ts.__String[] {
		const keys: ts.__String[] = [];
		map.forEach((_, key) => keys.push(key));
		return(keys);
	}

	private getOwnEmitOutputFilePath(sourceFile: ts.SourceFile, program: ts.Program, extension: string): string {
		var getCanonicalFileName = (ts as any).createGetCanonicalFileName(ts.sys.useCaseSensitiveFileNames);
		var host = {
			getCanonicalFileName,
			getCommonSourceDirectory: (program as any).getCommonSourceDirectory,
			getCompilerOptions: program.getCompilerOptions,
			getCurrentDirectory: program.getCurrentDirectory,
		};
		var outPath = (ts as any).getOwnEmitOutputFilePath(sourceFile, host, extension);
		return(path.resolve(program.getCurrentDirectory(), outPath));
	}

	private static isNodeExported(node: ts.Node) {
		return(
			!!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) ||
			(node.parent && node.parent.kind == ts.SyntaxKind.SourceFile)
		);
	}

	/** TypeScript services API object. */
	private program: ts.Program;
	/** TypeScript services type checker. */
	private checker: ts.TypeChecker;
	/** List of modules found while parsing. */
	private moduleList: readts.ModuleSpec[];
	private symbolTbl: { [name: string]: RefSpec[] };
}
