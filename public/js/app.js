// ========== Collapsible Section Functionality ==========
/**
 * Toggle collapsible content visibility
 * @param {HTMLElement} button - The button element that was clicked
 */
function toggleCollapsible(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('.collapsible-icon');
    const isExpanded = content.classList.contains('expanded');

    if (isExpanded) {
        content.classList.remove('expanded');
        icon.classList.remove('expanded');
        button.querySelector('span:last-child').textContent = '使い方を表示';
        button.setAttribute('aria-expanded', 'false');
    } else {
        content.classList.add('expanded');
        icon.classList.add('expanded');
        button.querySelector('span:last-child').textContent = '使い方を非表示';
        button.setAttribute('aria-expanded', 'true');
    }
}

// ========== Global State Variables ==========
let recognition = null;
let languageModelSession = null;
let translationDebounceTimer = null;
let translationHistory = [];
let lastFinalTranscript = '';
let isTranslating = false;
let silenceTimer = null;
let currentSessionText = '';
let currentSessionTranslation = '';
let lastActivityTime = 0;

// ========== DOM Element References ==========
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const englishText = document.getElementById('englishText');
const japaneseText = document.getElementById('japaneseText');
const historyDiv = document.getElementById('history');
const aiStatus = document.getElementById('ai-status');
const speechStatus = document.getElementById('speech-status');
const modelStatus = document.getElementById('model-status');
const warningDiv = document.getElementById('warning');
const warningText = document.getElementById('warning-text');
const translationLoader = document.getElementById('translationLoader');
const initButton = document.getElementById('initialize-model-button');
const usageToggle = document.getElementById('usage-toggle');

// ========== Initialization ==========
/**
 * Initialize the application
 * Checks API availability, permissions, and model status
 */
async function initialize() {
    // Chrome AI APIの確認
    if (!window.LanguageModel) {
        showWarning('Chrome AI APIが利用できません。Chromeを最新バージョン (Stable 140+) にアップデートし、必要に応じて Prompt API の Origin Trial トークンが設定されているか確認してください。');
        aiStatus.textContent = '利用不可';
        aiStatus.className = 'status-value inactive';
        startBtn.disabled = true;
        return;
    }

    aiStatus.textContent = '利用可能';
    aiStatus.className = 'status-value active';

    // Web Speech APIの確認
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showWarning('Web Speech APIが利用できません。Chrome等の対応ブラウザを使用してください。');
        speechStatus.textContent = '利用不可';
        speechStatus.className = 'status-value inactive';
        startBtn.disabled = true;
        return;
    }

    // マイクアクセス許可状態を確認
    try {
        const permissions = await navigator.permissions.query({ name: 'microphone' });
        if (permissions.state === 'denied') {
            showWarning('マイクアクセスが拒否されています。ブラウザの設定でマイクアクセスを許可してください。');
            speechStatus.textContent = 'アクセス拒否';
            speechStatus.className = 'status-value inactive';
            startBtn.disabled = true;
            return;
        } else if (permissions.state === 'prompt') {
            speechStatus.textContent = '許可待ち';
            speechStatus.className = 'status-value loading';
        } else {
            speechStatus.textContent = '利用可能';
            speechStatus.className = 'status-value active';
        }
    } catch (error) {
        // permissions API が利用できない場合
        speechStatus.textContent = '利用可能';
        speechStatus.className = 'status-value active';
    }

    // AI モデルの利用可能性を確認
    await checkModelAvailability();

    // デバッグモード: AI APIが利用できない場合でも音声認識をテスト可能にする
    if (!window.LanguageModel) {
        console.log('デバッグモード: AI APIなしで音声認識のみ動作');
        startBtn.disabled = false; // 音声認識のテストを可能にする
        showWarning('デバッグモード: AI翻訳は利用できませんが、音声認識のテストが可能です。');
    }
}

// ========== Model Availability Check ==========
/**
 * Check if the AI model is available for use
 * Handles different states: available, downloadable, downloading, unavailable
 */
