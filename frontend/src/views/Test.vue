<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useClozeStore } from '../stores/clozeStore'
import { useAuthStore } from '../stores/authStore'

const store = useClozeStore()
const authStore = useAuthStore()
const router = useRouter()

const activeTest = ref<any | null>(null)
const userAnswers = ref<Record<string, { word: string; sourceBlankId: string | number }>>({})

const isSubmitted = ref(false)
const scoreResults = ref<{ correct: number; total: number; percentage: number } | null>(null)
const xpAwarded = ref(false)

onMounted(() => {
    if (store.temporaryActiveTest && store.temporaryActiveTest.parsedTextTokens) {
        activeTest.value = store.temporaryActiveTest
    } else if (store.sourceText) {
        const tokens = store.parseTextIntoTokens(store.sourceText, [])
        activeTest.value = {
            title: 'Active Cloze Test',
            original_text: store.sourceText,
            parsedTextTokens: tokens,
            blanks: []
        }
    } else if (store.savedTests.length > 0) {
        const latest = store.savedTests[store.savedTests.length - 1]
        const tokens = store.parseTextIntoTokens(latest.original_text || '', [])
        activeTest.value = {
            ...latest,
            parsedTextTokens: tokens,
            blanks: []
        }
    }
})

const instructionText = computed(() => {
    return isSubmitted.value
        ? 'Test graded! Review your results below.'
        : 'Drag or click words from the bank below to place them into blanks. Click a filled blank to reset it.'
})

const availableBlanks = computed(() => {
    if (!activeTest.value || !activeTest.value.blanks) return []

    const usedSourceIds = Object.values(userAnswers.value).map((ans: any) => String(ans.sourceBlankId))

    return activeTest.value.blanks.filter((item: any) => {
        return !usedSourceIds.includes(String(item.blank_id))
    })
})

const handleDragStart = (event: DragEvent, sourceBlankId: number | string, word: string) => {
    if (isSubmitted.value) return
    if (event.dataTransfer) {
        event.dataTransfer.setData('application/json', JSON.stringify({ sourceBlankId, word }))
        event.dataTransfer.effectAllowed = 'move'
    }
}

const handleDragOver = (event: DragEvent) => {
    if (isSubmitted.value) return
    event.preventDefault()
}

const handleDrop = (event: DragEvent, targetBlankId: number | string) => {
    if (isSubmitted.value) return
    event.preventDefault()

    if (event.dataTransfer) {
        try {
            const rawData = event.dataTransfer.getData('application/json')
            if (rawData) {
                const { sourceBlankId, word } = JSON.parse(rawData)
                userAnswers.value = {
                    ...userAnswers.value,
                    [targetBlankId]: { word, sourceBlankId }
                }
            }
        } catch (e) {
            console.error("Drop handling error:", e)
        }
    }
}

const placeWordOnClick = (sourceBlankId: number | string, word: string) => {
    if (isSubmitted.value) return
    if (!activeTest.value || !activeTest.value.blanks) return

    const firstUnfilledBlank = activeTest.value.blanks.find((blank: any) => {
        return !userAnswers.value[blank.blank_id]
    })

    if (firstUnfilledBlank) {
        userAnswers.value = {
            ...userAnswers.value,
            [firstUnfilledBlank.blank_id]: { word, sourceBlankId }
        }
    }
}

const removeWord = (blankId: number | string) => {
    if (isSubmitted.value) return
    if (userAnswers.value[blankId]) {
        const updated = { ...userAnswers.value }
        delete updated[blankId]
        userAnswers.value = updated
    }
}

const getBlankStatus = (blankId: number | string) => {
    if (!isSubmitted.value || !activeTest.value?.blanks) return null
    const targetBlank = activeTest.value.blanks.find((b: any) => String(b.blank_id) === String(blankId))
    if (!targetBlank) return null

    const userAnswer = userAnswers.value[blankId]?.word?.trim().toLowerCase()
    const correctAnswer = (targetBlank.word_content || targetBlank.content)?.trim().toLowerCase()

    return userAnswer === correctAnswer ? 'correct' : 'incorrect'
}

