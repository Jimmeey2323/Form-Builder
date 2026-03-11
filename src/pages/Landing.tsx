import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles, Plus, FileText, Rocket, Layers, MoreHorizontal, ExternalLink,
  Trash2, Copy, PencilLine, Search, Webhook, Sheet, BarChart3, Clock,
  Calendar, TrendingUp, Globe, ChevronRight, LayoutDashboard, Zap,
} from 'lucide-react';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { toast } from 'sonner';
import { FormConfig } from '@/types/formField';

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(iso?: string) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

function FormDashboardCard({ form, onDelete, onDuplicate }: {
  form: FormConfig; onDelete: (id: string) => void; onDuplicate: (form: FormConfig) => void;
}) {
  const isPublished = form.publicationState === 'published' && !!form.deployedUrl;
  const integrations: string[] = [];
  if (form.webhookConfig.enabled) integrations.push('webhook');
  if (form.googleSheetsConfig.enabled) integrations.push('sheets');
  if (form.pixelConfig.snapPixelId || form.pixelConfig.metaPixelId || form.pixelConfig.googleAdsId) integrations.push('analytics');
  const fieldCount = form.fields.filter(f => f.type !== 'page-break' && f.type !== 'section-break').length;

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-[26px] border border-white/75 bg-white/80 shadow-[0_18px_42px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_22px_48px_rgba(14,165,233,0.12)]">
      {/* Accent gradient */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${form.theme.primaryColor}, ${form.theme.secondaryColor})` }} />
      <CardContent className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center text-[16px] ring-1 ring-white/70" style={{ background: `linear-gradient(135deg, ${form.theme.primaryColor}24, ${form.theme.secondaryColor}20)` }}>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold tracking-tight text-slate-900 truncate">{form.title}</h3>
              {form.description && <p className="text-[11px] text-slate-500 truncate mt-0.5 max-w-[180px]">{form.description}</p>}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem asChild><Link to={`/builder?formId=${form.id}`} className="flex items-center gap-2 text-[12px]"><PencilLine className="h-3 w-3" />Edit</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(form)} className="gap-2 text-[12px]"><Copy className="h-3 w-3" />Duplicate</DropdownMenuItem>
              {isPublished && <DropdownMenuItem asChild><a href={form.deployedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px]"><Globe className="h-3 w-3" />View live</a></DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(form.id)} className="text-destructive focus:text-destructive gap-2 text-[12px]"><Trash2 className="h-3 w-3" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{fieldCount} fields</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(form.updatedAt)}</span>
        </div>

        {/* Integration badges */}
        {integrations.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {integrations.includes('webhook') && <Badge variant="outline" className="text-[9px] gap-0.5 h-4 rounded-full px-1.5 border-primary/20 text-primary/80"><Webhook className="h-2.5 w-2.5" /></Badge>}
            {integrations.includes('sheets') && <Badge variant="outline" className="text-[9px] gap-0.5 h-4 rounded-full px-1.5 border-primary/20 text-primary/80"><Sheet className="h-2.5 w-2.5" /></Badge>}
            {integrations.includes('analytics') && <Badge variant="outline" className="text-[9px] gap-0.5 h-4 rounded-full px-1.5 border-primary/20 text-primary/80"><BarChart3 className="h-2.5 w-2.5" /></Badge>}
          </div>
        )}

        {/* Deploy status */}
        <div className="mt-auto">
          {isPublished ? (
            <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-semibold text-primary">Live</span>
              </div>
              <a href={form.deployedUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-1 truncate max-w-[120px]">
                <ExternalLink className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{form.deployedUrl.replace(/^https?:\/\//, '')}</span>
              </a>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 px-3 py-2.5 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Draft</span>
              <Link to={`/builder?formId=${form.id}`} className="text-[10px] text-primary font-medium flex items-center gap-1"><Rocket className="h-2.5 w-2.5" />Deploy</Link>
            </div>
          )}
        </div>

        <Link to={`/builder?formId=${form.id}`}
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 py-2.5 text-[11px] font-medium text-slate-500 transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground">
          <PencilLine className="h-3 w-3" />Open in Builder<ChevronRight className="h-3 w-3 ml-auto" />
        </Link>
      </CardContent>
    </Card>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const { forms, deleteForm, createForm } = useFormBuilder();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredForms = forms.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deployedCount = forms.filter(f => f.publicationState === 'published' && !!f.deployedUrl).length;
  const totalFields = forms.reduce((acc, f) => acc + f.fields.filter(x => x.type !== 'page-break' && x.type !== 'section-break').length, 0);
  const withIntegrations = forms.filter(f => f.webhookConfig.enabled || f.googleSheetsConfig.enabled).length;

  const handleCreateNew = () => { const form = createForm(); if (form) navigate(`/builder?formId=${form.id}`); else navigate('/builder'); };
  const handleDuplicate = (form: FormConfig) => { const existing = createForm(); if (!existing) return; toast.success(`Duplicate of "${form.title}" created`); navigate(`/builder?formId=${existing.id}`); };
  const handleDelete = (id: string) => setConfirmDeleteId(id);
  const confirmDelete = () => { if (!confirmDeleteId) return; const form = forms.find(f => f.id === confirmDeleteId); deleteForm(confirmDeleteId); toast.success(`"${form?.title ?? 'Form'}" deleted`); setConfirmDeleteId(null); };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 shadow-[0_12px_28px_rgba(14,165,233,0.35)]">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold tracking-tight text-slate-900">JForms</h1>
              <p className="text-[10px] text-slate-500 font-medium -mt-0.5">Operations Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 text-[12px] rounded-lg">
              <Link to="/builder"><LayoutDashboard className="h-3.5 w-3.5" />Builder</Link>
            </Button>
            <Button size="sm" className="h-8 gap-1.5 text-[12px] rounded-lg" onClick={handleCreateNew}>
              <Plus className="h-3.5 w-3.5" />New Form
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <section className="relative overflow-hidden rounded-[32px] border border-white/65 bg-[linear-gradient(135deg,#020617_0%,#0f172a_38%,#172554_100%)] text-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.22)] md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(56,189,248,0.28),transparent_30%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_80%,rgba(16,185,129,0.18),transparent_32%)]" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-100/80">Form Operations</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Build, deploy and scale sophisticated forms faster.</h2>
              <p className="mt-3 text-sm text-white/80 max-w-2xl">
                Manage templates, advanced fields, live deployment, and connected workflows from one workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="sm" className="h-10 rounded-xl bg-white text-slate-900 hover:bg-white/90 shadow-[0_14px_30px_rgba(255,255,255,0.18)]" onClick={handleCreateNew}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Create Form
              </Button>
              <Button variant="outline" size="sm" asChild className="h-10 rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link to="/builder"><LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />Open Builder</Link>
              </Button>
            </div>
          </div>
          <div className="relative mt-8 grid gap-3 md:grid-cols-3">
            {[
              { label: 'Active workspace', value: `${forms.length || 0} forms`, icon: Layers },
              { label: 'Published surfaces', value: `${deployedCount} live`, icon: Globe },
              { label: 'Connected workflows', value: `${withIntegrations} forms`, icon: Zap },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2 text-cyan-100/80">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-[0.18em]">{label}</span>
                </div>
                <p className="mt-2 text-lg font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: FileText, label: 'Forms', value: forms.length, color: 'text-primary' },
            { icon: Rocket, label: 'Deployed', value: deployedCount, color: 'text-primary' },
            { icon: Layers, label: 'Fields', value: totalFields, color: 'text-primary' },
            { icon: Zap, label: 'Integrations', value: withIntegrations, color: 'text-primary' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] backdrop-blur-md">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-50 to-sky-100 flex items-center justify-center ring-1 ring-sky-100 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        {forms.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/65 px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.05)] backdrop-blur-md">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search forms…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 rounded-xl border-border/50 bg-muted/20 text-[13px]" />
            </div>
            <p className="text-[11px] font-medium text-slate-500">{filteredForms.length} of {forms.length}</p>
          </div>
        )}

        {/* Grid */}
        {forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5 rounded-2xl border-2 border-dashed border-border/40 bg-muted/10">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-7 w-7 text-primary/50" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-semibold text-foreground">No forms yet</h3>
              <p className="text-[13px] text-muted-foreground max-w-xs">Create your first form and start collecting responses.</p>
            </div>
            <Button size="lg" className="gap-2 rounded-xl" onClick={handleCreateNew}><Plus className="h-4 w-4" />Create your first form</Button>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <Search className="h-7 w-7 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">No forms match "<strong>{searchQuery}</strong>"</p>
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>Clear search</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredForms.map(form => (
              <FormDashboardCard key={form.id} form={form} onDelete={handleDelete} onDuplicate={handleDuplicate} />
            ))}
            <button onClick={handleCreateNew}
              className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-[28px] border-2 border-dashed border-slate-300/70 bg-white/55 p-8 text-muted-foreground shadow-[0_14px_34px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
              <div className="h-10 w-10 rounded-xl border-2 border-current/20 flex items-center justify-center"><Plus className="h-5 w-5" /></div>
              <p className="text-[12px] font-medium">New Form</p>
            </button>
          </div>
        )}
      </main>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={open => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete form?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <strong>{forms.find(f => f.id === confirmDeleteId)?.title ?? 'this form'}</strong>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Landing;
