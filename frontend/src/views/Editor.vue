<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onActivated,
  watch,
} from "vue";

import { useRouter } from "vue-router";

import { useClozeStore } from "../stores/clozeStore";
import { useAuthStore } from "../stores/authStore";
import { useGroupStore } from "../stores/groupStore";

import type {
  BlankedWord,
  HighlightColor,
  Group,
} from "../../../shared/types";

const store = useClozeStore();
const authStore = useAuthStore();
const groupStore = useGroupStore();

const router = useRouter();

const blankedWords =
  ref<BlankedWord[]>([]);

const isHighlighterActive =
  ref(true);

const draggedWordId =
  ref<string | null>(null);

const testTitle =
  ref("");

const isSavedSuccessfully =
  ref(false);

const savedTestId =
  ref<number | null>(null);

const DEFAULT_GUEST_COLORS:
  HighlightColor[] = [
    {
      id: "guest-1",
      name: "Context A",
      hex: "#ef4444",
    },
    {
      id: "guest-2",
      name: "Context B",
      hex: "#3b82f6",
    },
    {
      id: "guest-3",
      name: "Context C",
      hex: "#10b981",
    },
    {
      id: "guest-4",
      name: "Context D",
      hex: "#a855f7",
    },
  ];

const guestColors =
  ref<HighlightColor[]>([]);

const activeColorId =
  ref<string>("guest-1");

const masterColors =
  computed<HighlightColor[]>(() => {
    const accountColors =
      groupStore.activeGroups.map(
        (
          group: Group
        ): HighlightColor => ({
          id: `group-${group.group_id}`,
          name: group.name,
          hex: group.color_hex,
        })
      );

    return [
      ...guestColors.value,
      ...accountColors,
    ];
  });

watch(
  guestColors,
  (colors) => {
    if (authStore.isGuest) {
      localStorage.setItem(
        "guest_categories",
        JSON.stringify(colors)
      );
    }
  },
  {
    deep: true,
  }
);

const loadEditorData = async () => {
  try {
    const savedGuestColors =
      localStorage.getItem(
        "guest_categories"
      );

    if (savedGuestColors) {
      try {
        const parsed =
          JSON.parse(
            savedGuestColors
          );

        if (
          Array.isArray(parsed)
        ) {
          guestColors.value =
            parsed;
        } else {
          guestColors.value = [
            ...DEFAULT_GUEST_COLORS,
          ];
        }
      } catch {
        guestColors.value = [
          ...DEFAULT_GUEST_COLORS,
        ];
      }
    } else {
      guestColors.value = [
        ...DEFAULT_GUEST_COLORS,
      ];

      localStorage.setItem(
        "guest_categories",
        JSON.stringify(
          guestColors.value
        )
      );
    }
    if (
      store.currentBlankedWords &&
      store.currentBlankedWords.length >
      0
    ) {
      blankedWords.value = [
        ...store.currentBlankedWords,
      ];
    }

    if (!authStore.isGuest) {
      await groupStore.fetchMyGroups();
    }

    const savedMigration =
      localStorage.getItem(
        "guest_color_migration"
      );

    if (savedMigration) {
      try {
        const colorMapping:
          Record<string, string> =
          JSON.parse(
            savedMigration
          );

        blankedWords.value.forEach(
          (blank) => {
            if (
              blank.is_deleted ||
              !blank.colorId
            ) {
              return;
            }

            const newColorId =
              colorMapping[
              blank.colorId
              ];

            if (!newColorId) {
              return;
            }

            blank.colorId =
              newColorId;

            const groupId =
              Number(
                newColorId.replace(
                  "group-",
                  ""
                )
              );

            if (
              Number.isInteger(
                groupId
              ) &&
              groupId > 0
            ) {
              blank.group_id =
                groupId;
            }
          }
        );

        store.currentBlankedWords = [
          ...blankedWords.value,
        ];

        localStorage.removeItem(
          "guest_color_migration"
        );
      } catch (error) {
        console.error(
          "Failed to apply guest group migration:",
          error
        );
      }
    }

    if (
      masterColors.value.length >
      0
    ) {
      const currentColorExists =
        masterColors.value.some(
          (color) =>
            color.id ===
            activeColorId.value
        );

      if (
        !currentColorExists
      ) {
        activeColorId.value =
          masterColors.value[0].id;
      }
    }
  } catch (error) {
    console.error(
      "Failed to initialize editor:",
      error
    );
  }
};

