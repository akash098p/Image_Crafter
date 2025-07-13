    // Global variables
let selectedFiles = [];
let croppedData = [];
let currentCropIndex = null;
let cropper;
let flipXState = false;
let flipYState = false;
let lastCanvas = null;

// DOM elements
const preview = document.getElementById("preview");
const fileInput = document.getElementById("fileInput");
const cropModal = document.getElementById("cropModal");
const cropImage = document.getElementById("cropImage");
const layoutSelector = document.getElementById("layoutSelector");
const watermarkInput = document.getElementById("watermarkText");
const watermarkFont = document.getElementById("watermarkFont");
const watermarkColor = document.getElementById("watermarkColor");
const watermarkPosition = document.getElementById("watermarkPosition");
const watermarkX = document.getElementById("watermarkX");
const watermarkY = document.getElementById("watermarkY");
const watermarkSize = document.getElementById("watermarkSize");
const watermarkTarget = document.getElementById("watermarkTarget");
const sizeValue = document.getElementById("sizeValue");
const xValue = document.getElementById("xValue");
const yValue = document.getElementById("yValue");
const resolutionSelector = document.getElementById("resolutionSelector");
const scaleSlider = document.getElementById("scaleSlider");
const scaleValue = document.getElementById("scaleValue");
const downloadLink = document.getElementById("downloadLink");
const downloadMenu = document.getElementById("downloadMenu");
const outputCanvas = document.getElementById("outputCanvas");

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
  initializeEventListeners();
});

function initializeEventListeners() {
  // File input change
  fileInput.addEventListener("change", handleFileSelect);

  // Scale slider
  scaleSlider.addEventListener("input", function() {
    scaleValue.textContent = this.value + "x";
  });

  // Watermark size slider
  watermarkSize.addEventListener("input", function() {
    sizeValue.textContent = this.value + "px";
  });

  // Watermark position sliders
  watermarkX.addEventListener("input", function() {
    xValue.textContent = this.value + "%";
  });

  watermarkY.addEventListener("input", function() {
    yValue.textContent = this.value + "%";
  });

  // Drag and drop for preview
  setupDragAndDrop();

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === cropModal) {
      closeCropper();
    }
  });

  // Close download menu when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('#downloadLink') && !event.target.closest('#downloadMenu')) {
      downloadMenu.style.display = 'none';
    }
  });
}

function handleFileSelect(e) {
  Array.from(e.target.files).forEach(file => {
    if (file.type.startsWith('image/') && !selectedFiles.some(f => f.name === file.name)) {
      selectedFiles.push(file);
      croppedData.push(null);
    }
  });
  updatePreview();
}

function updatePreview() {
  preview.innerHTML = "";
  
  if (selectedFiles.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "preview-empty";
    emptyMsg.textContent = "No images selected. Click \"Select Images\" to add images.";
    preview.appendChild(emptyMsg);
    return;
  }

  selectedFiles.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => {
      const box = document.createElement("div");
      box.className = "img-box";
      box.draggable = true;
      box.title = `${file.name} - Click ✂ to crop, × to remove`;
      box.dataset.index = i;

      const img = document.createElement("img");
      img.src = croppedData[i] || e.target.result;
      img.alt = file.name;

      const delBtn = document.createElement("button");
      delBtn.innerHTML = "×";
      delBtn.className = "btn-delete";
      delBtn.title = "Remove image";
      delBtn.onclick = () => removeImage(i);

      const cropBtn = document.createElement("button");
      cropBtn.innerHTML = "✂";
      cropBtn.className = "btn-crop";
      cropBtn.title = "Crop image";
      cropBtn.onclick = () => openCropper(file, i);

      box.append(img, delBtn, cropBtn);
      preview.appendChild(box);
    };
    reader.readAsDataURL(file);
  });
}

function removeImage(index) {
  selectedFiles.splice(index, 1);
  croppedData.splice(index, 1);
  updatePreview();
}

function clearAll() {
  selectedFiles = [];
  croppedData = [];
  updatePreview();
  outputCanvas.style.display = 'none';
  downloadLink.style.display = 'none';
  downloadMenu.style.display = 'none';
}

