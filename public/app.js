const settingsKey = "gpt-image-2-settings";
const historyKey = "gpt-image-2-history";
const apiBase = "https://api.apimart.ai";
const maxReferenceImages = 16;

const sizeOptions = [
  ["auto", "自动"],
  ["1:1", "1:1 正方"],
  ["3:2", "3:2 横图"],
  ["2:3", "2:3 竖图"],
  ["4:3", "4:3 横图"],
  ["3:4", "3:4 竖图"],
  ["5:4", "5:4 横图"],
  ["4:5", "4:5 竖图"],
  ["16:9", "16:9 横图"],
  ["9:16", "9:16 竖图"],
  ["2:1", "2:1 横图"],
  ["1:2", "1:2 竖图"],
  ["21:9", "21:9 宽屏"],
  ["9:21", "9:21 长图"]
];

const promptControls = [
  { element: null, key: "style", options: ["自动", "温柔治愈", "轻性感氛围", "电影故事感", "都市时尚", "明亮吸睛", "夜色情绪", "假日旅行", "古典东方", "古风美人", "活力运动"] },
  { element: null, key: "scene", options: ["自动", "窗边", "高级卧室", "卧室", "白天卧室", "城市街头", "雨后街道", "海边", "咖啡馆", "东方庭院", "夜景街区", "影棚"] },
  { element: null, key: "outfit", options: ["自动", "白衬衫", "修身针织", "连衣裙", "修身裙装", "露背睡裙", "露背汉服", "露背短裙", "西装外套", "深色氛围服装", "新中式", "度假风", "运动风"] },
  { element: null, key: "temperament", options: ["自动", "温柔", "松弛", "清冷", "明亮", "自信", "故事感", "粉色可爱", "蓝色妖姬", "知性", "活力"] },
  { element: null, key: "body", options: ["普通曲线", "正常曲线", "丰腴曲线"] },
  { element: null, key: "line", options: ["自动", "中", "强"] },
  { element: null, key: "camera", options: ["自动", "半身近景", "半身到大腿", "全身", "侧身构图", "行走抓拍", "电影感近景", "双臂交叉趴在床上回头看向镜头", "双膝鸭子坐跪床上回眸", "站在窗边看向窗外"] }
];

const promptPresets = {
  "night-bedroom": {
    style: "夜色情绪",
    scene: "卧室",
    outfit: "露背睡裙",
    temperament: "故事感",
    body: "丰腴曲线",
    line: "强",
    camera: "双臂交叉趴在床上回头看向镜头"
  },
  "hanfu-bedroom": {
    style: "古风美人",
    scene: "卧室",
    outfit: "露背汉服",
    temperament: "粉色可爱",
    body: "丰腴曲线",
    line: "强",
    camera: "双膝鸭子坐跪床上回眸"
  },
  "window-bedroom": {
    style: "古风美人",
    scene: "白天卧室",
    outfit: "露背短裙",
    temperament: "蓝色妖姬",
    body: "丰腴曲线",
    line: "强",
    camera: "站在窗边看向窗外"
  }
};

const promptDetailMap = {
  style: {
    自动: "真实高级写真质感，画面自然、有呼吸感，兼具社交平台传播感和专业摄影完成度。",
    温柔治愈: "温柔治愈的日常写真氛围，色彩柔和，人物状态放松亲近。",
    轻性感氛围: "高级克制的女性魅力，依靠姿态、剪裁、光线和眼神表达吸引力，避免低俗暴露。",
    电影故事感: "电影剧照般的叙事感，画面像一个未说完的片段，情绪含蓄而有张力。",
    都市时尚: "都市时尚杂志感，造型利落，画面干净，人物自信而现代。",
    明亮吸睛: "明亮清透的吸睛风格，高级但不夸张，第一眼有明确记忆点。",
    夜色情绪: "夜色氛围与情绪光影，画面有轻微故事感和安静张力。",
    假日旅行: "假日旅行写真感，空气轻盈，姿态自然，画面带一点阳光和自由感。",
    古典东方: "古典东方审美，气质含蓄优雅，画面克制、细腻、有东方韵味。",
    古风美人: "古风美人写真感，东方古典审美与真实摄影质感结合，气质柔美但不俗艳。",
    活力运动: "活力运动写真感，身体线条健康自然，状态明亮、有能量。"
  },
  scene: {
    自动: "场景与人物风格自然匹配，不喧宾夺主。",
    窗边: "窗边自然光环境，背景简洁，光线落在面部、肩颈和上半身轮廓。",
    高级卧室: "高级卧室空间，床品与软装简洁精致，氛围私密但克制。",
    卧室: "卧室场景，床品和室内软装真实自然，氛围私密、柔和且高级。",
    白天卧室: "白天卧室场景，自然光从窗边进入，空间清透明亮，床品与窗帘细节真实。",
    城市街头: "城市街头环境，街景虚化，人物像被自然捕捉的时尚瞬间。",
    雨后街道: "雨后街道，地面反光与湿润空气营造电影质感。",
    海边: "海边开阔场景，风吹动发丝和衣料，画面清透自然。",
    咖啡馆: "咖啡馆室内环境，暖色灯光与窗外街景形成生活化高级感。",
    东方庭院: "东方庭院，木质、石阶、绿植或屏风元素点到为止。",
    夜景街区: "夜景街区，霓虹和城市灯光作为背景氛围，人物清晰突出。",
    影棚: "专业影棚布光，背景干净，强调人物轮廓和质感。"
  },
  outfit: {
    自动: "服装贴合人物气质，剪裁自然，面料有真实纹理。",
    白衬衫: "白衬衫造型，干净清爽，领口、袖口和面料褶皱真实自然。",
    修身针织: "修身针织服装，柔软面料贴合身体线条，表达克制的曲线感。",
    连衣裙: "连衣裙造型，裙摆和腰线自然，整体优雅轻盈。",
    修身裙装: "修身裙装，强调腰臀比例和整体轮廓，但保持高级得体。",
    露背睡裙: "露背睡裙造型，面料柔软有垂坠，背部线条和肩颈轮廓清晰，表达高级克制的卧室写真氛围。",
    露背汉服: "露背汉服造型，古典元素与露背剪裁结合，面料层次细腻，突出肩背和腰线但保持得体。",
    露背短裙: "露背短裙造型，剪裁轻盈，背部、腰线和腿部比例自然呈现，整体清爽不低俗。",
    西装外套: "西装外套搭配，利落知性，肩线清晰，造型有都市感。",
    深色氛围服装: "深色氛围服装，面料有层次，强化光影与身体轮廓。",
    新中式: "新中式服装，盘扣、立领或丝质纹理细节克制出现。",
    度假风: "度假风穿搭，轻盈面料、自然垂坠和放松姿态。",
    运动风: "运动风造型，健康利落，强调身体活力和自然线条。"
  },
  temperament: {
    自动: "人物气质自然鲜明，不僵硬不模板化。",
    温柔: "温柔亲和，眼神柔和，面部表情放松。",
    松弛: "松弛自然，像真实拍摄中的随性瞬间。",
    清冷: "清冷克制，表情安静，气质疏离但有吸引力。",
    明亮: "明亮鲜活，眼神清透，画面有轻盈感。",
    自信: "自信从容，姿态稳定，眼神坚定。",
    故事感: "带有故事感的眼神和姿态，像正在经历某个片刻。",
    粉色可爱: "粉色可爱的气质方向，柔软甜美但保持成年女性的高级写真感。",
    蓝色妖姬: "蓝色妖姬般的冷艳气质，色彩和眼神带一点神秘感，氛围清冷吸睛。",
    知性: "知性优雅，表达成熟审美和安静力量。",
    活力: "活力自然，身体状态轻盈，有运动感和生命力。"
  },
  body: {
    普通曲线: "身体比例协调自然，曲线真实不过度夸张。",
    正常曲线: "自然女性曲线，腰线、肩颈和腿部比例清晰协调。",
    丰腴曲线: "成熟丰腴、自然协调的曲线型身材，胸部轮廓清晰但表现克制得体，腰线和臀腿曲线流畅。"
  },
  line: {
    自动: "线条重点根据构图自然呈现。",
    中: "适度强调肩颈线、锁骨线、腰线、胸腰关系和整体身体轮廓。",
    强: "明确强调肩颈、锁骨、上半身轮廓、腰胯转折、腿部比例和整体 S 型身姿，但保持真实高级。"
  },
  camera: {
    自动: "镜头自然选择最适合人物与场景的构图。",
    半身近景: "半身近景构图，突出面部、眼神、肩颈和上半身线条。",
    半身到大腿: "半身到大腿构图，兼顾面部表现、腰线和腿部比例。",
    全身: "全身构图，展示完整姿态、服装和场景关系。",
    侧身构图: "侧身构图，突出肩颈、腰胯转折和自然 S 型身姿。",
    行走抓拍: "行走抓拍视角，姿态自然有重心变化，画面像真实摄影瞬间。",
    电影感近景: "电影感近景，浅景深，面部和眼神是视觉中心。",
    双臂交叉趴在床上回头看向镜头: "双臂交叉趴在床上，身体重心自然落下，回头看向镜头，突出眼神、肩背线条、腰胯转折和卧室氛围。",
    双膝鸭子坐跪床上回眸: "双膝鸭子坐跪在床上，姿态自然稳定，回眸看向镜头，突出肩颈、背部线条、腰线和古典柔美气质。",
    站在窗边看向窗外: "站在窗边看向窗外，身体自然转向光源，突出侧面轮廓、肩颈线、腰线和窗边自然光。"
  }
};

