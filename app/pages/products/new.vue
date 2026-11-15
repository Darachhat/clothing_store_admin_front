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

    <!-- 3-STEP WIZARD BAR (No Long Page Scrolling) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg border border-border-subtle bg-surface-card p-2">
      <button
        type="button"
        class="flex items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors min-w-0"
        :class="wizardStep === 1
          ? 'bg-ink text-white border-border-default'
          : 'bg-surface-inset text-ink border-border-subtle hover:bg-surface-hover'"
        @click="goToStep(1)"
      >
        <span
          class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 border"
          :class="wizardStep === 1 ? 'bg-white text-ink border-border-subtle' : 'bg-surface-card text-ink border-border-subtle'"
        >
          1
        </span>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-semibold leading-snug">Basic Info &amp; Pricing</div>
          <div class="text-[11px] truncate opacity-80 mono">
            {{ form.name.trim() ? form.name.trim() : 'Name & category' }} · {{ sellingPrice > 0 ? `$${sellingPrice.toFixed(2)}` : '$0.00' }}
          </div>
        </div>
      </button>

      <button
        type="button"
        class="flex items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors min-w-0"
        :class="wizardStep === 2
          ? 'bg-ink text-white border-border-default'
          : 'bg-surface-inset text-ink border-border-subtle hover:bg-surface-hover'"
        @click="goToStep(2)"
      >
        <span
          class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 border"
          :class="wizardStep === 2 ? 'bg-white text-ink border-border-subtle' : 'bg-surface-card text-ink border-border-subtle'"
        >
          2
        </span>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-semibold leading-snug">Images &amp; Attributes</div>
          <div class="text-[11px] truncate opacity-80 mono">
            {{ (form.images?.length || 0) }} image{{ (form.images?.length || 0) === 1 ? '' : 's' }} · {{ (form.attribute_value_ids?.length || 0) }} attribute{{ (form.attribute_value_ids?.length || 0) === 1 ? '' : 's' }}
          </div>
        </div>
      </button>

      <button
        type="button"
        class="flex items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors min-w-0"
        :class="wizardStep === 3
          ? 'bg-ink text-white border-border-default'
          : 'bg-surface-inset text-ink border-border-subtle hover:bg-surface-hover'"
        @click="goToStep(3)"
      >
        <span
          class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 border"
          :class="wizardStep === 3 ? 'bg-white text-ink border-border-subtle' : 'bg-surface-card text-ink border-border-subtle'"
        >
          3
        </span>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-semibold leading-snug">Colors, Sizes &amp; Stock</div>
          <div class="text-[11px] truncate opacity-80 mono">
            {{ variantMode === 'multi' ? `${selectedColors.length} color${selectedColors.length === 1 ? '' : 's'} · ${includedMatrixRows.length} var · ${totalMatrixStock} pcs` : 'Single item' }}
          </div>
        </div>
      </button>
    </div>

    <ProductForm
      ref="formRef"
      v-model="form"
      wizard
      :step="wizardStep"
      cancel-to="/products"
      submit-label="Create Product"
      :primary-submit="!includeInitialVariant"
      :submitting="isSubmitting && !printAfterCreate"
      @submit="submitProduct(false)"
    >
      <!-- STEP 3: COLORS, SIZES & STOCK GENERATOR -->
      <AppCard
        title="Step 3 — Colors, Sizes & Opening Stock"
        subtitle="Choose a color, pick its available sizes, enter the opening stock quantity, and save. Then add another color if needed."
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

          <!-- GUIDED COLOR-BY-COLOR BUILDER MODE -->
          <template v-else>
            <!-- SAVED COLORS SUMMARY + "ADD ANOTHER COLOR?" PROMPT -->
            <div v-if="selectedColors.length > 0" class="flex flex-col gap-3">
              <!-- Prompt asking if product has another color (shown after saving a color) -->
              <div
                v-if="!isBuilderOpen"
                class="rounded-lg border border-border-default bg-surface-inset p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div class="flex items-start sm:items-center gap-2.5">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-ink shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <div class="text-sm font-semibold text-ink">
                      {{ lastSavedColorName ? `${lastSavedColorName} added!` : 'Color & sizes saved!' }}
                      Does this product have another color?
                    </div>
                    <p class="text-xs text-ink-secondary m-0 mt-0.5">
                      Click <strong>+ Add Another Color</strong> to choose the next color and its sizes, or scroll down to create the product.
                    </p>
                  </div>
                </div>
                <AppButton
                  type="button"
                  size="sm"
                  variant="primary"
                  icon="i-heroicons-plus"
                  label="Add Another Color"
                  class="w-full sm:w-auto justify-center shrink-0"
                  @click="startAddAnotherColor"
                />
              </div>

              <!-- Added Colors & Their Sizes/Stock Cards -->
              <div class="rounded-lg border border-border-subtle bg-surface-card overflow-hidden">
                <div class="px-3 py-2.5 border-b border-border-subtle bg-surface-inset flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-ink uppercase tracking-wider">
                      Added Colors &amp; Sizes ({{ selectedColors.length }} Color{{ selectedColors.length === 1 ? '' : 's' }})
                    </span>
                    <span class="inline-flex items-center gap-1 rounded border border-border-subtle bg-surface-card px-2 py-0.5 text-xs font-medium text-ink mono">
                      {{ includedMatrixRows.length }} variants · {{ totalMatrixStock }} pcs
                    </span>
                  </div>
                  <AppButton
                    v-if="!isBuilderOpen"
                    type="button"
                    size="xs"
                    variant="default"
                    icon="i-heroicons-plus"
                    label="Add Another Color"
                    @click="startAddAnotherColor"
                  />
                </div>

                <div class="divide-y divide-border-subtle">
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
                        <span class="text-sm font-semibold text-ink">{{ colorGroup.name }}</span>
                        <span class="rounded border border-border-subtle bg-surface-inset px-2 py-0.5 text-[11px] text-ink-secondary mono">
                          {{ getColorIncludedSizes(colorGroup.key).length }} size{{ getColorIncludedSizes(colorGroup.key).length === 1 ? '' : 's' }} · {{ getColorStockSubtotal(colorGroup.id) }} pcs
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <AppButton
                          type="button"
                          size="xs"
                          variant="default"
                          icon="i-heroicons-pencil-square"
                          label="Edit Sizes & Stock"
                          @click="editAddedColor(colorGroup.key)"
                        />
                        <button
                          type="button"
                          class="p-1.5 rounded border border-border-subtle text-ink-secondary hover:text-ink"
                          :title="`Remove ${colorGroup.name}`"
                          @click="removeAddedColor(colorGroup.key)"
                        >
                          <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <!-- Selected sizes + inline editable stock for this color -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      <div
                        v-for="sItem in getColorIncludedSizes(colorGroup.key)"
                        :key="sItem.id"
                        class="flex items-center justify-between gap-1.5 rounded-md border border-border-subtle bg-surface-inset px-2.5 py-1.5"
                      >
                        <span class="text-xs font-semibold text-ink truncate">{{ sItem.name }}</span>
                        <div class="inline-flex items-center gap-1 shrink-0">
                          <span class="text-[11px] text-ink-secondary">Stock:</span>
                          <input
                            v-model="getRowOverride(`${colorGroup.key}::${sItem.id}`).initial_stock"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            :aria-label="`Stock for ${colorGroup.name} size ${sItem.name}`"
                            class="h-7 w-14 rounded border border-border-subtle bg-surface-card px-1.5 text-xs text-center mono text-ink"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- STEP-BY-STEP BUILDER: 1. CHOOSE/ADD COLOR -> 2. CHOOSE SIZES & STOCK -> SAVE COLOR -->
            <div
              v-if="isBuilderOpen || selectedColors.length === 0"
              class="rounded-lg border border-border-default bg-surface-card overflow-hidden flex flex-col"
            >
              <!-- Builder Header -->
              <div class="px-3.5 py-2.5 border-b border-border-subtle bg-surface-inset flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-ink text-white text-xs font-semibold">
                    {{ activeBuilderColorId ? '2' : '1' }}
                  </span>
                  <span class="text-xs font-semibold text-ink uppercase tracking-wider">
                    {{ activeBuilderColorId ? `Select Sizes & Stock for ${activeBuilderColorName}` : 'Choose or Add a Color' }}
                  </span>
                </div>
                <button
                  v-if="selectedColors.length > 0"
                  type="button"
                  class="text-xs text-ink-secondary hover:text-ink underline"
                  @click="cancelColorBuilder"
                >
                  Done adding colors
                </button>
              </div>

              <div class="p-3.5 flex flex-col gap-4">
                <!-- STEP 1: Choose or Create a Color -->
                <div class="flex flex-col gap-2.5">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-xs font-semibold text-ink">
                      Step 1 — Pick one color to configure its sizes:
                    </span>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
                      @click="showNewColorInput = !showNewColorInput"
                    >
                      <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                      <span>New Color</span>
                    </button>
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
                      label="Add & Select Color"
                      :loading="creatingColor"
                      @click="handleQuickCreateColor"
                    />
                  </div>

                  <div class="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
                    <button
                      v-for="c in rawColors"
                      :key="c.id"
                      type="button"
                      class="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
                      :class="activeBuilderColorId === c.id
                        ? 'bg-ink text-white border-border-default shadow-xs'
                        : selectedColors.includes(c.id)
                          ? 'bg-surface-card text-ink border-border-default'
                          : 'bg-surface-inset text-ink-secondary border-border-subtle hover:text-ink'"
                      @click="selectColorForBuilder(c.id)"
                    >
                      <span
                        v-if="c.hex_code"
                        class="inline-block w-3 h-3 rounded-full border border-border-subtle shrink-0"
                        :style="{ background: c.hex_code }"
                      />
                      <span>{{ c.name }}</span>
                      <UIcon
                        v-if="selectedColors.includes(c.id)"
                        name="i-heroicons-check-circle"
                        class="w-3.5 h-3.5 shrink-0"
                      />
                    </button>
                    <p v-if="rawColors.length === 0" class="text-xs text-ink-tertiary italic m-0">
                      No colors configured yet. Click "+ New Color" above to add your first color.
                    </p>
                  </div>
                </div>

                <!-- STEP 2: Choose Sizes & Enter Stock for the Selected Color -->
                <div
                  v-if="activeBuilderColorId"
                  class="rounded-lg border border-border-subtle bg-surface-inset p-3 flex flex-col gap-3"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span
                        v-if="activeBuilderColorHex"
                        class="inline-block w-3.5 h-3.5 rounded-full border border-border-subtle shrink-0"
                        :style="{ background: activeBuilderColorHex }"
                      />
                      <span class="text-xs font-semibold text-ink">
                        Step 2 — Choose sizes for <strong>{{ activeBuilderColorName }}</strong> &amp; enter stock:
                      </span>
                    </div>
                    <div class="flex flex-wrap items-center gap-2.5 text-xs text-ink-secondary">
                      <button type="button" class="underline hover:text-ink" @click="setDraftAllSizes(true)">All Sizes</button>
                      <button type="button" class="underline hover:text-ink" @click="setDraftAllSizes(false)">Clear</button>
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
                  <div v-if="showNewSizeInput" class="flex flex-wrap items-center gap-1.5 rounded-md border border-border-subtle bg-surface-card p-2">
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
                      label="Add & Select Size"
                      :loading="creatingSize"
                      @click="handleQuickCreateSize"
                    />
                  </div>

                  <!-- Size + Stock Cards Grid -->
                  <div v-if="rawSizes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <div
                      v-for="s in rawSizes"
                      :key="s.id"
                      class="flex items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors"
                      :class="getDraftSizeState(s.id).included
                        ? 'bg-surface-card border-border-default shadow-xs'
                        : 'bg-surface-card/50 border-border-subtle opacity-65 hover:opacity-100'"
                    >
                      <label class="inline-flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          v-model="getDraftSizeState(s.id).included"
                          class="h-4 w-4 rounded border-border-default text-ink cursor-pointer shrink-0"
                        />
                        <span class="truncate">{{ s.name }}</span>
                      </label>

                      <div v-if="getDraftSizeState(s.id).included" class="inline-flex items-center gap-1.5 shrink-0">
                        <span class="text-[11px] text-ink-secondary">Stock:</span>
                        <input
                          v-model="getDraftSizeState(s.id).stock"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          :aria-label="`Opening stock for ${activeBuilderColorName} size ${s.name}`"
                          class="h-8 w-16 rounded-md border border-border-subtle bg-surface-inset px-2 text-xs text-center mono text-ink"
                          @keydown.enter.prevent="commitActiveColorBuilder()"
                        />
                      </div>
                      <span
                        v-else
                        class="text-[11px] text-ink-tertiary cursor-pointer"
                        @click="getDraftSizeState(s.id).included = true"
                      >
                        Tap to select
                      </span>
                    </div>
                  </div>
                  <p v-else class="text-xs text-ink-tertiary italic m-0">
                    No sizes configured yet. Click "+ New Size" above to add sizes.
                  </p>

                  <!-- Quick fill stock for all selected sizes of this color + Save Color button -->
                  <div class="pt-2 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div class="flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
                      <span>
                        Selected for <strong class="text-ink">{{ activeBuilderColorName }}</strong>:
                        <strong class="text-ink">{{ activeDraftSelectedCount }}</strong> size{{ activeDraftSelectedCount === 1 ? '' : 's' }}
                        · <strong class="text-ink mono">{{ activeDraftTotalStock }}</strong> pcs
                      </span>
                      <div v-if="activeDraftSelectedCount > 0" class="inline-flex items-center gap-1">
                        <input
                          v-model="draftBulkStock"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Qty"
                          aria-label="Set stock for selected sizes of this color"
                          class="h-7 w-16 rounded border border-border-subtle bg-surface-card px-2 text-xs mono text-ink"
                          @keydown.enter.prevent="applyDraftBulkStock"
                        />
                        <AppButton
                          type="button"
                          size="xs"
                          variant="default"
                          label="Fill Stock"
                          @click="applyDraftBulkStock"
                        />
                      </div>
                    </div>

                    <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
                      <AppButton
                        v-if="selectedColors.length > 0"
                        type="button"
                        size="sm"
                        variant="ghost"
                        label="Cancel"
                        class="justify-center"
                        @click="cancelColorBuilder"
                      />
                      <AppButton
                        type="button"
                        size="sm"
                        variant="primary"
                        icon="i-heroicons-check"
                        :disabled="activeDraftSelectedCount === 0"
                        :label="`Save ${activeBuilderColorName} (${activeDraftSelectedCount} Size${activeDraftSelectedCount === 1 ? '' : 's'})`"
                        class="justify-center"
                        @click="commitActiveColorBuilder()"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- STEP 4: Variant Matrix Details (Responsive Mobile Cards + Desktop Table) -->
            <div v-if="selectedColors.length > 0 && includedMatrixRows.length > 0" class="rounded-lg border border-border-subtle bg-surface-card overflow-hidden">
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
                    Optional — Customize Individual SKUs, Prices &amp; Barcodes ({{ includedMatrixRows.length }} variants)
                  </span>
                </div>
                <span class="text-xs text-ink-secondary shrink-0">
                  {{ showAdvancedMatrix ? 'Hide details' : 'Show details' }}
                </span>
              </button>

              <template v-if="showAdvancedMatrix">
                <!-- MOBILE VIEW (< md): Responsive Per-Variant Cards (No Horizontal Scroll) -->
                <div class="md:hidden divide-y divide-border-subtle max-h-[480px] overflow-y-auto">
                  <div
                    v-for="row in includedMatrixRows"
                    :key="`mob-${row.key}`"
                    class="p-3 flex flex-col gap-2.5 bg-surface-card"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="inline-flex items-center gap-2 text-xs font-semibold text-ink">
                        <span
                          v-if="row.colorHex"
                          class="inline-block w-3 h-3 rounded-full border border-border-subtle shrink-0"
                          :style="{ background: row.colorHex }"
                        />
                        <span>{{ row.colorName }} · {{ row.sizeName }}</span>
                      </div>
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
                        v-for="row in includedMatrixRows"
                        :key="row.key"
                        class="bg-surface-card"
                      >
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

      <!-- WIZARD STEP 1 SIDEBAR: Default Pricing & Next Step Button -->
      <template #step-1-side>
        <AppCard
          title="Default Pricing (USD)"
          subtitle="Base cost and selling prices applied to variants."
        >
          <template #header-right>
            <span class="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-inset px-2 py-0.5 text-xs font-medium text-ink-secondary">
              <UIcon name="i-heroicons-currency-dollar" class="w-3.5 h-3.5" />
              <span>USD</span>
            </span>
          </template>

          <div class="flex flex-col gap-3">
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
          </div>
        </AppCard>

        <div class="flex flex-col-reverse sm:flex-row lg:flex-col gap-2">
          <AppButton
            type="button"
            variant="default"
            label="Cancel"
            to="/products"
            class="w-full justify-center"
          />
          <AppButton
            type="button"
            variant="primary"
            icon="i-heroicons-arrow-right"
            label="Next: Images & Attributes"
            class="w-full justify-center"
            @click="goToStep(2)"
          />
        </div>
      </template>

      <!-- WIZARD STEP 2 SIDEBAR: Back / Next Step Buttons -->
      <template #step-2-side>
        <div class="flex flex-col-reverse sm:flex-row lg:flex-col gap-2">
          <AppButton
            type="button"
            variant="default"
            icon="i-heroicons-arrow-left"
            label="Back: Basic Info & Price"
            class="w-full justify-center"
            @click="goToStep(1)"
          />
          <AppButton
            type="button"
            variant="primary"
            icon="i-heroicons-arrow-right"
            label="Next: Colors, Sizes & Stock"
            class="w-full justify-center"
            @click="goToStep(3)"
          />
        </div>
      </template>

      <!-- WIZARD STEP 3 SIDEBAR: Summary, Quick Price Edit & Create Actions -->
      <template #actions>
        <AppCard
          title="Product & Price Summary"
          subtitle="Review product details or adjust default prices before creating."
        >
          <div class="flex flex-col gap-3 text-xs">
            <div class="flex items-center justify-between gap-2 pb-2 border-b border-border-subtle">
              <div class="min-w-0">
                <div class="font-semibold text-ink truncate">{{ form.name.trim() || 'Untitled Product' }}</div>
                <div class="text-ink-secondary mono truncate">{{ form.code?.trim() || 'Auto Product Code' }}</div>
              </div>
              <button type="button" class="underline text-ink-secondary hover:text-ink shrink-0" @click="goToStep(1)">
                Edit Step 1
              </button>
            </div>

            <div class="flex items-center justify-between gap-2 pb-2 border-b border-border-subtle">
              <span class="text-ink-secondary">
                Images: <strong class="text-ink">{{ form.images?.length || 0 }}</strong> ·
                Attributes: <strong class="text-ink">{{ form.attribute_value_ids?.length || 0 }}</strong>
              </span>
              <button type="button" class="underline text-ink-secondary hover:text-ink shrink-0" @click="goToStep(2)">
                Edit Step 2
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <AppInput
                id="step3-cost-price"
                v-model="initialVariant.cost_price"
                type="number"
                label="Cost ($)"
                step="0.01"
                min="0"
                placeholder="5.00"
                mono
                :error="costError"
              />
              <AppInput
                id="step3-selling-price"
                v-model="initialVariant.selling_price"
                type="number"
                label="Selling ($)"
                step="0.01"
                min="0.01"
                placeholder="12.00"
                mono
                required
                :error="priceError"
              />
            </div>

            <AppButton
              v-if="variantMode === 'multi' && multiGridRows.length > 0"
              type="button"
              size="xs"
              variant="default"
              icon="i-heroicons-arrow-path"
              label="Apply Default Prices to Variants"
              class="w-full justify-center"
              @click="applyDefaultPricesToMatrix"
            />
          </div>
        </AppCard>

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
          type="button"
          variant="default"
          icon="i-heroicons-arrow-left"
          label="Back: Images & Attributes"
          class="w-full justify-center"
          @click="goToStep(2)"
        />

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
const wizardStep = ref<1 | 2 | 3>(1)
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

