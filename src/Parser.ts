// This file is part of readts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as ts from 'typescript';
import * as readts from './readts';

interface SymbolSpec {
	node?: ts.Node;
	name: string;
	symbol: ts.Symbol;
	declaration: ts.Declaration;
	type: ts.Type;
	doc: string;
}

export class Parser {
	parseConfig(tsconfigPath: string) {
		var configJson = ts.parseConfigFileTextToJson(tsconfigPath, ts.sys.readFile(tsconfigPath)).config;
		var config = ts.parseJsonConfigFileContent(configJson, ts.sys, tsconfigPath.replace(/[^/]+$/, ''), {}, tsconfigPath);

		return(config);
	}

	parse(config: ts.ParsedCommandLine): readts.ModuleSpec[] {
		var sourceNum = 0;

		this.program = ts.createProgram(config.fileNames, config.options);
		this.checker = this.program.getTypeChecker();

		for(var source of this.program.getSourceFiles()) {
			// Skip contents of default library.
			if(sourceNum++ == 0) continue;

			this.parseModule(source);
		}

		return(this.moduleList);
	}

	private formatType(type: ts.Type) {
		return(this.checker.typeToString(type));
	}

	private parseModule(node: ts.Node) {
		var spec = new readts.ModuleSpec();

		ts.forEachChild(node, (node: ts.Node) => this.parseTopNode(node, spec));

		if(!spec.isEmpty()) this.moduleList.push(spec);
	}

	/** Find classes and interfaces in module's top-level scope. */

	private parseTopNode(node: ts.Node, moduleSpec: readts.ModuleSpec) {
		switch(node.kind) {
			case ts.SyntaxKind.ClassDeclaration:
			case ts.SyntaxKind.InterfaceDeclaration:
				var spec = this.parseDeclaration(node);
				if(spec) {
					var classSpec = this.parseClass(spec);
					if(classSpec) moduleSpec.addClass(classSpec);
				}
				break;

			case ts.SyntaxKind.ModuleDeclaration:
				this.parseModule(node);
				break;
		}
	}

	private parseComment(symbol: ts.Symbol | ts.Signature) {
		return(ts.displayPartsToString(symbol.getDocumentationComment()).trim());
	}

	private parseSymbol(symbol: ts.Symbol) {
		var declaration = symbol.valueDeclaration;

		if(!declaration) return(null);

		var type = this.checker.getTypeOfSymbolAtLocation(symbol, declaration);

		var spec: SymbolSpec = {
			symbol: symbol,
			declaration: declaration,
			type: type,
			name: symbol.getName(),
			doc: this.parseComment(symbol)
		};

		return(spec);
	}

	private parseDeclaration(node: ts.Node) {
		var symbol = this.checker.getSymbolAtLocation((<ts.DeclarationStatement>node).name);
		var spec = this.parseSymbol(symbol);

		if(spec) spec.node = node;

		return(spec);
	}

	private parseClass(spec: SymbolSpec) {
		var classSpec = new readts.ClassSpec(spec.name, spec.doc);

		for(var signature of spec.type.getConstructSignatures()) {
			classSpec.addConstructor(this.parseSignature(signature));
		}

		var memberTbl = spec.symbol.members;

		for(var key of Object.keys(memberTbl)) {
			var spec = this.parseSymbol(memberTbl[key]);

			if(!spec) continue;

			var symbolFlags = spec.symbol.getFlags();
			var declFlags = spec.declaration.flags;

			if(declFlags & ts.NodeFlags.Private) continue;

			if(symbolFlags & ts.SymbolFlags.Method) {
				classSpec.addMethod(this.parseFunction(spec));
			} else if(symbolFlags & ts.SymbolFlags.Property) {
				classSpec.addProperty(this.parseVariable(spec));
			}
		}

		return(classSpec);
	}

	private parseFunction(spec: SymbolSpec) {
		var funcSpec = new readts.FunctionSpec(spec.name);

		for(var signature of spec.type.getCallSignatures()) {
			funcSpec.addSignature(this.parseSignature(signature));
		}

		return(funcSpec);
	}

	private parseVariable(spec: SymbolSpec) {
		var varSpec = new readts.IdentifierSpec(spec.name, this.formatType(spec.type), spec.doc);

		return(varSpec);
	}

	/** Parse function or method signature. */

	private parseSignature(signature: ts.Signature) {
		var signatureSpec = new readts.SignatureSpec(
			this.formatType(signature.getReturnType()),
			this.parseComment(signature)
		);

		for(var param of signature.parameters) {
			var spec = this.parseSymbol(param);
			if(spec) signatureSpec.addParam(this.parseVariable(spec));
		}

		return(signatureSpec);
	}

	private static isNodeExported(node: ts.Node) {
		return(
			!!(node.flags & ts.NodeFlags.Export) ||
			(node.parent && node.parent.kind == ts.SyntaxKind.SourceFile)
		);
	}

	program: ts.Program;
	checker: ts.TypeChecker;
	moduleList: readts.ModuleSpec[] = [];
}
