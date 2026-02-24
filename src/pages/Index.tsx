import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { FieldEditorDialog } from '@/components/form-builder/FieldEditorDialog';
import { FormPreview } from '@/components/form-builder/FormPreview';
import { HtmlExportDialog } from '@/components/form-builder/HtmlExportDialog';
import { FormSettingsPanel } from '@/components/form-builder/FormSettingsPanel';
import { FormCanvas } from '@/components/form-builder/FormCanvas';
import { TestSubmission } from '@/components/TestSubmission';
import { FormCard } from '@/components/FormCard';
import { TemplateSelectionDialog } from '@/components/TemplateSelectionDialog';
import { generateFormHtml, convertImageToBase64 } from '@/utils/htmlGenerator';
import { FieldType, FIELD_TYPE_CATEGORIES, FIELD_TYPE_LABELS, FormConfig, FormField } from '@/types/formField';
import { Template } from '@/data/templates';
import { applyHeroImageForLayout } from '@/utils/layoutImageHelpers';

import { FIELD_ICONS } from '@/components/form-builder/fieldIcons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Code,
  Eye,
  Settings,
  Plus,
  Trash2,
  FileCode,
  Layers,
  Webhook,
  BarChart3,
  Rocket,
  Loader2,
  ExternalLink,
  Sheet,
  Copy,
  MoreHorizontal,
  Search,
  Filter,
  Grid3X3,
  List,
  CheckSquare,
  Square,
  Download,
  Archive,
  Calendar,
  Users,
  TrendingUp,
  Sparkles,
  LayoutDashboard,
  ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const FIELD_GROUPS = Object.entries(FIELD_TYPE_CATEGORIES) as [string, FieldType[]][];

