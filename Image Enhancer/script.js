const fileInput = document.querySelector(".file-input"),
  filterOptions = document.querySelectorAll(".filter button"),
  filterName = document.querySelector(".filter-info .name"),
  filterValue = document.querySelector(".filter-info .value"),
  filterSlider = document.querySelector(".slider input"),
  rotateOptions = document.querySelectorAll(".rotate button"),
  previewImg = document.querySelector(".preview-img img"),
  resetFilterBtn = document.querySelector(".reset-filter"),
  chooseImgBtn = document.querySelector(".choose-img"),
  saveImgBtn = document.querySelector(".save-img"),
  downloadPdfBtn = document.querySelector(".download-pdf"),
  shareImgBtn = document.querySelector(".share-img"),
  undoBtn = document.querySelector(".undo-btn"),
  redoBtn = document.querySelector(".redo-btn");

let brightness = "100", saturation = "100", inversion = "0", grayscale = "0", blur = "0", sepia = "0";
let rotate = 0, flipHorizontal = 1, flipVertical = 1;
let history = [], redoStack = [];

// Helper: Save current state for undo/redo
function saveHistory() {
  history.push({
    brightness, saturation, inversion, grayscale, blur, sepia,
    rotate, flipHorizontal, flipVertical,
    src: previewImg.src
  });
  if (history.length > 50) history.shift();
  redoStack = [];
}

// Load image from file input or drag-and-drop
function loadImage(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    previewImg.src = e.target.result;
    previewImg.onload = () => {
      resetFilter();
      document.querySelector(".container").classList.remove("disable");
      saveHistory();
    };
  };
  reader.readAsDataURL(file);
}

// Drag-and-drop support
document.querySelector(".preview-img").addEventListener("dragover", e => {
  e.preventDefault();
});
document.querySelector(".preview-img").addEventListener("drop", e => {
  e.preventDefault();
  loadImage(e.dataTransfer.files[0]);
});

const applyFilter = () => {
  previewImg.style.transform = `rotate(${rotate}deg) scale(${flipHorizontal}, ${flipVertical})`;
  previewImg.style.filter =
    `brightness(${brightness}%) saturate(${saturation}%) invert(${inversion}%) grayscale(${grayscale}%) blur(${blur}px) sepia(${sepia}%)`;
};

filterOptions.forEach(option => {
  option.addEventListener("click", () => {
    document.querySelector(".active").classList.remove("active");
    option.classList.add("active");
    filterName.innerText = option.innerText;

    if (option.id === "brightness" || option.id === "saturation") {
      filterSlider.max = "200";
      filterSlider.value = option.id === "brightness" ? brightness : saturation;
      filterValue.innerText = `${filterSlider.value}%`;
    } else if (option.id === "inversion" || option.id === "grayscale" || option.id === "sepia") {
      filterSlider.max = "100";
      filterSlider.value = eval(option.id);
      filterValue.innerText = `${filterSlider.value}%`;
    } else if (option.id === "blur") {
      filterSlider.max = "10";
      filterSlider.value = blur;
      filterValue.innerText = `${filterSlider.value}px`;
    }
  });
});

const updateFilter = () => {
  const selectedFilter = document.querySelector(".filter .active");
  let value = filterSlider.value;
  if (selectedFilter.id === "brightness") brightness = value;
  else if (selectedFilter.id === "saturation") saturation = value;
  else if (selectedFilter.id === "inversion") inversion = value;
  else if (selectedFilter.id === "grayscale") grayscale = value;
  else if (selectedFilter.id === "blur") blur = value;
  else if (selectedFilter.id === "sepia") sepia = value;

  filterValue.innerText = selectedFilter.id === "blur" ? `${value}px` : `${value}%`;
  applyFilter();
  saveHistory();
};

rotateOptions.forEach(option => {
  option.addEventListener("click", () => {
    if (option.id === "left") rotate -= 90;
    else if (option.id === "right") rotate += 90;
    else if (option.id === "horizontal") flipHorizontal *= -1;
    else flipVertical *= -1;
    applyFilter();
    saveHistory();
  });
});

