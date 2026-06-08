import { useCallback, useMemo, useRef, useState } from "react"
import {
  ArrowRight,
  Circle,
  ClipboardCopy,
  Download,
  FilePlus2,
  FileText,
  Frame,
  MousePointer2,
  PanelRight,
  PenLine,
  RectangleHorizontal,
  Smartphone,
  StickyNote,
  Type,
} from "lucide-react"
import {
  CaptureUpdateAction,
  Excalidraw,
  FONT_FAMILY,
  THEME,
  convertToExcalidrawElements,
  exportToBlob,
} from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"

type SketchTemplate = "iphone" | "web" | "modal"
type ToolType = "selection" | "rectangle" | "ellipse" | "text" | "arrow" | "freedraw"

type TemplateButton = {
  id: SketchTemplate
  label: string
  description: string
  icon: typeof Smartphone
}

type ToolButton = {
  id: ToolType
  label: string
  icon: typeof MousePointer2
}

const toolButtons: ToolButton[] = [
  { id: "selection", label: "选择", icon: MousePointer2 },
  { id: "rectangle", label: "矩形", icon: RectangleHorizontal },
  { id: "ellipse", label: "圆形", icon: Circle },
  { id: "text", label: "文字", icon: Type },
  { id: "arrow", label: "箭头", icon: ArrowRight },
  { id: "freedraw", label: "手绘", icon: PenLine },
]

const templateButtons: TemplateButton[] = [
  { id: "iphone", label: "iPhone", description: "移动端比例参考", icon: Smartphone },
  { id: "web", label: "Web", description: "网页布局参考", icon: PanelRight },
  { id: "modal", label: "弹窗", description: "浮层状态参考", icon: Frame },
]

const makeText = (x: number, y: number, text: string, fontSize = 18) => ({
  type: "text",
  x,
  y,
  text,
  fontSize,
  fontFamily: FONT_FAMILY.Virgil,
  strokeColor: "#111827",
  backgroundColor: "transparent",
})

const makeBox = (
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    strokeColor?: string
    backgroundColor?: string
    fillStyle?: "solid" | "hachure" | "cross-hatch"
    strokeWidth?: number
    roughness?: number
  } = {},
) => ({
  type: "rectangle",
  x,
  y,
  width,
  height,
  strokeColor: options.strokeColor ?? "#111827",
  backgroundColor: options.backgroundColor ?? "transparent",
  fillStyle: options.fillStyle ?? "hachure",
  strokeWidth: options.strokeWidth ?? 1,
  roughness: options.roughness ?? 1,
})

const makeArrow = (x: number, y: number, width: number, height: number) => ({
  type: "arrow",
  x,
  y,
  width,
  height,
  points: [
    [0, 0],
    [width, height],
  ],
  strokeColor: "#111827",
  backgroundColor: "transparent",
  strokeWidth: 2,
  roughness: 1,
})

const buildIphoneTemplate = (x: number, y: number) => [
  makeBox(x, y, 250, 500, { strokeWidth: 2, roughness: 1 }),
  makeText(x + 96, y + 26, "iPhone", 16),
  makeBox(x + 22, y + 58, 206, 38, { fillStyle: "solid", backgroundColor: "#ffffff" }),
  makeText(x + 40, y + 68, "搜索内容", 14),
  makeBox(x + 22, y + 126, 206, 74, { backgroundColor: "#f8fafc" }),
  makeBox(x + 36, y + 142, 48, 44),
  makeText(x + 104, y + 146, "列表卡片", 15),
  makeText(x + 104, y + 172, "点击进入详情", 13),
  makeBox(x + 22, y + 220, 206, 74, { backgroundColor: "#f8fafc" }),
  makeBox(x + 36, y + 236, 48, 44),
  makeText(x + 104, y + 242, "列表卡片", 15),
  makeBox(x + 22, y + 314, 206, 74, { backgroundColor: "#f8fafc" }),
  makeBox(x + 36, y + 330, 48, 44),
  makeText(x + 104, y + 336, "列表卡片", 15),
  makeBox(x + 22, y + 432, 162, 38, { fillStyle: "solid", backgroundColor: "#ffffff" }),
  makeText(x + 40, y + 442, "这里是输入框", 14),
  makeBox(x + 194, y + 432, 34, 38, { fillStyle: "solid", backgroundColor: "#ffffff" }),
  makeArrow(x + 250, y + 160, 80, 28),
  makeText(x + 340, y + 164, "点击进入详情", 17),
]