// Guided Color-by-Color Builder state
const isBuilderOpen = ref(true)
const activeBuilderColorId = ref<string | null>(null)
const lastSavedColorName = ref('')
const draftBulkStock = ref<string | number>('')

interface DraftSizeState {
  included: boolean
  stock: string | number
}
const draftSizeMap = reactive<Record<string, DraftSizeState>>({})

function getDraftSizeState(sizeId: string): DraftSizeState {
  if (!draftSizeMap[sizeId]) {
    draftSizeMap[sizeId] = { included: false, stock: '' }
  }
  return draftSizeMap[sizeId]!
}

const activeBuilderColorObj = computed(() =>
  activeBuilderColorId.value ? rawColors.value.find(c => c.id === activeBuilderColorId.value) : null,
)
const activeBuilderColorName = computed(() => activeBuilderColorObj.value?.name || 'Selected Color')
const activeBuilderColorHex = computed(() => activeBuilderColorObj.value?.hex_code || undefined)

const activeDraftSelectedCount = computed(() =>
  rawSizes.value.filter(s => getDraftSizeState(s.id).included).length,
)

const activeDraftTotalStock = computed(() =>
  rawSizes.value.reduce((sum, s) => {
    const st = getDraftSizeState(s.id)
    if (!st.included) return sum
    return sum + Math.max(0, Math.floor(Number(st.stock) || 0))
  }, 0),
)

