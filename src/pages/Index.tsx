import { useState, useEffect } from 'react';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { FieldEditorDialog } from '@/components/form-builder/FieldEditorDialog';
import { FormPreview } from '@/components/form-builder/FormPreview';
import { HtmlExportDialog } from '@/components/form-builder/HtmlExportDialog';
import { FormSettingsPanel } from '@/components/form-builder/FormSettingsPanel';
import { FormCanvas } from '@/components/form-builder/FormCanvas';
import { TestSubmission } from '@/components/TestSubmission';
import { generateFormHtml, convertImageToBase64 } from '@/utils/htmlGenerator';
import { FormField } from '@/types/formField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

  // Sync persisted deploy URL when the active form changes
  useEffect(() => {
    setDeployUrl(activeForm?.deployedUrl ?? null);
  }, [activeForm?.id]);
  const [creatingSheetsFor, setCreatingSheetsFor] = useState<string | null>(null);
  const [confirmDeleteForm, setConfirmDeleteForm] = useState(false);
  const [confirmDeploy, setConfirmDeploy] = useState(false);

  const handleDeploy = async () => {
    if (!activeForm) return;
    setDeploying(true);
    try {
      const html = await generateHtmlWithEmbeddedLogo(activeForm);
      const { data, error } = await supabase.functions.invoke('deploy-to-vercel', {
        body: { html, formTitle: activeForm.title, formId: activeForm.id, vercelProjectDomain: activeForm.vercelProjectDomain, deployedUrl: activeForm.deployedUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        setDeployUrl(data.url);
        updateForm(activeForm.id, { deployedUrl: data.url });
        toast.success('Form deployed successfully!');
      }
    } catch (err: any) {
      toast.error('Deploy failed: ' + (err.message || 'Unknown error'));
    } finally {
      setDeploying(false);
    }
  };

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-md shadow-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-sm">
              <FileCode className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">JForms</h1>
              <p className="text-[10px] text-muted-foreground leading-none font-medium tracking-wide uppercase">Advanced Form Builder for Physique 57</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeForm && (
              <>
                <div className="hidden md:flex items-center gap-1.5 mr-2">
                  {activeForm.webhookConfig.enabled && (
                    <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary/80">
                      <Webhook className="h-2.5 w-2.5" /> Webhook
                    </Badge>
                  )}
                  {(activeForm.pixelConfig.snapPixelId || activeForm.pixelConfig.metaPixelId || activeForm.pixelConfig.googleAdsId) && (
                    <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary/80">
                      <BarChart3 className="h-2.5 w-2.5" /> Pixels
                    </Badge>
                  )}
                  {activeForm.googleSheetsConfig.enabled && (
                    <Badge variant="outline" className="text-[10px] gap-1 border-green-400/50 text-green-600">
                      <Sheet className="h-2.5 w-2.5" /> Sheets
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowExport(true)} className="h-8">
                  <Code className="h-3.5 w-3.5 mr-1.5" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handlePreviewInNewTab} className="h-8">
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Preview
                </Button>
                <Button size="sm" onClick={() => setConfirmDeploy(true)} disabled={deploying} className="h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm">
                  {deploying ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Rocket className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {deploying ? 'Deploying…' : 'Deploy'}
                </Button>
              </>
            )}
          </div>
        </div>
        {deployUrl && (
          <div className="container pb-2">
            <div className="flex items-center gap-2 rounded-lg bg-primary/8 border border-primary/20 px-3 py-2 text-sm">
              <span className="text-primary font-semibold">Live URL:</span>
              <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1 font-medium">
                {deployUrl} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </header>

      <main className="container py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className={`col-span-12 lg:col-span-3${mainTab === 'preview' ? ' hidden' : ''}`}>
            <Card className="shadow-sm border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold tracking-wide">My Forms</CardTitle>
                  <Button size="sm" variant="outline" onClick={createForm} className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 p-3 pt-0">
                {forms.length === 0 && (
                  <div className="flex flex-col items-center py-8">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                      <Layers className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      No forms yet.<br />Create your first one!
                    </p>
                  </div>
                )}
                {forms.map(form => (
                  <div
                    key={form.id}
                    onClick={() => setActiveFormId(form.id)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-all ${
                      activeFormId === form.id
                        ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                        : 'hover:bg-muted/70 text-foreground/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeFormId === form.id ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                      <span className="truncate">{form.title}</span>
                    </div>
                    <Badge variant={activeFormId === form.id ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 ml-1 shrink-0">
                      {form.fields.length}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className={`col-span-12 ${mainTab === 'preview' ? 'lg:col-span-12' : 'lg:col-span-9'}`}>
            {!activeForm ? (
              <Card className="flex flex-col items-center justify-center py-24 border-dashed border-2 bg-muted/20 shadow-none">
                <div className="flex items-center justify-center h-20 w-20 rounded-3xl bg-primary/10 ring-1 ring-primary/15 mb-6 shadow-inner">
                  <FileCode className="h-9 w-9 text-primary/70" />
                </div>
                <h2 className="text-xl font-bold mb-2 tracking-tight">Create Your First Form</h2>
                <p className="text-muted-foreground mb-7 text-sm max-w-sm text-center leading-relaxed">
                  Build beautiful HTML forms with webhooks, tracking pixels, multi-page layouts, and advanced field types.
                </p>
                <Button onClick={createForm} size="lg" className="gap-2 bg-primary/90 hover:bg-primary shadow-md hover:shadow-primary/25 transition-all">
                  <Plus className="h-4 w-4" /> New Form
                </Button>
              </Card>
            ) : (
              <Tabs value={mainTab} onValueChange={setMainTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="fields">
                      <Layers className="h-3.5 w-3.5 mr-1.5" /> Fields
                    </TabsTrigger>
                    <TabsTrigger value="preview">
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                      <Settings className="h-3.5 w-3.5 mr-1.5" /> Settings
                    </TabsTrigger>
                    <TabsTrigger value="test">
                      <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Test
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setConfirmDeleteForm(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

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
    </div>
  );
};

export default Index;
