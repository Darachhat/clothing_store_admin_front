<template>
  <div class="page-root max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Page Header -->
    <PageHeader
      title="Brand & Identity"
      description="One-stop management for store logo, brand names, slogans, and official credentials across all receipts, invoices, customer displays, and login portals."
      :breadcrumbs="[{ label: 'Administration', to: '/dashboard' }, { label: 'System Settings', to: '/settings' }, { label: 'Brand & Identity' }]"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/settings"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
            <span>Settings Overview</span>
          </NuxtLink>
          <NuxtLink
            to="/settings/receipts"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <UIcon name="i-heroicons-document-text" class="w-3.5 h-3.5" />
            <span>Receipt Formats</span>
          </NuxtLink>
          <AppButton
            variant="primary"
            size="sm"
            :loading="saving"
            @click="handleSave"
          >
            <template #icon-left>
              <UIcon name="i-heroicons-check" class="w-4 h-4" />
            </template>
            <span>Save All Brand Settings</span>
          </AppButton>
        </div>
      </template>
    </PageHeader>

    <LoadingSkeleton v-if="loading && !isLoaded" variant="card" />

    <div v-else class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <!-- ── Left Column: Brand Management Form (7 cols) ────────────────────── -->
      <div class="xl:col-span-7 space-y-6">
        <!-- 1. Logo & Visual Assets Card -->
        <DataCard>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-photo" class="w-4 h-4 text-gray-500" />
                <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Brand Logo &amp; Visual Marks</h3>
              </div>
              <span class="text-[11px] text-gray-500">Auto-synced to POS &amp; Invoices</span>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Primary Logo -->
            <div class="space-y-2">
              <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100">
                Primary Brand Logo (Light Surfaces) *
              </label>
              <p class="text-[11px] text-gray-500 leading-relaxed">
                Appears on thermal receipts, A4 invoices, admin login, and top customer display bar. Recommended: Transparent PNG or SVG (square or horizontal, min 200x200px).
              </p>

              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                <!-- Preview Canvas -->
                <div class="w-28 h-28 rounded-xl border border-gray-200 dark:border-gray-700 bg-white p-2.5 flex items-center justify-center flex-shrink-0 shadow-2xs relative group">
                  <img
                    v-if="form.logo_url"
                    :src="form.logo_url"
                    alt="Brand Logo Preview"
                    class="max-w-full max-h-full object-contain"
                  />
                  <div v-else class="flex flex-col items-center justify-center text-center text-gray-400">
                    <UIcon name="i-heroicons-building-storefront" class="w-8 h-8 text-gray-400" />
                    <span class="text-[10px] mt-1 font-medium">No Logo</span>
                  </div>

                  <button
                    v-if="form.logo_url"
                    type="button"
                    title="Remove logo"
                    class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-xs"
                    @click="form.logo_url = ''"
                  >
                    <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                  </button>
                </div>

                <!-- Upload & URL Controls -->
                <div class="flex-1 w-full space-y-2.5">
                  <div class="flex items-center gap-2">
                    <input
                      ref="primaryFileInputRef"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      class="hidden"
                      @change="onFileSelected($event, 'logo')"
                    />
                    <AppButton
                      type="button"
                      variant="default"
                      size="sm"
                      :loading="uploadingType === 'logo'"
                      @click="primaryFileInputRef?.click()"
                    >
                      <template #icon-left>
                        <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5" />
                      </template>
                      <span>Upload New Image</span>
                    </AppButton>
                    <button
                      v-if="form.logo_url"
                      type="button"
                      class="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 py-1 transition-colors"
                      @click="form.logo_url = ''"
                    >
                      Reset to Default
                    </button>
                  </div>

                  <div>
                    <label class="block text-[11px] text-gray-500 mb-1">Direct Logo Image URL</label>
                    <input
                      v-model="form.logo_url"
                      type="url"
                      placeholder="https://.../logo.png or /uploads/brand/logo.png"
                      class="w-full text-xs font-mono rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Secondary Assets Grid: Dark Logo & Favicon -->
            <div class="pt-4 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Dark Mode Logo -->
              <div class="space-y-2">
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100">
                  Dark Mode Logo (Optional)
                </label>
                <div class="flex items-center gap-3">
                  <div class="w-16 h-16 rounded-lg border border-gray-700 bg-slate-900 p-2 flex items-center justify-center flex-shrink-0">
                    <img
                      v-if="form.logo_dark_url"
                      :src="form.logo_dark_url"
                      alt="Dark Logo"
                      class="max-w-full max-h-full object-contain"
                    />
                    <UIcon v-else name="i-heroicons-moon" class="w-5 h-5 text-slate-500" />
                  </div>
                  <div class="flex-1 min-w-0 space-y-1.5">
                    <input
                      ref="darkFileInputRef"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      class="hidden"
                      @change="onFileSelected($event, 'logo_dark')"
                    />
                    <button
                      type="button"
                      class="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white underline cursor-pointer"
                      @click="darkFileInputRef?.click()"
                    >
                      {{ uploadingType === 'logo_dark' ? 'Uploading...' : 'Upload Dark Mark' }}
                    </button>
                    <input
                      v-model="form.logo_dark_url"
                      type="url"
                      placeholder="Dark logo URL..."
                      class="w-full text-[11px] font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <!-- Favicon -->
              <div class="space-y-2">
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100">
                  Browser Favicon (32x32 / .ico / .png)
                </label>
                <div class="flex items-center gap-3">
                  <div class="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 flex items-center justify-center flex-shrink-0">
                    <img
                      v-if="form.favicon_url"
                      :src="form.favicon_url"
                      alt="Favicon"
                      class="w-6 h-6 object-contain"
                    />
                    <UIcon v-else name="i-heroicons-globe-alt" class="w-5 h-5 text-gray-400" />
                  </div>
                  <div class="flex-1 min-w-0 space-y-1.5">
                    <input
                      ref="faviconFileInputRef"
                      type="file"
                      accept="image/x-icon,image/png,image/svg+xml"
                      class="hidden"
                      @change="onFileSelected($event, 'favicon')"
                    />
                    <button
                      type="button"
                      class="text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white underline cursor-pointer"
                      @click="faviconFileInputRef?.click()"
                    >
                      {{ uploadingType === 'favicon' ? 'Uploading...' : 'Upload Favicon' }}
                    </button>
                    <input
                      v-model="form.favicon_url"
                      type="url"
                      placeholder="Favicon URL..."
                      class="w-full text-[11px] font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DataCard>

        <!-- 2. Brand Naming & Typography Section -->
        <DataCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-tag" class="w-4 h-4 text-gray-500" />
              <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Store Names &amp; Brand Taglines</h3>
            </div>
          </template>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Store Name (Khmer) *
                </label>
                <input
                  v-model="form.store_name_kh"
                  type="text"
                  required
                  placeholder="e.g. គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់"
                  class="w-full text-sm font-medium font-khmer rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
                />
                <p class="text-[10.5px] text-gray-500 mt-1">Primary title on Khmer slips, invoices, and customer displays.</p>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Store Name (English) *
                </label>
                <input
                  v-model="form.store_name"
                  type="text"
                  required
                  placeholder="e.g. KIM VANNAK CLOTHING"
                  class="w-full text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
                />
                <p class="text-[10.5px] text-gray-500 mt-1">Used on international documentation, sidebar, and receipts.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Tagline / Slogan (Khmer)
                </label>
                <input
                  v-model="form.tagline_kh"
                  type="text"
                  placeholder="e.g. សម្លៀកបំពាក់ទាន់សម័យ និងគុណភាពខ្ពស់"
                  class="w-full text-xs font-medium font-khmer rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Tagline / Slogan (English)
                </label>
                <input
                  v-model="form.tagline"
                  type="text"
                  placeholder="e.g. Premium Streetwear & Contemporary Fashion"
                  class="w-full text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
                />
              </div>
            </div>
          </div>
        </DataCard>

        <!-- 3. Official Business & Contact Credentials -->
        <DataCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-building-office-2" class="w-4 h-4 text-gray-500" />
              <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Contact Info &amp; Official Tax Credentials</h3>
            </div>
          </template>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Customer Service Phone</label>
                <input
                  v-model="form.phone"
                  type="text"
                  placeholder="+855 23 888 999"
                  class="w-full text-xs font-mono rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Official Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="store@kimvannak.store"
                  class="w-full text-xs font-mono rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">VAT TIN / Tax ID</label>
                <input
                  v-model="form.tax_id"
                  type="text"
                  placeholder="K001-902348572"
                  class="w-full text-xs font-mono rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Physical Store Address</label>
                <input
                  v-model="form.address"
                  type="text"
                  placeholder="#123 Preah Norodom Blvd, Daun Penh, Phnom Penh"
                  class="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Web Storefront / Portal URL</label>
                <input
                  v-model="form.website_url"
                  type="url"
                  placeholder="https://kimvannak.store"
                  class="w-full text-xs font-mono rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div class="space-y-3 pt-2">
              <div>
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Receipt Footer Message</label>
                <textarea
                  v-model="form.receipt_footer"
                  rows="2"
                  placeholder="THANK YOU FOR SHOPPING WITH US!&#10;សូមអរគុណដែលបានគាំទ្រហាងយើងខ្ញុំ!"
                  class="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-gray-900 dark:text-white leading-relaxed"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Return &amp; Exchange Policy</label>
                <input
                  v-model="form.return_policy"
                  type="text"
                  placeholder="ទំនិញទិញរួចមិនអាចប្តូរប្រាក់វិញបានទេ (Exchange within 7 days with tag/receipt)"
                  class="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </DataCard>

        <!-- Save Bar -->
        <div class="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-xs">
          <div class="text-xs text-gray-500">
            Changes propagate to all receipts, invoices, logins, and customer displays.
          </div>
          <AppButton
            variant="primary"
            size="md"
            :loading="saving"
            @click="handleSave"
          >
            <template #icon-left>
              <UIcon name="i-heroicons-check" class="w-4 h-4" />
            </template>
            <span>Save All Changes</span>
          </AppButton>
        </div>
      </div>

      <!-- ── Right Column: Live One-Stop Preview Stage (5 cols) ─────────────── -->
      <div class="xl:col-span-5 space-y-4 xl:sticky xl:top-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-eye" class="w-4 h-4 text-gray-500" />
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">One-Stop Live Preview</h3>
          </div>
          <span class="text-[11px] font-medium text-gray-500">Real-Time Simulation</span>
        </div>

        <!-- Preview Switcher Tabs -->
        <div class="inline-flex w-full items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 text-xs font-semibold gap-1 overflow-x-auto">
          <button
            v-for="tab in previewTabs"
            :key="tab.id"
            type="button"
            class="flex-1 py-1.5 px-2 rounded-md transition-all text-center whitespace-nowrap cursor-pointer"
            :class="activePreviewTab === tab.id
              ? 'bg-navy text-white shadow-2xs font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'"
            @click="activePreviewTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- ── Preview Panel A: Thermal Receipt Slip (80mm) ────────────────── -->
        <div
          v-if="activePreviewTab === 'RECEIPT'"
          class="bg-slate-100 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-center items-start shadow-inner"
        >
          <div class="w-[300px] bg-white text-gray-900 p-4 rounded-lg border border-gray-300 shadow-sm font-sans space-y-2">
            <!-- Top Header with Brand Logo -->
            <div class="text-center flex flex-col items-center gap-1 pb-2 border-b-2 border-gray-900">
              <div v-if="form.logo_url" class="w-14 h-14 p-1 mb-1 flex items-center justify-center">
                <img :src="form.logo_url" alt="Receipt Logo" class="max-w-full max-h-full object-contain filter grayscale" />
              </div>
              <div v-else class="w-8 h-8 rounded bg-gray-900 text-white flex items-center justify-center mb-0.5">
                <UIcon name="i-heroicons-building-storefront" class="w-5 h-5 text-white" />
              </div>

              <h4 class="text-sm font-bold text-gray-900 font-khmer leading-tight">
                {{ form.store_name_kh || 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់' }}
              </h4>
              <div class="text-[11px] font-bold text-gray-800 tracking-wider uppercase">
                {{ form.store_name || 'KIM VANNAK CLOTHING' }}
              </div>
              <div v-if="form.tagline" class="text-[9.5px] text-gray-600 leading-snug">
                {{ form.tagline }}
              </div>
              <div class="text-[10px] text-gray-700 font-medium">សាខា មេមត់ (Branch 01)</div>
              <div v-if="form.address" class="text-[9px] text-gray-500 leading-tight">
                {{ form.address }}
              </div>
              <div v-if="form.phone" class="text-[9px] font-mono text-gray-600">Tel: {{ form.phone }}</div>
            </div>

            <!-- Receipt Meta -->
            <div class="text-[10px] space-y-0.5 py-1 text-gray-600 border-b border-dashed border-gray-300">
              <div class="flex justify-between"><span>វិក្កយបត្រ:</span><strong class="font-mono text-gray-900">INV-2026-001048</strong></div>
              <div class="flex justify-between"><span>កាលបរិច្ឆេទ:</span><span class="font-mono text-gray-900">07/11/2026 17:30</span></div>
            </div>

            <!-- Sample Line Items -->
            <div class="text-[10.5px] space-y-1.5 py-1 border-b border-dashed border-gray-300">
              <div>
                <div class="font-semibold text-gray-900">Denim Jacket (Black / L)</div>
                <div class="flex justify-between text-[10px] text-gray-600 font-mono">
                  <span>1 x $59.99</span>
                  <strong class="text-gray-900 font-bold">$59.99</strong>
                </div>
              </div>
              <div>
                <div class="font-semibold text-gray-900">Cotton Crewneck (White / M)</div>
                <div class="flex justify-between text-[10px] text-gray-600 font-mono">
                  <span>2 x $25.00</span>
                  <strong class="text-gray-900 font-bold">$50.00</strong>
                </div>
              </div>
            </div>

            <!-- Totals -->
            <div class="text-[11px] space-y-1 pt-1 font-semibold">
              <div class="flex justify-between text-gray-900 text-xs font-bold pt-1 border-t border-gray-900">
                <span>សរុប (Total USD):</span>
                <span class="font-mono">$109.99</span>
              </div>
              <div class="flex justify-between text-gray-600 text-[10px]">
                <span>សរុបជាប្រាក់រៀល (KHR):</span>
                <span class="font-mono">450,959 ៛</span>
              </div>
            </div>

            <!-- Footer -->
            <div class="text-center pt-2 border-t border-dashed border-gray-300 space-y-1 text-[9.5px] text-gray-600">
              <p class="font-bold text-gray-900">សូមអរគុណ!</p>
              <p class="leading-tight">{{ form.receipt_footer || 'THANK YOU FOR SHOPPING WITH US!' }}</p>
              <p v-if="form.return_policy" class="text-[8.5px] text-gray-500 leading-snug">{{ form.return_policy }}</p>
            </div>
          </div>
        </div>

        <!-- ── Preview Panel B: A4 Sales Invoice ────────────────────────────── -->
        <div
          v-else-if="activePreviewTab === 'A4'"
          class="bg-slate-100 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-inner overflow-x-auto"
        >
          <div class="w-full bg-white text-gray-900 p-4 rounded-lg border border-gray-300 shadow-sm space-y-3">
            <!-- A4 Header with Brand Logo -->
            <div class="flex items-start justify-between pb-3 border-b-2 border-gray-900">
              <div class="flex items-center gap-3">
                <div class="w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 p-1 flex items-center justify-center flex-shrink-0">
                  <img v-if="form.logo_url" :src="form.logo_url" alt="Logo" class="max-w-full max-h-full object-contain" />
                  <UIcon v-else name="i-heroicons-building-storefront" class="w-8 h-8 text-gray-700" />
                </div>
                <div>
                  <h4 class="text-sm font-bold text-gray-900 font-khmer">{{ form.store_name_kh || 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់' }}</h4>
                  <div class="text-xs font-bold text-gray-700">{{ form.store_name || 'KIM VANNAK CLOTHING' }}</div>
                  <div class="text-[10px] text-gray-500 leading-snug">{{ form.address || 'Phnom Penh, Cambodia' }} &bull; {{ form.phone || '+855 23 888 999' }}</div>
                </div>
              </div>

              <div class="text-right">
                <div class="text-xs font-extrabold text-gray-900 font-khmer">វិក្កយបត្រលក់</div>
                <div class="text-[9px] font-bold text-gray-500 uppercase tracking-wider">SALES INVOICE</div>
                <div class="text-[10px] font-mono font-bold text-gray-900 mt-1">#INV-2026-001048</div>
              </div>
            </div>

            <!-- Mini A4 Table Placeholder -->
            <div class="border border-gray-200 rounded text-[10px] overflow-hidden">
              <div class="bg-gray-100 font-bold px-2 py-1 flex justify-between border-b border-gray-200">
                <span>ទំនិញ / Description</span>
                <span>សរុប / Total</span>
              </div>
              <div class="p-2 space-y-1">
                <div class="flex justify-between"><span>Denim Jacket (Black / L)</span><span class="font-mono">$59.99</span></div>
                <div class="flex justify-between"><span>Cotton Crewneck (White / M)</span><span class="font-mono">$50.00</span></div>
              </div>
            </div>

            <div class="flex justify-between items-baseline pt-1 border-t border-gray-900 text-xs font-bold">
              <span>សរុបត្រូវបង់ (Total Due):</span>
              <span class="font-mono text-sm">$109.99</span>
            </div>
          </div>
        </div>

        <!-- ── Preview Panel C: Customer Display ────────────────────────────── -->
        <div
          v-else-if="activePreviewTab === 'DISPLAY'"
          class="bg-slate-950 text-white p-4 rounded-xl border border-slate-800 shadow-md space-y-4"
        >
          <!-- Display Top Bar -->
          <div class="h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded bg-slate-800 border border-slate-700 p-0.5 flex items-center justify-center">
                <img v-if="form.logo_dark_url || form.logo_url" :src="form.logo_dark_url || form.logo_url" alt="Display Logo" class="max-w-full max-h-full object-contain" />
                <UIcon v-else name="i-heroicons-shopping-bag" class="w-3.5 h-3.5 text-slate-300" />
              </div>
              <span class="text-xs font-bold font-khmer truncate">{{ form.store_name_kh || form.store_name }}</span>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">Connected</span>
          </div>

          <!-- Display Center Welcome -->
          <div class="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 text-center space-y-2">
            <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 mx-auto p-1.5 flex items-center justify-center shadow-xs">
              <img v-if="form.logo_dark_url || form.logo_url" :src="form.logo_dark_url || form.logo_url" alt="Welcome Logo" class="max-w-full max-h-full object-contain" />
              <UIcon v-else name="i-heroicons-shopping-bag" class="w-6 h-6 text-slate-300" />
            </div>
            <div class="text-sm font-bold font-khmer">សូមស្វាគមន៍! Welcome</div>
            <div class="text-[10.5px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              {{ form.tagline_kh || form.tagline || 'Your order and totals will update automatically.' }}
            </div>
          </div>
        </div>

        <!-- ── Preview Panel D: Admin Sidebar & Login ───────────────────────── -->
        <div
          v-else
          class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4"
        >
          <div class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Sidebar Brand Header Preview</div>
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center p-1 flex-shrink-0">
              <img v-if="form.logo_url" :src="form.logo_url" alt="Logo" class="max-w-full max-h-full object-contain filter invert" />
              <UIcon v-else name="i-heroicons-building-storefront" class="w-4 h-4 text-white" />
            </div>
            <div class="min-w-0">
              <div class="text-xs font-bold text-gray-900 dark:text-white truncate">{{ form.store_name || 'Clothing Store' }}</div>
              <div class="text-[10px] text-gray-500 truncate">{{ form.tagline || 'Administration' }}</div>
            </div>
          </div>

          <div class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 pt-2 border-t border-gray-200 dark:border-gray-800">Login Screen Brand Preview</div>
          <div class="p-4 rounded-lg bg-gray-950 text-white text-center space-y-2">
            <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 mx-auto p-1.5 flex items-center justify-center">
              <img v-if="form.logo_dark_url || form.logo_url" :src="form.logo_dark_url || form.logo_url" alt="Login Logo" class="max-w-full max-h-full object-contain" />
              <UIcon v-else name="i-heroicons-building-storefront" class="w-6 h-6 text-white" />
            </div>
            <div class="text-xs font-bold font-khmer">{{ form.store_name_kh || form.store_name }}</div>
            <div class="text-[10px] text-slate-400">Sign in to POS Terminal</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBrand, type BrandProfile } from '~/composables/useBrand'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Brand & Identity — Clothing Store' })

const toast = useAppToast()
const { brand, isLoaded, loading, loadBrand, saveBrand, uploadLogo } = useBrand()

const saving = ref(false)
const uploadingType = ref<'logo' | 'logo_dark' | 'favicon' | null>(null)

const primaryFileInputRef = ref<HTMLInputElement | null>(null)
const darkFileInputRef = ref<HTMLInputElement | null>(null)
const faviconFileInputRef = ref<HTMLInputElement | null>(null)

const activePreviewTab = ref<'RECEIPT' | 'A4' | 'DISPLAY' | 'SIDEBAR'>('RECEIPT')
const previewTabs = [
  { id: 'RECEIPT', label: 'Thermal Slip (80mm)' },
  { id: 'A4', label: 'A4 Invoice' },
  { id: 'DISPLAY', label: 'Customer Display' },
  { id: 'SIDEBAR', label: 'Sidebar / Login' },
] as const

const form = ref<BrandProfile>({ ...brand.value })

onMounted(async () => {
  await loadBrand()
  form.value = { ...brand.value }
})

async function onFileSelected(event: Event, type: 'logo' | 'logo_dark' | 'favicon') {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadingType.value = type
  try {
    const url = await uploadLogo(file, type)
    if (type === 'logo') form.value.logo_url = url
    else if (type === 'logo_dark') form.value.logo_dark_url = url
    else if (type === 'favicon') form.value.favicon_url = url

    toast.success('Asset uploaded successfully!')
  } catch (err: any) {
    toast.error(err?.message || 'Failed to upload brand image.')
  } finally {
    uploadingType.value = null
    target.value = ''
  }
}

async function handleSave() {
  saving.value = true
  try {
    await saveBrand(form.value)
    toast.success('Brand identity and logo settings saved! Synchronized across all frontends.')
  } catch (err: any) {
    toast.error(err?.message || 'Failed to save brand settings.')
  } finally {
    saving.value = false
  }
}
</script>
