const KeyboardUtils = require('../utils/keyboard');
const { TIMINGS } = require('../utils/constants');

class TextProcessor {
    async simulateUserTyping(textArea, newText) {
        // Ensure proper focus
        textArea.focus();
        textArea.click(); // Sometimes needed for Discord's editor
        await KeyboardUtils.sleep(TIMINGS.FOCUS_DELAY);
        
        await this.clearExistingText(textArea);
        await KeyboardUtils.sleep(TIMINGS.CLEAR_DELAY);
        
        await this.typeTextCharByChar(textArea, newText);
        
        // Ensure proper cursor position at the end
        await this.setCursorToEnd(textArea);
        
        // Trigger a final input event to ensure Discord knows the content changed
        textArea.dispatchEvent(new Event('input', { bubbles: true }));
        textArea.dispatchEvent(new Event('change', { bubbles: true }));
    }

    async setCursorToEnd(textArea) {
        try {
            const selection = window.getSelection();
            const range = document.createRange();
            
            // Move cursor to the very end
            if (textArea.childNodes.length > 0) {
                const lastNode = textArea.childNodes[textArea.childNodes.length - 1];
                if (lastNode.nodeType === Node.TEXT_NODE) {
                    range.setStart(lastNode, lastNode.textContent.length);
                } else {
                    range.setStartAfter(lastNode);
                }
            } else {
                range.setStart(textArea, 0);
            }
            
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Ensure focus
            textArea.focus();
            
        } catch (error) {
            console.log('Could not set cursor position:', error);
            // Fallback: just focus
            textArea.focus();
        }
    }

    async simpleBulkReplace(textArea, newText) {
        textArea.focus();
        textArea.click();
        await KeyboardUtils.sleep(TIMINGS.FOCUS_DELAY);
        
        // Select all content
        await this.selectAllAndDelete(textArea);
        await KeyboardUtils.sleep(100);
        
        // Insert all text at once
        const inputEvent = new InputEvent('beforeinput', {
            inputType: 'insertText',
            data: newText,
            bubbles: true,
            cancelable: true
        });
        textArea.dispatchEvent(inputEvent);
        
        // Try execCommand first
        const inserted = document.execCommand('insertText', false, newText);
        
        if (!inserted) {
            // Manual insertion
            try {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0) || document.createRange();
                range.deleteContents();
                range.insertNode(document.createTextNode(newText));
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            } catch (error) {
                // Last resort: direct content manipulation
                textArea.textContent = newText;
            }
        }
        
        // Dispatch events
        textArea.dispatchEvent(new Event('input', { bubbles: true }));
        textArea.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Ensure cursor is at the end
        await this.setCursorToEnd(textArea);
    }

    async clearExistingText(textArea) {
        await this.selectAllAndDelete(textArea);
        
        await KeyboardUtils.sleep(50);
        const remainingText = textArea.textContent || textArea.innerText || '';
        
        if (remainingText.trim()) {
            console.log('Ctrl+A method failed, trying manual selection...');
            await this.manualSelectAndDelete(textArea);
            
            await KeyboardUtils.sleep(50);
            const stillRemainingText = textArea.textContent || textArea.innerText || '';
            
            if (stillRemainingText.trim()) {
                console.log('Manual selection failed, trying backspace method...');
                await this.backspaceAllText(textArea);
            }
        }
    }

    async selectAllAndDelete(textArea) {
        await KeyboardUtils.simulateKeyPress(textArea, { 
            key: 'a', 
            code: 'KeyA',
            keyCode: 65,
            ctrlKey: true 
        });
        
        await KeyboardUtils.sleep(50);
        
        await KeyboardUtils.simulateKeyPress(textArea, { 
            key: 'Delete', 
            code: 'Delete',
            keyCode: 46 
        });
        
        await KeyboardUtils.sleep(20);
        await KeyboardUtils.simulateKeyPress(textArea, { 
            key: 'Backspace', 
            code: 'Backspace',
            keyCode: 8 
        });
    }

    async manualSelectAndDelete(textArea) {
        const selection = window.getSelection();
        const range = document.createRange();
        
        try {
            range.selectNodeContents(textArea);
            selection.removeAllRanges();
            selection.addRange(range);
            
            textArea.dispatchEvent(new Event('selectstart', { bubbles: true }));
            textArea.dispatchEvent(new Event('selectionchange', { bubbles: true }));
            
            await KeyboardUtils.sleep(30);
            
            await KeyboardUtils.simulateKeyPress(textArea, { 
                key: 'Delete', 
                code: 'Delete',
                keyCode: 46 
            });
            
            await KeyboardUtils.sleep(20);
            
            await KeyboardUtils.simulateKeyPress(textArea, { 
                key: 'Backspace', 
                code: 'Backspace',
                keyCode: 8 
            });
            
        } catch (error) {
            console.log('Manual selection failed:', error);
        }
    }

    async backspaceAllText(textArea) {
        const currentText = textArea.textContent || textArea.innerText || '';
        const textLength = currentText.length;
        
        console.log(`Attempting to backspace ${textLength} characters...`);
        
        const selection = window.getSelection();
        const range = document.createRange();
        
        try {
            range.selectNodeContents(textArea);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
            
            for (let i = 0; i < textLength + 5; i++) {
                await KeyboardUtils.simulateKeyPress(textArea, { 
                    key: 'Backspace', 
                    code: 'Backspace',
                    keyCode: 8 
                });
                await KeyboardUtils.sleep(20);
            }
            
        } catch (error) {
            console.log('Backspace method failed:', error);
        }
    }

    async typeTextCharByChar(textArea, text) {
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char === '\n') {
                await KeyboardUtils.simulateKeyPress(textArea, { key: 'Enter', keyCode: 13 });
            } else {
                await KeyboardUtils.simulateKeyPress(textArea, { key: char });
            }
            
            await KeyboardUtils.sleep(TIMINGS.TYPING_DELAY);
        }
    }

    getTextFromInput() {
        const textArea = document.querySelector('[data-slate-editor="true"]');
        if (!textArea) {
            return null;
        }
        return textArea.textContent || textArea.innerText || '';
    }
}

module.exports = TextProcessor;