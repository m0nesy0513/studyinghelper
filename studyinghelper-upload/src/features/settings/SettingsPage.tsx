import { Key, Database, Download, Upload, Shield } from 'lucide-react'
import GlassCard from '@/components/layout/GlassCard'

function SettingRow({ icon: Icon, title, desc, action }: {
  icon: React.FC<{ className?: string }>
  title: string
  desc: string
  action: React.ReactNode
}) {
  return (
    <GlassCard className="flex items-center gap-4 !p-4">
      <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[rgba(255,255,255,0.3)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[rgba(255,255,255,0.7)]">{title}</p>
        <p className="text-xs text-[rgba(255,255,255,0.3)]">{desc}</p>
      </div>
      <div className="flex-shrink-0">
        {action}
      </div>
    </GlassCard>
  )
}

export default function SettingsPage(): React.ReactElement {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold gradient-text mb-6">设置</h1>

      <div className="space-y-3">
        {/* AI API Key */}
        <SettingRow
          icon={Key}
          title="DeepSeek API Key"
          desc="用于 AI 对话、闪卡生成、练习题生成等功能。API Key 会加密存储，不会明文保存。"
          action={
            <button className="btn-secondary text-xs !py-1.5 !px-3" disabled>
              未设置
            </button>
          }
        />

        {/* Data management */}
        <SettingRow
          icon={Database}
          title="数据导出"
          desc="将所有课程、笔记、闪卡等数据导出为 JSON 文件。"
          action={
            <button className="btn-ghost text-xs !py-1.5 !px-3" disabled>
              <Download className="w-3 h-3" />
              导出
            </button>
          }
        />

        <SettingRow
          icon={Database}
          title="数据导入"
          desc="从之前导出的 JSON 文件恢复数据。"
          action={
            <button className="btn-ghost text-xs !py-1.5 !px-3" disabled>
              <Upload className="w-3 h-3" />
              导入
            </button>
          }
        />

        {/* Security note */}
        <SettingRow
          icon={Shield}
          title="安全说明"
          desc="所有数据存储在本地。API Key 使用操作系统安全模块加密。应用不会上传任何数据到云端。"
          action={<span className="text-[10px] text-[rgba(255,255,255,0.2)]">本地优先</span>}
        />
      </div>

      {/* Storage info */}
      <GlassCard className="mt-6 !p-4">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-[rgba(255,255,255,0.25)]" />
          <div>
            <p className="text-xs text-[rgba(255,255,255,0.35)]">数据位置</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.18)] font-mono">
              %APPDATA%/studyinghelper/studyinghelper.db
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
