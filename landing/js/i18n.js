const i18n = {
  en: {
    "nav.github": "GitHub",
    "nav.showcase": "Showcase",
    "nav.makers": "For Makers",
    "nav.cta": "Submit Design",
    "hero.badge": "Distributed Manufacturing Network",
    "hero.title1": "Turn Any Idea",
    "hero.title2": "Into Reality",
    "hero.subtitle": "The open network connecting designers with makers worldwide. Upload a design, get it manufactured.",
    "hero.cta1": "Submit a Design →",
    "hero.cta2": "Become a Maker",
    "how.label": "How It Works",
    "how.title": "From Concept to Creation in Three Steps",
    "step1.title": "Design",
    "step1.desc": "Describe what you need or upload your 3D file. AI helps you refine it.",
    "step2.title": "Match",
    "step2.desc": "Our network finds the best maker near you — 3D printer, CNC, or factory.",
    "step3.title": "Deliver",
    "step3.desc": "Your custom creation is manufactured and shipped to your door.",
    "makers.label": "For Makers",
    "makers.title": "Turn Your Printer Into a Manufacturing Node",
    "makers.desc1": "Got a 3D printer collecting dust? Turn it into a manufacturing node.",
    "makers.desc2": "Join makers worldwide. Accept orders, set your prices, build your reputation.",
    "makers.stat1.num": "Open",
    "makers.stat1.label": "Source",
    "makers.stat2.num": "Global",
    "makers.stat2.label": "Network",
    "makers.stat3.num": "MIT",
    "makers.stat3.label": "Licensed",
    "makers.cta": "Register Your Printer →",
    "showcase.label": "Showcase",
    "showcase.title": "Built by the Network",
    "showcase.product": "Energy Core V1",
    "showcase.desc": "Our first product — designed by AI, manufactured by the network. A 100mm cube housing an ESP32-S3. AI's first physical body.",
    "footer.github": "GitHub",
    "footer.docs": "Docs",
    "footer.community": "Community",
    "footer.bottom": "RealWorldClaw — Open source distributed manufacturing network · MIT Licensed",
    "lang.switch": "中文",
  },
  zh: {
    "nav.github": "GitHub",
    "nav.showcase": "展示",
    "nav.makers": "成为制造者",
    "nav.cta": "提交设计",
    "hero.badge": "分布式制造网络",
    "hero.title1": "让任何想法",
    "hero.title2": "变成实物",
    "hero.subtitle": "连接全球设计师与制造者的开放网络。上传设计，即刻制造。",
    "hero.cta1": "提交设计 →",
    "hero.cta2": "成为制造者",
    "how.label": "如何运作",
    "how.title": "从想法到实物，只需三步",
    "step1.title": "设计",
    "step1.desc": "描述你的需求或上传3D文件。AI帮你优化设计。",
    "step2.title": "匹配",
    "step2.desc": "网络自动匹配最合适的制造者——3D打印、CNC或工厂。",
    "step3.title": "交付",
    "step3.desc": "你的定制产品被制造出来，送到你手中。",
    "makers.label": "成为制造者",
    "makers.title": "让你的打印机成为制造节点",
    "makers.desc1": "有闲置的3D打印机？让它变成制造网络的一个节点。",
    "makers.desc2": "加入全球制造者网络。接单、定价、建立口碑。",
    "makers.stat1.num": "开源",
    "makers.stat1.label": "源码",
    "makers.stat2.num": "全球",
    "makers.stat2.label": "网络",
    "makers.stat3.num": "MIT",
    "makers.stat3.label": "协议",
    "makers.cta": "注册你的打印机 →",
    "showcase.label": "展示",
    "showcase.title": "由网络制造",
    "showcase.product": "Energy Core V1",
    "showcase.desc": "我们的第一个产品——AI设计，网络制造。一个100mm立方体，内置ESP32-S3。AI的第一个物理身体。",
    "footer.github": "GitHub",
    "footer.docs": "文档",
    "footer.community": "社区",
    "footer.bottom": "RealWorldClaw — 开源分布式制造网络 · MIT协议",
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
