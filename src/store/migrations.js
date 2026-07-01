export function migrate(data) {
  if (!data) return null;

  // v1 → v2: add new collections
  if (!data.version || data.version < 2) {
    data = {
      ...data,
      version: 2,
      testCases: data.testCases || [],
      testRuns: data.testRuns || [],
      regressionSets: data.regressionSets || [],
      featureAreas: data.featureAreas || ["인증", "결제", "장바구니", "마이페이지", "검색"],
      bugReproData: data.bugReproData || {},
      environments: data.environments || [],
      releases: data.releases || [],
      checklistTemplates: data.checklistTemplates || [],
      members: data.members || [],
      dailyReports: data.dailyReports || [],
    };
    // add new fields to existing items
    data.items = data.items.map((item) => ({
      module: "",
      sprint: "",
      releaseId: null,
      ...item,
    }));
  }

  return data;
}
