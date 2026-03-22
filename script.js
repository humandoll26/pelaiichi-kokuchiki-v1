const SAMPLE_DATA = {
  title: "まちの小劇場 春の朗読会",
  subtitle: "声で味わう、日曜日の90分",
  catchcopy: "仕事帰りでも、初めてでも、ふらっと立ち寄れる朗読イベント。",
  date: "2026年4月20日（月）18:30開場 / 19:00開演",
  venue: "北浜コミュニティホール 2F 多目的室",
  price: "一般 1,500円 / 学生 800円",
  organizer: "主催: 北浜ことば企画",
  description: "短編小説とエッセイを中心に、4名の読み手が作品を朗読します。\n静かな照明とシンプルな演出で、言葉そのものを楽しめる構成です。\n終演後は出演者との短い交流時間があります。",
  notes: "定員40名、先着順です。\n会場内は飲食不可です。\n体調不良時は来場をお控えください。",
  qrUrl: "https://example.com/event",
  qrText: "申込ページはこちら",
  contactEmail: "kitahama@example.com",
  contactPhone: "03-1234-5678",
  xAccount: "@kitahama_reading",
  instagramAccount: "@kitahama_reading",
  website: "example.com/event"
};

const form = document.getElementById("flyerForm");
const imageInput = document.getElementById("mainImageInput");
const jsonFileInput = document.getElementById("jsonFileInput");
const sampleButton = document.getElementById("loadSample");
const resetButton = document.getElementById("resetForm");
const loadJsonButton = document.getElementById("loadJson");
const saveJsonButton = document.getElementById("saveJson");
const printButton = document.getElementById("printFlyer");

const preview = {
  title: document.getElementById("previewTitle"),
  subtitle: document.getElementById("previewSubtitle"),
  catchcopy: document.getElementById("previewCatchcopy"),
  date: document.getElementById("previewDate"),
  venue: document.getElementById("previewVenue"),
  price: document.getElementById("previewPrice"),
  organizer: document.getElementById("previewOrganizer"),
  description: document.getElementById("previewDescription"),
  notes: document.getElementById("previewNotes"),
  contact: document.getElementById("previewContact"),
  social: document.getElementById("previewSocial"),
  qrText: document.getElementById("previewQrText"),
  image: document.getElementById("previewImage")
};

const sections = {
  image: document.getElementById("previewImageSection"),
  rowPrice: document.getElementById("rowPrice"),
  rowOrganizer: document.getElementById("rowOrganizer"),
  description: document.getElementById("descriptionSection"),
  notes: document.getElementById("notesSection"),
  qr: document.getElementById("qrSection")
};

let imageDataUrl = "";
let qr;
const JSON_EXPORT_IMAGE_MAX_WIDTH = 1600;
const JSON_EXPORT_IMAGE_MAX_HEIGHT = 900;
const JSON_EXPORT_IMAGE_QUALITY = 0.85;

function initQrCode() {
  if (window.QRious) {
    qr = new QRious({
      element: document.getElementById("qrCanvas"),
      size: 220,
      value: ""
    });
  }
}

function setVisibility(element, isVisible) {
  element.classList.toggle("hidden", !isVisible);
}

function valueOf(name) {
  return form.elements[name].value.trim();
}

function joinValues(values, separator = " / ") {
  return values.map((value) => value.trim()).filter(Boolean).join(separator);
}

function fillText(element, value, options = {}) {
  const hasValue = Boolean(value);
  if (options.fallback) {
    element.textContent = hasValue ? value : options.fallback;
  } else {
    element.textContent = value;
    setVisibility(element, hasValue);
  }
}

