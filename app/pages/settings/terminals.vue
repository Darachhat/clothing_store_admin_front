<template>
  <div class="page-root">
    <!-- A. Standardized Page Heading -->
    <AppPageHeader
      title="POS Registers"
      description="Manage registers, cashier shifts, workstation connections, and hardware assignments."
      :breadcrumbs="[
        { label: 'Store', to: '/settings/terminals' },
        { label: 'POS Registers' },
      ]"
      primary-label="Add Register"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreateModal"
    >
      <template #secondary>
        <div class="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          <span v-if="lastRefreshedAt" class="inline-flex items-center gap-1 text-[11.5px] text-ink-tertiary px-1 w-full sm:w-auto pb-0.5 sm:pb-0" title="Last successful data refresh">
            <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
            <span>Updated {{ lastRefreshedAt }}</span>
          </span>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-7.5 px-2.5 rounded-md border border-border-subtle text-xs font-medium cursor-pointer transition-colors"
            :class="autoRefresh ? 'bg-surface-inset text-ink' : 'bg-surface-card text-ink-secondary hover:bg-surface-hover'"
            title="Toggle 15-second live workstation heartbeat polling"
            @click="toggleAutoRefresh"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="[autoRefresh ? 'bg-status-green' : 'bg-slate-400', { 'animate-pulse': autoRefresh && !loading }]" />
            <span>Auto-refresh (15s)</span>
          </button>

          <AppButton
            size="sm"
            variant="default"
            icon="i-heroicons-arrow-path"
            label="Refresh"
            :loading="loading"
            @click="fetchData"
          />
        </div>
      </template>
    </AppPageHeader>

    <!-- B. KPI Cards (Accurate Backend-Derived Counts & Clear Definitions) -->
    <div class="kpi-grid">
      <AppStatCard
        label="Total Registers"
        :value="terminals.length"
        icon="i-heroicons-computer-desktop"
        tone="neutral"
        :loading="initialLoading"
        :sublabel="`${activeConfigCount} Active · ${maintenanceOrInactiveCount} Maintenance / Inactive`"
      />

      <AppStatCard
        label="Online Workstations"
        :value="onlineCount"
        icon="i-heroicons-signal"
        :tone="onlineCount > 0 ? 'green' : 'neutral'"
        :badge="onlineCount > 0 ? 'Live' : '0 Active'"
        :badge-color="onlineCount > 0 ? 'green' : 'default'"
        :loading="initialLoading"
        :sublabel="`${idleCount} Idle (< 5m) · ${offlineWorkstationCount} Disconnected (> 5m)`"
      />

      <AppStatCard
        label="Active Open Shifts"
        :value="openShiftsCount"
        icon="i-heroicons-banknotes"
        :tone="openShiftsCount > 0 ? 'blue' : 'neutral'"
        :badge="openShiftsCount > 0 ? 'Open Drawers' : 'All Closed'"
        :badge-color="openShiftsCount > 0 ? 'blue' : 'default'"
        :loading="initialLoading"
        :sublabel="`Total opening float: $${totalOpeningFloatUsd.toFixed(2)}`"
      />

      <AppStatCard
        label="Offline / Maintenance"
        :value="offlineOrMaintenanceCount"
        icon="i-heroicons-wrench-screwdriver"
        :tone="maintenanceOrInactiveCount > 0 ? 'amber' : 'neutral'"
        :loading="initialLoading"
        :sublabel="`${maintenanceOrInactiveCount} Config Disabled · ${offlineWorkstationCount} No Heartbeat`"
      />
    </div>

    <!-- Operational Consistency Note when Open Shifts > Online Workstations -->
    <div
      v-if="!initialLoading && openShiftsCount > onlineCount"
      class="bg-status-amber-bg border border-border-subtle rounded-lg p-2.5 sm:p-3.5 text-xs leading-snug"
    >
      <div class="flex items-start gap-2">
        <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span class="font-semibold text-gray-900">
            {{ openShiftsCount }} cashier {{ openShiftsCount === 1 ? 'shift remains' : 'shifts remain' }} OPEN while {{ onlineCount }} {{ onlineCount === 1 ? 'workstation is' : 'workstations are' }} sending live heartbeats.
          </span>
          <span class="text-gray-600 ml-1">
            Cashier shifts stay open in the database until explicitly closed, even if the cashier closes their browser tab. You can inspect or end open shifts from the table below.
          </span>
        </div>
      </div>
    </div>

    <!-- C. Search & Multi-Facet Filter Bar -->
    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search by register name, code, cashier, or branch..."
      :chips="activeFilterChips"
      :shown-count="paginatedTerminals.length"
      :total-count="filteredTerminals.length"
      count-label="registers"
      @remove-chip="removeFilterChip"
      @clear-all="resetFilters"
    >
      <AppSelect
        v-model="connectionFilter"
        :options="[
          { label: 'All Connections', value: '' },
          { label: 'Online (< 45s)', value: 'ONLINE' },
          { label: 'Idle (< 5m)', value: 'IDLE' },
          { label: 'Offline', value: 'OFFLINE' },
        ]"
        style="min-width: 150px;"
      />

      <AppSelect
        v-model="branchFilter"
        :options="branchFilterOptions"
        style="min-width: 155px;"
      />

      <AppSelect
        v-model="warehouseFilter"
        :options="warehouseFilterOptions"
        style="min-width: 165px;"
      />

      <AppSelect
        v-model="configStatusFilter"
        :options="[
          { label: 'All Config Statuses', value: '' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Maintenance', value: 'MAINTENANCE' },
          { label: 'Inactive', value: 'INACTIVE' },
        ]"
        style="min-width: 160px;"
      />
    </AppFilterBar>

    <!-- Error State -->
    <AppErrorState
      v-if="loadError"
      title="Failed to load POS registers"
      :message="loadError"
      @retry="fetchData"
    />

    <!-- Register Table -->
    <AppCard v-else :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="paginatedTerminals"
        :loading="initialLoading"
        :empty-state="{
          icon: 'i-heroicons-computer-desktop',
          label: hasAnyFilter ? 'No registers match the current filters' : 'No POS registers configured yet',
          description: hasAnyFilter
            ? 'Try clearing one or more filters to view all registers.'
            : 'Add a POS register to assign branch/warehouse defaults and track cashier shifts.',
        }"
      >
        <!-- 1. Register (Name + Code + Hardware summary) -->
        <template #cell-code="{ row }">
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center gap-1.5">
              <span class="font-semibold text-ink text-[13px]">{{ row.name }}</span>
              <span class="font-mono text-[11px] font-semibold px-1.5 py-px rounded bg-surface-inset border border-border-subtle text-ink-secondary">{{ row.code }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-[11.5px] text-ink-tertiary">
              <span v-if="row.device_identifier" class="truncate max-w-[200px]" :title="row.device_identifier">
                {{ row.device_identifier }}
              </span>
              <span v-else class="text-gray-400">Standard Web POS</span>
              <span v-if="row.receipt_prefix" class="font-mono text-[10.5px] text-ink-secondary">
                Prefix: {{ row.receipt_prefix }}
              </span>
            </div>
          </div>
        </template>

        <!-- 2. Branch -->
        <template #cell-branch_display="{ row }">
          <div class="flex flex-col gap-px">
            <span class="font-medium text-ink text-[12.5px]">{{ row.branch_display }}</span>
            <span v-if="row.branch_code" class="font-mono text-[11px] text-ink-tertiary">{{ row.branch_code }}</span>
          </div>
        </template>

        <!-- 3. Warehouse -->
        <template #cell-warehouse_display="{ row }">
          <div class="flex flex-col gap-px">
            <span class="font-medium text-ink text-[12.5px]">{{ row.warehouse_display }}</span>
            <span v-if="row.warehouse_is_default" class="text-[10.5px] text-ink-tertiary">Default Fulfilment</span>
          </div>
        </template>

        <!-- 4. Connection (Heartbeat status + Last seen) -->
        <template #cell-connection="{ row }">
          <div class="flex flex-col items-start gap-1">
            <AppBadge
              :color="row.connection_state === 'ONLINE' ? 'green' : row.connection_state === 'IDLE' ? 'yellow' : 'default'"
              size="sm"
            >
              {{ row.connection_label }}
            </AppBadge>
            <span class="text-[11px] text-ink-tertiary" :title="row.last_active_at ? new Date(row.last_active_at).toLocaleString() : 'Never connected'">
              {{ formatLastSeen(row.last_active_at) }}
            </span>
          </div>
        </template>

        <!-- 5. Active Shift (Status, Start time, Opening float) -->
        <template #cell-active_shift="{ row }">
          <div v-if="row.active_shift" class="flex flex-col gap-0.5">
            <div class="flex items-center gap-1.5">
              <AppBadge color="blue" size="sm">OPEN</AppBadge>
              <span class="font-mono text-[11.5px] font-semibold text-ink">
                Float: ${{ Number(row.active_shift.opening_cash_usd || 0).toFixed(2) }}
              </span>
            </div>
            <div class="text-[11px] text-ink-tertiary">
              Started {{ formatShiftTime(row.active_shift.opened_at) }}
              <template v-if="Number(row.active_shift.opening_cash_khr || 0) > 0">
                · ៛{{ Number(row.active_shift.opening_cash_khr).toLocaleString() }}
              </template>
            </div>
          </div>
          <span v-else class="text-xs text-gray-400">Closed / No active shift</span>
        </template>

        <!-- 6. Cashier -->
        <template #cell-cashier_display="{ row }">
          <div v-if="row.active_shift" class="flex items-center gap-2">
            <span class="w-6.5 h-6.5 rounded-full bg-surface-hover border border-border-subtle text-ink flex items-center justify-center text-[11px] font-bold shrink-0">
              {{ (row.cashier_display || 'C').charAt(0).toUpperCase() }}
            </span>
            <div class="min-w-0">
              <div class="text-[12.5px] font-semibold text-ink truncate">{{ row.cashier_display }}</div>
              <div class="text-[10.5px] text-ink-tertiary">Active Drawer</div>
            </div>
          </div>
          <span v-else class="text-xs text-gray-400">Unassigned</span>
        </template>

        <!-- 7. Configuration Status -->
        <template #cell-status_code="{ row }">
          <AppBadge
            :color="row.status_code === 'ACTIVE' ? 'green' : row.status_code === 'MAINTENANCE' ? 'yellow' : 'default'"
            size="sm"
          >
            {{ row.status_code }}
          </AppBadge>
        </template>

        <!-- 8. Actions (Inspect, Edit, End Shift, Activate/Deactivate) -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1 flex-wrap">
            <AppButton
              size="xs"
              variant="ghost"
              icon="i-heroicons-eye"
              label="Inspect"
              @click="inspectTerminal(row)"
            />
            <AppButton
              size="xs"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              label="Edit"
              @click="openEditModal(row)"
            />
            <AppButton
              v-if="row.active_shift"
              size="xs"
              variant="danger"
              icon="i-heroicons-lock-closed"
              label="End Shift"
              @click="openForceCloseModal(row)"
            />
            <AppButton
              size="xs"
              :variant="row.status_code === 'ACTIVE' ? 'ghost' : 'default'"
              :icon="row.status_code === 'ACTIVE' ? 'i-heroicons-pause-circle' : 'i-heroicons-check-circle'"
              :label="row.status_code === 'ACTIVE' ? 'Deactivate' : 'Activate'"
              @click="promptToggleStatus(row)"
            />
          </div>
        </template>

        <template v-if="filteredTerminals.length > pageSize" #footer>
          <AppPagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :total="filteredTerminals.length"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL 1: CREATE / EDIT POS REGISTER                                     -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <AppModal
      v-model="showModal"
      :title="editingTerminal ? `Edit Register — ${editingTerminal.code}` : 'Add POS Register'"
      description="Configure register identity, branch/warehouse inventory binding, and receipt numbering."
      size="md"
    >
      <form class="form-grid" @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Register Code <span class="required">*</span></label>
            <input
              v-model="form.code"
              type="text"
              required
              :disabled="!!editingTerminal"
              placeholder="e.g. POS-01"
              class="field-input font-mono uppercase"
            />
            <span class="field-hint">Unique workstation code (cannot be changed later)</span>
          </div>

          <div class="form-field">
            <label class="field-label">Register Name <span class="required">*</span></label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. Front Counter Register 1"
              class="field-input"
            />
            <span class="field-hint">Display name shown on shift &amp; audit logs</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Assigned Branch <span class="required">*</span></label>
            <select
              v-model="form.branch_id"
              required
              class="field-input"
              @change="onBranchChange"
            >
              <option value="" disabled>Select branch...</option>
              <option v-for="b in branches" :key="b.id" :value="b.id">
                {{ b.name }} ({{ b.code }})
              </option>
            </select>
          </div>

          <div class="form-field">
            <label class="field-label">Fulfilment Warehouse <span class="required">*</span></label>
            <select
              v-model="form.warehouse_id"
              required
              class="field-input"
            >
              <option value="" disabled>Select warehouse...</option>
              <option v-for="w in branchWarehouses" :key="w.id" :value="w.id">
                {{ w.name }}{{ w.is_default ? ' (Default)' : '' }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Invoice / Receipt Prefix</label>
            <input
              v-model="form.receipt_prefix"
              type="text"
              placeholder="e.g. POS01-"
              class="field-input font-mono uppercase"
            />
          </div>

          <div class="form-field">
            <label class="field-label">Configuration Status</label>
            <select v-model="form.status_code" class="field-input">
              <option value="ACTIVE">ACTIVE — Ready for Checkout</option>
              <option value="MAINTENANCE">MAINTENANCE — Temporarily Disabled</option>
              <option value="INACTIVE">INACTIVE — Decommissioned</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Hardware / Peripheral Profile</label>
          <input
            v-model="form.device_identifier"
            type="text"
            placeholder="e.g. iPad Pro 12.9 + Epson TM-T82III 80mm + 2D USB Scanner"
            class="field-input"
          />
        </div>

        <div class="form-field">
          <label class="field-label">Operational Notes</label>
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="Optional notes regarding cash drawer key, IP printer address, or location..."
            class="field-input field-textarea"
          />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showModal = false" />
          <AppButton
            type="submit"
            variant="primary"
            :label="editingTerminal ? 'Save Register Changes' : 'Create POS Register'"
            :loading="saving"
          />
        </div>
      </form>
    </AppModal>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- DRAWER 2: CONTEXTUAL REGISTER & SHIFT INSPECTION                        -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <AppDetailDrawer
      v-model="showInspectModal"
      :title="inspectedTerminal ? `${inspectedTerminal.name} (${inspectedTerminal.code})` : 'Register Details'"
      :subtitle="inspectedTerminal ? `${inspectedTerminal.branch_display} · ${inspectedTerminal.warehouse_display}` : ''"
      size="md"
    >
      <template v-if="inspectedTerminal" #badge>
        <AppBadge
          :color="inspectedTerminal.status_code === 'ACTIVE' ? 'green' : inspectedTerminal.status_code === 'MAINTENANCE' ? 'yellow' : 'default'"
          size="sm"
        >
          {{ inspectedTerminal.status_code }}
        </AppBadge>
      </template>

      <template v-if="inspectedTerminal">
        <!-- Section 1: Workstation & Hardware Configuration -->
        <AppCard title="Workstation & Location Binding">
          <dl class="detail-list">
            <div class="detail-row">
              <dt>Register Code</dt>
              <dd><code class="mono font-semibold">{{ inspectedTerminal.code }}</code></dd>
            </div>
            <div class="detail-row">
              <dt>Branch</dt>
              <dd>{{ inspectedTerminal.branch_display }} <span v-if="inspectedTerminal.branch_code" class="mono text-gray-500">({{ inspectedTerminal.branch_code }})</span></dd>
            </div>
            <div class="detail-row">
              <dt>Inventory Warehouse</dt>
              <dd>{{ inspectedTerminal.warehouse_display }}</dd>
            </div>
            <div class="detail-row">
              <dt>Workstation Connection</dt>
              <dd>
                <AppBadge
                  :color="inspectedTerminal.connection_state === 'ONLINE' ? 'green' : inspectedTerminal.connection_state === 'IDLE' ? 'yellow' : 'default'"
                  size="sm"
                >
                  {{ inspectedTerminal.connection_label }}
                </AppBadge>
              </dd>
            </div>
            <div class="detail-row">
              <dt>Last Heartbeat</dt>
              <dd class="mono text-xs">
                {{ inspectedTerminal.last_active_at ? new Date(inspectedTerminal.last_active_at).toLocaleString() : 'Never connected' }}
                <span class="text-gray-400 ml-1">({{ formatLastSeen(inspectedTerminal.last_active_at) }})</span>
              </dd>
            </div>
            <div class="detail-row">
              <dt>Receipt Prefix</dt>
              <dd class="mono">{{ inspectedTerminal.receipt_prefix || `${inspectedTerminal.code}-` }}</dd>
            </div>
            <div class="detail-row">
              <dt>Hardware Profile</dt>
              <dd>{{ inspectedTerminal.device_identifier || 'Standard Web POS' }}</dd>
            </div>
            <div v-if="inspectedTerminal.notes" class="detail-row">
              <dt>Notes</dt>
              <dd>{{ inspectedTerminal.notes }}</dd>
            </div>
          </dl>
        </AppCard>

        <!-- Section 2: Active Cashier Shift & Live Cash Summary -->
        <AppCard title="Active Cashier Shift">
          <template v-if="inspectedTerminal.active_shift" #header-right>
            <AppBadge color="blue" size="sm">OPEN SHIFT</AppBadge>
          </template>

          <div v-if="inspectedTerminal.active_shift" class="space-y-4">
            <dl class="detail-list">
              <div class="detail-row">
                <dt>Assigned Cashier</dt>
                <dd class="font-semibold">{{ inspectedTerminal.cashier_display }}</dd>
              </div>
              <div class="detail-row">
                <dt>Shift Opened At</dt>
                <dd class="mono text-xs">{{ new Date(inspectedTerminal.active_shift.opened_at).toLocaleString() }}</dd>
              </div>
              <div class="detail-row">
                <dt>Opening Float (USD)</dt>
                <dd class="mono font-bold text-emerald-700">${{ Number(inspectedTerminal.active_shift.opening_cash_usd || 0).toFixed(2) }}</dd>
              </div>
              <div class="detail-row">
                <dt>Opening Float (KHR)</dt>
                <dd class="mono font-semibold">៛{{ Number(inspectedTerminal.active_shift.opening_cash_khr || 0).toLocaleString() }}</dd>
              </div>
            </dl>

            <!-- Live Shift Cash Summary (from GET /shifts/{id}/summary) -->
            <div v-if="loadingShiftSummary" class="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500">
              Loading live shift cash summary...
            </div>
            <div v-else-if="inspectedShiftSummary" class="p-3.5 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
              <div class="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Live Drawer Cash &amp; Sales Summary
              </div>
              <dl class="detail-list">
                <div class="detail-row">
                  <dt>Completed Sales in Shift</dt>
                  <dd class="font-semibold">{{ inspectedShiftSummary.sales_count ?? inspectedShiftSummary.total_sales_count ?? 0 }} orders</dd>
                </div>
                <div class="detail-row">
                  <dt>Total Shift Revenue (USD)</dt>
                  <dd class="mono font-semibold">${{ Number(inspectedShiftSummary.total_sales_usd ?? inspectedShiftSummary.total_revenue_usd ?? 0).toFixed(2) }}</dd>
                </div>
                <div class="detail-row">
                  <dt>Expected Drawer Cash (USD)</dt>
                  <dd class="mono font-bold text-gray-900">
                    ${{ Number(inspectedShiftSummary.expected_cash_usd ?? inspectedTerminal.active_shift.opening_cash_usd ?? 0).toFixed(2) }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <AppEmptyState
            v-else
            icon="i-heroicons-lock-closed"
            title="No Open Shift on This Register"
            description="A cashier can open a new shift on this register by signing into the POS checkout application."
          />
        </AppCard>
      </template>

      <template v-if="inspectedTerminal" #footer>
        <AppButton
          variant="default"
          icon="i-heroicons-pencil-square"
          label="Edit Register"
          @click="showInspectModal = false; openEditModal(inspectedTerminal)"
        />
        <AppButton
          v-if="inspectedTerminal.active_shift"
          variant="danger"
          icon="i-heroicons-lock-closed"
          label="End Shift"
          @click="showInspectModal = false; openForceCloseModal(inspectedTerminal)"
        />
        <AppButton variant="ghost" label="Close" @click="showInspectModal = false" />
      </template>
    </AppDetailDrawer>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL 3: END SHIFT / FORCE CLOSE CONFIRMATION                           -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <AppModal
      v-model="showForceCloseModal"
      title="End Active Cashier Shift"
      description="Reconcile counted drawer cash and close this register's active shift."
      size="sm"
    >
      <form v-if="targetShiftTerminal?.active_shift" class="form-grid" @submit.prevent="handleForceCloseShift">
        <div class="p-3 rounded-lg bg-status-amber-bg border border-border-subtle">
          <div class="flex items-start gap-2.5">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div class="text-xs space-y-1">
              <p class="font-semibold text-gray-900">
                Ending shift on {{ targetShiftTerminal.name }} ({{ targetShiftTerminal.code }})
              </p>
              <p class="text-gray-600">
                Cashier: <strong>{{ targetShiftTerminal.cashier_display }}</strong> ·
                Opening Float: <strong>${{ Number(targetShiftTerminal.active_shift.opening_cash_usd || 0).toFixed(2) }}</strong>
              </p>
              <p class="text-gray-500">
                Once closed, the cashier workstation will require a new shift before processing sales.
              </p>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Counted Closing Cash (USD) <span class="required">*</span></label>
            <input
              v-model.number="forceCloseForm.closing_cash_usd"
              type="number"
              step="0.01"
              min="0"
              required
              class="field-input font-mono"
            />
          </div>

          <div class="form-field">
            <label class="field-label">Counted Closing Cash (KHR) <span class="required">*</span></label>
            <input
              v-model.number="forceCloseForm.closing_cash_khr"
              type="number"
              step="100"
              min="0"
              required
              class="field-input font-mono"
            />
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Supervisor / Closure Reason <span class="required">*</span></label>
          <textarea
            v-model="forceCloseForm.notes"
            rows="2"
            required
            placeholder="e.g. End-of-day administrative shift closure by manager"
            class="field-input field-textarea"
          />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" :disabled="closingShift" @click="showForceCloseModal = false" />
          <AppButton
            type="submit"
            variant="danger"
            icon="i-heroicons-lock-closed"
            label="Confirm & End Shift"
            :loading="closingShift"
          />
        </div>
      </form>
    </AppModal>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- DIALOG 4: ACTIVATE / DEACTIVATE REGISTER CONFIRMATION                   -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <AppConfirmDialog
      v-model="showStatusConfirm"
      :title="statusConfirmTarget?.status_code === 'ACTIVE' ? 'Deactivate POS Register' : 'Activate POS Register'"
      :variant="statusConfirmTarget?.status_code === 'ACTIVE' ? 'danger' : 'primary'"
      :confirm-label="statusConfirmTarget?.status_code === 'ACTIVE' ? 'Deactivate Register' : 'Activate Register'"
      :loading="togglingStatus"
      :message="
        statusConfirmTarget?.status_code === 'ACTIVE'
          ? `Are you sure you want to deactivate register ${statusConfirmTarget?.name} (${statusConfirmTarget?.code})?`
          : `Re-activate register ${statusConfirmTarget?.name} (${statusConfirmTarget?.code}) so cashiers can bind to it and open shifts?`
      "
      :consequence="
        statusConfirmTarget?.status_code === 'ACTIVE'
          ? 'Deactivated registers cannot start new cashier shifts or process POS checkouts until re-activated.'
          : 'This register will immediately become available for POS workstation binding.'
      "
      @confirm="executeToggleStatus"
    />
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'POS Registers — Clothing Store Admin' })

const terminalApi = useTerminalApi()
const shiftApi = useShiftApi()
const branchApi = useBranchApi()
const userApi = useUserApi()
const toast = useAppToast()

const initialLoading = ref(true)
const loading = ref(false)
const loadError = ref<string | null>(null)
const saving = ref(false)
const closingShift = ref(false)
const togglingStatus = ref(false)
const autoRefresh = ref(true)
const lastRefreshedAt = ref('')

const terminals = ref<any[]>([])
const openShifts = ref<any[]>([])
const branches = ref<any[]>([])
const allWarehouses = ref<any[]>([])
const usersMap = ref<Record<string, any>>({})

// Filters & Pagination
const searchQuery = ref('')
const connectionFilter = ref('')
const branchFilter = ref('')
const warehouseFilter = ref('')
const configStatusFilter = ref('')
const currentPage = ref(1)
const pageSize = 20

// Modals & Drawers
const showModal = ref(false)
const editingTerminal = ref<any>(null)
const showInspectModal = ref(false)
const inspectedTerminal = ref<any>(null)
const inspectedShiftSummary = ref<any>(null)
const loadingShiftSummary = ref(false)

const showForceCloseModal = ref(false)
const targetShiftTerminal = ref<any>(null)
const forceCloseForm = reactive({
  closing_cash_usd: 0,
  closing_cash_khr: 0,
  notes: 'Administrative remote shift closure',
})

const showStatusConfirm = ref(false)
const statusConfirmTarget = ref<any>(null)

const form = reactive({
  code: '',
  name: '',
  branch_id: '',
  warehouse_id: '',
  device_identifier: '',
  receipt_prefix: '',
  notes: '',
  status_code: 'ACTIVE',
})

const columns = [
  { key: 'code', label: 'Register', sortable: true },
  { key: 'branch_display', label: 'Branch', sortable: true, mobilePriority: 4 },
  { key: 'warehouse_display', label: 'Warehouse', sortable: true, mobilePriority: 5 },
  { key: 'connection', label: 'Connection', sortable: true },
  { key: 'active_shift', label: 'Active Shift', mobilePriority: 2 },
  { key: 'cashier_display', label: 'Cashier', sortable: true, mobilePriority: 1 },
  { key: 'status_code', label: 'Configuration Status', sortable: true, mobilePriority: 3 },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

// ── Heartbeat & Connection Helpers ───────────────────────────────────────────
function getHeartbeatSeconds(lastActiveAt?: string | null): number {
  if (!lastActiveAt) return Infinity
  const diffMs = Date.now() - new Date(lastActiveAt).getTime()
  return Math.max(0, Math.floor(diffMs / 1000))
}

function getConnectionState(lastActiveAt?: string | null): 'ONLINE' | 'IDLE' | 'OFFLINE' {
  const secs = getHeartbeatSeconds(lastActiveAt)
  if (secs < 45) return 'ONLINE'
  if (secs < 300) return 'IDLE'
  return 'OFFLINE'
}

function getConnectionLabel(state: 'ONLINE' | 'IDLE' | 'OFFLINE'): string {
  if (state === 'ONLINE') return 'Online'
  if (state === 'IDLE') return 'Idle'
  return 'Offline'
}

function formatLastSeen(lastActiveAt?: string | null): string {
  if (!lastActiveAt) return 'Never seen'
  const secs = getHeartbeatSeconds(lastActiveAt)
  if (secs < 15) return 'Heartbeat just now'
  if (secs < 60) return `Seen ${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `Seen ${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Seen ${hours}h ago`
  const days = Math.floor(hours / 24)
  return `Seen ${days}d ago`
}

function formatShiftTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── Enriched Rows (Resolving Branch, Warehouse, Shift & Cashier accurately) ──
const branchLookup = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {}
  for (const b of branches.value) {
    if (b?.id) map[b.id] = b
  }
  return map
})

const warehouseLookup = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {}
  for (const w of allWarehouses.value) {
    if (w?.id) map[w.id] = w
  }
  return map
})

const enrichedTerminals = computed(() => {
  const shiftMap = new Map<string, any>()
  for (const s of openShifts.value) {
    if (s.terminal_id && (s.status_code === 'OPEN' || s.status === 'OPEN')) {
      shiftMap.set(s.terminal_id, s)
    }
  }

  return terminals.value.map((t) => {
    const branchObj = branchLookup.value[t.branch_id] || t.branch
    const warehouseObj = warehouseLookup.value[t.warehouse_id] || t.warehouse
    const activeShift = shiftMap.get(t.id) || null
    const connState = getConnectionState(t.last_active_at)

    const cashierUser = activeShift?.cashier_id ? usersMap.value[activeShift.cashier_id] : null
    const cashierDisplay =
      activeShift?.cashier_name ||
      activeShift?.cashier?.full_name ||
      cashierUser?.full_name ||
      (activeShift?.cashier_id ? `Cashier #${String(activeShift.cashier_id).slice(0, 6)}` : '')

    return {
      ...t,
      branch_display: t.branch_name || branchObj?.name || 'Unassigned Branch',
      branch_code: branchObj?.code || '',
      warehouse_display: t.warehouse_name || warehouseObj?.name || 'Unassigned Warehouse',
      warehouse_is_default: Boolean(warehouseObj?.is_default),
      connection_state: connState,
      connection_label: getConnectionLabel(connState),
      connection: connState,
      active_shift: activeShift,
      cashier_display: cashierDisplay,
    }
  })
})

