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
            fileInput: document.querySelector(".file-input"),
            chooseImgBtn: document.querySelector(".choose-img"),
            filterOptions: document.querySelectorAll(".filter button"),
            filterName: document.querySelector(".filter-info .name"),
            filterValue: document.querySelector(".filter-info .value"),
            filterSlider: document.querySelector(".slider input"),
            rotateOptions: document.querySelectorAll(".rotate button"),
            resetFilterBtn: document.querySelector(".reset-filter"),
            saveImgBtn: document.querySelector(".save-img"),
            downloadPdfBtn: document.querySelector(".download-pdf"),
            shareImgBtn: document.querySelector(".share-img"),
            undoBtn: document.querySelector(".undo-btn"),
            redoBtn: document.querySelector(".redo-btn"),
        };
    }

    /**
     * Initialize state, history, and default values.
     */
    _initProperties() {
        this.DEFAULT_STATE = {
            filters: {
                brightness: 100, saturation: 100, inversion: 0,
                grayscale: 0, blur: 0, sepia: 0
            },
            transform: {
                rotate: 0, flipHorizontal: 1, flipVertical: 1
            }
        };

        this.state = JSON.parse(JSON.stringify(this.DEFAULT_STATE)); // Deep copy
        this.history = [];
        this.redoStack = [];

        // For debouncing slider input
        this.debounceTimer = null;
    }

    /**
     * Bind all event listeners.
     */
    _addEventListeners() {
        // Main actions
        this.dom.fileInput.addEventListener("change", this._handleFileChange.bind(this));
        this.dom.chooseImgBtn.addEventListener("click", () => this.dom.fileInput.click());
        this.dom.resetFilterBtn.addEventListener("click", this._resetAllFilters.bind(this));
        
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
        this.dom.filterSlider.addEventListener("input", this._handleSliderInput.bind(this));

        // Rotations
        this.dom.rotateOptions.forEach(option => option.addEventListener("click", () => this._handleRotation(option.id)));

        // Undo / Redo
        this.dom.undoBtn?.addEventListener("click", this.undo.bind(this));
        this.dom.redoBtn?.addEventListener("click", this.redo.bind(this));
        document.addEventListener("keydown", e => {
            if (e.ctrlKey && e.key.toLowerCase() === "z") this.undo();
            if (e.ctrlKey && e.key.toLowerCase() === "y") this.redo();
        });

        // Save / Share
        this.dom.saveImgBtn.addEventListener("click", () => this._saveImage("jpeg"));
        this.dom.downloadPdfBtn?.addEventListener("click", () => this._saveImage("pdf"));
        this.dom.shareImgBtn?.addEventListener("click", this._shareImage.bind(this));
        
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
        const reader = new FileReader();
        reader.onload = e => {
            this.dom.previewImg.src = e.target.result;
            this.dom.previewImg.onload = () => {
                this._resetAllFilters();
                this.dom.container.classList.remove("disable");
                this._saveHistory(); // Save the initial state
            };
        };
        reader.readAsDataURL(file);
    }

    /**
     * Applies the current state (filters and transforms) to the image element.
     */
    _applyStateToImage() {
        const { filters, transform } = this.state;
        this.dom.previewImg.style.filter = `brightness(${filters.brightness}%) saturate(${filters.saturation}%) invert(${filters.inversion}%) grayscale(${filters.grayscale}%) blur(${filters.blur}px) sepia(${filters.sepia}%)`;
        this.dom.previewImg.style.transform = `rotate(${transform.rotate}deg) scale(${transform.flipHorizontal}, ${transform.flipVertical})`;
    }
    
    /**
     * Handles click events on filter buttons (Brightness, Saturation, etc.).
     */
    _handleFilterSelection(selectedOption) {
        document.querySelector(".filter .active").classList.remove("active");
        selectedOption.classList.add("active");
        this.dom.filterName.innerText = selectedOption.innerText;
        this._updateSliderUI(selectedOption.id);
    }
    
    /**
     * Handles slider input, debouncing the filter application.
     */
    _handleSliderInput() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const selectedFilterId = document.querySelector(".filter .active").id;
            const value = this.dom.filterSlider.value;
            
            this.state.filters[selectedFilterId] = value;
            this._applyStateToImage();
            this._updateFilterValueText(selectedFilterId, value);
            this._saveHistory();
        }, 150); // 150ms debounce delay
        
        // Update text value instantly for better UX
        this._updateFilterValueText(document.querySelector(".filter .active").id, this.dom.filterSlider.value);
    }
    
    /**
     * Handles rotation and flip button clicks.
     */
    _handleRotation(optionId) {
        const { transform } = this.state;
        if (optionId === "left") transform.rotate -= 90;
        else if (optionId === "right") transform.rotate += 90;
        else if (optionId === "horizontal") transform.flipHorizontal *= -1;
        else transform.flipVertical *= -1;
        
        this._applyStateToImage();
        this._saveHistory();
    }

    /**
     * Resets all filters and transformations to their default values.
     */
    _resetAllFilters() {
        this.state = JSON.parse(JSON.stringify(this.DEFAULT_STATE));
        this._updateUI();
        this._saveHistory();
    }

    // 3. UI SYNCHRONIZATION
    // =========================================================================

    /**
     * Updates the entire UI to reflect the current state.
     * This is crucial for undo/redo to work correctly.
     */
    _updateUI() {
        this._applyStateToImage();
        const activeFilterId = document.querySelector(".filter .active").id;
        this._updateSliderUI(activeFilterId);
        this._updateFilterValueText(activeFilterId, this.state.filters[activeFilterId]);
    }
    
    /**
     * Updates the slider's max and current value based on the selected filter.
     */
    _updateSliderUI(filterId) {
        const filterConfigs = {
            brightness: { max: 200, value: this.state.filters.brightness },
            saturation: { max: 200, value: this.state.filters.saturation },
            inversion: { max: 100, value: this.state.filters.inversion },
            grayscale: { max: 100, value: this.state.filters.grayscale },
            sepia: { max: 100, value: this.state.filters.sepia },
            blur: { max: 10, value: this.state.filters.blur },
        };
        const config = filterConfigs[filterId];
        if (config) {
            this.dom.filterSlider.max = config.max;
            this.dom.filterSlider.value = config.value;
        }
    }
    
    /**
     * Updates the text displaying the current filter value (e.g., "120%").
     */
    _updateFilterValueText(filterId, value) {
        this.dom.filterValue.innerText = `${value}${filterId === 'blur' ? 'px' : '%'}`;
    }

    // 4. HISTORY (UNDO/REDO)
    // =========================================================================
    
    _saveHistory() {
        this.redoStack = []; // Clear redo stack on new action
        this.history.push(JSON.parse(JSON.stringify(this.state))); // Store a deep copy
        if (this.history.length > 50) {
            this.history.shift(); // Limit history size
        }
    }

    undo() {
        if (this.history.length > 1) {
            this.redoStack.push(this.history.pop());
            this.state = JSON.parse(JSON.stringify(this.history[this.history.length - 1]));
            this._updateUI();
        }
    }

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
     * Helper to draw the current image with all transformations onto a canvas.
     * @returns {HTMLCanvasElement} A canvas with the rendered image.
     */
    _applyStateToCanvas() {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = this.dom.previewImg;
        
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Apply filters
        ctx.filter = this.dom.previewImg.style.filter;
        
        // Apply transformations
        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (this.state.transform.rotate !== 0) {
            ctx.rotate(this.state.transform.rotate * Math.PI / 180);
        }
        ctx.scale(this.state.transform.flipHorizontal, this.state.transform.flipVertical);
        
        // Draw the image
        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        
        return canvas;
    }

    /**
     * Saves the edited image as a JPEG or PDF.
     */
    _saveImage(format = "jpeg") {
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
                alert("PDF library (jsPDF) not found. Please check the console for errors.");
                console.error("jsPDF is not loaded. Make sure the script tag is included in your HTML.");
            }
        } else {
            const link = document.createElement("a");
            link.download = `edited-image.${format}`;
            link.href = canvas.toDataURL(`image/${format}`);
            link.click();
        }
    }

    /**
     * Shares the edited image using the Web Share API.
     */
    async _shareImage() {
        if (!navigator.share) {
            alert("Web Share API is not supported in your browser.");
            return;
        }

        const canvas = this._applyStateToCanvas();
        canvas.toBlob(async (blob) => {
            const file = new File([blob], "edited-image.jpg", { type: "image/jpeg" });
            try {
                await navigator.share({
                    files: [file],
                    title: "Check out this image I edited!",
                });
            } catch (error) {
                console.error("Sharing failed:", error);
            }
        }, "image/jpeg");
    }
}

// Initialize the application once the DOM is fully loaded.
window.addEventListener('DOMContentLoaded', () => {
    new ImageEditor();
});