onMounted(async () => {
  await loadEditorData();
});

onActivated(async () => {
  await loadEditorData();
});

const getColorHex = (
  colorId?: string
) => {
  return (
    masterColors.value.find(
      (
        color: HighlightColor
      ) =>
        color.id === colorId
    )?.hex ||
    "#cbd5e1"
  );
};

const selectColorBrush = (
  colorId: string
) => {
  activeColorId.value =
    colorId;

  isHighlighterActive.value =
    true;
};

const getGroupIdFromColor = (
  colorId: string
): number => {
  if (
    !colorId.startsWith("group-")
  ) {
    return 0;
  }

  const id = Number(
    colorId.replace(
      "group-",
      ""
    )
  );

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return 0;
  }

  return id;
};

const textSegments =
  computed(() => {
    const text =
      store.sourceText || "";

    if (
      blankedWords.value.length ===
      0
    ) {
      return [
        {
          text,
          isHighlighted: false,
          colorId: "",
          hex: "",
          startIdx: 0,
          endIdx: text.length,
        },
      ];
    }

    const sortedBlanks =
      [...blankedWords.value]
        .filter(
          (blank) =>
            !blank.is_deleted
        )
        .sort(
          (a, b) =>
            a.word_index -
            b.word_index
        );

    const segments: Array<{
      text: string;
      isHighlighted: boolean;
      colorId: string;
      hex: string;
      startIdx: number;
      endIdx: number;
    }> = [];

    let lastIndex = 0;

    for (
      const blank of sortedBlanks
    ) {
      const startIndex =
        blank.word_index;

      const endIndex =
        blank.word_index +
        blank.word_content.length;

      if (
        startIndex > lastIndex
      ) {
        segments.push({
          text: text.slice(
            lastIndex,
            startIndex
          ),
          isHighlighted: false,
          colorId: "",
          hex: "",
          startIdx: lastIndex,
          endIdx: startIndex,
        });
      }

      segments.push({
        text:
          blank.word_content,
        isHighlighted: true,
        colorId:
          blank.colorId ?? "",
        hex: getColorHex(
          blank.colorId
        ),
        startIdx:
          startIndex,
        endIdx:
          endIndex,
      });

      lastIndex =
        endIndex;
    }

    if (
      lastIndex < text.length
    ) {
      segments.push({
        text: text.slice(
          lastIndex
        ),
        isHighlighted: false,
        colorId: "",
        hex: "",
        startIdx:
          lastIndex,
        endIdx:
          text.length,
      });
    }

    return segments;
  });

const visibleLegendGroups =
  computed(() => {
    return masterColors.value.filter(
      (
        color: HighlightColor
      ) => {
        const hasWords =
          blankedWords.value.some(
            (blank) =>
              !blank.is_deleted &&
              blank.colorId ===
              color.id
          );

        const isCurrentBrush =
          color.id ===
          activeColorId.value &&
          isHighlighterActive.value;

        return (
          hasWords ||
          isCurrentBrush
        );
      }
    );
  });

/*
 * ============================================================
 * SELECTION HANDLING
 * ============================================================
 */

