class ImageEditor {
    constructor() {
        this._queryElements();
        this._initProperties();
        this._addEventListeners();
    }

    // 1. SETUP
    // =========================================================================

    /**
     * Select and store all necessary DOM elements.
     */
    _queryElements() {
        this.dom = {
            container: document.querySelector(".container"),
            previewImg: document.querySelector(".preview-img img"),
            previewArea: document.querySelector(".preview-img"),
            drawingCanvas: document.querySelector("#drawing-canvas"),
            fileInput: document.querySelector(".file-input"),
            chooseImgBtn: document.querySelector(".choose-img"),
            filterOptions: document.querySelectorAll(".filter button"),
            filterName: document.querySelector(".filter-info .name"),
            filterValue: document.querySelector(".filter-info .value"),
            filterSlider: document.querySelector(".slider input"),
            contrastSlider: document.querySelector(".contrast-slider input"),
            hueSlider: document.querySelector(".hue-slider input"),
            opacitySlider: document.querySelector(".opacity-slider input"),
            sharpenSlider: document.querySelector(".sharpen-slider input"),
            embossSlider: document.querySelector(".emboss-slider input"),
            vignetteSlider: document.querySelector(".vignette-slider input"),
            adjustmentOptions: document.querySelectorAll(".adjustments button"),
            exposureSlider: document.querySelector(".exposure-slider input"),
            highlightsSlider: document.querySelector(".highlights-slider input"),
            shadowsSlider: document.querySelector(".shadows-slider input"),
            whitesSlider: document.querySelector(".whites-slider input"),
            blacksSlider: document.querySelector(".blacks-slider input"),
            rotateOptions: document.querySelectorAll(".rotate button"),
            cropBtn: document.querySelector("#crop"),
            resizeBtn: document.querySelector("#resize"),
            cropModal: document.querySelector("#crop-modal"),
            cropCanvas: document.querySelector("#crop-canvas"),
            applyCropBtn: document.querySelector("#apply-crop"),
            cropModalClose: document.querySelector("#crop-modal .close"),
            aspectRatioButtons: document.querySelectorAll(".aspect-ratios button"),
            resizeModal: document.querySelector("#resize-modal"),
            resizeModalClose: document.querySelector("#resize-modal .close"),
            resizeWidth: document.querySelector("#resize-width"),
            resizeHeight: document.querySelector("#resize-height"),
            maintainAspect: document.querySelector("#maintain-aspect"),
            applyResizeBtn: document.querySelector("#apply-resize-modal"),
            drawingTools: document.querySelectorAll(".drawing-tools button"),
            drawColor: document.querySelector("#draw-color"),
            brushSize: document.querySelector("#brush-size"),
            textBtn: document.querySelector("#add-text"),
            textModal: document.querySelector("#text-modal"),
            textModalClose: document.querySelector("#text-modal .close"),
            textInput: document.querySelector("#modal-text-input"),
            fontFamily: document.querySelector("#modal-font-family"),
            fontSize: document.querySelector("#modal-font-size"),
            textColor: document.querySelector("#modal-text-color"),
            applyTextBtn: document.querySelector("#apply-text-modal"),
            shapeButtons: document.querySelectorAll(".shapes button"),
            shapeColor: document.querySelector("#shape-color"),
            shapeThickness: document.querySelector("#shape-thickness"),
            layersList: document.querySelector("#layers-list"),
            newLayerBtn: document.querySelector("#new-layer"),
            deleteLayerBtn: document.querySelector("#delete-layer"),
            mergeLayersBtn: document.querySelector("#merge-layers"),
            zoomInBtn: document.querySelector("#zoom-in"),
            zoomOutBtn: document.querySelector("#zoom-out"),
            fullScreenBtn: document.querySelector("#full-screen"),
            resetFilterBtn: document.querySelector(".reset-filter"),
            saveImgBtn: document.querySelector(".save-img"),
            downloadBtn: document.querySelector(".download-btn"),
            exportFormat: document.querySelector("#export-format"),
            shareImgBtn: document.querySelector(".share-img"),
            undoBtn: document.querySelector(".undo-btn"),
            redoBtn: document.querySelector(".redo-btn"),
            errorMessage: document.querySelector("#preview-error"),
            loadingSpinner: document.querySelector(".loading-spinner"),
            progress: document.querySelector(".progress"),
        };
    }

