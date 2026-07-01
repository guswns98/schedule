import {
  LayoutGrid, GanttChartSquare, Calendar as CalendarIcon, Table2,
  FlaskConical, ListChecks, Grid3X3, Layers,
  Bug, Smartphone, ClipboardCheck, BarChart3,
  CalendarDays, AlertTriangle, Users, TrendingUp,
  FileText, Image, ClipboardList,
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    id: "board",
    label: "보드",
    items: [
      { id: "kanban",   label: "칸반",     Icon: LayoutGrid },
      { id: "timeline", label: "타임라인", Icon: GanttChartSquare },
      { id: "calendar", label: "캘린더",   Icon: CalendarIcon },
      { id: "table",    label: "테이블",   Icon: Table2 },
    ],
  },
  {
    id: "test-mgmt",
    label: "테스트 관리",
    items: [
      { id: "test-cases",    label: "테스트 케이스",     Icon: FlaskConical },
      { id: "test-runs",     label: "실행 이력",         Icon: ListChecks },
      { id: "coverage",      label: "커버리지 매트릭스", Icon: Grid3X3 },
      { id: "regression",    label: "회귀 테스트 세트",  Icon: Layers },
    ],
  },
  {
    id: "qa",
    label: "QA",
    items: [
      { id: "repro-tracker",    label: "재현율 추적",       Icon: Bug },
      { id: "device-matrix",    label: "디바이스 매트릭스", Icon: Smartphone },
      { id: "release-checklist", label: "릴리스 체크리스트", Icon: ClipboardCheck },
      { id: "defect-density",   label: "결함 밀도",         Icon: BarChart3 },
    ],
  },
  {
    id: "pm",
    label: "PM",
    items: [
      { id: "release-calendar", label: "릴리스 캘린더", Icon: CalendarDays },
      { id: "risk-heatmap",     label: "리스크 히트맵", Icon: AlertTriangle },
      { id: "workload",         label: "QA 워크로드",   Icon: Users },
      { id: "test-progress",    label: "테스트 진행률", Icon: TrendingUp },
    ],
  },
  {
    id: "convenience",
    label: "편의 기능",
    items: [
      { id: "daily-report",   label: "일일 리포트",       Icon: FileText },
      { id: "screenshot",     label: "스크린샷 주석",     Icon: Image },
      { id: "templates",      label: "체크리스트 템플릿", Icon: ClipboardList },
    ],
  },
];
