<template>
  <div class="min-h-screen bg-background font-sans antialiased">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 items-center">
        <NuxtLink to="/" class="flex items-center space-x-2">
          <span class="text-xl font-bold tracking-tight">Ibanez</span>
          <span class="text-sm font-medium text-muted-foreground">Guitar Database</span>
        </NuxtLink>
      </div>
    </header>

    <main class="flex-1">
      <NuxtPage />
    </main>

    <footer class="border-t py-6 md:py-0">
      <div class="container flex h-14 items-center justify-center">
        <p class="text-sm text-muted-foreground">
          Data sourced from
          <a
            href="https://ibanez.fandom.com"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
          >
            ibanez.fandom.com
          </a>
          &mdash; For educational and reference purposes only.
        </p>
      </div>
    </footer>
  </div>
</template>
