const KeyboardUtils = require('../utils/keyboard');
const { TIMINGS } = require('../utils/constants');

class TextProcessor {
    async simulateUserTyping(textArea, newText) {
        textArea.focus();
        await KeyboardUtils.sleep(TIMINGS.FOCUS_DELAY);
        
        await this.clearExistingText(textArea);
        await KeyboardUtils.sleep(TIMINGS.CLEAR_DELAY);
        
        await this.typeTextCharByChar(textArea, newText);
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
                await KeyboardUtils.sleep(5);
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