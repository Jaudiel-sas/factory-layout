let elementCount = 0;

// Add event listener for delete key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedElement = document.querySelector('.element.selected');
        if (selectedElement) {
            selectedElement.remove();
        }
    }
});
//Add Elements into layput
function addElement(type) {
    const quadrant = document.getElementById('quadrant');
    const element = document.createElement('div');
    element.classList.add('element', type);
    element.id = `element-${elementCount++}`;
    element.style.left = '50px';
    element.style.top = '50px';

    // Add icon based on type
    const icon = document.createElement('span');
    icon.classList.add('material-icons');
    switch (type) {
        case 'machine':
            icon.textContent = 'web_asset';
            break;
        case 'station':
            icon.textContent = 'video_label';
            break;
        case 'operator':
            icon.textContent = 'person';
            break;
        case 'conveyor':
            /*icon.className = 'fa-thin fa-conveyor-belt-empty';
            icon.style.fontSize = '48px';*/
            icon.className = 'fa-regular fa-arrow-right'; 
            icon.style.fontSize = '18px'; 
            break;

        case 'robot':
            icon.textContent = 'precision_manufacturing';
            icon.style.fontSize = '64px';
            break;
        
        case 'pallet':
            icon.textContent = 'pallet';
            break;

        case 'forklift':
                icon.textContent = 'forklift';
                icon.style.fontSize = '64px';
                break;

        case 'cart':
            icon.textContent = 'trolley';
            break;
        default:
            icon.textContent = 'help_outline';
    }
    element.appendChild(icon);

   // Add editable name input only for non-operator elements
   if (type !== 'operator' && type !== 'conveyor') {
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    
    // Set default name based on element type
    switch (type) {
        case 'machine':
            nameInput.placeholder = 'Machine';
            nameInput.value = `Machine `;
            break;
        case 'station':
            nameInput.placeholder = 'Station';
            nameInput.value = `ST`;
            break;
        case 'robot':
            nameInput.placeholder = 'Robot';
            nameInput.value = `Robot`;
            break;
        case 'forklift':
            nameInput.placeholder = 'Forklift';
            nameInput.value = `Forklift`;
            break;
        case 'pallet':
            nameInput.placeholder = 'Pallet';
            nameInput.value = `Pallet`;
            break;
        case 'cart':
            nameInput.placeholder = 'Cart';
            nameInput.value = `Cart`;
            break;
        default:
            nameInput.placeholder = 'Name';
            nameInput.value = `Element ${elementCount}`;
    }
    
    element.appendChild(nameInput);
}

    // Add click handler for selection
    element.addEventListener('mousedown', function(e) {
        // Remove selection from other elements
        document.querySelectorAll('.element.selected').forEach(el => {
            if (el !== element) el.classList.remove('selected');
        });
        element.classList.add('selected');
    });

    quadrant.appendChild(element);

    // Make element draggable and resizable
    interact(element)
        .draggable({
            inertia: true,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent',
                    endOnly: true
                })
            ],
            listeners: {
                move(event) {
                    const target = event.target;
                    const x = (parseFloat(target.style.left) || 0) + event.dx;
                    const y = (parseFloat(target.style.top) || 0) + event.dy;
                    
                    target.style.left = `${x}px`;
                    target.style.top = `${y}px`;
                }
            }
        })
        .resizable({
            edges: { left: true, right: true, bottom: true, top: true },
            listeners: {
                move(event) {
                    const target = event.target;
                    let x = parseFloat(target.style.left) || 0;
                    let y = parseFloat(target.style.top) || 0;

                    target.style.width = `${event.rect.width}px`;
                    target.style.height = `${event.rect.height}px`;

                    if (event.edges.left) {
                        target.style.left = `${x + event.deltaRect.left}px`;
                    }
                    if (event.edges.top) {
                        target.style.top = `${y + event.deltaRect.top}px`;
                    }
                }
            },
            modifiers: [
                interact.modifiers.restrictSize({
                    min: { width: 15, height: 15 }
                })
            ]
        });
}

