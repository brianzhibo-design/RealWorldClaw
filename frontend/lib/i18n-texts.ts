/** Centralized UI text for i18n */
export const texts = {
  nav: {
    home: { en: "Home", zh: "首页" },
    modules: { en: "Modules", zh: "模块商城" },
    designs: { en: "Designs", zh: "参考设计" },
    grow: { en: "AI Growth", zh: "AI成长" },
    makers: { en: "Makers", zh: "制造者" },
    orders: { en: "Orders", zh: "订单" },
  },
  hero: {
    title1: { en: "Turn Your 3D Printer Into a", zh: "让你的3D打印机变成" },
    title2: { en: "Smart Hardware Factory", zh: "智能硬件工厂" },
    subtitle: {
      en: "Open-source modular system. Pick modules, 3D-print the structure, assemble — your AI gets a physical body.",
      zh: "开源模块化系统。选模块、打印结构件、组装——让你的AI拥有物理身体。",
    },
    cta1: { en: "Browse Modules", zh: "浏览模块" },
    cta2: { en: "See Designs", zh: "查看参考设计" },
  },
  problems: {
    title: { en: "3 Problems We Solve", zh: "我们解决的三大问题" },
    items: [
      {
        problem: { en: "AI is trapped in screens", zh: "AI被困在屏幕里" },
        solution: { en: "Give it a body with modular hardware", zh: "用模块化硬件给它一个身体" },
        icon: "🖥️→🤖",
      },
      {
        problem: { en: "Hardware is too hard for most people", zh: "硬件对大多数人太难" },
        solution: { en: "Plug-and-play modules + 3D printed structure", zh: "即插即用模块 + 3D打印结构件" },
        icon: "😰→😊",
      },
      {
        problem: { en: "3D printers collect dust after novelty fades", zh: "3D打印机新鲜感过后吃灰" },
        solution: { en: "Always new modules and designs to print", zh: "永远有新模块和设计可以打印" },
        icon: "🧹→🔥",
      },
    ],
  },
  howItWorks: {
    title: { en: "How It Works", zh: "三步上手" },
    steps: [
      { title: { en: "Pick Modules", zh: "选模块" }, desc: { en: "Choose the capabilities you want — vision, voice, mobility...", zh: "选择你想要的能力——视觉、语音、移动……" }, icon: "🧩" },
      { title: { en: "3D Print Structure", zh: "打印结构件" }, desc: { en: "Download STL files and print the body on your own printer.", zh: "下载STL文件，用你自己的打印机打印机体。" }, icon: "🖨️" },
      { title: { en: "Assemble & Connect", zh: "组装连接" }, desc: { en: "Snap modules in, flash firmware, connect to OpenClaw.", zh: "装入模块，刷固件，连接OpenClaw。" }, icon: "🔧" },
    ],
  },
  stats: {
    modules: { en: "Modules", zh: "个模块" },
    designs: { en: "Reference Designs", zh: "套参考设计" },
    makers: { en: "Makers Online", zh: "位制造者在线" },
  },
  grow: {
    title: { en: "AI Growth Journey", zh: "AI成长之旅" },
    subtitle: { en: "Watch your AI grow from nothing to a complete life form", zh: "看你的AI从无到有，成长为完整的生命体" },
    start: { en: "Start Building Your AI", zh: "开始构建你的AI" },
    totalCost: { en: "Total Cost", zh: "总花费" },
    clickToAdd: { en: "Click a module to add it", zh: "点击模块添加能力" },
    reset: { en: "Reset", zh: "重置" },
  },
  modules: {
    title: { en: "Module Store", zh: "模块商城" },
    subtitle: { en: "Each module is an organ. Together they form a complete AI body.", zh: "每个模块都是一个器官。组合在一起，构成完整的AI身体。" },
    all: { en: "All", zh: "全部" },
    viewDetails: { en: "View Details", zh: "查看详情" },
    buyNow: { en: "Buy Now", zh: "立即购买" },
    specs: { en: "Specifications", zh: "技术参数" },
    compatible: { en: "Compatible Designs", zh: "兼容的参考设计" },
    buyLinks: { en: "Where to Buy", zh: "购买链接" },
  },
  designs: {
    title: { en: "Reference Designs", zh: "参考设计" },
    subtitle: { en: "Complete blueprints — pick one, buy the modules, print & assemble.", zh: "完整蓝图——选一套，买模块，打印组装。" },
    difficulty: { en: "Difficulty", zh: "难度" },
    printTime: { en: "Print Time", zh: "打印时间" },
    alsoCanBuild: { en: "With these modules you can also build", zh: "用这套模块还能做" },
    bom: { en: "Bill of Materials", zh: "BOM清单" },
    assemblySteps: { en: "Assembly Steps", zh: "组装步骤" },
    downloadSTL: { en: "Download STL Files", zh: "下载STL文件" },
    orderPrint: { en: "Order Print from Maker", zh: "找制造者打印" },
  },
} as const;
