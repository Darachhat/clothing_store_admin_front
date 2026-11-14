<template>
  <div class="page-root">
    <AppPageHeader
      title="Create New Product"
      description="Create a KVC product with basic information, gallery images, dynamic attributes, pricing, and an automated Color × Size variant matrix."
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Products', to: '/products' },
        { label: 'Create New Product' },
      ]"
    >
      <template #actions>
        <AppButton to="/products" variant="default" size="sm" icon="i-heroicons-arrow-left" label="Back to Products" />
      </template>
    </AppPageHeader>

    <ProductForm
      ref="formRef"
      v-model="form"
      cancel-to="/products"
      submit-label="Create Product"
      :primary-submit="!includeInitialVariant"
      :submitting="isSubmitting && !printAfterCreate"
      @submit="submitProduct(false)"
    >
      <!-- SECTION 4: VARIANT GENERATOR -->
      <AppCard
        title="Section 4 — Variant Generator"
        subtitle="Select Colors and Sizes, tick which sizes each color has, and enter the opening stock quantity for each Color × Size."
      >
        <template #header-right>
          <div class="flex flex-wrap items-center gap-2 sm:gap-3">
            <div v-if="includeInitialVariant" class="inline-flex rounded-lg border border-border-subtle bg-surface-inset p-0.5 text-xs">
              <button
                type="button"
                class="px-2.5 py-1 rounded-md font-medium transition-colors"
                :class="variantMode === 'multi' ? 'bg-surface-card text-ink shadow-xs' : 'text-ink-secondary hover:text-ink'"
                @click="variantMode = 'multi'"
              >
                Variant Matrix Generator
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-md font-medium transition-colors"
                :class="variantMode === 'single' ? 'bg-surface-card text-ink shadow-xs' : 'text-ink-secondary hover:text-ink'"
                @click="variantMode = 'single'"
              >
                Single / Standard Item
              </button>
            </div>
            <AppCheckbox
              id="include-initial-variant"
              v-model="includeInitialVariant"
              label="Generate variants now"
            />
          </div>
        </template>

        <div v-if="includeInitialVariant" class="flex flex-col gap-4">
          <!-- SINGLE / NO-MATRIX MODE -->
          <template v-if="variantMode === 'single'">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <AppSelect
                id="variant-color"
                v-model="initialVariant.color_id"
                label="Color (Optional)"
                :options="colorOptions"
                placeholder="No Color / Standard"
              />
              <AppSelect
                id="variant-size"
                v-model="initialVariant.size_id"
                label="Size (Optional)"
                :options="sizeOptions"
                placeholder="Free Size / Standard"
              />
              <AppInput
                id="single-variant-sku"
                v-model="initialVariant.sku"
                label="SKU (Auto if blank)"
                :placeholder="singlePreviewSku"
                mono
              />
              <AppInput
                id="single-variant-stock"
                v-model="initialVariant.initial_stock"
                type="number"
                min="0"
                step="1"
                label="Opening Stock"
                placeholder="0"
                mono
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="variant-barcode" class="text-sm text-ink-secondary leading-tight">Barcode (Code 128 — Auto-generated if blank)</label>
                <div class="flex gap-2">
                  <AppInput
                    id="variant-barcode"
                    v-model="initialVariant.barcode"
                    class="flex-1 min-w-0"
                    placeholder="Auto 10-digit Code-128 (or scan tag)"
                    mono
                    clearable
                    data-barcode-scanner-target="true"
                    :error="barcodeError"
                    @blur="onBarcodeBlur"
                  />
                  <AppButton
                    type="button"
                    variant="default"
                    icon="i-heroicons-qr-code"
                    label="Scan"
                    @click="openScannerForSingle"
                  />
                </div>

                <div
                  v-if="barcodeConflict"
                  class="mt-1 p-3 rounded-lg bg-surface-inset border border-border-subtle text-xs flex flex-col gap-2"
                  role="alert"
                >
                  <div class="flex items-start gap-2">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-ink-secondary shrink-0 mt-0.5" />
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-ink">
                        Code <code class="mono">{{ initialVariant.barcode }}</code> is already in use
                      </div>
                      <p class="text-ink-secondary m-0 mt-0.5">
                        Assigned to <strong>{{ conflictProductName }}</strong>
                        (<code class="mono">{{ barcodeConflict.sku }}</code>).
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2 justify-end">
                    <AppButton
                      type="button"
                      size="xs"
                      variant="default"
                      icon="i-heroicons-sparkles"
                      label="Clear & Auto-Generate"
                      @click="clearBarcodeConflict"
                    />
                    <AppButton
                      v-if="conflictProductId"
                      size="xs"
                      variant="secondary"
                      icon="i-heroicons-arrow-top-right-on-square"
                      label="Open Existing Variant"
                      :to="`/products/${conflictProductId}?tab=variants`"
                    />
                  </div>
                </div>
              </div>

              <AppSelect
                id="single-variant-image"
                v-model="initialVariant.image_url"
                label="Variant Image (Optional)"
                :options="galleryImageOptions"
                placeholder="Use primary product image"
              />
            </div>
          </template>

          <!-- MATRIX GENERATOR MODE -->
          <template v-else>
            <!-- STEP 1: Select Colors & Sizes -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Colors Selector -->
              <div class="rounded-lg border border-border-subtle bg-surface-card p-3 flex flex-col gap-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs font-semibold text-ink uppercase tracking-wider">1. Select Colors ({{ selectedColors.length }})</span>
                  <div class="flex flex-wrap items-center gap-2.5 text-xs text-ink-secondary">
                    <button type="button" class="underline hover:text-ink" @click="selectedColors = rawColors.map(c => c.id)">Select All</button>
                    <button type="button" class="underline hover:text-ink" @click="selectedColors = []">Clear</button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-0.5 font-medium text-ink hover:underline"
                      @click="showNewColorInput = !showNewColorInput"
                    >
                      <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                      <span>New Color</span>
                    </button>
                  </div>
                </div>

                <!-- Inline Quick-Create Color -->
                <div v-if="showNewColorInput" class="flex flex-wrap items-center gap-1.5 rounded-md border border-border-subtle bg-surface-inset p-2">
                  <input
                    v-model="newColorHex"
                    type="color"
                    class="w-8 h-8 rounded border border-border-subtle cursor-pointer bg-transparent p-0 shrink-0"
                    title="Pick color swatch"
                  />
                  <AppInput
                    id="quick-new-color-name"
                    v-model="newColorName"
                    class="flex-1 min-w-[140px]"
                    placeholder="Color name (e.g. Black, Navy)"
                    @keydown.enter.prevent="handleQuickCreateColor"
                  />
                  <AppButton
                    type="button"
                    size="xs"
                    variant="primary"
                    icon="i-heroicons-check"
                    label="Add"
                    :loading="creatingColor"
                    @click="handleQuickCreateColor"
                  />
                </div>

                <div class="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
                  <button
                    v-for="c in rawColors"
                    :key="c.id"
                    type="button"
                    class="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
                    :class="selectedColors.includes(c.id)
                      ? 'bg-ink text-white border-border-default'
                      : 'bg-surface-inset text-ink-secondary border-border-subtle hover:text-ink'"
                    @click="toggleMultiColor(c.id)"
                  >
                    <span
                      v-if="c.hex_code"
                      class="inline-block w-2.5 h-2.5 rounded-full border border-border-subtle shrink-0"
                      :style="{ background: c.hex_code }"
                    />
                    <span>{{ c.name }}</span>
                  </button>
                  <p v-if="rawColors.length === 0" class="text-xs text-ink-tertiary italic m-0">
                    No colors configured yet. Click "+ New Color" above to add one.
                  </p>
                </div>
              </div>

              <!-- Sizes Selector -->
              <div class="rounded-lg border border-border-subtle bg-surface-card p-3 flex flex-col gap-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs font-semibold text-ink uppercase tracking-wider">2. Select Sizes ({{ selectedSizes.length }})</span>
                  <div class="flex flex-wrap items-center gap-2.5 text-xs text-ink-secondary">
                    <button type="button" class="underline hover:text-ink" @click="selectedSizes = rawSizes.map(s => s.id)">Select All</button>
                    <button type="button" class="underline hover:text-ink" @click="selectedSizes = []">Clear</button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-0.5 font-medium text-ink hover:underline"
                      @click="showNewSizeInput = !showNewSizeInput"
                    >
                      <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                      <span>New Size</span>
                    </button>
                  </div>
                </div>

                <!-- Inline Quick-Create Size -->
                <div v-if="showNewSizeInput" class="flex flex-wrap items-center gap-1.5 rounded-md border border-border-subtle bg-surface-inset p-2">
                  <AppInput
                    id="quick-new-size-name"
                    v-model="newSizeName"
                    class="flex-1 min-w-[140px]"
                    placeholder="Size name (e.g. S, M, L, XL, XXL)"
                    @keydown.enter.prevent="handleQuickCreateSize"
                  />
                  <AppButton
                    type="button"
                    size="xs"
                    variant="primary"
                    icon="i-heroicons-check"
                    label="Add"
                    :loading="creatingSize"
                    @click="handleQuickCreateSize"
                  />
                </div>

                <div class="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
                  <button
                    v-for="s in rawSizes"
                    :key="s.id"
                    type="button"
                    class="inline-flex items-center justify-center min-h-[34px] min-w-[40px] px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
                    :class="selectedSizes.includes(s.id)
                      ? 'bg-ink text-white border-border-default'
                      : 'bg-surface-inset text-ink-secondary border-border-subtle hover:text-ink'"
                    @click="toggleMultiSize(s.id)"
                  >
                    <span>{{ s.name }}</span>
                  </button>
                  <p v-if="rawSizes.length === 0" class="text-xs text-ink-tertiary italic m-0">
                    No sizes configured yet. Click "+ New Size" above to add one.
                  </p>
                </div>
              </div>
            </div>

            <!-- Matrix Summary & Bulk Controls -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-border-subtle bg-surface-inset px-3 py-2.5 text-xs">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-secondary">
                <span>
                  Active Variants: <strong class="text-ink">{{ includedMatrixRows.length }}</strong> of {{ multiGridRows.length }}
                  ({{ selectedColors.length || 1 }} Color{{ (selectedColors.length || 1) === 1 ? '' : 's' }} × {{ selectedSizes.length || 1 }} Size{{ (selectedSizes.length || 1) === 1 ? '' : 's' }})
                </span>
                <span class="hidden sm:inline">·</span>
                <span>
                  Total Stock: <strong class="text-ink mono">{{ totalMatrixStock }}</strong> units
                </span>
                <span class="hidden md:inline">·</span>
                <span class="hidden md:inline">SKU: <code class="mono text-ink">{CODE}-{COLOR}-{SIZE}</code></span>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <div class="inline-flex items-center gap-1">
                  <input
                    v-model="bulkStock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Qty"
                    aria-label="Opening stock for all included variants"
                    class="h-8 w-20 rounded-md border border-border-subtle bg-surface-card px-2 text-xs mono text-ink"
                    @keydown.enter.prevent="applyBulkStock"
                  />
                  <AppButton
                    type="button"
                    size="xs"
                    variant="default"
                    icon="i-heroicons-archive-box"
                    label="Set All Stock"
                    @click="applyBulkStock"
                  />
                </div>
                <AppButton
                  type="button"
                  size="xs"
                  variant="default"
                  icon="i-heroicons-check-circle"
                  label="Include All"
                  @click="setAllMatrixIncluded(true)"
                />
                <AppButton
                  type="button"
                  size="xs"
                  variant="default"
                  icon="i-heroicons-bolt"
                  label="Set All Active"
                  @click="setAllMatrixStatus('ACTIVE')"
                />
                <AppButton
                  type="button"
                  size="xs"
                  variant="default"
                  icon="i-heroicons-pause-circle"
                  label="Set All Inactive"
                  @click="setAllMatrixStatus('INACTIVE')"
                />
              </div>
            </div>

            <!-- STEP 3: Size Availability & Stock per Color (Works for any Color/Size selection, Responsive Mobile Cards + Desktop Matrix) -->
            <div
              v-if="selectedColors.length > 0 || selectedSizes.length > 0"
              class="rounded-lg border border-border-subtle bg-surface-card overflow-hidden"
            >
              <div class="px-3 py-2.5 border-b border-border-subtle bg-surface-inset flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div class="text-xs font-semibold text-ink uppercase tracking-wider">3. Size Availability &amp; Opening Stock per Color</div>
                  <p class="text-xs text-ink-secondary m-0 mt-0.5">
                    Tick the sizes available for each color and enter the stock quantity (`Qty`). Unticked sizes are skipped.
                  </p>
                </div>
                <span class="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-card px-2.5 py-1 text-xs font-medium text-ink">
                  <UIcon name="i-heroicons-cube" class="w-3.5 h-3.5 text-ink-secondary" />
                  <span>{{ includedMatrixRows.length }} variants · {{ totalMatrixStock }} pcs</span>
                </span>
              </div>

              <!-- MOBILE & SMALL TABLET VIEW (< md): Per-Color Cards with 2/3-Column Size + Qty Grid (Zero Horizontal Scroll) -->
              <div class="md:hidden divide-y divide-border-subtle">
                <div
                  v-for="colorGroup in effectiveColorGroups"
                  :key="colorGroup.key"
                  class="p-3 flex flex-col gap-2.5"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span
                        v-if="colorGroup.hex"
                        class="inline-block w-3.5 h-3.5 rounded-full border border-border-subtle shrink-0"
                        :style="{ background: colorGroup.hex }"
                      />
                      <span class="text-xs font-semibold text-ink">{{ colorGroup.name }}</span>
                      <span class="rounded border border-border-subtle bg-surface-inset px-1.5 py-0.5 text-[11px] text-ink-secondary mono">
                        {{ getColorActiveCount(colorGroup.id) }}/{{ effectiveSizeGroups.length }} sizes · {{ getColorStockSubtotal(colorGroup.id) }} pcs
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        class="underline text-ink-secondary hover:text-ink"
                        @click="setColorSizesIncluded(colorGroup.id, true)"
                      >
                        All sizes
                      </button>
                      <button
                        type="button"
                        class="underline text-ink-secondary hover:text-ink"
                        @click="setColorSizesIncluded(colorGroup.id, false)"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div
                      v-for="sizeGroup in effectiveSizeGroups"
                      :key="sizeGroup.key"
                      class="flex items-center justify-between gap-1.5 rounded-md border border-border-subtle px-2.5 py-1.5 transition-opacity"
                      :class="getRowOverride(`${colorGroup.key}::${sizeGroup.key}`).included ? 'bg-surface-card' : 'bg-surface-inset opacity-50'"
                    >
                      <label class="inline-flex items-center gap-1.5 text-xs font-medium text-ink cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          v-model="getRowOverride(`${colorGroup.key}::${sizeGroup.key}`).included"
                          class="h-4 w-4 rounded border-border-default text-ink cursor-pointer shrink-0"
                        />
                        <span class="truncate">{{ sizeGroup.name }}</span>
                      </label>
                      <input
                        v-model="getRowOverride(`${colorGroup.key}::${sizeGroup.key}`).initial_stock"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Qty"
                        :disabled="!getRowOverride(`${colorGroup.key}::${sizeGroup.key}`).included"
                        :aria-label="`Stock for ${colorGroup.name} size ${sizeGroup.name}`"
                        class="h-7 w-14 rounded border border-border-subtle bg-surface-inset px-1.5 text-xs text-center mono text-ink disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- DESKTOP VIEW (>= md): Structured Color × Size Matrix Table -->
              <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="border-b border-border-subtle text-ink-secondary bg-surface-card">
                      <th class="py-2 px-3 font-medium sticky left-0 bg-surface-card">Color</th>
                      <th v-for="sizeGroup in effectiveSizeGroups" :key="sizeGroup.key" class="py-2 px-3 font-medium text-center">
                        {{ sizeGroup.name }}
                      </th>
                      <th class="py-2 px-3 font-medium text-right">Stock</th>
                      <th class="py-2 px-3 font-medium text-right">All sizes</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border-subtle">
                    <tr v-for="colorGroup in effectiveColorGroups" :key="colorGroup.key">
                      <td class="py-2 px-3 font-medium text-ink whitespace-nowrap sticky left-0 bg-surface-card">
                        <div class="flex items-center gap-1.5">
                          <span
                            v-if="colorGroup.hex"
                            class="inline-block w-2.5 h-2.5 rounded-full border border-border-subtle shrink-0"
                            :style="{ background: colorGroup.hex }"
                          />
                          <span>{{ colorGroup.name }}</span>
                        </div>
                      </td>
                      <td v-for="sizeGroup in effectiveSizeGroups" :key="sizeGroup.key" class="py-2 px-3 text-center">
                        <div class="inline-flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            v-model="getRowOverride(`${colorGroup.key}::${sizeGroup.key}`).included"
                            class="h-4 w-4 rounded border-border-default text-ink cursor-pointer"
                            :aria-label="`${colorGroup.name} in size ${sizeGroup.name}`"
                          />
                          <input
                            v-model="getRowOverride(`${colorGroup.key}::${sizeGroup.key}`).initial_stock"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Qty"
                            :disabled="!getRowOverride(`${colorGroup.key}::${sizeGroup.key}`).included"
                            :aria-label="`Stock for ${colorGroup.name} size ${sizeGroup.name}`"
                            class="h-7 w-16 rounded-md border border-border-subtle bg-surface-card px-2 text-xs mono text-ink disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </div>
                      </td>
                      <td class="py-2 px-3 text-right whitespace-nowrap mono font-medium text-ink">
                        {{ getColorStockSubtotal(colorGroup.id) }}
                      </td>
                      <td class="py-2 px-3 text-right whitespace-nowrap">
                        <button type="button" class="underline text-ink-secondary hover:text-ink mr-2" @click="setColorSizesIncluded(colorGroup.id, true)">All</button>
                        <button type="button" class="underline text-ink-secondary hover:text-ink" @click="setColorSizesIncluded(colorGroup.id, false)">None</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- STEP 4: Variant Matrix Details (Responsive Mobile Cards + Desktop Table) -->
            <div v-if="multiGridRows.length > 0" class="rounded-lg border border-border-subtle bg-surface-card overflow-hidden">
              <button
                type="button"
                class="w-full px-3 py-2.5 bg-surface-inset border-b border-border-subtle flex items-center justify-between gap-2 text-left hover:bg-surface-hover transition-colors"
                @click="showAdvancedMatrix = !showAdvancedMatrix"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <UIcon
                    :name="showAdvancedMatrix ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                    class="w-4 h-4 text-ink-secondary shrink-0"
                  />
                  <span class="text-xs font-semibold text-ink uppercase tracking-wider truncate">
                    4. Variant SKU, Price &amp; Barcode Details ({{ includedMatrixRows.length }} active)
                  </span>
                </div>
                <span class="text-xs text-ink-secondary shrink-0">
                  {{ showAdvancedMatrix ? 'Hide details' : 'Customize SKUs / Barcodes' }}
                </span>
              </button>

              <template v-if="showAdvancedMatrix">
                <!-- MOBILE VIEW (< md): Responsive Per-Variant Cards (No Horizontal Scroll) -->
                <div class="md:hidden divide-y divide-border-subtle max-h-[480px] overflow-y-auto">
                  <div
                    v-for="row in multiGridRows"
                    :key="`mob-${row.key}`"
                    class="p-3 flex flex-col gap-2.5 transition-opacity"
                    :class="!row.override.included ? 'opacity-45 bg-surface-inset' : 'bg-surface-card'"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <label class="inline-flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          v-model="row.override.included"
                          class="h-4 w-4 rounded border-border-default text-ink cursor-pointer"
                        />
                        <span
                          v-if="row.colorHex"
                          class="inline-block w-3 h-3 rounded-full border border-border-subtle shrink-0"
                          :style="{ background: row.colorHex }"
                        />
                        <span>{{ row.colorName }} · {{ row.sizeName }}</span>
                      </label>
                      <code class="text-[11px] mono text-ink-secondary bg-surface-inset px-1.5 py-0.5 rounded border border-border-subtle">
                        {{ row.override.sku || row.previewSku }}
                      </code>
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                      <AppInput
                        :id="`mob-stock-${row.key}`"
                        v-model="row.override.initial_stock"
                        type="number"
                        min="0"
                        step="1"
                        label="Stock Qty"
                        placeholder="0"
                        mono
                      />
                      <AppInput
                        :id="`mob-cost-${row.key}`"
                        v-model="row.override.cost_price"
                        type="number"
                        min="0"
                        step="0.01"
                        label="Cost ($)"
                        :placeholder="String(initialVariant.cost_price || '0.00')"
                        mono
                      />
                      <AppInput
                        :id="`mob-sell-${row.key}`"
                        v-model="row.override.selling_price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        label="Sell ($)"
                        :placeholder="String(initialVariant.selling_price || '0.00')"
                        mono
                      />
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <AppInput
                        :id="`mob-sku-${row.key}`"
                        v-model="row.override.sku"
                        label="Custom SKU (Optional)"
                        :placeholder="row.previewSku"
                        mono
                      />
                      <div class="flex flex-col gap-1">
                        <label :for="`mob-bc-${row.key}`" class="text-xs text-ink-secondary">Barcode (Code 128)</label>
                        <div class="flex items-center gap-1">
                          <AppInput
                            :id="`mob-bc-${row.key}`"
                            v-model="row.override.barcode"
                            class="flex-1 min-w-0"
                            placeholder="Auto Code-128"
                            mono
                            clearable
                            :error="row.override.error"
                            @blur="verifyRowBarcode(row.key)"
                          />
                          <AppButton
                            type="button"
                            size="xs"
                            variant="default"
                            icon="i-heroicons-qr-code"
                            aria-label="Scan barcode"
                            @click="openScannerForRow(row.key)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- DESKTOP VIEW (>= md): Full Sticky-Header Matrix Table -->
                <div class="hidden md:block max-h-96 overflow-x-auto overflow-y-auto">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead class="bg-surface-inset border-b border-border-subtle text-ink-secondary sticky top-0 z-10">
                      <tr>
                        <th class="py-2 px-2.5 font-medium w-10 text-center">Inc.</th>
                        <th class="py-2 px-2.5 font-medium">Color</th>
                        <th class="py-2 px-2.5 font-medium">Size</th>
                        <th class="py-2 px-2.5 font-medium min-w-[165px]">SKU</th>
                        <th class="py-2 px-2.5 font-medium w-28">Cost Price</th>
                        <th class="py-2 px-2.5 font-medium w-28">Selling Price</th>
                        <th class="py-2 px-2.5 font-medium w-28">Opening Stock</th>
                        <th class="py-2 px-2.5 font-medium min-w-[190px]">Barcode (Code 128)</th>
                        <th class="py-2 px-2.5 font-medium w-36">Variant Image</th>
                        <th class="py-2 px-2.5 font-medium w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border-subtle">
                      <tr
                        v-for="row in multiGridRows"
                        :key="row.key"
                        class="bg-surface-card transition-opacity"
                        :class="!row.override.included ? 'opacity-45' : ''"
                      >
                        <td class="py-1.5 px-2.5 text-center">
                          <input
                            type="checkbox"
                            v-model="row.override.included"
                            class="h-4 w-4 rounded border-border-default text-ink cursor-pointer"
                            :aria-label="`Include ${row.colorName} ${row.sizeName}`"
                          />
                        </td>
                        <td class="py-1.5 px-2.5 font-medium text-ink whitespace-nowrap">
                          <div class="flex items-center gap-1.5">
                            <span
                              v-if="row.colorHex"
                              class="inline-block w-2.5 h-2.5 rounded-full border border-border-subtle shrink-0"
                              :style="{ background: row.colorHex }"
                            />
                            <span>{{ row.colorName }}</span>
                          </div>
                        </td>
                        <td class="py-1.5 px-2.5 font-medium text-ink whitespace-nowrap">
                          {{ row.sizeName }}
                        </td>
                        <td class="py-1.5 px-2.5">
                          <AppInput
                            :id="`sku-${row.key}`"
                            v-model="row.override.sku"
                            :placeholder="row.previewSku"
                            mono
                          />
                        </td>
                        <td class="py-1.5 px-2.5">
                          <AppInput
                            :id="`cost-${row.key}`"
                            v-model="row.override.cost_price"
                            type="number"
                            min="0"
                            step="0.01"
                            :placeholder="String(initialVariant.cost_price || '0.00')"
                            mono
                          />
                        </td>
                        <td class="py-1.5 px-2.5">
                          <AppInput
                            :id="`sell-${row.key}`"
                            v-model="row.override.selling_price"
                            type="number"
                            min="0.01"
                            step="0.01"
                            :placeholder="String(initialVariant.selling_price || '0.00')"
                            mono
                          />
                        </td>
                        <td class="py-1.5 px-2.5">
                          <AppInput
                            :id="`stock-${row.key}`"
                            v-model="row.override.initial_stock"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            mono
                          />
                        </td>
                        <td class="py-1.5 px-2.5">
                          <div class="flex items-center gap-1">
                            <AppInput
                              :id="`bc-${row.key}`"
                              v-model="row.override.barcode"
                              class="flex-1"
                              placeholder="Auto Code-128"
                              mono
                              clearable
                              data-barcode-scanner-target="true"
                              :error="row.override.error"
                              @blur="verifyRowBarcode(row.key)"
                            />
                            <AppButton
                              type="button"
                              size="xs"
                              variant="default"
                              icon="i-heroicons-qr-code"
                              aria-label="Scan barcode"
                              @click="openScannerForRow(row.key)"
                            />
                          </div>
                        </td>
                        <td class="py-1.5 px-2.5">
                          <AppSelect
                            :id="`img-${row.key}`"
                            v-model="row.override.image_url"
                            :options="galleryImageOptions"
                            placeholder="Default"
                          />
                        </td>
                        <td class="py-1.5 px-2.5">
                          <AppSelect
                            :id="`st-${row.key}`"
                            v-model="row.override.status_code"
                            :options="variantStatusOptions"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </div>
          </template>
        </div>

        <p v-else class="text-xs text-ink-secondary m-0 py-2">
          You can generate or add variants anytime from the Product Detail page after saving.
        </p>
      </AppCard>

      <!-- SECTION 5: PRICING -->
      <AppCard
        title="Section 5 — Pricing"
        subtitle="Set default cost and selling prices (USD). Individual variants can override these prices in the matrix above."
      >
        <template #header-right>
          <span class="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-inset px-2 py-0.5 text-xs font-medium text-ink-secondary">
            <UIcon name="i-heroicons-currency-dollar" class="w-3.5 h-3.5" />
            <span>Base Currency: USD</span>
          </span>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <AppInput
            id="default-cost-price"
            v-model="initialVariant.cost_price"
            type="number"
            label="Default Cost Price (USD)"
            step="0.01"
            min="0"
            placeholder="5.00"
            mono
            :error="costError"
          />
          <AppInput
            id="default-selling-price"
            v-model="initialVariant.selling_price"
            type="number"
            label="Default Selling Price (USD)"
            step="0.01"
            min="0.01"
            placeholder="12.00"
            mono
            required
            :error="priceError"
          />
          <div class="flex items-center gap-2">
            <AppButton
              v-if="variantMode === 'multi' && multiGridRows.length > 0"
              type="button"
              size="sm"
              variant="default"
              icon="i-heroicons-arrow-path"
              label="Apply Default Prices to Matrix"
              class="w-full sm:w-auto justify-center"
              @click="applyDefaultPricesToMatrix"
            />
          </div>
        </div>
      </AppCard>

      <template #actions>
        <div
          v-if="includeInitialVariant"
          class="rounded-lg border border-border-subtle bg-surface-inset px-3 py-2 text-xs text-ink-secondary flex items-center justify-between gap-2"
        >
          <span>
            Ready: <strong class="text-ink">{{ variantMode === 'multi' ? includedMatrixRows.length : 1 }}</strong>
            variant{{ (variantMode === 'multi' ? includedMatrixRows.length : 1) === 1 ? '' : 's' }}
          </span>
          <span class="mono">
            Stock: <strong class="text-ink">{{ variantMode === 'multi' ? totalMatrixStock : (Math.max(0, Math.floor(Number(initialVariant.initial_stock) || 0))) }}</strong> pcs
          </span>
        </div>
        <AppButton
          v-if="includeInitialVariant"
          type="button"
          variant="primary"
          icon="i-heroicons-printer"
          :loading="isSubmitting && printAfterCreate"
          :disabled="isSubmitting || !!barcodeConflict"
          label="Create & Print Labels"
          class="w-full justify-center"
          @click="submitProduct(true)"
        />
      </template>
    </ProductForm>

    <BarcodeScannerModal
      v-model="showScannerModal"
      :auto-close-on-scan="true"
      @scanned="onBarcodeScanned"
    />
  </div>