    /**
     * Initialize state, history, and default values.
     */
    _initProperties() {
        this.DEFAULT_STATE = {
            filters: {
                brightness: 100, saturation: 100, inversion: 0, grayscale: 0,
                blur: 0, sepia: 0, contrast: 100, hue: 0, opacity: 100,
                sharpen: 0, emboss: 0, vignette: 0
            },
            adjustments: {
                exposure: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0
            },
            transform: {
                rotate: 0, flipHorizontal: 1, flipVertical: 1
            },
            crop: { x: 0, y: 0, width: 0, height: 0, aspect: null },
            resize: { width: null, height: null, maintainAspect: true },
            drawing: { tool: null, color: '#000000', size: 5 },
            text: { content: '', font: 'Arial', size: 20, color: '#000000', x: 0, y: 0 },
            shapes: { type: null, color: '#000000', thickness: 2 },
            layers: [{ id: 'base', type: 'image', visible: true }],
            zoom: 1,
        };

        this.state = JSON.parse(JSON.stringify(this.DEFAULT_STATE));
        this.history = [];
        this.redoStack = [];
        this.debounceTimer = null;
        this.isDrawing = false;
        this.lastPoint = null;
        this.currentLayer = 'base';
        this.canvasContext = this.dom.drawingCanvas.getContext('2d');
    }