const buildWebTemplate = (x: number, y: number) => [
  makeBox(x, y, 520, 360, { strokeWidth: 2 }),
  makeBox(x, y, 520, 44, { fillStyle: "solid", backgroundColor: "#f8fafc" }),
  makeText(x + 20, y + 13, "Web", 16),
  makeBox(x + 90, y + 12, 220, 20, { fillStyle: "solid", backgroundColor: "#ffffff" }),
  makeBox(x, y + 44, 120, 316, { fillStyle: "solid", backgroundColor: "#f8fafc" }),
  makeText(x + 24, y + 82, "侧边栏", 15),
  makeText(x + 24, y + 126, "导航项", 14),
  makeText(x + 24, y + 168, "导航项", 14),
  makeBox(x + 150, y + 86, 130, 120, { backgroundColor: "#ffffff" }),
  makeBox(x + 300, y + 86, 130, 120, { backgroundColor: "#ffffff" }),
  makeText(x + 168, y + 218, "内容卡片", 15),
  makeText(x + 318, y + 218, "内容卡片", 15),
  makeBox(x + 260, y + 200, 220, 132, { fillStyle: "solid", backgroundColor: "#ffffff", strokeWidth: 2 }),
  makeText(x + 290, y + 224, "弹窗状态", 17),
  makeText(x + 290, y + 258, "确认操作或补充说明", 14),
  makeBox(x + 290, y + 294, 72, 28, { backgroundColor: "#e5e7eb" }),
  makeBox(x + 382, y + 294, 72, 28, { fillStyle: "solid", backgroundColor: "#ffffff" }),
]

const buildModalTemplate = (x: number, y: number) => [
  makeBox(x, y, 320, 200, { fillStyle: "solid", backgroundColor: "#ffffff", strokeWidth: 2 }),
  makeText(x + 28, y + 28, "弹窗", 20),
  makeText(x + 28, y + 72, "这里写状态说明", 15),
  makeBox(x + 28, y + 132, 96, 34, { backgroundColor: "#e5e7eb" }),
  makeBox(x + 146, y + 132, 96, 34, { fillStyle: "solid", backgroundColor: "#ffffff" }),
]

const buildInitialElements = () =>
  convertToExcalidrawElements(
    [
      ...buildIphoneTemplate(-420, -260),
      ...buildWebTemplate(-80, -210),
      makeText(-480, 300, "用左侧工具继续画：矩形 / 圆形 / 文字 / 箭头", 18),
      makeText(-480, 336, "画完点右上角「复制给 AI」", 18),
    ] as any[],
    { regenerateIds: true },
  )

const buildTemplateElements = (template: SketchTemplate, insertIndex: number) => {
  const rowY = 460 + insertIndex * 120
  const offsets: Record<SketchTemplate, [number, number]> = {
    iphone: [-420, rowY],
    web: [-80, rowY],
    modal: [560, rowY],
  }
  const [x, y] = offsets[template]

  const skeletons =
    template === "iphone"
      ? buildIphoneTemplate(x, y)
      : template === "web"
        ? buildWebTemplate(x, y)
        : buildModalTemplate(x, y)

  return convertToExcalidrawElements(skeletons as any[], { regenerateIds: true })
}

const buildAgentHandoffText = (elementCount: number) => `这是一个低保真产品原型草图。

目标：让 AI Agent 根据图中的 iPhone / Web / 弹窗结构理解产品界面。
画布元素数量：${elementCount}
请优先识别页面框、卡片、输入框、按钮、箭头和中文批注，再转成实现方案。`