// Drag & drop sorting
function setupDragAndDrop() {
  let dragStartIndex = null;
  
  preview.addEventListener("dragstart", e => {
    const box = e.target.closest(".img-box");
    if (box) {
      dragStartIndex = parseInt(box.dataset.index);
      e.dataTransfer.effectAllowed = "move";
    }
  });

  preview.addEventListener("dragover", e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  preview.addEventListener("drop", e => {
    e.preventDefault();
    const box = e.target.closest(".img-box");
    if (box && dragStartIndex !== null) {
      const dropIndex = parseInt(box.dataset.index);
      if (dropIndex !== dragStartIndex) {
        // Swap files and cropped data
        const [file] = selectedFiles.splice(dragStartIndex, 1);
        const [crop] = croppedData.splice(dragStartIndex, 1);
        selectedFiles.splice(dropIndex, 0, file);
        croppedData.splice(dropIndex, 0, crop);
        updatePreview();
      }
    }
    dragStartIndex = null;
  });
}

// Cropper functions
function openCropper(file, index) {
  currentCropIndex = index;
  const reader = new FileReader();
  reader.onload = e => {
    cropImage.src = e.target.result;
    cropModal.classList.remove('closing');
    cropModal.style.display = "block";
    
    // Destroy existing cropper
    if (cropper) {
      cropper.destroy();
    }
    
    // Initialize new cropper
    cropper = new Cropper(cropImage, {
      viewMode: 1,
      autoCropArea: 1,
      responsive: true,
      background: false,
      zoomable: true,
      scalable: true,
      rotatable: true
    });
    
    flipXState = flipYState = false;
  };
  reader.readAsDataURL(file);
}

function rotateImage() {
  if (cropper) {
    cropper.rotate(90);
  }
}

function flipX() {
  if (cropper) {
    flipXState = !flipXState;
    cropper.scaleX(flipXState ? -1 : 1);
  }
}

function flipY() {
  if (cropper) {
    flipYState = !flipYState;
    cropper.scaleY(flipYState ? -1 : 1);
  }
}

function resetCrop() {
  if (cropper) {
    cropper.reset();
    flipXState = flipYState = false;
  }
}

function applyCrop() {
  if (cropper) {
    const canvas = cropper.getCroppedCanvas();
    if (canvas) {
      croppedData[currentCropIndex] = canvas.toDataURL("image/png");
      closeCropper();
      updatePreview();
    }
  }
}

function closeCropper() {
  cropModal.classList.add('closing');
  setTimeout(() => {
    cropModal.style.display = "none";
    cropModal.classList.remove('closing');
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    cropImage.src = "";
  }, 300);
}

// Watermark functions
function toggleCustomPosition() {
  const customControls = document.getElementById("customPositionControls");
  const position = watermarkPosition.value;
  customControls.style.display = position === "custom" ? "block" : "none";
}

function applyWatermark(ctx, watermark, font, color, position, fontSize, x, y, imgWidth, imgHeight) {
  if (!watermark) return;
  
  ctx.save();
  ctx.font = `${fontSize}px ${font}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  
  // Calculate watermark position
  const textWidth = ctx.measureText(watermark).width;
  const textHeight = fontSize;
  
  let textX = x + 10;
  let textY = y + 10;
  
  if (position === "custom") {
    const xPercent = parseFloat(watermarkX.value) / 100;
    const yPercent = parseFloat(watermarkY.value) / 100;
    textX = x + (imgWidth - textWidth) * xPercent;
    textY = y + (imgHeight - textHeight) * yPercent;
  } else {
    switch (position) {
      case "top-left":
        textX = x + 10;
        textY = y + 10;
        break;
      case "top-right":
        textX = x + imgWidth - textWidth - 10;
        textY = y + 10;
        break;
      case "bottom-left":
        textX = x + 10;
        textY = y + imgHeight - textHeight - 10;
        break;
      case "bottom-right":
        textX = x + imgWidth - textWidth - 10;
        textY = y + imgHeight - textHeight - 10;
        break;
      case "center":
        textX = x + (imgWidth - textWidth) / 2;
        textY = y + (imgHeight - textHeight) / 2;
        break;
    }
  }
  
  // Add text shadow for better visibility
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  ctx.fillText(watermark, textX, textY);
  ctx.restore();
}

// Main combine function
async function combineImages() {
  if (selectedFiles.length === 0) {
    alert("Please select at least one image!");
    return;
  }

  try {
    const imgs = await Promise.all(selectedFiles.map((file, i) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = croppedData[i] || URL.createObjectURL(file);
    })));

    drawCombined(imgs);
  } catch (error) {
    console.error("Error loading images:", error);
    alert("Error loading images. Please try again.");
  }
}

function drawCombined(images) {
  const layout = layoutSelector.value;
  const scale = parseFloat(scaleSlider.value);
  const watermark = watermarkInput.value.trim();
  const font = watermarkFont.value;
  const color = watermarkColor.value;
  const position = watermarkPosition.value;
  const target = watermarkTarget.value;
  const fontSize = parseInt(watermarkSize.value);
  const resolution = resolutionSelector.value;

  let resolutionMultiplier = 1;
  switch (resolution) {
    case 'high':
      resolutionMultiplier = 2;
      break;
    case 'medium':
      resolutionMultiplier = 1.5;
      break;
    case 'web':
      resolutionMultiplier = 1;
      break;
  }

  const scaledImages = images.map(img => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width * scale * resolutionMultiplier;
    canvas.height = img.height * scale * resolutionMultiplier;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (watermark && target === 'individual') {
      applyWatermark(ctx, watermark, font, color, position, fontSize * scale * resolutionMultiplier, 0, 0, canvas.width, canvas.height);
    }

    return canvas;
  });

  let totalWidth = 0;
  let totalHeight = 0;

  if (layout === 'horizontal') {
    totalWidth = scaledImages.reduce((sum, img) => sum + img.width, 0);
    totalHeight = Math.max(...scaledImages.map(img => img.height));
  } else if (layout === 'vertical') {
    totalWidth = Math.max(...scaledImages.map(img => img.width));
    totalHeight = scaledImages.reduce((sum, img) => sum + img.height, 0);
  } else if (layout === 'grid') {
    const cols = Math.ceil(Math.sqrt(scaledImages.length));
    const rows = Math.ceil(scaledImages.length / cols);
    const maxWidth = Math.max(...scaledImages.map(img => img.width));
    const maxHeight = Math.max(...scaledImages.map(img => img.height));
    totalWidth = maxWidth * cols;
    totalHeight = maxHeight * rows;
  }

  outputCanvas.width = totalWidth;
  outputCanvas.height = totalHeight;
  outputCanvas.style.display = 'block';

  const ctx = outputCanvas.getContext('2d');

  // ✅ Only fill background for non-PNG output
  ctx.clearRect(0, 0, totalWidth, totalHeight);

  // Draw images
  let currentX = 0;
  let currentY = 0;

  if (layout === 'horizontal') {
    scaledImages.forEach((img, i) => {
      const y = (totalHeight - img.height) / 2;
      ctx.drawImage(img, currentX, y);
      currentX += img.width;
    });
  } else if (layout === 'vertical') {
    scaledImages.forEach((img, i) => {
      const x = (totalWidth - img.width) / 2;
      ctx.drawImage(img, x, currentY);
      currentY += img.height;
    });
  } else if (layout === 'grid') {
    const cols = Math.ceil(Math.sqrt(scaledImages.length));
    const maxWidth = Math.max(...scaledImages.map(img => img.width));
    const maxHeight = Math.max(...scaledImages.map(img => img.height));

    scaledImages.forEach((img, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * maxWidth + (maxWidth - img.width) / 2;
      const y = row * maxHeight + (maxHeight - img.height) / 2;
      ctx.drawImage(img, x, y);
    });
  }

  if (watermark && target === 'output') {
    applyWatermark(ctx, watermark, font, color, position, fontSize * scale * resolutionMultiplier, 0, 0, totalWidth, totalHeight);
  }

  lastCanvas = outputCanvas;
  downloadLink.style.display = 'block';
}


  // Store the canvas for download
  lastCanvas = outputCanvas;
  
  // Show download link
  downloadLink.style.display = 'block';


// Download functions
function toggleDownloadMenu() {
  downloadMenu.style.display = downloadMenu.style.display === 'none' ? 'block' : 'none';
}

function downloadPNG() {
  if (lastCanvas) {
    const link = document.createElement('a');
    link.download = 'combined-image.png';
    link.href = lastCanvas.toDataURL('image/png');
    link.click();
  }
  downloadMenu.style.display = 'none';
}

function downloadJPEG() {
  if (lastCanvas) {
    const link = document.createElement('a');
    link.download = 'combined-image.jpg';
    link.href = lastCanvas.toDataURL('image/jpeg', 0.9);
    link.click();
  }
  downloadMenu.style.display = 'none';
}

function downloadPDF() {
  if (lastCanvas && typeof jsPDF !== 'undefined') {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    // Calculate dimensions to fit the page
    const imgWidth = lastCanvas.width;
    const imgHeight = lastCanvas.height;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
    const width = imgWidth * ratio;
    const height = imgHeight * ratio;
    
    // Center the image
    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;
    
    const imgData = lastCanvas.toDataURL('image/jpeg', 0.8);
    pdf.addImage(imgData, 'JPEG', x, y, width, height);
    pdf.save('combined-image.pdf');
  } else {
    alert('PDF functionality is not available. Please try PNG or JPEG download.');
  }
  downloadMenu.style.display = 'none';
}