const checkAnswers = () => {
    if (!activeTest.value || !activeTest.value.blanks) return

    let correctCount = 0
    const totalBlanks = activeTest.value.blanks.length

    activeTest.value.blanks.forEach((blank: any) => {
        const userAnswer = userAnswers.value[blank.blank_id]?.word?.trim().toLowerCase()
        const correctAnswer = (blank.word_content || blank.content)?.trim().toLowerCase()
        if (userAnswer === correctAnswer) {
            correctCount++
        }
    })

    const percentage = Math.round((correctCount / totalBlanks) * 100)
    scoreResults.value = { correct: correctCount, total: totalBlanks, percentage }
    isSubmitted.value = true

    if (!authStore.isGuest && authStore.user) {
        const earnedXp = correctCount * 10
        xpAwarded.value = true
        console.log(`Awarded ${earnedXp} XP to user!`)
    } else {
        xpAwarded.value = false
    }
}

const resetTest = () => {
    userAnswers.value = {}
    isSubmitted.value = false
    scoreResults.value = null
    xpAwarded.value = false
}

const goBackToEditor = () => {
    if (activeTest.value) {
        store.restoreTestToEditor(activeTest.value)
    }
    router.push('/editor')
}
</script>

<template>
    <div v-if="activeTest" class="quiz-container">
        <header class="quiz-header">
            <!-- Back to Editing Button -->
            <button class="back-edit-btn" @click="goBackToEditor">
                ← Back to Editing
            </button>
            <h2>{{ activeTest.title }}</h2>
            <p class="instructions">{{ instructionText }}</p>
        </header>

        <!-- SCORE BANNER -->
        <div v-if="isSubmitted && scoreResults" class="score-banner"
            :class="{ 'all-correct': scoreResults.percentage === 100 }">
            <div class="score-info">
                <h3>Score: {{ scoreResults.correct }} / {{ scoreResults.total }} ({{ scoreResults.percentage }}%)</h3>
                <p v-if="xpAwarded" class="xp-notice">🎉 You earned XP for this completed test session!</p>
                <p v-else class="guest-xp-notice">💡 Log in next time to save your progress and earn XP rewards!</p>
            </div>
            <button class="retry-btn" @click="resetTest">Try Again</button>
        </div>

        <!-- INTERACTIVE PARAGRAPH SPACE -->
        <div class="paragraph-box">
            <template v-for="(token, index) in activeTest.parsedTextTokens" :key="index">
                <span v-if="token.type === 'text' || !token.type" class="text-fragment">
                    {{ token.text || token }}
                </span>

                <span v-else-if="token.type === 'blank'" class="drop-zone" :class="{
                    'has-word': userAnswers[token.blank_id],
                    'correct-answer': getBlankStatus(token.blank_id) === 'correct',
                    'incorrect-answer': getBlankStatus(token.blank_id) === 'incorrect'
                }" @dragover="handleDragOver" @drop="handleDrop($event, token.blank_id)"
                    @click="removeWord(token.blank_id)" :title="isSubmitted ? 'Graded' : 'Click to remove word'">
                    {{ userAnswers[token.blank_id]?.word || '●●●' }}
                </span>
            </template>
        </div>

        <!-- WORD CHOICES STORAGE BANK -->
        <div class="chips-bank" v-if="!isSubmitted">
            <h3>Available Words</h3>
            <div class="chips-wrapper" v-if="availableBlanks.length > 0">
                <div v-for="(item, idx) in availableBlanks" :key="`${item.blank_id}-${idx}`" class="word-chip"
                    draggable="true"
                    @dragstart="handleDragStart($event, item.blank_id, item.word_content || item.content)"
                    @click="placeWordOnClick(item.blank_id, item.word_content || item.content)"
                    title="Click to auto-place or drag into a blank">
                    {{ item.word_content || item.content }}
                </div>
            </div>
            <p v-else class="empty-bank-hint">All words placed! Click "Check Answers" below when ready.</p>
        </div>

        <!-- SUBMIT ACTION -->
        <div class="action-footer" v-if="!isSubmitted">
            <button class="check-btn" :disabled="Object.keys(userAnswers).length === 0" @click="checkAnswers">
                Check Answers
            </button>
        </div>
    </div>

    <div v-else class="loading-state">
        <p>No active tests found. Please highlight words in the editor and click "Start Test".</p>
    </div>