async function checkModelAvailability() {
    try {
        const availability = await window.LanguageModel.availability();

        switch (availability) {
            case 'available':
                modelStatus.textContent = '利用可能';
                modelStatus.className = 'status-value active';
                if (initButton) { initButton.style.display = 'none'; }
                await createLanguageModelSession();
                break;
            case 'downloadable':
                modelStatus.textContent = 'ダウンロード可能';
                modelStatus.className = 'status-value loading';
                showWarning('AI モデルのダウンロードが必要です。初回利用時は時間がかかることがあります。');
                if (initButton) {
                    initButton.style.display = '';
                    initButton.disabled = false;
                    initButton.textContent = 'AIモデルを準備する';
                }
                break;
            case 'downloading':
                modelStatus.textContent = 'ダウンロード中';
                modelStatus.className = 'status-value loading';
                showWarning('AI モデルをダウンロードしています。しばらくお待ちください。');
                if (initButton) {
                    initButton.style.display = '';
                    initButton.disabled = false;
                    initButton.textContent = 'AIモデルを準備する';
                }
                break;
            case 'unavailable':
                modelStatus.textContent = '利用不可';
                modelStatus.className = 'status-value inactive';
                showWarning('AI モデルが利用できません。システム要件を確認してください。');
                startBtn.disabled = true;
                if (initButton) { initButton.style.display = 'none'; }
                break;
        }
    } catch (error) {
        console.error('モデル確認エラー:', error);
        modelStatus.textContent = 'エラー';
        modelStatus.className = 'status-value inactive';
        showWarning('モデルの確認中にエラーが発生しました。');
    }
}

// ========== Language Model Session Creation ==========
/**
 * Create a new language model session with translation settings
 * Monitors download progress if model needs to be downloaded
 */
async function createLanguageModelSession() {
    try {
        languageModelSession = await window.LanguageModel.create({
            temperature: 0.3, // 翻訳の精度を高めるため低温度
            topK: 3,
            initialPrompts: [
                {
                    role: 'system',
                    content: 'You are a professional English to Japanese translator. Translate the given English text to natural Japanese. Only output the Japanese translation without any explanation or additional text.'
                }
            ],
            monitor(m) {
                m.addEventListener('downloadprogress', (e) => {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    modelStatus.textContent = `ダウンロード中 ${progress}%`;
                    modelStatus.className = 'status-value loading';
                });
            }
        });

        modelStatus.textContent = '準備完了';
        modelStatus.className = 'status-value active';
        hideWarning();
        if (initButton) {
            initButton.textContent = '準備完了';
            initButton.disabled = true;
            initButton.style.display = 'none';
        }
        console.log('Language Model セッションを作成しました');
    } catch (error) {
        console.error('セッション作成エラー:', error);
        modelStatus.textContent = 'エラー';
        modelStatus.className = 'status-value inactive';
        showWarning('AI モデルの初期化に失敗しました。');
        if (initButton) {
            initButton.disabled = false;
            initButton.textContent = 'AIモデルを準備する';
        }
    }
}

// ========== Speech Recognition Setup ==========
/**
 * Configure speech recognition with continuous mode and interim results
 * Sets up event handlers for recognition lifecycle
 */