// ── Accurate KPI Metrics ─────────────────────────────────────────────────────
const activeConfigCount = computed(() =>
  enrichedTerminals.value.filter(t => t.status_code === 'ACTIVE').length,
)

const maintenanceOrInactiveCount = computed(() =>
  enrichedTerminals.value.filter(t => t.status_code !== 'ACTIVE').length,
)

const onlineCount = computed(() =>
  enrichedTerminals.value.filter(t => t.connection_state === 'ONLINE').length,
)

const idleCount = computed(() =>
  enrichedTerminals.value.filter(t => t.connection_state === 'IDLE').length,
)

const offlineWorkstationCount = computed(() =>
  enrichedTerminals.value.filter(t => t.connection_state === 'OFFLINE').length,
)

const openShiftsCount = computed(() =>
  enrichedTerminals.value.filter(t => Boolean(t.active_shift)).length,
)

const totalOpeningFloatUsd = computed(() =>
  enrichedTerminals.value.reduce((sum, t) => sum + Number(t.active_shift?.opening_cash_usd || 0), 0),
)

const offlineOrMaintenanceCount = computed(() =>
  enrichedTerminals.value.filter(t => t.status_code !== 'ACTIVE' || t.connection_state === 'OFFLINE').length,
)

// ── Filter Options & Filtered Rows ───────────────────────────────────────────
const branchFilterOptions = computed(() => [
  { label: 'All Branches', value: '' },
  ...branches.value.map(b => ({ label: `${b.name} (${b.code})`, value: b.id })),
])