function App() {
  const excalidrawApiRef = useRef<any | null>(null)
  const insertCountRef = useRef(0)
  const [activeTool, setActiveToolState] = useState<ToolType>("selection")
  const [copyStatus, setCopyStatus] = useState("PNG + 批注")
  const [lastInsertedTemplate, setLastInsertedTemplate] = useState<SketchTemplate>("iphone")

  const initialData = useMemo(
    () => ({
      elements: buildInitialElements(),
      appState: {
        theme: THEME.LIGHT,
        viewBackgroundColor: "#ffffff",
        currentItemStrokeColor: "#111827",
        currentItemBackgroundColor: "transparent",
        currentItemRoughness: 1,
        currentItemFontFamily: FONT_FAMILY.Virgil,
        zoom: { value: 0.7 },
        scrollX: 500,
        scrollY: 340,
      },
    }),
    [],
  )

  const handleToolSelect = useCallback((tool: ToolType) => {
    setActiveToolState(tool)
    excalidrawApiRef.current?.setActiveTool({ type: tool })
  }, [])

  const handleInsertTemplate = useCallback((template: SketchTemplate) => {
    const api = excalidrawApiRef.current
    if (!api) return

    const insertedElements = buildTemplateElements(template, insertCountRef.current)
    insertCountRef.current += 1

    const nextElements = [...api.getSceneElements(), ...insertedElements]
    api.updateScene({
      elements: nextElements,
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    })
    api.scrollToContent(insertedElements, { fitToContent: true, animate: true })
    setLastInsertedTemplate(template)
  }, [])

  const handleNewCanvas = useCallback(() => {
    const api = excalidrawApiRef.current
    if (!api) return

    insertCountRef.current = 0
    api.updateScene({
      elements: [],
      files: {},
      appState: {
        theme: THEME.LIGHT,
        viewBackgroundColor: "#ffffff",
        currentItemStrokeColor: "#111827",
        currentItemBackgroundColor: "transparent",
        currentItemRoughness: 1,
        currentItemFontFamily: FONT_FAMILY.Virgil,
        zoom: { value: 0.7 },
        scrollX: 0,
        scrollY: 0,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    })
    handleToolSelect("selection")
    setLastInsertedTemplate("iphone")
  }, [handleToolSelect])

  const handleCopyForAgent = useCallback(async () => {
    const api = excalidrawApiRef.current
    if (!api) return

    const elements = api.getSceneElements()
    const handoffText = buildAgentHandoffText(elements.length)

    setCopyStatus("正在复制")

    try {
      const blob = await exportToBlob({
        elements,
        files: api.getFiles(),
        appState: {
          ...api.getAppState(),
          exportBackground: true,
          viewBackgroundColor: "#ffffff",
        },
        mimeType: "image/png",
        exportPadding: 24,
      })

      if ("ClipboardItem" in window && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
            "text/plain": new Blob([handoffText], { type: "text/plain" }),
          }),
        ])
        setCopyStatus("已复制 PNG + 批注")
      } else {
        await navigator.clipboard.writeText(handoffText)
        setCopyStatus("已复制批注")
      }
    } catch (error) {
      try {
        await navigator.clipboard.writeText(handoffText)
        setCopyStatus("已复制批注")
      } catch {
        // NOTE: 部分自动化浏览器或桌面壳会拒绝剪贴板权限，用户仍可用导出按钮拿到 PNG。
        setCopyStatus(error instanceof Error && error.name === "NotAllowedError" ? "浏览器拦截复制" : "复制失败")
      }
    } finally {
      window.setTimeout(() => setCopyStatus("PNG + 批注"), 2200)
    }
  }, [])

  const handleDownloadPng = useCallback(async () => {
    const api = excalidrawApiRef.current
    if (!api) return

    const blob = await exportToBlob({
      elements: api.getSceneElements(),
      files: api.getFiles(),
      appState: {
        ...api.getAppState(),
        exportBackground: true,
        viewBackgroundColor: "#ffffff",
      },
      mimeType: "image/png",
      exportPadding: 24,
    })

    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = `prototype-sketch-${Date.now()}.png`
    link.click()
    URL.revokeObjectURL(objectUrl)
  }, [])

  return (
    <main className="prototype-app">
      <section className="floating-workbench" aria-label="AI 原型草图工作台">
        <div className="window-titlebar">
          <div className="traffic-lights" aria-hidden="true">
            <span className="traffic-dot red" />
            <span className="traffic-dot yellow" />
            <span className="traffic-dot green" />
          </div>
          <div className="window-title">
            <FileText size={16} />
            <span>AI 原型草图</span>
          </div>
          <div className="title-actions">
            <span className="copy-status">{copyStatus}</span>
            <button className="secondary-action" type="button" onClick={handleNewCanvas}>
              <FilePlus2 size={16} />
              新建
            </button>
            <button className="secondary-action" type="button" onClick={handleDownloadPng}>
              <Download size={16} />
              导出
            </button>
            <button className="primary-action" type="button" onClick={handleCopyForAgent}>
              <ClipboardCopy size={17} />
              复制给 AI
            </button>
          </div>
        </div>

        <div className="workspace-grid">
          <aside className="tool-rail" aria-label="绘制工具">
            {toolButtons.map((tool) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  className={activeTool === tool.id ? "tool-button active" : "tool-button"}
                  type="button"
                  title={tool.label}
                  aria-label={tool.label}
                  onClick={() => handleToolSelect(tool.id)}
                >
                  <Icon size={22} />
                </button>
              )
            })}
          </aside>

          <section className="canvas-shell" aria-label="白板画布">
            <Excalidraw
              initialData={initialData as any}
              excalidrawAPI={(api) => {
                excalidrawApiRef.current = api
                window.setTimeout(() => {
                  const sceneElements = api.getSceneElements()
                  if (sceneElements.length > 0) {
                    api.scrollToContent(sceneElements, { fitToContent: true, animate: false })
                  }
                }, 120)
              }}
              UIOptions={{
                canvasActions: {
                  loadScene: false,
                  saveAsImage: false,
                  export: false,
                  toggleTheme: false,
                },
              }}
            />
          </section>

          <aside className="template-panel" aria-label="模板">
            <div className="panel-heading">
              <span>模板</span>
              <StickyNote size={18} />
            </div>
            <div className="template-list">
              {templateButtons.map((template) => {
                const Icon = template.icon
                return (
                  <button
                    key={template.id}
                    className={lastInsertedTemplate === template.id ? "template-card active" : "template-card"}
                    type="button"
                    onClick={() => handleInsertTemplate(template.id)}
                  >
                    <Icon size={28} />
                    <span>
                      <strong>{template.label}</strong>
                      <small>{template.description}</small>
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default App
