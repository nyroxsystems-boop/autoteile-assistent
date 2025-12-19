import type { OEMSource } from "./baseSource";

export const llmHeuristicSource: OEMSource = {
  name: "llmHeuristicSource",
  async resolveCandidates() {
    return [];
  }
};