const warehouseFilterOptions = computed(() => {
  const list = branchFilter.value
    ? allWarehouses.value.filter(w => w.branch_id === branchFilter.value)
    : allWarehouses.value
  return [
    { label: 'All Warehouses', value: '' },
    ...list.map(w => ({ label: w.name, value: w.id })),
  ]
})

const branchWarehouses = computed(() =>
  allWarehouses.value.filter(w => !form.branch_id || w.branch_id === form.branch_id),
)

const filteredTerminals = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return enrichedTerminals.value.filter((t) => {
    if (q) {
      const hay = [
        t.code,
        t.name,
        t.branch_display,
        t.branch_code,
        t.warehouse_display,
        t.cashier_display,
        t.device_identifier,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (connectionFilter.value && t.connection_state !== connectionFilter.value) return false
    if (branchFilter.value && t.branch_id !== branchFilter.value) return false
    if (warehouseFilter.value && t.warehouse_id !== warehouseFilter.value) return false
    if (configStatusFilter.value && t.status_code !== configStatusFilter.value) return false
    return true
  })
})

const paginatedTerminals = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredTerminals.value.slice(start, start + pageSize)
})

const activeFilterChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (connectionFilter.value) {
    chips.push({ key: 'connection', label: 'Connection', value: connectionFilter.value })
  }
  if (branchFilter.value) {
    const b = branchLookup.value[branchFilter.value]
    chips.push({ key: 'branch', label: 'Branch', value: b ? b.name : branchFilter.value })
  }
  if (warehouseFilter.value) {
    const w = warehouseLookup.value[warehouseFilter.value]
    chips.push({ key: 'warehouse', label: 'Warehouse', value: w ? w.name : warehouseFilter.value })
  }
  if (configStatusFilter.value) {
    chips.push({ key: 'status', label: 'Config Status', value: configStatusFilter.value })
  }
  return chips
})