const pixelMap = {
  "1:1": { "1k": "1024 x 1024", "2k": "2048 x 2048" },
  "3:2": { "1k": "1536 x 1024", "2k": "2048 x 1360" },
  "2:3": { "1k": "1024 x 1536", "2k": "1360 x 2048" },
  "4:3": { "1k": "1024 x 768", "2k": "2048 x 1536" },
  "3:4": { "1k": "768 x 1024", "2k": "1536 x 2048" },
  "5:4": { "1k": "1280 x 1024", "2k": "2560 x 2048" },
  "4:5": { "1k": "1024 x 1280", "2k": "2048 x 2560" },
  "16:9": { "1k": "1536 x 864", "2k": "2048 x 1152", "4k": "3840 x 2160" },
  "9:16": { "1k": "864 x 1536", "2k": "1152 x 2048", "4k": "2160 x 3840" },
  "2:1": { "1k": "2048 x 1024", "2k": "2688 x 1344", "4k": "3840 x 1920" },
  "1:2": { "1k": "1024 x 2048", "2k": "1344 x 2688", "4k": "1920 x 3840" },
  "21:9": { "1k": "2016 x 864", "2k": "2688 x 1152", "4k": "3840 x 1648" },
  "9:21": { "1k": "864 x 2016", "2k": "1152 x 2688", "4k": "1648 x 3840" }
};

const form = document.querySelector("#generateForm");
const apiKey = document.querySelector("#apiKey");
const toggleKey = document.querySelector("#toggleKey");
const promptInput = document.querySelector("#prompt");
const sizeSelect = document.querySelector("#size");
const resolutionSelect = document.querySelector("#resolution");
const countInput = document.querySelector("#count");
const officialFallback = document.querySelector("#officialFallback");
const imageUrls = document.querySelector("#imageUrls");
const imageFiles = document.querySelector("#imageFiles");
const fileList = document.querySelector("#fileList");
const pixelSize = document.querySelector("#pixelSize");
const modeLabel = document.querySelector("#modeLabel");
const submitButton = document.querySelector("#submitButton");
const taskTitle = document.querySelector("#taskTitle");
const statusPill = document.querySelector("#statusPill");
const taskIdInput = document.querySelector("#taskIdInput");
const queryButton = document.querySelector("#queryButton");
const pollCountdown = document.querySelector("#pollCountdown");
const progressBar = document.querySelector("#progressBar");
const progressText = document.querySelector("#progressText");
const imageStage = document.querySelector("#imageStage");
const actualTime = document.querySelector("#actualTime");
const cost = document.querySelector("#cost");
const expiresAt = document.querySelector("#expiresAt");
const responseJson = document.querySelector("#responseJson");
const copyJson = document.querySelector("#copyJson");
const promptHelperOpen = document.querySelector("#promptHelperOpen");
const promptHelperXiaOpen = document.querySelector("#promptHelperXiaOpen");
const promptHelperModal = document.querySelector("#promptHelperModal");
const promptHelperClose = document.querySelector("#promptHelperClose");
const promptHelperOutput = document.querySelector("#promptHelperOutput");
const promptStyle = document.querySelector("#promptStyle");
const promptScene = document.querySelector("#promptScene");
const promptOutfit = document.querySelector("#promptOutfit");
const promptTemperament = document.querySelector("#promptTemperament");
const promptBody = document.querySelector("#promptBody");
const promptLine = document.querySelector("#promptLine");
const promptCamera = document.querySelector("#promptCamera");
const promptRandomize = document.querySelector("#promptRandomize");
const promptCopy = document.querySelector("#promptCopy");
const promptUse = document.querySelector("#promptUse");
const generatorTab = document.querySelector("#generatorTab");
const historyTab = document.querySelector("#historyTab");
const videoTab = document.querySelector("#videoTab");
const generatorView = document.querySelector("#generatorView");
const historyView = document.querySelector("#historyView");
const videoView = document.querySelector("#videoView");
const historySearch = document.querySelector("#historySearch");
const clearHistory = document.querySelector("#clearHistory");
const historyCount = document.querySelector("#historyCount");
const historyImageCount = document.querySelector("#historyImageCount");
const historyCost = document.querySelector("#historyCost");
const historyEmpty = document.querySelector("#historyEmpty");
const historyGrid = document.querySelector("#historyGrid");
const previewModal = document.querySelector("#previewModal");
const previewPrev = document.querySelector("#previewPrev");
const previewNext = document.querySelector("#previewNext");
const previewTitle = document.querySelector("#previewTitle");
const previewCounter = document.querySelector("#previewCounter");
const previewOpen = document.querySelector("#previewOpen");
const previewClose = document.querySelector("#previewClose");
const previewStage = document.querySelector("#previewStage");
const previewImage = document.querySelector("#previewImage");
const videoForm = document.querySelector("#videoForm");
const videoApiKey = document.querySelector("#videoApiKey");
const videoPrompt = document.querySelector("#videoPrompt");
const videoModel = document.querySelector("#videoModel");
const videoSize = document.querySelector("#videoSize");
const videoResolution = document.querySelector("#videoResolution");
const videoDuration = document.querySelector("#videoDuration");
const videoSeed = document.querySelector("#videoSeed");
const videoGenerateAudio = document.querySelector("#videoGenerateAudio");
const videoReturnLastFrame = document.querySelector("#videoReturnLastFrame");
const videoWebSearch = document.querySelector("#videoWebSearch");
const videoImageUrls = document.querySelector("#videoImageUrls");
const videoFirstFrame = document.querySelector("#videoFirstFrame");
const videoLastFrame = document.querySelector("#videoLastFrame");
const videoUrls = document.querySelector("#videoUrls");
const videoAudioUrls = document.querySelector("#videoAudioUrls");
const videoTaskIdInput = document.querySelector("#videoTaskIdInput");
const videoQueryButton = document.querySelector("#videoQueryButton");
const videoPollCountdown = document.querySelector("#videoPollCountdown");
const videoSubmitButton = document.querySelector("#videoSubmitButton");
const videoStatusPill = document.querySelector("#videoStatusPill");
const videoProgressBar = document.querySelector("#videoProgressBar");
const videoProgressText = document.querySelector("#videoProgressText");
const videoStage = document.querySelector("#videoStage");
const videoResponseJson = document.querySelector("#videoResponseJson");
const copyVideoJson = document.querySelector("#copyVideoJson");