const handleSelection = (
  event: MouseEvent
) => {
  if (
    !isHighlighterActive.value ||
    !activeColorId.value
  ) {
    return;
  }

  const targetElement =
    event.target as HTMLElement;

  const textContainer =
    document.querySelector(
      ".text-container"
    ) as HTMLElement;

  if (
    !textContainer ||
    !textContainer.contains(
      targetElement
    )
  ) {
    return;
  }

  const selection =
    window.getSelection();

  if (
    !selection ||
    selection.rangeCount === 0
  ) {
    return;
  }

  const range =
    selection.getRangeAt(0);

  const fullText =
    store.sourceText || "";

  if (!fullText) {
    selection.removeAllRanges();
    return;
  }

  const getOffset = (
    node: Node,
    offset: number
  ): number => {
    const preRange =
      document.createRange();

    try {
      preRange.selectNodeContents(
        textContainer
      );

      preRange.setEnd(
        node,
        offset
      );

      return preRange
        .toString()
        .length;
    } catch {
      return -1;
    }
  };

  const rawStart =
    getOffset(
      range.startContainer,
      range.startOffset
    );

  const rawEnd =
    getOffset(
      range.endContainer,
      range.endOffset
    );

  if (
    rawStart < 0 ||
    rawEnd < 0
  ) {
    selection.removeAllRanges();
    return;
  }

  const selectionStart =
    Math.min(
      rawStart,
      rawEnd
    );

  const selectionEnd =
    Math.max(
      rawStart,
      rawEnd
    );

  /*
   * ==========================================================
   * SINGLE CLICK
   * ==========================================================
   */

  if (
    selection.isCollapsed
  ) {
    let caretOffset =
      selectionStart;

    if (
      caretOffset > 0 &&
      (
        caretOffset >=
        fullText.length ||
        !/\w/.test(
          fullText[
          caretOffset
          ]
        )
      ) &&
      /\w/.test(
        fullText[
        caretOffset - 1
        ]
      )
    ) {
      caretOffset--;
    }

    if (
      caretOffset < 0 ||
      caretOffset >=
      fullText.length ||
      !/\w/.test(
        fullText[
        caretOffset
        ]
      )
    ) {
      selection.removeAllRanges();
      return;
    }

    const existingHighlight =
      blankedWords.value.find(
        (blank) => {
          if (
            blank.is_deleted
          ) {
            return false;
          }

          const start =
            blank.word_index;

          const end =
            blank.word_index +
            blank.word_content
              .length;

          return (
            caretOffset >=
            start &&
            caretOffset <
            end
          );
        }
      );

    if (
      existingHighlight
    ) {
      existingHighlight.colorId =
        activeColorId.value;

      existingHighlight.group_id =
        getGroupIdFromColor(
          activeColorId.value
        );

      store.currentBlankedWords = [
        ...blankedWords.value,
      ];

      selection.removeAllRanges();

      return;
    }

    let wordStart =
      caretOffset;

    let wordEnd =
      caretOffset + 1;

    while (
      wordStart > 0
    ) {
      const index =
        wordStart - 1;

      if (
        !/\w/.test(
          fullText[index]
        )
      ) {
        break;
      }

      const isHighlighted =
        blankedWords.value.some(
          (blank) => {
            if (
              blank.is_deleted
            ) {
              return false;
            }

            const start =
              blank.word_index;

            const end =
              blank.word_index +
              blank.word_content
                .length;

            return (
              index >= start &&
              index < end
            );
          }
        );

      if (isHighlighted) {
        break;
      }

      wordStart--;
    }

    while (
      wordEnd <
      fullText.length
    ) {
      const index =
        wordEnd;

      if (
        !/\w/.test(
          fullText[index]
        )
      ) {
        break;
      }

      const isHighlighted =
        blankedWords.value.some(
          (blank) => {
            if (
              blank.is_deleted
            ) {
              return false;
            }

            const start =
              blank.word_index;

            const end =
              blank.word_index +
              blank.word_content
                .length;

            return (
              index >= start &&
              index < end
            );
          }
        );

      if (isHighlighted) {
        break;
      }

      wordEnd++;
    }

    const wordContent =
      fullText.slice(
        wordStart,
        wordEnd
      );

    if (
      !wordContent.trim()
    ) {
      selection.removeAllRanges();
      return;
    }

    const overlapsExisting =
      blankedWords.value.some(
        (blank) => {
          if (
            blank.is_deleted
          ) {
            return false;
          }

          const start =
            blank.word_index;

          const end =
            blank.word_index +
            blank.word_content
              .length;

          return (
            wordStart < end &&
            wordEnd > start
          );
        }
      );

    if (
      overlapsExisting
    ) {
      selection.removeAllRanges();
      return;
    }

    const newBlank:
      BlankedWord = {
      blank_id:
        Math.floor(
          Math.random() *
          100000
        ),

      test_id: 0,

      group_id:
        getGroupIdFromColor(
          activeColorId.value
        ),

      word_content:
        wordContent,

      word_index:
        wordStart,

      colorId:
        activeColorId.value,

      description: "",

      is_deleted: false,
    };

    blankedWords.value.push(
      newBlank
    );

    store.currentBlankedWords = [
      ...blankedWords.value,
    ];

    selection.removeAllRanges();

    return;
  }

  /*
   * ==========================================================
   * DRAG SELECTION
   * ==========================================================
   */

  if (
    selectionStart ===
    selectionEnd
  ) {
    selection.removeAllRanges();
    return;
  }

  const rawSelectedText =
    fullText.slice(
      selectionStart,
      selectionEnd
    );

  let trimStart = 0;

  let trimEnd =
    rawSelectedText.length;

  while (
    trimStart < trimEnd &&
    !/\w/.test(
      rawSelectedText[
      trimStart
      ]
    )
  ) {
    trimStart++;
  }

  while (
    trimEnd > trimStart &&
    !/\w/.test(
      rawSelectedText[
      trimEnd - 1
      ]
    )
  ) {
    trimEnd--;
  }

  if (
    trimStart === trimEnd
  ) {
    selection.removeAllRanges();
    return;
  }

  const actualStart =
    selectionStart +
    trimStart;

  const actualEnd =
    selectionStart +
    trimEnd;

  const touchedHighlights =
    blankedWords.value.filter(
      (blank) => {
        if (
          blank.is_deleted
        ) {
          return false;
        }

        const blankStart =
          blank.word_index;

        const blankEnd =
          blank.word_index +
          blank.word_content
            .length;

        return (
          actualStart <
          blankEnd &&
          actualEnd >
          blankStart
        );
      }
    );

  if (
    touchedHighlights.length > 0
  ) {
    touchedHighlights.forEach(
      (blank) => {
        blank.colorId =
          activeColorId.value;

        blank.group_id =
          getGroupIdFromColor(
            activeColorId.value
          );
      }
    );

    store.currentBlankedWords = [
      ...blankedWords.value,
    ];

    selection.removeAllRanges();

    return;
  }

  const selectedText =
    fullText.slice(
      actualStart,
      actualEnd
    );

  if (
    !selectedText.trim()
  ) {
    selection.removeAllRanges();
    return;
  }

  const overlapsExisting =
    blankedWords.value.some(
      (blank) => {
        if (
          blank.is_deleted
        ) {
          return false;
        }

        const blankStart =
          blank.word_index;

        const blankEnd =
          blank.word_index +
          blank.word_content
            .length;

        return (
          actualStart <
          blankEnd &&
          actualEnd >
          blankStart
        );
      }
    );

  if (
    overlapsExisting
  ) {
    selection.removeAllRanges();
    return;
  }

  const newBlank:
    BlankedWord = {
    blank_id:
      Math.floor(
        Math.random() *
        100000
      ),

    test_id: 0,

    group_id:
      getGroupIdFromColor(
        activeColorId.value
      ),

    word_content:
      selectedText,

    word_index:
      actualStart,

    colorId:
      activeColorId.value,

    description: "",

    is_deleted: false,
  };

  blankedWords.value.push(
    newBlank
  );

  store.currentBlankedWords = [
    ...blankedWords.value,
  ];

  selection.removeAllRanges();
};

