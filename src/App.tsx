import { type ChangeEvent, useCallback, useMemo, useRef, useState } from "react"
import {
  ArrowRight,
  Circle,
  ClipboardCopy,
  Component,
  Download,
  FilePlus2,
  FileText,
  Frame,
  ImagePlus,
  type LucideIcon,
  List,
  MousePointerClick,
  MousePointer2,
  Navigation,
  Paintbrush,
  PanelRight,
  PanelTop,
  PenLine,
  Play,
  RectangleHorizontal,
  Search,
  Smartphone,
  StickyNote,
  TextCursorInput,
  Type,
  X,
} from "lucide-react"
import {
  CaptureUpdateAction,
  Excalidraw,
  FONT_FAMILY,
  THEME,
  convertToExcalidrawElements,
  exportToBlob,
} from "@excalidraw/excalidraw"
import type { ExcalidrawElement, ExcalidrawTextElement } from "@excalidraw/excalidraw/element/types"
import type {
  BinaryFileData,
  DataURL,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  NormalizedZoomValue,
} from "@excalidraw/excalidraw/types"
import "@excalidraw/excalidraw/index.css"

type SketchTemplate = "iphone" | "web" | "modal"
type ComponentTemplate = "search" | "listCard" | "topNav" | "bottomNav" | "formField" | "primaryButton"
type ToolType = "selection" | "rectangle" | "ellipse" | "text" | "arrow" | "freedraw" | "mask"
type DrawingToolType = Exclude<ToolType, "mask">

type TemplateButton = {
  id: SketchTemplate
  label: string
  description: string
  icon: LucideIcon
}

type ToolButton = {
  id: ToolType
  label: string
  icon: LucideIcon
}

type ComponentButton = {
  id: ComponentTemplate
  label: string
  icon: LucideIcon
}

type MaskColor = {
  value: string
  label: string
}

type PrototypePreviewState = {
  id: string
  label: string
  title: string
  items: string[]
}

type PrototypePreviewData = {
  imageUrl: string
  states: PrototypePreviewState[]
}

type PreviewBounds = {
  x: number
  y: number
  width: number
  height: number
}

type ImportedFileId = string & { _brand: "FileId" }
type ExcalidrawSkeletonElement = NonNullable<Parameters<typeof convertToExcalidrawElements>[0]>[number]

const MAX_IMPORTED_IMAGE_WIDTH = 760
const MAX_IMPORTED_IMAGE_HEIGHT = 520
const MASK_STROKE_WIDTH = 18
const INITIAL_ZOOM = 0.7 as NormalizedZoomValue

const toolButtons: ToolButton[] = [
  { id: "selection", label: "选择", icon: MousePointer2 },
  { id: "rectangle", label: "矩形", icon: RectangleHorizontal },
  { id: "ellipse", label: "圆形", icon: Circle },
  { id: "text", label: "文字", icon: Type },
  { id: "arrow", label: "箭头", icon: ArrowRight },
  { id: "freedraw", label: "手绘", icon: PenLine },
  { id: "mask", label: "遮盖", icon: Paintbrush },
]

const templateButtons: TemplateButton[] = [
  { id: "iphone", label: "iPhone", description: "移动端比例参考", icon: Smartphone },
  { id: "web", label: "Web", description: "网页布局参考", icon: PanelRight },
  { id: "modal", label: "弹窗", description: "浮层状态参考", icon: Frame },
]

const componentButtons: ComponentButton[] = [
  { id: "search", label: "搜索框", icon: Search },
  { id: "listCard", label: "列表卡片", icon: List },
  { id: "topNav", label: "顶部导航", icon: PanelTop },
  { id: "bottomNav", label: "底部导航", icon: Navigation },
  { id: "formField", label: "表单项", icon: TextCursorInput },
  { id: "primaryButton", label: "主按钮", icon: MousePointerClick },
]