function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        speechStatus.textContent = '認識中';
        speechStatus.className = 'status-value active';
        console.log('音声認識を開始しました');
    };

    recognition.onend = () => {
        console.log('音声認識が停止しました');

        // ユーザーが明示的に停止した場合は再開しない
        if (startBtn.disabled) { // 音声認識がまだアクティブな場合のみ再開
            speechStatus.textContent = '再開中';
            speechStatus.className = 'status-value loading';

            // 自動的に再開（少し遅延を入れる）
            setTimeout(() => {
                if (startBtn.disabled) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('再開失敗:', e);
                        // 再開に失敗した場合はボタン状態をリセット
                        startBtn.disabled = false;
                        stopBtn.disabled = true;
                        speechStatus.textContent = '停止';
                        speechStatus.className = 'status-value inactive';
                        showWarning('音声認識の継続に失敗しました。再度開始してください。');
                    }
                }
            }, 500);
        } else {
            speechStatus.textContent = '停止';
            speechStatus.className = 'status-value inactive';
        }
    };

    recognition.onerror = (event) => {
        console.error('音声認識エラー:', event.error);
        speechStatus.textContent = 'エラー';
        speechStatus.className = 'status-value inactive';

        // ボタンの状態を元に戻す
        startBtn.disabled = false;
        stopBtn.disabled = true;

        switch(event.error) {
            case 'no-speech':
                showWarning('音声が検出されませんでした。マイクが正常に動作しているか確認してください。');
                break;
            case 'not-allowed':
                showWarning('マイクへのアクセスが拒否されました。ブラウザの設定でマイクアクセスを許可してください。');
                speechStatus.textContent = 'アクセス拒否';
                break;
            case 'audio-capture':
                showWarning('マイクでの音声キャプチャに失敗しました。マイクが他のアプリで使用されていないか確認してください。');
                break;
            case 'network':
                showWarning('ネットワークエラーが発生しました。インターネット接続を確認してください。');
                break;
            case 'aborted':
                // ユーザーが停止した場合は警告を表示しない
                hideWarning();
                speechStatus.textContent = '停止';
                break;
            default:
                showWarning(`音声認識エラーが発生しました: ${event.error}`);
                break;
        }
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // 英語テキストの表示を更新
        if (finalTranscript || interimTranscript) {
            lastActivityTime = Date.now();
            clearTimeout(silenceTimer);
        }

        if (finalTranscript) {
            currentSessionText += (currentSessionText ? ' ' : '') + finalTranscript;
            englishText.innerHTML = currentSessionText;
            // 最終結果はすぐに翻訳
            translateText(currentSessionText, false);

            // 3秒の無音タイマーを設定
            silenceTimer = setTimeout(() => {
                saveCurrentSessionToHistory();
            }, 3000);
        } else if (interimTranscript) {
            const displayText = currentSessionText + (currentSessionText ? ' ' : '') +
                '<span class="interim-text">' + interimTranscript + '</span>';
            englishText.innerHTML = displayText;
            // 中間結果の翻訳（デバウンシング）
            debouncedTranslate(currentSessionText + ' ' + interimTranscript, false);
        }
    };
}

// ========== Translation Functions ==========
/**
 * Debounced translation to avoid excessive API calls
 * @param {string} text - Text to translate
 * @param {boolean} isFinal - Whether this is the final transcript
 */
function debouncedTranslate(text, isFinal) {
    if (!text.trim()) return;

    clearTimeout(translationDebounceTimer);
    translationDebounceTimer = setTimeout(() => {
        translateText(text, isFinal);
    }, 300); // 300ms のデバウンシング
}

/**
 * Translate text using the language model with streaming
 * @param {string} text - Text to translate
 * @param {boolean} isFinal - Whether this is the final transcript
 */
async function translateText(text, isFinal) {
    if (!languageModelSession || !text.trim() || isTranslating) return;

    isTranslating = true;
    translationLoader.style.display = 'inline-block';

    try {
        const prompt = `Translate to Japanese: "${text}"`;

        // ストリーミング対応の翻訳
        japaneseText.textContent = '';
        const stream = languageModelSession.promptStreaming(prompt);

        let fullTranslation = '';
        for await (const chunk of stream) {
            fullTranslation += chunk; // チャンクを累積
            japaneseText.textContent = fullTranslation;
            console.log('Translation chunk:', chunk); // デバッグ用
        }

        currentSessionTranslation = fullTranslation;
        console.log('Final translation saved:', fullTranslation); // デバッグ用
    } catch (error) {
        console.error('翻訳エラー:', error);
        japaneseText.textContent = '翻訳エラーが発生しました';
        currentSessionTranslation = '';
    } finally {
        isTranslating = false;
        translationLoader.style.display = 'none';
    }
}