</template>

<script setup lang="ts">
import type { SelectOption, ProductVariant, Color, Size } from '~/types'
import type { ProductFormState } from '~/components/modules/catalog/ProductForm.vue'
import { normalizeScannedCode } from '~/utils/scanCode'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'New Product — KVC Clothing Store Admin' })

const { createProduct, createVariantsBulk, scanCode } = useProductApi()
const { listColors, listSizes, createColor, createSize } = useCatalogApi()
const { addToast } = useAppToast()
const router = useRouter()

const formRef = ref<{ validate: () => boolean } | null>(null)
const isSubmitting = ref(false)
const printAfterCreate = ref(false)
const includeInitialVariant = ref(true)
const variantMode = ref<'single' | 'multi'>('multi')
const showScannerModal = ref(false)
const scannerTargetRowKey = ref<string | null>(null)
const attempted = ref(false)

const rawColors = ref<Color[]>([])
const rawSizes = ref<Size[]>([])
const colorOptions = ref<SelectOption[]>([])
const sizeOptions = ref<SelectOption[]>([])

const selectedColors = ref<string[]>([])
const selectedSizes = ref<string[]>([])

// Quick-create Color / Size inline (so variants can be generated without leaving the page)
const showNewColorInput = ref(false)
const newColorName = ref('')
const newColorHex = ref('#000000')
const creatingColor = ref(false)
const showNewSizeInput = ref(false)
const newSizeName = ref('')
const creatingSize = ref(false)