const maskColors: MaskColor[] = [
  { value: "#ffffff", label: "白色" },
  { value: "#f8fafc", label: "浅灰" },
  { value: "#fef3c7", label: "浅黄" },
  { value: "#dbeafe", label: "浅蓝" },
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

const makeEllipse = (
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
  type: "ellipse",
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

const buildSearchComponent = (x: number, y: number) => [
  makeBox(x, y, 280, 44, { fillStyle: "solid", backgroundColor: "#ffffff" }),
  makeEllipse(x + 18, y + 14, 14, 14, { roughness: 0 }),
  makeText(x + 46, y + 12, "搜索内容", 14),
]

const buildListCardComponent = (x: number, y: number) => [
  makeBox(x, y, 300, 86, { backgroundColor: "#f8fafc" }),
  makeBox(x + 16, y + 18, 52, 50, { fillStyle: "solid", backgroundColor: "#ffffff" }),
  makeText(x + 88, y + 20, "列表卡片", 16),
  makeText(x + 88, y + 50, "副标题或状态说明", 13),
  makeBox(x + 224, y + 28, 54, 28, { fillStyle: "solid", backgroundColor: "#ffffff" }),
]

const buildTopNavComponent = (x: number, y: number) => [
  makeBox(x, y, 340, 56, { fillStyle: "solid", backgroundColor: "#ffffff", strokeWidth: 2 }),
  makeText(x + 18, y + 18, "页面标题", 15),
  makeBox(x + 158, y + 17, 42, 20, { backgroundColor: "#f8fafc" }),
  makeBox(x + 218, y + 17, 42, 20, { backgroundColor: "#f8fafc" }),
  makeBox(x + 278, y + 17, 42, 20, { backgroundColor: "#f8fafc" }),
]

const buildBottomNavComponent = (x: number, y: number) => [
  makeBox(x, y, 280, 70, { fillStyle: "solid", backgroundColor: "#ffffff", strokeWidth: 2 }),
  makeEllipse(x + 28, y + 14, 22, 22, { backgroundColor: "#f8fafc" }),
  makeText(x + 22, y + 44, "首页", 11),
  makeEllipse(x + 94, y + 14, 22, 22, { backgroundColor: "#f8fafc" }),
  makeText(x + 88, y + 44, "搜索", 11),
  makeEllipse(x + 160, y + 14, 22, 22, { backgroundColor: "#f8fafc" }),
  makeText(x + 154, y + 44, "收藏", 11),
  makeEllipse(x + 226, y + 14, 22, 22, { backgroundColor: "#f8fafc" }),
  makeText(x + 220, y + 44, "我的", 11),
]

const buildFormFieldComponent = (x: number, y: number) => [
  makeText(x, y, "字段名称", 14),
  makeBox(x, y + 28, 260, 42, { fillStyle: "solid", backgroundColor: "#ffffff" }),
  makeText(x + 18, y + 40, "输入内容", 13),
]

const buildPrimaryButtonComponent = (x: number, y: number) => [
  makeBox(x, y, 150, 44, { fillStyle: "solid", backgroundColor: "#dbeafe", strokeWidth: 2 }),
  makeText(x + 54, y + 13, "按钮", 15),
]

const buildInitialElements = () =>
  convertToExcalidrawElements(
    [
      ...buildIphoneTemplate(-420, -260),
      ...buildWebTemplate(-80, -210),
      makeText(-480, 300, "用左侧工具继续画：矩形 / 圆形 / 文字 / 箭头", 18),
      makeText(-480, 336, "画完点右上角「复制给 AI」", 18),
    ] as ExcalidrawSkeletonElement[],
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

  return convertToExcalidrawElements(skeletons as ExcalidrawSkeletonElement[], { regenerateIds: true })
}

const buildComponentElements = (component: ComponentTemplate, insertIndex: number) => {
  const x = 560
  const y = 460 + insertIndex * 104
  const skeletons =
    component === "search"
      ? buildSearchComponent(x, y)
      : component === "listCard"
        ? buildListCardComponent(x, y)
        : component === "topNav"
          ? buildTopNavComponent(x, y)
          : component === "bottomNav"
            ? buildBottomNavComponent(x, y)
            : component === "formField"
              ? buildFormFieldComponent(x, y)
              : buildPrimaryButtonComponent(x, y)

  return convertToExcalidrawElements(skeletons as ExcalidrawSkeletonElement[], { regenerateIds: true })
}

const buildAgentHandoffText = (elementCount: number) => `这是一个低保真产品原型草图。

目标：让 AI Agent 根据图中的 iPhone / Web / 弹窗结构理解产品界面。
画布元素数量：${elementCount}
请优先识别页面框、卡片、输入框、按钮、箭头和中文批注，再转成实现方案。`

const genericPreviewLabels = new Set([
  "AI 原型草图",
  "iPhone",
  "Web",
  "用左侧工具继续画：矩形 / 圆形 / 文字 / 箭头",
  "画完点右上角「复制给 AI」",
])

const normalizePreviewLabel = (text: string) => text.trim().replace(/\s+/g, " ")

const getElementBounds = (element: Pick<ExcalidrawElement, "x" | "y" | "width" | "height">): PreviewBounds => ({
  x: Number(element.x ?? 0),
  y: Number(element.y ?? 0),
  width: Math.abs(Number(element.width ?? 0)),
  height: Math.abs(Number(element.height ?? 0)),
})

const isPointInsideBounds = (point: { x: number; y: number }, bounds: PreviewBounds) =>
  point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height

const getTextElementCenter = (element: Pick<ExcalidrawTextElement, "x" | "y" | "width" | "height">) => {
  const bounds = getElementBounds(element)
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
}

const buildPreviewStates = (elements: readonly ExcalidrawElement[]): PrototypePreviewState[] => {
  const textElements = elements
    .filter((element): element is ExcalidrawTextElement => element.type === "text")
    .map((element) => ({
      text: normalizePreviewLabel(element.text),
      center: getTextElementCenter(element),
    }))
    .filter((item) => item.text.length > 0 && item.text.length <= 18 && !genericPreviewLabels.has(item.text))

  const clickableShapes = elements
    .filter((element) => element.type === "rectangle" || element.type === "ellipse")
    .map((element) => ({ element, bounds: getElementBounds(element) }))
    .filter(({ bounds }) => bounds.width >= 24 && bounds.width <= 340 && bounds.height >= 18 && bounds.height <= 110)
    .sort((a, b) => b.bounds.x - a.bounds.x || a.bounds.y - b.bounds.y)

  const labels = clickableShapes
    .map(({ bounds }) => textElements.find((textElement) => isPointInsideBounds(textElement.center, bounds))?.text)
    .filter((label): label is string => Boolean(label))

  for (const textElement of textElements) {
    labels.push(textElement.text)
  }

  const uniqueLabels = Array.from(new Set(labels)).slice(0, 4)
  const fallbackLabels = ["状态一", "状态二", "状态三"]
  const previewLabels = uniqueLabels.length >= 2 ? uniqueLabels : fallbackLabels

  return previewLabels.map((label, index) => ({
    id: `state-${index}`,
    label,
    title: label,
    items: [
      `${label} 的主内容区域`,
      "这里会根据点击状态切换",
      "真实实现时替换成对应页面内容",
    ],
  }))
}

const readFileAsDataUrl = (file: File) =>
  new Promise<DataURL>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result) as DataURL)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const readImageDimensions = (src: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve({
        width: image.naturalWidth || MAX_IMPORTED_IMAGE_WIDTH,
        height: image.naturalHeight || MAX_IMPORTED_IMAGE_HEIGHT,
      })
    }
    image.onerror = () => reject(new Error("Cannot read image dimensions"))
    image.src = src
  })