/*
 * ============================================================
 * REMOVE HIGHLIGHT
 * ============================================================
 */

const removeBlank = (
  blank_id: number
) => {
  blankedWords.value =
    blankedWords.value.filter(
      (blank) =>
        blank.blank_id !==
        blank_id
    );

  store.currentBlankedWords = [
    ...blankedWords.value,
  ];
};

/*
 * ============================================================
 * DRAG AND DROP
 * ============================================================
 */

const handleDragStart = (
  blank_id: number
) => {
  draggedWordId.value =
    blank_id.toString();
};

const handleDrop = (
  targetColorId: string
) => {
  if (
    !draggedWordId.value
  ) {
    return;
  }

  const targetChip =
    blankedWords.value.find(
      (blank) =>
        blank.blank_id.toString() ===
        draggedWordId.value
    );

  if (
    targetChip
  ) {
    targetChip.colorId =
      targetColorId;

    targetChip.group_id =
      getGroupIdFromColor(
        targetColorId
      );

    store.currentBlankedWords = [
      ...blankedWords.value,
    ];
  }

  draggedWordId.value =
    null;
};

/*
 * ============================================================
 * SAVE TEST
 * ============================================================
 */

const handleSaveTest =
  async () => {
    const activeBlanks =
      blankedWords.value.filter(
        (blank) =>
          !blank.is_deleted
      );

    if (
      activeBlanks.length === 0
    ) {
      return;
    }

    if (
      authStore.isGuest
    ) {
      store.setOriginalText(
        store.sourceText
      );

      store.currentBlankedWords = [
        ...blankedWords.value,
      ];

      sessionStorage.setItem(
        "login_return_to",
        "/editor"
      );

      router.push(
        "/login"
      );

      return;
    }

    const formattedBlanks:
      BlankedWord[] =
      activeBlanks.map(
        (blank) => {
          const groupId =
            getGroupIdFromColor(
              blank.colorId ??
              ""
            );

          const finalGroupId =
            groupId > 0
              ? groupId
              : Number(
                blank.group_id
              );

          return {
            ...blank,
            group_id:
              Number.isInteger(
                finalGroupId
              ) &&
                finalGroupId > 0
                ? finalGroupId
                : 0,
          };
        }
      );

    const invalidFormatted =
      formattedBlanks.find(
        (blank) =>
          !Number.isInteger(
            blank.group_id
          ) ||
          blank.group_id <= 0
      );

    if (
      invalidFormatted
    ) {
      alert(
        "One or more highlighted words are not assigned to a valid category. Please select a category and try again."
      );

      return;
    }

    try {
      const response =
        await store.saveTestWorkspace(
          {
            title:
              testTitle.value,

            blankedWords:
              formattedBlanks,

            masterColors:
              masterColors.value,
          }
        );

      if (
        response &&
        response.test_id
      ) {
        savedTestId.value =
          response.test_id;
      }

      isSavedSuccessfully.value =
        true;
    } catch (error: any) {
      console.error(
        "SAVE FAILED:",
        error
      );

      alert(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Something went wrong saving your test."
      );
    }
  };

