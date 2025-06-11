const KeyboardUtils = require('../utils/keyboard');
const { TIMINGS } = require('../utils/constants');

class TextProcessor {
    async simulateUserTyping(textArea, newText) {
        await this.prepareEditor(textArea);
        await this.clearExistingTextAggressively(textArea);
        await KeyboardUtils.sleep(TIMINGS.CLEAR_DELAY);
        
        await this.ensureProperCursorPosition(textArea);
        await this.typeTextCharByChar(textArea, newText);
        
        // Force Discord to reinitialize the editor completely
        await this.forceEditorReinit(textArea);
        await this.finalizeEditor(textArea);
    }

    async simpleBulkReplace(textArea, newText) {
        const originalDelay = TIMINGS.TYPING_DELAY;
        TIMINGS.TYPING_DELAY = 2;
        
        await this.simulateUserTyping(textArea, newText);
        
        TIMINGS.TYPING_DELAY = originalDelay;
    }

    async forceEditorReinit(textArea) {
        console.log('Forcing Discord editor reinitialization...');
        
        try {
            // Method 1: Temporarily disable and re-enable contenteditable
            await this.toggleContentEditable(textArea);
            
            // Method 2: Force a complete focus cycle with DOM manipulation
            await this.forceFocusCycle(textArea);
            
            // Method 3: Trigger Discord-specific events
            await this.triggerDiscordEvents(textArea);
            
            // Method 4: Simulate a channel switch simulation
            await this.simulateChannelRefresh(textArea);
            
            console.log('Editor reinitialization complete');
            
        } catch (error) {
            console.log('Editor reinitialization failed:', error);
        }
    }

    async toggleContentEditable(textArea) {
        try {
            console.log('Toggling contenteditable...');
            
            // Save the current state
            const originalContentEditable = textArea.getAttribute('contenteditable');
            const currentContent = this.getTextContent(textArea);
            
            // Disable contenteditable
            textArea.setAttribute('contenteditable', 'false');
            textArea.blur();
            await KeyboardUtils.sleep(100);
            
            // Re-enable contenteditable
            textArea.setAttribute('contenteditable', originalContentEditable || 'true');
            await KeyboardUtils.sleep(50);
            
            // Force focus and ensure content is still there
            textArea.focus();
            textArea.click();
            
            // Verify content is still correct
            const newContent = this.getTextContent(textArea);
            if (newContent !== currentContent) {
                console.log('Content changed during contenteditable toggle, restoring...');
                await this.restoreContent(textArea, currentContent);
            }
            
        } catch (error) {
            console.log('ContentEditable toggle failed:', error);
        }
    }

    async forceFocusCycle(textArea) {
        try {
            console.log('Forcing focus cycle...');
            
            // Create a temporary dummy element to steal focus
            const dummyElement = document.createElement('input');
            dummyElement.style.position = 'absolute';
            dummyElement.style.left = '-9999px';
            dummyElement.style.opacity = '0';
            document.body.appendChild(dummyElement);
            
            // Blur the text area
            textArea.blur();
            await KeyboardUtils.sleep(50);
            
            // Focus dummy element
            dummyElement.focus();
            await KeyboardUtils.sleep(50);
            
            // Focus back to text area
            textArea.focus();
            textArea.click();
            await KeyboardUtils.sleep(50);
            
            // Remove dummy element
            document.body.removeChild(dummyElement);
            
        } catch (error) {
            console.log('Focus cycle failed:', error);
        }
    }

    async triggerDiscordEvents(textArea) {
        try {
            console.log('Triggering Discord-specific events...');
            
            // Dispatch a series of events that Discord might be listening for
            const events = [
                new Event('focusout', { bubbles: true }),
                new Event('focusin', { bubbles: true }),
                new Event('blur', { bubbles: true }),
                new Event('focus', { bubbles: true }),
                new InputEvent('input', { 
                    inputType: 'insertText', 
                    data: '', 
                    bubbles: true 
                }),
                new Event('change', { bubbles: true }),
                new KeyboardEvent('keydown', { 
                    key: 'End', 
                    code: 'End', 
                    bubbles: true 
                }),
                new KeyboardEvent('keyup', { 
                    key: 'End', 
                    code: 'End', 
                    bubbles: true 
                })
            ];
            
            for (const event of events) {
                textArea.dispatchEvent(event);
                await KeyboardUtils.sleep(10);
            }
            
            // Also trigger selection change
            document.dispatchEvent(new Event('selectionchange'));
            
        } catch (error) {
            console.log('Discord events trigger failed:', error);
        }
    }

