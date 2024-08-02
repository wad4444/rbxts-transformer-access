import type ts from "typescript";
import { TransformContext, type TransformerConfig } from "./transformer";

export default function (program: ts.Program, config: TransformerConfig) {
	return (
		transformationContext: ts.TransformationContext,
	): ((file: ts.SourceFile) => ts.Node) => {
		const context = new TransformContext(
			program,
			transformationContext,
			config,
		);
		return (file) => {
			return context.transform(file);
		};
	};
}