    /**
     * Bind all event listeners.
     */
    _addEventListeners() {
        // File Input
        this.dom.fileInput.addEventListener("change", this._handleFileChange.bind(this));
        this.dom.chooseImgBtn.addEventListener("click", () => this.dom.fileInput.click());

        // Drag and Drop
        this.dom.previewArea.addEventListener("dragover", e => {
            e.preventDefault();
            this.dom.previewArea.classList.add("drag-over");
        });
        this.dom.previewArea.addEventListener("dragleave", () => this.dom.previewArea.classList.remove("drag-over"));
        this.dom.previewArea.addEventListener("drop", e => {
            e.preventDefault();
            this.dom.previewArea.classList.remove("drag-over");
            const file = e.dataTransfer.files[0];
            if (file) this._loadImage(file);
        });

        // Filters
        this.dom.filterOptions.forEach(option => option.addEventListener("click", () => this._handleFilterSelection(option)));
        this.dom.filterSlider.addEventListener("input", this._handleSliderInput.bind(this, 'filters', 'filterSlider'));
        this.dom.contrastSlider.addEventListener("input", this._handleSliderInput.bind(this, 'filters', 'contrastSlider'));
        this.dom.hueSlider.addEventListener("input", this._handleSliderInput.bind(this, 'filters', 'hueSlider'));
        this.dom.opacitySlider.addEventListener("input", this._handleSliderInput.bind(this, 'filters', 'opacitySlider'));
        this.dom.sharpenSlider.addEventListener("input", this._handleSliderInput.bind(this, 'filters', 'sharpenSlider'));
        this.dom.embossSlider.addEventListener("input", this._handleSliderInput.bind(this, 'filters', 'embossSlider'));
        this.dom.vignetteSlider.addEventListener("input", this._handleSliderInput.bind(this, 'filters', 'vignetteSlider'));

        // Adjustments
        this.dom.adjustmentOptions.forEach(option => option.addEventListener("click", () => this._handleAdjustmentSelection(option)));
        this.dom.exposureSlider.addEventListener("input", this._handleSliderInput.bind(this, 'adjustments', 'exposureSlider'));
        this.dom.highlightsSlider.addEventListener("input", this._handleSliderInput.bind(this, 'adjustments', 'highlightsSlider'));
        this.dom.shadowsSlider.addEventListener("input", this._handleSliderInput.bind(this, 'adjustments', 'shadowsSlider'));
        this.dom.whitesSlider.addEventListener("input", this._handleSliderInput.bind(this, 'adjustments', 'whitesSlider'));
        this.dom.blacksSlider.addEventListener("input", this._handleSliderInput.bind(this, 'adjustments', 'blacksSlider'));

        // Rotations
        this.dom.rotateOptions.forEach(option => option.addEventListener("click", () => this._handleRotation(option.id)));

        // Crop
        this.dom.cropBtn.addEventListener("click", this._openCropModal.bind(this));
        this.dom.cropModalClose.addEventListener("click", () => this.dom.cropModal.style.display = 'none');
        this.dom.applyCropBtn.addEventListener("click", this._applyCrop.bind(this));
        this.dom.aspectRatioButtons.forEach(btn => btn.addEventListener("click", () => this._setCropAspectRatio(btn.id)));

        // Resize
        this.dom.resizeBtn.addEventListener("click", this._openResizeModal.bind(this));
        this.dom.resizeModalClose.addEventListener("click", () => this.dom.resizeModal.style.display = 'none');
        this.dom.applyResizeBtn.addEventListener("click", this._applyResize.bind(this));
        this.dom.maintainAspect.addEventListener("change", () => {
            this.state.resize.maintainAspect = this.dom.maintainAspect.checked;
        });

        // Drawing
        this.dom.drawingTools.forEach(tool => tool.addEventListener("click", () => this._selectDrawingTool(tool.id)));
        this.dom.drawColor.addEventListener("input", () => {
            this.state.drawing.color = this.dom.drawColor.value;
        });
        this.dom.brushSize.addEventListener("input", () => {
            this.state.drawing.size = this.dom.brushSize.value;
        });
        this.dom.drawingCanvas.addEventListener("mousedown", this._startDrawing.bind(this));
        this.dom.drawingCanvas.addEventListener("mousemove", this._draw.bind(this));
        this.dom.drawingCanvas.addEventListener("mouseup", this._stopDrawing.bind(this));
        this.dom.drawingCanvas.addEventListener("mouseout", this._stopDrawing.bind(this));

        // Text
        this.dom.textBtn.addEventListener("click", this._openTextModal.bind(this));
        this.dom.textModalClose.addEventListener("click", () => this.dom.textModal.style.display = 'none');
        this.dom.applyTextBtn.addEventListener("click", this._applyText.bind(this));

        // Shapes
        this.dom.shapeButtons.forEach(btn => btn.addEventListener("click", () => this._selectShape(btn.id)));
        this.dom.shapeColor.addEventListener("input", () => {
            this.state.shapes.color = this.dom.shapeColor.value;
        });
        this.dom.shapeThickness.addEventListener("input", () => {
            this.state.shapes.thickness = this.dom.shapeThickness.value;
        });

        // Layers
        this.dom.newLayerBtn.addEventListener("click", this._addLayer.bind(this));
        this.dom.deleteLayerBtn.addEventListener("click", this._deleteLayer.bind(this));
        this.dom.mergeLayersBtn.addEventListener("click", this._mergeLayers.bind(this));

        // Preview Controls
        this.dom.zoomInBtn.addEventListener("click", () => this._zoom(1.1));
        this.dom.zoomOutBtn.addEventListener("click", () => this._zoom(0.9));
        this.dom.fullScreenBtn.addEventListener("click", this._toggleFullScreen.bind(this));

        // Save / Share
        this.dom.resetFilterBtn.addEventListener("click", this._resetAllFilters.bind(this));
        this.dom.saveImgBtn.addEventListener("click", () => this._saveImage("jpeg"));
        this.dom.downloadBtn.addEventListener("click", () => this._saveImage(this.dom.exportFormat.value));
        this.dom.shareImgBtn.addEventListener("click", this._shareImage.bind(this));

        // Undo / Redo
        this.dom.undoBtn.addEventListener("click", this.undo.bind(this));
        this.dom.redoBtn.addEventListener("click", this.redo.bind(this));
        document.addEventListener("keydown", e => {
            if (e.ctrlKey && e.key.toLowerCase() === "z") this.undo();
            if (e.ctrlKey && e.key.toLowerCase() === "y") this.redo();
            if (e.ctrlKey && e.key.toLowerCase() === "s") {
                e.preventDefault();
                this._saveImage(this.dom.exportFormat.value);
            }
        });

        // Set initial active filter
        this.dom.filterOptions[0].click();
    }

