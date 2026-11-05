/**
 * Application Translation & Localization Composable.
 *
 * Fast multi-language UI localization for English, Khmer (ភាសាខ្មែរ),
 * Chinese (中文), Japanese (日本語), and Korean (한국어).
 * Backed by backend TRANSLATE_MODEL & Redis cache with instant local fallback.
 */

import { API_ENDPOINTS } from '~/api/endpoints'

export type LocaleCode = 'en' | 'km' | 'cn' | 'jp' | 'kr'

export interface LocaleOption {
  code: LocaleCode
  name: string
  native: string
  flag: string
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ', flag: '🇰🇭' },
  { code: 'cn', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'jp', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'kr', name: 'Korean', native: '한국어', flag: '🇰🇷' },
]

// Baseline offline cache to guarantee zero-flash and sub-millisecond local rendering
const BASELINE_TRANSLATIONS: Record<LocaleCode, Record<string, string>> = {
  en: {
    'nav_section.overview': 'Overview',
    'nav_section.store': 'Store',
    'nav_section.catalog': 'Catalog',
    'nav_section.inventory': 'Inventory',
    'nav_section.purchasing': 'Purchasing',
    'nav_section.customers': 'Customers',
    'nav_section.finance': 'Finance',
    'nav_section.reports': 'Reports',
    'nav_section.administration': 'Administration',
    'nav.dashboard': 'Dashboard',
    'nav.pos_registers': 'POS Registers',
    'nav.receipt_templates': 'Receipt Templates',
    'nav.sales_orders': 'Sales Orders',
    'nav.returns': 'Returns',
    'nav.products': 'Products',
    'nav.categories': 'Categories',
    'nav.brands': 'Brands',
    'nav.print_labels': 'Print Labels',
    'nav.stock_levels': 'Stock Levels',
    'nav.movements': 'Movements',
    'nav.transfers': 'Transfers',
    'nav.adjustments': 'Adjustments',
    'nav.purchase_orders': 'Purchase Orders',
    'nav.suppliers': 'Suppliers',
    'nav.promotions': 'Promotions',
    'nav.expenses': 'Expenses',
    'nav.sales_report': 'Sales Report',
    'nav.inventory_report': 'Inventory Report',
    'nav.purchases_report': 'Purchases Report',
    'nav.profit_loss': 'Profit & Loss',
    'nav.users': 'Users',
    'nav.roles': 'Roles',
    'nav.audit_logs': 'Audit Logs',
    'nav.integrations': 'Integrations',
    'nav.translations': 'Translations CMS',
    'nav.settings': 'Settings',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.add': 'Add',
    'common.search': 'Search...',
    'common.filter': 'Filter',
    'common.reset': 'Reset',
    'common.refresh': 'Refresh',
    'common.export_csv': 'Export CSV',
    'common.print': 'Print',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.submit': 'Submit',
    'common.back': 'Back',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.loading': 'Loading...',
    'common.no_data': 'No data found',
    'common.open_pos': 'Open POS',
    'common.language': 'Language',
  },
  km: {
    'nav_section.overview': 'ទិដ្ឋភាពទូទៅ',
    'nav_section.store': 'ហាង',
    'nav_section.catalog': 'កាតាឡុក',
    'nav_section.inventory': 'សារពើភ័ណ្ឌ',
    'nav_section.purchasing': 'ការទិញចូល',
    'nav_section.customers': 'អតិថិជន',
    'nav_section.finance': 'ហិរញ្ញវត្ថុ',
    'nav_section.reports': 'របាយការណ៍',
    'nav_section.administration': 'ការគ្រប់គ្រងប្រព័ន្ធ',
    'nav.dashboard': 'ផ្ទាំងព័ត៌មាន',
    'nav.pos_registers': 'ម៉ាស៊ីនគិតប្រាក់ POS',
    'nav.receipt_templates': 'គំរូវិក្កយបត្រ',
    'nav.sales_orders': 'បញ្ជាទិញលក់',
    'nav.returns': 'ការប្តូរ/សងទំនិញ',
    'nav.products': 'ផលិតផល',
    'nav.categories': 'ប្រភេទផលិតផល',
    'nav.brands': 'ម៉ាកយីហោ',
    'nav.print_labels': 'បោះពុម្ពស្លាកបាកូដ',
    'nav.stock_levels': 'ចំនួនស្តុក',
    'nav.movements': 'បន្លាស់ទីស្តុក',
    'nav.transfers': 'ផ្ទេរទំនិញ',
    'nav.adjustments': 'ការកែតម្រូវស្តុក',
    'nav.purchase_orders': 'ការបញ្ជាទិញទំនិញ',
    'nav.suppliers': 'អ្នកផ្គត់ផ្គង់',
    'nav.promotions': 'ការបញ្ចុះតម្លៃ & ប្រូម៉ូសិន',
    'nav.expenses': 'ចំណាយប្រតិបត្តិការ',
    'nav.sales_report': 'របាយការណ៍លក់',
    'nav.inventory_report': 'របាយការណ៍ស្តុក',
    'nav.purchases_report': 'របាយការណ៍ទិញចូល',
    'nav.profit_loss': 'ចំណេញ & ខាត',
    'nav.users': 'អ្នកប្រើប្រាស់',
    'nav.roles': 'តួនាទី & សិទ្ធិ',
    'nav.audit_logs': 'កំណត់ហេតុសវនកម្ម',
    'nav.integrations': 'ការតភ្ជាប់ប្រព័ន្ធ',
    'nav.translations': 'ការគ្រប់គ្រងខ្លឹមសារ & ភាសា',
    'nav.settings': 'ការកំណត់ហាង',
    'common.save': 'រក្សាទុក',
    'common.cancel': 'បោះបង់',
    'common.delete': 'លុប',
    'common.edit': 'កែប្រែ',
    'common.create': 'បង្កើត',
    'common.add': 'បន្ថែម',
    'common.search': 'ស្វែងរក...',
    'common.filter': 'ចម្រោះ',
    'common.reset': 'កំណត់ឡើងវិញ',
    'common.refresh': 'ផ្ទុកឡើងវិញ',
    'common.export_csv': 'ទាញយក CSV',
    'common.print': 'បោះពុម្ព',
    'common.close': 'បិទ',
    'common.confirm': 'បញ្ជាក់',
    'common.submit': 'ដាក់ស្នើ',
    'common.back': 'ថយក្រោយ',
    'common.actions': 'សកម្មភាព',
    'common.status': 'ស្ថានភាព',
    'common.loading': 'កំពុងដំណើរការ...',
    'common.no_data': 'មិនមានទិន្នន័យទេ',
    'common.open_pos': 'បើកម៉ាស៊ីន POS',
    'common.language': 'ភាសា',
  },
  cn: {
    'nav_section.overview': '概览',
    'nav_section.store': '门店',
    'nav_section.catalog': '目录',
    'nav_section.inventory': '库存',
    'nav_section.purchasing': '采购',
    'nav_section.customers': '客户',
    'nav_section.finance': '财务',
    'nav_section.reports': '报表',
    'nav_section.administration': '系统管理',
    'nav.dashboard': '仪表板',
    'nav.pos_registers': '收银机终端',
    'nav.receipt_templates': '小票模板',
    'nav.sales_orders': '销售订单',
    'nav.returns': '退换货',
    'nav.products': '商品列表',
    'nav.categories': '商品分类',
    'nav.brands': '品牌管理',
    'nav.print_labels': '打印条码标签',
    'nav.stock_levels': '库存余量',
    'nav.movements': '库存变动',
    'nav.transfers': '调拨管理',
    'nav.adjustments': '盘点调整',
    'nav.purchase_orders': '采购订单',
    'nav.suppliers': '供应商',
    'nav.promotions': '促销活动',
    'nav.expenses': '费用支出',
    'nav.sales_report': '销售报表',
    'nav.inventory_report': '库存报表',
    'nav.purchases_report': '采购报表',
    'nav.profit_loss': '损益表',
    'nav.users': '用户管理',
    'nav.roles': '角色权限',
    'nav.audit_logs': '审计日志',
    'nav.integrations': '集成中心',
    'nav.translations': '多语言内容管理',
    'nav.settings': '店铺设置',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.create': '新建',
    'common.add': '添加',
    'common.search': '搜索...',
    'common.filter': '筛选',
    'common.reset': '重置',
    'common.refresh': '刷新',
    'common.export_csv': '导出 CSV',
    'common.print': '打印',
    'common.close': '关闭',
    'common.confirm': '确认',
    'common.submit': '提交',
    'common.back': '返回',
    'common.actions': '操作',
    'common.status': '状态',
    'common.loading': '加载中...',
    'common.no_data': '暂无数据',
    'common.open_pos': '进入收银',
    'common.language': '语言',
  },
  jp: {
    'nav_section.overview': '概要',
    'nav_section.store': '店舗',
    'nav_section.catalog': 'カタログ',
    'nav_section.inventory': '在庫',
    'nav_section.purchasing': '仕入れ',
    'nav_section.customers': '顧客',
    'nav_section.finance': '財務',
    'nav_section.reports': 'レポート',
    'nav_section.administration': 'システム管理',
    'nav.dashboard': 'ダッシュボード',
    'nav.pos_registers': 'POSレジ端末',
    'nav.receipt_templates': 'レシート雛形',
    'nav.sales_orders': '販売注文',
    'nav.returns': '返品管理',
    'nav.products': '商品一覧',
    'nav.categories': 'カテゴリー',
    'nav.brands': 'ブランド',
    'nav.print_labels': 'バーコードラベル印刷',
    'nav.stock_levels': '在庫水準',
    'nav.movements': '在庫移動履歴',
    'nav.transfers': '在庫転送',
    'nav.adjustments': '在庫調整',
    'nav.purchase_orders': '発注書',
    'nav.suppliers': '仕入先',
    'nav.promotions': 'プロモーション',
    'nav.expenses': '経費管理',
    'nav.sales_report': '売上レポート',
    'nav.inventory_report': '在庫レポート',
    'nav.purchases_report': '仕入レポート',
    'nav.profit_loss': '損益計算書',
    'nav.users': 'ユーザー管理',
    'nav.roles': '役割と権限',
    'nav.audit_logs': '監査ログ',
    'nav.integrations': '連携ハブ',
    'nav.translations': '多言語コンテンツ管理',
    'nav.settings': '店舗設定',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.create': '新規作成',
    'common.add': '追加',
    'common.search': '検索...',
    'common.filter': '絞り込み',
    'common.reset': 'リセット',
    'common.refresh': '更新',
    'common.export_csv': 'CSVエクスポート',
    'common.print': '印刷',
    'common.close': '閉じる',
    'common.confirm': '確認',
    'common.submit': '送信',
    'common.back': '戻る',
    'common.actions': '操作',
    'common.status': '状態',
    'common.loading': '読み込み中...',
    'common.no_data': 'データがありません',
    'common.open_pos': 'POSを開く',
    'common.language': '言語',
  },
  kr: {
    'nav_section.overview': '개요',
    'nav_section.store': '매장',
    'nav_section.catalog': '카탈로그',
    'nav_section.inventory': '재고',
    'nav_section.purchasing': '구매',
    'nav_section.customers': '고객',
    'nav_section.finance': '재무',
    'nav_section.reports': '보고서',
    'nav_section.administration': '시스템 관리',
    'nav.dashboard': '대시보드',
    'nav.pos_registers': 'POS 단말기',
    'nav.receipt_templates': '영수증 템플릿',
    'nav.sales_orders': '판매 주문',
    'nav.returns': '반품 관리',
    'nav.products': '상품 목록',
    'nav.categories': '카테고리',
    'nav.brands': '브랜드',
    'nav.print_labels': '바코드 라벨 인쇄',
    'nav.stock_levels': '재고 현황',
    'nav.movements': '재고 변동 내역',
    'nav.transfers': '재고 이전',
    'nav.adjustments': '재고 조정',
    'nav.purchase_orders': '발주서',
    'nav.suppliers': '공급업체',
    'nav.promotions': '프로모션',
    'nav.expenses': '지출 관리',
    'nav.sales_report': '매출 보고서',
    'nav.inventory_report': '재고 보고서',
    'nav.purchases_report': '구매 보고서',
    'nav.profit_loss': '손익 계산서',
    'nav.users': '사용자 관리',
    'nav.roles': '역할 및 권한',
    'nav.audit_logs': '감사 로그',
    'nav.integrations': '연동 허브',
    'nav.translations': '다국어 콘텐츠 관리',
    'nav.settings': '매장 설정',
    'common.save': '저장',
    'common.cancel': '취소',
    'common.delete': '삭제',
    'common.edit': '수정',
    'common.create': '생성',
    'common.add': '추가',
    'common.search': '검색...',
    'common.filter': '필터',
    'common.reset': '재설정',
    'common.refresh': '새로고침',
    'common.export_csv': 'CSV 내보내기',
    'common.print': '인쇄',
    'common.close': '닫기',
    'common.confirm': '확인',
    'common.submit': '제출',
    'common.back': '뒤로',
    'common.actions': '작업',
    'common.status': '상태',
    'common.loading': '로딩 중...',
    'common.no_data': '데이터 없음',
    'common.open_pos': 'POS 열기',
    'common.language': '언어',
  },
}

