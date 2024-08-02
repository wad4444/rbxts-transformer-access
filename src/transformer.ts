import ts from "typescript";

export type TransformerConfig = {};

export class TransformContext {
	public factory: ts.NodeFactory;

	constructor(
		public program: ts.Program,
		public context: ts.TransformationContext,
		public config: TransformerConfig,
	) {
		this.factory = context.factory;
	}

	transform<T extends ts.Node>(node: T): T {
		return ts.visitEachChild(
			node,
			(node) => visitNode(this, node),
			this.context,
		);
	}
}

type TupleToUnion<T extends unknown[]> = T[number];
type NodeValidators<T> = { [K in keyof T]: (node: any) => node is T[K] };

function isTuple<T extends ts.Node[] | []>(...args: NodeValidators<T>) {
	return (node: ts.Node): node is TupleToUnion<T> => {
		for (const validator of args) {
			if (validator(node)) return true;
		}
		return false;
	};
}

function isInCallExpression(node: ts.Node): boolean {
	let currentNode: ts.Node = node;
	while (currentNode.parent) {
		if (
			ts.isCallExpression(currentNode.parent) &&
			currentNode.parent.expression === currentNode
		) {
			return true;
		}
		if (ts.isParenthesizedExpression(currentNode.parent)) {
			currentNode = currentNode.parent;
			continue;
		}
		break;
	}
	return false;
}

function visitPropertyAccessExpression(
	context: TransformContext,
	node: ts.PropertyAccessExpression,
) {
	const { program, factory } = context;

	const symbol = program.getTypeChecker().getSymbolAtLocation(node);
	if (!symbol || !symbol.valueDeclaration) return context.transform(node);

	const declaration = symbol.valueDeclaration;
	const check = isTuple(
		ts.isMethodDeclaration,
		ts.isMethodSignature,
	);
	if (!check(declaration)) return context.transform(node);
	if (isInCallExpression(node)) return context.transform(node);

	return factory.createParenthesizedExpression(
		factory.createArrowFunction(
			undefined,
			declaration.typeParameters,
			declaration.parameters,
			undefined,
			factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
			factory.createCallExpression(
				node,
				declaration.typeParameters?.map((typeParameter) =>
					factory.createTypeReferenceNode(
						factory.createIdentifier(typeParameter.name.getText()),
					),
				),
				declaration.parameters.map((parameter) =>
					factory.createIdentifier(parameter.name.getText()),
				),
			),
		),
	);
}

function visitNode(
	context: TransformContext,
	node: ts.Node,
): ts.Node | ts.Node[] {
	if (ts.isPropertyAccessExpression(node)) {
		return visitPropertyAccessExpression(context, node);
	}
	return context.transform(node);
}
