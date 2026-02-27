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
import { CsvImportDialog } from '@/components/CsvImportDialog';
import { useTemplates } from '@/hooks/useTemplates';
import { generateFormHtml, convertImageToBase64 } from '@/utils/htmlGenerator';
import { FieldType, FIELD_TYPE_CATEGORIES, FIELD_TYPE_LABELS, FormConfig, FormField } from '@/types/formField';
import { MOMENCE_PRESET_FIELDS, SESSION_MAPPING_FIELDS, MEMBER_MAPPING_FIELDS, FieldPreset } from '@/lib/momencePresets';
import { Template } from '@/data/templates';
import { applyHeroImageForLayout } from '@/utils/layoutImageHelpers';

import { FIELD_ICONS } from '@/components/form-builder/fieldIcons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  EyeOff,
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
  Hash,
  Type,
  Mail,
  Phone,
  Lock,
  LockOpen,
  Save,
  Bot,
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
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'library' | 'forms'>('library');
  const { userTemplates, addTemplates, deleteTemplate } = useTemplates();
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
  const [showAIChat, setShowAIChat] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [copiedFormSettings, setCopiedFormSettings] = useState<Partial<FormConfig> | null>(null);
  const [aiFormDescription, setAiFormDescription] = useState('');

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
        // Lock the form when it's deployed to prevent accidental changes
        updateForm(activeForm.id, { 
          deployedUrl: data.url,
          isLocked: true,
          isPublished: true
        });
        toast.success(`Form deployed successfully and locked! Live at: ${data.url}`);
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

  const toggleFormLock = () => {
    if (!activeForm) return;
    
    // If the form is published and user tries to unlock it, show a warning
    if (activeForm.isPublished && activeForm.isLocked) {
      const confirmed = window.confirm(
        'This form is live! Unlocking it may cause accidental changes to be saved. Are you sure you want to unlock this published form?'
      );
      if (!confirmed) return;
    }
    
    updateForm(activeForm.id, { isLocked: !activeForm.isLocked });
    toast.success(activeForm.isLocked ? 'Form unlocked' : 'Form locked');
  };

  const saveFormAsTemplate = () => {
    if (!activeForm || !templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    const newTemplate: Template = {
      id: `template_${Date.now()}`,
      name: templateName,
      description: templateDescription,
      category: 'User Created',
      icon: '⭐',
      fields: activeForm.fields,
      config: {
        title: activeForm.title,
        subHeader: activeForm.subHeader,
        description: activeForm.description,
        theme: activeForm.theme,
        webhookConfig: activeForm.webhookConfig,
        pixelConfig: activeForm.pixelConfig,
      },
      isUserCreated: true,
      createdAt: new Date().toISOString(),
    };
    addTemplates([newTemplate]);
    setShowSaveTemplate(false);
    setTemplateName('');
    setTemplateDescription('');
    toast.success(`Template "${templateName}" saved successfully!`);
  };

  const handleDeleteFormWithConfirmation = () => {
    if (!activeForm) return;
    deleteForm(activeForm.id);
    setConfirmDeleteForm(false);
    toast.success('Form deleted');
  };

  const copyFormSettings = () => {
    if (!activeForm) return;
    setCopiedFormSettings({
      theme: activeForm.theme,
      webhookConfig: activeForm.webhookConfig,
      pixelConfig: activeForm.pixelConfig,
      googleSheetsConfig: activeForm.googleSheetsConfig,
      submitButtonText: activeForm.submitButtonText,
      successMessage: activeForm.successMessage,
      redirectUrl: activeForm.redirectUrl,
    });
    toast.success('Form settings copied! You can paste them to another form');
  };

  const pasteFormSettings = () => {
    if (!activeForm || !copiedFormSettings) {
      toast.error('No settings copied yet');
      return;
    }
    updateForm(activeForm.id, copiedFormSettings);
    toast.success('Form settings pasted!');
  };

  const generateFormFromDescription = () => {
    if (!activeForm || !aiFormDescription.trim()) {
      toast.error('Please describe your form');
      return;
    }
    if (activeForm.isLocked) {
      toast.error('Form is locked. Unlock it to make changes.');
      return;
    }

    const description = aiFormDescription.toLowerCase();
    const fieldKeywords = [
      { keywords: ['name', 'full name'], type: 'text' as FieldType, label: 'Full Name' },
      { keywords: ['email'], type: 'email' as FieldType, label: 'Email Address' },
      { keywords: ['phone', 'number', 'contact'], type: 'tel' as FieldType, label: 'Phone Number' },
      { keywords: ['address'], type: 'text' as FieldType, label: 'Address' },
      { keywords: ['message', 'comment', 'feedback', 'description'], type: 'textarea' as FieldType, label: 'Message' },
      { keywords: ['select', 'choice', 'option', 'prefer'], type: 'select' as FieldType, label: 'Select an Option' },
      { keywords: ['date', 'when', 'schedule'], type: 'date' as FieldType, label: 'Date' },
      { keywords: ['file', 'upload', 'attachment'], type: 'file' as FieldType, label: 'File Upload' },
      { keywords: ['agree', 'terms', 'checkbox'], type: 'checkbox' as FieldType, label: 'I Agree' },
    ];

    const fieldsToAdd: { type: FieldType; label: string }[] = [];
    const addedLabels = new Set<string>();

    for (const { keywords, type, label } of fieldKeywords) {
      if (keywords.some(kw => description.includes(kw)) && !addedLabels.has(label)) {
        fieldsToAdd.push({ type, label });
        addedLabels.add(label);
      }
    }

    if (fieldsToAdd.length === 0) {
      toast.error('Could not parse form description. Please mention field types like email, name, message, etc.');
      return;
    }

    // Add generated fields to the form
    fieldsToAdd.forEach(field => {
      addField(activeForm.id, field.type, { label: field.label });
    });

    setAiFormDescription('');
    setShowAIChat(false);
    toast.success(`Generated ${fieldsToAdd.length} fields from your description!`);
  };

  const handleAddField = (type: FieldType) => {
    if (!activeForm) return;
    if (activeForm.isLocked) { toast.error('Form is locked. Unlock it to make changes.'); return; }
    addField(activeForm.id, type);
    setSidebarTab('library');
  };

  const handleAddPresetField = (preset: FieldPreset) => {
    if (!activeForm) return;
    if (activeForm.isLocked) { toast.error('Form is locked. Unlock it to make changes.'); return; }
    addField(activeForm.id, preset.type, {
      label:       preset.label,
      name:        preset.name,
      placeholder: preset.placeholder ?? '',
      helpText:    preset.helpText ?? '',
      isHidden:    preset.isHidden  ?? false,
      isReadOnly:  preset.isReadOnly ?? false,
      ...(preset.options ? { options: preset.options } : {}),
    });
    setSidebarTab('library');
  };

  const handleAddAllPresets = (presets: FieldPreset[]) => {
    if (!activeForm) return;
    presets.forEach(preset => handleAddPresetField(preset));
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

  // ── CSV Import handlers ────────────────────────────────────────────────────
  const handleCsvSaveTemplates = (templates: Template[]) => {
    addTemplates(templates);
  };

  const handleCsvCreateForms = (templates: Template[]) => {
    templates.forEach(template => {
      const newForm = createForm();
      if (newForm) {
        const updatedForm = {
          ...newForm,
          title: template.name,
          description: template.description ?? '',
          fields: template.fields.map((field, index) => ({
            ...field,
            id: `field_${Date.now()}_${index}_${Math.random().toString(36).slice(2,5)}`,
            order: index,
          })),
          ...(template.config || {}),
        };
        updateForm(newForm.id, updatedForm);
        setActiveFormId(newForm.id);
      }
    });
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

  const handleUpdateSheetStructure = async () => {
    if (!activeForm || !activeForm.googleSheetsConfig?.spreadsheetId) {
      toast.error('No Google Sheet connected to this form');
      return;
    }
    setCreatingSheetsFor(activeForm.id);
    try {
      const fieldHeaders = activeForm.fields
        .filter(f => f.type !== 'page-break' && f.type !== 'section-break')
        .sort((a, b) => a.order - b.order)
        .map(f => f.label);

      const { data, error } = await supabase.functions.invoke('google-sheets', {
        body: {
          action: 'update-structure',
          spreadsheetId: activeForm.googleSheetsConfig.spreadsheetId,
          headers: fieldHeaders,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Google Sheet structure updated with new fields!');
    } catch (err: any) {
      toast.error('Failed to update sheet: ' + (err.message || 'Unknown error'));
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#eef2ff_0%,_#f8fafc_40%,_#f1f5f9_100%)] overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-2xl shadow-[0_1px_20px_rgba(0,0,0,0.06)]">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="anim-glow-ring flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 bg-clip-text text-transparent">JForms</h1>
              <p className="text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-[0.2em]">Professional Form Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="h-9 gap-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium text-[13px]">
              <Link to="/"><ChevronLeft className="h-4 w-4" />Dashboard</Link>
            </Button>
            {activeForm && (
              <>
                <div className="hidden md:flex items-center gap-1.5 ml-2">
                  {activeForm.webhookConfig.enabled && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-full px-2.5 py-1">
                      <Webhook className="h-3 w-3" /> Webhook
                    </span>
                  )}
                  {(activeForm.pixelConfig.snapPixelId || activeForm.pixelConfig.metaPixelId || activeForm.pixelConfig.googleAdsId) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 border border-blue-200 bg-blue-50 rounded-full px-2.5 py-1">
                      <BarChart3 className="h-3 w-3" /> Pixels
                    </span>
                  )}
                  {activeForm.googleSheetsConfig.enabled && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-full px-2.5 py-1">
                      <Sheet className="h-3 w-3" /> Sheets
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Button variant="outline" size="sm" onClick={() => setShowExport(true)}
                    className="h-8 text-[12.5px] border-border/60 shadow-none hover:border-border">
                    <Code className="h-3.5 w-3.5 mr-1.5" />Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePreviewInNewTab}
                    className="h-8 text-[12.5px] border-border/60 shadow-none hover:border-border">
                    <Eye className="h-3.5 w-3.5 mr-1.5" />Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleFormLock}
                    className={`h-8 text-[12.5px] border-border/60 shadow-none hover:border-border ${activeForm.isLocked ? 'bg-red-50 border-red-200 text-red-600' : ''}`}>
                    {activeForm.isLocked ? <Lock className="h-3.5 w-3.5 mr-1.5" /> : <LockOpen className="h-3.5 w-3.5 mr-1.5" />}
                    {activeForm.isLocked ? 'Locked' : 'Unlocked'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowSaveTemplate(true)}
                    className="h-8 text-[12.5px] border-border/60 shadow-none hover:border-border">
                    <Save className="h-3.5 w-3.5 mr-1.5" />Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAIChat(true)}
                    className="h-8 text-[12.5px] border-border/60 shadow-none hover:border-border">
                    <Bot className="h-3.5 w-3.5 mr-1.5" />AI
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm"
                        className="h-8 text-[12.5px] border-border/60 shadow-none hover:border-border">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleCopyForm.bind(null, activeForm)}>
                        <Copy className="h-4 w-4 mr-2" />Duplicate Form
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={copyFormSettings}>
                        <Copy className="h-4 w-4 mr-2" />Copy Settings
                      </DropdownMenuItem>
                      {copiedFormSettings && (
                        <DropdownMenuItem onClick={pasteFormSettings}>
                          <Copy className="h-4 w-4 mr-2" />Paste Settings
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setConfirmDeleteForm(true)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />Delete Form
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="sm" onClick={() => setConfirmDeploy(true)} disabled={deploying}
                    className="h-8 text-[12.5px] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/25 border-0 font-semibold">
                    {deploying ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5 mr-1.5" />}
                    {deploying ? 'Deploying…' : 'Deploy'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
        {deployUrl && (
          <div className="container pb-3">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/20 px-5 py-3 shadow-lg shadow-emerald-900/20">
              <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/25">
                <ExternalLink className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400/80 mb-0.5">Live</p>
                <a href={deployUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[13px] text-emerald-300 hover:text-emerald-200 underline underline-offset-2 transition-colors font-medium">
                  {deployUrl}
                </a>
              </div>
              <Button variant="outline" size="sm" asChild
                className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 bg-transparent h-8 text-xs">
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
          <Card className="anim-fade-in rounded-[28px] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 shadow-2xl overflow-hidden">
            <CardContent className="relative p-6">
              {/* Subtle shimmer line at top */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.45em] text-slate-400 mb-0.5">Active Form</p>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-white tracking-tight">{activeForm.title}</h2>
                    {activeForm.deployedUrl && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeForm.fields.length} field{activeForm.fields.length !== 1 ? 's' : ''} &middot; Updated {new Date(activeForm.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit rounded-full px-3 text-[0.6rem] uppercase tracking-[0.45em] text-white/70 border border-white/15 bg-white/8">
                  Pro
                </Badge>
              </div>
              <div className="grid gap-3 pt-4 md:grid-cols-4">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors p-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Animations</p>
                    <p className="text-sm font-semibold text-white mt-0.5">Cinematic fades</p>
                  </div>
                  <Switch checked={activeForm.animations?.enabled ?? false} onCheckedChange={toggleAnimationsQuick} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors p-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Webhooks</p>
                    <p className="text-sm font-semibold text-white mt-0.5">Live integrations</p>
                  </div>
                  <Switch checked={activeForm.webhookConfig.enabled} onCheckedChange={toggleWebhookQuick} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors p-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Sheets</p>
                    <p className="text-sm font-semibold text-white mt-0.5">Auto-export rows</p>
                  </div>
                  <Switch checked={activeForm.googleSheetsConfig.enabled} onCheckedChange={toggleSheetsQuick} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors p-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Locked</p>
                    <p className="text-sm font-semibold text-white mt-0.5">Prevent edits</p>
                  </div>
                  <Switch checked={activeForm.isLocked ?? false} onCheckedChange={toggleFormLock} />
                </div>
              </div>
              {activeForm.deployedUrl && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <a href={activeForm.deployedUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-[12px] text-emerald-300 hover:text-emerald-200 underline underline-offset-2 truncate font-medium">
                    {activeForm.deployedUrl}
                  </a>
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                </div>
              )}
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className={`col-span-12 lg:col-span-3${(mainTab === 'preview' || mainTab === 'settings' || !activeForm) ? ' hidden' : ''}`}>
            <div className="sticky top-[72px] rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden">
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-slate-50/60">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Workspace</p>
                  <p className="text-[12px] font-semibold text-slate-700 mt-0.5">{forms.length} form{forms.length !== 1 ? 's' : ''}</p>
                </div>
                <Button size="sm" onClick={() => setShowTemplateDialog(true)}
                  className="h-7 px-3 text-[11px] font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-0 shadow-sm shadow-indigo-500/20">
                  <Plus className="h-3 w-3 mr-1" />New
                </Button>
              </div>
              <div className="p-3">
              <Tabs value={sidebarTab} onValueChange={handleSidebarTabChange} className="space-y-3">
                  <TabsList className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100/80 p-1 border border-border/40">
                    <TabsTrigger value="library" className="rounded-lg text-[11.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 data-[state=active]:font-semibold">
                      <Layers className="h-3 w-3 mr-1.5" />Fields
                    </TabsTrigger>
                    <TabsTrigger value="forms" className="rounded-lg text-[11.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-700 data-[state=active]:font-semibold">
                      <List className="h-3 w-3 mr-1.5" />Forms
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
                                disabled={!activeForm || activeForm.isLocked}
                                className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-2.5 py-2 text-left text-[11px] font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:pointer-events-none disabled:opacity-40 truncate"
                              >
                                <span className="shrink-0 text-muted-foreground">{FIELD_ICONS[type]}</span>
                                <span className="truncate">{FIELD_TYPE_LABELS[type] ?? type}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* ── Momence Preset Dropdowns ────────────────── */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground/60 px-1 mb-1.5 pt-2">Momence Presets</p>
                        <div className="grid grid-cols-2 gap-1">
                          {MOMENCE_PRESET_FIELDS.map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => handleAddPresetField(preset)}
                              disabled={!activeForm || activeForm.isLocked}
                              className="flex items-center gap-2 rounded-lg border border-violet-200/70 bg-violet-50/40 px-2.5 py-2 text-left text-[11px] font-medium text-violet-700/80 transition-colors hover:border-violet-400/60 hover:bg-violet-100/60 hover:text-violet-900 disabled:pointer-events-none disabled:opacity-40 truncate dark:border-violet-800/40 dark:bg-violet-950/20 dark:text-violet-300"
                              title={`Add ${preset.label} dropdown (${preset.options!.length} options)`}
                            >
                              <span className="shrink-0">
                                <CheckSquare className="h-3.5 w-3.5" />
                              </span>
                              <span className="truncate">{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── Session Mapping Fields ──────────────────── */}
                      <div>
                        <div className="flex items-center justify-between px-1 mb-1.5 pt-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-teal-600/70">Session Fields</p>
                          <button
                            onClick={() => handleAddAllPresets(SESSION_MAPPING_FIELDS)}
                            disabled={!activeForm || activeForm.isLocked}
                            className="text-[9px] font-semibold text-teal-600 hover:text-teal-800 disabled:opacity-40 disabled:pointer-events-none px-1.5 py-0.5 rounded border border-teal-200 hover:border-teal-400 bg-teal-50 hover:bg-teal-100 transition-colors"
                          >+ Add All</button>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {SESSION_MAPPING_FIELDS.map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => handleAddPresetField(preset)}
                              disabled={!activeForm || activeForm.isLocked}
                              className="flex items-center gap-2 rounded-lg border border-teal-200/70 bg-teal-50/40 px-2.5 py-2 text-left text-[11px] font-medium text-teal-700/80 transition-colors hover:border-teal-400/60 hover:bg-teal-100/60 hover:text-teal-900 disabled:pointer-events-none disabled:opacity-40 truncate dark:border-teal-800/40 dark:bg-teal-950/20 dark:text-teal-300"
                              title={preset.helpText}
                            >
                              <span className="shrink-0 text-teal-500">
                                {preset.isHidden
                                  ? <EyeOff className="h-3.5 w-3.5" />
                                  : preset.type === 'number'
                                    ? <Hash className="h-3.5 w-3.5" />
                                    : <Type className="h-3.5 w-3.5" />}
                              </span>
                              <span className="truncate">{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── Member Mapping Fields ───────────────────── */}
                      <div>
                        <div className="flex items-center justify-between px-1 mb-1.5 pt-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-blue-600/70">Member Fields</p>
                          <button
                            onClick={() => handleAddAllPresets(MEMBER_MAPPING_FIELDS)}
                            disabled={!activeForm || activeForm.isLocked}
                            className="text-[9px] font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-40 disabled:pointer-events-none px-1.5 py-0.5 rounded border border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >+ Add All</button>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {MEMBER_MAPPING_FIELDS.map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => handleAddPresetField(preset)}
                              disabled={!activeForm || activeForm.isLocked}
                              className="flex items-center gap-2 rounded-lg border border-blue-200/70 bg-blue-50/40 px-2.5 py-2 text-left text-[11px] font-medium text-blue-700/80 transition-colors hover:border-blue-400/60 hover:bg-blue-100/60 hover:text-blue-900 disabled:pointer-events-none disabled:opacity-40 truncate dark:border-blue-800/40 dark:bg-blue-950/20 dark:text-blue-300"
                              title={preset.helpText}
                            >
                              <span className="shrink-0 text-blue-500">
                                {preset.isHidden
                                  ? <EyeOff className="h-3.5 w-3.5" />
                                  : preset.type === 'number'
                                    ? <Hash className="h-3.5 w-3.5" />
                                    : preset.type === 'email'
                                      ? <Mail className="h-3.5 w-3.5" />
                                      : preset.type === 'tel'
                                        ? <Phone className="h-3.5 w-3.5" />
                                        : <Type className="h-3.5 w-3.5" />}
                              </span>
                              <span className="truncate">{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
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
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className={`col-span-12 ${(mainTab === 'preview' || mainTab === 'settings' || !activeForm) ? 'lg:col-span-12' : 'lg:col-span-9'}`}>
            {!activeForm ? (
              /* ── No active form ─────────────────────────────────────── */
              forms.length > 0 ? (
              /* ── Workspace overview (forms exist) ───────────────────── */
              <div className="space-y-8">
                {/* Enhanced masthead */}
                <div className="anim-fade-in-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 border border-border/40 shadow-xl shadow-indigo-500/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5"></div>
                  <div className="relative px-8 py-10">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25">
                            <BarChart3 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                              Form Builder Dashboard
                            </h1>
                            <p className="text-slate-600 text-lg">Create, manage, and deploy beautiful forms with ease</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => setShowCsvImport(true)}
                          variant="outline"
                          className="rounded-xl border-2 border-dashed border-indigo-200/60 hover:border-indigo-300 hover:bg-indigo-50/50 text-indigo-700 font-semibold px-6 py-3 h-auto transition-all duration-200"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Import
                        </Button>
                        <Button
                          onClick={() => setShowTemplateDialog(true)}
                          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-3 font-semibold shadow-md shadow-indigo-500/20 transition-all duration-200"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Form
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced stats strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      Icon: FileCode,
                      label: 'Total Forms',
                      value: forms.length,
                      sub: 'in workspace',
                      gradient: 'from-blue-500 to-indigo-500',
                      bg: 'from-blue-500/10 to-indigo-500/5',
                      ring: 'ring-blue-500/20',
                      delay: 'delay-100',
                    },
                    {
                      Icon: Rocket,
                      label: 'Live',
                      value: forms.filter(f => !!f.deployedUrl).length,
                      sub: 'deployed',
                      gradient: 'from-emerald-500 to-teal-500',
                      bg: 'from-emerald-500/10 to-teal-500/5',
                      ring: 'ring-emerald-500/20',
                      delay: 'delay-200',
                    },
                    {
                      Icon: Layers,
                      label: 'Total Fields',
                      value: forms.reduce((a, f) => a + f.fields.length, 0),
                      sub: 'across all forms',
                      gradient: 'from-violet-500 to-purple-500',
                      bg: 'from-violet-500/10 to-purple-500/5',
                      ring: 'ring-violet-500/20',
                      delay: 'delay-300',
                    },
                    {
                      Icon: Webhook,
                      label: 'Integrations',
                      value: forms.filter(f => f.webhookConfig?.enabled || f.googleSheetsConfig?.enabled || !!(f.pixelConfig?.snapPixelId || f.pixelConfig?.metaPixelId || f.pixelConfig?.googleAdsId)).length,
                      sub: 'forms connected',
                      gradient: 'from-rose-500 to-pink-500',
                      bg: 'from-rose-500/10 to-pink-500/5',
                      ring: 'ring-rose-500/20',
                      delay: 'delay-400',
                    },
                  ].map((stat, index) => (
                    <div
                      key={stat.label}
                      className={`anim-fade-in-up ${stat.delay} group relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bg} border border-border/50 p-6 hover:shadow-lg hover:shadow-${stat.gradient.split(' ')[0]}/10 transition-all duration-300 hover:scale-[1.02] cursor-default`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                          <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.sub}</p>
                        </div>
                        <div className={`flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-md shadow-${stat.gradient.split(' ')[0]}/20 text-white group-hover:scale-110 transition-transform duration-200`}>
                          <stat.Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 h-20 w-20 rounded-full bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    </div>
                  ))}
                </div>

                {/* Forms section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Your Forms</h2>
                      <p className="text-sm text-muted-foreground">Manage and edit your form collection</p>
                    </div>
                    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-white p-0.5 shadow-sm">
                      <button onClick={() => setViewMode('grid')} className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Grid3X3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setViewMode('list')} className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                        <List className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className={`anim-fade-in-up delay-500 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}`}>
                    {forms.map((form, index) => (
                      <FormCard
                        key={form.id}
                        form={form}
                        isActive={false}
                        isSelected={selectedForms.has(form.id)}
                        viewMode={viewMode}
                        onSelect={() => { setActiveFormId(form.id); setSidebarTab('library'); }}
                        onToggleSelect={() => handleSelectForm(form.id)}
                        onCopy={() => handleCopyForm(form)}
                        onDelete={() => { setActiveFormId(form.id); setConfirmDeleteForm(true); }}
                      />
                    ))}
                    <button
                      onClick={() => setShowTemplateDialog(true)}
                      className={`anim-fade-in-up delay-600 ${viewMode === 'grid' ? 'min-h-[140px] rounded-2xl flex flex-col items-center justify-center gap-2' : 'h-14 rounded-xl flex items-center gap-2 px-4'} w-full border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-400 hover:text-indigo-500 transition-all duration-200 cursor-pointer`}
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-[12px] font-medium">New Form</span>
                    </button>
                  </div>
                </div>
              </div>
              ) : (
              /* ── Landing hero (0 forms exist) ────────────────────────── */
              <div className="relative overflow-hidden rounded-3xl border border-white/8 min-h-[620px] flex flex-col items-center justify-center py-24 px-6">
                {/* Enhanced animated background */}
                <div className="absolute inset-0 -z-10 rounded-3xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
                  <div className="anim-blob absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-600/20 blur-3xl" />
                  <div className="anim-blob delay-400 absolute top-20 -right-20 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-violet-500/25 to-purple-600/15 blur-3xl" />
                  <div className="anim-blob delay-200 absolute -bottom-20 left-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/15 blur-3xl" />
                  <div className="anim-blob delay-600 absolute bottom-10 right-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-rose-500/15 to-pink-500/10 blur-3xl" />
                  {/* Enhanced dot grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />
                  {/* Multiple radial glows */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(99,102,241,0.25),transparent)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(139,92,246,0.15),transparent)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_20%_70%,rgba(16,185,129,0.12),transparent)]" />
                </div>

                {/* Enhanced floating brand icon */}
                <div className="anim-fade-in-up mb-8 relative">
                  <div className="anim-float anim-glow-ring flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/50 ring-2 ring-white/25">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center ring-3 ring-slate-900 animate-bounce shadow-lg">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  {/* Additional sparkle effects */}
                  <div className="absolute -top-4 -left-4 h-2 w-2 rounded-full bg-blue-400 animate-ping opacity-75"></div>
                  <div className="absolute top-8 -right-6 h-1.5 w-1.5 rounded-full bg-violet-400 animate-ping opacity-60 delay-300"></div>
                  <div className="absolute -bottom-2 left-12 h-1 w-1 rounded-full bg-emerald-400 animate-ping opacity-80 delay-500"></div>
                </div>

                {/* Enhanced badge */}
                <div className="anim-fade-in-up delay-100 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white/80 text-xs font-bold uppercase tracking-[0.25em] px-5 py-2 mb-6 shadow-lg shadow-black/20">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 animate-pulse shadow-sm shadow-emerald-400/50" />
                  Professional Form Builder
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 animate-pulse shadow-sm shadow-blue-400/50 delay-200" />
                </div>

                {/* Enhanced headline */}
                <div className="anim-fade-in-up delay-200 text-center mb-6 max-w-2xl">
                  <h2 className="text-5xl md:text-[3.75rem] font-extrabold tracking-tight text-white leading-[1.05] mb-4">
                    Build Forms That
                    <span className="block anim-gradient-title bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                      Actually Convert.
                    </span>
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed max-w-lg mx-auto">
                    Stunning forms with smart integrations, multi-page layouts, advanced field logic,
                    and one-click Vercel deployment. Start building today.
                  </p>
                </div>

                {/* Enhanced feature pills */}
                <div className="anim-fade-in-up delay-300 flex flex-wrap items-center justify-center gap-3 mb-10">
                  {[
                    '20+ Field Types',
                    '1-Click Deploy',
                    'Real-time Preview',
                    'Webhooks & Analytics',
                    'Hero Images',
                    'Conditional Logic'
                  ].map((s, i) => (
                    <span key={s} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 backdrop-blur-sm text-white/70 text-xs font-medium px-4 py-1.5 hover:bg-white/12 hover:text-white/90 transition-all duration-200 hover:scale-105">
                      <span className={`h-1.5 w-1.5 rounded-full animate-pulse delay-${i * 100}`} style={{
                        background: `linear-gradient(45deg, ${['#60a5fa', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i]})`
                      }} />
                      {s}
                    </span>
                  ))}
                </div>

                {/* Enhanced CTA buttons */}
                <div className="anim-fade-in-up delay-400 flex flex-wrap items-center justify-center gap-4 mb-16">
                  <button
                    onClick={createForm}
                    className="anim-shimmer-btn group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white font-bold px-10 h-14 text-lg shadow-2xl shadow-indigo-500/40 border-0 hover:shadow-indigo-500/60 hover:scale-105 active:scale-[0.98] transition-all duration-200"
                  >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                    Create Your First Form
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                  </button>
                  <button
                    onClick={() => setShowTemplateDialog(true)}
                    className="group inline-flex items-center gap-3 rounded-2xl border-2 border-white/25 bg-white/10 backdrop-blur-md text-white/85 hover:bg-white/20 hover:text-white hover:border-white/40 font-semibold px-8 h-14 text-base transition-all duration-200 hover:scale-105 active:scale-[0.98] shadow-lg shadow-black/20"
                  >
                    <Layers className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    Browse Templates
                  </button>
                </div>

                {/* Enhanced feature cards */}
                <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      icon: <Webhook className="h-6 w-6 text-blue-300" />,
                      ring: 'ring-blue-500/30', bg: 'from-blue-500/15 to-blue-500/5',
                      title: 'Smart Integrations',
                      desc: 'Webhooks, Google Sheets, Snap & Meta Pixel tracking with real-time sync.',
                      delay: 'delay-500',
                      glow: 'shadow-blue-500/20',
                    },
                    {
                      icon: <Rocket className="h-6 w-6 text-emerald-300" />,
                      ring: 'ring-emerald-500/30', bg: 'from-emerald-500/15 to-emerald-500/5',
                      title: 'One-Click Deploy',
                      desc: 'Instant deployment to Vercel with custom domains. Live URL in seconds.',
                      delay: 'delay-600',
                      glow: 'shadow-emerald-500/20',
                    },
                    {
                      icon: <Layers className="h-6 w-6 text-violet-300" />,
                      ring: 'ring-violet-500/30', bg: 'from-violet-500/15 to-violet-500/5',
                      title: 'Rich Field Logic',
                      desc: '20+ field types, hero images, conditional logic & multi-page layouts.',
                      delay: 'delay-700',
                      glow: 'shadow-violet-500/20',
                    },
                  ].map(f => (
                    <div
                      key={f.title}
                      className={`anim-fade-in-up ${f.delay} group rounded-3xl ring-2 ${f.ring} bg-gradient-to-br ${f.bg} backdrop-blur-md p-6 hover:scale-[1.03] hover:shadow-2xl hover:${f.glow} transition-all duration-300 cursor-default border border-white/10`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/20 group-hover:bg-white/20 transition-colors duration-200">
                          {f.icon}
                        </div>
                        <span className="text-white/95 font-bold text-base group-hover:text-white transition-colors duration-200">{f.title}</span>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed group-hover:text-white/80 transition-colors duration-200">{f.desc}</p>
                      <div className="mt-4 h-1 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </div>
                  ))}
                </div>
              </div>
              ) /* closes forms.length > 0 ? ... : ... */
            ) : (
              <div className="space-y-5">
                {/* Form title bar */}
                <div className="flex items-center justify-between bg-white rounded-2xl border border-border/60 px-5 py-3.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/25">
                      <FileCode className="h-4.5 w-4.5 text-white h-4 w-4" />
                    </div>
                    <div>
                      <h1 className="text-[15px] font-bold tracking-tight text-slate-900 leading-tight">{activeForm.title}</h1>
                      <p className="text-[11px] text-muted-foreground">
                        {activeForm.fields.length} field{activeForm.fields.length !== 1 ? 's' : ''} &middot; Updated {new Date(activeForm.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleCopyForm(activeForm)}
                      className="h-8 text-[12px] text-muted-foreground hover:text-foreground hover:bg-slate-100 gap-1.5">
                      <Copy className="h-3.5 w-3.5" />Duplicate
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg"
                      onClick={() => setConfirmDeleteForm(true)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-5">
                  <TabsList className="inline-flex h-10 gap-0.5 bg-white border border-border/60 shadow-sm p-1 rounded-xl">
                    <TabsTrigger value="fields" className="rounded-lg h-8 px-4 text-[12.5px] font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/25 transition-all">
                      <Layers className="h-3.5 w-3.5 mr-1.5" />Fields
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="rounded-lg h-8 px-4 text-[12.5px] font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/25 transition-all">
                      <Eye className="h-3.5 w-3.5 mr-1.5" />Preview
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-lg h-8 px-4 text-[12.5px] font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/25 transition-all">
                      <Settings className="h-3.5 w-3.5 mr-1.5" />Settings
                    </TabsTrigger>
                    <TabsTrigger value="test" className="rounded-lg h-8 px-4 text-[12.5px] font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/25 transition-all">
                      <BarChart3 className="h-3.5 w-3.5 mr-1.5" />Test
                    </TabsTrigger>
                  </TabsList>

                <TabsContent value="fields">
                  <FormCanvas
                    form={activeForm}
                    isLocked={activeForm.isLocked}
                    onEdit={field => {
                      if (activeForm.isLocked) { toast.error('Form is locked. Unlock it to make changes.'); return; }
                      setEditingField(field);
                    }}
                    onDelete={fieldId => {
                      if (activeForm.isLocked) { toast.error('Form is locked. Unlock it to make changes.'); return; }
                      deleteField(activeForm.id, fieldId);
                      toast.success('Field deleted');
                    }}
                    onDuplicate={fieldId => {
                      if (activeForm.isLocked) { toast.error('Form is locked. Unlock it to make changes.'); return; }
                      duplicateField(activeForm.id, fieldId);
                      toast.success('Field duplicated');
                    }}
                    onAdd={type => {
                      if (activeForm.isLocked) { toast.error('Form is locked. Unlock it to make changes.'); return; }
                      addField(activeForm.id, type);
                    }}
                    onReorder={orderedIds => {
                      if (!activeForm.isLocked) reorderFields(activeForm.id, orderedIds);
                    }}
                  />
                </TabsContent>

                <TabsContent value="preview">
                  <FormPreview form={activeForm} />
                </TabsContent>

                <TabsContent value="settings">
                  <div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-slate-50 to-indigo-50/40">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 ring-1 ring-indigo-200/60">
                          <Settings className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-800">Form Settings</p>
                          <p className="text-[11px] text-muted-foreground">Layout, theme, integrations &amp; publishing</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-5">
                      <FormSettingsPanel
                        form={activeForm}
                        onUpdate={updates => updateForm(activeForm.id, updates)}
                        onCreateSheet={handleCreateSheet}
                        isCreatingSheet={creatingSheetsFor === activeForm.id}
                        onUpdateSheetStructure={handleUpdateSheetStructure}
                      />
                    </div>
                  </div>
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
        userTemplates={userTemplates}
        onImportCsv={() => { setShowTemplateDialog(false); setShowCsvImport(true); }}
        onDeleteTemplate={deleteTemplate}
      />

      {/* Confirm: delete single form */}
      <AlertDialog open={confirmDeleteForm} onOpenChange={setConfirmDeleteForm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{activeForm?.title}" and all its fields. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteFormWithConfirmation}
            >
              Delete Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Form as Template */}
      <AlertDialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Save Form as Template</AlertDialogTitle>
            <AlertDialogDescription>
              Save this form configuration for future use
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-sm font-medium">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Contact Form, Signup Form"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description" className="text-sm font-medium">Description (Optional)</Label>
              <Textarea
                id="template-description"
                placeholder="Describe what this template is for..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="w-full resize-none"
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveFormAsTemplate} className="bg-indigo-600 hover:bg-indigo-700">
              Save Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Form Generation */}
      <AlertDialog open={showAIChat} onOpenChange={setShowAIChat}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600" />
              AI Form Generator
            </AlertDialogTitle>
            <AlertDialogDescription>
              Describe your form and AI will generate fields automatically
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="form-description" className="text-sm font-medium">Form Description</Label>
              <Textarea
                id="form-description"
                placeholder="e.g., 'I need a form to collect customer feedback with their name, email, and message'"
                value={aiFormDescription}
                onChange={(e) => setAiFormDescription(e.target.value)}
                className="w-full resize-none"
                rows={4}
              />
            </div>
            <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-2">
              <strong>Tip:</strong> Mention field types you need like name, email, phone, date, message, file, etc.
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={generateFormFromDescription} className="bg-indigo-600 hover:bg-indigo-700">
              Generate Fields
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CsvImportDialog
        open={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        onSaveTemplates={handleCsvSaveTemplates}
        onCreateForms={handleCsvCreateForms}
      />
    </div>
  );
};

export default Index;
