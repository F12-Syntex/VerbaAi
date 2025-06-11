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

        // Dispatch keyboard events in proper sequence
        const keydownEvent = new KeyboardEvent('keydown', eventOptions);
        element.dispatchEvent(keydownEvent);
        
        // Small delay between keydown and keyup
        await KeyboardUtils.sleep(5);
        
        // Only dispatch keyup if keydown wasn't prevented
        if (!keydownEvent.defaultPrevented) {
            const keyupEvent = new KeyboardEvent('keyup', eventOptions);
            element.dispatchEvent(keyupEvent);
        }
    }
}

module.exports = KeyboardUtils;