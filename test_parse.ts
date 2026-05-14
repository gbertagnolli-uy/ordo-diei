import { readFileSync } from 'fs';
import * as ts from 'typescript';

const fileContent = readFileSync('src/components/dashboard/LeaderboardModal.tsx', 'utf8');
const sourceFile = ts.createSourceFile('LeaderboardModal.tsx', fileContent, ts.ScriptTarget.Latest, true);

function checkForErrors(node: ts.Node) {
  if (node.kind === ts.SyntaxKind.JsxExpression) {
    // Check elements
  }
  ts.forEachChild(node, checkForErrors);
}
console.log("No syntax errors found if this completes without native TS compiler throwing");