export function useAppTranslation() {
  const currentLocale = useState<LocaleCode>('app_current_locale', () => {
    if (import.meta.client) {
      const stored = localStorage.getItem('admin_locale') as LocaleCode
      if (stored && ['en', 'km', 'cn', 'jp', 'kr'].includes(stored)) {
        return stored
      }
    }
    return 'en'
  })

  const translations = useState<Record<LocaleCode, Record<string, string>>>(
    'app_translations_registry',
    () => BASELINE_TRANSLATIONS,
  )

  const isLoaded = useState<boolean>('app_translations_loaded', () => false)

  /**
   * Synchronous instantaneous translation lookup.
   */
  function t(key: string, fallback?: string): string {
    const loc = currentLocale.value || 'en'
    const dict = translations.value[loc]
    if (dict && dict[key]) {
      return dict[key]
    }
    // Fallback to English dictionary
    const enDict = translations.value['en']
    if (enDict && enDict[key]) {
      return enDict[key]
    }
    return fallback !== undefined ? fallback : key
  }

  /**
   * Fetch latest translations from backend TRANSLATE_MODEL (cached in Redis).
   */
  async function fetchTranslations() {
    if (!import.meta.client) return
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<any>(API_ENDPOINTS.system.translations, {
        params: { schema_name: 'admin_front' },
      })

      if (data && data.locales) {
        for (const loc of ['en', 'km', 'cn', 'jp', 'kr'] as LocaleCode[]) {
          if (data.locales[loc]) {
            translations.value[loc] = {
              ...translations.value[loc],
              ...data.locales[loc],
            }
          }
        }
        localStorage.setItem('admin_cached_translations', JSON.stringify(translations.value))
        isLoaded.value = true
      }
    } catch {
      // Local cache fallback
      const cached = localStorage.getItem('admin_cached_translations')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          translations.value = { ...translations.value, ...parsed }
        } catch {}
      }
    }
  }

  /**
   * Set active language.
   */
  function setLocale(code: LocaleCode) {
    if (['en', 'km', 'cn', 'jp', 'kr'].includes(code)) {
      currentLocale.value = code
      if (import.meta.client) {
        localStorage.setItem('admin_locale', code)
        document.documentElement.lang = code
      }
    }
  }

  return {
    currentLocale,
    supportedLocales: SUPPORTED_LOCALES,
    t,
    setLocale,
    fetchTranslations,
    isLoaded,
  }
}