// ========== History Management ==========
/**
 * Add a translation pair to history
 * @param {string} english - English text
 * @param {string} japanese - Japanese translation
 */
function addToHistory(english, japanese) {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    translationHistory.unshift({
        english: english,
        japanese: japanese,
        timestamp: timestamp
    });

    // 最大10件まで保持
    if (translationHistory.length > 10) {
        translationHistory.pop();
    }

    updateHistoryDisplay();
}

/**
 * Update the history display UI
 */
function updateHistoryDisplay() {
    if (translationHistory.length === 0) {
        historyDiv.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px; font-size: 0.875rem;">履歴がありません</div>';
        return;
    }

    historyDiv.innerHTML = translationHistory.map(item => `
        <div class="history-item">
            <div class="history-text">
                <div class="language-indicator">English</div>
                <div class="history-english">${item.english}</div>
            </div>
            <div class="history-text">
                <div class="language-indicator">日本語</div>
                <div class="history-japanese">${item.japanese}</div>
            </div>
            <div class="timestamp">${item.timestamp}</div>
        </div>
    `).join('');
}

// ========== Warning Message Functions ==========
/**
 * Display a warning message to the user
 * @param {string} message - Warning message to display
 */
function showWarning(message) {
    warningText.textContent = message;
    warningDiv.classList.remove('hidden');
}

/**
 * Hide the warning message
 */
function hideWarning() {
    warningDiv.classList.add('hidden');
}

// ========== Session Management ==========
/**
 * Save the current translation session to history
 */
function saveCurrentSessionToHistory() {
    if (currentSessionText.trim() && currentSessionTranslation.trim()) {
        addToHistory(currentSessionText, currentSessionTranslation);
        currentSessionText = '';
        currentSessionTranslation = '';
        englishText.textContent = '';
        japaneseText.textContent = '';
        console.log('セッションを履歴に保存しました');
    }
}

// ========== Event Listeners ==========

// Initialize model button
if (initButton) {
    initButton.addEventListener('click', async () => {
        try {
            initButton.disabled = true;
            initButton.textContent = '準備中...';
            await createLanguageModelSession();
        } catch (e) {
            console.error('Model initialization error:', e);
        }
    });
}

// Usage toggle button
if (usageToggle) {
    usageToggle.addEventListener('click', () => {
        toggleCollapsible(usageToggle);
    });
}

// Start button - Begin speech recognition
startBtn.addEventListener('click', () => {
    try {
        if (!recognition) {
            setupSpeechRecognition();
        }

        recognition.start();
        startBtn.disabled = true;
        stopBtn.disabled = false;
        currentSessionText = '';
        currentSessionTranslation = '';
        englishText.textContent = '';
        japaneseText.textContent = '';
        clearTimeout(silenceTimer);
        hideWarning();
    } catch (error) {
        console.error('音声認識開始エラー:', error);
        showWarning('音声認識の開始に失敗しました。ブラウザを更新して再度お試しください。');
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
});

// Stop button - Stop speech recognition
stopBtn.addEventListener('click', () => {
    if (recognition) {
        recognition.stop();
    }
    clearTimeout(silenceTimer);
    // 停止時に現在のセッションを履歴に保存
    saveCurrentSessionToHistory();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    speechStatus.textContent = '停止';
    speechStatus.className = 'status-value inactive';
});

// Clear button - Clear translation history
clearBtn.addEventListener('click', () => {
    translationHistory = [];
    updateHistoryDisplay();
    currentSessionText = '';
    currentSessionTranslation = '';
    englishText.textContent = '';
    japaneseText.textContent = '';
    clearTimeout(silenceTimer);
});

// ========== Page Lifecycle Events ==========

// Initialize on page load
window.addEventListener('load', () => {
    initialize();
    updateHistoryDisplay();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (languageModelSession) {
        languageModelSession.destroy();
    }
    if (recognition) {
        recognition.stop();
    }
});
