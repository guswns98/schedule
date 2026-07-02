import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from "react";
import { TYPES } from "../constants/types";
import { pad } from "../utils/date";
import { genId } from "../utils/id";
import { seedData } from "./seed";
import * as db from "./supabaseStorage";

const StoreContext = createContext(null);

/* ---- Reducer ---- */
function reducer(state, action) {
  switch (action.type) {
    case "INIT":
      return action.data;

    case "UPSERT_ITEM": {
      const item = action.item;
      if (item.id) {
        return { ...state, items: state.items.map((i) => (i.id === item.id ? item : i)) };
      }
      const seq = { ...state.seq };
      seq[item.type] = (seq[item.type] || 0) + 1;
      const created = {
        ...item,
        id: genId(),
        code: `${TYPES[item.type].prefix}-${pad(seq[item.type])}`,
        createdAt: Date.now(),
      };
      return { ...state, seq, items: [...state.items, created] };
    }

    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case "SET_STATUS":
      return { ...state, items: state.items.map((i) => (i.id === action.id ? { ...i, status: action.status } : i)) };

    /* Test Cases */
    case "UPSERT_TEST_CASE": {
      const tc = action.testCase;
      if (tc.id) {
        return { ...state, testCases: state.testCases.map((t) => (t.id === tc.id ? { ...tc, updatedAt: Date.now() } : t)) };
      }
      return { ...state, testCases: [...state.testCases, { ...tc, id: genId(), createdAt: Date.now(), updatedAt: Date.now() }] };
    }

    case "REMOVE_TEST_CASE":
      return { ...state, testCases: state.testCases.filter((t) => t.id !== action.id) };

    /* Test Runs */
    case "ADD_TEST_RUN":
      return { ...state, testRuns: [...state.testRuns, { ...action.testRun, id: genId(), executedAt: Date.now() }] };

    case "REMOVE_TEST_RUN":
      return { ...state, testRuns: state.testRuns.filter((r) => r.id !== action.id) };

    /* Regression Sets */
    case "UPSERT_REGRESSION_SET": {
      const rs = action.set;
      if (rs.id) {
        return { ...state, regressionSets: state.regressionSets.map((s) => (s.id === rs.id ? rs : s)) };
      }
      return { ...state, regressionSets: [...state.regressionSets, { ...rs, id: genId(), createdAt: Date.now() }] };
    }

    case "REMOVE_REGRESSION_SET":
      return { ...state, regressionSets: state.regressionSets.filter((s) => s.id !== action.id) };

    /* Bug Repro */
    case "UPDATE_BUG_REPRO":
      return { ...state, bugReproData: { ...state.bugReproData, [action.itemId]: action.data } };

    /* Environments */
    case "SET_ENVIRONMENTS":
      return { ...state, environments: action.environments };

    /* Releases */
    case "UPSERT_RELEASE": {
      const rel = action.release;
      if (rel.id) {
        return { ...state, releases: state.releases.map((r) => (r.id === rel.id ? rel : r)) };
      }
      return { ...state, releases: [...state.releases, { ...rel, id: genId() }] };
    }

    case "REMOVE_RELEASE":
      return { ...state, releases: state.releases.filter((r) => r.id !== action.id) };

    /* Feature Areas */
    case "SET_FEATURE_AREAS":
      return { ...state, featureAreas: action.areas };

    /* Members */
    case "SET_MEMBERS":
      return { ...state, members: action.members };

    /* Checklist Templates */
    case "UPSERT_TEMPLATE": {
      const tpl = action.template;
      if (tpl.id) {
        return { ...state, checklistTemplates: state.checklistTemplates.map((t) => (t.id === tpl.id ? tpl : t)) };
      }
      return { ...state, checklistTemplates: [...state.checklistTemplates, { ...tpl, id: genId(), createdAt: Date.now() }] };
    }

    case "REMOVE_TEMPLATE":
      return { ...state, checklistTemplates: state.checklistTemplates.filter((t) => t.id !== action.id) };

    /* Daily Reports */
    case "ADD_DAILY_REPORT":
      return { ...state, dailyReports: [...state.dailyReports, { ...action.report, id: genId(), generatedAt: Date.now() }] };

    default:
      return state;
  }
}

