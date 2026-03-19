<script lang="ts">
import { defineComponent } from 'vue';
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'radix-vue';
import { Flag, X } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';

export default defineComponent({
  name: 'ReportProblemModal',
  components: {
    DialogRoot, DialogTrigger, DialogPortal, DialogOverlay,
    DialogContent, DialogTitle, DialogDescription, DialogClose,
    Flag, X, Button,
  },
  setup() {
    const config = useRuntimeConfig();
    const route = useRoute();
    return { apiBase: config.public.apiBase, route };
  },
  data() {
    return {
      open: false,
      message: '',
      sending: false,
      sent: false,
      error: null as string | null,
    };
  },
  methods: {
    handleCancel(): void {
      this.open = false;
      // intentionally preserve this.message so text survives cancel
    },
    async handleSend(): Promise<void> {
      if (!this.message.trim()) return;
      this.sending = true;
      this.error = null;
      const pageUrl = typeof window !== 'undefined' ? window.location.href : this.route.fullPath;
      try {
        await $fetch(`${this.apiBase}/reports`, {
          method: 'POST',
          body: { message: this.message.trim(), pageUrl },
        });
        this.sent = true;
        this.message = '';
        setTimeout(() => { this.open = false; this.sent = false; }, 1800);
      } catch {
        this.error = 'Failed to send — please try again.';
      } finally {
        this.sending = false;
      }
    },
  },
});
</script>

<template>
  <DialogRoot :open="open" @update:open="(v) => { if (!v) handleCancel(); else open = true; }">
    <DialogTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-muted-foreground hover:text-foreground"
        @click="open = true"
      >
        <Flag class="h-3.5 w-3.5" />
        Report a Problem
      </Button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
      >
        <!-- Header -->
        <div class="flex flex-col space-y-1.5">
          <DialogTitle class="text-lg font-semibold leading-none tracking-tight">
            Report a Problem
          </DialogTitle>
          <DialogDescription class="text-sm text-muted-foreground">
            Need to report something wrong with this page, or the information you're seeing?
            Let us know!
          </DialogDescription>
        </div>

        <!-- Sent confirmation -->
        <div v-if="sent" class="py-4 text-center text-sm text-green-600 font-medium">
          Thanks — your report has been sent!
        </div>

        <!-- Form -->
        <template v-else>
          <textarea
            v-model="message"
            placeholder="Describe the problem..."
            rows="5"
            :disabled="sending"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
          />

          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

          <!-- Footer -->
          <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" :disabled="sending" @click="handleCancel">
              Cancel
            </Button>
            <Button :disabled="!message.trim() || sending" @click="handleSend">
              {{ sending ? 'Sending…' : 'Send' }}
            </Button>
          </div>
        </template>

        <!-- Close (X) button -->
        <DialogClose
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
