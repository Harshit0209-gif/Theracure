import { writeFileSync, mkdirSync } from "fs";
import {
  UserRole,
  UserStatus,
  Gender,
  AssignmentStatus,
  SessionStatus,
  AppointmentStatus,
  ConsultationStatus,
  InvoiceStatus,
  RecurringType,
  RecurringEndType,
  ServiceCategory,
} from "@prisma/client";

// Define enum groupings by model
const enumGroups = {
  user: {
    UserRole: Object.keys(UserRole),
    UserStatus: Object.keys(UserStatus),
    Gender: Object.keys(Gender),
  },
  booking: {
    RecurringType: Object.keys(RecurringType),
    RecurringEndType: Object.keys(RecurringEndType),
    AssignmentStatus: Object.keys(AssignmentStatus),
    SessionStatus: Object.keys(SessionStatus),
    AppointmentStatus: Object.keys(AppointmentStatus),
    ConsultationStatus: Object.keys(ConsultationStatus),
  },
  invoice: {
    InvoiceStatus: Object.keys(InvoiceStatus),
  },
  service: {
    ServiceCategory: Object.keys(ServiceCategory),
  },
};

// Function to generate enum content for a group
function generateEnumContent(enums: Record<string, string[]>) {
  return `// 🚨 AUTO-GENERATED FILE. DO NOT EDIT MANUALLY!
// Generated from Prisma schema.

${Object.entries(enums)
  .map(
    ([enumName, keys]) => `
export enum ${enumName} {
${keys.map((key) => `  ${key} = "${key}",`).join("\n")}
}
`
  )
  .join("\n")}
`;
}

const outputDir = "./lib/generated";
mkdirSync(outputDir, { recursive: true });

// Generate and write enum files for each group
Object.entries(enumGroups).forEach(([groupName, enums]) => {
  const enumContent = generateEnumContent(enums);
  const outputPath = `${outputDir}/${groupName}Enums.ts`;
  writeFileSync(outputPath, enumContent);

  // Log results for this group
  console.log(
    `${
      groupName.charAt(0).toUpperCase() + groupName.slice(1)
    } enums generated at ${outputPath}`
  );
  Object.entries(enums).forEach(([enumName, keys]) => {
    console.log(`Available ${enumName} values:`, keys.join(", "));
  });
  console.log(`You can import ${groupName} enums from:`, outputPath);
});
