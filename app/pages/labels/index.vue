<template>
  <div class="page-root">
    <AppPageHeader
      title="Product Stickers &amp; Barcodes"
      description="Generate and print garment stickers, QR tags, and Code-128 barcodes for retail shelves."
      :breadcrumbs="[{ label: 'Catalog' }, { label: 'Print Labels' }]"
    >
      <template #actions>
        <AppButton variant="primary" size="sm" icon="i-heroicons-printer" to="/labels/generate">
          Open Sticker Generator
        </AppButton>
      </template>
    </AppPageHeader>

    <div class="cards-grid">
      <AppCard>
        <div class="feature-card">
          <div class="feature-icon">
            <UIcon name="i-heroicons-tag" style="width:20px;height:20px;" />
          </div>
          <div class="feature-body">
            <h3 class="feature-title">Thermal Garment Stickers (50×30mm &amp; 40×30mm)</h3>
            <p class="feature-desc">
              Print individual adhesive price stickers directly to thermal label printers (Zebra, Xprinter) with QR or Code-128 barcode, SKU, size/color, and dual USD/KHR pricing.
            </p>
            <div class="feature-actions">
              <AppButton size="sm" variant="primary" icon="i-heroicons-printer" to="/labels/generate?preset=THERMAL_50x30">
                Print Thermal Stickers
              </AppButton>
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="feature-card">
          <div class="feature-icon">
            <UIcon name="i-heroicons-qr-code" style="width:20px;height:20px;" />
          </div>
          <div class="feature-body">
            <h3 class="feature-title">A4 / A5 Multi-Column Sticker Sheets</h3>
            <p class="feature-desc">
              Generate multi-column PDF sticker sheets or print directly from the browser for standard office laser/inkjet adhesive label sheets.
            </p>
            <div class="feature-actions">
              <AppButton size="sm" variant="default" icon="i-heroicons-document-text" to="/labels/generate?preset=A4">
                Generate A4 Sheet
              </AppButton>
            </div>
          </div>
        </div>
      </AppCard>
    </div>

    <AppCard title="Quick Actions">
      <div class="quick-links">
        <AppButton to="/labels/generate" variant="primary" icon="i-heroicons-sparkles" label="Open Sticker & Label Studio" />
        <AppButton to="/products" variant="default" icon="i-heroicons-shopping-bag" label="Manage Products & Variants" />
        <AppButton to="/inventory" variant="default" icon="i-heroicons-archive-box" label="View Stock Levels" />
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Labels & Stickers — Clothing Store' })
</script>

<style scoped>
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feature-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.feature-desc {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.feature-actions {
  margin-top: 6px;
}

.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