const hasAnyFilter = computed(() => Boolean(searchQuery.value.trim() || activeFilterChips.value.length > 0))

function removeFilterChip(key: string) {
  if (key === 'connection') connectionFilter.value = ''
  if (key === 'branch') branchFilter.value = ''
  if (key === 'warehouse') warehouseFilter.value = ''
  if (key === 'status') configStatusFilter.value = ''
  currentPage.value = 1
}

function resetFilters() {
  searchQuery.value = ''
  connectionFilter.value = ''
  branchFilter.value = ''
  warehouseFilter.value = ''
  configStatusFilter.value = ''
  currentPage.value = 1
}

watch([searchQuery, connectionFilter, branchFilter, warehouseFilter, configStatusFilter], () => {
  currentPage.value = 1
})

// ── Data Fetching & Safe Polling ─────────────────────────────────────────────
async function loadBranchesAndUsers() {
  try {
    const [bList, uList] = await Promise.all([
      branchApi.listBranches().catch(() => []),
      userApi.listUsers().catch(() => []),
    ])
    branches.value = (bList as any[]) || []

    const uMap: Record<string, any> = {}
    for (const u of (uList as any[]) || []) {
      if (u?.id) uMap[u.id] = u
    }
    usersMap.value = uMap

    const whList: any[] = []
    for (const b of branches.value) {
      if (Array.isArray(b.warehouses) && b.warehouses.length > 0) {
        whList.push(...b.warehouses)
      } else {
        try {
          const bWhs = await branchApi.listWarehouses(b.id)
          whList.push(...((bWhs as any[]) || []))
        } catch {
          // Ignore branch warehouse fetch error
        }
      }
    }
    allWarehouses.value = whList
  } catch {
    // Fallback gracefully
  }
}