    async simulateChannelRefresh(textArea) {
        try {
            console.log('Simulating channel refresh behavior...');
            
            // Save current content
            const currentContent = this.getTextContent(textArea);
            
            // Find the Discord app container
            const appMount = document.querySelector('#app-mount');
            if (appMount) {
                // Trigger a mutation that might cause Discord to refresh
                const observer = new MutationObserver(() => {});
                observer.observe(appMount, { childList: true, subtree: true });
                observer.disconnect();
            }
            
            // Simulate what happens when Discord refreshes the editor
            await this.simulateDiscordRefresh(textArea, currentContent);
            
        } catch (error) {
            console.log('Channel refresh simulation failed:', error);
        }
    }

    async simulateDiscordRefresh(textArea, expectedContent) {
        try {
            // Clear and rebuild the editor content in a way Discord would recognize
            textArea.innerHTML = '';
            await KeyboardUtils.sleep(50);
            
            // Manually recreate the content structure
            if (expectedContent) {
                const lines = expectedContent.split('\n');
                
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i]) {
                        const textNode = document.createTextNode(lines[i]);
                        textArea.appendChild(textNode);
                    }
                    
                    // Add line break if not the last line
                    if (i < lines.length - 1) {
                        const br = document.createElement('br');
                        textArea.appendChild(br);
                    }
                }
            }
            
            // Force Discord to recognize the new content
            textArea.focus();
            
            // Dispatch comprehensive events
            textArea.dispatchEvent(new Event('input', { bubbles: true }));
            textArea.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Set cursor to end
            await this.setCursorToEnd(textArea);
            
        } catch (error) {
            console.log('Discord refresh simulation failed:', error);
        }
    }

    async restoreContent(textArea, content) {
        try {
            console.log('Restoring content after toggle...');
            
            // Clear current content
            textArea.innerHTML = '';
            
            // Type the content back character by character to ensure proper state
            for (let i = 0; i < content.length; i++) {
                const char = content[i];
                if (char === '\n') {
                    await this.typeEnter(textArea);
                } else {
                    await this.typeCharacter(textArea, char);
                }
                await KeyboardUtils.sleep(2); // Fast restore
            }
            
        } catch (error) {
            console.log('Content restoration failed:', error);
        }
    }

    async prepareEditor(textArea) {
        textArea.focus();
        textArea.click();
        await KeyboardUtils.sleep(TIMINGS.FOCUS_DELAY);
        textArea.dispatchEvent(new Event('focus', { bubbles: true }));
    }

    async ensureProperCursorPosition(textArea) {
        console.log('Ensuring proper cursor position...');
        
        try {
            const selection = window.getSelection();
            const range = document.createRange();
            
            if (textArea.childNodes.length === 0 || !this.getTextContent(textArea).trim()) {
                range.setStart(textArea, 0);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                
                console.log('Cursor positioned at beginning of empty editor');
            } else {
                range.selectNodeContents(textArea);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
                
                console.log('Cursor positioned at end of existing content');
            }
            
            textArea.focus();
            await KeyboardUtils.sleep(50);
            document.dispatchEvent(new Event('selectionchange'));
            
        } catch (error) {
            console.log('Cursor positioning failed, trying alternative:', error);
            
            textArea.focus();
            textArea.click();
            
            await KeyboardUtils.simulateKeyPress(textArea, { 
                key: 'Home',
                code: 'Home',
                keyCode: 36,
                ctrlKey: true 
            });
        }
        
        await KeyboardUtils.sleep(100);
        console.log('Cursor positioning complete');
    }

    async clearExistingTextAggressively(textArea) {
        console.log('Starting aggressive text clearing...');
        
        for (let attempt = 0; attempt < 5; attempt++) {
            console.log(`Clear attempt ${attempt + 1}`);
            
            await KeyboardUtils.simulateKeyPress(textArea, { 
                key: 'a', 
                ctrlKey: true 
            });
            await KeyboardUtils.sleep(100);
            
            await KeyboardUtils.simulateKeyPress(textArea, { 
                key: 'Delete'
            });
            await KeyboardUtils.sleep(50);
            
            await KeyboardUtils.simulateKeyPress(textArea, { 
                key: 'Backspace'
            });
            await KeyboardUtils.sleep(50);
            
            const remaining = this.getTextContent(textArea);
            console.log(`Remaining text after attempt ${attempt + 1}:`, `"${remaining}"`);
            
            if (!remaining.trim()) {
                console.log('Text cleared successfully!');
                await this.cleanupAfterClear(textArea);
                return;
            }
        }
        
        console.log('Ctrl+A method failed, trying manual selection...');
        await this.manualSelectAndClear(textArea);
        
        let remaining = this.getTextContent(textArea);
        if (remaining.trim()) {
            console.log('Manual selection failed, trying brute force backspace...');
            await this.bruteForceBackspace(textArea, remaining.length + 20);
        }
        
        remaining = this.getTextContent(textArea);
        if (remaining.trim()) {
            console.log('All methods failed, doing nuclear clear...');
            await this.nuclearClear(textArea);
        }
        
        await this.cleanupAfterClear(textArea);
        
        const finalText = this.getTextContent(textArea);
        console.log('Final text after clearing:', `"${finalText}"`);
    }

    async cleanupAfterClear(textArea) {
        console.log('Cleaning up after clear...');
        
        if (textArea.innerHTML.trim() && !this.getTextContent(textArea).trim()) {
            textArea.innerHTML = '';
        }
        
        try {
            const selection = window.getSelection();
            const range = document.createRange();
            range.setStart(textArea, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } catch (error) {
            console.log('Cleanup cursor positioning failed:', error);
        }
        
        textArea.focus();
        textArea.click();
        textArea.dispatchEvent(new Event('input', { bubbles: true }));
        
        await KeyboardUtils.sleep(100);
        console.log('Cleanup complete');
    }

    async typeTextCharByChar(textArea, text) {
        console.log('Starting to type text:', `"${text}"`);
        console.log('Text length:', text.length);
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            console.log(`Typing character ${i + 1}/${text.length}: "${char}"`);
            
            if (char === '\n') {
                await this.typeEnter(textArea);
            } else {
                await this.typeCharacter(textArea, char);
            }
            
            await KeyboardUtils.sleep(TIMINGS.TYPING_DELAY);
            
            const currentContent = this.getTextContent(textArea);
            console.log(`Content after typing char ${i + 1}: "${currentContent}"`);
        }
        
        console.log('Finished typing text');
        const finalContent = this.getTextContent(textArea);
        console.log('Final content before reinit:', `"${finalContent}"`);
    }

    async typeCharacter(textArea, char) {
        textArea.focus();
        
        await KeyboardUtils.simulateKeyPress(textArea, { 
            key: char,
            code: this.getKeyCode(char),
            keyCode: KeyboardUtils.getKeyCode(char)
        });
        
        await KeyboardUtils.sleep(10);
        
        const beforeInputEvent = new InputEvent('beforeinput', {
            inputType: 'insertText',
            data: char,
            bubbles: true,
            cancelable: true
        });
        
        if (textArea.dispatchEvent(beforeInputEvent)) {
            const success = document.execCommand('insertText', false, char);
            
            if (!success) {
                console.log(`execCommand failed for "${char}", trying manual insert`);
                this.manualInsertCharacter(textArea, char);
            }
            
            const inputEvent = new InputEvent('input', {
                inputType: 'insertText',
                data: char,
                bubbles: true
            });
            textArea.dispatchEvent(inputEvent);
        }
    }

    getKeyCode(char) {
        if (char.length === 1) {
            const charCode = char.charCodeAt(0);
            if (charCode >= 97 && charCode <= 122) { // a-z
                return `Key${char.toUpperCase()}`;
            } else if (charCode >= 65 && charCode <= 90) { // A-Z
                return `Key${char}`;
            } else if (charCode >= 48 && charCode <= 57) { // 0-9
                return `Digit${char}`;
            } else {
                const specialKeys = {
                    ' ': 'Space',
                    '.': 'Period',
                    ',': 'Comma',
                    ';': 'Semicolon',
                    "'": 'Quote',
                    '[': 'BracketLeft',
                    ']': 'BracketRight',
                    '\\': 'Backslash',
                    '/': 'Slash',
                    '=': 'Equal',
                    '-': 'Minus'
                };
                return specialKeys[char] || 'Unidentified';
            }
        }
        return char;
    }

    async manualSelectAndClear(textArea) {
        try {
            const selection = window.getSelection();
            const range = document.createRange();
            
            range.selectNodeContents(textArea);
            selection.removeAllRanges();
            selection.addRange(range);
            
            textArea.dispatchEvent(new Event('selectstart', { bubbles: true }));
            document.dispatchEvent(new Event('selectionchange'));
            
            await KeyboardUtils.sleep(100);
            
            const beforeInputEvent = new InputEvent('beforeinput', {
                inputType: 'deleteContentBackward',
                bubbles: true,
                cancelable: true
            });
            textArea.dispatchEvent(beforeInputEvent);
            
            range.deleteContents();
            
            await KeyboardUtils.sleep(50);
            
            await KeyboardUtils.simulateKeyPress(textArea, { 
                key: 'Delete'
            });
            await KeyboardUtils.simulateKeyPress(textArea, { 
                key: 'Backspace'
            });
            
            const inputEvent = new InputEvent('input', {
                inputType: 'deleteContentBackward',
                bubbles: true
            });
            textArea.dispatchEvent(inputEvent);
            
        } catch (error) {
            console.log('Manual select and clear failed:', error);
        }
    }

    async bruteForceBackspace(textArea, maxPresses) {
        console.log(`Brute force backspace: ${maxPresses} presses`);
        
        await KeyboardUtils.simulateKeyPress(textArea, { 
            key: 'End',
            ctrlKey: true 
        });
        await KeyboardUtils.sleep(50);
        
        for (let i = 0; i < maxPresses; i++) {
            await KeyboardUtils.simulateKeyPress(textArea, { 
                key: 'Backspace'
            });
            await KeyboardUtils.sleep(5);
            
            if (i % 10 === 0) {
                const remaining = this.getTextContent(textArea);
                if (!remaining.trim()) {
                    console.log(`Cleared after ${i + 1} backspaces`);
                    return;
                }
            }
        }
    }

    async nuclearClear(textArea) {
        console.log('Performing nuclear clear...');
        
        try {
            const attributes = {
                'data-slate-editor': textArea.getAttribute('data-slate-editor'),
                'contenteditable': textArea.getAttribute('contenteditable'),
                'role': textArea.getAttribute('role'),
                'aria-label': textArea.getAttribute('aria-label'),
                'aria-multiline': textArea.getAttribute('aria-multiline'),
                'class': textArea.className,
                'style': textArea.getAttribute('style')
            };
            
            textArea.innerHTML = '';
            textArea.textContent = '';
            textArea.innerText = '';
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (value !== null) {
                    if (key === 'class') {
                        textArea.className = value;
                    } else if (key === 'style') {
                        textArea.setAttribute('style', value);
                    } else {
                        textArea.setAttribute(key, value);
                    }
                }
            });
            
            textArea.focus();
            textArea.click();
            
            textArea.dispatchEvent(new Event('focus', { bubbles: true }));
            textArea.dispatchEvent(new Event('input', { bubbles: true }));
            
            await KeyboardUtils.sleep(100);
            
        } catch (error) {
            console.log('Nuclear clear failed:', error);
        }
    }

    getTextContent(textArea) {
        return textArea.textContent || textArea.innerText || textArea.innerHTML.replace(/<[^>]*>/g, '') || '';
    }

    async typeEnter(textArea) {
        textArea.focus();
        
        await KeyboardUtils.simulateKeyPress(textArea, { 
            key: 'Enter',
            code: 'Enter',
            keyCode: 13
        });
        
        const beforeInputEvent = new InputEvent('beforeinput', {
            inputType: 'insertLineBreak',
            bubbles: true,
            cancelable: true
        });
        
        if (textArea.dispatchEvent(beforeInputEvent)) {
            let success = false;
            
            try {
                success = document.execCommand('insertLineBreak', false, null);
            } catch (e) {
                try {
                    success = document.execCommand('insertHTML', false, '<br>');
                } catch (e2) {
                    success = document.execCommand('insertText', false, '\n');
                }
            }
            
            if (!success) {
                this.manualInsertLineBreak(textArea);
            }
            
            const inputEvent = new InputEvent('input', {
                inputType: 'insertLineBreak',
                bubbles: true
            });
            textArea.dispatchEvent(inputEvent);
        }
    }

    manualInsertCharacter(textArea, char) {
        try {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0) || document.createRange();
            
            const textNode = document.createTextNode(char);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
        } catch (error) {
            console.log('Manual character insert failed:', error);
        }
    }

    manualInsertLineBreak(textArea) {
        try {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0) || document.createRange();
            
            const br = document.createElement('br');
            range.insertNode(br);
            range.setStartAfter(br);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
        } catch (error) {
            console.log('Manual line break insert failed:', error);
        }
    }

    async finalizeEditor(textArea) {
        console.log('Finalizing editor...');
        
        textArea.focus();
        await KeyboardUtils.sleep(50);
        
        this.setCursorToEnd(textArea);
        
        textArea.dispatchEvent(new Event('input', { bubbles: true }));
        textArea.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('Editor finalization complete');
        
        const finalContent = this.getTextContent(textArea);
        console.log('Final editor content after reinit:', `"${finalContent}"`);
    }

    setCursorToEnd(textArea) {
        try {
            const selection = window.getSelection();
            const range = document.createRange();
            
            if (textArea.childNodes.length > 0) {
                range.selectNodeContents(textArea);
                range.collapse(false);
            } else {
                range.setStart(textArea, 0);
                range.collapse(true);
            }
            
            selection.removeAllRanges();
            selection.addRange(range);
            
        } catch (error) {
            console.log('Cursor positioning failed:', error);
        }
    }

    getTextFromInput() {
        const textArea = document.querySelector('[data-slate-editor="true"]');
        if (!textArea) {
            return null;
        }
        return this.getTextContent(textArea);
    }
}

module.exports = TextProcessor;