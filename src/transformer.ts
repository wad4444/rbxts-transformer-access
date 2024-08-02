import ts from "typescript";

// biome-ignore lint/complexity/noBannedTypes: <explanation>
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

function visitPropertyAccessExpression(
	context: TransformContext,
	node: ts.PropertyAccessExpression,
) {
	const { program, factory } = context;

	const symbol = program.getTypeChecker().getSymbolAtLocation(node);
	if (!symbol || !symbol.valueDeclaration) return context.transform(node);

	const declaration = symbol.valueDeclaration;
	if (!ts.isMethodDeclaration(declaration)) return context.transform(node);

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