const fitImportedImage = (width: number, height: number) => {
  const sourceWidth = Math.max(width, 1)
  const sourceHeight = Math.max(height, 1)
  const scale = Math.min(MAX_IMPORTED_IMAGE_WIDTH / sourceWidth, MAX_IMPORTED_IMAGE_HEIGHT / sourceHeight, 1)

  return {
    width: Math.round(sourceWidth * scale),
    height: Math.round(sourceHeight * scale),
  }
}

const makeFileId = (): ImportedFileId =>
  `imported-image-${Date.now()}-${Math.random().toString(36).slice(2)}` as ImportedFileId

function App() {
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const insertCountRef = useRef(0)
  const previewImageUrlRef = useRef<string | null>(null)
  const [activeTool, setActiveToolState] = useState<ToolType>("selection")
  const [maskColor, setMaskColor] = useState(maskColors[0].value)
  const [copyStatus, setCopyStatus] = useState("PNG + 批注")
  const [lastInsertedTemplate, setLastInsertedTemplate] = useState<SketchTemplate>("iphone")
  const [previewData, setPreviewData] = useState<PrototypePreviewData | null>(null)
  const [activePreviewStateId, setActivePreviewStateId] = useState("")
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false)

  const activePreviewState =
    previewData?.states.find((state) => state.id === activePreviewStateId) ?? previewData?.states[0] ?? null

  const initialData = useMemo<ExcalidrawInitialDataState>(
    () => ({
      elements: buildInitialElements(),
      appState: {
        theme: THEME.LIGHT,
        viewBackgroundColor: "#ffffff",
        currentItemStrokeColor: "#111827",
        currentItemBackgroundColor: "transparent",
        currentItemRoughness: 1,
        currentItemFontFamily: FONT_FAMILY.Virgil,
        zoom: { value: INITIAL_ZOOM },
        scrollX: 500,
        scrollY: 340,
      },
    }),
    [],
  )

  const applyMaskTool = useCallback((color: string) => {
    const api = excalidrawApiRef.current
    if (!api) return

    api.updateScene({
      appState: {
        currentItemStrokeColor: color,
        currentItemBackgroundColor: color,
        currentItemStrokeWidth: MASK_STROKE_WIDTH,
        currentItemRoughness: 0,
        currentItemOpacity: 100,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    })
    api.setActiveTool({ type: "freedraw" })
  }, [])

  const applyDefaultTool = useCallback((tool: DrawingToolType) => {
    const api = excalidrawApiRef.current
    if (!api) return

    api.updateScene({
      appState: {
        currentItemStrokeColor: "#111827",
        currentItemBackgroundColor: "transparent",
        currentItemStrokeWidth: tool === "arrow" || tool === "freedraw" ? 2 : 1,
        currentItemRoughness: 1,
        currentItemOpacity: 100,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    })
    api.setActiveTool({ type: tool })
  }, [])

  const handleToolSelect = useCallback((tool: ToolType) => {
    setActiveToolState(tool)
    if (tool === "mask") {
      applyMaskTool(maskColor)
      return
    }
    applyDefaultTool(tool)
  }, [applyDefaultTool, applyMaskTool, maskColor])

  const handleMaskColorSelect = useCallback((color: string) => {
    setMaskColor(color)
    if (activeTool === "mask") {
      applyMaskTool(color)
    }
  }, [activeTool, applyMaskTool])

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

  const handleInsertComponent = useCallback((component: ComponentTemplate) => {
    const api = excalidrawApiRef.current
    if (!api) return

    const insertedElements = buildComponentElements(component, insertCountRef.current)
    insertCountRef.current += 1

    api.updateScene({
      elements: [...api.getSceneElements(), ...insertedElements],
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    })
    api.scrollToContent(insertedElements, { fitToContent: true, animate: true })
  }, [])

  const handleNewCanvas = useCallback(() => {
    const api = excalidrawApiRef.current
    if (!api) return

    insertCountRef.current = 0
    api.updateScene({
      elements: [],
      appState: {
        theme: THEME.LIGHT,
        viewBackgroundColor: "#ffffff",
        currentItemStrokeColor: "#111827",
        currentItemBackgroundColor: "transparent",
        currentItemRoughness: 1,
        currentItemFontFamily: FONT_FAMILY.Virgil,
        zoom: { value: INITIAL_ZOOM },
        scrollX: 0,
        scrollY: 0,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    })
    handleToolSelect("selection")
    setLastInsertedTemplate("iphone")
  }, [handleToolSelect])

  const handleImportImageClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const closePreview = useCallback(() => {
    if (previewImageUrlRef.current) {
      URL.revokeObjectURL(previewImageUrlRef.current)
      previewImageUrlRef.current = null
    }
    setPreviewData(null)
    setActivePreviewStateId("")
    setPreviewModalOpen(false)
  }, [])

  const handleGeneratePreview = useCallback(async () => {
    const api = excalidrawApiRef.current
    if (!api) return

    const elements = api.getSceneElements()
    if (elements.length === 0) {
      setCopyStatus("先画草图")
      window.setTimeout(() => setCopyStatus("PNG + 批注"), 1600)
      return
    }

    setCopyStatus("正在生成")

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
      const imageUrl = URL.createObjectURL(blob)

      if (previewImageUrlRef.current) {
        URL.revokeObjectURL(previewImageUrlRef.current)
      }

      const states = buildPreviewStates(elements)
      previewImageUrlRef.current = imageUrl
      setPreviewData({ imageUrl, states })
      setActivePreviewStateId(states[0]?.id ?? "")
      setPreviewModalOpen(false)
      setCopyStatus("已生成预览")
    } catch {
      setCopyStatus("生成失败")
    } finally {
      window.setTimeout(() => setCopyStatus("PNG + 批注"), 1800)
    }
  }, [])

  const handleImageFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    const api = excalidrawApiRef.current

    if (!file || !api) return

    if (!file.type.startsWith("image/")) {
      setCopyStatus("请选择图片")
      window.setTimeout(() => setCopyStatus("PNG + 批注"), 1600)
      input.value = ""
      return
    }

    setCopyStatus("正在导入")

    try {
      const dataURL = await readFileAsDataUrl(file)
      const mimeType = file.type as BinaryFileData["mimeType"]
      const dimensions = await readImageDimensions(dataURL)
      const fitted = fitImportedImage(dimensions.width, dimensions.height)
      const fileId = makeFileId()
      const imageSkeleton = {
        type: "image",
        x: -360,
        y: -260,
        width: fitted.width,
        height: fitted.height,
        fileId,
        status: "saved",
        scale: [1, 1],
        crop: null,
        strokeColor: "transparent",
        backgroundColor: "transparent",
        roughness: 0,
        opacity: 100,
      } satisfies ExcalidrawSkeletonElement
      const insertedElements = convertToExcalidrawElements(
        [imageSkeleton],
        { regenerateIds: true },
      )

      api.addFiles([
        {
          id: fileId,
          mimeType,
          dataURL,
          created: Date.now(),
          lastRetrieved: Date.now(),
        },
      ])
      api.updateScene({
        elements: [...api.getSceneElements(), ...insertedElements],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      })
      api.scrollToContent(insertedElements, { fitToContent: true, animate: true })
      handleToolSelect("selection")
      setCopyStatus("已导入图片")
    } catch {
      setCopyStatus("导入失败")
    } finally {
      input.value = ""
      window.setTimeout(() => setCopyStatus("PNG + 批注"), 1800)
    }
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
            <input
              ref={fileInputRef}
              className="file-input"
              type="file"
              accept="image/*"
              tabIndex={-1}
              aria-hidden="true"
              onChange={handleImageFileChange}
            />
            <button className="secondary-action" type="button" onClick={handleNewCanvas}>
              <FilePlus2 size={16} />
              新建
            </button>
            <button className="secondary-action" type="button" onClick={handleImportImageClick}>
              <ImagePlus size={16} />
              导入图片
            </button>
            <button className="secondary-action" type="button" onClick={handleDownloadPng}>
              <Download size={16} />
              导出
            </button>
            <button className="secondary-action" type="button" onClick={handleGeneratePreview}>
              <Play size={16} />
              生成预览
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
            {activeTool === "mask" ? (
              <div className="mask-swatches" aria-label="遮盖颜色">
                {maskColors.map((color) => (
                  <button
                    key={color.value}
                    className={maskColor === color.value ? "mask-swatch active" : "mask-swatch"}
                    type="button"
                    style={{ background: color.value }}
                    aria-label={`遮盖颜色 ${color.label}`}
                    title={color.label}
                    onClick={() => handleMaskColorSelect(color.value)}
                  />
                ))}
              </div>
            ) : null}
          </aside>

          <section className="canvas-shell" aria-label="白板画布">
            <Excalidraw
              initialData={initialData}
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

          <aside className="template-panel" aria-label="模板和组件">
            <div className="panel-section">
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
            </div>
            <div className="panel-section">
              <div className="panel-heading">
                <span>组件</span>
                <Component size={18} />
              </div>
              <div className="component-grid">
                {componentButtons.map((component) => {
                  const Icon = component.icon
                  return (
                    <button
                      key={component.id}
                      className="component-card"
                      type="button"
                      onClick={() => handleInsertComponent(component.id)}
                    >
                      <Icon size={20} />
                      <span>{component.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>
        </div>
      </section>
      {previewData && activePreviewState ? (
        <section className="preview-overlay" aria-label="交互预览">
          <div className="preview-window">
            <header className="preview-titlebar">
              <div className="preview-title">
                <Play size={17} />
                <span>交互预览</span>
              </div>
              <button className="preview-close" type="button" aria-label="关闭预览" onClick={closePreview}>
                <X size={18} />
              </button>
            </header>
            <div className="preview-content">
              <div className="preview-stage">
                <img className="preview-sketch" src={previewData.imageUrl} alt="当前草图预览" />
                <div className="preview-state-card">
                  <strong>{activePreviewState.title}</strong>
                  {activePreviewState.items.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
              <aside className="preview-controls" aria-label="预览交互">
                <div className="preview-control-list">
                  {previewData.states.map((state) => (
                    <button
                      key={state.id}
                      className={state.id === activePreviewState.id ? "preview-control active" : "preview-control"}
                      type="button"
                      onClick={() => setActivePreviewStateId(state.id)}
                    >
                      {state.label}
                    </button>
                  ))}
                </div>
                <button className="preview-modal-trigger" type="button" onClick={() => setPreviewModalOpen(true)}>
                  打开弹窗
                </button>
              </aside>
              {isPreviewModalOpen ? (
                <div className="generated-modal-backdrop" role="dialog" aria-label="预览弹窗">
                  <div className="generated-modal">
                    <strong>{activePreviewState.label}</strong>
                    <span>这是由草图生成的弹窗状态。</span>
                    <button type="button" onClick={() => setPreviewModalOpen(false)}>
                      关闭
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default App