async function generateHtmlWithEmbeddedLogo(form: any): Promise<string> {
  let logoBase64: string | undefined;
  if (form.theme.showLogo && form.theme.logoUrl) {
    try {
      logoBase64 = await convertImageToBase64(form.theme.logoUrl);
    } catch {
      // fallback - logo won't be embedded
    }
  }
  return generateFormHtml(form, { logoBase64 });
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const {
    forms,
    activeForm,
    activeFormId,
    setActiveFormId,
    createForm,
    deleteForm,
    updateForm,
    addField,
    updateField,
    deleteField,
    moveField,
    reorderFields,
    duplicateField,
  } = useFormBuilder();

  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [mainTab, setMainTab] = useState('fields');
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  
  // New state for modern UI features
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'library' | 'forms'>('library');
  const handleSidebarTabChange = (value: string) => {
    setSidebarTab(value as 'library' | 'forms');
  };

  // Sync persisted deploy URL when the active form changes
  useEffect(() => {
    setDeployUrl(activeForm?.deployedUrl ?? null);
  }, [activeForm?.id]);

  // Activate a specific form when navigated from dashboard via ?formId=
  useEffect(() => {
    const formId = searchParams.get('formId');
    if (formId) setActiveFormId(formId);
  }, [searchParams]);
  const [creatingSheetsFor, setCreatingSheetsFor] = useState<string | null>(null);
  const [confirmDeleteForm, setConfirmDeleteForm] = useState(false);
  const [confirmDeploy, setConfirmDeploy] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const handleDeploy = async () => {
    if (!activeForm) return;
    setDeploying(true);
    try {
      const html = await generateHtmlWithEmbeddedLogo(activeForm);
      console.log('Starting deployment for form:', activeForm.title);
      
      const { data, error } = await supabase.functions.invoke('deploy-to-vercel', {
        body: { html, formTitle: activeForm.title, formId: activeForm.id, vercelProjectDomain: activeForm.vercelProjectDomain, deployedUrl: activeForm.deployedUrl },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      if (data?.url) {
        console.log('Deployment successful. Live URL from Vercel:', data.url);
        setDeployUrl(data.url);
        updateForm(activeForm.id, { deployedUrl: data.url });
        toast.success(`Form deployed successfully! Live at: ${data.url}`);
      }
    } catch (err: any) {
      console.error('Deployment failed:', err);
      toast.error('Deploy failed: ' + (err.message || 'Unknown error'));
    } finally {
      setDeploying(false);
    }
  };

  // Copy form functionality
  const handleCopyForm = (formToCopy: any) => {
    const newForm = {
      ...formToCopy,
      id: `form_${Date.now()}`,  
      title: `${formToCopy.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deployedUrl: undefined, // Clear deployment URL for copy
      vercelProjectDomain: undefined, // Clear Vercel project domain
    };
    
    // Create the new form by calling createForm and then updating it
    const created = createForm();
    if (created) {
      // Update the newly created form with copied data
      updateForm(created.id, newForm);
      setActiveFormId(created.id);  
      toast.success(`Form "${formToCopy.title}" copied successfully!`);
    }
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedForms.size === forms.length) {
      setSelectedForms(new Set());
    } else {
      setSelectedForms(new Set(forms.map(f => f.id)));
    }
  };

  const handleSelectForm = (formId: string) => {
    const newSelection = new Set(selectedForms);
    if (newSelection.has(formId)) {
      newSelection.delete(formId);
    } else {
      newSelection.add(formId);
    }
    setSelectedForms(newSelection);
  };

  const handleBulkDelete = () => {
    selectedForms.forEach(formId => {
      deleteForm(formId);
    });
    setSelectedForms(new Set());
    setConfirmBulkDelete(false);
    toast.success(`Deleted ${selectedForms.size} forms`);
  };

  const handleBulkCopy = () => {
    let copiedCount = 0;
    selectedForms.forEach(formId => {
      const formToCopy = forms.find(f => f.id === formId);
      if (formToCopy) {
        handleCopyForm(formToCopy);
        copiedCount++;
      }
    });
    setSelectedForms(new Set());
    toast.success(`Copied ${copiedCount} forms`);
  };

  const toggleAnimationsQuick = () => {
    if (!activeForm) return;
    const animations = activeForm.animations || { enabled: false };
    updateForm(activeForm.id, {
      animations: { ...animations, enabled: !animations.enabled },
    });
  };

  const toggleWebhookQuick = () => {
    if (!activeForm) return;
    updateForm(activeForm.id, {
      webhookConfig: { ...activeForm.webhookConfig, enabled: !activeForm.webhookConfig.enabled },
    });
  };

  const toggleSheetsQuick = () => {
    if (!activeForm) return;
    updateForm(activeForm.id, {
      googleSheetsConfig: { ...activeForm.googleSheetsConfig, enabled: !activeForm.googleSheetsConfig.enabled },
    });
  };

  const handleAddField = (type: FieldType) => {
    if (!activeForm) return;
    addField(activeForm.id, type);
    setSidebarTab('library');
  };

  // Template selection handlers
  const handleSelectTemplate = (template: Template) => {
    // Create a new form
    const newForm = createForm();
    if (newForm) {
      // Update the form with template data
      const configWithHero = applyHeroImageForLayout(newForm, template.config);
      const updatedForm = {
        ...newForm,
        title: template.name,
        description: template.description,
        fields: template.fields.map((field, index) => ({
          ...field,
          id: `field_${Date.now()}_${index}`,
          order: index
        })),
        ...configWithHero
      };
      updateForm(newForm.id, updatedForm);
      setActiveFormId(newForm.id);
      setShowTemplateDialog(false);
      toast.success(`Form created from "${template.name}" template`);
    }
  };

  const handleCreateBlankForm = () => {
    createForm();
    setShowTemplateDialog(false);
  };

  // Filter forms based on search
  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setShowBulkActions(selectedForms.size > 0);
  }, [selectedForms]);

  const handleCreateSheet = async () => {
    if (!activeForm) return;
    setCreatingSheetsFor(activeForm.id);
    try {
      const fieldHeaders = activeForm.fields
        .filter(f => f.type !== 'page-break' && f.type !== 'section-break')
        .sort((a, b) => a.order - b.order)
        .map(f => f.label);

      const { data, error } = await supabase.functions.invoke('google-sheets', {
        body: {
          action: 'create',
          formTitle: activeForm.title,
          headers: fieldHeaders,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.spreadsheetId) {
        updateForm(activeForm.id, {
          googleSheetsConfig: {
            ...activeForm.googleSheetsConfig,
            enabled: true,
            spreadsheetId: data.spreadsheetId,
          },
        });
        toast.success('Google Sheet created! Submissions will be recorded automatically.');
        if (data.spreadsheetUrl) {
          window.open(data.spreadsheetUrl, '_blank');
        }
      }
    } catch (err: any) {
      toast.error('Failed to create sheet: ' + (err.message || 'Unknown error'));
    } finally {
      setCreatingSheetsFor(null);
    }
  };

  const handlePreviewInNewTab = async () => {
    if (!activeForm) return;
    const html = await generateHtmlWithEmbeddedLogo(activeForm);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-lg shadow-primary/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">JForms</h1>
              <p className="text-xs text-muted-foreground/80 font-medium">Professional Form Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="h-9 gap-2 border-border/60 bg-white text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/40 font-medium text-sm shadow-sm transition-all">
              <Link to="/"><ChevronLeft className="h-4 w-4" /><LayoutDashboard className="h-4 w-4" />Dashboard</Link>
            </Button>
            {activeForm && (
              <>
                <div className="hidden md:flex items-center gap-2 mr-4">
                  {activeForm.webhookConfig.enabled && (
                    <Badge variant="outline" className="text-xs gap-1.5 border-emerald-200 text-emerald-700 bg-emerald-50">
                      <Webhook className="h-3 w-3" /> Webhook
                    </Badge>
                  )}
                  {(activeForm.pixelConfig.snapPixelId || activeForm.pixelConfig.metaPixelId || activeForm.pixelConfig.googleAdsId) && (
                    <Badge variant="outline" className="text-xs gap-1.5 border-blue-200 text-blue-700 bg-blue-50">
                      <BarChart3 className="h-3 w-3" /> Analytics
                    </Badge>
                  )}
                  {activeForm.googleSheetsConfig.enabled && (
                    <Badge variant="outline" className="text-xs gap-1.5 border-green-200 text-green-700 bg-green-50">
                      <Sheet className="h-3 w-3" /> Sheets
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowExport(true)} className="h-9 text-sm">
                  <Code className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handlePreviewInNewTab} className="h-9 text-sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setConfirmDeploy(true)} 
                  disabled={deploying} 
                  className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {deploying ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4 mr-2" />
                  )}
                  {deploying ? 'Deploying...' : 'Deploy'}
                </Button>
              </>
            )}
          </div>
        </div>
        {deployUrl && (
          <div className="container pb-3">
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-green-100">
                <ExternalLink className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 mb-0.5">🎉 Form is live!</p>
                <a 
                  href={deployUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-green-700 hover:text-green-800 underline underline-offset-2 transition-colors"
                >
                  {deployUrl}
                </a>
              </div>
              <Button variant="outline" size="sm" asChild className="border-green-200 text-green-700 hover:bg-green-100">
                <a href={deployUrl} target="_blank" rel="noopener noreferrer">
                  Visit <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="container py-6 space-y-6">
        {activeForm && (
          <Card className="rounded-[32px] border border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 shadow-2xl">
            <CardContent className="bg-white/5 backdrop-blur-2xl p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">Premium builder</p>
                  <h2 className="text-2xl font-semibold text-white">Experience control center</h2>
                  <p className="text-sm text-slate-300">
                    High-fidelity animations, integrations, and layouts keep your launches polished and dependable.
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 text-[0.6rem] uppercase tracking-[0.45em] text-white/80 border-white/30">
                  Pro
                </Badge>
              </div>
              <div className="grid gap-4 pt-4 md:grid-cols-3">
                <div className="flex items-center justify-between rounded-[20px] border border-white/20 bg-white/10 p-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Animations</p>
                    <p className="text-sm font-semibold text-white">Cinematic fades</p>
                  </div>
                  <Switch checked={activeForm.animations?.enabled ?? false} onCheckedChange={toggleAnimationsQuick} />
                </div>
                <div className="flex items-center justify-between rounded-[20px] border border-white/20 bg-white/10 p-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Webhooks</p>
                    <p className="text-sm font-semibold text-white">Live integrations</p>
                  </div>
                  <Switch checked={activeForm.webhookConfig.enabled} onCheckedChange={toggleWebhookQuick} />
                </div>
                <div className="flex items-center justify-between rounded-[20px] border border-white/20 bg-white/10 p-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Sheets</p>
                    <p className="text-sm font-semibold text-white">Live exports</p>
                  </div>
                  <Switch checked={activeForm.googleSheetsConfig.enabled} onCheckedChange={toggleSheetsQuick} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className={`col-span-12 lg:col-span-3${mainTab === 'preview' ? ' hidden' : ''}`}>
            <Card className="sticky top-[72px] border-border/50 shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Workspace</h2>
                    <p className="text-[11px] text-muted-foreground">{forms.length} form{forms.length !== 1 ? 's' : ''}</p>
                  </div>
                  <Button size="sm" onClick={() => setShowTemplateDialog(true)} className="h-8 bg-primary text-white text-xs px-3">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    New
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-4 pt-0">
                <Tabs value={sidebarTab} onValueChange={handleSidebarTabChange} className="space-y-4">
                  <TabsList className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100/60 p-1">
                    <TabsTrigger value="library" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Layers className="h-3.5 w-3.5 mr-2" />
                      Library
                    </TabsTrigger>
                    <TabsTrigger value="forms" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <List className="h-3.5 w-3.5 mr-2" />
                      Forms
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="library">
                    <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1 pb-2">
                      {!activeForm && (
                        <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-xs text-muted-foreground text-center">
                          Create or select a form to add fields.
                        </div>
                      )}
                      {FIELD_GROUPS.map(([group, types]) => (
                        <div key={group}>
                          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground/60 px-1 mb-1.5 pt-2">{group}</p>
                          <div className="grid grid-cols-2 gap-1">
                            {types.map(type => (
                              <button
                                key={type}
                                onClick={() => handleAddField(type)}
                                disabled={!activeForm}
                                className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-2.5 py-2 text-left text-[11px] font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:pointer-events-none disabled:opacity-40 truncate"
                              >
                                <span className="shrink-0 text-muted-foreground">{FIELD_ICONS[type]}</span>
                                <span className="truncate">{FIELD_TYPE_LABELS[type] ?? type}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="forms">
                    <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search forms..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full rounded-xl border border-border/80 bg-transparent px-10 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      {forms.length > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSelectAll}
                              className="text-xs"
                            >
                              {selectedForms.size === forms.length ? (
                                <CheckSquare className="h-3 w-3 mr-1" />
                              ) : (
                                <Square className="h-3 w-3 mr-1" />
                              )}
                              {selectedForms.size > 0 ? `${selectedForms.size} selected` : 'Select all'}
                            </Button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewMode('grid')}
                              className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-muted' : ''}`}
                            >
                              <Grid3X3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewMode('list')}
                              className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-muted' : ''}`}
                            >
                              <List className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {showBulkActions && (
                        <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs">
                          <span className="font-medium text-primary">{selectedForms.size} selected</span>
                          <Button variant="ghost" size="sm" onClick={handleBulkCopy}>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmBulkDelete(true)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                      {filteredForms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/40 p-6 text-center text-sm text-muted-foreground">
                          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            {searchQuery ? (
                              <Search className="h-6 w-6 text-muted-foreground/70" />
                            ) : (
                              <FileCode className="h-6 w-6 text-muted-foreground/50" />
                            )}
                          </div>
                          <p className="font-semibold text-xs uppercase tracking-[0.4em]">
                            {searchQuery ? 'No forms found' : 'No forms yet'}
                          </p>
                          <p className="text-[11px] leading-relaxed">
                            {searchQuery ? 'Try a different keyword or clear the search' : 'Create a form to begin designing your experience.'}
                          </p>
                          {!searchQuery && (
                            <Button onClick={createForm} size="sm" className="mt-3 bg-gradient-to-r from-primary to-primary/80">
                              <Plus className="h-3 w-3 mr-1" />
                              Create Form
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-3' : 'space-y-2'}>
                          {filteredForms.map(form => (
                            <FormCard
                              key={form.id}
                              form={form}
                              isActive={activeFormId === form.id}
                              isSelected={selectedForms.has(form.id)}
                              viewMode={viewMode}
                              onSelect={() => setActiveFormId(form.id)}
                              onToggleSelect={() => handleSelectForm(form.id)}
                              onCopy={() => handleCopyForm(form)}
                              onDelete={() => {
                                setActiveFormId(form.id);
                                setConfirmDeleteForm(true);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className={`col-span-12 ${mainTab === 'preview' ? 'lg:col-span-12' : 'lg:col-span-9'}`}>
            {!activeForm ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-8">
                  <div className="flex items-center justify-center h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 shadow-xl">
                    <Sparkles className="h-12 w-12 text-primary/60" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                    <Plus className="h-3 w-3 text-white" />
                  </div>
                </div>
                
                <div className="text-center mb-8 max-w-md">
                  <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Welcome to JForms
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Create beautiful, professional forms with advanced features like webhooks, analytics tracking, 
                    multi-page layouts, and seamless deployment to Vercel.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
                  <div className="text-center p-4 rounded-xl border border-slate-200 bg-white/50">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-3">
                      <Webhook className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">Smart Integrations</h3>
                    <p className="text-xs text-muted-foreground">Webhooks, Google Sheets, and analytics</p>
                  </div>
                  
                  <div className="text-center p-4 rounded-xl border border-slate-200 bg-white/50">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                      <Rocket className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">One-Click Deploy</h3>
                    <p className="text-xs text-muted-foreground">Instant deployment to Vercel</p>
                  </div>
                  
                  <div className="text-center p-4 rounded-xl border border-slate-200 bg-white/50">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-3">
                      <Layers className="h-4 w-4 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">Advanced Fields</h3>
                    <p className="text-xs text-muted-foreground">Rich field types and logic</p>
                  </div>
                </div>

                <Button 
                  onClick={createForm} 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-200 px-8"
                >
                  <Plus className="h-5 w-5 mr-2" /> 
                  Create Your First Form
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      {activeForm.title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {activeForm.fields.length} fields • Last updated {new Date(activeForm.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyForm(activeForm)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDeleteForm(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4 bg-slate-100/50 p-1 rounded-xl">
                    <TabsTrigger value="fields" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Layers className="h-4 w-4 mr-2" /> 
                      Fields
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Eye className="h-4 w-4 mr-2" /> 
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Settings className="h-4 w-4 mr-2" /> 
                      Settings
                    </TabsTrigger>
                    <TabsTrigger value="test" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <BarChart3 className="h-4 w-4 mr-2" /> 
                      Test
                    </TabsTrigger>
                  </TabsList>

                <TabsContent value="fields">
                  <FormCanvas
                    form={activeForm}
                    onEdit={field => setEditingField(field)}
                    onDelete={fieldId => {
                      deleteField(activeForm.id, fieldId);
                      toast.success('Field deleted');
                    }}
                    onDuplicate={fieldId => {
                      duplicateField(activeForm.id, fieldId);
                      toast.success('Field duplicated');
                    }}
                    onAdd={type => addField(activeForm.id, type)}
                    onReorder={orderedIds => reorderFields(activeForm.id, orderedIds)}
                  />
                </TabsContent>

                <TabsContent value="preview">
                  <FormPreview form={activeForm} />
                </TabsContent>

                <TabsContent value="settings">
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="pt-6 px-6 pb-6">
                      <FormSettingsPanel
                        form={activeForm}
                        onUpdate={updates => updateForm(activeForm.id, updates)}
                        onCreateSheet={handleCreateSheet}
                        isCreatingSheet={creatingSheetsFor === activeForm.id}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="test">
                  <TestSubmission />
                </TabsContent>
              </Tabs>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirm: delete form */}
      <AlertDialog open={confirmDeleteForm} onOpenChange={setConfirmDeleteForm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{activeForm?.title}</strong> and all its fields. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (activeForm) { deleteForm(activeForm.id); toast.success('Form deleted'); }
                setConfirmDeleteForm(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm: deploy */}
      <AlertDialog open={confirmDeploy} onOpenChange={setConfirmDeploy}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deploy form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will build and deploy <strong>{activeForm?.title}</strong> to Vercel and make it publicly accessible. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setConfirmDeploy(false); handleDeploy(); }}
            >
              Deploy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm: bulk delete */}
      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedForms.size} forms?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected forms and all their fields. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              Delete {selectedForms.size} Forms
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogs */}
      {editingField && activeForm && (
        <FieldEditorDialog
          field={editingField}
          open={!!editingField}
          onClose={() => setEditingField(null)}
          onSave={updates => updateField(activeForm.id, editingField.id, updates)}
          allFields={activeForm.fields}
        />
      )}

      {activeForm && (
        <HtmlExportDialog
          form={activeForm}
          open={showExport}
          onClose={() => setShowExport(false)}
        />
      )}

      <TemplateSelectionDialog
        open={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onSelectTemplate={handleSelectTemplate}
        onCreateBlank={handleCreateBlankForm}
      />
    </div>
  );
};

export default Index;
