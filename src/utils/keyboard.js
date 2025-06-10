class KeyboardUtils {
    static getKeyCode(key) {
        const keyCodes = {
            'Backspace': 8,
            'Tab': 9,
            'Enter': 13,
            'Shift': 16,
            'Ctrl': 17,
            'Alt': 18,
            'Escape': 27,
            'Space': 32,
            'Delete': 46,
            'a': 65, 'A': 65, 'b': 66, 'B': 66, 'c': 67, 'C': 67,
            'd': 68, 'D': 68, 'e': 69, 'E': 69, 'f': 70, 'F': 70,
            'g': 71, 'G': 71, 'h': 72, 'H': 72, 'i': 73, 'I': 73,
            'j': 74, 'J': 74, 'k': 75, 'K': 75, 'l': 76, 'L': 76,
            'm': 77, 'M': 77, 'n': 78, 'N': 78, 'o': 79, 'O': 79,
            'p': 80, 'P': 80, 'q': 81, 'Q': 81, 'r': 82, 'R': 82,
            's': 83, 'S': 83, 't': 84, 'T': 84, 'u': 85, 'U': 85,
            'v': 86, 'V': 86, 'w': 87, 'W': 87, 'x': 88, 'X': 88,
            'y': 89, 'Y': 89, 'z': 90, 'Z': 90,
        };
        
        return keyCodes[key] || key.charCodeAt(0);
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async simulateKeyPress(element, keyConfig) {
        const {
            key,
            code = key,
            keyCode = KeyboardUtils.getKeyCode(key),
            ctrlKey = false,
            shiftKey = false,
            altKey = false,
            metaKey = false
        } = keyConfig;

        const eventOptions = {
            key, code, keyCode,
            which: keyCode,
            ctrlKey, shiftKey, altKey, metaKey,
            bubbles: true,
            cancelable: true
        };

        // Dispatch keydown
        const keydownEvent = new KeyboardEvent('keydown', eventOptions);
        element.dispatchEvent(keydownEvent);

        // Handle different types of keys
        if (key === 'Delete' || key === 'Backspace') {
            await KeyboardUtils._handleDeleteKey(element, key);
        } else if (ctrlKey && key.toLowerCase() === 'a') {
            await KeyboardUtils._handleSelectAll(element);
        } else if (key.length === 1 && !ctrlKey && !altKey && !metaKey) {
            await KeyboardUtils._handleCharacterKey(element, key);
        }

        // Dispatch keyup
        const keyupEvent = new KeyboardEvent('keyup', eventOptions);
        element.dispatchEvent(keyupEvent);
    }

    static async _handleDeleteKey(element, key) {
        const beforeInputEvent = new InputEvent('beforeinput', {
            inputType: key === 'Delete' ? 'deleteContentForward' : 'deleteContentBackward',
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(beforeInputEvent);

        const deleted = document.execCommand('delete') || 
                       document.execCommand('forwardDelete') ||
                       KeyboardUtils._manualDeleteContent(element, key === 'Backspace');

        const inputEvent = new InputEvent('input', {
            inputType: key === 'Delete' ? 'deleteContentForward' : 'deleteContentBackward',
            bubbles: true
        });
        element.dispatchEvent(inputEvent);
    }

    static async _handleSelectAll(element) {
        const selection = window.getSelection();
        const range = document.createRange();
        
        try {
            range.selectNodeContents(element);
            selection.removeAllRanges();
            selection.addRange(range);
            
            element.dispatchEvent(new Event('selectstart', { bubbles: true }));
            document.dispatchEvent(new Event('selectionchange', { bubbles: true }));
        } catch (error) {
            console.log('Select all failed:', error);
        }
    }

    static async _handleCharacterKey(element, key) {
        const inputEvent = new InputEvent('beforeinput', {
            inputType: 'insertText',
            data: key,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(inputEvent);

        const inserted = document.execCommand('insertText', false, key);
        
        if (!inserted) {
            KeyboardUtils._manualInsertText(element, key);
        }

        const inputEventAfter = new InputEvent('input', {
            inputType: 'insertText',
            data: key,
            bubbles: true
        });
        element.dispatchEvent(inputEventAfter);
    }

    static _manualDeleteContent(element, isBackspace) {
        try {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            
            if (range.collapsed) {
                if (isBackspace) {
                    range.setStart(range.startContainer, Math.max(0, range.startOffset - 1));
                } else {
                    range.setEnd(range.endContainer, Math.min(range.endContainer.textContent.length, range.endOffset + 1));
                }
            }
            
            range.deleteContents();
            selection.removeAllRanges();
            selection.addRange(range);
            
            return true;
        } catch (error) {
            console.log('Manual delete failed:', error);
            return false;
        }
    }

    static _manualInsertText(element, text) {
        try {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            
            range.deleteContents();
            
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);
            
            range.setStartAfter(textNode);
            range.collapse(true);
            
            selection.removeAllRanges();
            selection.addRange(range);
            
            return true;
        } catch (error) {
            console.log('Manual insert failed:', error);
            return false;
        }
    }
}

module.exports = KeyboardUtils;