async function fetchData() {
  if (loading.value) return
  loading.value = true
  loadError.value = null
  try {
    const [termData, shiftData] = await Promise.all([
      terminalApi.listTerminals(),
      shiftApi.listShifts({ status_code: 'OPEN', limit: 100 }).catch(() => []),
    ])
    terminals.value = (termData as any[]) || []
    openShifts.value = (shiftData as any[]) || []
    lastRefreshedAt.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    // Keep inspected drawer in sync if open
    if (inspectedTerminal.value) {
      const updated = enrichedTerminals.value.find(t => t.id === inspectedTerminal.value.id)
      if (updated) inspectedTerminal.value = updated
    }
  } catch (err: any) {
    loadError.value = err?.data?.detail || err?.message || 'Unable to load POS register data.'
  } finally {
    loading.value = false
    initialLoading.value = false
  }
}

// ── Modal & Action Handlers ──────────────────────────────────────────────────
function onBranchChange() {
  const firstWh = branchWarehouses.value.find(w => w.is_default) || branchWarehouses.value[0]
  form.warehouse_id = firstWh ? firstWh.id : ''
}

function openCreateModal() {
  editingTerminal.value = null
  const defaultBranch = branches.value[0]
  form.code = `POS-0${terminals.value.length + 1}`
  form.name = `Register #${terminals.value.length + 1}`
  form.branch_id = defaultBranch?.id || ''
  onBranchChange()
  form.device_identifier = ''
  form.receipt_prefix = `POS0${terminals.value.length + 1}-`
  form.notes = ''
  form.status_code = 'ACTIVE'
  showModal.value = true
}

