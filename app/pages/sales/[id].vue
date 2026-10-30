<template>
  <div class="page-root">
    <!-- Header -->
    <div class="page-header no-print">
      <div class="page-header__left">
        <NuxtLink to="/sales" class="back-link">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Sales
        </NuxtLink>
        <h2 class="page-title">{{ sale?.invoice_number ?? '…' }}</h2>
        <p class="page-subtitle kh-text">វិក្កយបត្រលក់ និងបង្កាន់ដៃ &bull; Sale Invoice Detail &amp; Khmer Receipt Printing</p>
      </div>
      <div v-if="sale" class="page-header__actions">
        <AppBadge :color="saleStatusColor(sale.sale_status)">{{ sale.sale_status }}</AppBadge>

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
      </div>
    </div>

    <div v-if="loading" class="state-card no-print">Loading…</div>

    <template v-else-if="sale">
      <div class="detail-grid no-print">
        <!-- Left: Items + Payments -->
        <div class="detail-col">
          <!-- Line Items -->
          <AppCard title="Items (បរិយាយទំនិញ)">
            <AppTable :columns="itemCols" :rows="sale.items" :loading="false" empty-text="No items.">
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
            <AppTable :columns="paymentCols" :rows="sale.payments" :loading="false" empty-text="No payments recorded.">
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
            <div class="mode-tabs">
              <button
                type="button"
                class="mode-tab kh-text"
                :class="{ active: printMode === 'A4' }"
                @click="printMode = 'A4'"
              >
                វិក្កយបត្រ A4 (Sales Invoice)
              </button>
              <button
                type="button"
                class="mode-tab kh-text"
                :class="{ active: printMode === 'THERMAL' }"
                @click="printMode = 'THERMAL'"
              >
                បង្កាន់ដៃ 80mm (Thermal Receipt)
              </button>
            </div>
            <div class="preview-actions">
              <AppButton variant="default" size="sm" @click="printSale('THERMAL')">
                <template #icon-left>
                  <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
                </template>
                <span class="kh-text">បោះពុម្ពបង្កាន់ដៃ (80mm)</span>
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
            <!-- Template B Preview: 80mm Receipt -->
            <div v-if="printMode === 'THERMAL'" class="kh-receipt-80mm">
              <div class="kh-receipt-80mm__header">
                <div class="kh-receipt-80mm__title-kh">ហាងលក់សម្លៀកបំពាក់ ភ្នំពេញ</div>
                <div class="kh-receipt-80mm__title-en">CLOTHING STORE PHNOM PENH</div>
                <div class="kh-receipt-80mm__meta-center">
                  សាខា: {{ formatKhmerBranchName((sale as any).branch_name) }}
                </div>
                <div class="kh-receipt-80mm__meta-center">
                  ទូរស័ព្ទ: 012 345 678
                </div>
              </div>

              <div class="kh-receipt-80mm__divider-double"></div>

              <div class="kh-receipt-80mm__info">
                <div class="kh-receipt-80mm__info-row">
                  <span>លេខវិក្កយបត្រ:</span>
                  <span class="font-mono font-bold">{{ sale.invoice_number }}</span>
                </div>
                <div class="kh-receipt-80mm__info-row">
                  <span>ថ្ងៃទី:</span>
                  <span class="font-mono">{{ formatReceiptCompactDate(sale.created_at) }}</span>
                </div>
                <div class="kh-receipt-80mm__info-row">
                  <span>អ្នកគិតលុយ:</span>
                  <span>{{ (sale as any).cashier_name || 'Front Cashier' }}</span>
                </div>
                <div class="kh-receipt-80mm__info-row">
                  <span>អតិថិជន:</span>
                  <span>{{ formatKhmerCustomerName((sale as any).customer_name) }}</span>
                </div>
              </div>

              <div class="kh-receipt-80mm__divider-dashed"></div>

              <div class="kh-receipt-80mm__items">
                <div
                  v-for="(it, idx) in sale.items"
                  :key="it.id || idx"
                  class="kh-receipt-80mm__item"
                >
                  <div class="kh-receipt-80mm__item-title">
                    {{ (it as any).product_name || 'ទំនិញ' }}
                    <span v-if="(it as any).color_name || (it as any).size_name" class="kh-receipt-80mm__item-variant">
                      ({{ [(it as any).color_name, (it as any).size_name].filter(Boolean).join(' / ') }})
                    </span>
                  </div>
                  <div class="kh-receipt-80mm__item-calc">
                    <span class="font-mono">
                      {{ it.quantity }} x ${{ Number(it.unit_price).toFixed(2) }}
                    </span>
                    <span class="font-mono font-bold">
                      ${{ Number(it.subtotal).toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="kh-receipt-80mm__divider-dashed"></div>

              <div class="kh-receipt-80mm__totals">
                <div class="kh-receipt-80mm__row">
                  <span>សរុបរង</span>
                  <span class="font-mono">${{ Number(sale.subtotal).toFixed(2) }}</span>
                </div>
                <div class="kh-receipt-80mm__row">
                  <span>បញ្ចុះតម្លៃ</span>
                  <span class="font-mono">${{ Number(sale.discount_amount).toFixed(2) }}</span>
                </div>
                <div v-if="Number(sale.tax_amount) > 0" class="kh-receipt-80mm__row">
                  <span>ពន្ធ (Tax)</span>
                  <span class="font-mono">${{ Number(sale.tax_amount).toFixed(2) }}</span>
                </div>
                <div class="kh-receipt-80mm__row kh-receipt-80mm__grand">
                  <span>សរុបត្រូវបង់</span>
                  <span class="font-mono">${{ Number(sale.total).toFixed(2) }}</span>
                </div>
                <div class="kh-receipt-80mm__row kh-receipt-80mm__khr">
                  <span>សរុបជាប្រាក់រៀល</span>
                  <span class="font-mono">{{ formatRiel(Number(sale.total)) }}</span>
                </div>
              </div>

              <div class="kh-receipt-80mm__divider-dashed"></div>

              <div class="kh-receipt-80mm__payment">
                <div class="kh-receipt-80mm__row">
                  <span>ការទូទាត់:</span>
                  <span class="font-semibold">{{ primaryPaymentMethodLabel }}</span>
                </div>
                <div class="kh-receipt-80mm__row">
                  <span>ស្ថានភាព:</span>
                  <span class="font-bold">{{ paymentStatusInfo.khmer }}</span>
                </div>
              </div>

              <div class="kh-receipt-80mm__divider-double"></div>

              <div class="kh-receipt-80mm__footer">
                <p class="kh-receipt-80mm__thank">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត</p>
                <p class="kh-receipt-80mm__policy">ទំនិញអាចប្តូរបានក្នុងរយៈពេល ៧ ថ្ងៃ ដោយភ្ជាប់មកជាមួយវិក្កយបត្រ។</p>
              </div>
            </div>

            <!-- Template A Preview: Modern Khmer A4 Invoice -->
            <div v-else class="kh-invoice-a4">
              <div class="kh-invoice-a4__header">
                <div class="kh-invoice-a4__brand-group">
                  <div class="kh-invoice-a4__logo">CS</div>
                  <div>
                    <h1 class="kh-invoice-a4__store-kh">ហាងលក់សម្លៀកបំពាក់ ភ្នំពេញ</h1>
                    <div class="kh-invoice-a4__store-en">CLOTHING STORE PHNOM PENH</div>
                    <div class="kh-invoice-a4__branch">
                      សាខា: {{ formatKhmerBranchName((sale as any).branch_name) }} &bull; ភ្នំពេញ, កម្ពុជា &bull; ទូរស័ព្ទ: 012 345 678
                    </div>
                  </div>
                </div>
                <div class="kh-invoice-a4__doc-heading">
                  <div class="kh-invoice-a4__title-kh">វិក្កយបត្រលក់</div>
                  <div class="kh-invoice-a4__title-en">SALES INVOICE</div>
                </div>
              </div>

              <div class="kh-invoice-a4__meta-grid">
                <div class="kh-invoice-a4__meta-col">
                  <div class="kh-invoice-a4__meta-line">
                    <span class="kh-invoice-a4__meta-label">លេខវិក្កយបត្រ:</span>
                    <span class="kh-invoice-a4__meta-val font-mono font-bold">{{ sale.invoice_number }}</span>
                  </div>
                  <div class="kh-invoice-a4__meta-line">
                    <span class="kh-invoice-a4__meta-label">កាលបរិច្ឆេទ:</span>
                    <span class="kh-invoice-a4__meta-val">{{ formatKhmerInvoiceDate(sale.created_at) }}</span>
                  </div>
                  <div class="kh-invoice-a4__meta-line">
                    <span class="kh-invoice-a4__meta-label">សាខា:</span>
                    <span class="kh-invoice-a4__meta-val">{{ formatKhmerBranchName((sale as any).branch_name) }}</span>
                  </div>
                </div>
                <div class="kh-invoice-a4__meta-col">
                  <div class="kh-invoice-a4__meta-line">
                    <span class="kh-invoice-a4__meta-label">អ្នកគិតលុយ:</span>
                    <span class="kh-invoice-a4__meta-val">{{ (sale as any).cashier_name || 'Front Cashier' }}</span>
                  </div>
                  <div class="kh-invoice-a4__meta-line">
                    <span class="kh-invoice-a4__meta-label">អតិថិជន:</span>
                    <span class="kh-invoice-a4__meta-val">{{ formatKhmerCustomerName((sale as any).customer_name) }}</span>
                  </div>
                </div>
              </div>

              <table class="kh-invoice-a4__table">
                <thead>
                  <tr>
                    <th class="col-no">ល.រ</th>
                    <th class="col-desc">បរិយាយទំនិញ</th>
                    <th class="col-variant">ពណ៌ / ទំហំ</th>
                    <th class="col-qty">ចំនួន</th>
                    <th class="col-price">តម្លៃរាយ</th>
                    <th class="col-total">សរុប</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(it, idx) in sale.items" :key="it.id || idx">
                    <td class="col-no">{{ toKhmerNumerals(idx + 1) }}</td>
                    <td class="col-desc">
                      <div class="kh-invoice-a4__prod-name">{{ (it as any).product_name || 'ទំនិញ' }}</div>
                      <div v-if="(it as any).sku" class="kh-invoice-a4__prod-sku">SKU: {{ (it as any).sku }}</div>
                    </td>
                    <td class="col-variant">{{ [(it as any).color_name, (it as any).size_name].filter(Boolean).join(' / ') || 'ទូទៅ' }}</td>
                    <td class="col-qty">{{ toKhmerNumerals(it.quantity) }}</td>
                    <td class="col-price font-mono">${{ Number(it.unit_price).toFixed(2) }}</td>
                    <td class="col-total font-mono font-bold">${{ Number(it.subtotal).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="kh-invoice-a4__bottom-grid">
                <div class="kh-invoice-a4__payment-box">
                  <div class="kh-invoice-a4__box-heading">ព័ត៌មានទូទាត់ (Payment Information)</div>
                  <div class="kh-invoice-a4__pay-line">
                    <span>វិធីទូទាត់:</span>
                    <strong>{{ primaryPaymentMethodLabel }}</strong>
                  </div>
                  <div class="kh-invoice-a4__pay-line">
                    <span>ស្ថានភាពទូទាត់:</span>
                    <strong class="kh-invoice-a4__status-pill">{{ paymentStatusInfo.khmer }}</strong>
                  </div>
                  <div class="kh-invoice-a4__pay-line">
                    <span>ប្រាក់បានបង់:</span>
                    <strong class="font-mono">${{ totalPaidAmount.toFixed(2) }}</strong>
                  </div>
                </div>

                <div class="kh-invoice-a4__summary-box">
                  <div class="kh-invoice-a4__sum-row">
                    <span>សរុបរង (Subtotal)</span>
                    <span class="font-mono">${{ Number(sale.subtotal).toFixed(2) }}</span>
                  </div>
                  <div class="kh-invoice-a4__sum-row">
                    <span>បញ្ចុះតម្លៃ (Discount)</span>
                    <span class="font-mono">-${{ Number(sale.discount_amount).toFixed(2) }}</span>
                  </div>
                  <div class="kh-invoice-a4__sum-row">
                    <span>ពន្ធ (Tax)</span>
                    <span class="font-mono">${{ Number(sale.tax_amount).toFixed(2) }}</span>
                  </div>
                  <div class="kh-invoice-a4__sum-total">
                    <div>
                      <div class="kh-invoice-a4__sum-total-kh">សរុបត្រូវបង់ (Total Due)</div>
                      <div class="kh-invoice-a4__sum-total-khr">{{ formatRiel(Number(sale.total)) }}</div>
                    </div>
                    <div class="kh-invoice-a4__sum-total-usd font-mono">
                      ${{ Number(sale.total).toFixed(2) }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="kh-invoice-a4__footer">
                <p class="kh-invoice-a4__thank">
                  សូមអរគុណដែលបានគាំទ្រហាងរបស់យើង! សូមអញ្ជើញមកទិញម្តងទៀត។
                </p>
                <p class="kh-invoice-a4__policy">
                  ទំនិញដែលទិញរួចអាចប្តូរទំហំ ឬពណ៌បានក្នុងរយៈពេល ៧ ថ្ងៃ ដោយភ្ជាប់មកជាមួយវិក្កយបត្រដើម និងស្លាកទំនិញនៅដដែល។
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
        <!-- Template B: 80mm Thermal Receipt -->
        <div v-if="printMode === 'THERMAL'" class="kh-receipt-80mm">
          <div class="kh-receipt-80mm__header">
            <div class="kh-receipt-80mm__title-kh">ហាងលក់សម្លៀកបំពាក់ ភ្នំពេញ</div>
            <div class="kh-receipt-80mm__title-en">CLOTHING STORE PHNOM PENH</div>
            <div class="kh-receipt-80mm__meta-center">
              សាខា: {{ formatKhmerBranchName((sale as any).branch_name) }}
            </div>
            <div class="kh-receipt-80mm__meta-center">
              ទូរស័ព្ទ: 012 345 678
            </div>
          </div>

          <div class="kh-receipt-80mm__divider-double"></div>

          <div class="kh-receipt-80mm__info">
            <div class="kh-receipt-80mm__info-row">
              <span>លេខវិក្កយបត្រ:</span>
              <span class="font-mono font-bold">{{ sale.invoice_number }}</span>
            </div>
            <div class="kh-receipt-80mm__info-row">
              <span>ថ្ងៃទី:</span>
              <span class="font-mono">{{ formatReceiptCompactDate(sale.created_at) }}</span>
            </div>
            <div class="kh-receipt-80mm__info-row">
              <span>អ្នកគិតលុយ:</span>
              <span>{{ (sale as any).cashier_name || 'Front Cashier' }}</span>
            </div>
            <div class="kh-receipt-80mm__info-row">
              <span>អតិថិជន:</span>
              <span>{{ formatKhmerCustomerName((sale as any).customer_name) }}</span>
            </div>
          </div>

          <div class="kh-receipt-80mm__divider-dashed"></div>

          <div class="kh-receipt-80mm__items">
            <div
              v-for="(it, idx) in sale.items"
              :key="it.id || idx"
              class="kh-receipt-80mm__item"
            >
              <div class="kh-receipt-80mm__item-title">
                {{ (it as any).product_name || 'ទំនិញ' }}
                <span v-if="(it as any).color_name || (it as any).size_name" class="kh-receipt-80mm__item-variant">
                  ({{ [(it as any).color_name, (it as any).size_name].filter(Boolean).join(' / ') }})
                </span>
              </div>
              <div class="kh-receipt-80mm__item-calc">
                <span class="font-mono">
                  {{ it.quantity }} x ${{ Number(it.unit_price).toFixed(2) }}
                </span>
                <span class="font-mono font-bold">
                  ${{ Number(it.subtotal).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>

          <div class="kh-receipt-80mm__divider-dashed"></div>

          <div class="kh-receipt-80mm__totals">
            <div class="kh-receipt-80mm__row">
              <span>សរុបរង</span>
              <span class="font-mono">${{ Number(sale.subtotal).toFixed(2) }}</span>
            </div>
            <div class="kh-receipt-80mm__row">
              <span>បញ្ចុះតម្លៃ</span>
              <span class="font-mono">${{ Number(sale.discount_amount).toFixed(2) }}</span>
            </div>
            <div v-if="Number(sale.tax_amount) > 0" class="kh-receipt-80mm__row">
              <span>ពន្ធ (Tax)</span>
              <span class="font-mono">${{ Number(sale.tax_amount).toFixed(2) }}</span>
            </div>
            <div class="kh-receipt-80mm__row kh-receipt-80mm__grand">
              <span>សរុបត្រូវបង់</span>
              <span class="font-mono">${{ Number(sale.total).toFixed(2) }}</span>
            </div>
            <div class="kh-receipt-80mm__row kh-receipt-80mm__khr">
              <span>សរុបជាប្រាក់រៀល</span>
              <span class="font-mono">{{ formatRiel(Number(sale.total)) }}</span>
            </div>
          </div>

          <div class="kh-receipt-80mm__divider-dashed"></div>

          <div class="kh-receipt-80mm__payment">
            <div class="kh-receipt-80mm__row">
              <span>ការទូទាត់:</span>
              <span class="font-semibold">{{ primaryPaymentMethodLabel }}</span>
            </div>
            <div class="kh-receipt-80mm__row">
              <span>ស្ថានភាព:</span>
              <span class="font-bold">{{ paymentStatusInfo.khmer }}</span>
            </div>
          </div>

          <div class="kh-receipt-80mm__divider-double"></div>

          <div class="kh-receipt-80mm__footer">
            <p class="kh-receipt-80mm__thank">សូមអរគុណ! សូមអញ្ជើញមកម្តងទៀត</p>
            <p class="kh-receipt-80mm__policy">ទំនិញអាចប្តូរបានក្នុងរយៈពេល ៧ ថ្ងៃ ដោយភ្ជាប់មកជាមួយវិក្កយបត្រ។</p>
          </div>
        </div>

        <!-- Template A: Modern Khmer A4 Invoice -->
        <div v-else class="kh-invoice-a4">
          <div class="kh-invoice-a4__header">
            <div class="kh-invoice-a4__brand-group">
              <div class="kh-invoice-a4__logo">CS</div>
              <div>
                <h1 class="kh-invoice-a4__store-kh">ហាងលក់សម្លៀកបំពាក់ ភ្នំពេញ</h1>
                <div class="kh-invoice-a4__store-en">CLOTHING STORE PHNOM PENH</div>
                <div class="kh-invoice-a4__branch">
                  សាខា: {{ formatKhmerBranchName((sale as any).branch_name) }} &bull; ភ្នំពេញ, កម្ពុជា &bull; ទូរស័ព្ទ: 012 345 678
                </div>
              </div>
            </div>
            <div class="kh-invoice-a4__doc-heading">
              <div class="kh-invoice-a4__title-kh">វិក្កយបត្រលក់</div>
              <div class="kh-invoice-a4__title-en">SALES INVOICE</div>
            </div>
          </div>

          <div class="kh-invoice-a4__meta-grid">
            <div class="kh-invoice-a4__meta-col">
              <div class="kh-invoice-a4__meta-line">
                <span class="kh-invoice-a4__meta-label">លេខវិក្កយបត្រ:</span>
                <span class="kh-invoice-a4__meta-val font-mono font-bold">{{ sale.invoice_number }}</span>
              </div>
              <div class="kh-invoice-a4__meta-line">
                <span class="kh-invoice-a4__meta-label">កាលបរិច្ឆេទ:</span>
                <span class="kh-invoice-a4__meta-val">{{ formatKhmerInvoiceDate(sale.created_at) }}</span>
              </div>
              <div class="kh-invoice-a4__meta-line">
                <span class="kh-invoice-a4__meta-label">សាខា:</span>
                <span class="kh-invoice-a4__meta-val">{{ formatKhmerBranchName((sale as any).branch_name) }}</span>
              </div>
            </div>
            <div class="kh-invoice-a4__meta-col">
              <div class="kh-invoice-a4__meta-line">
                <span class="kh-invoice-a4__meta-label">អ្នកគិតលុយ:</span>
                <span class="kh-invoice-a4__meta-val">{{ (sale as any).cashier_name || 'Front Cashier' }}</span>
              </div>
              <div class="kh-invoice-a4__meta-line">
                <span class="kh-invoice-a4__meta-label">អតិថិជន:</span>
                <span class="kh-invoice-a4__meta-val">{{ formatKhmerCustomerName((sale as any).customer_name) }}</span>
              </div>
            </div>
          </div>

          <table class="kh-invoice-a4__table">
            <thead>
              <tr>
                <th class="col-no">ល.រ</th>
                <th class="col-desc">បរិយាយទំនិញ</th>
                <th class="col-variant">ពណ៌ / ទំហំ</th>
                <th class="col-qty">ចំនួន</th>
                <th class="col-price">តម្លៃរាយ</th>
                <th class="col-total">សរុប</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in sale.items" :key="it.id || idx">
                <td class="col-no">{{ toKhmerNumerals(idx + 1) }}</td>
                <td class="col-desc">
                  <div class="kh-invoice-a4__prod-name">{{ (it as any).product_name || 'ទំនិញ' }}</div>
                  <div v-if="(it as any).sku" class="kh-invoice-a4__prod-sku">SKU: {{ (it as any).sku }}</div>
                </td>
                <td class="col-variant">{{ [(it as any).color_name, (it as any).size_name].filter(Boolean).join(' / ') || 'ទូទៅ' }}</td>
                <td class="col-qty">{{ toKhmerNumerals(it.quantity) }}</td>
                <td class="col-price font-mono">${{ Number(it.unit_price).toFixed(2) }}</td>
                <td class="col-total font-mono font-bold">${{ Number(it.subtotal).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="kh-invoice-a4__bottom-grid">
            <div class="kh-invoice-a4__payment-box">
              <div class="kh-invoice-a4__box-heading">ព័ត៌មានទូទាត់ (Payment Information)</div>
              <div class="kh-invoice-a4__pay-line">
                <span>វិធីទូទាត់:</span>
                <strong>{{ primaryPaymentMethodLabel }}</strong>
              </div>
              <div class="kh-invoice-a4__pay-line">
                <span>ស្ថានភាពទូទាត់:</span>
                <strong class="kh-invoice-a4__status-pill">{{ paymentStatusInfo.khmer }}</strong>
              </div>
              <div class="kh-invoice-a4__pay-line">
                <span>ប្រាក់បានបង់:</span>
                <strong class="font-mono">${{ totalPaidAmount.toFixed(2) }}</strong>
              </div>
            </div>

            <div class="kh-invoice-a4__summary-box">
              <div class="kh-invoice-a4__sum-row">
                <span>សរុបរង (Subtotal)</span>
                <span class="font-mono">${{ Number(sale.subtotal).toFixed(2) }}</span>
              </div>
              <div class="kh-invoice-a4__sum-row">
                <span>បញ្ចុះតម្លៃ (Discount)</span>
                <span class="font-mono">-${{ Number(sale.discount_amount).toFixed(2) }}</span>
              </div>
              <div class="kh-invoice-a4__sum-row">
                <span>ពន្ធ (Tax)</span>
                <span class="font-mono">${{ Number(sale.tax_amount).toFixed(2) }}</span>
              </div>
              <div class="kh-invoice-a4__sum-total">
                <div>
                  <div class="kh-invoice-a4__sum-total-kh">សរុបត្រូវបង់ (Total Due)</div>
                  <div class="kh-invoice-a4__sum-total-khr">{{ formatRiel(Number(sale.total)) }}</div>
                </div>
                <div class="kh-invoice-a4__sum-total-usd font-mono">
                  ${{ Number(sale.total).toFixed(2) }}
                </div>
              </div>
            </div>
          </div>

          <div class="kh-invoice-a4__footer">
            <p class="kh-invoice-a4__thank">
              សូមអរគុណដែលបានគាំទ្រហាងរបស់យើង! សូមអញ្ជើញមកទិញម្តងទៀត។
            </p>
            <p class="kh-invoice-a4__policy">
              ទំនិញដែលទិញរួចអាចប្តូរទំហំ ឬពណ៌បានក្នុងរយៈពេល ៧ ថ្ងៃ ដោយភ្ជាប់មកជាមួយវិក្កយបត្រដើម និងស្លាកទំនិញនៅដដែល។
            </p>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="state-card no-print">Sale not found.</div>
  </div>
</template>

<script setup lang="ts">
import type { Sale } from '~/types'
import {
  toKhmerNumerals,
  formatKhmerInvoiceDate,
  formatReceiptCompactDate,
  formatKhmerPaymentStatus,
  formatKhmerPaymentMethod,
  formatKhmerCustomerName,
  formatKhmerBranchName,
  printWithKhmerFonts,
} from '~/composables/useKhmerPrint'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Sale Detail — Clothing Store' })

const { getSale, cancelSale } = useSaleApi()
const { addToast } = useAppToast()

const sale = ref<Sale | null>(null)
const loading = ref(true)
const printMode = ref<'THERMAL' | 'A4'>('A4')
const showPreviewModal = ref(false)

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

async function handleCancel() {
  if (!confirm('Cancel this sale? This cannot be undone.')) return
  try {
    await cancelSale(id)
    addToast({ type: 'success', title: 'Sale cancelled' })
    sale.value = await getSale(id) as Sale
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  }
}

onMounted(async () => {
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
.mode-tabs {
  display: flex;
  gap: 4px;
  background: var(--surface-inset);
  padding: 3px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}
.mode-tab {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}
.mode-tab.active {
  background: #111827;
  color: #ffffff;
}
.preview-actions {
  display: flex;
  gap: 8px;
}
.preview-canvas {
  background: #f1f5f9;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 20px;
  max-height: 68vh;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}

.print-only-invoice { display: none; }
</style>

<style>
/* Shared Khmer Receipt & A4 Invoice Styles for Admin */
.kh-receipt-80mm {
  font-family: 'Kantumruy Pro', 'Battambang', 'Battambang Local', 'Noto Sans Khmer', sans-serif;
  width: 78mm;
  max-width: 100%;
  background: #ffffff;
  color: #111827;
  padding: 4mm 3.5mm;
  font-size: 11px;
  line-height: 1.55;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-sizing: border-box;
}
.kh-receipt-80mm__header { text-align: center; padding-bottom: 4px; }
.kh-receipt-80mm__title-kh { font-size: 13.5px; font-weight: 700; color: #111827; line-height: 1.5; }
.kh-receipt-80mm__title-en { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; color: #374151; margin-top: 1px; }
.kh-receipt-80mm__meta-center { font-size: 10.5px; color: #374151; line-height: 1.45; }
.kh-receipt-80mm__divider-double { border-top: 2px double #111827; margin: 6px 0; }
.kh-receipt-80mm__divider-dashed { border-top: 1px dashed #6b7280; margin: 6px 0; }
.kh-receipt-80mm__info { display: flex; flex-direction: column; gap: 2px; font-size: 10.5px; }
.kh-receipt-80mm__info-row { display: flex; justify-content: space-between; gap: 6px; }
.kh-receipt-80mm__items { display: flex; flex-direction: column; gap: 5px; }
.kh-receipt-80mm__item { display: flex; flex-direction: column; }
.kh-receipt-80mm__item-title { font-size: 11px; font-weight: 600; color: #111827; line-height: 1.45; word-break: break-word; }
.kh-receipt-80mm__item-variant { font-weight: 400; color: #374151; font-size: 10.5px; }
.kh-receipt-80mm__item-calc { display: flex; justify-content: space-between; align-items: baseline; padding-left: 8px; font-size: 10.5px; color: #1f2937; }
.kh-receipt-80mm__totals, .kh-receipt-80mm__payment { display: flex; flex-direction: column; gap: 2.5px; font-size: 11px; }
.kh-receipt-80mm__row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.kh-receipt-80mm__grand { font-size: 13px; font-weight: 700; color: #111827; padding-top: 3px; border-top: 1px solid #d1d5db; margin-top: 2px; }
.kh-receipt-80mm__khr { font-size: 10.5px; color: #374151; font-weight: 600; }
.kh-receipt-80mm__footer { text-align: center; padding-top: 4px; }
.kh-receipt-80mm__thank { font-size: 11px; font-weight: 700; color: #111827; line-height: 1.5; margin: 0; }
.kh-receipt-80mm__policy { font-size: 9.5px; color: #4b5563; line-height: 1.45; margin-top: 2px; }

.kh-invoice-a4 {
  font-family: 'Kantumruy Pro', 'Battambang', 'Battambang Local', 'Noto Sans Khmer', sans-serif;
  width: 100%;
  max-width: 195mm;
  background: #ffffff;
  color: #111827;
  padding: 10mm;
  font-size: 12.5px;
  line-height: 1.6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-sizing: border-box;
}
.kh-invoice-a4__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding-bottom: 14px; border-bottom: 2px solid #111827; }
.kh-invoice-a4__brand-group { display: flex; align-items: flex-start; gap: 12px; }
.kh-invoice-a4__logo { width: 42px; height: 42px; border-radius: 8px; background: #111827; color: #ffffff; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kh-invoice-a4__store-kh { font-size: 20px; font-weight: 700; color: #111827; line-height: 1.4; margin: 0; }
.kh-invoice-a4__store-en { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #374151; }
.kh-invoice-a4__branch { font-size: 11.5px; color: #4b5563; margin-top: 2px; }
.kh-invoice-a4__doc-heading { text-align: right; flex-shrink: 0; }
.kh-invoice-a4__title-kh { font-size: 22px; font-weight: 700; color: #111827; line-height: 1.35; }
.kh-invoice-a4__title-en { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #4b5563; }
.kh-invoice-a4__meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 14px; }
.kh-invoice-a4__meta-col { display: flex; flex-direction: column; gap: 4px; }
.kh-invoice-a4__meta-line { display: flex; align-items: baseline; gap: 8px; font-size: 12.5px; }
.kh-invoice-a4__meta-label { color: #4b5563; min-width: 110px; font-weight: 500; }
.kh-invoice-a4__meta-val { color: #111827; font-weight: 600; }
.kh-invoice-a4__table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
.kh-invoice-a4__table thead th { background: #f9fafb; color: #111827; font-weight: 700; font-size: 12px; padding: 8px 10px; border-top: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; line-height: 1.5; }
.kh-invoice-a4__table tbody td { padding: 9px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; font-size: 12.5px; line-height: 1.5; }
.kh-invoice-a4__table .col-no { width: 44px; text-align: center; }
.kh-invoice-a4__table .col-desc { text-align: left; }
.kh-invoice-a4__table .col-variant { width: 120px; text-align: left; }
.kh-invoice-a4__table .col-qty { width: 64px; text-align: center; }
.kh-invoice-a4__table .col-price { width: 95px; text-align: right; }
.kh-invoice-a4__table .col-total { width: 105px; text-align: right; }
.kh-invoice-a4__prod-name { font-weight: 600; color: #111827; word-break: break-word; }
.kh-invoice-a4__prod-sku { font-size: 10.5px; color: #6b7280; font-family: monospace; }
.kh-invoice-a4__bottom-grid { display: grid; grid-template-columns: 1fr 290px; gap: 20px; align-items: start; padding-top: 4px; }
.kh-invoice-a4__payment-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; display: flex; flex-direction: column; gap: 5px; font-size: 12px; }
.kh-invoice-a4__box-heading { font-weight: 700; font-size: 12px; color: #111827; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; margin-bottom: 2px; }
.kh-invoice-a4__pay-line { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.kh-invoice-a4__status-pill { padding: 1px 8px; background: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11.5px; }
.kh-invoice-a4__summary-box { display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; }
.kh-invoice-a4__sum-row { display: flex; justify-content: space-between; align-items: baseline; color: #374151; }
.kh-invoice-a4__sum-total { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; margin-top: 4px; border-top: 2px solid #111827; }
.kh-invoice-a4__sum-total-kh { font-size: 13.5px; font-weight: 700; color: #111827; }
.kh-invoice-a4__sum-total-khr { font-size: 11.5px; font-weight: 600; color: #4b5563; }
.kh-invoice-a4__sum-total-usd { font-size: 24px; font-weight: 800; color: #111827; line-height: 1.1; }
.kh-invoice-a4__footer { margin-top: 22px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; }
.kh-invoice-a4__thank { font-size: 13px; font-weight: 700; color: #111827; margin: 0; }
.kh-invoice-a4__policy { font-size: 11px; color: #4b5563; margin-top: 4px; }

@media print {
  @page {
    margin: 0;
  }

  html,
  body {
    height: auto !important;
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

  #admin-printable-invoice.is-thermal-invoice .kh-receipt-80mm {
    width: 78mm !important;
    margin: 0 !important;
    padding: 3mm 2.5mm !important;
    border: none !important;
    box-shadow: none !important;
  }

  #admin-printable-invoice.is-a4-invoice .kh-invoice-a4 {
    width: 190mm !important;
    max-width: 190mm !important;
    margin: 10mm auto !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
  }
}
</style>