async function handleQuickCreateColor() {
  const name = newColorName.value.trim()
  if (!name || creatingColor.value) return
  creatingColor.value = true
  try {
    const created = await createColor({ name, hex_code: newColorHex.value }) as Color
    rawColors.value.push(created)
    colorOptions.value.push({ label: created.name, value: created.id })
    selectedColors.value.push(created.id)
    newColorName.value = ''
    showNewColorInput.value = false
    addToast({ type: 'success', title: 'Color added', message: `${created.name} is now selected.` })
  } catch (e: any) {
    addToast({ type: 'error', title: 'Could not add color', message: e?.data?.detail ?? String(e) })
  } finally {
    creatingColor.value = false
  }
}

async function handleQuickCreateSize() {
  const name = newSizeName.value.trim()
  if (!name || creatingSize.value) return
  creatingSize.value = true
  try {
    const created = await createSize({ name, type: 'LETTER', sort_order: rawSizes.value.length + 1 }) as Size
    rawSizes.value.push(created)
    sizeOptions.value.push({ label: created.name, value: created.id })
    selectedSizes.value.push(created.id)
    newSizeName.value = ''
    showNewSizeInput.value = false
    addToast({ type: 'success', title: 'Size added', message: `${created.name} is now selected.` })
  } catch (e: any) {
    addToast({ type: 'error', title: 'Could not add size', message: e?.data?.detail ?? String(e) })
  } finally {
    creatingSize.value = false
  }
}