let pollTimer = 0;
let countdownTimer = 0;
let nextPollAt = 0;
let videoPollTimer = 0;
let videoCountdownTimer = 0;
let videoNextPollAt = 0;
let latestJson = {};
let latestVideoJson = {};
let latestSubmission = null;
let previewImages = [];
let previewIndex = 0;
const localImageSaves = new Map();
const localVideoSaves = new Map();
const selectedReferenceFiles = [];

const savedSettings = readJson(settingsKey, {});

function bindPromptControls() {
  const elements = {
    style: promptStyle,
    scene: promptScene,
    outfit: promptOutfit,
    temperament: promptTemperament,
    body: promptBody,
    line: promptLine,
    camera: promptCamera
  };

  promptControls.forEach((control) => {
    control.element = elements[control.key];
    control.element.innerHTML = "";
    control.options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      control.element.append(option);
    });
    control.element.addEventListener("change", updatePromptHelperOutput);
  });
}

function chooseOption(options) {
  const available = options.filter((item) => item !== "自动");
  return available[Math.floor(Math.random() * available.length)] || options[0];
}

function randomizePromptControls() {
  promptControls.forEach((control) => {
    control.element.value = chooseOption(control.options);
  });
  updatePromptHelperOutput();
}

function applyPromptPreset(presetKey) {
  const preset = promptPresets[presetKey];
  if (!preset) return;
  promptControls.forEach((control) => {
    control.element.value = preset[control.key] || control.element.value;
  });
  updatePromptHelperOutput();
}

function getPromptSelections() {
  return Object.fromEntries(promptControls.map((control) => [control.key, control.element.value]));
}

function detail(key, value) {
  return promptDetailMap[key]?.[value] || value;
}

function buildPromptText(values) {
  return [
    `年轻成年东方女性高级写真，视觉年龄约 20-26 岁，真实摄影质感，人物美丽清透、有吸引力，五官具有明确东方女性特征，避免欧美混血感、年龄偏大或未成年感。${detail("style", values.style)}`,
    `${detail("scene", values.scene)}${detail("outfit", values.outfit)}${detail("temperament", values.temperament)}`,
    `${detail("body", values.body)}${detail("line", values.line)}姿态自然放松，有真实重心变化，避免僵硬站姿；根据整体风格形成自然或明显的 S 型身姿，身体比例协调，不夸张变形，不低俗。`,
    `${detail("camera", values.camera)}构图具有高级写真感和真实摄影感，强调第一眼吸睛点：清晰眼神、自然面部表情、肩颈线、锁骨线、上半身轮廓、腰线、腰胯转折、腿部比例和整体身体轮廓。`,
    "光线自然细腻，皮肤质感真实，服装面料和环境细节清晰，背景不喧宾夺主。整体画面不是普通自拍，也不是廉价影楼照，而是一张高级、克制、真实、适合社交平台传播的人像作品。"
  ].join("\n\n");
}

function updatePromptHelperOutput() {
  promptHelperOutput.value = buildPromptText(getPromptSelections());
}

function openPromptHelper() {
  promptHelperModal.hidden = false;
  document.body.classList.add("prompt-helper-open");
  if (!promptHelperOutput.value.trim()) {
    randomizePromptControls();
  } else {
    updatePromptHelperOutput();
  }
}

function openXiaPromptHelper() {
  openPromptHelper();
}

function closePromptHelper() {
  promptHelperModal.hidden = true;
  document.body.classList.remove("prompt-helper-open");
}

sizeOptions.forEach(([value, label]) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  sizeSelect.append(option);
});

sizeSelect.value = savedSettings.size || "16:9";
resolutionSelect.value = savedSettings.resolution || "2k";
apiKey.value = savedSettings.api_key || "";
videoApiKey.value = savedSettings.api_key || "";
promptInput.value = savedSettings.prompt || "";
officialFallback.checked = Boolean(savedSettings.official_fallback);
imageUrls.value = savedSettings.image_urls || "";
videoPrompt.value = savedSettings.video_prompt || "";
videoModel.value = savedSettings.video_model || "doubao-seedance-2.0";
videoSize.value = savedSettings.video_size || "16:9";
videoResolution.value = savedSettings.video_resolution || "720p";
videoDuration.value = savedSettings.video_duration || "5";
videoImageUrls.value = savedSettings.video_image_urls || "";
videoFirstFrame.value = savedSettings.video_first_frame || "";
videoLastFrame.value = savedSettings.video_last_frame || "";
videoUrls.value = savedSettings.video_urls || "";
videoAudioUrls.value = savedSettings.video_audio_urls || "";
videoGenerateAudio.checked = Boolean(savedSettings.video_generate_audio);
videoReturnLastFrame.checked = Boolean(savedSettings.video_return_last_frame);
videoWebSearch.checked = Boolean(savedSettings.video_web_search);

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function saveSettings() {
  localStorage.setItem(
    settingsKey,
    JSON.stringify({
      api_key: apiKey.value,
      prompt: promptInput.value,
      size: sizeSelect.value,
      resolution: resolutionSelect.value,
      official_fallback: officialFallback.checked,
      image_urls: imageUrls.value,
      video_prompt: videoPrompt.value,
      video_model: videoModel.value,
      video_size: videoSize.value,
      video_resolution: videoResolution.value,
      video_duration: videoDuration.value,
      video_image_urls: videoImageUrls.value,
      video_first_frame: videoFirstFrame.value,
      video_last_frame: videoLastFrame.value,
      video_urls: videoUrls.value,
      video_audio_urls: videoAudioUrls.value,
      video_generate_audio: videoGenerateAudio.checked,
      video_return_last_frame: videoReturnLastFrame.checked,
      video_web_search: videoWebSearch.checked
    })
  );
}

function readHistory() {
  const history = readJson(historyKey, []);
  return Array.isArray(history) ? history : [];
}

function writeHistory(history) {
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 200)));
}