    // 2. CORE LOGIC
    // =========================================================================

    /**
     * Handles new image file selection.
     */
    _handleFileChange(e) {
        const file = e.target.files[0];
        if (file) this._loadImage(file);
    }

    /**
     * Reads and loads the image file into the preview element.
     */
    _loadImage(file) {
        this.dom.loadingSpinner.style.display = 'block';
        const reader = new FileReader();
        reader.onload = e => {
            this.dom.previewImg.src = e.target.result;
            this.dom.previewImg.onload = () => {
                this._resetAllFilters();
                this.dom.container.classList.remove("disable");
                this._resizeCanvas();
                this._saveHistory();
                this.dom.loadingSpinner.style.display = 'none';
            };
            reader.onerror = () => {
                this._showError("Failed to load image.");
                this.dom.loadingSpinner.style.display = 'none';
            };
        };
        reader.readAsDataURL(file);
    }

    /**
     * Resizes the drawing canvas to match the image dimensions.
     */
    _resizeCanvas() {
        const img = this.dom.previewImg;
        this.dom.drawingCanvas.width = img.width;
        this.dom.drawingCanvas.height = img.height;
    }

    /**
     * Applies the current state to the image element.
     */
    _applyStateToImage() {
        const { filters, transform, adjustments } = this.state;
        let filterString = `brightness(${filters.brightness}%) saturate(${filters.saturation}%) invert(${filters.inversion}%) grayscale(${filters.grayscale}%) blur(${filters.blur}px) sepia(${filters.sepia}%) contrast(${filters.contrast}%) hue-rotate(${filters.hue}deg) opacity(${filters.opacity}%)`;
        // Note: Sharpen, emboss, and vignette require canvas processing, not CSS filters
        this.dom.previewImg.style.filter = filterString;
        this.dom.previewImg.style.transform = `rotate(${transform.rotate}deg) scale(${transform.flipHorizontal}, ${transform.flipVertical}) scale(${this.state.zoom})`;
        // Apply adjustments (requires canvas for exposure, highlights, etc.)
        this._applyCanvasAdjustments();
    }

    /**
     * Applies adjustments that require canvas processing.
     */
    _applyCanvasAdjustments() {
        const { adjustments } = this.state;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = this.dom.previewImg;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simplified adjustment logic
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i + 1], b = data[i + 2];
            // Exposure
            let exposure = adjustments.exposure / 100;
            r *= (1 + exposure);
            g *= (1 + exposure);
            b *= (1 + exposure);
            // Highlights and Shadows (simplified)
            let luminance = (r * 0.299 + g * 0.587 + b * 0.114);
            if (luminance > 128) {
                r += adjustments.highlights / 5;
                g += adjustments.highlights / 5;
                b += adjustments.highlights / 5;
            } else {
                r += adjustments.shadows / 5;
                g += adjustments.shadows / 5;
                b += adjustments.shadows / 5;
            }
            // Whites and Blacks
            r += adjustments.whites / 10;
            g += adjustments.whites / 10;
            b += adjustments.whites / 10;
            r -= adjustments.blacks / 10;
            g -= adjustments.blacks / 10;
            b -= adjustments.blacks / 10;