function selectColorForBuilder(colorId: string) {
  activeBuilderColorId.value = colorId
  isBuilderOpen.value = true
  const alreadySaved = selectedColors.value.includes(colorId)
  for (const s of rawSizes.value) {
    const existing = rowOverrides[`${colorId}::${s.id}`]
    if (alreadySaved && existing) {
      draftSizeMap[s.id] = {
        included: existing.included,
        stock: existing.initial_stock,
      }
    } else {
      draftSizeMap[s.id] = {
        included: false,
        stock: '',
      }
    }
  }
}

function setDraftAllSizes(included: boolean) {
  for (const s of rawSizes.value) {
    getDraftSizeState(s.id).included = included
  }
}

function applyDraftBulkStock() {
  const qty = Math.max(0, Math.floor(Number(draftBulkStock.value)))
  if (!Number.isFinite(qty) || draftBulkStock.value === '') return
  for (const s of rawSizes.value) {
    const st = getDraftSizeState(s.id)
    if (st.included) {
      st.stock = qty
    }
  }
}

function syncSelectedSizesFromOverrides() {
  const usedSizeIds = new Set<string>()
  for (const cId of selectedColors.value) {
    for (const s of rawSizes.value) {
      if (rowOverrides[`${cId}::${s.id}`]?.included) {
        usedSizeIds.add(s.id)
      }
    }
  }
  selectedSizes.value = rawSizes.value.filter(s => usedSizeIds.has(s.id)).map(s => s.id)
}

