<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useClozeStore } from '../stores/clozeStore';

const textInput = ref('');

const store = useClozeStore();
const router = useRouter();

const handleFileUpload = (
  event: Event
) => {
  const target =
    event.target as HTMLInputElement;

  const file =
    target.files?.[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = (e) => {
    textInput.value =
      e.target?.result as string;
  };

  reader.readAsText(file);
};

const handleStart = () => {
  if (!textInput.value.trim()) return;

  store.clearEditor();

  store.setOriginalText(
    textInput.value
  );

  router.push('/editor');
};

</script>

<template>
  <div class="homepage-container">
    <h1>Create Your Cloze Test</h1>
    <p>Upload or paste your text below to get started.</p>

    <div class="upload-section">
      <label for="file-upload" class="custom-file-upload">
        Upload .txt File
      </label>
      <input type="file" id="file-upload" accept=".txt" @change="handleFileUpload">
    </div>

    <textarea v-model="textInput" placeholder="Type or paste your text here..." rows="10"></textarea>

    <button @click="handleStart" :disabled="!textInput.trim()">
      Go to Editor
    </button>
  </div>
</template>

<style scoped>
.homepage-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
}

.upload-section {
  padding: 10px 0;
}

.custom-file-upload {
  display: inline-block;
  padding: 8px 16px;
  cursor: pointer;
  background-color: #e2e8f0;
  border-radius: 4px;
}

#file-upload {
  display: none;
}

textarea {
  width: 100%;
  padding: 12px;
  font-family: inherit;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  box-sizing: border-box;
}

button {
  padding: 12px;
  font-size: 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>