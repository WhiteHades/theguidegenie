<template>
  <ClientOnly>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button data-test="color-mode-toggle" variant="ghost" size="icon">
          <ColorModeToggleIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <ColorModeToggleRadioGroup />
      </DropdownMenuContent>
    </DropdownMenu>
    <template #fallback>
      <Button variant="ghost" size="icon">
        <ColorModeToggleIcon />
      </Button>
    </template>
  </ClientOnly>
</template>
