<template>
  <div class="page-root">
    <!-- Header -->
    <PageHeader
      class="no-print"
      :title="sale?.invoice_number ?? '…'"
      description="វិក្កយបត្រលក់ និងបង្កាន់ដៃ &bull; Sale Invoice Detail &amp; Khmer Receipt Printing"
      back-to="/sales"
      back-label="Sales"
    >
      <template v-if="sale" #badge>
        <AppBadge :color="saleStatusColor(sale.sale_status)">{{ sale.sale_status }}</AppBadge>
      </template>
      <template v-if="sale" #actions>
        <AppButton variant="default" size="sm" @click="openPreviewModal('A4')">
          <template #icon-left>
            <UIcon name="i-heroicons-document-text" class="w-3.5 h-3.5" />
          </template>
          <span class="kh-text">មើលវិក្កយបត្រ (Preview Invoice)</span>
        </AppButton>

        <AppButton variant="default" size="sm" @click="printSale('THERMAL')">
          <template #icon-left>
            <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
          </template>
          <span class="kh-text">បោះពុម្ពបង្កាន់ដៃ (Print Receipt)</span>
        </AppButton>

        <AppButton variant="primary" size="sm" @click="printSale('A4')">
          <template #icon-left>
            <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
          </template>
          <span class="kh-text">បោះពុម្ពវិក្កយបត្រ A4 (Print A4 Invoice)</span>
        </AppButton>

        <AppButton
          v-if="sale.sale_status === 'PENDING' || sale.sale_status === 'DRAFT'"
          variant="ghost"
          size="sm"
          @click="handleCancel"
        >
          Cancel Sale
        </AppButton>
      </template>
    </PageHeader>

    <LoadingSkeleton v-if="loading" variant="lines" class="no-print" />

    <template v-else-if="sale">
      <div class="detail-grid no-print">
        <!-- Left: Items + Payments -->
        <div class="detail-col">
          <!-- Line Items -->
          <AppCard title="Items (បរិយាយទំនិញ)">
            <AppTable :columns="itemCols" :rows="sale.items || []" :loading="false" empty-text="No items.">
              <template #cell-product="{ row }">
                <div class="item-cell">
                  <span class="item-name kh-text">{{ row.product_name || 'ទំនិញ' }}</span>
                  <span class="item-sku mono">{{ row.sku || row.variant_id }}</span>
                </div>
              </template>
              <template #cell-variant="{ row }">
                <span class="kh-text">{{ [row.color_name, row.size_name].filter(Boolean).join(' / ') || 'ទូទៅ' }}</span>
              </template>
              <template #cell-unit_price="{ value }">${{ Number(value).toFixed(2) }}</template>
              <template #cell-discount_amount="{ value }">${{ Number(value).toFixed(2) }}</template>
              <template #cell-subtotal="{ value }"><strong>${{ Number(value).toFixed(2) }}</strong></template>
            </AppTable>
          </AppCard>

          <!-- Payments -->
          <AppCard title="Payments (ការទូទាត់)">
            <AppTable :columns="paymentCols" :rows="sale.payments || []" :loading="false" empty-text="No payments recorded.">
              <template #cell-amount="{ value }"><strong>${{ Number(value).toFixed(2) }}</strong></template>
              <template #cell-payment_method="{ value }">
                <AppBadge color="default">{{ formatKhmerPaymentMethod(value) }}</AppBadge>
              </template>
            </AppTable>
          </AppCard>
        </div>

        <!-- Right: Summary -->
        <div class="detail-col">
          <AppCard title="Sale Summary (សង្ខេបវិក្កយបត្រ)">
            <dl class="detail-list">
              <div class="detail-row">
                <dt>លេខវិក្កយបត្រ (Invoice #)</dt>
                <dd><code class="mono">{{ sale.invoice_number }}</code></dd>
              </div>
              <div class="detail-row">
                <dt>សាខា (Branch)</dt>
                <dd class="kh-text">{{ formatKhmerBranchName((sale as any).branch_name) }}</dd>
              </div>
              <div class="detail-row">
                <dt>អតិថិជន (Customer)</dt>
                <dd class="kh-text">{{ formatKhmerCustomerName((sale as any).customer_name) }}</dd>
              </div>
              <div class="detail-row">
                <dt>អ្នកគិតលុយ (Cashier)</dt>
                <dd>{{ (sale as any).cashier_name || 'Front Cashier' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Status</dt>
                <dd><AppBadge :color="saleStatusColor(sale.sale_status)">{{ sale.sale_status }}</AppBadge></dd>
              </div>
              <div class="detail-row">
                <dt>ស្ថានភាពទូទាត់ (Payment)</dt>
                <dd class="kh-text">{{ paymentStatusInfo.khmer }} ({{ sale.payment_status }})</dd>
              </div>
              <div class="detail-row separator" />
              <div class="detail-row">
                <dt>សរុបរង (Subtotal)</dt>
                <dd>${{ Number(sale.subtotal).toFixed(2) }}</dd>
              </div>
              <div class="detail-row">
                <dt>បញ្ចុះតម្លៃ (Discount)</dt>
                <dd>-${{ Number(sale.discount_amount).toFixed(2) }}</dd>
              </div>
              <div class="detail-row">
                <dt>ពន្ធ (Tax)</dt>
                <dd>${{ Number(sale.tax_amount).toFixed(2) }}</dd>
              </div>
              <div class="detail-row total-row">
                <dt>សរុបត្រូវបង់ (Total USD)</dt>
                <dd>${{ Number(sale.total).toFixed(2) }}</dd>
              </div>
              <div class="detail-row">
                <dt>សរុបជាប្រាក់រៀល (KHR)</dt>
                <dd>{{ formatRiel(Number(sale.total)) }}</dd>
              </div>
              <div class="detail-row separator" />
              <div class="detail-row">
                <dt>កាលបរិច្ឆេទ (Date)</dt>
                <dd class="kh-text">{{ formatKhmerInvoiceDate(sale.created_at) }}</dd>
              </div>
            </dl>
          </AppCard>
        </div>
      </div>

      <!-- Interactive Preview Modal (no-print) -->
      <AppModal v-model="showPreviewModal" title="មើលវិក្កយបត្រ & បង្កាន់ដៃ (Preview Khmer Invoice / Receipt)" size="lg">
        <div class="preview-modal-body no-print">
          <div class="preview-toolbar">
            <div class="flex items-center gap-2 flex-wrap">
              <BaseTabs v-model="printMode" :tabs="printModeTabs" variant="pills" />
              <!-- Thermal Width Switcher when in Receipt mode -->
              <div
                v-if="printMode === 'THERMAL'"
                class="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5 text-xs font-semibold"
              >
                <button
                  type="button"
                  class="px-2 py-1 rounded-md transition-colors cursor-pointer"
                  :class="activePaperWidth === '80mm' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
                  @click="activePaperWidth = '80mm'"
                >
                  80mm
                </button>
                <button
                  type="button"
                  class="px-2 py-1 rounded-md transition-colors cursor-pointer"
                  :class="activePaperWidth === '58mm' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
                  @click="activePaperWidth = '58mm'"
                >
                  58mm
                </button>
              </div>
            </div>

            <div class="preview-actions">
              <AppButton variant="default" size="sm" @click="printSale('THERMAL')">
                <template #icon-left>
                  <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
                </template>
                <span class="kh-text">បោះពុម្ពបង្កាន់ដៃ ({{ activePaperWidth }})</span>
              </AppButton>
              <AppButton variant="primary" size="sm" @click="printSale('A4')">
                <template #icon-left>
                  <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
                </template>
                <span class="kh-text">បោះពុម្ពវិក្កយបត្រ A4</span>
              </AppButton>
            </div>
          </div>

          <!-- Preview Canvas -->
          <div class="preview-canvas">
            <!-- Template B Preview: Thermal Receipt (80mm / 58mm) -->
            <div
              v-if="printMode === 'THERMAL'"
              :class="activePaperWidth === '58mm' ? 'w-[248px] is-58mm' : 'w-[336px] is-80mm'"
              class="khmer-print-surface bg-white p-4 rounded-lg border border-gray-200 shadow-xs text-gray-900 transition-all select-none"
            >
              <!-- Double Rule Top Header -->
              <div class="kh-receipt-double-rule py-2 text-center flex flex-col items-center gap-0.5">
                <div class="kh-receipt-store-kh">{{ resolvedStoreNameKh }}</div>
                <div v-if="resolvedStoreName && resolvedStoreName !== resolvedStoreNameKh" class="text-[11px] font-bold tracking-wider text-gray-800 uppercase">{{ resolvedStoreName }}</div>
                <div v-if="receiptTemplate.tagline" class="text-[10px] text-gray-600 font-normal leading-tight">{{ receiptTemplate.tagline }}</div>
                <div class="kh-receipt-branch">{{ formatKhmerBranchName((sale as any).branch_name) }}</div>
                <div v-if="receiptTemplate.address" class="text-[9.5px] text-gray-500 font-normal leading-tight mt-0.5">{{ receiptTemplate.address }}</div>
                <div v-if="receiptTemplate.phone" class="text-[9.5px] text-gray-500 font-mono">Tel: {{ receiptTemplate.phone }}</div>
                <div v-if="receiptTemplate.tax_id" class="text-[9px] text-gray-500 font-mono">VAT TIN: {{ receiptTemplate.tax_id }}</div>
              </div>

              <!-- Receipt Metadata -->
              <div class="py-2.5 flex flex-col gap-1 text-[11px]">
                <div class="flex justify-between gap-2">
                  <span class="text-gray-600">វិក្កយបត្រ:</span>
                  <strong class="font-mono font-bold text-gray-900">{{ sale.invoice_number }}</strong>
                </div>
                <div class="flex justify-between gap-2">
                  <span class="text-gray-600">កាលបរិច្ឆេទ:</span>
                  <span class="font-mono text-gray-900">{{ formatReceiptCompactDate(sale.created_at) }}</span>
                </div>
                <div v-if="receiptTemplate.show_cashier_name !== false" class="flex justify-between gap-2">
                  <span class="text-gray-600">អ្នកគិតលុយ:</span>
                  <span class="text-gray-900 text-right">{{ (sale as any).cashier_name || 'Front Cashier' }}</span>
                </div>
                <div v-if="receiptTemplate.show_customer_info !== false" class="flex justify-between gap-2">
                  <span class="text-gray-600">អតិថិជន:</span>
                  <span class="text-gray-900 text-right">{{ formatKhmerCustomerName((sale as any).customer_name) }}</span>
                </div>
              </div>

              <!-- Line Items (Dashed Rule) -->
              <div class="kh-receipt-dashed-rule py-2.5 flex flex-col gap-2.5">
                <div
                  v-for="(it, idx) in sale.items"
                  :key="it.id || idx"
                  class="flex flex-col gap-0.5"
                >
                  <!-- Line 1: Product Name + (Color / Size) -->
                  <div class="kh-receipt-item-title">
                    <span>{{ (it as any).product_name || 'ទំនិញ' }}</span>
                    <span v-if="receiptTemplate.show_variant_attrs !== false && formatVariantSlash((it as any).color_name, (it as any).size_name)" class="text-gray-700 font-normal">
                      ({{ formatVariantSlash((it as any).color_name, (it as any).size_name) }})
                    </span>
                  </div>
                  <!-- Line 2: Indented Qty x Unit Price on left, Line Total on right -->
                  <div class="flex items-baseline justify-between pl-3 text-[11px] font-mono">
                    <span class="text-gray-600">
                      {{ it.quantity }} x ${{ Number(it.unit_price).toFixed(2) }}
                      <template v-if="Number((it as any).discount_amount) > 0">
                        (&minus;${{ Number((it as any).discount_amount).toFixed(2) }})
                      </template>
                    </span>
                    <strong class="font-bold text-gray-900">${{ Number(it.subtotal).toFixed(2) }}</strong>
                  </div>
                  <!-- Line 3: Optional SKU/Barcode -->
                  <div v-if="receiptTemplate.show_item_sku !== false && (it.sku || (it as any).variant_id)" class="pl-3 text-[9.5px] text-gray-500 font-mono">
                    SKU: {{ it.sku || (it as any).variant_id }}
                  </div>
                </div>
              </div>

              <!-- Subtotal / Discount / Tax -->
              <div class="py-2 flex flex-col gap-1 text-[11px]">
                <div class="flex justify-between">
                  <span class="text-gray-700">សរុបរង:</span>
                  <span class="font-mono font-semibold">${{ Number(sale.subtotal).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">បញ្ចុះតម្លៃ:</span>
                  <span class="font-mono font-semibold">
                    {{ Number(sale.discount_amount) > 0 ? `-$${Number(sale.discount_amount).toFixed(2)}` : '$0.00' }}
                  </span>
                </div>
                <div v-if="receiptTemplate.show_tax_breakdown !== false" class="flex justify-between">
                  <span class="text-gray-700">ពន្ធ:</span>
                  <span class="font-mono font-semibold">${{ Number(sale.tax_amount).toFixed(2) }}</span>
                </div>
              </div>

              <!-- Grand Total inside Double Rule -->
              <div class="kh-receipt-double-rule py-2 flex flex-col gap-1">
                <div class="flex justify-between items-baseline">
                  <span class="text-xs font-bold text-gray-900">សរុបត្រូវបង់:</span>
                  <span class="text-base font-extrabold font-mono text-gray-900">
                    ${{ Number(sale.total).toFixed(2) }}
                  </span>
                </div>
                <div v-if="receiptTemplate.show_khr_conversion !== false" class="flex justify-between items-baseline text-[10.5px] text-gray-600">
                  <span>សរុបជាប្រាក់រៀល (KHR):</span>
                  <span class="font-mono font-semibold text-gray-800">{{ formatRiel(Number(sale.total)) }}</span>
                </div>
              </div>

              <!-- Payment Method & Status -->
              <div class="py-2.5 flex flex-col gap-1 text-[11px]">
                <div class="flex justify-between gap-2">
                  <span class="text-gray-600">វិធីទូទាត់:</span>
                  <span class="font-semibold text-gray-900 text-right">{{ primaryPaymentMethodLabel }}</span>
                </div>
                <div class="flex justify-between gap-2">
                  <span class="text-gray-600">ស្ថានភាព:</span>
                  <strong class="font-bold text-gray-900">{{ paymentStatusInfo.khmer }}</strong>
                </div>
                <div
                  v-if="totalPaidAmount > 0"
                  class="flex justify-between gap-2"
                >
                  <span class="text-gray-600">ប្រាក់បានបង់:</span>
                  <span class="font-mono">${{ totalPaidAmount.toFixed(2) }}</span>
                </div>
                <div v-if="totalPaidAmount > Number(sale.total)" class="flex justify-between gap-2 font-bold text-gray-900">
                  <span>ប្រាក់អាប់:</span>
                  <span class="font-mono">${{ (totalPaidAmount - Number(sale.total)).toFixed(2) }} ({{ formatRiel(totalPaidAmount - Number(sale.total)) }})</span>
                </div>
              </div>

              <!-- Khmer Thank You Footer -->
              <div class="pt-2 border-t border-dashed border-gray-300 text-center flex flex-col items-center gap-1">
                <p class="text-xs font-bold text-gray-900">សូមអរគុណ!</p>
                <p class="text-[11px] font-medium text-gray-700 leading-tight">{{ resolvedFooterNote }}</p>
                <p v-if="receiptTemplate.return_policy" class="text-[9.5px] text-gray-500 mt-0.5 leading-snug">{{ receiptTemplate.return_policy }}</p>
                <p v-if="receiptTemplate.wifi_info" class="text-[9.5px] font-mono text-gray-600 mt-0.5">{{ receiptTemplate.wifi_info }}</p>

                <!-- Real Scannable Vector QR Code -->
                <div v-if="Boolean(receiptTemplate.qr_content)" class="flex flex-col items-center justify-center pt-2.5">
                  <div class="w-[88px] h-[88px] p-1.5 bg-white border border-gray-300 rounded flex items-center justify-center shadow-2xs">
                    <div
                      v-if="qrSvg"
                      class="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                      v-html="qrSvg"
                    />
                    <UIcon v-else name="i-heroicons-qr-code" class="w-12 h-12 text-gray-800" />
                  </div>
                  <span class="text-[9px] text-gray-600 mt-1 font-khmer">ស្កេនមើលវិក្កយបត្រ / Scan QR</span>
                </div>
              </div>
            </div>

            <!-- Template A Preview: Modern Khmer A4 Sales Invoice -->
            <div
              v-else
              class="khmer-print-surface kh-a4-sheet bg-white rounded-lg border border-gray-200 shadow-xs text-gray-900"
            >
              <!-- 1. A4 Header: Brand Identity Left, Invoice Title Right -->
              <div class="kh-a4-header">
                <div class="kh-a4-brand">
                  <div class="kh-a4-logo">
                    <UIcon name="i-heroicons-building-storefront" class="w-6 h-6 text-white" />
                  </div>
                  <div class="kh-a4-brand-text">
                    <h1 class="kh-a4-store-kh">{{ resolvedStoreNameKh }}</h1>
                    <div class="kh-a4-store-en">{{ resolvedStoreName }}</div>
                    <div v-if="receiptTemplate.tagline" class="text-[11px] text-gray-500 font-normal leading-tight mt-0.5">{{ receiptTemplate.tagline }}</div>
                    <div class="kh-a4-store-sub">
                      {{ formatKhmerBranchName((sale as any).branch_name) }} &bull; {{ receiptTemplate.address || 'រាជធានីភ្នំពេញ ប្រទេសកម្ពុជា' }} &bull; ទូរស័ព្ទ: {{ receiptTemplate.phone || '+855 23 888 999' }}<template v-if="receiptTemplate.tax_id"> &bull; VAT TIN: {{ receiptTemplate.tax_id }}</template>
                    </div>
                  </div>
                </div>

                <div class="kh-a4-doc-heading">
                  <div class="kh-a4-doc-kh">វិក្កយបត្រលក់</div>
                  <div class="kh-a4-doc-en">SALES INVOICE</div>
                </div>
              </div>

              <!-- 2. Invoice Information Block -->
              <div class="kh-a4-meta-grid">
                <div class="kh-a4-meta-col">
                  <div class="kh-a4-meta-row">
                    <span class="kh-a4-meta-label">លេខវិក្កយបត្រ (Invoice No):</span>
                    <strong class="kh-a4-meta-value font-mono">{{ sale.invoice_number }}</strong>
                  </div>
                  <div class="kh-a4-meta-row">
                    <span class="kh-a4-meta-label">កាលបរិច្ឆេទ (Date):</span>
                    <span class="kh-a4-meta-value">{{ formatKhmerInvoiceDate(sale.created_at) }}</span>
                  </div>
                  <div class="kh-a4-meta-row">
                    <span class="kh-a4-meta-label">សាខា (Branch):</span>
                    <span class="kh-a4-meta-value">{{ formatKhmerBranchName((sale as any).branch_name) }}</span>
                  </div>
                </div>

                <div class="kh-a4-meta-col">
                  <div v-if="receiptTemplate.show_cashier_name !== false" class="kh-a4-meta-row">
                    <span class="kh-a4-meta-label">អ្នកគិតលុយ (Cashier):</span>
                    <span class="kh-a4-meta-value">{{ (sale as any).cashier_name || 'Front Cashier' }}</span>
                  </div>
                  <div v-if="receiptTemplate.show_customer_info !== false" class="kh-a4-meta-row">
                    <span class="kh-a4-meta-label">អតិថិជន (Customer):</span>
                    <strong class="kh-a4-meta-value">{{ formatKhmerCustomerName((sale as any).customer_name) }}</strong>
                  </div>
                  <div class="kh-a4-meta-row">
                    <span class="kh-a4-meta-label">ស្ថានភាពទូទាត់ (Status):</span>
                    <span class="kh-a4-status-pill">{{ paymentStatusInfo.khmer }} ({{ paymentStatusInfo.english }})</span>
                  </div>
                </div>
              </div>

              <!-- 3. Product Table -->
              <div class="kh-a4-table-wrap">
                <table class="kh-a4-table">
                  <thead>
                    <tr>
                      <th class="col-idx">ល.រ</th>
                      <th class="col-desc">បរិយាយទំនិញ</th>
                      <th v-if="receiptTemplate.show_variant_attrs !== false" class="col-variant">ពណ៌ / ទំហំ</th>
                      <th class="col-qty">ចំនួន</th>
                      <th class="col-price">តម្លៃរាយ</th>
                      <th class="col-total">សរុប</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(it, idx) in sale.items" :key="it.id || idx">
                      <td class="col-idx">{{ toKhmerNumerals(idx + 1) }}</td>
                      <td class="col-desc">
                        <div class="kh-a4-item-name">{{ (it as any).product_name || 'ទំនិញ' }}</div>
                        <div v-if="receiptTemplate.show_item_sku !== false && (it.sku || (it as any).variant_id)" class="kh-a4-item-sku">
                          SKU: {{ it.sku || (it as any).variant_id }}
                        </div>
                      </td>
                      <td v-if="receiptTemplate.show_variant_attrs !== false" class="col-variant">
                        {{ formatVariantSlash((it as any).color_name, (it as any).size_name) || '—' }}
                      </td>
                      <td class="col-qty">{{ toKhmerNumerals(it.quantity) }} ({{ it.quantity }})</td>
                      <td class="col-price font-mono">${{ Number(it.unit_price).toFixed(2) }}</td>
                      <td class="col-total font-mono">${{ Number(it.subtotal).toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 4. Payment Information (Left) & Financial Summary (Right) -->
              <div class="kh-a4-summary-grid">
                <!-- Payment Information -->
                <div class="kh-a4-payment-box">
                  <div class="kh-a4-box-title">ព័ត៌មានទូទាត់ (Payment Information)</div>
                  <div class="kh-a4-pay-row">
                    <span>វិធីទូទាត់:</span>
                    <strong>{{ primaryPaymentMethodLabel }}</strong>
                  </div>
                  <div class="kh-a4-pay-row">
                    <span>ស្ថានភាពទូទាត់:</span>
                    <strong>{{ paymentStatusInfo.khmer }}</strong>
                  </div>
                  <div class="kh-a4-pay-row">
                    <span>ប្រាក់បានបង់:</span>
                    <strong class="font-mono">${{ totalPaidAmount.toFixed(2) }}</strong>
                  </div>
                  <div v-if="totalPaidAmount > Number(sale.total)" class="kh-a4-pay-row">
                    <span>ប្រាក់អាប់ (Change Due):</span>
                    <strong class="font-mono">${{ (totalPaidAmount - Number(sale.total)).toFixed(2) }} ({{ formatRiel(totalPaidAmount - Number(sale.total)) }})</strong>
                  </div>
                  <div
                    v-for="(pay, pIdx) in sale.payments"
                    :key="pIdx"
                    class="kh-a4-pay-sub"
                  >
                    <span v-if="(pay as any).reference_number" class="font-mono text-[11px] text-gray-500">
                      លេខយោង (Ref): #{{ (pay as any).reference_number }}
                    </span>
                  </div>
                </div>

                <!-- Financial Summary -->
                <div class="kh-a4-totals-box">
                  <div class="kh-a4-tot-row">
                    <span>សរុបរង (Subtotal)</span>
                    <span class="font-mono font-semibold">${{ Number(sale.subtotal).toFixed(2) }}</span>
                  </div>
                  <div class="kh-a4-tot-row">
                    <span>បញ្ចុះតម្លៃ (Discount)</span>
                    <span class="font-mono font-semibold">
                      {{ Number(sale.discount_amount) > 0 ? `-$${Number(sale.discount_amount).toFixed(2)}` : '$0.00' }}
                    </span>
                  </div>
                  <div v-if="receiptTemplate.show_tax_breakdown !== false" class="kh-a4-tot-row">
                    <span>ពន្ធ (Tax)</span>
                    <span class="font-mono font-semibold">${{ Number(sale.tax_amount).toFixed(2) }}</span>
                  </div>
                  <div class="kh-a4-tot-grand">
                    <div class="kh-a4-tot-grand-label">
                      <span>សរុបត្រូវបង់ (Total Due)</span>
                    </div>
                    <div class="kh-a4-tot-grand-val font-mono">
                      ${{ Number(sale.total).toFixed(2) }}
                    </div>
                  </div>
                  <div v-if="receiptTemplate.show_khr_conversion !== false" class="kh-a4-tot-khr">
                    <span>សរុបជាប្រាក់រៀល (KHR Equivalent)</span>
                    <strong class="font-mono">{{ formatRiel(Number(sale.total)) }}</strong>
                  </div>
                </div>
              </div>

                              <!-- Digital Invoice Verification QR Code -->
                <div v-if="Boolean(receiptTemplate.qr_content) && qrSvg" class="mt-3 pt-2.5 border-t border-gray-200 flex items-center gap-3">
                  <div class="w-14 h-14 bg-white p-1 border border-gray-300 rounded flex-shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block shadow-2xs" v-html="qrSvg" />
                  <div class="text-[10px] text-gray-600 leading-snug font-khmer">
                    <strong class="text-gray-900 block font-semibold">ស្កេនផ្ទៀងផ្ទាត់វិក្កយបត្រ</strong>
                    <span>Scan to verify digital invoice: {{ sale.invoice_number }}</span>
                  </div>
                </div>
<!-- 5. Khmer Footer -->
              <div class="kh-a4-footer">
                <p class="kh-a4-thank-main">សូមអរគុណដែលបានគាំទ្រហាងរបស់យើង!</p>
                <p class="kh-a4-thank-sub">សូមអញ្ជើញមកទិញម្តងទៀត។</p>
                <p class="kh-a4-policy">
                  {{ receiptTemplate.return_policy || 'ទំនិញអាចប្តូរវិញបានក្នុងរយៈពេល ៧ ថ្ងៃ ដោយភ្ជាប់មកជាមួយវិក្កយបត្រ។' }} &bull; {{ resolvedFooterNote }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppModal>

      <!-- Dedicated Print-Only Output (Template A or Template B) -->
      <div
        id="admin-printable-invoice"
        class="print-only-invoice"
        :class="printMode === 'THERMAL' ? 'is-thermal-invoice' : 'is-a4-invoice'"
      >
        <!-- Template B: Thermal Receipt (80mm / 58mm) -->
        <div
          v-if="printMode === 'THERMAL'"
          id="pos-thermal-receipt"
          :class="activePaperWidth === '58mm' ? 'is-58mm' : 'is-80mm'"
          class="khmer-print-surface bg-white text-gray-900"
        >
          <!-- Double Rule Top Header -->
          <div class="kh-receipt-double-rule py-2 text-center flex flex-col items-center gap-0.5">
            <div class="kh-receipt-store-kh">{{ resolvedStoreNameKh }}</div>
            <div v-if="resolvedStoreName && resolvedStoreName !== resolvedStoreNameKh" class="text-[11px] font-bold tracking-wider text-gray-800 uppercase">{{ resolvedStoreName }}</div>
            <div v-if="receiptTemplate.tagline" class="text-[10px] text-gray-600 font-normal leading-tight">{{ receiptTemplate.tagline }}</div>
            <div class="kh-receipt-branch">{{ formatKhmerBranchName((sale as any).branch_name) }}</div>
            <div v-if="receiptTemplate.address" class="text-[9.5px] text-gray-500 font-normal leading-tight mt-0.5">{{ receiptTemplate.address }}</div>
            <div v-if="receiptTemplate.phone" class="text-[9.5px] text-gray-500 font-mono">Tel: {{ receiptTemplate.phone }}</div>
            <div v-if="receiptTemplate.tax_id" class="text-[9px] text-gray-500 font-mono">VAT TIN: {{ receiptTemplate.tax_id }}</div>
          </div>

          <!-- Receipt Metadata -->
          <div class="py-2.5 flex flex-col gap-1 text-[11px]">
            <div class="flex justify-between gap-2">
              <span class="text-gray-600">វិក្កយបត្រ:</span>
              <strong class="font-mono font-bold text-gray-900">{{ sale.invoice_number }}</strong>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-gray-600">កាលបរិច្ឆេទ:</span>
              <span class="font-mono text-gray-900">{{ formatReceiptCompactDate(sale.created_at) }}</span>
            </div>
            <div v-if="receiptTemplate.show_cashier_name !== false" class="flex justify-between gap-2">
              <span class="text-gray-600">អ្នកគិតលុយ:</span>
              <span class="text-gray-900 text-right">{{ (sale as any).cashier_name || 'Front Cashier' }}</span>
            </div>
            <div v-if="receiptTemplate.show_customer_info !== false" class="flex justify-between gap-2">
              <span class="text-gray-600">អតិថិជន:</span>
              <span class="text-gray-900 text-right">{{ formatKhmerCustomerName((sale as any).customer_name) }}</span>
            </div>
          </div>

          <!-- Line Items (Dashed Rule) -->
          <div class="kh-receipt-dashed-rule py-2.5 flex flex-col gap-2.5">
            <div
              v-for="(it, idx) in sale.items"
              :key="it.id || idx"
              class="flex flex-col gap-0.5"
            >
              <!-- Line 1: Product Name + (Color / Size) -->
              <div class="kh-receipt-item-title">
                <span>{{ (it as any).product_name || 'ទំនិញ' }}</span>
                <span v-if="receiptTemplate.show_variant_attrs !== false && formatVariantSlash((it as any).color_name, (it as any).size_name)" class="text-gray-700 font-normal">
                  ({{ formatVariantSlash((it as any).color_name, (it as any).size_name) }})
                </span>
              </div>
              <!-- Line 2: Indented Qty x Unit Price on left, Line Total on right -->
              <div class="flex items-baseline justify-between pl-3 text-[11px] font-mono">
                <span class="text-gray-600">
                  {{ it.quantity }} x ${{ Number(it.unit_price).toFixed(2) }}
                  <template v-if="Number((it as any).discount_amount) > 0">
                    (&minus;${{ Number((it as any).discount_amount).toFixed(2) }})
                  </template>
                </span>
                <strong class="font-bold text-gray-900">${{ Number(it.subtotal).toFixed(2) }}</strong>
              </div>
              <!-- Line 3: Optional SKU/Barcode -->
              <div v-if="receiptTemplate.show_item_sku !== false && (it.sku || (it as any).variant_id)" class="pl-3 text-[9.5px] text-gray-500 font-mono">
                SKU: {{ it.sku || (it as any).variant_id }}
              </div>
            </div>
          </div>

          <!-- Subtotal / Discount / Tax -->
          <div class="py-2 flex flex-col gap-1 text-[11px]">
            <div class="flex justify-between">
              <span class="text-gray-700">សរុបរង:</span>
              <span class="font-mono font-semibold">${{ Number(sale.subtotal).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-700">បញ្ចុះតម្លៃ:</span>
              <span class="font-mono font-semibold">
                {{ Number(sale.discount_amount) > 0 ? `-$${Number(sale.discount_amount).toFixed(2)}` : '$0.00' }}
              </span>
            </div>
            <div v-if="receiptTemplate.show_tax_breakdown !== false" class="flex justify-between">
              <span class="text-gray-700">ពន្ធ:</span>
              <span class="font-mono font-semibold">${{ Number(sale.tax_amount).toFixed(2) }}</span>
            </div>
          </div>

          <!-- Grand Total inside Double Rule -->
          <div class="kh-receipt-double-rule py-2 flex flex-col gap-1">
            <div class="flex justify-between items-baseline">
              <span class="text-xs font-bold text-gray-900">សរុបត្រូវបង់:</span>
              <span class="text-base font-extrabold font-mono text-gray-900">
                ${{ Number(sale.total).toFixed(2) }}
              </span>
            </div>
            <div v-if="receiptTemplate.show_khr_conversion !== false" class="flex justify-between items-baseline text-[10.5px] text-gray-600">
              <span>សរុបជាប្រាក់រៀល (KHR):</span>
              <span class="font-mono font-semibold text-gray-800">{{ formatRiel(Number(sale.total)) }}</span>
            </div>
          </div>

          <!-- Payment Method & Status -->
          <div class="py-2.5 flex flex-col gap-1 text-[11px]">
            <div class="flex justify-between gap-2">
              <span class="text-gray-600">វិធីទូទាត់:</span>
              <span class="font-semibold text-gray-900 text-right">{{ primaryPaymentMethodLabel }}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-gray-600">ស្ថានភាព:</span>
              <strong class="font-bold text-gray-900">{{ paymentStatusInfo.khmer }}</strong>
            </div>
            <div
              v-if="totalPaidAmount > 0"
              class="flex justify-between gap-2"
            >
              <span class="text-gray-600">ប្រាក់បានបង់:</span>
              <span class="font-mono">${{ totalPaidAmount.toFixed(2) }}</span>
            </div>
            <div v-if="totalPaidAmount > Number(sale.total)" class="flex justify-between gap-2 font-bold text-gray-900">
              <span>ប្រាក់អាប់:</span>
              <span class="font-mono">${{ (totalPaidAmount - Number(sale.total)).toFixed(2) }} ({{ formatRiel(totalPaidAmount - Number(sale.total)) }})</span>
            </div>
          </div>

          <!-- Khmer Thank You Footer -->
          <div class="pt-2 border-t border-dashed border-gray-300 text-center flex flex-col items-center gap-1">
            <p class="text-xs font-bold text-gray-900">សូមអរគុណ!</p>
            <p class="text-[11px] font-medium text-gray-700 leading-tight">{{ resolvedFooterNote }}</p>
            <p v-if="receiptTemplate.return_policy" class="text-[9.5px] text-gray-500 mt-0.5 leading-snug">{{ receiptTemplate.return_policy }}</p>
            <p v-if="receiptTemplate.wifi_info" class="text-[9.5px] font-mono text-gray-600 mt-0.5">{{ receiptTemplate.wifi_info }}</p>

            <!-- Real Scannable Vector QR Code -->
                <div v-if="Boolean(receiptTemplate.qr_content)" class="flex flex-col items-center justify-center pt-2.5">
                  <div class="w-[88px] h-[88px] p-1.5 bg-white border border-gray-300 rounded flex items-center justify-center shadow-2xs">
                    <div
                      v-if="qrSvg"
                      class="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                      v-html="qrSvg"
                    />
                    <UIcon v-else name="i-heroicons-qr-code" class="w-12 h-12 text-gray-800" />
                  </div>
                  <span class="text-[9px] text-gray-600 mt-1 font-khmer">ស្កេនមើលវិក្កយបត្រ / Scan QR</span>
                </div>
          </div>
        </div>

        <!-- Template A: Modern Khmer A4 Invoice -->
        <div
          v-else
          id="pos-a4-invoice"
          class="khmer-print-surface kh-a4-sheet bg-white text-gray-900"
        >
          <!-- 1. A4 Header: Brand Identity Left, Invoice Title Right -->
          <div class="kh-a4-header">
            <div class="kh-a4-brand">
              <div class="kh-a4-logo">
                <UIcon name="i-heroicons-building-storefront" class="w-6 h-6 text-white" />
              </div>
              <div class="kh-a4-brand-text">
                <h1 class="kh-a4-store-kh">{{ resolvedStoreNameKh }}</h1>
                <div class="kh-a4-store-en">{{ resolvedStoreName }}</div>
                <div v-if="receiptTemplate.tagline" class="text-[11px] text-gray-500 font-normal leading-tight mt-0.5">{{ receiptTemplate.tagline }}</div>
                <div class="kh-a4-store-sub">
                  {{ formatKhmerBranchName((sale as any).branch_name) }} &bull; {{ receiptTemplate.address || 'រាជធានីភ្នំពេញ ប្រទេសកម្ពុជា' }} &bull; ទូរស័ព្ទ: {{ receiptTemplate.phone || '+855 23 888 999' }}<template v-if="receiptTemplate.tax_id"> &bull; VAT TIN: {{ receiptTemplate.tax_id }}</template>
                </div>
              </div>
            </div>

            <div class="kh-a4-doc-heading">
              <div class="kh-a4-doc-kh">វិក្កយបត្រលក់</div>
              <div class="kh-a4-doc-en">SALES INVOICE</div>
            </div>
          </div>

          <!-- 2. Invoice Information Block -->
          <div class="kh-a4-meta-grid">
            <div class="kh-a4-meta-col">
              <div class="kh-a4-meta-row">
                <span class="kh-a4-meta-label">លេខវិក្កយបត្រ (Invoice No):</span>
                <strong class="kh-a4-meta-value font-mono">{{ sale.invoice_number }}</strong>
              </div>
              <div class="kh-a4-meta-row">
                <span class="kh-a4-meta-label">កាលបរិច្ឆេទ (Date):</span>
                <span class="kh-a4-meta-value">{{ formatKhmerInvoiceDate(sale.created_at) }}</span>
              </div>
              <div class="kh-a4-meta-row">
                <span class="kh-a4-meta-label">សាខា (Branch):</span>
                <span class="kh-a4-meta-value">{{ formatKhmerBranchName((sale as any).branch_name) }}</span>
              </div>
            </div>

            <div class="kh-a4-meta-col">
              <div v-if="receiptTemplate.show_cashier_name !== false" class="kh-a4-meta-row">
                <span class="kh-a4-meta-label">អ្នកគិតលុយ (Cashier):</span>
                <span class="kh-a4-meta-value">{{ (sale as any).cashier_name || 'Front Cashier' }}</span>
              </div>
              <div v-if="receiptTemplate.show_customer_info !== false" class="kh-a4-meta-row">
                <span class="kh-a4-meta-label">អតិថិជន (Customer):</span>
                <strong class="kh-a4-meta-value">{{ formatKhmerCustomerName((sale as any).customer_name) }}</strong>
              </div>
              <div class="kh-a4-meta-row">
                <span class="kh-a4-meta-label">ស្ថានភាពទូទាត់ (Status):</span>
                <span class="kh-a4-status-pill">{{ paymentStatusInfo.khmer }} ({{ paymentStatusInfo.english }})</span>
              </div>
            </div>
          </div>

          <!-- 3. Product Table -->
          <div class="kh-a4-table-wrap">
            <table class="kh-a4-table">
              <thead>
                <tr>
                  <th class="col-idx">ល.រ</th>
                  <th class="col-desc">បរិយាយទំនិញ</th>
                  <th v-if="receiptTemplate.show_variant_attrs !== false" class="col-variant">ពណ៌ / ទំហំ</th>
                  <th class="col-qty">ចំនួន</th>
                  <th class="col-price">តម្លៃរាយ</th>
                  <th class="col-total">សរុប</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, idx) in sale.items" :key="it.id || idx">
                  <td class="col-idx">{{ toKhmerNumerals(idx + 1) }}</td>
                  <td class="col-desc">
                    <div class="kh-a4-item-name">{{ (it as any).product_name || 'ទំនិញ' }}</div>
                    <div v-if="receiptTemplate.show_item_sku !== false && (it.sku || (it as any).variant_id)" class="kh-a4-item-sku">
                      SKU: {{ it.sku || (it as any).variant_id }}
                    </div>
                  </td>
                  <td v-if="receiptTemplate.show_variant_attrs !== false" class="col-variant">
                    {{ formatVariantSlash((it as any).color_name, (it as any).size_name) || '—' }}
                  </td>
                  <td class="col-qty">{{ toKhmerNumerals(it.quantity) }} ({{ it.quantity }})</td>
                  <td class="col-price font-mono">${{ Number(it.unit_price).toFixed(2) }}</td>
                  <td class="col-total font-mono">${{ Number(it.subtotal).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 4. Payment Information (Left) & Financial Summary (Right) -->
          <div class="kh-a4-summary-grid">
            <!-- Payment Information -->
            <div class="kh-a4-payment-box">
              <div class="kh-a4-box-title">ព័ត៌មានទូទាត់ (Payment Information)</div>
              <div class="kh-a4-pay-row">
                <span>វិធីទូទាត់:</span>
                <strong>{{ primaryPaymentMethodLabel }}</strong>
              </div>
              <div class="kh-a4-pay-row">
                <span>ស្ថានភាពទូទាត់:</span>
                <strong>{{ paymentStatusInfo.khmer }}</strong>
              </div>
              <div class="kh-a4-pay-row">
                <span>ប្រាក់បានបង់:</span>
                <strong class="font-mono">${{ totalPaidAmount.toFixed(2) }}</strong>
              </div>
              <div v-if="totalPaidAmount > Number(sale.total)" class="kh-a4-pay-row">
                <span>ប្រាក់អាប់ (Change Due):</span>
                <strong class="font-mono">${{ (totalPaidAmount - Number(sale.total)).toFixed(2) }} ({{ formatRiel(totalPaidAmount - Number(sale.total)) }})</strong>
              </div>
              <div
                v-for="(pay, pIdx) in sale.payments"
                :key="pIdx"
                class="kh-a4-pay-sub"
              >
                <span v-if="(pay as any).reference_number" class="font-mono text-[11px] text-gray-500">
                  លេខយោង (Ref): #{{ (pay as any).reference_number }}
                </span>
              </div>
            </div>

            <!-- Financial Summary -->
            <div class="kh-a4-totals-box">
              <div class="kh-a4-tot-row">
                <span>សរុបរង (Subtotal)</span>
                <span class="font-mono font-semibold">${{ Number(sale.subtotal).toFixed(2) }}</span>
              </div>
              <div class="kh-a4-tot-row">
                <span>បញ្ចុះតម្លៃ (Discount)</span>
                <span class="font-mono font-semibold">
                  {{ Number(sale.discount_amount) > 0 ? `-$${Number(sale.discount_amount).toFixed(2)}` : '$0.00' }}
                </span>
              </div>
              <div v-if="receiptTemplate.show_tax_breakdown !== false" class="kh-a4-tot-row">
                <span>ពន្ធ (Tax)</span>
                <span class="font-mono font-semibold">${{ Number(sale.tax_amount).toFixed(2) }}</span>
              </div>
              <div class="kh-a4-tot-grand">
                <div class="kh-a4-tot-grand-label">
                  <span>សរុបត្រូវបង់ (Total Due)</span>
                </div>
                <div class="kh-a4-tot-grand-val font-mono">
                  ${{ Number(sale.total).toFixed(2) }}
                </div>
              </div>
              <div v-if="receiptTemplate.show_khr_conversion !== false" class="kh-a4-tot-khr">
                <span>សរុបជាប្រាក់រៀល (KHR Equivalent)</span>
                <strong class="font-mono">{{ formatRiel(Number(sale.total)) }}</strong>
              </div>
            </div>
          </div>

                          <!-- Digital Invoice Verification QR Code -->
                <div v-if="Boolean(receiptTemplate.qr_content) && qrSvg" class="mt-3 pt-2.5 border-t border-gray-200 flex items-center gap-3">
                  <div class="w-14 h-14 bg-white p-1 border border-gray-300 rounded flex-shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block shadow-2xs" v-html="qrSvg" />
                  <div class="text-[10px] text-gray-600 leading-snug font-khmer">
                    <strong class="text-gray-900 block font-semibold">ស្កេនផ្ទៀងផ្ទាត់វិក្កយបត្រ</strong>
                    <span>Scan to verify digital invoice: {{ sale.invoice_number }}</span>
                  </div>
                </div>
<!-- 5. Khmer Footer -->
          <div class="kh-a4-footer">
            <p class="kh-a4-thank-main">សូមអរគុណដែលបានគាំទ្រហាងរបស់យើង!</p>
            <p class="kh-a4-thank-sub">សូមអញ្ជើញមកទិញម្តងទៀត។</p>
            <p class="kh-a4-policy">
              {{ receiptTemplate.return_policy || 'ទំនិញអាចប្តូរវិញបានក្នុងរយៈពេល ៧ ថ្ងៃ ដោយភ្ជាប់មកជាមួយវិក្កយបត្រ។' }} &bull; {{ resolvedFooterNote }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="state-card no-print">Sale not found.</div>

    <!-- Cancel Sale Confirm Dialog -->
    <AppConfirmDialog
      v-model="showCancelConfirm"
      title="Cancel Sale"
      :description="`Are you sure you want to cancel invoice ${sale?.invoice_number || id}?`"
      consequence="This action will void the pending sale record and cannot be undone."
      confirm-label="Cancel Sale"
      variant="danger"
      :loading="cancelling"
      @confirm="confirmCancelSale"
    />
  </div>
</template>

<script setup lang="ts">
import type { Sale } from '~/types'
import { renderSVG } from 'uqr'
import {
  toKhmerNumerals,
  formatKhmerInvoiceDate,
  formatReceiptCompactDate,
  formatKhmerPaymentStatus,
  formatKhmerPaymentMethod,
  formatKhmerCustomerName,
  formatKhmerBranchName,
  printWithKhmerFonts,
  KHMER_STORE_NAME,
  ENGLISH_STORE_NAME,
} from '~/composables/useKhmerPrint'
import { useReceiptTemplate } from '~/composables/useReceiptTemplate'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Sale Detail — Clothing Store' })

const { getSale, cancelSale } = useSaleApi()
const { addToast } = useAppToast()
const { template: receiptTemplate, loadTemplate } = useReceiptTemplate()

const sale = ref<Sale | null>(null)
const loading = ref(true)
const printMode = ref<'THERMAL' | 'A4'>('A4')
const activePaperWidth = ref<'80mm' | '58mm'>('80mm')


const qrContent = computed(() => {
  if (receiptTemplate.value?.qr_content && typeof receiptTemplate.value.qr_content === 'string') {
    return receiptTemplate.value.qr_content.trim()
  }
  if (sale.value?.invoice_number) {
    return `https://kimvannak.store/verify-invoice?id=${encodeURIComponent(sale.value.invoice_number)}`
  }
  return 'https://kimvannak.store'
})

const qrSvg = computed(() => {
  if (!qrContent.value) return ''
  try {
    return renderSVG(qrContent.value, { ecc: 'M', border: 1 })
  } catch {
    return ''
  }
})

const printModeTabs = [
  { key: 'A4', label: 'វិក្កយបត្រ A4 (Sales Invoice)' },
  { key: 'THERMAL', label: 'បង្កាន់ដៃ (Thermal Receipt)' },
]
const showPreviewModal = ref(false)
const showCancelConfirm = ref(false)
const cancelling = ref(false)

const itemCols = [
  { key: 'product', label: 'បរិយាយទំនិញ / Product' },
  { key: 'variant', label: 'ពណ៌ / ទំហំ' },
  { key: 'quantity', label: 'ចំនួន' },
  { key: 'unit_price', label: 'តម្លៃរាយ' },
  { key: 'discount_amount', label: 'បញ្ចុះតម្លៃ' },
  { key: 'subtotal', label: 'សរុប' },
]

const paymentCols = [
  { key: 'payment_method', label: 'វិធីទូទាត់ (Method)' },
  { key: 'amount', label: 'ប្រាក់បានបង់ (Amount)' },
  { key: 'reference_number', label: 'Reference' },
]

const resolvedStoreName = computed(
  () => receiptTemplate.value?.store_name?.trim() || ENGLISH_STORE_NAME,
)

const resolvedStoreNameKh = computed(
  () => receiptTemplate.value?.store_name_kh?.trim() || KHMER_STORE_NAME,
)

const resolvedFooterNote = computed(
  () => receiptTemplate.value?.footer_message?.trim() || 'សូមអរគុណដែលបានគាំទ្រហាងរបស់យើង! សូមអញ្ជើញមកទិញម្តងទៀត។',
)

const paymentStatusInfo = computed(() =>
  formatKhmerPaymentStatus(sale.value?.payment_status, sale.value?.sale_status),
)

const primaryPaymentMethodLabel = computed(() => {
  const payments = sale.value?.payments || []
  if (payments.length === 0) return formatKhmerPaymentMethod('CASH')
  if (payments.length === 1) return formatKhmerPaymentMethod(payments[0]?.payment_method)
  return payments.map((p) => formatKhmerPaymentMethod(p.payment_method)).join(' + ')
})

const totalPaidAmount = computed(() => {
  const payments = sale.value?.payments || []
  if (payments.length > 0) {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }
  return paymentStatusInfo.value.isPaid ? Number(sale.value?.total) || 0 : 0
})

function formatVariantSlash(color?: string | null, size?: string | null): string {
  return [color, size].filter(Boolean).join(' / ') || ''
}

function formatRiel(usd: number): string {
  return `${Math.round(usd * 4100).toLocaleString()} ៛`
}

function saleStatusColor(s: string) {
  const map: Record<string, string> = {
    COMPLETED: 'green', CANCELLED: 'red', PENDING: 'yellow', HELD: 'default',
  }
  return map[s] ?? 'default'
}

function openPreviewModal(mode: 'THERMAL' | 'A4') {
  printMode.value = mode
  showPreviewModal.value = true
}

async function printSale(mode: 'THERMAL' | 'A4') {
  printMode.value = mode
  await nextTick()
  await printWithKhmerFonts()
}

function handleCancel() {
  showCancelConfirm.value = true
}

async function confirmCancelSale() {
  cancelling.value = true
  try {
    await cancelSale(id)
    showCancelConfirm.value = false
    addToast({ type: 'success', title: 'Sale cancelled' })
    sale.value = await getSale(id) as Sale
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    cancelling.value = false
  }
}

watch(
  () => receiptTemplate.value?.paper_width,
  (w) => {
    if (w) activePaperWidth.value = w
  },
  { immediate: true },
)

onMounted(async () => {
  loadTemplate()
  try {
    sale.value = await getSale(id) as Sale
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.kh-text {
  font-family: 'Kantumruy Pro', 'Battambang', 'Battambang Local', 'Noto Sans Khmer', sans-serif;
}

.page-root { display: flex; flex-direction: column; gap: 16px; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-header__left { display: flex; flex-direction: column; gap: 2px; }
.page-header__actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.back-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--text-tertiary); text-decoration: none; margin-bottom: 4px;
}
.back-link:hover { color: var(--text-primary); }
.page-title { font-size: 16px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
.page-subtitle { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }

.state-card {
  display: flex; align-items: center; justify-content: center;
  padding: 48px; background: var(--surface-card); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg); color: var(--text-tertiary); font-size: 13px;
}

.detail-grid { display: grid; grid-template-columns: 1fr 340px; gap: 16px; align-items: start; }
@media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
.detail-col { display: flex; flex-direction: column; gap: 16px; }

.item-cell { display: flex; flex-direction: column; gap: 2px; }
.item-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.item-sku { font-size: 11px; color: var(--text-tertiary); }

.detail-list { display: flex; flex-direction: column; }
.detail-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid var(--border-subtle); font-size: 13px;
}
.detail-row:last-child { border-bottom: none; }
.detail-row.separator { border-bottom: 2px solid var(--border-subtle); padding: 0; height: 0; }
.detail-row dt { color: var(--text-tertiary); font-family: 'Kantumruy Pro', 'Battambang', 'Battambang Local', sans-serif; }
.detail-row dd { color: var(--text-primary); font-weight: 500; }
.total-row dt, .total-row dd { font-weight: 700; font-size: 14px; }
.mono { font-family: monospace; font-size: 12px; }

.preview-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}
.preview-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.preview-canvas {
  background: #f1f5f9;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 20px;
  max-height: 68vh;
  overflow-y: auto;
  overflow-x: auto;
  display: flex;
  justify-content: center;
}
@media (max-width: 820px) {
  .preview-canvas {
    padding: 12px;
    justify-content: flex-start;
  }
}

.print-only-invoice { display: none; }
</style>

<style>
/* Shared Unified Khmer Receipt & A4 Invoice Styles */
.khmer-ui,
.khmer-print-surface {
  font-family: var(--font-khmer, 'Kantumruy Pro', 'Battambang', 'Noto Sans Khmer', 'Battambang Local', 'Inter', sans-serif);
  line-height: 1.6;
  font-feature-settings: 'liga' 1, 'calt' 1, 'clig' 1, 'kern' 1;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.khmer-ui,
.khmer-print-surface,
.font-khmer,
.kh-receipt-store-kh,
.kh-a4-store-kh,
.kh-receipt-branch,
.kh-receipt-item-title {
  letter-spacing: normal !important;
}

.kh-receipt-store-kh {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  line-height: 1.65;
}

.kh-receipt-branch {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  line-height: 1.5;
}

.kh-receipt-double-rule {
  border-top: 3px double #111827;
  border-bottom: 3px double #111827;
}

.kh-receipt-dashed-rule {
  border-top: 1px dashed #9ca3af;
  border-bottom: 1px dashed #9ca3af;
}

.kh-receipt-item-title {
  font-size: 11.5px;
  font-weight: 600;
  color: #111827;
  line-height: 1.65;
  word-break: break-word;
}

/* Template A: A4 Styles */
.kh-a4-sheet {
  width: 100%;
  max-width: 210mm;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kh-a4-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #111827;
}

.kh-a4-brand {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.kh-a4-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kh-a4-store-kh {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  line-height: 1.5;
  margin: 0;
}

.kh-a4-store-en {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #374151;
  text-transform: uppercase;
}

.kh-a4-store-sub {
  font-size: 11.5px;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.5;
}

.kh-a4-doc-heading {
  text-align: right;
  flex-shrink: 0;
}

.kh-a4-doc-kh {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  line-height: 1.45;
}

.kh-a4-doc-en {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #4b5563;
}

.kh-a4-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.kh-a4-meta-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kh-a4-meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 12.5px;
  line-height: 1.6;
}

.kh-a4-meta-label {
  color: #4b5563;
}

.kh-a4-meta-value {
  color: #111827;
  text-align: right;
}

.kh-a4-status-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  font-size: 11.5px;
  font-weight: 700;
  color: #111827;
}

.kh-a4-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.kh-a4-table thead tr {
  border-bottom: 2px solid #111827;
  background: #f9fafb;
}

.kh-a4-table th {
  padding: 9px 10px;
  font-weight: 700;
  color: #111827;
  line-height: 1.6;
}

.kh-a4-table td {
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
  line-height: 1.6;
}

.kh-a4-table .col-idx { width: 44px; text-align: center; }
.kh-a4-table .col-desc { text-align: left; }
.kh-a4-table .col-variant { width: 130px; text-align: left; }
.kh-a4-table .col-qty { width: 80px; text-align: right; }
.kh-a4-table .col-price { width: 100px; text-align: right; }
.kh-a4-table .col-total { width: 110px; text-align: right; font-weight: 700; }

.kh-a4-item-name {
  font-weight: 600;
  color: #111827;
}

.kh-a4-item-sku {
  font-size: 11px;
  font-family: monospace;
  color: #6b7280;
}

.kh-a4-summary-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}

.kh-a4-payment-box {
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
}

.kh-a4-box-title {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 4px;
  margin-bottom: 2px;
}

.kh-a4-pay-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.kh-a4-totals-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.kh-a4-tot-row {
  display: flex;
  justify-content: space-between;
  color: #374151;
}

.kh-a4-tot-grand {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 10px;
  border-top: 2px solid #111827;
}

.kh-a4-tot-grand-label {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.kh-a4-tot-grand-val {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
}

.kh-a4-tot-khr {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #4b5563;
  padding-top: 2px;
}

.kh-a4-footer {
  padding-top: 14px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kh-a4-thank-main {
  font-size: 13.5px;
  font-weight: 700;
  color: #111827;
}

.kh-a4-thank-sub {
  font-size: 12.5px;
  font-weight: 500;
  color: #374151;
}

.kh-a4-policy {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

@media print {
  @page {
    margin: 0;
  }

  html,
  body {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    background: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .no-print,
  .modal-backdrop {
    display: none !important;
  }

  #admin-printable-invoice.print-only-invoice {
    display: block !important;
    background: #ffffff !important;
  }

  #admin-printable-invoice #pos-thermal-receipt {
    position: static !important;
    margin: 0 !important;
    padding: 2mm 3mm !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    color: #000000 !important;
    background: #ffffff !important;
  }

  #admin-printable-invoice #pos-thermal-receipt.is-80mm {
    width: 78mm !important;
  }

  #admin-printable-invoice #pos-thermal-receipt.is-58mm {
    width: 54mm !important;
    font-size: 10px !important;
    padding: 1.5mm 2mm !important;
  }

  #admin-printable-invoice #pos-a4-invoice {
    width: 190mm !important;
    max-width: 190mm !important;
    margin: 10mm auto !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: #ffffff !important;
  }
}
</style>