            data[i] = Math.min(255, Math.max(0, r));
            data[i + 1] = Math.min(255, Math.max(0, g));
            data[i + 2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imageData, 0, 0);
        this.dom.previewImg.src = canvas.toDataURL();
    }

    /**
     * Handles click events on filter buttons.
     */
    _handleFilterSelection(selectedOption) {
        document.querySelectorAll(".filter .slider").forEach(sl => sl.style.display = 'none');
        document.querySelector(".filter .active")?.classList.remove("active");
        selectedOption.classList.add("active");
        this.dom.filterName.innerText = selectedOption.innerText;
        const slider = document.querySelector(`.${selectedOption.id}-slider`);
        if (slider) slider.style.display = 'block';
        this._updateSliderUI(selectedOption.id);
    }

    /**
     * Handles click events on adjustment buttons.
     */
    _handleAdjustmentSelection(selectedOption) {
        document.querySelectorAll(".adjustments .slider").forEach(sl => sl.style.display = 'none');
        document.querySelector(".adjustments .active")?.classList.remove("active");
        selectedOption.classList.add("active");
        const slider = document.querySelector(`.${selectedOption.id}-slider`);
        if (slider) slider.style.display = 'block';
        this._updateSliderUI(selectedOption.id);
    }

    /**
     * Handles slider input, debouncing the application.
     */
    _handleSliderInput(category, sliderId) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const selectedId = document.querySelector(`.${category} .active`).id;
            const value = this.dom[sliderId].value;
            this.state[category][selectedId] = value;
            this._applyStateToImage();
            this._updateFilterValueText(selectedId, value);
            this._saveHistory();
        }, 150);
        this._updateFilterValueText(document.querySelector(`.${category} .active`).id, this.dom[sliderId].value);
    }

    /**
     * Handles rotation and flip button clicks.
     */
    _handleRotation(optionId) {
        const { transform } = this.state;
        if (optionId === "left") transform.rotate -= 90;
        else if (optionId === "right") transform.rotate += 90;
        else if (optionId === "horizontal") transform.flipHorizontal *= -1;
        else if (optionId === "vertical") transform.flipVertical *= -1;
        else if (optionId === "rotate-90") transform.rotate = 90;
        else if (optionId === "rotate-180") transform.rotate = 180;
        this._applyStateToImage();
        this._saveHistory();
    }

    /**
     * Opens the crop modal and initializes crop canvas.
     */
    _openCropModal() {
        this.dom.cropModal.style.display = 'block';
        const ctx = this.dom.cropCanvas.getContext('2d');
        const img = this.dom.previewImg;
        this.dom.cropCanvas.width = img.width;
        this.dom.cropCanvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        // Initialize crop rectangle (simplified)
        this.state.crop = { x: 0, y: 0, width: img.width, height: img.height, aspect: null };
    }

    /**
     * Applies the crop operation.
     */
    _applyCrop() {
        const { crop } = this.state;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = crop.width;
        canvas.height = crop.height;
        ctx.drawImage(this.dom.previewImg, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
        this.dom.previewImg.src = canvas.toDataURL();
        this.dom.cropModal.style.display = 'none';
        this._resizeCanvas();
        this._saveHistory();
    }

    /**
     * Sets crop aspect ratio.
     */
    _setCropAspectRatio(id) {
        const ratios = {
            'crop-free': null,
            'crop-1:1': 1,
            'crop-16:9': 16/9,
            'crop-4:3': 4/3
        };
        this.state.crop.aspect = ratios[id];
        // Update crop rectangle based on aspect ratio
    }

    /**
     * Opens the resize modal.
     */
    _openResizeModal() {
        this.dom.resizeModal.style.display = 'block';
        this.dom.resizeWidth.value = this.dom.previewImg.naturalWidth;
        this.dom.resizeHeight.value = this.dom.previewImg.naturalHeight;
    }

    /**
     * Applies the resize operation.
     */
    _applyResize() {
        const width = parseInt(this.dom.resizeWidth.value);
        const height = parseInt(this.dom.resizeHeight.value);
        if (width > 0 && height > 0) {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(this.dom.previewImg, 0, 0, width, height);
            this.dom.previewImg.src = canvas.toDataURL();
            this.dom.resizeModal.style.display = 'none';
            this._resizeCanvas();
            this._saveHistory();
        } else {
            this._showError("Invalid resize dimensions.");
        }
    }

    /**
     * Selects a drawing tool.
     */
    _selectDrawingTool(tool) {
        this.state.drawing.tool = tool;
        this.dom.drawingCanvas.style.pointerEvents = tool ? 'auto' : 'none';
    }

    /**
     * Starts drawing on the canvas.
     */
    _startDrawing(e) {
        if (!this.state.drawing.tool) return;
        this.isDrawing = true;
        this.lastPoint = this._getCanvasPoint(e);
        this.canvasContext.beginPath();
        this.canvasContext.strokeStyle = this.state.drawing.color;
        this.canvasContext.lineWidth = this.state.drawing.size;
        this.canvasContext.lineCap = 'round';
    }

    /**
     * Draws on the canvas.
     */
    _draw(e) {
        if (!this.isDrawing) return;
        const point = this._getCanvasPoint(e);
        this.canvasContext.moveTo(this.lastPoint.x, this.lastPoint.y);
        this.canvasContext.lineTo(point.x, point.y);
        this.canvasContext.stroke();
        this.lastPoint = point;
    }

    /**
     * Stops drawing.
     */
    _stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this._saveHistory();
        }
    }

    /**
     * Gets canvas coordinates from mouse event.
     */
    _getCanvasPoint(e) {
        const rect = this.dom.drawingCanvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.state.zoom,
            y: (e.clientY - rect.top) / this.state.zoom
        };
    }

    /**
     * Opens the text modal.
     */
    _openTextModal() {
        this.dom.textModal.style.display = 'block';
        this.dom.textInput.value = this.state.text.content;
        this.dom.fontFamily.value = this.state.text.font;
        this.dom.fontSize.value = this.state.text.size;
        this.dom.textColor.value = this.state.text.color;
    }

    /**
     * Applies text to the canvas.
     */
    _applyText() {
        this.state.text.content = this.dom.textInput.value;
        this.state.text.font = this.dom.fontFamily.value;
        this.state.text.size = this.dom.fontSize.value;
        this.state.text.color = this.dom.textColor.value;
        this.canvasContext.font = `${this.state.text.size}px ${this.state.text.font}`;
        this.canvasContext.fillStyle = this.state.text.color;
        this.canvasContext.fillText(this.state.text.content, this.state.text.x, this.state.text.y);
        this.dom.textModal.style.display = 'none';
        this._saveHistory();
    }

    /**
     * Selects a shape to draw.
     */
    _selectShape(type) {
        this.state.shapes.type = type;
        // Implement shape drawing logic on canvas
    }

    /**
     * Adds a new layer.
     */
    _addLayer() {
        const id = `layer-${this.state.layers.length}`;
        this.state.layers.push({ id, type: 'overlay', visible: true });
        this._updateLayersUI();
        this._saveHistory();
    }

    /**
     * Deletes the current layer.
     */
    _deleteLayer() {
        if (this.state.layers.length > 1) {
            this.state.layers = this.state.layers.filter(layer => layer.id !== this.currentLayer);
            this.currentLayer = this.state.layers[0].id;
            this._updateLayersUI();
            this._saveHistory();
        }
    }

    /**
     * Merges all layers.
     */
    _mergeLayers() {
        // Flatten all layers into a single canvas
        this.state.layers = [{ id: 'base', type: 'image', visible: true }];
        this.currentLayer = 'base';
        this._updateLayersUI();
        this._saveHistory();
    }

    /**
     * Updates the layers UI.
     */
    _updateLayersUI() {
        this.dom.layersList.innerHTML = '';
        this.state.layers.forEach(layer => {
            const li = document.createElement('li');
            li.textContent = layer.id;
            li.addEventListener('click', () => {
                this.currentLayer = layer.id;
                this._updateLayersUI();
            });
            if (layer.id === this.currentLayer) li.style.background = '#ddd';
            this.dom.layersList.appendChild(li);
        });
    }

    /**
     * Zooms the image.
     */
    _zoom(factor) {
        this.state.zoom *= factor;
        this.state.zoom = Math.max(0.1, Math.min(this.state.zoom, 5));
        this._applyStateToImage();
        this._resizeCanvas();
    }

    /**
     * Toggles full-screen mode.
     */
    _toggleFullScreen() {
        if (!document.fullscreenElement) {
            this.dom.previewArea.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Resets all filters, adjustments, and transformations.
     */
    _resetAllFilters() {
        this.state = JSON.parse(JSON.stringify(this.DEFAULT_STATE));
        this.canvasContext.clearRect(0, 0, this.dom.drawingCanvas.width, this.dom.drawingCanvas.height);
        this._updateUI();
        this._saveHistory();
    }

    // 3. UI SYNCHRONIZATION
    // =========================================================================

    /**
     * Updates the entire UI to reflect the current state.
     */
    _updateUI() {
        this._applyStateToImage();
        const activeFilterId = document.querySelector(".filter .active")?.id;
        const activeAdjustmentId = document.querySelector(".adjustments .active")?.id;
        if (activeFilterId) this._updateSliderUI(activeFilterId);
        if (activeAdjustmentId) this._updateSliderUI(activeAdjustmentId);
        this._updateLayersUI();
    }

    /**
     * Updates the slider's max and current value based on the selected filter or adjustment.
     */
    _updateSliderUI(id) {
        const configs = {
            brightness: { max: 200, value: this.state.filters.brightness, unit: '%', slider: 'filterSlider' },
            saturation: { max: 200, value: this.state.filters.saturation, unit: '%', slider: 'filterSlider' },
            inversion: { max: 100, value: this.state.filters.inversion, unit: '%', slider: 'filterSlider' },
            grayscale: { max: 100, value: this.state.filters.grayscale, unit: '%', slider: 'filterSlider' },
            sepia: { max: 100, value: this.state.filters.sepia, unit: '%', slider: 'filterSlider' },
            blur: { max: 10, value: this.state.filters.blur, unit: 'px', slider: 'filterSlider' },
            contrast: { max: 200, value: this.state.filters.contrast, unit: '%', slider: 'contrastSlider' },
            hue: { max: 180, value: this.state.filters.hue, unit: 'deg', slider: 'hueSlider' },
            opacity: { max: 100, value: this.state.filters.opacity, unit: '%', slider: 'opacitySlider' },
            sharpen: { max: 10, value: this.state.filters.sharpen, unit: '', slider: 'sharpenSlider' },
            emboss: { max: 10, value: this.state.filters.emboss, unit: '', slider: 'embossSlider' },
            vignette: { max: 100, value: this.state.filters.vignette, unit: '%', slider: 'vignetteSlider' },
            exposure: { max: 100, value: this.state.adjustments.exposure, unit: '', slider: 'exposureSlider' },
            highlights: { max: 100, value: this.state.adjustments.highlights, unit: '', slider: 'highlightsSlider' },
            shadows: { max: 100, value: this.state.adjustments.shadows, unit: '', slider: 'shadowsSlider' },
            whites: { max: 100, value: this.state.adjustments.whites, unit: '', slider: 'whitesSlider' },
            blacks: { max: 100, value: this.state.adjustments.blacks, unit: '', slider: 'blacksSlider' },
        };
        const config = configs[id];
        if (config) {
            this.dom[config.slider].max = config.max;
            this.dom[config.slider].value = config.value;
            this._updateFilterValueText(id, config.value, config.unit);
        }
    }

    /**
     * Updates the text displaying the current filter or adjustment value.
     */
    _updateFilterValueText(id, value, unit = '') {
        const valueElement = document.querySelector(`.${id}-slider .value`);
        if (valueElement) valueElement.innerText = `${value}${unit}`;
    }

    // 4. HISTORY (UNDO/REDO)
    // =========================================================================

    /**
     * Saves the current state to history.
     */
    _saveHistory() {
        this.redoStack = [];
        this.history.push(JSON.parse(JSON.stringify(this.state)));
        if (this.history.length > 50) {
            this.history.shift();
        }
    }

    /**
     * Undoes the last action.
     */
    undo() {
        if (this.history.length > 1) {
            this.redoStack.push(this.history.pop());
            this.state = JSON.parse(JSON.stringify(this.history[this.history.length - 1]));
            this._updateUI();
        }
    }

    /**
     * Redoes the last undone action.
     */
    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.history.push(nextState);
            this.state = JSON.parse(JSON.stringify(nextState));
            this._updateUI();
        }
    }

    // 5. EXPORT & SHARE
    // =========================================================================

    /**
     * Applies the current state to a canvas for export.
     */
    _applyStateToCanvas() {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = this.dom.previewImg;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Apply filters
        let filterString = `brightness(${this.state.filters.brightness}%) saturate(${this.state.filters.saturation}%) invert(${this.state.filters.inversion}%) grayscale(${this.state.filters.grayscale}%) blur(${this.state.filters.blur}px) sepia(${this.state.filters.sepia}%) contrast(${this.state.filters.contrast}%) hue-rotate(${this.state.filters.hue}deg) opacity(${this.state.filters.opacity}%)`;
        ctx.filter = filterString;

        // Apply transformations
        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (this.state.transform.rotate !== 0) {
            ctx.rotate(this.state.transform.rotate * Math.PI / 180);
        }
        ctx.scale(this.state.transform.flipHorizontal, this.state.transform.flipVertical);

        // Draw the image
        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

        // Apply canvas-based filters (sharpen, emboss, vignette)
        if (this.state.filters.sharpen > 0 || this.state.filters.emboss > 0 || this.state.filters.vignette > 0) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // Simplified processing for demonstration
            ctx.putImageData(imageData, 0, 0);
        }

        // Draw overlays from canvas
        ctx.drawImage(this.dom.drawingCanvas, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

        return canvas;
    }

    /**
     * Saves the edited image in the specified format.
     */
    _saveImage(format) {
        this.dom.loadingSpinner.style.display = 'block';
        const canvas = this._applyStateToCanvas();
        if (format === "pdf") {
            if (window.jspdf) {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                doc.addImage(canvas.toDataURL("image/jpeg"), 'JPEG', 0, 0, canvas.width, canvas.height);
                doc.save("edited-image.pdf");
            } else {
                this._showError("PDF library (jsPDF) not found.");
            }
        } else {
            const link = document.createElement("a");
            link.download = `edited-image.${format}`;
            link.href = canvas.toDataURL(`image/${format}`);
            link.click();
        }
        this.dom.loadingSpinner.style.display = 'none';
    }

    /**
     * Shares the edited image using the Web Share API.
     */
    async _shareImage() {
        if (!navigator.share) {
            this._showError("Web Share API is not supported in your browser.");
            return;
        }
        this.dom.loadingSpinner.style.display = 'block';
        const canvas = this._applyStateToCanvas();
        canvas.toBlob(async (blob) => {
            const file = new File([blob], "edited-image.jpg", { type: "image/jpeg" });
            try {
                await navigator.share({
                    files: [file],
                    title: "Check out this image I edited!",
                });
            } catch (error) {
                this._showError("Sharing failed: " + error.message);
            }
            this.dom.loadingSpinner.style.display = 'none';
        }, "image/jpeg");
    }

    /**
     * Displays an error message.
     */
    _showError(message) {
        this.dom.errorMessage.textContent = message;
        this.dom.errorMessage.style.display = 'block';
        setTimeout(() => {
            this.dom.errorMessage.style.display = 'none';
        }, 3000);
    }
}

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    new ImageEditor();
});