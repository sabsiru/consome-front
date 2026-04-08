<template>
  <div class="admin-report-view">
    <h1>신고 관리</h1>

    <!-- 필터 -->
    <div class="filter-bar">
      <select v-model="filterStatus">
        <option value="">전체 상태</option>
        <option value="PENDING">대기</option>
        <option value="RESOLVED">처리완료</option>
        <option value="REJECTED">반려</option>
      </select>
      <button @click="loadReports(0)">조회</button>
      <button @click="resetFilter">초기화</button>
      <button class="back-btn" @click="$router.back()">뒤로가기</button>
    </div>

    <!-- 신고 목록 (그룹화) -->
    <table class="report-table">
      <thead>
        <tr>
          <th>번호</th>
          <th>대상</th>
          <th>유형</th>
          <th>신고 건수</th>
          <th>신고자</th>
          <th>상태</th>
          <th>최초/최근 신고</th>
          <th>관리</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(r, index) in reports" :key="`${r.targetType}-${r.targetId}`">
          <tr :class="{ 'row-expanded': isExpanded(r) }" @click="toggleExpand(r)">
            <td>{{ page * 20 + index + 1 }}</td>
            <td>
              <a
                v-if="r.targetUserId"
                :href="`/users/${r.targetUserId}`"
                target="_blank"
                class="user-link"
                @click.stop
              >
                {{ r.targetUserNickname || '-' }}
              </a>
              <span v-else>-</span>
            </td>
            <td>{{ targetTypeLabel(r.targetType) }}</td>
            <td>
              <span class="report-count" :class="{ 'count-high': r.reportCount >= 3 }">
                {{ r.reportCount }}건
              </span>
            </td>
            <td>
              <span class="reporter-summary" @click.stop="openReportersModal(r)">
                {{ r.firstReporterNickname }}
                <span v-if="r.otherReporterCount > 0" class="other-count">
                  외 {{ r.otherReporterCount }}명
                </span>
              </span>
            </td>
            <td :class="statusClass(r.status)">
              <template v-if="r.status === 'RESOLVED'">
                <template v-if="r.suspensionType">
                  <span class="suspension-badge" :class="{ 'badge-expired': isSuspensionExpired(r) }">
                    {{ suspensionLabel(r.suspensionType) }}
                  </span>
                  <span class="suspension-period">
                    {{ getSuspensionPeriod(r) }}
                  </span>
                </template>
                <span v-else>제재 없음</span>
              </template>
              <template v-else>
                {{ statusLabel(r.status) }}
              </template>
            </td>
            <td class="date-cell">
              <div>{{ formatDate(r.firstReportedAt) }}</div>
              <div v-if="r.reportCount > 1" class="last-date">
                ~ {{ formatDate(r.lastReportedAt) }}
              </div>
            </td>
            <td>
              <template v-if="r.status === 'PENDING'">
                <button class="resolve-btn" @click.stop="openSuspendModal(r)">처리</button>
                <button class="reject-btn" @click.stop="rejectAll(r)">반려</button>
              </template>
              <span v-else-if="r.status === 'RESOLVED'" class="status-complete">완료</span>
              <span v-else class="status-rejected-text">반려됨</span>
            </td>
          </tr>
          <!-- 확장 행: 콘텐츠 미리보기 -->
          <tr v-if="isExpanded(r) && r.targetType !== 'USER'" class="expanded-row">
            <td colspan="8">
              <div class="content-preview">
                <div class="preview-header">
                  <span class="preview-label">{{ r.targetType === 'POST' ? '게시글 내용' : '댓글 내용' }}</span>
                  <a
                    v-if="r.targetType === 'POST'"
                    :href="`/boards/${r.boardId}/posts/${r.postId}`"
                    target="_blank"
                    class="preview-link"
                  >
                    원본 보기 →
                  </a>
                  <a
                    v-else-if="r.targetType === 'COMMENT'"
                    :href="`/boards/${r.boardId}/posts/${r.postId}#comment-${r.targetId}`"
                    target="_blank"
                    class="preview-link"
                  >
                    원본 보기 →
                  </a>
                </div>
                <div class="preview-content">
                  {{ r.targetContent || '(콘텐츠 없음 또는 삭제됨)' }}
                </div>
              </div>
            </td>
          </tr>
        </template>
        <tr v-if="reports.length === 0">
          <td colspan="8" class="empty">신고 내역이 없습니다.</td>
        </tr>
      </tbody>
    </table>

    <!-- 페이지네이션 -->
    <div class="pagination">
      <button :disabled="page === 0" @click="loadReports(page - 1)">이전</button>
      <span>{{ page + 1 }} / {{ totalPages || 1 }}</span>
      <button :disabled="page + 1 >= totalPages" @click="loadReports(page + 1)">다음</button>
    </div>

    <!-- 신고자 목록 모달 -->
    <div v-if="showReportersModal" class="modal-overlay" @click.self="closeReportersModal">
      <div class="reporters-modal">
        <div class="modal-header">
          <h3>신고자 목록 ({{ reporters.length }}명)</h3>
          <button class="close-btn" @click="closeReportersModal">×</button>
        </div>
        <div class="reporters-list">
          <div v-for="rep in reporters" :key="rep.reportId" class="reporter-item">
            <div class="reporter-info">
              <a :href="`/users/${rep.reporterId}`" target="_blank" class="reporter-name">
                {{ rep.reporterNickname }}
              </a>
              <span class="report-reason">{{ reasonLabel(rep.reason) }}</span>
            </div>
            <div v-if="rep.description" class="reporter-desc">
              {{ rep.description }}
            </div>
            <div class="reporter-date">{{ formatDateTime(rep.createdAt) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 제재 모달 -->
    <div v-if="showSuspendModal" class="modal-overlay" @click.self="closeSuspendModal">
      <div class="suspend-modal">
        <h3>신고 처리 및 제재</h3>
        <p class="modal-info">
          피신고자: <strong>{{ selectedReport?.targetUserNickname }}</strong>
          <span class="report-count-info">(신고 {{ selectedReport?.reportCount }}건)</span>
        </p>

        <div class="suspend-options">
          <label class="suspend-option">
            <input type="radio" value="" v-model="selectedSuspensionType" />
            <span>제재 없이 처리</span>
          </label>
          <label v-for="opt in suspensionTypes" :key="opt.value" class="suspend-option">
            <input type="radio" :value="opt.value" v-model="selectedSuspensionType" />
            <span>{{ opt.label }}</span>
          </label>
        </div>

        <div class="suspend-reason" v-if="selectedSuspensionType">
          <input v-model="suspendReason" placeholder="제재 사유 (선택)" />
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="closeSuspendModal">취소</button>
          <button class="confirm-btn" @click="confirmResolve">처리 완료</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getGroupedReports, getReportersByTarget, resolveReport, rejectReport } from '@/api/reportApi.js'
import { suspendUser } from '@/api/adminApi.js'
import { toast } from 'vue-sonner'
import { useUserStore } from '@/stores/userStore.js'

const userStore = useUserStore()

const reports = ref([])
const page = ref(0)
const totalPages = ref(0)
const filterStatus = ref('')
const expandedKey = ref(null)

// 신고자 모달
const showReportersModal = ref(false)
const reporters = ref([])

// 제재 모달
const showSuspendModal = ref(false)
const selectedReport = ref(null)
const selectedSuspensionType = ref('')
const suspendReason = ref('')

const suspensionTypes = [
  { value: 'DAY_1', label: '1일 정지' },
  { value: 'DAY_2', label: '2일 정지' },
  { value: 'DAY_3', label: '3일 정지' },
  { value: 'DAY_7', label: '7일 정지' },
  { value: 'DAY_15', label: '15일 정지' },
  { value: 'DAY_30', label: '30일 정지' },
  { value: 'PERMANENT', label: '영구 정지' }
]

const getKey = (r) => `${r.targetType}-${r.targetId}`

const isExpanded = (r) => expandedKey.value === getKey(r)

const loadReports = async (p = 0) => {
  try {
    const { data } = await getGroupedReports(filterStatus.value || null, p, 20)
    reports.value = data.content || []
    page.value = data.number || 0
    totalPages.value = data.totalPages || 0
  } catch (e) {
    toast.error('신고 목록을 불러오지 못했습니다.')
  }
}

const resetFilter = () => {
  filterStatus.value = ''
  loadReports(0)
}

const toggleExpand = (r) => {
  const key = getKey(r)
  expandedKey.value = expandedKey.value === key ? null : key
}

const openReportersModal = async (r) => {
  try {
    const { data } = await getReportersByTarget(r.targetType, r.targetId)
    reporters.value = data
    showReportersModal.value = true
  } catch (e) {
    toast.error('신고자 목록을 불러오지 못했습니다.')
  }
}

const closeReportersModal = () => {
  showReportersModal.value = false
  reporters.value = []
}

const openSuspendModal = (report) => {
  selectedReport.value = report
  selectedSuspensionType.value = ''
  suspendReason.value = ''
  showSuspendModal.value = true
}

const closeSuspendModal = () => {
  showSuspendModal.value = false
  selectedReport.value = null
}

const confirmResolve = async () => {
  try {
    // 해당 대상의 모든 신고자 조회
    const { data: allReporters } = await getReportersByTarget(
      selectedReport.value.targetType,
      selectedReport.value.targetId
    )

    // 제재 적용 (선택된 경우)
    if (selectedSuspensionType.value && selectedReport.value.targetUserId) {
      await suspendUser(
        selectedReport.value.targetUserId,
        selectedSuspensionType.value,
        suspendReason.value || '신고 처리'
      )
    }

    // 모든 PENDING 신고 처리
    for (const rep of allReporters) {
      try {
        await resolveReport(rep.reportId, selectedSuspensionType.value || null)
      } catch (e) {
        // 이미 처리된 신고는 무시
      }
    }

    closeSuspendModal()
    loadReports(page.value)
    toast.success('처리되었습니다.')
  } catch (e) {
    toast.error(e.response?.data?.message || '처리에 실패했습니다.')
  }
}

const rejectAll = async (r) => {
  if (!confirm(`${r.reportCount}건의 신고를 모두 반려하시겠습니까?`)) return
  try {
    const { data: allReporters } = await getReportersByTarget(r.targetType, r.targetId)
    for (const rep of allReporters) {
      try {
        await rejectReport(rep.reportId)
      } catch (e) {
        // 이미 처리된 신고는 무시
      }
    }
    loadReports(page.value)
    toast.success('반려되었습니다.')
  } catch (e) {
    toast.error(e.response?.data?.message || '반려에 실패했습니다.')
  }
}

const targetTypeLabel = (type) => {
  const map = { POST: '게시글', COMMENT: '댓글', USER: '사용자' }
  return map[type] || type
}

const reasonLabel = (reason) => {
  const map = { SPAM: '스팸/도배', ABUSE: '욕설/비방', ADULT: '음란물', ILLEGAL: '불법정보', OTHER: '기타' }
  return map[reason] || reason
}

const statusLabel = (status) => {
  const map = { PENDING: '대기', RESOLVED: '처리완료', REJECTED: '반려' }
  return map[status] || status
}

const suspensionLabel = (type) => {
  const opt = suspensionTypes.find(t => t.value === type)
  return opt ? opt.label : type
}

const isSuspensionExpired = (r) => {
  if (r.suspensionType === 'PERMANENT') return false
  if (!r.suspensionEndAt) return false
  return new Date(r.suspensionEndAt) < new Date()
}

const getSuspensionPeriod = (r) => {
  if (r.suspensionType === 'PERMANENT') return '(영구)'
  if (!r.suspensionEndAt) return ''
  const endDate = new Date(r.suspensionEndAt)
  const now = new Date()
  const dateStr = `${endDate.getMonth() + 1}/${endDate.getDate()} ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
  if (endDate < now) return `(~${dateStr} 해제)`
  return `(~${dateStr})`
}

const statusClass = (status) => {
  return {
    'status-pending': status === 'PENDING',
    'status-resolved': status === 'RESOLVED',
    'status-rejected': status === 'REJECTED'
  }
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatDateTime = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${formatDate(isoString)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => loadReports(0))
</script>

<style scoped>
.admin-report-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-report-view h1 {
  margin-bottom: 24px;
  font-size: 24px;
  color: var(--text-primary);
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-bar select,
.filter-bar button {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.filter-bar button {
  cursor: pointer;
}

.filter-bar button:hover {
  border-color: var(--accent);
}

.back-btn {
  margin-left: auto;
}

.user-link {
  color: var(--accent);
  text-decoration: none;
}

.user-link:hover {
  text-decoration: underline;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.report-table th,
.report-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.report-table th {
  background: var(--bg-tertiary);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 13px;
}

.report-table td {
  color: var(--text-primary);
  font-size: 14px;
}

.report-table tbody tr:not(.expanded-row) {
  cursor: pointer;
  transition: background 0.15s;
}

.report-table tbody tr:not(.expanded-row):hover {
  background: var(--bg-tertiary);
}

.row-expanded {
  background: var(--bg-tertiary);
}

.report-count {
  display: inline-block;
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.count-high {
  background: var(--danger);
  color: #fff;
}

.reporter-summary {
  cursor: pointer;
  color: var(--accent);
}

.reporter-summary:hover {
  text-decoration: underline;
}

.other-count {
  color: var(--text-secondary);
  font-size: 12px;
  margin-left: 4px;
}

.date-cell {
  font-size: 13px;
}

.last-date {
  color: var(--text-secondary);
  font-size: 12px;
}

.expanded-row td {
  padding: 0 !important;
  background: var(--bg-primary);
}

.content-preview {
  padding: 16px 20px;
  border-left: 3px solid var(--accent);
  margin: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 0 8px 8px 0;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.preview-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.preview-link {
  font-size: 13px;
  color: var(--accent);
  text-decoration: none;
}

.preview-link:hover {
  text-decoration: underline;
}

.preview-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 32px !important;
}

.status-pending {
  color: var(--warning);
  font-weight: 600;
}

.status-resolved {
  color: var(--success);
}

.status-rejected {
  color: var(--text-muted);
}

.suspension-badge {
  display: inline-block;
  padding: 2px 8px;
  background: var(--danger);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
}

.suspension-badge.badge-expired {
  background: var(--text-muted);
}

.suspension-period {
  margin-left: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.status-complete {
  color: var(--success);
  font-weight: 500;
}

.status-rejected-text {
  color: var(--text-muted);
}

.resolve-btn,
.reject-btn {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  margin-right: 4px;
}

.resolve-btn:hover {
  border-color: var(--success);
  color: var(--success);
}

.reject-btn:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
  border-color: var(--accent);
}

/* 신고자 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reporters-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  margin: 16px;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
}

.close-btn:hover {
  color: var(--text-primary);
}

.reporters-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
}

.reporter-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.reporter-item:last-child {
  border-bottom: none;
}

.reporter-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reporter-name {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
}

.reporter-name:hover {
  text-decoration: underline;
}

.report-reason {
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.reporter-desc {
  margin-top: 6px;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.reporter-date {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

/* 제재 모달 */
.suspend-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 420px;
  margin: 16px;
}

.suspend-modal h3 {
  margin-bottom: 16px;
  color: var(--text-primary);
  font-size: 18px;
}

.modal-info {
  margin-bottom: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.modal-info strong {
  color: var(--text-primary);
}

.report-count-info {
  margin-left: 8px;
  color: var(--warning);
  font-weight: 500;
}

.suspend-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  max-height: 280px;
  overflow-y: auto;
}

.suspend-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.15s;
}

.suspend-option:hover {
  border-color: var(--accent);
}

.suspend-option:has(input:checked) {
  border-color: var(--accent);
  background: var(--accent-dim);
}

.suspend-option input {
  accent-color: var(--accent);
}

.suspend-reason {
  margin-bottom: 16px;
}

.suspend-reason input {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
}

.suspend-reason input:focus {
  outline: none;
  border-color: var(--accent);
}

.modal-actions {
  display: flex;
  gap: 8px;
}

.modal-actions .cancel-btn {
  flex: 1;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.modal-actions .confirm-btn {
  flex: 1;
  padding: 12px;
  background: var(--accent);
  border: none;
  border-radius: 6px;
  color: var(--bg-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.modal-actions .confirm-btn:hover {
  opacity: 0.9;
}
</style>