/* ---- Supabase sync: dispatch 후 DB에 비동기 반영 ---- */
function syncToSupabase(prevState, newState, action) {
  switch (action.type) {
    case "UPSERT_ITEM": {
      const item = action.item;
      if (item.id) {
        db.upsertItem(item);
      } else {
        // 새로 생성된 아이템은 newState에서 찾기
        const created = newState.items[newState.items.length - 1];
        db.upsertItem(created);
        db.updateSeq(newState.seq);
      }
      break;
    }
    case "REMOVE_ITEM":
      db.removeItem(action.id);
      break;
    case "SET_STATUS":
      db.updateItemStatus(action.id, action.status);
      break;
    case "UPSERT_TEST_CASE": {
      const tc = action.testCase;
      const saved = tc.id
        ? newState.testCases.find((t) => t.id === tc.id)
        : newState.testCases[newState.testCases.length - 1];
      if (saved) db.upsertTestCase(saved);
      break;
    }
    case "REMOVE_TEST_CASE":
      db.removeTestCase(action.id);
      break;
    case "ADD_TEST_RUN": {
      const run = newState.testRuns[newState.testRuns.length - 1];
      if (run) db.addTestRun(run);
      break;
    }
    case "REMOVE_TEST_RUN":
      db.removeTestRun(action.id);
      break;
    case "UPSERT_REGRESSION_SET": {
      const rs = action.set;
      const saved = rs.id
        ? newState.regressionSets.find((s) => s.id === rs.id)
        : newState.regressionSets[newState.regressionSets.length - 1];
      if (saved) db.upsertRegressionSet(saved);
      break;
    }
    case "REMOVE_REGRESSION_SET":
      db.removeRegressionSet(action.id);
      break;
    case "UPDATE_BUG_REPRO":
      db.updateBugRepro(action.itemId, action.data);
      break;
    case "SET_ENVIRONMENTS":
      db.setEnvironments(action.environments);
      break;
    case "UPSERT_RELEASE": {
      const rel = action.release;
      const saved = rel.id
        ? newState.releases.find((r) => r.id === rel.id)
        : newState.releases[newState.releases.length - 1];
      if (saved) db.upsertRelease(saved);
      break;
    }
    case "REMOVE_RELEASE":
      db.removeRelease(action.id);
      break;
    case "SET_FEATURE_AREAS":
      db.setFeatureAreas(action.areas);
      break;
    case "SET_MEMBERS":
      db.setMembers(action.members);
      break;
    case "UPSERT_TEMPLATE": {
      const tpl = action.template;
      const saved = tpl.id
        ? newState.checklistTemplates.find((t) => t.id === tpl.id)
        : newState.checklistTemplates[newState.checklistTemplates.length - 1];
      if (saved) db.upsertTemplate(saved);
      break;
    }
    case "REMOVE_TEMPLATE":
      db.removeTemplate(action.id);
      break;
    case "ADD_DAILY_REPORT": {
      const report = newState.dailyReports[newState.dailyReports.length - 1];
      if (report) db.addDailyReport(report);
      break;
    }
  }
}

/* ---- Provider ---- */
export function StoreProvider({ children }) {
  const [state, rawDispatch] = useReducer(reducer, null);
  const [loading, setLoading] = useState(true);
  const stateRef = useRef(null);

  // state ref를 항상 최신으로 유지
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // dispatch를 감싸서 Supabase 동기화 추가
  const dispatch = useCallback((action) => {
    const prevState = stateRef.current;
    rawDispatch(action);
    // reducer 결과는 다음 렌더에서 반영되므로, 직접 계산
    if (prevState && action.type !== "INIT") {
      const newState = reducer(prevState, action);
      syncToSupabase(prevState, newState, action);
    }
  }, []);

  // 초기 로딩: Supabase에서 데이터 가져오기
  useEffect(() => {
    db.fetchAll().then((data) => {
      const hasData = data.items.length > 0;
      if (hasData) {
        rawDispatch({ type: "INIT", data });
      } else {
        // DB가 비어있으면 시드 데이터 삽입
        const seed = seedData();
        rawDispatch({ type: "INIT", data: seed });
        // 시드 데이터를 Supabase에 저장
        Promise.all([
          ...seed.items.map((item) => db.upsertItem(item)),
          db.updateSeq(seed.seq),
        ]);
      }
      setLoading(false);
    }).catch(() => {
      // Supabase 연결 실패 시 시드 데이터로 시작
      rawDispatch({ type: "INIT", data: seedData() });
      setLoading(false);
    });
  }, []);

  // focus 시 Supabase에서 재동기화
  const refresh = useCallback(() => {
    db.fetchAll().then((data) => {
      if (data.items.length > 0 || data.testCases.length > 0) {
        rawDispatch({ type: "INIT", data });
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  return (
    <StoreContext.Provider value={{ state, dispatch, refresh, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