function openEditModal(row: any) {
  editingTerminal.value = row
  form.code = row.code
  form.name = row.name
  form.branch_id = row.branch_id || branches.value[0]?.id || ''
  form.warehouse_id = row.warehouse_id || ''
  form.device_identifier = row.device_identifier || ''
  form.receipt_prefix = row.receipt_prefix || ''
  form.notes = row.notes || ''
  form.status_code = row.status_code || 'ACTIVE'
  showModal.value = true
}

async function handleSubmit() {
  if (!form.branch_id || !form.warehouse_id) {
    toast.add({ title: 'Validation Error', description: 'Please select both a Branch and a Warehouse.', color: 'amber' })
    return
  }
  saving.value = true
  try {
    if (editingTerminal.value) {
      await terminalApi.updateTerminal(editingTerminal.value.id, {
        name: form.name.trim(),
        branch_id: form.branch_id,
        warehouse_id: form.warehouse_id,
        device_identifier: form.device_identifier.trim() || null,
        receipt_prefix: form.receipt_prefix.trim() || null,
        notes: form.notes.trim() || null,
        status_code: form.status_code,
      })
      toast.add({ title: 'Register Updated', description: `${form.code} configuration saved.`, color: 'green' })
    } else {
      await terminalApi.createTerminal({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        branch_id: form.branch_id,
        warehouse_id: form.warehouse_id,
        device_identifier: form.device_identifier.trim() || null,
        receipt_prefix: form.receipt_prefix.trim() || null,
        notes: form.notes.trim() || null,
        status_code: form.status_code,
      })
      toast.add({ title: 'Register Created', description: `${form.code.toUpperCase()} added to store.`, color: 'green' })
    }
    showModal.value = false
    await fetchData()
  } catch (err: any) {
    toast.add({ title: 'Save Failed', description: err?.data?.detail || err?.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

async function inspectTerminal(row: any) {
  inspectedTerminal.value = row
  inspectedShiftSummary.value = null
  showInspectModal.value = true

  if (row.active_shift?.id) {
    loadingShiftSummary.value = true
    try {
      inspectedShiftSummary.value = await shiftApi.getShiftSummary(row.active_shift.id)
    } catch {
      inspectedShiftSummary.value = null
    } finally {
      loadingShiftSummary.value = false
    }
  }
}

function openForceCloseModal(row: any) {
  if (!row.active_shift) {
    toast.add({ title: 'Cannot End Shift', description: 'This register does not have an open cashier shift.', color: 'amber' })
    return
  }
  targetShiftTerminal.value = row
  forceCloseForm.closing_cash_usd = Number(row.active_shift.opening_cash_usd || 0)
  forceCloseForm.closing_cash_khr = Number(row.active_shift.opening_cash_khr || 0)
  forceCloseForm.notes = 'Administrative remote shift closure'
  showForceCloseModal.value = true
}

async function handleForceCloseShift() {
  if (!targetShiftTerminal.value?.active_shift?.id) return
  closingShift.value = true
  try {
    await shiftApi.closeShift(targetShiftTerminal.value.active_shift.id, {
      closing_cash_usd: Number(forceCloseForm.closing_cash_usd || 0),
      closing_cash_khr: Number(forceCloseForm.closing_cash_khr || 0),
      notes: forceCloseForm.notes.trim() || 'Administrative remote shift closure',
    })
    toast.add({
      title: 'Shift Closed',
      description: `Active shift on ${targetShiftTerminal.value.code} has been closed and reconciled.`,
      color: 'green',
    })
    showForceCloseModal.value = false
    await fetchData()
  } catch (err: any) {
    toast.add({
      title: 'Failed to End Shift',
      description: err?.data?.detail || err?.message || 'Could not close shift.',
      color: 'red',
    })
  } finally {
    closingShift.value = false
  }
}

function promptToggleStatus(row: any) {
  if (row.status_code === 'ACTIVE' && row.active_shift) {
    toast.add({
      title: 'Active Shift Open',
      description: `Please end the open cashier shift on ${row.code} before deactivating this register.`,
      color: 'amber',
    })
    return
  }
  statusConfirmTarget.value = row
  showStatusConfirm.value = true
}

async function executeToggleStatus() {
  if (!statusConfirmTarget.value) return
  const target = statusConfirmTarget.value
  const nextStatus = target.status_code === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  togglingStatus.value = true
  try {
    await terminalApi.updateTerminal(target.id, { status_code: nextStatus })
    toast.add({
      title: nextStatus === 'ACTIVE' ? 'Register Activated' : 'Register Deactivated',
      description: `${target.name} (${target.code}) is now ${nextStatus}.`,
      color: 'green',
    })
    showStatusConfirm.value = false
    await fetchData()
  } catch (err: any) {
    toast.add({
      title: 'Status Update Failed',
      description: err?.data?.detail || err?.message,
      color: 'red',
    })
  } finally {
    togglingStatus.value = false
  }
}

// ── Visibility-Aware Auto-Refresh Timer ──────────────────────────────────────
let refreshTimer: ReturnType<typeof setInterval> | null = null

function startTimer() {
  stopTimer()
  if (!autoRefresh.value) return
  refreshTimer = setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    fetchData()
  }, 15000)
}

function stopTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    fetchData()
    startTimer()
  } else {
    stopTimer()
  }
}

function handleVisibilityChange() {
  if (typeof document === 'undefined') return
  if (document.visibilityState === 'visible' && autoRefresh.value) {
    fetchData()
  }
}

onMounted(async () => {
  await loadBranchesAndUsers()
  await fetchData()
  startTimer()
  if (import.meta.client) {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
})

onBeforeUnmount(() => {
  stopTimer()
  if (import.meta.client) {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
})
</script>