function commitActiveColorBuilder(silent = false): boolean {
  const cId = activeBuilderColorId.value
  if (!cId) return false
  const chosenSizes = rawSizes.value.filter(s => getDraftSizeState(s.id).included)
  if (chosenSizes.length === 0) {
    if (!silent) {
      addToast({
        type: 'warn',
        title: 'Select at least one size',
        message: `Choose one or more sizes for ${activeBuilderColorName.value} before saving.`,
      })
    }
    return false
  }

  if (!selectedColors.value.includes(cId)) {
    selectedColors.value.push(cId)
  }

  for (const s of rawSizes.value) {
    const draft = getDraftSizeState(s.id)
    const ov = getRowOverride(`${cId}::${s.id}`)
    ov.included = draft.included
    if (draft.included) {
      ov.initial_stock = draft.stock
    } else {
      ov.initial_stock = ''
    }
  }

  syncSelectedSizesFromOverrides()
  lastSavedColorName.value = activeBuilderColorName.value
  activeBuilderColorId.value = null
  isBuilderOpen.value = false
  return true
}

function startAddAnotherColor() {
  activeBuilderColorId.value = null
  isBuilderOpen.value = true
}

function cancelColorBuilder() {
  activeBuilderColorId.value = null
  if (selectedColors.value.length > 0) {
    isBuilderOpen.value = false
  }
}