</template>

<style scoped>
.quiz-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #2d3748;
}

.quiz-header {
    margin-bottom: 1.5rem;
}

.back-edit-btn {
    background: transparent;
    border: none;
    color: #3182ce;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    margin-bottom: 0.75rem;
    display: inline-flex;
    align-items: center;
    transition: color 0.15s ease;
}

.back-edit-btn:hover {
    color: #2b6cb0;
    text-decoration: underline;
}

.quiz-header h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
    color: #1a202c;
}

.instructions {
    margin: 0;
    color: #718096;
    font-size: 0.95rem;
}

.score-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.score-banner.all-correct {
    background: #ecfdf5;
    border-color: #a7f3d0;
}

.score-info h3 {
    margin: 0 0 4px 0;
    color: #0f172a;
    font-size: 1.1rem;
}

.xp-notice {
    margin: 0;
    font-size: 0.85rem;
    color: #059669;
    font-weight: 600;
}

.guest-xp-notice {
    margin: 0;
    font-size: 0.85rem;
    color: #d97706;
}

.retry-btn {
    background: #475569;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
}

.retry-btn:hover {
    background: #334155;
}

.paragraph-box {
    font-size: 1.25rem;
    line-height: 2.2;
    padding: 1.75rem;
    background-color: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 2rem;
    text-align: justify;
    white-space: pre-wrap;
}

.text-fragment {
    white-space: pre-wrap;
}

.drop-zone {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0px 12px;
    margin: 0 6px;
    height: 32px;
    vertical-align: middle;
    background-color: #edf2f7;
    border: 1px solid #a0aec091;
    color: #4a5568;
    border-radius: 14px;
    cursor: pointer;
    font-size: 1.1rem;
    transition: all 0.2s ease;
    user-select: none;
}

.drop-zone:hover {
    background-color: #e2e8f0;
    border-color: #718096;
}

.drop-zone.has-word {
    background-color: #42b883;
    color: #ffffff;
    border: 2px solid #2f855a;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(66, 184, 131, 0.2);
}

.drop-zone.correct-answer {
    background-color: #10b981 !important;
    border-color: #047857 !important;
    color: white !important;
}

.drop-zone.incorrect-answer {
    background-color: #ef4444 !important;
    border-color: #b91c1c !important;
    color: white !important;
}

.chips-bank {
    border-top: 2px solid #edf2f7;
    padding-top: 1.5rem;
    margin-bottom: 1.5rem;
}

.chips-bank h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #718096;
}

.chips-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.word-chip {
    padding: 8px 18px;
    background-color: #3182ce;
    color: #ffffff;
    border-radius: 20px;
    cursor: pointer;
    user-select: none;
    font-weight: 500;
    font-size: 1rem;
    box-shadow: 0 2px 5px rgba(49, 130, 206, 0.15);
    transition: transform 0.15s ease, background-color 0.15s ease;
}

.word-chip:hover {
    background-color: #2b6cb0;
}

.word-chip:active {
    transform: scale(0.93);
}

.empty-bank-hint {
    color: #a0aec0;
    font-style: italic;
    font-size: 0.95rem;
}

.action-footer {
    display: flex;
    justify-content: flex-end;
}

.check-btn {
    background-color: #10b981;
    color: white;
    border: none;
    padding: 10px 24px;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
    transition: background-color 0.15s ease;
}

.check-btn:hover:not(:disabled) {
    background-color: #059669;
}

.check-btn:disabled {
    background-color: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
    box-shadow: none;
}

.loading-state {
    text-align: center;
    max-width: 500px;
    margin: 6rem auto;
    padding: 2rem;
    background-color: #fffaf0;
    border: 1px solid #feebc8;
    border-radius: 8px;
    color: #dd6b20;
}
</style>