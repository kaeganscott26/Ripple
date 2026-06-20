export function humanizeBranchGroup(value: string): string {
  const words = value.replace(/_/g, " ").trim().toLowerCase();
  return words ? `${words[0].toUpperCase()}${words.slice(1)}` : "Unknown branch";
}

export function humanizeFinalResponse(value: string): string {
  if (value === "accountability_with_monument_pressure") {
    return "Accountability, with Monument returning as pressure";
  }
  if (value.endsWith("_pressure")) {
    return `${humanizeBranchGroup(value.slice(0, -"_pressure".length))} returning as pressure`;
  }
  return value.split("_and_").map(humanizeBranchGroup).join(" and ");
}