function setView(view, { updateHash = true } = {}) {
  const showHistory = view === "history";
  const showVideo = view === "video";
  generatorView.hidden = showHistory || showVideo;
  historyView.hidden = !showHistory;
  videoView.hidden = !showVideo;
  generatorTab.classList.toggle("active", !showHistory && !showVideo);
  historyTab.classList.toggle("active", showHistory);
  videoTab.classList.toggle("active", showVideo);
  if (updateHash) {
    history.replaceState(null, "", showVideo ? "#video" : showHistory ? "#history" : "#generate");
  }
  if (showHistory) {
    renderHistory();
  }
}

function setJson(payload) {
  latestJson = payload;
  responseJson.textContent = JSON.stringify(payload, null, 2);
}

function setStatus(status, label = status) {
  statusPill.className = `status-pill ${status}`;
  statusPill.textContent = label;
}

function setProgress(value, label) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));
  progressBar.style.width = `${progress}%`;
  progressText.textContent = label;
}

function setCountdownText(text) {
  pollCountdown.textContent = text;
}

function clearPollTimers() {
  clearTimeout(pollTimer);
  clearInterval(countdownTimer);
  pollTimer = 0;
  countdownTimer = 0;
  nextPollAt = 0;
}

function updateCountdown() {
  if (!nextPollAt) {
    setCountdownText("未轮询");
    return;
  }

  const seconds = Math.max(0, Math.ceil((nextPollAt - Date.now()) / 1000));
  setCountdownText(seconds ? `${seconds}s 后自动查询` : "正在查询");
}

function showError(error, payload = {}) {
  const message = error?.message || payload?.error?.message || "请求失败。";
  setStatus("failed", "Failed");
  taskTitle.textContent = message;
  setProgress(0, "失败");
  setJson(payload.error ? payload : { error: { message } });
}

function resetResult() {
  clearPollTimers();
  setCountdownText("未轮询");
  imageStage.innerHTML = "<span>生成完成后图片会显示在这里</span>";
  actualTime.textContent = "-";
  cost.textContent = "-";
  expiresAt.textContent = "-";
}

function isSizeSupported(size, resolution) {
  if (size === "auto") return resolution !== "4k";
  return Boolean(pixelMap[size]?.[resolution]);
}

function updatePixelReadout() {
  const size = sizeSelect.value;
  const resolution = resolutionSelect.value;
  const urlCount = readUrlInputs().length;
  const fileCount = selectedReferenceFiles.length;
  const referenceCount = urlCount + fileCount;
  const supported = isSizeSupported(size, resolution);

  if (size === "auto") {
    pixelSize.textContent = resolution === "4k" ? "4K 不支持 auto" : "服务端自动选择";
  } else {
    pixelSize.textContent = pixelMap[size]?.[resolution] || "该组合不可用";
  }

  modeLabel.textContent = referenceCount ? `图生图 · ${referenceCount} 张参考图` : "文生图";
  submitButton.disabled = !supported;
  submitButton.textContent = supported ? "提交生成任务" : "当前比例不支持 4K";
}