/*
 * ============================================================
 * NAVIGATION
 * ============================================================
 */

const goToStorage =
  () => {
    router.push(
      "/storage"
    );
  };

const handleStartTest =
  () => {
    const activeBlanks =
      blankedWords.value.filter(
        (blank) =>
          !blank.is_deleted
      );

    if (
      activeBlanks.length === 0
    ) {
      alert(
        "Please highlight at least one word before starting a test."
      );

      return;
    }

    store.currentBlankedWords = [
      ...blankedWords.value,
    ];

    store.setTemporaryActiveTest(
      {
        title:
          testTitle.value ||
          "Untitled Test",

        blankedWords:
          blankedWords.value,

        masterColors:
          masterColors.value,

        sourceText:
          store.sourceText,
      }
    );

    router.push(
      "/test"
    );
  };
</script>


<template>

  <div class="editor-layout">

    <main class="text-workspace">

      <div class="workspace-header">

        <div class="header-left-group">

          <div class="tool-picker">

            <button class="tool-btn" :class="{
              'is-active-tool':
                !isHighlighterActive
            }" @click="
              isHighlighterActive = false
              " title="Switch to Normal Cursor Mode">
              <img src="../assets/icons/solar--cursor-bold-duotone.svg" alt="Pointer" class="tool-icon-asset" />
            </button>


            <button class="tool-btn" :class="{
              'is-active-tool':
                isHighlighterActive
            }" @click="
              isHighlighterActive = true
              " title="Switch to Highlighter Brush Mode">
              <img src="../assets/icons/ph--highlighter-fill.svg" alt="Highlighter" class="tool-icon-asset" />
            </button>

          </div>


          <div class="master-palette" :class="{
            'palette-disabled':
              !isHighlighterActive
          }">

            <span>
              Brush Color:
            </span>


            <button v-for="color in masterColors" :key="color.id" class="palette-dot" :style="{
              backgroundColor:
                color.hex
            }" :class="{
              'is-active-brush':
                activeColorId ===
                color.id &&
                isHighlighterActive
            }" @click="
              selectColorBrush(
                color.id
              )
              " :disabled="!isHighlighterActive
                  "></button>

          </div>

        </div>


        <div class="header-right-group">

          <input type="text" v-model="testTitle" placeholder="Test Title..." class="test-title-input" />


          <button class="start-test-btn" :disabled="blankedWords.length === 0
            " @click="
              handleStartTest
            ">
            Start Test
          </button>


          <button class="save-btn" :disabled="blankedWords.length === 0" :title="authStore.isGuest
            ? 'Log in to save tests'
            : 'Save your test'
            " @click="handleSaveTest">
            Save Test
          </button>

        </div>

      </div>

      <!-- Success Notification -->

      <div v-if="
        isSavedSuccessfully
      " class="success-notification-banner">

        <span>
          Test saved successfully!
        </span>


        <button class="view-storage-link-btn" @click="
          goToStorage
        ">
          View in Storage →
        </button>

      </div>

      <!-- Text -->

      <div class="text-container" :class="isHighlighterActive
        ? 'brush-cursor-style'
        : 'pointer-cursor-style'
        " @mouseup="
          handleSelection
        ">

        <template v-for="
            (
segment,
                idx
            ) in textSegments
          " :key="idx">

          <mark v-if="
            segment.isHighlighted
          " class="persistent-highlight" :class="{
            'interactive-mark':
              isHighlighterActive
          }" :style="{
            backgroundColor:
              segment.hex +
              '33',
            color:
              segment.hex,
            borderBottomColor:
              segment.hex
          }">
            {{ segment.text }}
          </mark>


          <span v-else>
            {{ segment.text }}
          </span>

        </template>

      </div>

    </main>


    <!-- Sidebar -->

    <aside class="sidebar">

      <h2>
        Highlighted Words
      </h2>


      <p class="legend-subtitle">
        Click the color square to change
        its color or switch your brush tool.
      </p>


      <div class="blocks-list">

        <div v-for="
          color in visibleLegendGroups
          " :key="color.id" class="dynamic-legend-card" :class="{
            'brush-highlight':
              activeColorId ===
              color.id &&
              isHighlighterActive
          }" @dragover.prevent @drop="
            handleDrop(color.id)
            ">

          <div class="legend-header">

            <input type="color" v-model="color.hex" :id="'picker-' +
              color.id
              " class="hidden-color-input" />


            <label :for="'picker-' +
              color.id
              " class="color-box-label" :style="{
                backgroundColor:
                  color.hex
              }" @click="
                selectColorBrush(
                  color.id
                )
                " title="Click to pick custom color & select brush">

              <span v-if="
                activeColorId ===
                color.id &&
                isHighlighterActive
              " class="checkmark">
                ✓
              </span>

            </label>


            <input type="text" v-model="color.name
              " placeholder="Label this category..." class="legend-input-field" :disabled="color.id.startsWith(
                'group-'
              )
                " />

          </div>


          <div class="nested-word-chips">

            <div v-for="
              blank in
                blankedWords.filter(
                  (
                    b: BlankedWord
                  ) =>
                    !b.is_deleted &&
                    b.colorId ===
                    color.id
                )
              " :key="blank.blank_id
                " class="mini-word-chip" draggable="true" @dragstart="
                  handleDragStart(
                    blank.blank_id
                  )
                  " :style="{
                    backgroundColor:
                      color.hex +
                      '1a',
                    color:
                      color.hex,
                    borderColor:
                      color.hex +
                      '40'
                  }">

              <span class="drag-handle">
                ⋮⋮
              </span>


              <strong>
                {{
                  blank.word_content
                }}
              </strong>


              <button @click="
                removeBlank(
                  blank.blank_id
                )
                " class="chip-close-btn" :style="{
                  color:
                    color.hex
                }">
                ×
              </button>

            </div>


            <p v-if="
              !blankedWords.some(
                (
                  b: BlankedWord
                ) =>
                  !b.is_deleted &&
                  b.colorId ===
                  color.id
              )
            " class="empty-hint">
              Click text or drop chips here.
            </p>

          </div>

        </div>

      </div>

    </aside>

  </div>

