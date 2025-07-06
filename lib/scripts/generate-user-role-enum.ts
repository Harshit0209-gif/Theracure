import { writeFileSync, mkdirSync } from "fs";
import { UserRole } from "@prisma/client";

const enumKeys = Object.keys(UserRole);

const enumContent = `// 🚨 AUTO-GENERATED FILE. DO NOT EDIT MANUALLY!
// Generated from Prisma schema.

export enum UserRole {
${enumKeys.map((role) => `  ${role} = "${role}",`).join("\n")}
}
`;

const outputDir = "./lib/generated";
mkdirSync(outputDir, { recursive: true });
const outputPath = `${outputDir}/userRoles.ts`;

writeFileSync(outputPath, enumContent);

console.log(` UserRole enum generated at ${outputPath}`);
console.log("Available roles:", enumKeys.join(", "));
console.log("You can import this enum from:", outputPath);
