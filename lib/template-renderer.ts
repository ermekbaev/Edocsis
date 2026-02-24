/**
 * Renders template content by replacing variables with field values
 * Variables format: {{fieldKey}}
 * Example: "Date: {{date}}" with values { date: "2026-02-15" } => "Date: 2026-02-15"
 */
export function renderTemplate(
  content: string | null | undefined,
  fieldValues: Record<string, any> | null | undefined
): string {
  if (!content) return "";
  if (!fieldValues) return content;

  let rendered = content;

  // Replace all {{variable}} with corresponding field values
  Object.entries(fieldValues).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    const displayValue = formatFieldValue(value);
    rendered = rendered.replace(regex, displayValue);
  });

  // Remove any remaining unreplaced variables
  rendered = rendered.replace(/{{[^}]+}}/g, "[Not filled]");

  return rendered;
}

/**
 * Format field value for display
 */
function formatFieldValue(value: any): string {
  if (value === null || value === undefined || value === "") {
    return "[Not filled]";
  }

  if (typeof value === "number") {
    return value.toLocaleString();
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

/**
 * Extract all variables from template content
 * Returns array of variable keys like ["date", "clientName", "amount"]
 */
export function extractVariables(content: string | null | undefined): string[] {
  if (!content) return [];

  const regex = /{{([^}]+)}}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const variable = match[1].trim();
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }

  return variables;
}

/**
 * Validate that all required fields have values
 */
export function validateFieldValues(
  fields: any[] | null | undefined,
  fieldValues: Record<string, any> | null | undefined
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!fields || fields.length === 0) {
    return { valid: true, errors: [] };
  }

  fields.forEach((field: any) => {
    if (field.required) {
      const value = fieldValues?.[field.key];
      if (value === null || value === undefined || value === "") {
        errors.push(`${field.label} is required`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
