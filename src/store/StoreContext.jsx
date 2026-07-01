import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { TYPES, STORAGE_KEY } from "../constants/types";
import { pad } from "../utils/date";
import { genId } from "../utils/id";
import { seedData } from "./seed";
import { migrate } from "./migrations";

const StoreContext = createContext(null);

/* ---- localStorage helpers ---- */
function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function saveStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("save failed", e);
  }
}

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

/* ---- Provider ---- */
export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const loaded = loadStore();
    return loaded || seedData();
  });

  // Auto-save on every state change
  useEffect(() => {
    if (state) saveStore(state);
  }, [state]);

  // Sync on focus
  const refresh = useCallback(() => {
    const d = loadStore();
    if (d) dispatch({ type: "INIT", data: d });
  }, []);

  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  // Save seed if first load
  useEffect(() => {
    if (!loadStore()) saveStore(state);
  }, []);

  return (
    <StoreContext.Provider value={{ state, dispatch, refresh }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