function readUrlInputs() {
  return imageUrls.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderFileList() {
  fileList.innerHTML = "";

  if (!selectedReferenceFiles.length) {
    updatePixelReadout();
    return;
  }

  selectedReferenceFiles.slice(0, maxReferenceImages).forEach((file, index) => {
    const item = document.createElement("div");
    const name = document.createElement("span");
    const removeButton = document.createElement("button");

    item.className = "file-item";
    name.textContent = `${index + 1}. ${file.name}`;
    removeButton.type = "button";
    removeButton.className = "file-remove";
    removeButton.dataset.removeReferenceIndex = String(index);
    removeButton.textContent = "删除";
    removeButton.ariaLabel = `删除参考图 ${file.name}`;

    item.append(name, removeButton);
    fileList.append(item);
  });

  if (selectedReferenceFiles.length > maxReferenceImages) {
    const item = document.createElement("span");
    item.textContent = `还有 ${selectedReferenceFiles.length - maxReferenceImages} 个文件未显示`;
    fileList.append(item);
  }

  updatePixelReadout();
}

function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`读取文件失败：${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function collectReferenceImages() {
  const urls = readUrlInputs();
  const files = selectedReferenceFiles;
  const total = urls.length + files.length;

  if (total > maxReferenceImages) {
    throw new Error(`参考图最多 ${maxReferenceImages} 张，请减少 URL 或上传文件数量。`);
  }

  const dataUris = await Promise.all(files.map(fileToDataUri));
  return [...urls, ...dataUris];
}

function addReferenceFiles(files) {
  files.forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    const duplicate = selectedReferenceFiles.some((item) => (
      item.name === file.name &&
      item.size === file.size &&
      item.lastModified === file.lastModified
    ));
    if (!duplicate && selectedReferenceFiles.length < maxReferenceImages) {
      selectedReferenceFiles.push(file);
    }
  });
  imageFiles.value = "";
  renderFileList();
}

function removeReferenceFile(index) {
  selectedReferenceFiles.splice(index, 1);
  renderFileList();
}

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    const message = payload?.error?.message || `HTTP ${response.status}`;
    const error = new Error(message);
    error.payload = payload;
    throw error;
  }
  return payload;
}

function authHeaders(source = apiKey) {
  const token = source.value.trim();
  if (!token) {
    throw new Error("请先填写 APIMart API Key。");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

function currentGenerationMeta(references = []) {
  return {
    prompt: promptInput.value.trim(),
    size: sizeSelect.value,
    resolution: resolutionSelect.value,
    mode: references.length ? "图生图" : "文生图",
    reference_count: references.length,
    official_fallback: officialFallback.checked
  };
}

async function submitGeneration(event) {
  event.preventDefault();
  resetResult();
  saveSettings();
  setStatus("processing", "Submitting");
  taskTitle.textContent = "正在提交任务";
  setProgress(8, "提交中");
  submitButton.disabled = true;

  try {
    const references = await collectReferenceImages();
    latestSubmission = currentGenerationMeta(references);
    const payload = {
      model: "gpt-image-2",
      prompt: latestSubmission.prompt,
      n: Number(countInput.value) || 1,
      size: latestSubmission.size,
      resolution: latestSubmission.resolution,
      official_fallback: latestSubmission.official_fallback
    };

    if (references.length) {
      payload.image_urls = references;
    }

    const response = await fetch(`${apiBase}/v1/images/generations`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await readResponse(response);
    setJson(data);

    const taskId = data?.data?.[0]?.task_id || data?.data?.id || data?.data?.task_id;
    if (!taskId) {
      throw new Error("提交成功但响应中没有 task_id。");
    }

    latestSubmission.task_id = taskId;
    taskIdInput.value = taskId;
    taskTitle.textContent = taskId;
    setStatus("submitted", "Submitted");
    setProgress(12, "已提交，10 秒后开始轮询");
    startPolling(taskId, 10000);
  } catch (error) {
    showError(error, error.payload);
  } finally {
    updatePixelReadout();
  }
}

async function queryTask(taskId, { keepPolling = false } = {}) {
  const response = await fetch(`${apiBase}/v1/tasks/${encodeURIComponent(taskId)}`, {
    headers: authHeaders()
  });
  const data = await readResponse(response);
  setJson(data);
  await renderTask(data);

  const status = data?.data?.status;
  if (keepPolling && status !== "completed" && status !== "failed") {
    startPolling(taskId, 4000);
  } else {
    clearPollTimers();
    setCountdownText(status === "completed" ? "已完成" : status === "failed" ? "已失败" : "未轮询");
  }
}

function startPolling(taskId, delay) {
  clearPollTimers();
  nextPollAt = Date.now() + delay;
  updateCountdown();
  countdownTimer = window.setInterval(updateCountdown, 250);
  pollTimer = window.setTimeout(() => {
    clearInterval(countdownTimer);
    countdownTimer = 0;
    setCountdownText("正在查询");
    queryTask(taskId, { keepPolling: true }).catch(handleQueryError);
  }, delay);
}

function handleQueryError(error) {
  clearPollTimers();
  setCountdownText("查询失败");
  showError(error, error.payload);
}

async function saveImagesLocally(taskId, images) {
  if (!taskId || !images.length) return images;

  if (!localImageSaves.has(taskId)) {
    localImageSaves.set(
      taskId,
      postImagesForLocalSave(taskId, images)
        .finally(() => localImageSaves.delete(taskId))
    );
  }

  return localImageSaves.get(taskId);
}

async function postImagesForLocalSave(taskId, images) {
  let dataUriError = null;
  try {
    const dataUris = await Promise.all(images.map(fetchImageAsDataUri));
    const payload = await postImageSaveRequest(taskId, dataUris);
    return payload.images.map((item) => item.url);
  } catch (error) {
    dataUriError = error;
  }

  try {
    const payload = await postImageSaveRequest(taskId, images);
    return payload.images.map((item) => item.url);
  } catch (error) {
    throw dataUriError || error;
  }
}

async function postImageSaveRequest(taskId, images) {
  const response = await fetch("/api/images/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId, images })
  });
  return readResponse(response);
}

async function saveVideosLocally(taskId, videos) {
  if (!taskId || !videos.length) return videos;

  if (!localVideoSaves.has(taskId)) {
    localVideoSaves.set(
      taskId,
      postVideoSaveRequest(taskId, videos)
        .finally(() => localVideoSaves.delete(taskId))
    );
  }

  return localVideoSaves.get(taskId);
}

async function postVideoSaveRequest(taskId, videos) {
  const response = await fetch("/api/videos/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId, videos })
  });
  const payload = await readResponse(response);
  return payload.videos.map((item) => item.url);
}

function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("读取图片数据失败"));
    reader.readAsDataURL(blob);
  });
}

async function fetchImageAsDataUri(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`浏览器下载图片失败：HTTP ${response.status}`);
  }
  return blobToDataUri(await response.blob());
}

function updateStageImageUrls(images) {
  imageStage.querySelectorAll("figure").forEach((figure, index) => {
    const url = images[index];
    const img = figure.querySelector("img");
    const link = figure.querySelector("a");
    if (url && img) img.src = url;
    if (url && link) link.href = url;
  });
}

function updateStageVideoUrls(videos) {
  videoStage.querySelectorAll("video").forEach((video, index) => {
    const url = videos[index];
    const figure = video.closest("figure");
    const link = figure?.querySelector("a");
    if (url) video.src = url;
    if (url && link) link.href = url;
  });
}

function saveCompletedImagesInBackground(task, originalImages, firstExpiry) {
  const taskId = task.id || taskIdInput.value.trim();
  if (!taskId || !originalImages.length || task.local_images?.length) return;

  setProgress(100, "生成完成，后台保存到 images/");
  saveImagesLocally(taskId, originalImages)
    .then((localImages) => {
      updateStageImageUrls(localImages);
      upsertHistory(task, originalImages, firstExpiry, localImages);
      setProgress(100, `已保存到 images/ (${localImages.length} 张)`);
      setJson({
        ...latestJson,
        data: {
          ...latestJson.data,
          local_images: localImages
        }
      });
    })
    .catch((error) => {
      setProgress(100, "生成完成，本地保存失败");
      setJson({ ...latestJson, local_save_error: error?.message || "Failed to save images locally" });
    });
}

function saveCompletedVideosInBackground(task, originalVideos) {
  const taskId = task.id || videoTaskIdInput.value.trim();
  if (!taskId || !originalVideos.length || task.local_videos?.length) return;

  setTaskUi(videoStatusPill, videoProgressBar, videoProgressText, "completed", 100, "生成完成，后台保存到 videos/");
  saveVideosLocally(taskId, originalVideos)
    .then((localVideos) => {
      updateStageVideoUrls(localVideos);
      setTaskUi(videoStatusPill, videoProgressBar, videoProgressText, "completed", 100, `已保存到 videos/ (${localVideos.length} 个)`);
      setVideoJson({
        ...latestVideoJson,
        data: {
          ...latestVideoJson.data,
          local_videos: localVideos
        }
      });
    })
    .catch((error) => {
      setTaskUi(videoStatusPill, videoProgressBar, videoProgressText, "completed", 100, "生成完成，本地保存失败");
      setVideoJson({ ...latestVideoJson, local_video_save_error: error?.message || "Failed to save videos locally" });
    });
}

function renderTask(payload) {
  const task = payload.data || {};
  const status = task.status || "submitted";
  const progress = typeof task.progress === "number" ? task.progress : status === "completed" ? 100 : 30;

  taskTitle.textContent = task.id || taskIdInput.value || "任务";
  setStatus(status, status[0]?.toUpperCase() + status.slice(1));
  setProgress(progress, status === "completed" ? "生成完成" : `${progress}%`);

  actualTime.textContent = task.actual_time ? `${task.actual_time}s` : "-";
  cost.textContent = typeof task.cost === "number" ? task.cost.toFixed(5) : "-";

  const images = (task.result?.images || []).flatMap((item) => item.local_url || item.url || []);
  const originalImages = (task.result?.images || []).flatMap((item) => item.url || []);
  const firstExpiry = task.result?.images?.[0]?.expires_at;
  expiresAt.textContent = firstExpiry ? formatUnixTime(firstExpiry) : "-";

  if (status === "failed") {
    imageStage.innerHTML = `<span>${task.error?.message || "任务失败"}</span>`;
    return;
  }

  if (!images.length) {
    imageStage.innerHTML = "<span>任务处理中</span>";
    return;
  }

  imageStage.innerHTML = "";
  images.forEach((url, index) => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    const link = document.createElement("a");

    img.src = url;
    img.alt = `生成结果 ${index + 1}`;
    img.dataset.previewIndex = String(index);
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "打开原图";

    figure.append(img, link);
    imageStage.append(figure);
  });

  if (status === "completed") {
    const localImages = task.local_images?.length ? task.local_images : images;
    upsertHistory(task, originalImages, firstExpiry, localImages);
    saveCompletedImagesInBackground(task, originalImages, firstExpiry);
  }
}

function upsertHistory(task, images, expiresAtValue, localImages = images) {
  const taskId = task.id || taskIdInput.value.trim();
  if (!taskId || !images.length) return;

  const history = readHistory();
  const existing = history.find((item) => item.task_id === taskId);
  const promptMeta = latestSubmission?.task_id === taskId ? latestSubmission : existing || currentGenerationMeta();
  const record = {
    task_id: taskId,
    prompt: promptMeta.prompt || "",
    size: promptMeta.size || sizeSelect.value,
    resolution: promptMeta.resolution || resolutionSelect.value,
    mode: promptMeta.mode || "未知",
    reference_count: promptMeta.reference_count || 0,
    images,
    local_images: localImages,
    cost: typeof task.cost === "number" ? task.cost : existing?.cost ?? null,
    actual_time: task.actual_time || existing?.actual_time || null,
    created: task.created || existing?.created || null,
    completed: task.completed || existing?.completed || Math.floor(Date.now() / 1000),
    expires_at: expiresAtValue || existing?.expires_at || null,
    saved_at: existing?.saved_at || Date.now()
  };

  const nextHistory = [record, ...history.filter((item) => item.task_id !== taskId)];
  writeHistory(nextHistory);
  renderHistory();
}

function renderHistory() {
  const term = historySearch.value.trim().toLowerCase();
  const history = readHistory();
  const filtered = history.filter((item) => {
    if (!term) return true;
    return `${item.task_id} ${item.prompt}`.toLowerCase().includes(term);
  });

  const totalImages = history.reduce((sum, item) => sum + item.images.length, 0);
  const totalCost = history.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  historyCount.textContent = String(history.length);
  historyImageCount.textContent = String(totalImages);
  historyCost.textContent = totalCost ? totalCost.toFixed(5) : "-";

  historyGrid.innerHTML = "";
  historyEmpty.hidden = filtered.length > 0;

  filtered.forEach((item) => {
    const displayImages = item.local_images?.length ? item.local_images : item.images;
    const card = document.createElement("article");
    card.className = "history-card";

    const preview = document.createElement("div");
    preview.className = "history-preview";
    displayImages.slice(0, 4).forEach((url, index) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = `${item.task_id} 结果 ${index + 1}`;
      img.dataset.historyTask = item.task_id;
      img.dataset.previewIndex = String(index);
      preview.append(img);
    });

    const body = document.createElement("div");
    body.className = "history-body";

    const title = document.createElement("div");
    title.className = "history-card-title";
    const id = document.createElement("strong");
    id.textContent = item.task_id;
    const badge = document.createElement("span");
    badge.textContent = `${item.mode} · ${item.size} · ${String(item.resolution).toUpperCase()}`;
    title.append(id, badge);

    const prompt = document.createElement("p");
    prompt.textContent = item.prompt || "未保存 prompt";

    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.append(
      makeMeta("保存", formatDateTime(item.saved_at)),
      makeMeta("耗时", item.actual_time ? `${item.actual_time}s` : "-"),
      makeMeta("费用", typeof item.cost === "number" ? item.cost.toFixed(5) : "-"),
      makeMeta("有效期", item.expires_at ? formatUnixTime(item.expires_at) : "-")
    );

    const actions = document.createElement("div");
    actions.className = "history-card-actions";

    const openLink = document.createElement("a");
    openLink.className = "ghost-button";
    openLink.href = displayImages[0];
    openLink.target = "_blank";
    openLink.rel = "noreferrer";
    openLink.textContent = "打开原图";

    const copyButton = document.createElement("button");
    copyButton.className = "ghost-button";
    copyButton.type = "button";
    copyButton.dataset.copyUrl = displayImages[0];
    copyButton.textContent = "复制链接";

    const queryAgain = document.createElement("button");
    queryAgain.className = "ghost-button";
    queryAgain.type = "button";
    queryAgain.dataset.queryTask = item.task_id;
    queryAgain.textContent = "重新查询";

    const deleteButton = document.createElement("button");
    deleteButton.className = "ghost-button danger-button";
    deleteButton.type = "button";
    deleteButton.dataset.deleteTask = item.task_id;
    deleteButton.textContent = "删除";

    actions.append(openLink, copyButton, queryAgain, deleteButton);
    body.append(title, prompt, meta, actions);
    card.append(preview, body);
    historyGrid.append(card);
  });
}

function openPreview(images, index = 0, title = "图片预览") {
  previewImages = images.filter(Boolean);
  if (!previewImages.length) return;
  previewIndex = Math.max(0, Math.min(index, previewImages.length - 1));
  previewTitle.textContent = title;
  previewModal.hidden = false;
  document.body.classList.add("preview-open");
  renderPreview();
}

function closePreview() {
  previewModal.hidden = true;
  previewImage.removeAttribute("src");
  document.body.classList.remove("preview-open");
}

function renderPreview() {
  const url = previewImages[previewIndex];
  previewImage.src = url;
  previewOpen.href = url;
  previewCounter.textContent = `${previewIndex + 1} / ${previewImages.length}`;
  previewPrev.disabled = previewImages.length < 2;
  previewNext.disabled = previewImages.length < 2;
}

function movePreview(offset) {
  if (previewModal.hidden || previewImages.length < 2) return;
  previewIndex = (previewIndex + offset + previewImages.length) % previewImages.length;
  renderPreview();
}

function makeMeta(label, value) {
  const item = document.createElement("div");
  const key = document.createElement("span");
  const text = document.createElement("strong");
  key.textContent = label;
  text.textContent = value;
  item.append(key, text);
  return item;
}

function formatUnixTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value * 1000));
}

function formatDateTime(value) {
  if (!value) return "-";
  const timestamp = value > 10_000_000_000 ? value : value * 1000;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function setVideoJson(payload) {
  latestVideoJson = payload;
  videoResponseJson.textContent = JSON.stringify(payload, null, 2);
}

function setTaskUi(pill, bar, label, status, progress, text) {
  pill.className = `status-pill ${status || "idle"}`;
  pill.textContent = status ? status[0].toUpperCase() + status.slice(1) : "Idle";
  bar.style.width = `${Math.max(0, Math.min(100, Number(progress) || 0))}%`;
  label.textContent = text;
}

function syncApiKeys(value) {
  apiKey.value = value;
  videoApiKey.value = value;
  saveSettings();
}

function lineValues(value) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function clearVideoTimers() {
  clearTimeout(videoPollTimer);
  clearInterval(videoCountdownTimer);
  videoPollTimer = 0;
  videoCountdownTimer = 0;
  videoNextPollAt = 0;
}

function updateVideoCountdown() {
  if (!videoNextPollAt) {
    videoPollCountdown.textContent = "未轮询";
    return;
  }
  const seconds = Math.max(0, Math.ceil((videoNextPollAt - Date.now()) / 1000));
  videoPollCountdown.textContent = seconds ? `${seconds}s 后自动查询` : "正在查询";
}

function startVideoPolling(taskId, delay) {
  clearVideoTimers();
  videoNextPollAt = Date.now() + delay;
  updateVideoCountdown();
  videoCountdownTimer = window.setInterval(updateVideoCountdown, 250);
  videoPollTimer = window.setTimeout(() => {
    clearInterval(videoCountdownTimer);
    videoPollCountdown.textContent = "正在查询";
    queryVideoTask(taskId, { keepPolling: true }).catch(handleVideoError);
  }, delay);
}

function syncVideoModelUi() {
  const isGrokImagine = videoModel.value === "grok-imagine-1.5-video-apimart";

  videoDuration.min = isGrokImagine ? "6" : "5";
  videoDuration.max = isGrokImagine ? "30" : "15";
  if (isGrokImagine && Number(videoDuration.value) < 6) videoDuration.value = "6";
  if (!isGrokImagine && Number(videoDuration.value) > 15) videoDuration.value = "15";

  Array.from(videoResolution.options).forEach((option) => {
    option.disabled = isGrokImagine && option.value === "1080p";
  });
  if (isGrokImagine && videoResolution.value === "1080p") {
    videoResolution.value = "720p";
  }

  [
    videoSeed,
    videoGenerateAudio,
    videoReturnLastFrame,
    videoWebSearch,
    videoFirstFrame,
    videoLastFrame,
    videoUrls,
    videoAudioUrls
  ].forEach((element) => {
    element.disabled = isGrokImagine;
  });
}

function buildVideoPayload() {
  const isGrokImagine = videoModel.value === "grok-imagine-1.5-video-apimart";
  const payload = {
    model: videoModel.value,
    prompt: videoPrompt.value.trim(),
    size: videoSize.value,
    duration: Number(videoDuration.value) || (isGrokImagine ? 6 : 5)
  };

  if (isGrokImagine) {
    payload.quality = videoResolution.value === "720p" ? "720p" : "480p";

    const images = lineValues(videoImageUrls.value);
    if (images.length) payload.image_urls = images;

    if (payload.size === "adaptive") {
      throw new Error("Grok Imagine does not support adaptive size. Choose 16:9, 9:16, 1:1, 3:2, or 2:3.");
    }
    if (payload.duration < 6 || payload.duration > 30) {
      throw new Error("Grok Imagine duration must be between 6 and 30 seconds.");
    }
    if (payload.image_urls?.length > 7) {
      throw new Error("Grok Imagine supports up to 7 reference images.");
    }
    if (payload.image_urls?.some((url) => !/^https?:\/\//i.test(url))) {
      throw new Error("Grok Imagine reference images must be public http(s) URLs. base64 and asset:// are not supported.");
    }
  } else {
    payload.resolution = videoResolution.value;
    payload.generate_audio = videoGenerateAudio.checked;
    payload.return_last_frame = videoReturnLastFrame.checked;

    const seed = videoSeed.value.trim();
    if (seed) payload.seed = Number(seed);
    if (videoWebSearch.checked) payload.tools = [{ type: "web_search" }];

    const firstFrame = videoFirstFrame.value.trim();
    const lastFrame = videoLastFrame.value.trim();
    if (firstFrame || lastFrame) {
      payload.image_with_roles = [];
      if (firstFrame) payload.image_with_roles.push({ url: firstFrame, role: "first_frame" });
      if (lastFrame) payload.image_with_roles.push({ url: lastFrame, role: "last_frame" });
    } else {
      const images = lineValues(videoImageUrls.value);
      if (images.length) payload.image_urls = images;
      const videos = lineValues(videoUrls.value);
      if (videos.length) payload.video_urls = videos;
      const audios = lineValues(videoAudioUrls.value);
      if (audios.length) payload.audio_urls = audios;
    }

    if (payload.image_urls?.length > 9) {
      throw new Error("Reference images support up to 9 items.");
    }
    if (payload.duration < 5 || payload.duration > 15) {
      throw new Error("Video duration must be between 5 and 15 seconds.");
    }
    if (payload.video_urls?.length > 3) {
      throw new Error("Reference videos support up to 3 items.");
    }
    if (payload.audio_urls?.length > 3) {
      throw new Error("Reference audio files support up to 3 items.");
    }
    if (payload.resolution === "1080p" && payload.model.includes("fast")) {
      throw new Error("1080p is only supported by doubao-seedance-2.0 and doubao-seedance-2.0-face.");
    }
  }

  return payload;
}

async function submitVideo(event) {
  event.preventDefault();
  saveSettings();
  clearVideoTimers();
  videoStage.innerHTML = "<span>正在提交视频任务</span>";
  videoPollCountdown.textContent = "未轮询";
  setTaskUi(videoStatusPill, videoProgressBar, videoProgressText, "processing", 8, "提交中");
  videoSubmitButton.disabled = true;

  try {
    const response = await fetch(`${apiBase}/v1/videos/generations`, {
      method: "POST",
      headers: authHeaders(videoApiKey),
      body: JSON.stringify(buildVideoPayload())
    });
    const data = await readResponse(response);
    setVideoJson(data);
    const taskId = data?.data?.[0]?.task_id || data?.data?.id || data?.data?.task_id;
    if (!taskId) throw new Error("提交成功但响应中没有 task_id。");
    videoTaskIdInput.value = taskId;
    setTaskUi(videoStatusPill, videoProgressBar, videoProgressText, "submitted", 12, "已提交，10 秒后开始轮询");
    startVideoPolling(taskId, 10000);
  } catch (error) {
    handleVideoError(error);
  } finally {
    videoSubmitButton.disabled = false;
  }
}

async function queryVideoTask(taskId, { keepPolling = false } = {}) {
  const response = await fetch(`${apiBase}/v1/tasks/${encodeURIComponent(taskId)}`, {
    headers: authHeaders(videoApiKey)
  });
  const data = await readResponse(response);
  setVideoJson(data);
  renderVideoTask(data);

  const status = data?.data?.status;
  if (keepPolling && status !== "completed" && status !== "failed") {
    startVideoPolling(taskId, 4000);
  } else {
    clearVideoTimers();
    videoPollCountdown.textContent = status === "completed" ? "已完成" : status === "failed" ? "已失败" : "未轮询";
  }
}

function handleVideoError(error) {
  clearVideoTimers();
  videoPollCountdown.textContent = "查询失败";
  videoStage.innerHTML = `<span>${error?.message || "视频任务失败"}</span>`;
  setTaskUi(videoStatusPill, videoProgressBar, videoProgressText, "failed", 0, "失败");
  setVideoJson(error?.payload || { error: { message: error?.message || "视频任务失败" } });
}

function renderVideoTask(payload) {
  const task = payload.data || {};
  const status = task.status || "submitted";
  const progress = typeof task.progress === "number" ? task.progress : status === "completed" ? 100 : 30;
  setTaskUi(videoStatusPill, videoProgressBar, videoProgressText, status, progress, status === "completed" ? "生成完成" : `${progress}%`);

  const urls = collectUrls(task.result);
  const originalVideos = urls.video.slice();
  if (task.local_videos?.length) {
    urls.video = task.local_videos;
  }
  if (status === "failed") {
    videoStage.innerHTML = `<span>${task.error?.message || "视频任务失败"}</span>`;
    return;
  }
  if (!urls.video.length && !urls.image.length) {
    videoStage.innerHTML = "<span>视频任务处理中</span>";
    return;
  }

  videoStage.innerHTML = "";
  urls.video.forEach((url, index) => {
    const figure = document.createElement("figure");
    const video = document.createElement("video");
    const link = document.createElement("a");
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = `打开视频 ${index + 1}`;
    figure.append(video, link);
    videoStage.append(figure);
  });
  urls.image.forEach((url, index) => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    const link = document.createElement("a");
    img.src = url;
    img.alt = `视频图片结果 ${index + 1}`;
    img.dataset.previewIndex = String(index);
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = `打开图片 ${index + 1}`;
    figure.append(img, link);
    videoStage.append(figure);
  });

  if (status === "completed") {
    saveCompletedVideosInBackground(task, originalVideos);
  }
}

function collectUrls(result) {
  const found = {
    video: (result?.videos || []).flatMap((item) => {
      if (typeof item === "string") return item;
      return item?.url || [];
    }),
    image: [],
    other: []
  };
  const visit = (value) => {
    if (!value) return;
    if (typeof value === "string") {
      if (/^https?:\/\//i.test(value)) {
        if (/\.(mp4|mov|webm)(\?|$)/i.test(value)) found.video.push(value);
        else if (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(value)) found.image.push(value);
        else found.other.push(value);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      Object.values(value).forEach(visit);
    }
  };
  visit(result);
  found.video = [...new Set(found.video)];
  found.image = [...new Set(found.image)];
  found.other = [...new Set(found.other)];
  return found;
}

form.addEventListener("submit", submitGeneration);
videoForm.addEventListener("submit", submitVideo);
apiKey.addEventListener("input", () => syncApiKeys(apiKey.value));
videoApiKey.addEventListener("input", () => syncApiKeys(videoApiKey.value));
sizeSelect.addEventListener("change", () => {
  saveSettings();
  updatePixelReadout();
});
resolutionSelect.addEventListener("change", () => {
  saveSettings();
  updatePixelReadout();
});
promptInput.addEventListener("input", saveSettings);
officialFallback.addEventListener("change", saveSettings);
imageUrls.addEventListener("input", () => {
  saveSettings();
  updatePixelReadout();
});
imageFiles.addEventListener("change", () => addReferenceFiles(Array.from(imageFiles.files)));
fileList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const index = target.dataset.removeReferenceIndex;
  if (index === undefined) return;
  removeReferenceFile(Number(index));
});
[
  videoPrompt,
  videoModel,
  videoSize,
  videoResolution,
  videoDuration,
  videoSeed,
  videoImageUrls,
  videoFirstFrame,
  videoLastFrame,
  videoUrls,
  videoAudioUrls
].forEach((element) => {
  element.addEventListener("input", saveSettings);
  element.addEventListener("change", saveSettings);
});
videoModel.addEventListener("change", syncVideoModelUi);
[videoGenerateAudio, videoReturnLastFrame, videoWebSearch].forEach((element) => {
  element.addEventListener("change", saveSettings);
});

toggleKey.addEventListener("click", () => {
  const isPassword = apiKey.type === "password";
  apiKey.type = isPassword ? "text" : "password";
  toggleKey.textContent = isPassword ? "隐藏" : "显示";
});

queryButton.addEventListener("click", () => {
  const taskId = taskIdInput.value.trim();
  if (!taskId) return;
  resetResult();
  latestSubmission = null;
  setStatus("processing", "Querying");
  setProgress(20, "查询中");
  queryTask(taskId).catch(handleQueryError);
});

copyJson.addEventListener("click", async () => {
  await navigator.clipboard.writeText(JSON.stringify(latestJson, null, 2));
  copyJson.textContent = "已复制";
  window.setTimeout(() => {
    copyJson.textContent = "复制";
  }, 1200);
});

promptHelperOpen.addEventListener("click", openPromptHelper);
promptHelperXiaOpen?.addEventListener("click", openXiaPromptHelper);
promptHelperClose.addEventListener("click", closePromptHelper);
promptHelperModal.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.promptPreset) {
    applyPromptPreset(target.dataset.promptPreset);
    return;
  }
  if (event.target === promptHelperModal) closePromptHelper();
});
promptRandomize.addEventListener("click", randomizePromptControls);
promptCopy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(promptHelperOutput.value);
  promptCopy.textContent = "已复制";
  window.setTimeout(() => {
    promptCopy.textContent = "复制文案";
  }, 1200);
});
promptUse.addEventListener("click", () => {
  promptInput.value = promptHelperOutput.value;
  saveSettings();
  closePromptHelper();
});

generatorTab.addEventListener("click", () => setView("generator"));
historyTab.addEventListener("click", () => setView("history"));
videoTab.addEventListener("click", () => setView("video"));
window.addEventListener("hashchange", () => {
  setView(location.hash === "#video" ? "video" : location.hash === "#history" ? "history" : "generator", {
    updateHash: false
  });
});
historySearch.addEventListener("input", renderHistory);
clearHistory.addEventListener("click", () => {
  if (!readHistory().length) return;
  const confirmed = window.confirm("确定清空所有本地生成历史吗？这不会删除 APIMart 上的任务。");
  if (!confirmed) return;
  writeHistory([]);
  renderHistory();
});

historyGrid.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target instanceof HTMLImageElement && target.dataset.historyTask) {
    const record = readHistory().find((item) => item.task_id === target.dataset.historyTask);
    if (record) {
      openPreview(record.local_images?.length ? record.local_images : record.images, Number(target.dataset.previewIndex) || 0, record.task_id);
    }
    return;
  }

  const deleteTask = target.dataset.deleteTask;
  if (deleteTask) {
    writeHistory(readHistory().filter((item) => item.task_id !== deleteTask));
    renderHistory();
    return;
  }

  const copyUrl = target.dataset.copyUrl;
  if (copyUrl) {
    await navigator.clipboard.writeText(copyUrl);
    target.textContent = "已复制";
    window.setTimeout(() => {
      target.textContent = "复制链接";
    }, 1200);
    return;
  }

  const queryTaskId = target.dataset.queryTask;
  if (queryTaskId) {
    taskIdInput.value = queryTaskId;
    setView("generator");
    resetResult();
    setStatus("processing", "Querying");
    setProgress(20, "查询中");
    queryTask(queryTaskId).catch(handleQueryError);
  }
});

videoQueryButton.addEventListener("click", () => {
  const taskId = videoTaskIdInput.value.trim();
  if (!taskId) return;
  clearVideoTimers();
  videoPollCountdown.textContent = "正在查询";
  setTaskUi(videoStatusPill, videoProgressBar, videoProgressText, "processing", 20, "查询中");
  queryVideoTask(taskId).catch(handleVideoError);
});

copyVideoJson.addEventListener("click", async () => {
  await navigator.clipboard.writeText(JSON.stringify(latestVideoJson, null, 2));
  copyVideoJson.textContent = "已复制";
  window.setTimeout(() => {
    copyVideoJson.textContent = "复制";
  }, 1200);
});

videoStage.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLImageElement)) return;
  const images = Array.from(videoStage.querySelectorAll("img")).map((img) => img.src);
  openPreview(images, Number(target.dataset.previewIndex) || 0, "视频图片结果");
});

imageStage.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLImageElement)) return;
  const images = Array.from(imageStage.querySelectorAll("img")).map((img) => img.src);
  openPreview(images, Number(target.dataset.previewIndex) || 0, "当前生成结果");
});

previewClose.addEventListener("click", closePreview);
previewPrev.addEventListener("click", () => movePreview(-1));
previewNext.addEventListener("click", () => movePreview(1));
previewStage.addEventListener("click", (event) => {
  if (event.target === previewStage) {
    closePreview();
  }
});

document.addEventListener("keydown", (event) => {
  if (!promptHelperModal.hidden && event.key === "Escape") {
    closePromptHelper();
    return;
  }
  if (previewModal.hidden) return;
  if (event.key === "Escape") closePreview();
  if (event.key === "ArrowLeft") movePreview(-1);
  if (event.key === "ArrowRight") movePreview(1);
});

bindPromptControls();
randomizePromptControls();
setJson({});
setVideoJson({});
renderFileList();
renderHistory();
updatePixelReadout();
syncVideoModelUi();
setView(location.hash === "#video" ? "video" : location.hash === "#history" ? "history" : "generator", {
  updateHash: false
});