</template>


<style scoped>
.editor-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  height: calc(100vh - 40px);
  box-sizing: border-box;
}

.text-workspace {
  background: #fdfdfd;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.header-left-group {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-right-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.test-title-input {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
}

.tool-picker {
  display: inline-flex;
  background: #f1f5f9;
  border-radius: 8px;
}

.tool-btn {
  background: transparent;
  border: none;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.1s ease;
}

.tool-btn.is-active-tool {
  background: #ffffff;
  color: #0f172a;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.tool-icon-asset {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.master-palette {
  display: flex;
  gap: 10px;
  align-items: center;
  transition: opacity 0.2s ease;
}

.palette-disabled {
  opacity: 0.4;
}

.palette-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition:
    transform 0.1s ease;
}

.palette-dot:disabled {
  cursor: not-allowed;
}

.palette-dot.is-active-brush {
  border-color: #0f172a;
  transform: scale(1.1);
}

.success-notification-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 10px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  font-weight: 500;
  animation: fadeIn 0.2s ease-in-out;
}

.view-storage-link-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.15s ease;
}

.view-storage-link-btn:hover {
  background: #059669;
}

@keyframes fadeIn {

  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }

}

.text-container {
  font-size: 1.15rem;
  line-height: 1.8;
  white-space: pre-wrap;
  color: #1a202c;
  overflow-y: auto;
  flex-grow: 1;
}

