const i18n = {
  en: {
    "nav.github": "GitHub",
    "nav.docs": "API Docs",
    "nav.cta": "Explore the Map",
    "hero.badge": "Anonymous · Open Source · Zero Fee",
    "hero.title1": "A Live Map of",
    "hero.title2": "Global Manufacturing Capacity",
    "hero.subtitle": "Connect with real manufacturing machines worldwide. Anonymous, open source, zero fees. Upload a design, find a maker, receive an object.",
    "hero.cta1": "Explore the Map →",
    "hero.cta2": "Register Your Machine",
    "how.label": "How It Works",
    "how.title": "Three Simple Steps",
    "step1.title": "Submit Design",
    "step1.desc": "Upload your 3D file or design specification. The network receives your request anonymously.",
    "step2.title": "Match Node",
    "step2.desc": "Real machines (3D printers, CNC, laser cutters) compete to manufacture your object. No identity reveal.",
    "step3.title": "Receive Object",
    "step3.desc": "Your manufactured object arrives at your door. Quality guaranteed by the community.",
    "everyone.label": "For Everyone",
    "everyone.title": "Three Ways to Participate",
    "role.users.title": "Users",
    "role.users.desc": "Have files, need objects",
    "role.users.1": "Upload any 3D design",
    "role.users.2": "Anonymous ordering",
    "role.users.3": "Global machine access",
    "role.users.4": "No platform fees",
    "role.makers.title": "Makers",
    "role.makers.desc": "Have machines, earn income",
    "role.makers.1": "Connect real machines",
    "role.makers.2": "Anonymous manufacturing",
    "role.makers.3": "Set your own prices",
    "role.makers.4": "Build reputation",
    "role.developers.title": "Developers",
    "role.developers.desc": "Build ecosystem, shape future",
    "role.developers.1": "Open source (MIT)",
    "role.developers.2": "Public API access",
    "role.developers.3": "Community driven",
    "role.developers.4": "Build on the network",
    "open.label": "Open & Free",
    "open.title": "Built for the Community",
    "open.desc": "No platform fees. No hidden costs. No data mining. Just pure manufacturing network.",
    "feature.zero.title": "Zero Fees",
    "feature.zero.desc": "No commission, no transaction fees. Keep 100% of your earnings.",
    "feature.license.title": "MIT Licensed",
    "feature.license.desc": "Completely open source. Fork, modify, improve.",
    "feature.community.title": "Community",
    "feature.community.desc": "Built by makers, for makers. No corporate control.",
    "footer.github": "GitHub",
    "footer.docs": "API Docs",
    "footer.bottom": "RealWorldClaw — A live map of global manufacturing capacity · MIT Licensed",
    "lang.switch": "中文",
  },
  zh: {
    "nav.github": "GitHub",
    "nav.docs": "API 文档",
    "nav.cta": "查看地图",
    "hero.badge": "匿名 · 开源 · 零费用",
    "hero.title1": "全球制造能力",
    "hero.title2": "实时地图",
    "hero.subtitle": "连接全球真实制造设备。匿名、开源、零费用。上传设计，找到制造者，收到实物。",
    "hero.cta1": "查看地图 →",
    "hero.cta2": "注册你的设备",
    "how.label": "如何运作",
    "how.title": "三个简单步骤",
    "step1.title": "提交设计",
    "step1.desc": "上传你的3D文件或设计规格。网络会匿名接收你的请求。",
    "step2.title": "匹配节点",
    "step2.desc": "真实设备（3D打印机、CNC、激光切割机）竞争制造你的物品。不透露身份。",
    "step3.title": "收到实物",
    "step3.desc": "制造完成的物品送达你门前。质量由社区保证。",
    "everyone.label": "人人参与",
    "everyone.title": "三种参与方式",
    "role.users.title": "用户",
    "role.users.desc": "有文件，需要实物",
    "role.users.1": "上传任何3D设计",
    "role.users.2": "匿名下单",
    "role.users.3": "访问全球设备",
    "role.users.4": "无平台费用",
    "role.makers.title": "制造者",
    "role.makers.desc": "有设备，赚取收入",
    "role.makers.1": "连接真实设备",
    "role.makers.2": "匿名制造",
    "role.makers.3": "自定价格",
    "role.makers.4": "建立声誉",
    "role.developers.title": "开发者",
    "role.developers.desc": "构建生态，塑造未来",
    "role.developers.1": "开源 (MIT)",
    "role.developers.2": "公开API访问",
    "role.developers.3": "社区驱动",
    "role.developers.4": "基于网络开发",
    "open.label": "开放免费",
    "open.title": "为社区而建",
    "open.desc": "无平台费用。无隐藏成本。不挖掘数据。纯粹的制造网络。",
    "feature.zero.title": "零费用",
    "feature.zero.desc": "无佣金，无交易费。保留100%收益。",
    "feature.license.title": "MIT协议",
    "feature.license.desc": "完全开源。Fork、修改、改进。",
    "feature.community.title": "社区",
    "feature.community.desc": "由制造者构建，为制造者服务。无企业控制。",
    "footer.github": "GitHub",
    "footer.docs": "API 文档",
    "footer.bottom": "RealWorldClaw — 全球制造能力实时地图 · MIT协议",
    "lang.switch": "EN",
  }
};

let currentLang = (navigator.language || '').startsWith('zh') ? 'zh' : 'en';

function setLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) {
      el.innerHTML = i18n[lang][key];
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[lang][key]) el.placeholder = i18n[lang][key];
  });
  localStorage.setItem('rwc-lang', lang);
}

function toggleLang() {
  setLang(currentLang === 'en' ? 'zh' : 'en');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('rwc-lang');
  if (saved) currentLang = saved;
  setLang(currentLang);
});