const resetFilter = () => {
  brightness = "100"; saturation = "100"; inversion = "0"; grayscale = "0"; blur = "0"; sepia = "0";
  rotate = 0; flipHorizontal = 1; flipVertical = 1;
  filterOptions[0].click();
  applyFilter();
  saveHistory();
};

// Undo/Redo functionality
function undo() {
  if (history.length > 1) {
    redoStack.push(history.pop());
    const state = history[history.length - 1];
    brightness = state.brightness;
    saturation = state.saturation;
    inversion = state.inversion;
    grayscale = state.grayscale;
    blur = state.blur;
    sepia = state.sepia;
    rotate = state.rotate;
    flipHorizontal = state.flipHorizontal;
    flipVertical = state.flipVertical;
    previewImg.src = state.src;
    applyFilter();
  }
}
function redo() {
  if (redoStack.length) {
    const state = redoStack.pop();
    history.push(state);
    brightness = state.brightness;
    saturation = state.saturation;
    inversion = state.inversion;
    grayscale = state.grayscale;
    blur = state.blur;
    sepia = state.sepia;
    rotate = state.rotate;
    flipHorizontal = state.flipHorizontal;
    flipVertical = state.flipVertical;
    previewImg.src = state.src;
    applyFilter();
  }
}
undoBtn && undoBtn.addEventListener("click", undo);
redoBtn && redoBtn.addEventListener("click", redo);
document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "z") undo();
  if (e.ctrlKey && e.key === "y") redo();
});

// Save as image or PDF
const saveImage = (format = "jpg") => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = previewImg.naturalWidth;
  canvas.height = previewImg.naturalHeight;
  ctx.filter = `brightness(${brightness}%) saturate(${saturation}%) invert(${inversion}%) grayscale(${grayscale}%) blur(${blur}px) sepia(${sepia}%)`;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  if (rotate !== 0) ctx.rotate(rotate * Math.PI / 180);
  ctx.scale(flipHorizontal, flipVertical);
  ctx.drawImage(previewImg, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

  if (format === "pdf") {
    alert("PDF export requires jsPDF integration.");
  } else {
    const link = document.createElement("a");
    link.download = `image.${format}`;
    link.href = canvas.toDataURL(`image/${format === "jpg" ? "jpeg" : format}`);
    link.click();
  }
};
saveImgBtn.addEventListener("click", () => saveImage("jpg"));
downloadPdfBtn && downloadPdfBtn.addEventListener("click", () => saveImage("pdf"));

// Share image (Web Share API)
shareImgBtn && shareImgBtn.addEventListener("click", async () => {
  if (navigator.share) {
    const canvas = document.createElement("canvas");
    canvas.width = previewImg.naturalWidth;
    canvas.height = previewImg.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.filter = `brightness(${brightness}%) saturate(${saturation}%) invert(${inversion}%) grayscale(${grayscale}%) blur(${blur}px) sepia(${sepia}%)`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    if (rotate !== 0) ctx.rotate(rotate * Math.PI / 180);
    ctx.scale(flipHorizontal, flipVertical);
    ctx.drawImage(previewImg, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      const file = new File([blob], "image.jpg", {type: "image/jpeg"});
      navigator.share({files: [file], title: "Edited Image"});
    }, "image/jpeg");
  } else {
    alert("Web Share API not supported.");
  }
});

// Cropping functionality (foundation for future expansion)
let cropping = false, cropStart = {}, cropEnd = {};
previewImg.addEventListener("mousedown", e => {
  cropping = true;
  cropStart = {x: e.offsetX, y: e.offsetY};
});
previewImg.addEventListener("mouseup", e => {
  if (!cropping) return;
  cropping = false;
  cropEnd = {x: e.offsetX, y: e.offsetY};
  alert("Cropping not fully implemented in this snippet.");
});

// Event listeners
filterSlider.addEventListener("input", updateFilter);
resetFilterBtn.addEventListener("click", resetFilter);
fileInput.addEventListener("change", e => loadImage(e.target.files[0]));
chooseImgBtn.addEventListener("click", () => fileInput.click());

// Initial state
saveHistory();
