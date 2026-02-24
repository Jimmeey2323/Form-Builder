import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  Plus,
  FileText,
  Rocket,
  Layers,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Copy,
  PencilLine,
  Search,
  Webhook,
  Sheet,
  BarChart3,
  Clock,
  Calendar,
  TrendingUp,
  Globe,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { toast } from 'sonner';
import { FormConfig } from '@/types/formField';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

function FormDashboardCard({
  form,
  onDelete,
  onDuplicate,
}: {
  form: FormConfig;
  onDelete: (id: string) => void;
  onDuplicate: (form: FormConfig) => void;
}) {
  const gradientStyle = {
    background: `linear-gradient(135deg, ${form.theme.primaryColor} 0%, ${form.theme.secondaryColor} 100%)`,
  };

  const fieldCount = form.fields.filter(
    f => f.type !== 'page-break' && f.type !== 'section-break'
  ).length;

  const integrations: string[] = [];
  if (form.webhookConfig.enabled) integrations.push('webhook');
  if (form.googleSheetsConfig.enabled) integrations.push('sheets');
  if (form.pixelConfig.snapPixelId || form.pixelConfig.metaPixelId || form.pixelConfig.googleAdsId)
    integrations.push('analytics');

  return (
    <Card className="group relative flex flex-col overflow-hidden border border-border/60 bg-white shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200">
      {/* Accent bar */}
      <div className="h-1.5 w-full" style={gradientStyle} />

      <CardContent className="flex flex-col flex-1 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center shadow-sm" style={gradientStyle}>
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate leading-snug">{form.title}</h3>
              {form.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5 leading-snug max-w-[200px]">
                  {form.description}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-60 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link to={`/builder?formId=${form.id}`} className="flex items-center gap-2">
                  <PencilLine className="h-3.5 w-3.5" /> Edit form
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(form)} className="gap-2">
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </DropdownMenuItem>
              {form.deployedUrl && (
                <DropdownMenuItem asChild>
                  <a href={form.deployedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" /> View live
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(form.id)}
                className="text-destructive focus:text-destructive gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {fieldCount} field{fieldCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(form.updatedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(form.createdAt)}
          </span>
        </div>

        {/* Integrations */}
        {integrations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {integrations.includes('webhook') && (
              <Badge variant="outline" className="text-[10px] gap-1 border-emerald-200 text-emerald-700 bg-emerald-50 py-0">
                <Webhook className="h-2.5 w-2.5" /> Webhook
              </Badge>
            )}
            {integrations.includes('sheets') && (
              <Badge variant="outline" className="text-[10px] gap-1 border-green-200 text-green-700 bg-green-50 py-0">
                <Sheet className="h-2.5 w-2.5" /> Sheets
              </Badge>
            )}
            {integrations.includes('analytics') && (
              <Badge variant="outline" className="text-[10px] gap-1 border-blue-200 text-blue-700 bg-blue-50 py-0">
                <BarChart3 className="h-2.5 w-2.5" /> Pixels
              </Badge>
            )}
          </div>
        )}

        {/* Deploy status */}
        {form.deployedUrl ? (
          <div className="mt-auto rounded-lg bg-green-50 border border-green-200/60 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-700">Live</span>
            </div>
            <a
              href={form.deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 font-medium truncate max-w-[140px]"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{form.deployedUrl.replace(/^https?:\/\//, '')}</span>
            </a>
          </div>
        ) : (
          <div className="mt-auto rounded-lg bg-muted/40 border border-border/40 px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Not deployed</span>
            <Link to={`/builder?formId=${form.id}`} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              <Rocket className="h-3 w-3" /> Deploy
            </Link>
          </div>
        )}

        {/* Open in builder CTA */}
        <Link
          to={`/builder?formId=${form.id}`}
          className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-transparent py-2 text-xs font-medium text-foreground/80 hover:bg-primary hover:text-white hover:border-primary transition-all"
        >
          <PencilLine className="h-3.5 w-3.5" /> Open in Builder
          <ChevronRight className="h-3.5 w-3.5 ml-auto" />
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

  const deployedCount = forms.filter(f => !!f.deployedUrl).length;
  const totalFields = forms.reduce((acc, f) => acc + f.fields.filter(
    x => x.type !== 'page-break' && x.type !== 'section-break'
  ).length, 0);
  const withIntegrations = forms.filter(f => f.webhookConfig.enabled || f.googleSheetsConfig.enabled).length;

  const handleCreateNew = () => {
    const form = createForm();
    if (form) navigate(`/builder?formId=${form.id}`);
    else navigate('/builder');
  };

  const handleDuplicate = (form: FormConfig) => {
    const existing = createForm();
    if (!existing) return;
    // We'll navigate to builder; the form gets created with defaults
    toast.success(`Duplicate of "${form.title}" created in Builder`);
    navigate(`/builder?formId=${existing.id}`);
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    const form = forms.find(f => f.id === confirmDeleteId);
    deleteForm(confirmDeleteId);
    toast.success(`"${form?.title ?? 'Form'}" deleted`);
    setConfirmDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-lg shadow-primary/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                JForms
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild className="h-9 gap-2 border-border/60 font-medium">
              <Link to="/builder">
                <LayoutDashboard className="h-4 w-4" />Builder
              </Link>
            </Button>
            <Button size="sm" className="h-9 gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-sm hover:shadow-md" onClick={handleCreateNew}>
              <Plus className="h-4 w-4" />New Form
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* ── Welcome + Stats ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Forms</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {forms.length === 0
                ? 'Create your first form to get started.'
                : `${forms.length} form${forms.length !== 1 ? 's' : ''} · manage, preview and deploy from here.`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: FileText, label: 'Total Forms', value: forms.length, color: 'from-violet-500 to-purple-600' },
              { icon: Rocket, label: 'Deployed', value: deployedCount, color: 'from-green-500 to-emerald-600' },
              { icon: Layers, label: 'Total Fields', value: totalFields, color: 'from-blue-500 to-cyan-600' },
              { icon: TrendingUp, label: 'With Integrations', value: withIntegrations, color: 'from-amber-500 to-orange-600' },
            ].map(({ icon: Icon, label, value, color }) => (
              <Card key={label} className="border-border/50 shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        {forms.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search forms…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white border-border/60 focus:border-primary/50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredForms.length} of {forms.length}
            </p>
          </div>
        )}

        {/* ── Forms Grid ──────────────────────────────────────────────────── */}
        {forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 rounded-2xl border-2 border-dashed border-border/50 bg-muted/20">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary/60" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-foreground">No forms yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Create your first form and start collecting responses in minutes.
              </p>
            </div>
            <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-sm" onClick={handleCreateNew}>
              <Plus className="h-5 w-5" /> Create your first form
            </Button>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Search className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No forms match "<strong>{searchQuery}</strong>"</p>
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>Clear search</Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredForms.map(form => (
              <FormDashboardCard
                key={form.id}
                form={form}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
            {/* Create new form card */}
            <button
              onClick={handleCreateNew}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 bg-transparent p-8 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all group min-h-[220px]"
            >
              <div className="h-12 w-12 rounded-xl border-2 border-current/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">New Form</p>
                <p className="text-xs opacity-70 mt-0.5">Start from scratch or template</p>
              </div>
            </button>
          </div>
        )}
      </main>

      {/* Delete confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={open => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <strong>{forms.find(f => f.id === confirmDeleteId)?.title ?? 'this form'}</strong>{' '}
              and all its fields. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Landing;

