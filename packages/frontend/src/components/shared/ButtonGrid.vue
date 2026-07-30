<script setup lang="ts">
import { srcset } from "@/lib/utils";

const model = defineModel<any>({required: true});

const props = defineProps<{
  options: Array<{
    icon?: string;
    label?: string;
    title?: string;
    disabled?: boolean;
    color?: string;
    focusColor?: string;
    value: unknown;
  }>;
}>();

const shouldSrcSet = (icon: string) => {
  return !icon.includes('://');
};

</script>
<template>
  <div class="button-grid">
    <button
      v-for="option in props.options"
      :title="option.title"
      :disabled="option.disabled"
      :data-selected='model === option.value'
      :style="{'--color': option.color, '--focus-color': option.focusColor }"
      @click="model = option.value"
    >
      <img
        v-if="option.icon"
        :src="shouldSrcSet(option.icon) ? `/images/1x/${option.icon}.webp` : option.icon"
        :srcset="shouldSrcSet(option.icon) ? srcset(option.icon) : ''"
        :alt="option.icon"
      />
      {{option.label}}
    </button>
  </div>
</template>

<style scoped>
.button-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