async function saveLayout() {
    try {
        const layoutName = document.getElementById('layout-name').value;
        if (!layoutName) {
            alert('Please enter a layout name before saving.');
            return;
        }

        // Get all elements from the quadrant with explicit dimensions
        const quadrant = document.getElementById('quadrant');
        const elements = Array.from(quadrant.children).map(el => {
            const computedStyle = window.getComputedStyle(el);
            return {
                type: Array.from(el.classList).find(cls => cls !== 'element' && cls !== 'selected'),
                left: el.style.left,
                top: el.style.top,
                width: computedStyle.width, // Get actual computed width
                height: computedStyle.height, // Get actual computed height
                name: el.querySelector('input')?.value || ''
            };
        });

        // Create layout data object
        const layout = {
            name: layoutName,
            elements: elements,
            savedAt: new Date().toISOString()
        };

        const jsonString = JSON.stringify(layout, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Check if browser supports File System Access API
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `${layoutName}.json`,
                    types: [{
                        description: 'JSON Layout Files',
                        accept: {'application/json': ['.json']},
                    }],
                });

                // Check if file already exists
                try {
                    await handle.getFile();
                    const shouldOverwrite = confirm('A file with this name already exists. Do you want to overwrite it?');
                    if (!shouldOverwrite) {
                        return;
                    }
                } catch (e) {
                    // File doesn't exist, continue with save
                }

                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                
                showSaveSuccess();
            } catch (err) {
                if (err.name !== 'AbortError') {
                    throw err;
                }
            }
        } else {
            // Fallback for browsers without File System Access API (Safari, etc.)
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${layoutName}.json`;
            document.body.appendChild(a);
            
            // Show save location prompt
            alert('Please select a location to save your layout file.');
            
            a.click();
            
            // Cleanup
            setTimeout(() => {
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
                showSaveSuccess();
            }, 100);
        }
    } catch (err) {
        console.error('Failed to save layout:', err);
        showSaveError();
    }
}

// Helper function to show success message
function showSaveSuccess() {
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 4px;
        z-index: 1000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    successMsg.textContent = 'Layout saved successfully!';
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.style.opacity = '0';
        successMsg.style.transition = 'opacity 0.5s ease';
        setTimeout(() => document.body.removeChild(successMsg), 500);
    }, 2000);
}

// Helper function to show error message
function showSaveError() {
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #f44336;
        color: white;
        padding: 15px;
        border-radius: 4px;
        z-index: 1000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    errorMsg.textContent = 'Failed to save layout. Please try again.';
    document.body.appendChild(errorMsg);
    
    setTimeout(() => {
        errorMsg.style.opacity = '0';
        errorMsg.style.transition = 'opacity 0.5s ease';
        setTimeout(() => document.body.removeChild(errorMsg), 500);
    }, 2000);
}
async function loadLayout() {
    try {
        let fileContent;
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isSafari) {
            // Safari specific implementation
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            fileContent = await new Promise((resolve, reject) => {
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) {
                        reject(new Error('No file selected'));
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target.result);
                    reader.onerror = () => reject(new Error('Failed to read file'));
                    reader.readAsText(file);
                };
                input.click();
            });
        } else {
            // Modern browsers implementation using File System Access API
            try {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'JSON Layout Files',
                        accept: {'application/json': ['.json']},
                    }],
                    multiple: false
                });
                const file = await fileHandle.getFile();
                fileContent = await file.text();
            } catch (fsaError) {
                if (fsaError.name !== 'AbortError') {
                    throw fsaError;
                }
                return;
            }
        }

        // Parse and validate the layout data
        const layout = JSON.parse(fileContent);
        if (!layout.name || !Array.isArray(layout.elements)) {
            throw new Error('Invalid layout file format');
        }

        // Update layout name input
        document.getElementById('layout-name').value = layout.name;

        // Clear current layout
        const quadrant = document.getElementById('quadrant');
        quadrant.innerHTML = '';
        elementCount = 0;

        // Recreate elements
        // Recreate elements with exact dimensions
        layout.elements.forEach(el => {
            if (!el.type) return;
            
            addElement(el.type);
            const element = document.getElementById(`element-${elementCount - 1}`);
            
            // Set exact position and size
            element.style.left = el.left || '50px';
            element.style.top = el.top || '50px';
            
            // Remove 'px' if present and ensure valid numbers
            const width = parseInt(el.width);
            const height = parseInt(el.height);
            
            // Set dimensions only if they are valid numbers
            if (!isNaN(width)) {
                element.style.width = `${width}px`;
            }
            if (!isNaN(height)) {
                element.style.height = `${height}px`;
            }
            
            /*For specific element types, enforce minimum dimensions
            if (el.type === 'conveyor') {
                element.style.height = '24px';
            }*/
            
            // Restore name if applicable
            if (el.type !== 'operator' && el.type !== 'conveyor') {
                const input = element.querySelector('input');
                if (input && el.name) {
                    input.value = el.name;
                }
            }
        });

        showLoadSuccess();
    } catch (err) {
        console.error('Failed to load layout:', err);
        showLoadError(err.message);
    }
}

// Add these helper functions for load feedback
function showLoadSuccess() {
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 4px;
        z-index: 1000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        opacity: 1;
        transition: opacity 0.5s ease;
    `;
    successMsg.textContent = 'Layout loaded successfully!';
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        successMsg.style.opacity = '0';
        setTimeout(() => document.body.removeChild(successMsg), 500);
    }, 2000);
}