function editAddedColor(colorId: string) {
  selectColorForBuilder(colorId)
}

function removeAddedColor(colorId: string) {
  const idx = selectedColors.value.indexOf(colorId)
  if (idx !== -1) {
    selectedColors.value.splice(idx, 1)
  }
  for (const s of rawSizes.value) {
    if (rowOverrides[`${colorId}::${s.id}`]) {
      rowOverrides[`${colorId}::${s.id}`]!.included = false
    }
  }
  syncSelectedSizesFromOverrides()
  if (selectedColors.value.length === 0) {
    isBuilderOpen.value = true
  }
}

function getColorIncludedSizes(colorId: string): Size[] {
  return rawSizes.value.filter(s => getRowOverride(`${colorId}::${s.id}`).included)
}

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
    selectColorForBuilder(created.id)
    newColorName.value = ''
    showNewColorInput.value = false
    addToast({ type: 'success', title: 'Color created', message: `Now choose sizes and stock for ${created.name}.` })
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
    getDraftSizeState(created.id).included = true
    newSizeName.value = ''
    showNewSizeInput.value = false
    addToast({ type: 'success', title: 'Size added', message: `${created.name} is now selected for ${activeBuilderColorName.value}.` })
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
      included: false,
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
  if (selectedColors.value.length === 0 || selectedSizes.value.length === 0) return []
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

  for (const cId of selectedColors.value) {
    const colorObj = rawColors.value.find(c => c.id === cId)
    for (const sId of selectedSizes.value) {
      const sizeObj = rawSizes.value.find(s => s.id === sId)
      const key = `${cId}::${sId}`
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

const showAdvancedMatrix = ref(false)

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

function goToStep(target: 1 | 2 | 3) {
  if (target > 1 && wizardStep.value === 1) {
    attempted.value = true
    const nameOk = formRef.value?.validate() ?? !!form.value.name.trim()
    if (!nameOk) {
      addToast({
        type: 'warn',
        title: 'Product Name Required',
        message: 'Enter a Product Name in Step 1 before continuing.',
      })
      return
    }
    if (includeInitialVariant.value && sellingPrice.value <= 0) {
      addToast({
        type: 'warn',
        title: 'Default Selling Price Required',
        message: 'Enter a Default Selling Price greater than $0.00 before continuing.',
      })
      return
    }
  }
  wizardStep.value = target
}

async function submitProduct(shouldPrintSticker = false) {
  attempted.value = true
  const nameOk = formRef.value?.validate() ?? !!form.value.name.trim()
  if (!nameOk) {
    wizardStep.value = 1
    return
  }

  if (includeInitialVariant.value && variantMode.value === 'single' && initialVariant.barcode.trim()) {
    await verifyBarcodeUniqueness(initialVariant.barcode)
  }

  if (includeInitialVariant.value && variantMode.value === 'multi') {
    if (isBuilderOpen.value && activeBuilderColorId.value && activeDraftSelectedCount.value > 0) {
      commitActiveColorBuilder(true)
    }
    if (includedMatrixRows.value.length === 0) {
      addToast({
        type: 'warn',
        title: 'No Variants Added',
        message: 'Choose a color, select its sizes, and click Save Color (or uncheck "Generate variants now").',
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
