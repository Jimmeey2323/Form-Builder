import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileCode,
  MoreHorizontal,
  Copy,
  Trash2,
  ExternalLink,
  Webhook,
  BarChart3,
  Sheet,
  Layers,
  CheckSquare,
  Square,
  Rocket,
  ChevronRight,
} from 'lucide-react';
import { FormConfig } from '@/types/formField';

const CARD_GRADIENTS = [
  ['from-blue-500 to-indigo-600',   'bg-blue-50',   'text-blue-700',   'border-blue-200/70'],
  ['from-violet-500 to-purple-600', 'bg-violet-50', 'text-violet-700', 'border-violet-200/70'],
  ['from-emerald-500 to-teal-600',  'bg-emerald-50','text-emerald-700','border-emerald-200/70'],
  ['from-rose-500 to-pink-600',     'bg-rose-50',   'text-rose-700',   'border-rose-200/70'],
  ['from-amber-500 to-orange-500',  'bg-amber-50',  'text-amber-700',  'border-amber-200/70'],
  ['from-cyan-500 to-sky-600',      'bg-cyan-50',   'text-cyan-700',   'border-cyan-200/70'],
];

function hashIndex(id: string, len: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % len;
}

interface FormCardProps {
  form: FormConfig;
  isActive: boolean;
  isSelected: boolean;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
  onToggleSelect: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export function FormCard({
  form,
  isActive,
  isSelected,
  viewMode,
  onSelect,
  onToggleSelect,
  onCopy,
  onDelete,
}: FormCardProps) {
  const idx = hashIndex(form.id, CARD_GRADIENTS.length);
  const [gradient, lightBg, lightText, lightBorder] = CARD_GRADIENTS[idx];

  const handleCardClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onSelect(); };
  const handleCheckboxClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(); };

  const formatDate = (d: string) => {
    const diff = Math.ceil(Math.abs(Date.now() - new Date(d).getTime()) / 86400000);
    if (diff <= 1) return 'Today';
    if (diff === 2) return 'Yesterday';
    if (diff <= 7) return `${diff - 1}d ago`;
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const integrations = [
    form.webhookConfig?.enabled && { icon: <Webhook className="h-2.5 w-2.5" />, label: 'Webhook', color: 'text-indigo-600 border-indigo-200/80 bg-indigo-50' },
    form.googleSheetsConfig?.enabled && { icon: <Sheet className="h-2.5 w-2.5" />, label: 'Sheets', color: 'text-emerald-600 border-emerald-200/80 bg-emerald-50' },
    (form.pixelConfig?.snapPixelId || form.pixelConfig?.metaPixelId || form.pixelConfig?.googleAdsId) &&
      { icon: <BarChart3 className="h-2.5 w-2.5" />, label: 'Pixels', color: 'text-blue-600 border-blue-200/80 bg-blue-50' },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; color: string }[];

  const ActionsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-black/8"
          onClick={e => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl border-border/60">
        {form.deployedUrl && (
          <>
            <DropdownMenuItem asChild>
              <a href={form.deployedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5" /> View Live
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={e => { e.stopPropagation(); onCopy(); }} className="gap-2">
          <Copy className="h-3.5 w-3.5" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(); }} className="gap-2 text-red-600 focus:text-red-600">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  /* ── LIST VIEW ── */
  if (viewMode === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 ${
          isActive
            ? `${lightBg} ${lightBorder} border shadow-sm`
            : 'bg-white border-border/50 hover:border-border hover:bg-slate-50/60 hover:shadow-sm'
        }`}
      >
        {/* color accent bar */}
        <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b ${gradient} ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
        } transition-opacity`} />

        <div onClick={handleCheckboxClick} className="flex-shrink-0 ml-2">
          {isSelected
            ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
            : <Square className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />}
        </div>

        <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} shadow-sm`}>
          <FileCode className="h-4 w-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-[12.5px] font-semibold truncate leading-tight ${isActive ? lightText : 'text-slate-800'}`}>
            {form.title}
          </p>
          <p className="text-[10.5px] text-muted-foreground mt-0.5">
            {form.fields.length} field{form.fields.length !== 1 ? 's' : ''} &middot; {formatDate(form.updatedAt)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {form.deployedUrl && (
            <span className="flex items-center gap-1 text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/70 rounded-full px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
          <ActionsMenu />
          {isActive && <ChevronRight className={`h-3.5 w-3.5 ${lightText} flex-shrink-0`} />}
        </div>
      </div>
    );
  }

  /* ── GRID VIEW ── */
  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl border cursor-pointer transition-all duration-150 overflow-hidden ${
        isActive
          ? `ring-2 ring-primary/25 border-primary/20 shadow-lg shadow-primary/10`
          : 'border-border/60 bg-white hover:border-border hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Gradient header strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div onClick={handleCheckboxClick} className="mt-0.5 flex-shrink-0">
            {isSelected
              ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
              : <Square className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />}
          </div>
          <ActionsMenu />
        </div>

        <div className={`flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} shadow-md mb-3`}>
          <FileCode className="h-5 w-5 text-white" />
        </div>

        <h3 className="font-semibold text-[13px] text-slate-800 truncate mb-0.5 leading-tight">{form.title}</h3>

        <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {form.fields.length} field{form.fields.length !== 1 ? 's' : ''}
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <span>{formatDate(form.updatedAt)}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {form.deployedUrl && (
            <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/70 rounded-full px-2 py-0.5">
              <Rocket className="h-2.5 w-2.5" /> Live
            </span>
          )}
          {integrations.map(it => (
            <span key={it.label} className={`inline-flex items-center gap-1 text-[9.5px] font-medium border rounded-full px-2 py-0.5 ${it.color}`}>
              {it.icon} {it.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