function showLoadError(message) {
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #f44336;
        color: white;
        padding: 15px;
        border-radius: 4px;
        z-index: 1000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        opacity: 1;
        transition: opacity 0.5s ease;
    `;
    errorMsg.textContent = `Failed to load layout: ${message}`;
    document.body.appendChild(errorMsg);
    
    setTimeout(() => {
        errorMsg.style.opacity = '0';
        setTimeout(() => document.body.removeChild(errorMsg), 500);
    }, 2000);
}
// Clear the layout
function clearLayout() {
    if (confirm('Are you sure you want to clear the layout without saving?')) {
        document.getElementById('quadrant').innerHTML = '';
        document.getElementById('layout-name').value = '';
        elementCount = 0;
    }
}
async function printLayout() {
    try {
        const { jsPDF } = window.jspdf;
        
        // Get the quadrant element
        const quadrant = document.getElementById('quadrant');
        
        // Create canvas from quadrant with better options
        const canvas = await html2canvas(quadrant, {
            backgroundColor: 'white',
            scale: 2, // Higher resolution
            useCORS: true, // Handle cross-origin images
            allowTaint: true, // Allow cross-origin images
            letterRendering: true, // Improve text rendering
            width: quadrant.offsetWidth,
            height: quadrant.offsetHeight,
            onclone: function(clonedDoc) {
                // Ensure input values are visible in the clone
                const inputs = clonedDoc.querySelectorAll('input');
                inputs.forEach(input => {
                    const span = clonedDoc.createElement('span');
                    span.textContent = input.value || input.placeholder;
                    span.style.display = 'block';
                    span.style.width = '100%';
                    span.style.textAlign = 'center';
                    span.style.fontSize = '12px';
                    span.style.padding = '2px 4px';
                    input.parentNode.replaceChild(span, input);
                });
            }
        });

        // Create PDF with correct aspect ratio
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'in',
            format: [11, 17]
        });

        // Add title
        const layoutName = document.getElementById('layout-name').value || 'Factory Layout';
        pdf.setFontSize(16);
        pdf.text(layoutName, 0.5, 0.5);

        // Calculate dimensions to maintain aspect ratio
        const pageWidth = pdf.internal.pageSize.width;
        const pageHeight = pdf.internal.pageSize.height;
        const aspectRatio = canvas.width / canvas.height;
        
        let imgWidth = pageWidth - 1; // 0.5 inch margins
        let imgHeight = imgWidth / aspectRatio;

        // Add layout image
        pdf.addImage(
            imgData, 
            'PNG', 
            0.5, // X position
            0.75, // Y position (below title)
            imgWidth, 
            imgHeight
        );

        // Add timestamp
        const date = new Date().toLocaleString();
        pdf.setFontSize(8);
        pdf.text(`Generated: ${date}`, 0.5, pageHeight - 0.25);

        // Save PDF
        pdf.save(`${layoutName}.pdf`);

    } catch (error) {
        console.error('Failed to generate PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    }
}