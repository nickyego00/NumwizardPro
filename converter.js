document.addEventListener('DOMContentLoaded', function() {
    // Set current year
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('light');
        themeToggle.textContent = document.body.classList.contains('light') ? '🌞' : '🌙';
        localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light');
        themeToggle.textContent = '🌞';
    }
    
    // Elements
    const numberInput = document.getElementById('numberInput');
    const currentSystem = document.getElementById('currentSystem');
    const targetSystem = document.getElementById('targetSystem');
    const convertBtn = document.getElementById('convertBtn');
    const resultContainer = document.getElementById('resultContainer');
    const result = document.getElementById('result');
    const copyBtn = document.getElementById('copyBtn');
    const saveBtn = document.getElementById('saveBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const inputError = document.getElementById('inputError');
    const successMessage = document.getElementById('successMessage');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const exportHistoryBtn = document.getElementById('exportHistoryBtn');
    
    // Chatbot elements
    const chatbotIcon = document.getElementById('chatbotIcon');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const chatbotInput = document.getElementById('chatbotInput');
    const sendChatMessage = document.getElementById('sendChatMessage');
    const closeChat = document.getElementById('closeChat');
    
    // Initialize 3D visualization
    let scene, camera, renderer, cubes = [];
    function initVisualization() {
        const container = document.getElementById('visualization');
        
        // Create scene
        scene = new THREE.Scene();
        
        // Create camera
        camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 5;
        
        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Rotate cubes
            cubes.forEach(cube => {
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;
            });
            
            renderer.render(scene, camera);
        }
        
        animate();
        
        // Handle window resize
        window.addEventListener('resize', function() {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }
    
    // Create visualization for a number
    function visualizeNumber(number, fromBase, toBase) {
        // Clear existing cubes
        cubes.forEach(cube => scene.remove(cube));
        cubes = [];
        
        // Convert number to string for visualization
        const numStr = number.toString();
        
        // Create cubes for each digit
        for (let i = 0; i < numStr.length; i++) {
            const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const material = new THREE.MeshPhongMaterial({ 
                color: getColorForBase(fromBase),
                transparent: true,
                opacity: 0.8
            });
            
            const cube = new THREE.Mesh(geometry, material);
            cube.position.x = (i - (numStr.length - 1) / 2) * 0.7;
            cube.position.y = 0;
            cube.position.z = 0;
            
            scene.add(cube);
            cubes.push(cube);
        }
        
        // Add transformation animation
        setTimeout(() => {
            cubes.forEach((cube, i) => {
                // Animate transformation to new base
                const targetY = Math.sin(i * 0.5) * 1.5;
                const targetColor = getColorForBase(toBase);
                
                // Simple animation to new position and color
                const startPos = { y: cube.position.y };
                const endPos = { y: targetY };
                
                const startTime = Date.now();
                const duration = 1000;
                
                function updateAnimation() {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing function
                    const ease = progress < 0.5 
                        ? 2 * progress * progress 
                        : -1 + (4 - 2 * progress) * progress;
                    
                    cube.position.y = startPos.y + (endPos.y - startPos.y) * ease;
                    
                    // Interpolate color
                    const startColor = new THREE.Color(getColorForBase(fromBase));
                    const endColor = new THREE.Color(targetColor);
                    cube.material.color.lerpColors(startColor, endColor, ease);
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateAnimation);
                    }
                }
                
                updateAnimation();
            });
        }, 500);
    }
    
    // Helper function to get color based on number system
    function getColorForBase(base) {
        const colors = {
            2: 0xff6b6b,  // Red for binary
            8: 0x4ecdc4,  // Teal for octal
            10: 0x45b7d1, // Blue for decimal
            16: 0x96ceb4  // Green for hexadecimal
        };
        return colors[base] || 0xffffff;
    }
    
    // Initialize visualization
    initVisualization();
    
    // Load history from localStorage
    let conversionHistory = JSON.parse(localStorage.getItem('conversionHistory')) || [];
    renderHistory();
    
    // Conversion function
    function convertNumber(value, fromBase, toBase) {
        // Validate input
        if (!value) {
            throw new Error('Please enter a number to convert');
        }
        
        // Remove common prefixes if present
        if (fromBase === 2 && /^0b/i.test(value)) {
            value = value.substring(2);
        } else if (fromBase === 8 && /^0o/i.test(value)) {
            value = value.substring(2);
        } else if (fromBase === 16 && /^0x/i.test(value)) {
            value = value.substring(2);
        }
        
        // Validate characters for the given base
        const validChars = {
            2: /^[01]+$/,
            8: /^[0-7]+$/,
            10: /^-?[0-9]+$/,
            16: /^[0-9A-Fa-f]+$/
        };
        
        if (!validChars[fromBase].test(value)) {
            throw new Error(`Invalid characters for ${getSystemName(fromBase)} system`);
        }
        
        // Handle negative numbers for decimal
        let isNegative = false;
        if (fromBase === 10 && value.startsWith('-')) {
            isNegative = true;
            value = value.substring(1);
        }
        
        // Convert to decimal first
        let decimalValue = parseInt(value, fromBase);
        
        if (isNaN(decimalValue)) {
            throw new Error('Invalid number format');
        }
        
        // Apply negative sign if needed
        if (isNegative) {
            decimalValue = -decimalValue;
        }
        
        // Convert to target base
        let result;
        if (toBase === 10) {
            result = decimalValue.toString();
        } else if (toBase === 2) {
            result = decimalValue.toString(2);
        } else if (toBase === 8) {
            result = decimalValue.toString(8);
        } else if (toBase === 16) {
            result = decimalValue.toString(16).toUpperCase();
        }
        
        return result;
    }
    
    // Get system name
    function getSystemName(base) {
        const names = {
            2: 'Binary',
            8: 'Octal',
            10: 'Decimal',
            16: 'Hexadecimal'
        };
        return names[base];
    }
    
    // Format result with prefix
    function formatResult(value, base) {
        const prefixes = {
            2: '0b',
            8: '0o',
            16: '0x'
        };
        
        return base !== 10 ? (prefixes[base] || '') + value : value;
    }
    
    // Render history
    function renderHistory() {
        historyList.innerHTML = '';
        
        if (conversionHistory.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: var(--muted);">No conversion history yet</p>';
            return;
        }
        
        conversionHistory.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            historyItem.innerHTML = `
                <div class="history-content">
                    <strong>${item.input}</strong> (${getSystemName(item.fromBase)}) → 
                    <strong>${formatResult(item.result, item.toBase)}</strong> (${getSystemName(item.toBase)})
                    <br><small>${new Date(item.timestamp).toLocaleString()}</small>
                </div>
                <div class="history-actions">
                    <button title="Use this conversion" onclick="useHistoryItem(${index})">↻</button>
                    <button title="Delete this item" onclick="deleteHistoryItem(${index})">×</button>
                </div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }
    
    // Use history item
    window.useHistoryItem = function(index) {
        const item = conversionHistory[index];
        numberInput.value = item.input;
        currentSystem.value = item.fromBase;
        targetSystem.value = item.toBase;
        
        // Trigger conversion
        convertBtn.click();
    };
    
    // Delete history item
    window.deleteHistoryItem = function(index) {
        conversionHistory.splice(index, 1);
        localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
        renderHistory();
    };
    
    // Convert button click
    convertBtn.addEventListener('click', function() {
        // Reset messages
        inputError.textContent = '';
        successMessage.textContent = '';
        resultContainer.style.display = 'none';
        
        try {
            const inputValue = numberInput.value.trim();
            const fromBase = parseInt(currentSystem.value);
            const toBase = parseInt(targetSystem.value);
            
            if (fromBase === toBase) {
                throw new Error('Source and target number systems are the same');
            }
            
            const convertedValue = convertNumber(inputValue, fromBase, toBase);
            const formattedResult = formatResult(convertedValue, toBase);
            
            result.textContent = formattedResult;
            resultContainer.style.display = 'block';
            
            // Update visualization
            visualizeNumber(inputValue, fromBase, toBase);
            
        } catch (error) {
            inputError.textContent = error.message;
        }
    });
    
    // Copy result - Fixed clipboard functionality
    copyBtn.addEventListener('click', function() {
        const resultText = result.textContent;
        
        // Create a temporary textarea element
        const textArea = document.createElement('textarea');
        textArea.value = resultText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            // Try to use the modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(resultText).then(function() {
                    showSuccessMessage('Result copied to clipboard!');
                }).catch(function() {
                    // Fallback to deprecated method
                    document.execCommand('copy');
                    showSuccessMessage('Result copied to clipboard!');
                });
            } else {
                // Fallback for older browsers
                document.execCommand('copy');
                showSuccessMessage('Result copied to clipboard!');
            }
        } catch (err) {
            showErrorMessage('Failed to copy to clipboard');
        }
        
        // Clean up
        document.body.removeChild(textArea);
    });
    
    // Helper function to show success message
    function showSuccessMessage(message) {
        successMessage.textContent = message;
        successMessage.style.color = 'var(--success)';
        setTimeout(() => {
            successMessage.textContent = '';
        }, 3000);
    }
    
    // Helper function to show error message
    function showErrorMessage(message) {
        successMessage.textContent = message;
        successMessage.style.color = 'var(--danger)';
        setTimeout(() => {
            successMessage.textContent = '';
            successMessage.style.color = 'var(--success)';
        }, 3000);
    }
    
    // Save to history
    saveBtn.addEventListener('click', function() {
        const inputValue = numberInput.value.trim();
        const fromBase = parseInt(currentSystem.value);
        const toBase = parseInt(targetSystem.value);
        const resultValue = result.textContent;
        
        // Check if this conversion is already in history
        const isDuplicate = conversionHistory.some(item => 
            item.input === inputValue && 
            item.fromBase === fromBase && 
            item.toBase === toBase
        );
        
        if (!isDuplicate) {
            conversionHistory.unshift({
                input: inputValue,
                fromBase: fromBase,
                toBase: toBase,
                result: resultValue.replace(/^0[box]/, ''), // Remove prefix for storage
                timestamp: new Date().toISOString()
            });
            
            // Keep only last 50 items
            if (conversionHistory.length > 50) {
                conversionHistory = conversionHistory.slice(0, 50);
            }
            
            localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
            renderHistory();
            
            showSuccessMessage('Saved to history!');
        } else {
            showErrorMessage('This conversion is already in history');
        }
    });
    
    // Export single result as PDF
    exportPdfBtn.addEventListener('click', function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const inputValue = numberInput.value.trim();
        const fromBase = parseInt(currentSystem.value);
        const toBase = parseInt(targetSystem.value);
        const resultValue = result.textContent;
        
        doc.setFontSize(20);
        doc.text('Number System Conversion', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Input: ${inputValue} (${getSystemName(fromBase)})`, 20, 40);
        doc.text(`Output: ${resultValue} (${getSystemName(toBase)})`, 20, 50);
        doc.text(`Date: ${new Date().toLocaleString()}`, 20, 60);
        
        doc.save(`conversion_${new Date().getTime()}.pdf`);
        
        showSuccessMessage('PDF exported successfully!');
    });
    
    // Clear history
    clearHistoryBtn.addEventListener('click', function() {
        if (conversionHistory.length > 0 && confirm('Are you sure you want to clear all history?')) {
            conversionHistory = [];
            localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
            renderHistory();
        }
    });
    
    // Export history as PDF
    exportHistoryBtn.addEventListener('click', function() {
        if (conversionHistory.length === 0) {
            alert('No history to export');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('Conversion History', 20, 20);
        
        let yPosition = 40;
        conversionHistory.forEach((item, index) => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFontSize(10);
            doc.text(`${index + 1}. ${item.input} (${getSystemName(item.fromBase)}) → ${formatResult(item.result, item.toBase)} (${getSystemName(item.toBase)})`, 20, yPosition);
            doc.text(`   ${new Date(item.timestamp).toLocaleString()}`, 20, yPosition + 5);
            
            yPosition += 15;
        });
        
        doc.save(`conversion_history_${new Date().getTime()}.pdf`);
        
        showSuccessMessage('History exported as PDF!');
    });
    
    // Enter key to convert
    numberInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            convertBtn.click();
        }
    });
    
    // Chatbot functionality
    chatbotIcon.addEventListener('click', function() {
        chatbotWindow.style.display = 'flex';
    });
    
    closeChat.addEventListener('click', function() {
        chatbotWindow.style.display = 'none';
    });
    
    // Language detection and response mapping
    const languagePatterns = {
        greetings: {
            patterns: [
                /hello|hi|hey|greetings|hola|bonjour|hallo|ciao|ola|namaste|salut/i,
                /good morning|good afternoon|good evening/i
            ],
            responses: [
                "Hello! How can I help you with number systems today?",
                "Hi there! I'm here to assist with number system conversions.",
                "Greetings! Ask me anything about binary, decimal, octal, or hexadecimal systems."
            ]
        },
        thanks: {
            patterns: [
                /thank you|thanks|gracias|merci|danke|grazie|arigato|spasibo|xie xie/i,
                /appreciate it|much obliged/i
            ],
            responses: [
                "You're welcome! Happy to help with your number conversions.",
                "My pleasure! Let me know if you need anything else.",
                "Glad I could assist! Feel free to ask more questions."
            ]
        },
        help: {
            patterns: [
                /help|assist|support|guide|how does this work/i,
                /what can you do|what are your functions/i
            ],
            responses: [
                "I can explain different number systems, help with conversions, or answer questions about this tool.",
                "I'm here to assist with number system conversions and explanations. Try asking about binary, decimal, octal, or hexadecimal systems.",
                "I can help you understand number systems, perform conversions, or explain how this converter works."
            ]
        },
        binary: {
            patterns: [
                /binary|base 2|bits|0 and 1/i,
                /how does binary work|what is binary/i
            ],
            responses: [
                "Binary is a base-2 number system using only 0 and 1. Each digit is called a bit. Computers use binary because they work with on/off states.",
                "Binary represents numbers using only two digits: 0 and 1. Each position represents a power of 2 (1, 2, 4, 8, 16, etc.).",
                "In binary, each digit's value doubles as you move left. For example, 1011 in binary equals 1×8 + 0×4 + 1×2 + 1×1 = 11 in decimal."
            ]
        },
        decimal: {
            patterns: [
                /decimal|base 10|normal numbers|everyday numbers/i,
                /how does decimal work|what is decimal/i
            ],
            responses: [
                "Decimal is our everyday base-10 system using digits 0-9. Each position represents a power of 10 (1, 10, 100, 1000, etc.).",
                "The decimal system is what we use in daily life. Each digit's value increases by a factor of 10 as you move left.",
                "In decimal, 123 means 1×100 + 2×10 + 3×1. It's called base-10 because it uses 10 distinct digits (0-9)."
            ]
        },
        octal: {
            patterns: [
                /octal|base 8|digits 0-7/i,
                /how does octal work|what is octal/i
            ],
            responses: [
                "Octal is a base-8 system using digits 0-7. It was historically used in computing but has been largely replaced by hexadecimal.",
                "In octal, each position represents a power of 8. For example, 23 in octal equals 2×8 + 3×1 = 19 in decimal.",
                "Octal uses only digits 0-7. It's sometimes used as a shorthand for binary, since each octal digit represents 3 bits."
            ]
        },
        hexadecimal: {
            patterns: [
                /hex|hexadecimal|base 16|0-9 and a-f/i,
                /how does hex work|what is hexadecimal/i
            ],
            responses: [
                "Hexadecimal is a base-16 system using digits 0-9 and letters A-F. It's commonly used in computing to represent binary data compactly.",
                "In hex, each position represents a power of 16. Letters A-F represent values 10-15. For example, 1F in hex equals 1×16 + 15×1 = 31 in decimal.",
                "Hexadecimal is popular in computing because each hex digit represents 4 bits, making it easy to convert to/from binary."
            ]
        },
        conversion: {
            patterns: [
                /convert|conversion|change|transform/i,
                /how to convert|conversion process/i
            ],
            responses: [
                "To convert between number systems: enter your number, select the current system, choose the target system, and click Convert. The tool handles the math!",
                "This converter first changes your number to decimal, then to the target base. For example, to convert binary to hex: binary → decimal → hex.",
                "The conversion process uses mathematical algorithms. Enter your number, select 'from' and 'to' systems, then click Convert for instant results."
            ]
        },
        default: {
            responses: [
                "I'm not sure I understand. Could you rephrase your question?",
                "I'm specialized in number systems. Try asking about binary, decimal, octal, hexadecimal, or conversions.",
                "I'm here to help with number system conversions. What would you like to know?"
            ]
        }
    };
    
    function getAIResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check each category
        for (const [category, data] of Object.entries(languagePatterns)) {
            if (category === 'default') continue;
            
            for (const pattern of data.patterns) {
                if (pattern.test(lowerMessage)) {
                    // Return a random response from the category
                    return data.responses[Math.floor(Math.random() * data.responses.length)];
                }
            }
        }
        
        // Default response
        return languagePatterns.default.responses[
            Math.floor(Math.random() * languagePatterns.default.responses.length)
        ];
    }
    
    function addChatMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        messageDiv.textContent = text;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
    
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = 'AI is thinking <div class="typing-dots"><span></span><span></span><span></span></div>';
        chatbotMessages.appendChild(typingDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        return typingDiv;
    }
    
    sendChatMessage.addEventListener('click', function() {
        const message = chatbotInput.value.trim();
        if (message) {
            addChatMessage(message, true);
            chatbotInput.value = '';
            
            // Show typing indicator
            const typingIndicator = showTypingIndicator();
            
            // Simulate AI thinking
            setTimeout(() => {
                chatbotMessages.removeChild(typingIndicator);
                const response = getAIResponse(message);
                addChatMessage(response, false);
            }, 1000 + Math.random() * 1000);
        }
    });
    
    chatbotInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage.click();
        }
    });
});