const variantStatusOptions: SelectOption[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const form = ref<ProductFormState>({
  name: '',
  code: '',
  description: '',
  category_id: '',
  brand_id: '',
  supplier_id: '',
  status_code: 'ACTIVE',
  image_url: '',
  tags: [],
  images: [],
  attribute_value_ids: [],
})

const initialVariant = reactive({
  selling_price: '' as string | number,
  cost_price: '' as string | number,
  color_id: '',
  size_id: '',
  sku: '',
  barcode: '',
  image_url: '',
  initial_stock: '' as string | number,
})

const galleryImageOptions = computed<SelectOption[]>(() => {
  const opts: SelectOption[] = [{ label: 'Primary Image', value: '' }]
  const imgs = form.value.images || []
  imgs.forEach((img, idx) => {
    opts.push({
      label: `Image #${idx + 1}${img.is_primary ? ' (Primary)' : ''}`,
      value: img.image_url,
    })
  })
  return opts
})

// SKU Preview Helpers matching backend format_color_code & format_size_code
const COLOR_ABBR: Record<string, string> = {
  BLACK: 'BLK',
  WHITE: 'WHT',
  GRAY: 'GRY',
  GREY: 'GRY',
  RED: 'RED',
  BLUE: 'BLU',
  NAVY: 'NVY',
  GREEN: 'GRN',
  YELLOW: 'YLW',
  PINK: 'PNK',
  PURPLE: 'PRP',
  BROWN: 'BRN',
  BEIGE: 'BGE',
  KHAKI: 'KHK',
  ORANGE: 'ORG',
  CREAM: 'CRM',
  OLIVE: 'OLV',
  MAROON: 'MRN',
  CHARCOAL: 'CHC',
  SILVER: 'SLV',
  GOLD: 'GLD',
}

function formatColorCode(name?: string | null): string {
  if (!name) return ''
  const upper = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (COLOR_ABBR[upper]) return COLOR_ABBR[upper]!
  return upper.slice(0, 3)
}

function formatSizeCode(name?: string | null): string {
  if (!name) return ''
  return name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
}

function computePreviewSku(colorName?: string | null, sizeName?: string | null): string {
  const baseCode = (form.value.code || '').trim().toUpperCase() || 'PRD-XXX'
  const cCode = formatColorCode(colorName)
  const sCode = formatSizeCode(sizeName)
  const parts = [baseCode]
  if (cCode) parts.push(cCode)
  if (sCode) parts.push(sCode)
  if (parts.length === 1) parts.push('STD')
  return parts.join('-')
}

const singlePreviewSku = computed(() => {
  const cObj = rawColors.value.find(c => c.id === initialVariant.color_id)
  const sObj = rawSizes.value.find(s => s.id === initialVariant.size_id)
  return computePreviewSku(cObj?.name, sObj?.name)
})

interface RowOverride {
  included: boolean
  sku: string
  cost_price: string | number
  selling_price: string | number
  initial_stock: string | number
  barcode: string
  image_url: string
  status_code: string
  error?: string
}
const rowOverrides = reactive<Record<string, RowOverride>>({})

function getRowOverride(key: string): RowOverride {
  if (!rowOverrides[key]) {
    rowOverrides[key] = {
      included: true,
      sku: '',
      cost_price: '',
      selling_price: '',
      initial_stock: '',
      barcode: '',
      image_url: '',
      status_code: 'ACTIVE',
      error: undefined,
    }
  }
  return rowOverrides[key]!
}

const multiGridRows = computed(() => {
  const cIds = selectedColors.value.length > 0 ? selectedColors.value : [null]
  const sIds = selectedSizes.value.length > 0 ? selectedSizes.value : [null]
  const rows: {
    key: string
    colorId: string | null
    sizeId: string | null
    colorName: string
    colorHex?: string | null
    sizeName: string
    previewSku: string
    override: RowOverride
  }[] = []

  for (const cId of cIds) {
    const colorObj = cId ? rawColors.value.find(c => c.id === cId) : null
    for (const sId of sIds) {
      const sizeObj = sId ? rawSizes.value.find(s => s.id === sId) : null
      const key = `${cId ?? 'null'}::${sId ?? 'null'}`
      rows.push({
        key,
        colorId: cId,
        sizeId: sId,
        colorName: colorObj?.name || 'Standard',
        colorHex: colorObj?.hex_code,
        sizeName: sizeObj?.name || 'Free Size',
        previewSku: computePreviewSku(colorObj?.name, sizeObj?.name),
        override: getRowOverride(key),
      })
    }
  }
  return rows
})

const includedMatrixRows = computed(() => multiGridRows.value.filter(r => r.override.included))

const showAdvancedMatrix = ref(true)

const effectiveColorGroups = computed(() => {
  if (selectedColors.value.length > 0) {
    return selectedColors.value.map((cId) => {
      const c = rawColors.value.find(item => item.id === cId)
      return {
        id: cId as string | null,
        key: cId,
        name: c?.name || 'Color',
        hex: c?.hex_code || undefined,
      }
    })
  }
  return [{
    id: null as string | null,
    key: 'null',
    name: 'Standard Color',
    hex: undefined,
  }]
})

const effectiveSizeGroups = computed(() => {
  if (selectedSizes.value.length > 0) {
    return selectedSizes.value.map((sId) => {
      const s = rawSizes.value.find(item => item.id === sId)
      return {
        id: sId as string | null,
        key: sId,
        name: s?.name || 'Size',
      }
    })
  }
  return [{
    id: null as string | null,
    key: 'null',
    name: 'Free Size',
  }]
})

const totalMatrixStock = computed(() => {
  return includedMatrixRows.value.reduce((sum, r) => {
    const qty = Math.max(0, Math.floor(Number(r.override.initial_stock) || 0))
    return sum + qty
  }, 0)
})

function getColorActiveCount(colorId: string | null): number {
  const cKey = colorId ?? 'null'
  return effectiveSizeGroups.value.filter(s => getRowOverride(`${cKey}::${s.key}`).included).length
}

function getColorStockSubtotal(colorId: string | null): number {
  const cKey = colorId ?? 'null'
  return effectiveSizeGroups.value.reduce((sum, s) => {
    const ov = getRowOverride(`${cKey}::${s.key}`)
    if (!ov.included) return sum
    return sum + Math.max(0, Math.floor(Number(ov.initial_stock) || 0))
  }, 0)
}

function applyDefaultPricesToMatrix() {
  for (const row of multiGridRows.value) {
    row.override.cost_price = initialVariant.cost_price
    row.override.selling_price = initialVariant.selling_price
  }
  addToast({ type: 'info', title: 'Prices updated', message: 'Default cost and selling prices applied to all matrix rows.' })
}

function setAllMatrixIncluded(included: boolean) {
  for (const row of multiGridRows.value) {
    row.override.included = included
  }
}

const bulkStock = ref<string | number>('')

function applyBulkStock() {
  const qty = Math.max(0, Math.floor(Number(bulkStock.value)))
  if (!Number.isFinite(qty) || bulkStock.value === '') return
  for (const row of includedMatrixRows.value) {
    row.override.initial_stock = qty
  }
  addToast({ type: 'info', title: 'Opening stock set', message: `${qty} unit(s) applied to ${includedMatrixRows.value.length} variant(s).` })
}

function setColorSizesIncluded(colorId: string | null, included: boolean) {
  const cKey = colorId ?? 'null'
  for (const s of effectiveSizeGroups.value) {
    getRowOverride(`${cKey}::${s.key}`).included = included
  }
}

function setAllMatrixStatus(status: string) {
  for (const row of multiGridRows.value) {
    row.override.status_code = status
  }
}

function toggleMultiColor(id: string) {
  const idx = selectedColors.value.indexOf(id)
  if (idx === -1) selectedColors.value.push(id)
  else selectedColors.value.splice(idx, 1)
}

function toggleMultiSize(id: string) {
  const idx = selectedSizes.value.indexOf(id)
  if (idx === -1) selectedSizes.value.push(id)
  else selectedSizes.value.splice(idx, 1)
}

const sellingPrice = computed(() => Number(initialVariant.selling_price) || 0)
const costPrice = computed(() => Number(initialVariant.cost_price) || 0)

const priceError = computed(() =>
  attempted.value && includeInitialVariant.value && sellingPrice.value <= 0
    ? 'Enter a default selling price greater than $0.00'
    : undefined,
)
const costError = computed(() =>
  attempted.value && includeInitialVariant.value && costPrice.value < 0
    ? 'Cost price cannot be negative'
    : undefined,
)

const barcodeConflict = ref<ProductVariant | null>(null)
const conflictProductName = computed(() =>
  barcodeConflict.value?.product?.name || (barcodeConflict.value as any)?.product_name || 'Existing Product',
)
const conflictProductId = computed(() =>
  barcodeConflict.value?.product_id || barcodeConflict.value?.product?.id || '',
)
const barcodeError = computed(() =>
  barcodeConflict.value
    ? `Already assigned to ${conflictProductName.value} (${barcodeConflict.value.sku})`
    : undefined,
)

let barcodeCheckSeq = 0
async function verifyBarcodeUniqueness(rawCode: string) {
  const clean = normalizeScannedCode(rawCode) || rawCode.trim()
  if (!clean) {
    barcodeConflict.value = null
    return
  }
  const seq = ++barcodeCheckSeq
  try {
    const res = await scanCode(clean)
    if (seq !== barcodeCheckSeq) return
    const matched = res?.variant || res?.variants?.[0] || null
    barcodeConflict.value = matched
    if (matched) {
      addToast({
        type: 'warn',
        title: 'Barcode / QR Already Exists',
        message: `"${clean}" is already assigned to ${matched.product?.name || matched.sku} (${matched.sku}).`,
      })
    }
  } catch {
    if (seq === barcodeCheckSeq) {
      barcodeConflict.value = null
    }
  }
}

async function verifyRowBarcode(rowKey: string): Promise<boolean> {
  const ov = getRowOverride(rowKey)
  if (!ov.included) return true
  const clean = normalizeScannedCode(ov.barcode) || ov.barcode.trim()
  ov.barcode = clean
  ov.error = undefined
  if (!clean) return true

  const duplicateRow = includedMatrixRows.value.find(
    r => r.key !== rowKey && (normalizeScannedCode(r.override.barcode) || r.override.barcode.trim()).toLowerCase() === clean.toLowerCase(),
  )
  if (duplicateRow) {
    ov.error = `Duplicate barcode with ${duplicateRow.colorName} / ${duplicateRow.sizeName}`
    return false
  }

  try {
    const res = await scanCode(clean)
    const matched = res?.variant || res?.variants?.[0] || null
    if (matched) {
      ov.error = `Used by ${matched.sku}`
      return false
    }
  } catch {
    // 404 = available
  }
  return true
}

function openScannerForSingle() {
  scannerTargetRowKey.value = null
  showScannerModal.value = true
}

function openScannerForRow(rowKey: string) {
  scannerTargetRowKey.value = rowKey
  showScannerModal.value = true
}

function onBarcodeScanned(code: string) {
  const clean = normalizeScannedCode(code) || code.trim()
  if (variantMode.value === 'multi' && scannerTargetRowKey.value) {
    const ov = getRowOverride(scannerTargetRowKey.value)
    ov.barcode = clean
    verifyRowBarcode(scannerTargetRowKey.value)
    return
  }
  initialVariant.barcode = clean
  verifyBarcodeUniqueness(clean)
}

function onBarcodeBlur() {
  const clean = normalizeScannedCode(initialVariant.barcode) || initialVariant.barcode.trim()
  initialVariant.barcode = clean
  verifyBarcodeUniqueness(clean)
}

function clearBarcodeConflict() {
  barcodeConflict.value = null
  initialVariant.barcode = ''
}

watch(() => initialVariant.barcode, (val) => {
  if (!val?.trim()) {
    barcodeConflict.value = null
  }
})

useHardwareScanner({
  onScan(code) {
    if (!includeInitialVariant.value || showScannerModal.value) return
    if (variantMode.value === 'single') {
      onBarcodeScanned(code)
    }
  },
})

function toItems(res: any): any[] {
  return Array.isArray(res) ? res : (res?.items ?? [])
}

async function submitProduct(shouldPrintSticker = false) {
  attempted.value = true
  const nameOk = formRef.value?.validate() ?? !!form.value.name.trim()
  if (!nameOk) return

  if (includeInitialVariant.value && variantMode.value === 'single' && initialVariant.barcode.trim()) {
    await verifyBarcodeUniqueness(initialVariant.barcode)
  }

  if (includeInitialVariant.value && variantMode.value === 'multi') {
    if (includedMatrixRows.value.length === 0) {
      addToast({
        type: 'warn',
        title: 'No Variants Included',
        message: 'Include at least one variant combination or uncheck "Generate variants now".',
      })
      return
    }
    const checks = await Promise.all(includedMatrixRows.value.map(r => verifyRowBarcode(r.key)))
    if (checks.some(ok => !ok)) {
      addToast({
        type: 'warn',
        title: 'Duplicate Barcode Detected',
        message: 'Each variant combination must have a unique barcode.',
      })
      return
    }
  }

  if (includeInitialVariant.value && (priceError.value || costError.value || (variantMode.value === 'single' && barcodeError.value))) {
    addToast({
      type: 'warn',
      title: 'Check the pricing & variant fields',
      message: barcodeError.value || priceError.value || costError.value,
    })
    return
  }

  isSubmitting.value = true
  printAfterCreate.value = shouldPrintSticker
  try {
    const f = form.value
    const payload: Record<string, any> = {
      name: f.name.trim(),
      code: f.code?.trim() || null,
      description: f.description?.trim() || null,
      category_id: f.category_id || null,
      brand_id: f.brand_id || null,
      supplier_id: f.supplier_id || null,
      status_code: f.status_code,
      image_url: f.image_url?.trim() || null,
      tags: f.tags || [],
      images: (f.images || []).map((img, idx) => ({
        image_url: img.image_url,
        variant_id: img.variant_id || null,
        is_primary: img.is_primary,
        sort_order: idx,
      })),
      attribute_value_ids: f.attribute_value_ids || [],
    }

    if (includeInitialVariant.value && variantMode.value === 'single') {
      payload.initial_variant = {
        sku: initialVariant.sku?.trim() || null,
        selling_price: sellingPrice.value,
        cost_price: costPrice.value,
        color_id: initialVariant.color_id || null,
        size_id: initialVariant.size_id || null,
        barcode: initialVariant.barcode?.trim() || null,
        image_url: initialVariant.image_url || null,
        initial_stock: Math.max(0, Math.floor(Number(initialVariant.initial_stock) || 0)),
      }
    }

    const res: any = await createProduct(payload)
    let createdVariant = res?.variants?.[0]

    if (includeInitialVariant.value && variantMode.value === 'multi' && res?.id) {
      const bulkItems = includedMatrixRows.value.map((r) => {
        const rowSell = r.override.selling_price !== '' && r.override.selling_price != null
          ? Number(r.override.selling_price)
          : sellingPrice.value
        const rowCost = r.override.cost_price !== '' && r.override.cost_price != null
          ? Number(r.override.cost_price)
          : costPrice.value
        return {
          color_id: r.colorId,
          size_id: r.sizeId,
          sku: r.override.sku.trim() || null,
          selling_price: rowSell,
          cost_price: rowCost,
          barcode: r.override.barcode.trim() || null,
          image_url: r.override.image_url || null,
          status_code: r.override.status_code || 'ACTIVE',
          initial_stock: Math.max(0, Math.floor(Number(r.override.initial_stock) || 0)),
        }
      })
      const bulkRes = await createVariantsBulk(res.id, {
        items: bulkItems,
        default_selling_price: sellingPrice.value,
        default_cost_price: costPrice.value,
      })
      createdVariant = bulkRes.created?.[0] || createdVariant
      addToast({
        type: 'success',
        title: `Product & ${bulkRes.created.length} Variant${bulkRes.created.length === 1 ? '' : 's'} Created`,
        message: `${res.name} (${res.code}) and its SKUs were generated.`,
      })
    } else {
      addToast({
        type: 'success',
        title: 'Product created',
        message: createdVariant
          ? `${res?.name || f.name} (${createdVariant.sku}) is ready.`
          : `${res?.name || f.name} was added to the catalog.`,
      })
    }

    if (!res?.id) {
      await router.push('/products')
    } else if (shouldPrintSticker && createdVariant?.id) {
      await router.push(`/products/${res.id}?tab=barcodes&print_variant=${createdVariant.id}`)
    } else {
      await router.push(`/products/${res.id}`)
    }
  } catch (err: any) {
    addToast({
      type: 'error',
      title: 'Failed to create product',
      message: err?.data?.detail || err?.message || 'Server error creating product',
    })
  } finally {
    isSubmitting.value = false
    printAfterCreate.value = false
  }
}

onMounted(async () => {
  const [colors, sizes] = await Promise.all([
    listColors().catch(() => []),
    listSizes().catch(() => []),
  ])
  rawColors.value = toItems(colors) as Color[]
  rawSizes.value = toItems(sizes) as Size[]
  colorOptions.value = rawColors.value.map((c: any) => ({ label: c.name, value: c.id }))
  sizeOptions.value = rawSizes.value.map((s: any) => ({ label: s.name, value: s.id }))
})
</script>