function syncPreview() {
  const title = valueOf("title");
  const subtitle = valueOf("subtitle");
  const catchcopy = valueOf("catchcopy");
  const date = valueOf("date");
  const venue = valueOf("venue");
  const price = valueOf("price");
  const organizer = valueOf("organizer");
  const description = valueOf("description");
  const notes = valueOf("notes");
  const qrUrl = valueOf("qrUrl");
  const qrText = valueOf("qrText");
  const contact = joinValues([valueOf("contactEmail"), valueOf("contactPhone")]);
  const social = joinValues([
    valueOf("xAccount") ? `X: ${valueOf("xAccount")}` : "",
    valueOf("instagramAccount") ? `Instagram: ${valueOf("instagramAccount")}` : "",
    valueOf("website") ? `Web: ${valueOf("website")}` : ""
  ]);

  form.elements.qrText.disabled = !qrUrl;

  fillText(preview.title, title, { fallback: "タイトルを入力してください" });
  fillText(preview.subtitle, subtitle);
  fillText(preview.catchcopy, catchcopy);

  preview.date.textContent = date || "-";
  preview.venue.textContent = venue || "-";
  preview.price.textContent = price;
  preview.organizer.textContent = organizer;
  preview.description.textContent = description;
  preview.notes.textContent = notes;
  preview.contact.textContent = contact;
  preview.social.textContent = social;
  preview.qrText.textContent = qrText;

  setVisibility(preview.subtitle, Boolean(subtitle));
  setVisibility(preview.catchcopy, Boolean(catchcopy));
  setVisibility(sections.rowPrice, Boolean(price));
  setVisibility(sections.rowOrganizer, Boolean(organizer));
  setVisibility(sections.description, Boolean(description));
  setVisibility(sections.notes, Boolean(notes));
  setVisibility(preview.contact, Boolean(contact));
  setVisibility(preview.social, Boolean(social));
  setVisibility(preview.qrText, Boolean(qrText));

  if (imageDataUrl) {
    preview.image.src = imageDataUrl;
  }
  setVisibility(sections.image, Boolean(imageDataUrl));

  if (qr && qrUrl) {
    qr.value = qrUrl;
    setVisibility(sections.qr, true);
  } else {
    if (qr) {
      qr.value = " ";
    }
    setVisibility(sections.qr, false);
  }
}

function applyData(data) {
  Object.entries(data).forEach(([name, value]) => {
    if (form.elements[name]) {
      form.elements[name].value = value;
    }
  });
  syncPreview();
}

function resetImage() {
  imageDataUrl = "";
  imageInput.value = "";
}

function collectFormData() {
  const data = {};

  Array.from(form.elements).forEach((element) => {
    if (!element.name || element.type === "file") {
      return;
    }

    data[element.name] = element.type === "checkbox" ? element.checked : element.value;
  });

  data.mainImageDataUrl = imageDataUrl;

  return {
    app: "pelaiichi-kokuchiki-v1",
    version: 1,
    exportedAt: new Date().toISOString(),
    formData: data
  };
}

function optimizeImageDataUrlForExport(sourceDataUrl) {
  if (!sourceDataUrl) {
    return Promise.resolve("");
  }

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(
        1,
        JSON_EXPORT_IMAGE_MAX_WIDTH / image.width,
        JSON_EXPORT_IMAGE_MAX_HEIGHT / image.height
      );
      const canvas = document.createElement("canvas");
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;

      if (!context) {
        resolve(sourceDataUrl);
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", JSON_EXPORT_IMAGE_QUALITY));
    };

    image.onerror = () => reject(new Error("Image optimization failed"));
    image.src = sourceDataUrl;
  });
}

function buildJsonFileName() {
  const rawTitle = valueOf("title") || "flyer-data";
  const safeTitle = rawTitle.replace(/[\\/:*?"<>|]/g, "").trim() || "flyer-data";
  return `${safeTitle}.json`;
}

async function downloadJson() {
  const payload = collectFormData();
  payload.formData.mainImageDataUrl = await optimizeImageDataUrlForExport(imageDataUrl);
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = buildJsonFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function restoreFromJsonPayload(payload) {
  const formData = payload?.formData;

  if (!formData || typeof formData !== "object") {
    throw new Error("Invalid JSON payload");
  }

  const { mainImageDataUrl = "", ...fields } = formData;

  applyData(fields);
  imageDataUrl = typeof mainImageDataUrl === "string" ? mainImageDataUrl : "";
  imageInput.value = "";
  syncPreview();
}

form.addEventListener("input", syncPreview);
form.addEventListener("change", syncPreview);

imageInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) {
    resetImage();
    syncPreview();
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    imageDataUrl = typeof reader.result === "string" ? reader.result : "";
    syncPreview();
  };
  reader.readAsDataURL(file);
});

sampleButton.addEventListener("click", () => {
  resetImage();
  applyData(SAMPLE_DATA);
});

resetButton.addEventListener("click", () => {
  form.reset();
  resetImage();
  syncPreview();
});

saveJsonButton.addEventListener("click", async () => {
  syncPreview();

  try {
    await downloadJson();
  } catch (error) {
    window.alert("JSON保存に失敗しました。");
    console.error(error);
  }
});

loadJsonButton.addEventListener("click", () => {
  const confirmed = window.confirm("JSONを読み込むと、作業中の内容は上書きされます。続けますか？");

  if (!confirmed) {
    return;
  }

  jsonFileInput.click();
});

jsonFileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;

  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    restoreFromJsonPayload(payload);
  } catch (error) {
    window.alert("JSON読込に失敗しました。");
    console.error(error);
  } finally {
    jsonFileInput.value = "";
  }
});

printButton.addEventListener("click", () => {
  syncPreview();
  window.print();
});

initQrCode();
applyData(SAMPLE_DATA);