.brush-cursor-style {
  cursor: text;
}

.pointer-cursor-style {
  cursor: text;
}

.pointer-cursor-style * {
  cursor: text;
}

.persistent-highlight {
  padding: 2px 4px;
  margin: 0 1px;
  border-radius: 4px;
  border-bottom: 2px solid transparent;
  font-weight: 600;
  transition:
    all 0.15s ease;
}

.persistent-highlight.interactive-mark {
  cursor: pointer;
}

.sidebar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.sidebar h2 {
  font-size: 1.25rem;
  margin: 0 0 4px 0;
}

.legend-subtitle {
  font-size: 0.8rem;
  color: #718096;
  margin: 0 0 16px 0;
}

.blocks-list {
  flex-grow: 1;
  overflow-y: auto;
}

.dynamic-legend-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.dynamic-legend-card.brush-highlight {
  border-color: #94a3b8;
  background: #f8fafc;
}

.legend-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  position: relative;
}

.hidden-color-input {
  opacity: 0;
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
}

.color-box-label {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  user-select: none;
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.1s ease;
}

.color-box-label:hover {
  transform: scale(1.08);
}

.checkmark {
  font-size: 0.8rem;
  text-shadow:
    0px 1px 2px rgba(0, 0, 0, 0.4);
}

.legend-input-field {
  flex-grow: 1;
  border: 1px solid transparent;
  background: transparent;
  font-weight: 600;
  font-size: 0.9rem;
}

.legend-input-field:focus {
  outline: none;
  border-bottom-color: #cbd5e1;
}

.legend-input-field:disabled {
  color: #475569;
  cursor: default;
}

.nested-word-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-left: 34px;
  min-height: 30px;
}

.mini-word-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  cursor: grab;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.mini-word-chip:active {
  cursor: grabbing;
}

.drag-handle {
  font-size: 0.75rem;
  opacity: 0.4;
  user-select: none;
}

.chip-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

.empty-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
  margin: 4px 0;
}

.save-btn {
  background: #0f172a;
  color: white;
  border: none;
  padding: 8px 18px;
  font-size: 0.85rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.05);
  transition:
    background-color 0.15s ease,
    transform 0.1s ease;
}

.save-btn:hover:not(:disabled) {
  background: #1e293b;
}

.save-btn:active:not(:disabled) {
  transform: translateY(0.5px);
}

.save-btn:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
}

.start-test-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  font-size: 0.85rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.15s ease;
}

.start-test-btn:hover:not(:disabled) {
  background: #059669;
}

.start-test-btn:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}

.sidebar,
.workspace-header,
.tool-picker,
.master-palette,
.dynamic-legend-card,
label,
span,
button {
  user-select: none;
  -webkit-user-select: none;
}

.text-container,
.text-container * {
  user-select: text !important;
  -webkit-user-select: text !important;
}
</style>